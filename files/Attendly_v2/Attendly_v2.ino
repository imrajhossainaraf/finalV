/**
 * ============================================================
 *  ATTENDLY v2.0 — Smart RFID Attendance System
 *  Standalone ESP32 with Web Configuration Portal
 * ============================================================
 *  FEATURES:
 *    ✓ Built-in WiFi hotspot for configuration
 *    ✓ Web-based settings (WiFi, Server, Time, Device Name)
 *    ✓ Smart sync: Direct send if online, store if offline
 *    ✓ NTP time synchronization
 *    ✓ Persistent configuration (survives restarts)
 *    ✓ No data loss on restart
 * 
 *  HARDWARE: Same as v1.0 (ESP32 + MFRC522 + DS3231 + Buzzer)
 *  
 *  FIRST TIME SETUP:
 *    1. Upload this code to ESP32
 *    2. ESP32 will create WiFi hotspot: "Attendly-Config"
 *    3. Connect to it with your phone/laptop
 *    4. Browser will open automatically (or go to 192.168.4.1)
 *    5. Configure your settings and save
 *    6. System will restart and connect to your WiFi
 * ============================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <RTClib.h>
#include <SPIFFS.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <DNSServer.h>
#include "time.h"

// ============================================================
//  PIN DEFINITIONS
// ============================================================
#define SS_PIN     5
#define RST_PIN    4
#define BUZZER_PIN 2
#define BUTTON_PIN 32

// ============================================================
//  GLOBAL OBJECTS
// ============================================================
MFRC522 rfid(SS_PIN, RST_PIN);
RTC_DS3231 rtc;
Preferences prefs;
WebServer server(80);
DNSServer dnsServer;

// ============================================================
//  CONFIGURATION VARIABLES (Loaded from Preferences)
// ============================================================
String deviceName = "Attendly Device";
String wifiSSID = "";
String wifiPass = "";
String serverURL = "http://192.168.1.100:3001/api";
int syncDelay = 30;
bool configMode = false;

String deviceMAC = "";
const char* LOG_FILE = "/logs.txt";
unsigned long lastSync = 0;
const byte DNS_PORT = 53;

// NTP Server for time sync
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 21600;  // GMT+6 for Bangladesh (change as needed)
const int daylightOffset_sec = 0;

// ============================================================
//  BUZZER FUNCTIONS
// ============================================================
void beep(int ms = 100) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
}

void beepSuccess() {
  beep(150); delay(80); beep(150);
}

void beepError() {
  beep(800);
}

void beepConfig() {
  beep(100); delay(50); beep(100); delay(50); beep(100);
}

// ============================================================
//  TIME FUNCTIONS
// ============================================================
String getISO8601(DateTime dt) {
  char buf[25];
  sprintf(buf, "%04d-%02d-%02dT%02d:%02d:%02dZ",
          dt.year(), dt.month(), dt.day(),
          dt.hour(), dt.minute(), dt.second());
  return String(buf);
}

void syncTimeWithNTP() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  Serial.println("[NTP] Syncing time...");
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    rtc.adjust(DateTime(timeinfo.tm_year + 1900, timeinfo.tm_mon + 1, timeinfo.tm_mday,
                        timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec));
    Serial.println("[NTP] RTC updated successfully!");
    beep(50); delay(50); beep(50);
  } else {
    Serial.println("[NTP] Failed to get time");
  }
}

// ============================================================
//  PREFERENCES (PERSISTENT STORAGE)
// ============================================================
void loadConfig() {
  prefs.begin("attendly", false);
  
  deviceName = prefs.getString("deviceName", "Attendly Device");
  wifiSSID = prefs.getString("wifiSSID", "");
  wifiPass = prefs.getString("wifiPass", "");
  serverURL = prefs.getString("serverURL", "http://192.168.1.100:3001/api");
  syncDelay = prefs.getInt("syncDelay", 30);
  
  Serial.println("[Config] Loaded from storage:");
  Serial.println("  Device: " + deviceName);
  Serial.println("  WiFi: " + (wifiSSID.length() > 0 ? wifiSSID : "(not configured)"));
  Serial.println("  Server: " + serverURL);
  Serial.println("  Sync: " + String(syncDelay) + "s");
  
  prefs.end();
}

void saveConfig() {
  prefs.begin("attendly", false);
  
  prefs.putString("deviceName", deviceName);
  prefs.putString("wifiSSID", wifiSSID);
  prefs.putString("wifiPass", wifiPass);
  prefs.putString("serverURL", serverURL);
  prefs.putInt("syncDelay", syncDelay);
  
  prefs.end();
  Serial.println("[Config] Saved to storage");
}

// ============================================================
//  WEB SERVER - HTML PAGES
// ============================================================
const char* HTML_HEAD = R"(
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>Attendly Configuration</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      padding: 30px;
    }
    h1 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 600;
      font-size: 14px;
    }
    input, select {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    input:focus, select:focus {
      outline: none;
      border-color: #667eea;
    }
    .btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
    }
    .btn:active {
      transform: translateY(0);
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
      font-size: 14px;
      color: #555;
    }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 10px;
    }
    .status.online { background: #d4edda; color: #155724; }
    .status.offline { background: #f8d7da; color: #721c24; }
    .divider {
      height: 1px;
      background: #e0e0e0;
      margin: 25px 0;
    }
  </style>
</head>
<body>
<div class='container'>
)";

const char* HTML_FOOT = R"(
</div>
</body>
</html>
)";

void handleRoot() {
  String wifiStatus = WiFi.status() == WL_CONNECTED ? 
    "<span class='status online'>● Connected</span>" : 
    "<span class='status offline'>● Offline</span>";
  
  String html = String(HTML_HEAD);
  html += "<h1>⚡ Attendly</h1>";
  html += "<div class='subtitle'>Device: " + deviceMAC + wifiStatus + "</div>";
  
  html += "<div class='info-box'>";
  html += "📡 <strong>Current Status:</strong><br>";
  html += "WiFi: " + (wifiSSID.length() > 0 ? wifiSSID : "Not configured") + "<br>";
  html += "Server: " + serverURL + "<br>";
  html += "Sync: Every " + String(syncDelay) + " seconds";
  html += "</div>";
  
  html += "<form action='/save' method='POST'>";
  
  html += "<div class='form-group'>";
  html += "<label>🏷️ Device Name</label>";
  html += "<input type='text' name='deviceName' value='" + deviceName + "' placeholder='e.g., Main Gate Scanner'>";
  html += "</div>";
  
  html += "<div class='divider'></div>";
  
  html += "<div class='form-group'>";
  html += "<label>📶 WiFi Network</label>";
  html += "<input type='text' name='wifiSSID' value='" + wifiSSID + "' placeholder='Your WiFi SSID'>";
  html += "</div>";
  
  html += "<div class='form-group'>";
  html += "<label>🔐 WiFi Password</label>";
  html += "<input type='password' name='wifiPass' value='" + wifiPass + "' placeholder='Your WiFi Password'>";
  html += "</div>";
  
  html += "<div class='divider'></div>";
  
  html += "<div class='form-group'>";
  html += "<label>🌐 Server URL</label>";
  html += "<input type='text' name='serverURL' value='" + serverURL + "' placeholder='http://192.168.1.100:3001/api'>";
  html += "</div>";
  
  html += "<div class='form-group'>";
  html += "<label>⏱️ Sync Interval (seconds)</label>";
  html += "<input type='number' name='syncDelay' value='" + String(syncDelay) + "' min='10' max='600'>";
  html += "</div>";
  
  html += "<div class='divider'></div>";
  
  html += "<button type='submit' class='btn'>💾 Save & Restart</button>";
  html += "</form>";
  
  html += String(HTML_FOOT);
  server.send(200, "text/html", html);
}

void handleSave() {
  // Get all parameters
  if (server.hasArg("deviceName")) deviceName = server.arg("deviceName");
  if (server.hasArg("wifiSSID")) wifiSSID = server.arg("wifiSSID");
  if (server.hasArg("wifiPass")) wifiPass = server.arg("wifiPass");
  if (server.hasArg("serverURL")) serverURL = server.arg("serverURL");
  if (server.hasArg("syncDelay")) syncDelay = server.arg("syncDelay").toInt();
  
  // Save to preferences
  saveConfig();
  
  String html = String(HTML_HEAD);
  html += "<h1>✅ Settings Saved!</h1>";
  html += "<div class='info-box'>";
  html += "Configuration has been saved successfully.<br><br>";
  html += "The device will restart in 3 seconds to apply changes.<br><br>";
  html += "<strong>Note:</strong> If WiFi credentials are correct, the device will connect to your network. ";
  html += "The configuration portal will only be accessible if connection fails.";
  html += "</div>";
  html += "<script>setTimeout(function(){ window.location.href='/'; }, 15000);</script>";
  html += String(HTML_FOOT);
  
  server.send(200, "text/html", html);
  
  delay(3000);
  beepSuccess();
  ESP.restart();
}

void handleSetTime() {
  String html = String(HTML_HEAD);
  html += "<h1>🕐 Set Time</h1>";
  html += "<div class='info-box'>";
  
  DateTime now = rtc.now();
  html += "Current RTC Time: " + getISO8601(now);
  html += "</div>";
  
  html += "<form action='/savetime' method='POST'>";
  html += "<div class='form-group'>";
  html += "<label>Date (YYYY-MM-DD)</label>";
  html += "<input type='date' name='date' value='" + String(now.year()) + "-" + 
          (now.month() < 10 ? "0" : "") + String(now.month()) + "-" + 
          (now.day() < 10 ? "0" : "") + String(now.day()) + "'>";
  html += "</div>";
  
  html += "<div class='form-group'>";
  html += "<label>Time (HH:MM:SS)</label>";
  html += "<input type='time' name='time' value='" + 
          (now.hour() < 10 ? "0" : "") + String(now.hour()) + ":" + 
          (now.minute() < 10 ? "0" : "") + String(now.minute()) + "' step='1'>";
  html += "</div>";
  
  html += "<button type='submit' class='btn'>⏰ Set Time</button>";
  html += "</form>";
  
  html += "<div class='divider'></div>";
  
  html += "<form action='/syncntp' method='POST'>";
  html += "<button type='submit' class='btn' style='background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);'>🌐 Sync with Internet (NTP)</button>";
  html += "</form>";
  
  html += String(HTML_FOOT);
  server.send(200, "text/html", html);
}

void handleSaveTime() {
  String date = server.arg("date");  // YYYY-MM-DD
  String time = server.arg("time");  // HH:MM:SS
  
  int year = date.substring(0, 4).toInt();
  int month = date.substring(5, 7).toInt();
  int day = date.substring(8, 10).toInt();
  int hour = time.substring(0, 2).toInt();
  int minute = time.substring(3, 5).toInt();
  int second = time.length() > 5 ? time.substring(6, 8).toInt() : 0;
  
  rtc.adjust(DateTime(year, month, day, hour, minute, second));
  
  String html = String(HTML_HEAD);
  html += "<h1>✅ Time Updated!</h1>";
  html += "<div class='info-box'>";
  html += "RTC has been set to: " + date + " " + time;
  html += "</div>";
  html += "<script>setTimeout(function(){ window.location.href='/time'; }, 2000);</script>";
  html += String(HTML_FOOT);
  
  server.send(200, "text/html", html);
  beep(50); delay(50); beep(50);
}

void handleSyncNTP() {
  syncTimeWithNTP();
  
  String html = String(HTML_HEAD);
  html += "<h1>✅ NTP Sync Complete!</h1>";
  html += "<div class='info-box'>";
  html += "Time has been synchronized with internet time server.";
  html += "</div>";
  html += "<script>setTimeout(function(){ window.location.href='/time'; }, 2000);</script>";
  html += String(HTML_FOOT);
  
  server.send(200, "text/html", html);
}

// ============================================================
//  WIFI FUNCTIONS
// ============================================================
void startConfigPortal() {
  configMode = true;
  Serial.println("\n========================================");
  Serial.println("   CONFIGURATION MODE");
  Serial.println("========================================");
  
  WiFi.mode(WIFI_AP);
  WiFi.softAP("Attendly-Config", "12345678");
  
  IPAddress IP = WiFi.softAPIP();
  Serial.print("[AP] Hotspot started: Attendly-Config");
  Serial.println(" (password: 12345678)");
  Serial.print("[AP] IP address: ");
  Serial.println(IP);
  
  // Captive portal DNS
  dnsServer.start(DNS_PORT, "*", IP);
  
  server.on("/", handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.on("/time", handleSetTime);
  server.on("/savetime", HTTP_POST, handleSaveTime);
  server.on("/syncntp", HTTP_POST, handleSyncNTP);
  server.onNotFound(handleRoot);  // Redirect all to config page
  
  server.begin();
  Serial.println("[Web] Server started on port 80");
  Serial.println("========================================\n");
  
  beepConfig();
}

bool connectWiFi() {
  if (wifiSSID.length() == 0) {
    Serial.println("[WiFi] No SSID configured");
    return false;
  }
  
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(wifiSSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID.c_str(), wifiPass.c_str());
  
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(500);
    Serial.print(".");
    retry++;
  }
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());
    beepSuccess();
    return true;
  } else {
    Serial.println("[WiFi] Connection failed");
    beepError();
    return false;
  }
}

// ============================================================
//  DATA SYNC
// ============================================================
bool sendToServer(String uid, String timestamp) {
  if (WiFi.status() != WL_CONNECTED) return false;
  
  HTTPClient http;
  http.begin(serverURL + "/attendance");
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);
  
  DynamicJsonDocument doc(512);
  doc["mac"] = deviceMAC;
  doc["deviceName"] = deviceName;
  doc["uid"] = uid;
  doc["timestamp"] = timestamp;
  
  String payload;
  serializeJson(doc, payload);
  
  int code = http.POST(payload);
  http.end();
  
  return (code == 200 || code == 201);
}

void storeLocally(String uid, String timestamp) {
  File file = SPIFFS.open(LOG_FILE, FILE_APPEND);
  if (file) {
    file.println(uid + "," + timestamp);
    file.close();
    Serial.println("[Storage] Saved locally (offline)");
  } else {
    Serial.println("[Storage] ERROR: Failed to open log file!");
  }
}

void syncOfflineData() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!SPIFFS.exists(LOG_FILE)) return;
  
  File file = SPIFFS.open(LOG_FILE, FILE_READ);
  if (!file) return;
  
  Serial.println("[Sync] Uploading offline data...");
  
  DynamicJsonDocument doc(8192);
  doc["mac"] = deviceMAC;
  doc["deviceName"] = deviceName;
  JsonArray logs = doc.createNestedArray("logs");
  
  int count = 0;
  while (file.available()) {
    String line = file.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;
    
    int comma = line.indexOf(',');
    if (comma == -1) continue;
    
    JsonObject obj = logs.createNestedObject();
    obj["uid"] = line.substring(0, comma);
    obj["timestamp"] = line.substring(comma + 1);
    count++;
  }
  file.close();
  
  if (count == 0) {
    SPIFFS.remove(LOG_FILE);
    return;
  }
  
  Serial.print("[Sync] Uploading ");
  Serial.print(count);
  Serial.println(" offline records...");
  
  String payload;
  serializeJson(doc, payload);
  
  HTTPClient http;
  http.begin(serverURL + "/sync");
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);
  
  int code = http.POST(payload);
  
  if (code == 200 || code == 201) {
    SPIFFS.remove(LOG_FILE);
    Serial.println("[Sync] ✓ Offline data uploaded successfully!");
    beepSuccess();
  } else {
    Serial.print("[Sync] Failed with code: ");
    Serial.println(code);
  }
  http.end();
}

// ============================================================
//  SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(500);
  
  Serial.println("\n========================================");
  Serial.println("   Attendly v2.0 - Smart Attendance");
  Serial.println("========================================");
  
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Get MAC address
  WiFi.mode(WIFI_STA);
  deviceMAC = WiFi.macAddress();
  deviceMAC.replace(":", "");
  deviceMAC.toUpperCase();
  Serial.println("[Device] MAC: " + deviceMAC);
  
  // Load saved configuration
  loadConfig();
  
  // Initialize hardware
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("[RFID] Reader initialized");
  
  Wire.begin();
  if (!rtc.begin()) {
    Serial.println("[RTC] ERROR: Not found!");
    beepError();
  } else {
    Serial.println("[RTC] Clock ready");
  }
  
  if (!SPIFFS.begin(true)) {
    Serial.println("[SPIFFS] ERROR: Mount failed!");
    beepError();
  } else {
    Serial.println("[SPIFFS] Storage ready");
  }
  
  // Try to connect to WiFi
  bool connected = connectWiFi();
  
  if (!connected) {
    // Start config portal if WiFi fails
    startConfigPortal();
  } else {
    // Sync time with NTP on successful connection
    syncTimeWithNTP();
    
    // Upload any offline data
    syncOfflineData();
    
    Serial.println("\n[System] Ready! Waiting for RFID cards...");
    Serial.println("========================================\n");
  }
  
  beep(50);
}

// ============================================================
//  MAIN LOOP
// ============================================================
void loop() {
  
  // Handle web server in config mode
  if (configMode) {
    dnsServer.processNextRequest();
    server.handleClient();
    return;
  }
  
  // ── RFID SCANNING ──────────────────────────
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) uid += "0";
      uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    
    DateTime now = rtc.now();
    String timestamp = getISO8601(now);
    
    Serial.print("[RFID] UID: ");
    Serial.print(uid);
    Serial.print(" at ");
    Serial.println(timestamp);
    
    // SMART SYNC: Try to send immediately if online
    if (WiFi.status() == WL_CONNECTED) {
      if (sendToServer(uid, timestamp)) {
        Serial.println("[Sync] ✓ Sent to server immediately");
        beep(100);
      } else {
        Serial.println("[Sync] ✗ Send failed, storing locally");
        storeLocally(uid, timestamp);
        beepError();
      }
    } else {
      // No WiFi - store locally
      storeLocally(uid, timestamp);
      beep(100);
    }
    
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    delay(1500);  // Debounce
  }
  
  // ── PERIODIC OFFLINE SYNC ──────────────────
  if (millis() - lastSync > (unsigned long)(syncDelay * 1000)) {
    lastSync = millis();
    
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] Disconnected, attempting reconnect...");
      connectWiFi();
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      syncOfflineData();  // Upload any stored offline data
    }
  }
  
  // ── MANUAL SYNC BUTTON ─────────────────────
  if (digitalRead(BUTTON_PIN) == LOW) {
    Serial.println("[Button] Manual sync triggered!");
    beep(300);
    delay(500);
    
    if (WiFi.status() != WL_CONNECTED) connectWiFi();
    if (WiFi.status() == WL_CONNECTED) {
      syncOfflineData();
    }
    
    delay(2000);
  }
}
