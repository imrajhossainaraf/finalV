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

/**
 * ============================================================
 *  ATTENDLY FIRMWARE v2.2 (Production Ready)
 *  Features: Physical Config Switch, Offline Queue, RTC
 * ============================================================
 */

// ================= PIN =================
#define SS_PIN     5
#define RST_PIN    4
#define BUZZER_PIN 2
#define BUTTON_PIN 32   // HIGH = Config Mode, LOW = Card Mode

// ================= OBJECTS =================
MFRC522 rfid(SS_PIN, RST_PIN);
RTC_DS3231 rtc;
Preferences preferences;
WebServer server(80);

// ================= STATE =================
bool AP_MODE = false;
String DEVICE_MAC = "";
String configDeviceName = "Attendly_Scanner";
String configSSID = "";
String configPass = "";
String configUrl = "http://192.168.0.111:3001/api"; 
unsigned long lastSyncCheck = 0;
const unsigned long SYNC_INTERVAL = 30000; 

// ================= BUZZER =================
void beep(int ms = 100) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
}
void beepSuccess() { beep(100); delay(50); beep(100); }
void beepSavedLocal() { beep(50); } 
void beepError() { beep(600); }

// ================= TIME =================
String getISO8601(DateTime dt) {
  char buf[25];
  sprintf(buf, "%04d-%02d-%02dT%02d:%02d:%02dZ",
          dt.year(), dt.month(), dt.day(),
          dt.hour(), dt.minute(), dt.second());
  return String(buf);
}

// ================= SPIFFS QUEUE MANAGEMENT =================
void saveToQueue(String uid, String timestamp) {
  DynamicJsonDocument doc(4096);
  File file = SPIFFS.open("/queue.json", FILE_READ);
  if (file) {
    deserializeJson(doc, file);
    file.close();
  } else {
    doc.to<JsonArray>();
  }

  JsonArray logs = doc.as<JsonArray>();
  JsonObject log = logs.createNestedObject();
  log["uid"] = uid;
  log["timestamp"] = timestamp;

  file = SPIFFS.open("/queue.json", FILE_WRITE);
  serializeJson(doc, file);
  file.close();
  Serial.printf("[SPIFFS] Saved: %s at %s\n", uid.c_str(), timestamp.c_str());
}

void syncLocalData() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!SPIFFS.exists("/queue.json")) return;

  File file = SPIFFS.open("/queue.json", FILE_READ);
  DynamicJsonDocument doc(8192);
  DeserializationError error = deserializeJson(doc, file);
  file.close();

  if (error || doc.as<JsonArray>().size() == 0) {
    SPIFFS.remove("/queue.json");
    return;
  }

  JsonArray logs = doc.as<JsonArray>();
  Serial.printf("[Sync] Attempting to sync %d records...\n", logs.size());

  DynamicJsonDocument payloadDoc(10240);
  payloadDoc["mac"] = DEVICE_MAC;
  payloadDoc["deviceName"] = configDeviceName;
  payloadDoc["logs"] = logs;

  String payload;
  serializeJson(payloadDoc, payload);

  HTTPClient http;
  String url = configUrl;
  if (!url.endsWith("/sync")) {
    if (url.endsWith("/")) url += "sync";
    else url += "/sync";
  }
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(payload);

  if (code >= 200 && code < 300) {
    Serial.println("[Sync] Success! Clearing queue.");
    SPIFFS.remove("/queue.json");
    beepSuccess();
  } else {
    Serial.printf("[Sync] Failed (Code %d). Keeping queue.\n", code);
  }
  http.end();
}

// ================= REAL-TIME POST =================
void postRealTime(String uid, String timestamp) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi Down. Record stays in queue.");
    return;
  }

  DynamicJsonDocument doc(512);
  doc["mac"] = DEVICE_MAC;
  doc["deviceName"] = configDeviceName;
  doc["uid"] = uid;
  doc["timestamp"] = timestamp;

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  String url = configUrl;
  if (!url.endsWith("/attendance")) {
    if (url.endsWith("/")) url += "attendance";
    else url += "/attendance";
  }

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(3000);
  int code = http.POST(payload);

  if (code >= 200 && code < 300) {
    Serial.println("[HTTP] Real-time success!");
    beepSuccess();
  } else {
    Serial.printf("[HTTP] Real-time failed (%d). Record queued.\n", code);
  }
  http.end();
}

