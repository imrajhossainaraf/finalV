/**
 * ============================================================
 *  ATTENDLY — ESP32 RFID Attendance Firmware
 *  Version: 2.0.0
 * ============================================================
 *  HARDWARE REQUIRED:
 *    - ESP32 Dev Board (WROOM-32 or DevKitC)
 *    - MFRC522 RFID Reader (SPI)
 *    - DS3231 RTC Module (I2C)
 *    - Buzzer (passive or active, 3.3V)
 *    - Push Button (for manual Hotspot trigger and manual sync)
 *
 *  WIRING GUIDE:
 *  ─────────────────────────────────────────────
 *  MFRC522 → ESP32
 *    SDA  → GPIO 5  (SS_PIN)
 *    SCK  → GPIO 18
 *    MOSI → GPIO 23
 *    MISO → GPIO 19
 *    RST  → GPIO 4  (RST_PIN)
 *    3.3V → 3.3V
 *    GND  → GND
 *
 *  DS3231 → ESP32 (I2C)
 *    SDA  → GPIO 21
 *    SCL  → GPIO 22
 *    VCC  → 3.3V or 5V
 *    GND  → GND
 *
 *  Buzzer    → GPIO 2  (BUZZER_PIN)
 *  Button    → GPIO 32 (BUTTON_PIN) + GND
 *
 *  REQUIRED ARDUINO LIBRARIES (Install via Library Manager):
 *    - MFRC522 by GithubCommunity
 *    - RTClib by Adafruit
 *    - ArduinoJson by Benoit Blanchon
 *    - ESP32 Board package by Espressif
 *
 *  BOARD SETTINGS (Arduino IDE):
 *    Board   : "ESP32 Dev Module"
 *    Upload Speed: 921600
 *    Flash Size: "4MB (32Mb)"
 *    Partition Scheme: "Default 4MB with spiffs"
 * ============================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <RTClib.h>
#include <SPIFFS.h>
#include <ArduinoJson.h>

// ============================================================
//  PIN DEFINITIONS
// ============================================================
#define SS_PIN     5
#define RST_PIN    4
#define BUZZER_PIN 2
#define BUTTON_PIN 32

// ============================================================
//  INTERNAL STATE
// ============================================================
MFRC522 rfid(SS_PIN, RST_PIN);
RTC_DS3231 rtc;
Preferences preferences;
WebServer server(80);

bool AP_MODE = false;
String DEVICE_MAC = "";

// Configs loaded from memory
String configDeviceName = "Attendly_Scanner";
String configSSID = "";
String configPass = "";
String configUrl = "http://192.168.1.100:3001/api";
int syncDelay = 30;

const char* LOG_FILE  = "/logs.txt";
const char* TEMP_FILE = "/upload.tmp";
unsigned long lastSync = 0;

// ────────────────────────────────────────────
//  HTML CONFIG PORTAL
// ────────────────────────────────────────────
const char* INDEX_HTML PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Attendly Config</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 400px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        h2 { text-align: center; color: #2c3e50; margin-bottom: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: 500; font-size: 14px; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-size: 14px; transition: border-color 0.3s; }
        input:focus { border-color: #3498db; outline: none; }
        button { width: 100%; padding: 12px; background: #3498db; color: #fff; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.3s; margin-bottom: 10px; }
        button:hover { background: #2980b9; }
        .footer { text-align: center; margin-top: 15px; font-size: 12px; color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Attendly Configuration</h2>
        <form action="/save" method="POST">
            <div class="form-group">
                <label>Device Name</label>
                <input type="text" name="devicename" value="%DEVICENAME%" placeholder="E.g. Main Gate">
            </div>
            <div class="form-group">
                <label>WiFi SSID</label>
                <input type="text" name="ssid" value="%SSID%" placeholder="Your WiFi Network">
            </div>
            <div class="form-group">
                <label>WiFi Password</label>
                <input type="password" name="password" value="%PASSWORD%" placeholder="Network Password">
            </div>
            <div class="form-group">
                <label>Server URL</label>
                <input type="text" name="url" value="%URL%" placeholder="http://192.168.1.100:3001/api">
            </div>
            <div class="form-group">
                <label>Sync Delay (sec)</label>
                <input type="number" name="delay" value="%DELAY%" placeholder="30">
            </div>
            <input type="hidden" name="timestamp" id="timestamp" value="">
            <button type="submit">Save & Restart</button>
        </form>
        <div class="footer">ESP32 Captive Config Portal</div>
    </div>
    <script>
        // Provide standard UNIX timestamp to the ESP32 (to sync its clock without internet)
        document.getElementById('timestamp').value = Math.floor(Date.now() / 1000);
    </script>
</body>
</html>
)rawliteral";

void handleRoot() {
  String html = String(INDEX_HTML);
  html.replace("%DEVICENAME%", configDeviceName);
  html.replace("%SSID%", configSSID);
  html.replace("%PASSWORD%", configPass);
  html.replace("%URL%", configUrl);
  html.replace("%DELAY%", String(syncDelay));
  server.send(200, "text/html", html);
}

void handleSave() {
  if (server.hasArg("devicename")) configDeviceName = server.arg("devicename");
  if (server.hasArg("ssid")) configSSID = server.arg("ssid");
  if (server.hasArg("password")) configPass = server.arg("password");
  if (server.hasArg("url")) configUrl = server.arg("url");
  if (server.hasArg("delay")) syncDelay = server.arg("delay").toInt();
  
  if (server.hasArg("timestamp")) {
    long timestamp = server.arg("timestamp").toInt();
    if (timestamp > 0) {
      rtc.adjust(DateTime(timestamp));
    }
  }

  preferences.begin("attendly", false);
  preferences.putString("devicename", configDeviceName);
  preferences.putString("ssid", configSSID);
  preferences.putString("password", configPass);
  preferences.putString("url", configUrl);
  preferences.putInt("delay", syncDelay);
  preferences.end();
  
  String htmlMsg = "<html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><style>body{font-family:sans-serif;text-align:center;padding:50px;}</style></head><body><h2>Settings Saved!</h2><p>ESP32 will restart now.</p><p>Please reconnect your device to your standard Wi-Fi network.</p></body></html>";
  server.send(200, "text/html", htmlMsg);
  
  Serial.println("[Config] New settings saved. Restarting...");
  delay(2000);
  ESP.restart();
}

void startAPMode() {
  AP_MODE = true;
  WiFi.mode(WIFI_AP);
  WiFi.softAP("Attendly_Setup", "");  // Open Network (No Password)
  
  // Flash to let user know AP mode is open
  digitalWrite(BUZZER_PIN, HIGH); delay(500); digitalWrite(BUZZER_PIN, LOW);
  
  Serial.print("\n[AP] Hotspot active: Attendly_Setup");
  Serial.print("\n[AP] IP Address: ");
  Serial.println(WiFi.softAPIP());
  
  server.on("/", handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.begin();
  
  Serial.println("[AP] Web server started.");
}

void loadPreferences() {
  preferences.begin("attendly", false); // read-only mode = false means read/write is enabled
  configDeviceName = preferences.getString("devicename", "Attendly_Scanner");
  configSSID = preferences.getString("ssid", "");
  configPass = preferences.getString("password", "");
  configUrl = preferences.getString("url", "http://192.168.1.100:3001/api");
  syncDelay = preferences.getInt("delay", 30);
  preferences.end();
  
  Serial.println("[Prefs] Loaded Name: " + configDeviceName);
  Serial.println("[Prefs] Loaded SSID: " + configSSID);
  Serial.println("[Prefs] Loaded URL: " + configUrl);
}

// ────────────────────────────────────────────
//  BUZZER HELPERS
// ────────────────────────────────────────────
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

// ────────────────────────────────────────────
//  TIME FORMATTING
// ────────────────────────────────────────────
String getISO8601(DateTime dt) {
  char buf[25];
  sprintf(buf, "%04d-%02d-%02dT%02d:%02d:%02dZ",
          dt.year(), dt.month(), dt.day(),
          dt.hour(), dt.minute(), dt.second());
  return String(buf);
}

// ────────────────────────────────────────────
//  WIFI
// ────────────────────────────────────────────
bool connectWiFi() {
  if (configSSID.length() == 0) return false;
  
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(configSSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(configSSID.c_str(), configPass.c_str());

  int retry = 0;
  // wait ~15 seconds maximum
  while (WiFi.status() != WL_CONNECTED && retry < 30) {
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
    Serial.println("[WiFi] FAILED. Will retry implicitly.");
    beepError();
    return false;
  }
}

// ────────────────────────────────────────────
//  DATA SYNC TO SERVER
// ────────────────────────────────────────────
void syncData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Sync] WiFi not connected. Skipping.");
    return;
  }

  if (!SPIFFS.exists(LOG_FILE)) {
    Serial.println("[Sync] No logs to sync.");
    return;
  }

  SPIFFS.rename(LOG_FILE, TEMP_FILE);
  File file = SPIFFS.open(TEMP_FILE, FILE_READ);
  if (!file) {
    Serial.println("[Sync] Failed to open temp file.");
    return;
  }

  DynamicJsonDocument doc(8192);
  doc["mac"] = DEVICE_MAC;
  JsonArray logs = doc.createNestedArray("logs");

  int count = 0;
  while (file.available()) {
    String line = file.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;

    int comma = line.indexOf(',');
    if (comma == -1) continue;

    JsonObject obj = logs.createNestedObject();
    obj["uid"]  = line.substring(0, comma);
    obj["time"] = line.substring(comma + 1);
    count++;
  }
  file.close();

  if (count == 0) {
    SPIFFS.remove(TEMP_FILE);
    Serial.println("[Sync] No valid entries found.");
    return;
  }

  Serial.print("[Sync] Uploading ");
  Serial.print(count);
  Serial.println(" records...");

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  String fullUrl = configUrl;
  if (!fullUrl.endsWith("/sync")) {
      // Just in case user put base URL like :3001/api instead of /api/sync
      // Assume the handler at the server processes /sync
      fullUrl += "/sync";
  }
  http.begin(fullUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  int code = http.POST(payload);
  Serial.print("[Sync] Server response: ");
  Serial.println(code);

  if (code == 200 || code == 201) {
    SPIFFS.remove(TEMP_FILE);
    Serial.println("[Sync] SUCCESS. Logs cleared.");
    beepSuccess();
  } else {
    // Restore log file so we don't lose data
    SPIFFS.rename(TEMP_FILE, LOG_FILE);
    Serial.println("[Sync] FAILED. Logs preserved for next attempt.");
    beepError();
  }
  http.end();
}

// ────────────────────────────────────────────
//  SETUP
// ────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n========================================");
  Serial.println("   Attendly Attendance System v2.0 (AP)");
  Serial.println("========================================");

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  digitalWrite(BUZZER_PIN, LOW);

  // Load preferences from flash memory
  loadPreferences();

  // Get MAC
  WiFi.mode(WIFI_STA);
  DEVICE_MAC = WiFi.macAddress();
  DEVICE_MAC.replace(":", "");
  DEVICE_MAC.toUpperCase();
  Serial.println("[Device] MAC: " + DEVICE_MAC);

  // Initialize SPI & RFID
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("[RFID] Reader initialized.");

  // Initialize I2C & RTC
  Wire.begin();
  if (!rtc.begin()) {
    Serial.println("[RTC] ERROR: Module not found! Check wiring.");
    beepError();
  } else {
    Serial.println("[RTC] Clock ready.");
    if (rtc.lostPower()) {
      Serial.println("[RTC] RTC lost power, please configure time via Web Portal!");
    }
  }

  // Initialize SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("[SPIFFS] ERROR: Mount failed!");
    beepError();
  } else {
    Serial.println("[SPIFFS] Storage ready.");
  }

  // Boot Logic: If SSID is empty, force AP Mode automatically
  if (configSSID.length() == 0) {
    Serial.println("[System] No SSID configured. Entering AP Mode automatically.");
    startAPMode();
  } else {
    connectWiFi();
    Serial.println("[System] Ready! Waiting for RFID card...");
    Serial.println("[Help] HOLD button for 3 seconds to enter WiFi Config Portal.");
  }
  Serial.println("========================================\n");
}

// ────────────────────────────────────────────
//  MAIN LOOP
// ────────────────────────────────────────────
void loop() {

  // ── IF IN AP MODE: ONLY HANDLE WEB SERVER ─
  if (AP_MODE) {
    server.handleClient();
    return;  // Do not process RFID cards while configuring
  }

  // ── CHECK FOR LONG PRESS (MANUAL AP MODE) ─
  if (digitalRead(BUTTON_PIN) == LOW) {
    unsigned long pressStart = millis();
    bool isLongPress = false;
    
    while (digitalRead(BUTTON_PIN) == LOW) {
      if (millis() - pressStart > 3000) {  // 3 second hold
         isLongPress = true;
         beep(500); 
         startAPMode();
         break;
      }
      delay(50);
    }
    
    // If it was a short press (< 3 seconds), do a manual sync
    if (!isLongPress && !AP_MODE) {
      Serial.println("[Button] Manual sync triggered!");
      beep(300);
      if (WiFi.status() != WL_CONNECTED) connectWiFi();
      if (WiFi.status() == WL_CONNECTED) syncData();
    }
    // Wait until the button is released to avoid bouncing
    while(digitalRead(BUTTON_PIN) == LOW) { delay(10); } 
  }

  // ── RFID SCAN ─────────────────────────────
  if (!AP_MODE && rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) uid += "0";
      uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();

    DateTime now = rtc.now();
    String isoTime = getISO8601(now);

    Serial.print("[RFID] Card scanned — UID: ");
    Serial.print(uid);
    Serial.print(" at ");
    Serial.println(isoTime);

    File file = SPIFFS.open(LOG_FILE, FILE_APPEND);
    if (file) {
      file.println(uid + "," + isoTime);
      file.close();
      Serial.println("[RFID] Logged to SPIFFS.");
      beep(100);
    } else {
      Serial.println("[RFID] ERROR: Could not open log file!");
      beepError();
    }

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    delay(1500);
  }

  // ── PERIODIC AUTO-SYNC ────────────────────
  if (!AP_MODE && (millis() - lastSync > (unsigned long)(syncDelay * 1000))) {
    lastSync = millis();
    Serial.println("[Sync] Auto-sync triggered...");
    if (WiFi.status() == WL_CONNECTED || connectWiFi()) {
      syncData();
    }
  }
}