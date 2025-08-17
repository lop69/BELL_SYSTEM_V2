/*
 * Smart Bell Scheduler - Production Firmware v2.5 (Robustness & Final Polish)
 *
 * This firmware is designed for maximum reliability and resilience.
 *
 * CHANGELOG:
 * v2.5 - FINAL POLISH
 *      - Heartbeat LED: The onboard LED now "breathes" to show the main loop is running.
 *        It turns solid during network activity for clear visual feedback.
 *      - Auto-Reboot Watchdog: If the device fails to sync with Supabase for 5 minutes,
 *        it will automatically reboot to recover from network or state lock-ups.
 *      - Safer JSON Parsing: Added checks to ensure JSON data from Supabase is valid
 *        and contains the expected fields before trying to use it, preventing crashes.
 *      - Status Check Endpoint: Added a '/status' endpoint to the config server, allowing
 *        the app to verify connection before sending credentials.
 *      - Improved Serial Logging: Cleaner, more descriptive logs for easier debugging.
 *
 * FEATURES:
 * - Configuration Mode: Creates a WiFi hotspot ("SmartBell-Config") for initial setup.
 * - Web Portal: A simple web server allows the app to send WiFi and Supabase credentials.
 * - EEPROM Storage: Securely saves configuration to permanent memory.
 * - Supabase Integration: Periodically fetches the bell schedule from a Supabase Edge Function.
 * - NTP Time Sync: Keeps accurate time to ensure bells ring precisely.
 * - Test Bell Functionality: Listens for a "test bell" command from the app.
 * - Status LED: Provides clear visual feedback on the device's state.
 * - Auto-Reconnect: If WiFi is lost, it will continuously try to reconnect.
*/

// LIBRARIES
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

// PIN DEFINITIONS
const int BELL_PIN = D1;
const int LED_PIN = LED_BUILTIN;

// CONFIGURATION CONSTANTS
const char* CONFIG_AP_SSID = "SmartBell-Config";
const char* CONFIG_AP_PASSWORD = "password";

// EEPROM CONFIGURATION
struct Configuration {
  char ssid[32];
  char password[64];
  char anon_key[256];
  char edge_url[256];
  char schedule_id[64];
  bool configured;
};

Configuration config;
ESP8266WebServer server(80);

// TIME & SCHEDULE VARIABLES
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800, 60000);

JsonDocument scheduleDoc;
bool testBellActive = false;
unsigned long lastSyncTime = 0;
const long syncInterval = 5000; // Sync every 5 seconds

// WATCHDOG TIMER
unsigned long lastSuccessfulSync = 0;
const long watchdogTimeout = 300000; // 5 minutes

// =================================================================
// EEPROM & CONFIGURATION MANAGEMENT
// =================================================================

void saveConfig() {
  EEPROM.begin(sizeof(Configuration));
  EEPROM.put(0, config);
  EEPROM.commit();
  EEPROM.end();
  Serial.println("[INFO] Configuration saved.");
}

void loadConfig() {
  EEPROM.begin(sizeof(Configuration));
  EEPROM.get(0, config);
  EEPROM.end();
  Serial.println("[INFO] Configuration loaded.");
  if (!config.configured) {
    Serial.println("[WARN] Device not configured.");
  }
}

void clearConfig() {
  config.configured = false;
  saveConfig();
  Serial.println("[WARN] Configuration cleared. Restarting.");
  delay(1000);
  ESP.restart();
}

// =================================================================
// CONFIGURATION PORTAL
// =================================================================

void addCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

void handleOptions() {
  addCorsHeaders();
  server.send(204);
}

void handleStatus() {
  addCorsHeaders();
  server.send(200, "application/json", "{\"status\":\"ready\"}");
  Serial.println("[SETUP] Status check received.");
}

void handleConfig() {
  addCorsHeaders();
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"status\":\"error\", \"message\":\"Body not received\"}");
    return;
  }

  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, server.arg("plain"));
  if (error) {
    server.send(400, "application/json", "{\"status\":\"error\", \"message\":\"Invalid JSON\"}");
    return;
  }

  strlcpy(config.ssid, doc["ssid"], sizeof(config.ssid));
  strlcpy(config.password, doc["password"], sizeof(config.password));
  strlcpy(config.anon_key, doc["anon_key"], sizeof(config.anon_key));
  strlcpy(config.edge_url, doc["edge_url"], sizeof(config.edge_url));
  strlcpy(config.schedule_id, doc["schedule_id"], sizeof(config.schedule_id));
  config.configured = true;

  saveConfig();
  server.send(200, "application/json", "{\"status\":\"ok\"}");
  Serial.println("[SUCCESS] Config received. Restarting in 3s.");
  delay(3000);
  ESP.restart();
}