// ================= CONFIG PORTAL =================
void handleRoot() {
  String html = "<html><head><meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>body{font-family:sans-serif;padding:20px;background:#f4f7f6;} .card{background:white;padding:20px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);} input{width:100%;padding:10px;margin:10px 0;border:1px solid #ddd;border-radius:5px;} button{width:100%;padding:12px;background:#3498db;color:#fff;border:none;border-radius:5px;font-weight:bold;}</style>";
  html += "</head><body><div class='card'>";
  html += "<h2>Attendly Config</h2><p>MAC: " + DEVICE_MAC + "</p><form action='/save' method='POST'>";
  html += "Device Name:<br><input type='text' name='name' value='" + configDeviceName + "'>";
  html += "WiFi SSID:<br><input type='text' name='ssid' value='" + configSSID + "'>";
  html += "WiFi Pass:<br><input type='password' name='password' value=''>";
  html += "Server URL (include /api):<br><input type='text' name='url' value='" + configUrl + "'>";
  html += "<button type='submit'>Save & Restart</button></form></div></body></html>";
  server.send(200, "text/html", html);
}

void handleSave() {
  if (server.hasArg("name")) configDeviceName = server.arg("name");
  if (server.hasArg("ssid")) configSSID = server.arg("ssid");
  
  // Only update password if a new one is provided
  if (server.hasArg("password") && server.arg("password").length() > 0) {
    configPass = server.arg("password");
  }
  
  if (server.hasArg("url")) configUrl = server.arg("url");

  preferences.begin("attendly", false);
  preferences.putString("name", configDeviceName);
  preferences.putString("ssid", configSSID);
  preferences.putString("password", configPass);
  preferences.putString("url", configUrl);
  preferences.end();

  server.send(200, "text/plain", "Settings Saved. Please switch button to LOW to use.");
  delay(1000);
}

void startAPMode() {
  if (AP_MODE) return;
  AP_MODE = true;
  WiFi.mode(WIFI_AP);
  WiFi.softAP("Attendly_Setup", "");
  Serial.println("[AP] Mode Active: 192.168.4.1");
  beep(400); delay(100); beep(400);
  server.on("/", handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.begin();
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLDOWN);

  if (!SPIFFS.begin(true)) Serial.println("[SPIFFS] Mount Failed");

  preferences.begin("attendly", false);
  configDeviceName = preferences.getString("name", "Attendly_Scanner");
  configSSID = preferences.getString("ssid", "ImrajHossainAraf");
  configPass = preferences.getString("password", "123123123");
  configUrl = preferences.getString("url", "http://192.168.0.111:3001/api");
  preferences.end();

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  DEVICE_MAC = WiFi.macAddress();
  DEVICE_MAC.replace(":", "");
  Serial.print("[System] MAC: "); Serial.println(DEVICE_MAC);

  SPI.begin();
  rfid.PCD_Init();

  Wire.begin();
  if (rtc.begin()) Serial.println("[RTC] Initialized");
  else beepError();

  // Only try connecting WiFi if not in Config Mode
  if (digitalRead(BUTTON_PIN) == LOW && configSSID != "") {
    WiFi.begin(configSSID.c_str(), configPass.c_str());
    Serial.print("[WiFi] Connecting to "); Serial.println(configSSID);
    
    // Wait for connection (max 10 seconds)
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n[WiFi] Connected!");
      Serial.print("[WiFi] IP: "); Serial.println(WiFi.localIP());
      beepSuccess();
    } else {
      Serial.println("\n[WiFi] Connection Failed (Timeout)");
    }
  }
}

// ================= LOOP =================
void loop() {
  // Check Button State
  bool buttonState = digitalRead(BUTTON_PIN) == HIGH;

  if (buttonState) {
    // ENTER CONFIG MODE
    if (!AP_MODE) startAPMode();
    server.handleClient();
    return; // Stop card entry mode while in config
  } else {
    // EXIT CONFIG MODE (if we were in it)
    if (AP_MODE) {
      Serial.println("[System] Exiting Config Mode... Restarting");
      delay(500);
      ESP.restart();
    }
  }

  // Periodic Sync (Only if WiFi connected)
  if (WiFi.status() == WL_CONNECTED && millis() - lastSyncCheck > SYNC_INTERVAL) {
    lastSyncCheck = millis();
    syncLocalData();
  }

  // RFID Scan
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) uid += "0";
      uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();

    static String lastUID = "";
    static unsigned long lastScanTime = 0;
    if (uid == lastUID && millis() - lastScanTime < 3000) {
      rfid.PICC_HaltA(); rfid.PCD_StopCrypto1(); return;
    }
    lastUID = uid; lastScanTime = millis();

    DateTime now = rtc.now();
    String timestamp = getISO8601(now);

    beepSavedLocal();
    saveToQueue(uid, timestamp);
    postRealTime(uid, timestamp); 

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }
}
