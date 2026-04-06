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

// ================= PIN =================
#define SS_PIN     5
#define RST_PIN    4
#define BUZZER_PIN 2
#define BUTTON_PIN 32   // HIGH when wires connected

// ================= OBJECTS =================
MFRC522 rfid(SS_PIN, RST_PIN);
RTC_DS3231 rtc;
Preferences preferences;
WebServer server(80);

// ================= STATE =================
bool AP_MODE = false;
bool isSyncing = false;

String DEVICE_MAC = "";
String configDeviceName = "Attendly_Scanner";
String configSSID = "";
String configPass = "";
String configUrl = "http://192.168.1.100:3001/api";
int syncDelay = 30;

const char* LOG_FILE  = "/logs.txt";
const char* TEMP_FILE = "/upload.tmp";
unsigned long lastSync = 0;

// ================= BUZZER =================
void beep(int ms = 100) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
}

void beepSuccess() {
  beep(100); delay(80); beep(100);
}

void beepError() {
  beep(600);
}

// ================= TIME =================
String getISO8601(DateTime dt) {
  char buf[25];
  sprintf(buf, "%04d-%02d-%02dT%02d:%02d:%02dZ",
          dt.year(), dt.month(), dt.day(),
          dt.hour(), dt.minute(), dt.second());
  return String(buf);
}

// ================= WIFI =================
bool connectWiFi() {
  if (configSSID.length() == 0) return false;

  WiFi.mode(WIFI_STA);
  WiFi.begin(configSSID.c_str(), configPass.c_str());

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(500);
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] Connected");
    beepSuccess();
    return true;
  } else {
    Serial.println("[WiFi] Failed");
    return false;
  }
}

// ================= SYNC =================
void syncData() {
  if (isSyncing) return;
  isSyncing = true;

  if (WiFi.status() != WL_CONNECTED) {
    isSyncing = false;
    return;
  }

  if (!SPIFFS.exists(LOG_FILE)) {
    isSyncing = false;
    return;
  }

  SPIFFS.rename(LOG_FILE, TEMP_FILE);
  File file = SPIFFS.open(TEMP_FILE, FILE_READ);
  if (!file) {
    isSyncing = false;
    return;
  }

  DynamicJsonDocument doc(8192);
  doc["mac"] = DEVICE_MAC;
  JsonArray logs = doc.createNestedArray("logs");

  int count = 0;
  while (file.available() && count < 100) {
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
    isSyncing = false;
    return;
  }

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  String url = configUrl;
  if (!url.endsWith("/sync")) url += "/sync";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int code = http.POST(payload);

  if (code == 200 || code == 201) {
    SPIFFS.remove(TEMP_FILE);
    Serial.println("[Sync] Success");
    beepSuccess();
  } else {
    // If failed, move TEMP back to LOG, or append if LOG recreated
    if (SPIFFS.exists(LOG_FILE)) {
       File temp = SPIFFS.open(TEMP_FILE, FILE_READ);
       File log = SPIFFS.open(LOG_FILE, FILE_APPEND);
       while(temp.available()) log.write(temp.read());
       temp.close(); log.close();
       SPIFFS.remove(TEMP_FILE);
    } else {
       SPIFFS.rename(TEMP_FILE, LOG_FILE);
    }
    Serial.println("[Sync] Failed");
    beepError();
  }

  http.end();
  isSyncing = false;
}

// ================= CONFIG PORTAL =================
void handleRoot() {
  server.send(200, "text/html", "<h2>Attendly Setup</h2>");
}

void handleSave() {
  if (server.hasArg("ssid")) configSSID = server.arg("ssid");
  if (server.hasArg("password")) configPass = server.arg("password");
  if (server.hasArg("url")) configUrl = server.arg("url");
  if (server.hasArg("delay")) syncDelay = server.arg("delay").toInt();

  preferences.begin("attendly", false);
  preferences.putString("ssid", configSSID);
  preferences.putString("password", configPass);
  preferences.putString("url", configUrl);
  preferences.putInt("delay", syncDelay);
  preferences.end();

  server.send(200, "text/plain", "Saved. Restarting...");
  delay(1000);
  ESP.restart();
}

void startAPMode() {
  if (AP_MODE) return;

  AP_MODE = true;
  WiFi.mode(WIFI_AP);
  WiFi.softAP("Attendly_Setup", "");

  Serial.println("[AP] Started");
  beep(400);

  server.on("/", handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.begin();
}

// ================= SWITCH =================
void handleConfigSwitch() {
  static bool lastState = false;
  bool currentState = digitalRead(BUTTON_PIN) == HIGH;

  if (currentState && !lastState) {
    Serial.println("[Switch] CONFIG ON");
    startAPMode();
  }

  if (!currentState && lastState) {
    Serial.println("[Switch] CONFIG OFF → Restart");
    delay(1000);
    ESP.restart();
  }

  lastState = currentState;
}

// ================= PREFS =================
void loadPreferences() {
  preferences.begin("attendly", false);
  configSSID = preferences.getString("ssid", "");
  configPass = preferences.getString("password", "");
  configUrl = preferences.getString("url", "http://192.168.1.100:3001/api");
  syncDelay = preferences.getInt("delay", 30);
  preferences.end();
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT);

  loadPreferences();

  WiFi.mode(WIFI_STA);
  DEVICE_MAC = WiFi.macAddress();
  DEVICE_MAC.replace(":", "");
  DEVICE_MAC.toUpperCase();

  SPI.begin();
  rfid.PCD_Init();

  Wire.begin();
  rtc.begin();

  SPIFFS.begin(true);

  connectWiFi();

  Serial.println("[System] Ready");
}

// ================= LOOP =================
void loop() {

  handleConfigSwitch();

  if (AP_MODE) {
    server.handleClient();
    return;
  }

  // ===== RFID FAST SCAN =====
  if (!isSyncing && rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {

    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) uid += "0";
      uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();

    DateTime now = rtc.now();
    String isoTime = getISO8601(now);

    File file = SPIFFS.open(LOG_FILE, FILE_APPEND);
    if (file) {
      file.println(uid + "," + isoTime);
      file.close();
      beep(60);  // ⚡ instant feedback
    } else {
      beepError();
    }

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }

  // ===== AUTO SYNC =====
  if (millis() - lastSync > (unsigned long)(syncDelay * 1000)) {
    lastSync = millis();

    if (WiFi.status() == WL_CONNECTED || connectWiFi()) {
      syncData();
    }
  }
}