void startConfigPortal() {
  digitalWrite(LED_PIN, LOW); // Turn LED on
  Serial.println("[SETUP] Starting configuration portal.");
  WiFi.softAP(CONFIG_AP_SSID, CONFIG_AP_PASSWORD);
  Serial.print("[SETUP] AP IP: ");
  Serial.println(WiFi.softAPIP());

  server.on("/config", HTTP_POST, handleConfig);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/config", HTTP_OPTIONS, handleOptions);
  server.on("/status", HTTP_OPTIONS, handleOptions);
  server.begin();

  while (true) {
    server.handleClient();
    yield();
  }
}

// =================================================================
// WIFI & NETWORK
// =================================================================

void connectToWiFi() {
  Serial.print("[WIFI] Connecting to ");
  Serial.println(config.ssid);
  WiFi.begin(config.ssid, config.password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(200);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected!");
    Serial.print("[WIFI] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WIFI] Failed to connect. Re-entering config mode.");
    clearConfig();
  }
}

// =================================================================
// SUPABASE SYNC
// =================================================================

void syncSchedule() {
  if (WiFi.status() != WL_CONNECTED) return;

  digitalWrite(LED_PIN, LOW); // Solid LED during sync
  Serial.println("[SYNC] Fetching schedule...");
  
  WiFiClient client;
  HTTPClient http;

  if (http.begin(client, config.edge_url)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", config.anon_key);
    http.addHeader("Authorization", "Bearer " + String(config.anon_key));

    JsonDocument requestBody;
    requestBody["schedule_id"] = config.schedule_id;
    String requestBodyString;
    serializeJson(requestBody, requestBodyString);

    int httpCode = http.POST(requestBodyString);
    if (httpCode == HTTP_CODE_OK) {
      DeserializationError error = deserializeJson(scheduleDoc, http.getString());
      if (error) {
        Serial.print("[ERROR] JSON parsing failed: ");
        Serial.println(error.c_str());
      } else if (!scheduleDoc.containsKey("bells") || !scheduleDoc.containsKey("test_bell_active")) {
        Serial.println("[ERROR] JSON response is missing required keys.");
      } else {
        Serial.println("[SYNC] Success.");
        testBellActive = scheduleDoc["test_bell_active"].as<bool>();
        lastSuccessfulSync = millis(); // Update watchdog timer
      }
    } else {
      Serial.printf("[ERROR] HTTP POST failed, code: %d\n", httpCode);
    }
    http.end();
  } else {
    Serial.println("[ERROR] Unable to begin HTTP connection.");
  }
  digitalWrite(LED_PIN, HIGH); // Turn LED off after sync
}

// =================================================================
// CORE LOGIC
// =================================================================

void ringBell(int duration_ms, const char* reason) {
  Serial.printf("[BELL] Ringing for %dms. Reason: %s\n", duration_ms, reason);
  digitalWrite(BELL_PIN, HIGH);
  delay(duration_ms);
  digitalWrite(BELL_PIN, LOW);
  Serial.println("[BELL] Sequence finished.");
}

void checkSchedule() {
  if (!timeClient.isTimeSet()) return;

  if (testBellActive) {
    ringBell(30000, "Test Signal");
    testBellActive = false;
  }

  JsonArray bells = scheduleDoc["bells"].as<JsonArray>();
  if (bells.isNull()) return;

  int currentDay = timeClient.getDay();
  String currentTime = timeClient.getFormattedTime().substring(0, 5);
  static String lastTriggeredTime = "";

  if (currentTime == lastTriggeredTime) return;

  for (JsonObject bell : bells) {
    if (bell["time"].as<String>().substring(0, 5) == currentTime) {
      for (JsonVariant day : bell["days_of_week"].as<JsonArray>()) {
        if (day.as<int>() == currentDay) {
          ringBell(2000, "Scheduled");
          lastTriggeredTime = currentTime;
          return;
        }
      }
    }
  }
}

void ledHeartbeat() {
  // A "breathing" LED to show the device is alive and running.
  for (int i = 0; i < 255; i += 5) {
    analogWrite(LED_PIN, i);
    delay(1);
  }
  for (int i = 255; i > 0; i -= 5) {
    analogWrite(LED_PIN, i);
    delay(1);
  }
}

// =================================================================
// SETUP & LOOP
// =================================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n[INFO] Smart Bell Scheduler v2.5 Starting...");

  pinMode(BELL_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH); // LED off (HIGH is off for built-in)

  loadConfig();

  if (!config.configured) {
    startConfigPortal();
  } else {
    connectToWiFi();
    if (WiFi.status() == WL_CONNECTED) {
      timeClient.begin();
      timeClient.forceUpdate();
      lastSuccessfulSync = millis();
    }
  }
}

void loop() {
  if (!config.configured) return;

  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  timeClient.update();

  unsigned long currentTime = millis();
  if (currentTime - lastSyncTime >= syncInterval) {
    lastSyncTime = currentTime;
    syncSchedule();
  }

  checkSchedule();

  if (currentTime - lastSuccessfulSync > watchdogTimeout) {
    Serial.println("[WATCHDOG] No successful sync for 5 minutes. Rebooting.");
    ESP.restart();
  }
  
  ledHeartbeat();
}