/*
 * Smart Bell Scheduler - Production Firmware v2.4 (Performance & Test Bell)
 *
 * This firmware works with the Dyad-generated web application to create a configurable,
 * network-connected bell system.
 *
 * CHANGELOG:
 * v2.4 - Reduced communication delay: Sync interval with Supabase lowered to 5 seconds.
 *      - Implemented a dedicated 30-second ring duration for the Test Bell feature.
 *      - Separated regular bell ring logic (2 seconds) from test bell logic.
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
 *
 * REQUIRED LIBRARIES (Install via Arduino IDE Library Manager):
 * 1. ArduinoJson (by Benoit Blanchon)
 * 2. NTPClient (by Fabrice Weinberg)
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
const int BELL_PIN = D1; // Relay is connected to pin D1
const int LED_PIN = LED_BUILTIN; // Onboard blue LED

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
  bool configured; // A flag to check if the device has been configured
};

Configuration config;
ESP8266WebServer server(80);

// TIME & SCHEDULE VARIABLES
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800, 60000); // IST is UTC +5:30 (19800 seconds)

JsonDocument scheduleDoc; // Holds the bell schedule fetched from Supabase
bool testBellActive = false;
unsigned long lastSyncTime = 0;
const long syncInterval = 5000; // Sync with Supabase every 5 seconds for high responsiveness

// =================================================================
// EEPROM & CONFIGURATION MANAGEMENT
// =================================================================

void saveConfig() {
  EEPROM.begin(sizeof(Configuration));
  EEPROM.put(0, config);
  EEPROM.commit();
  EEPROM.end();
  Serial.println("[INFO] Configuration saved to EEPROM.");
}

void loadConfig() {
  EEPROM.begin(sizeof(Configuration));
  EEPROM.get(0, config);
  EEPROM.end();
  Serial.println("[INFO] Configuration loaded from EEPROM.");
  if (config.configured) {
    Serial.println("[INFO] Device is configured.");
  } else {
    Serial.println("[WARN] Device is not configured. Starting config portal.");
  }
}

void clearConfig() {
  config.configured = false;
  saveConfig();
  Serial.println("[WARN] Configuration cleared. Restarting device.");
  delay(1000);
  ESP.restart();
}

// =================================================================
// INITIAL SETUP & CONFIGURATION PORTAL
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

void handleConfig() {
  addCorsHeaders();
  if (server.hasArg("plain") == false) {
    server.send(400, "text/plain", "Body not received");
    return;
  }

  String body = server.arg("plain");
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, body);

  if (error) {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.c_str());
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
  Serial.println("[SUCCESS] Configuration received and saved. Restarting in 3 seconds...");
  delay(3000);
  ESP.restart();
}

void startConfigPortal() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("[SETUP] Starting configuration server.");
  WiFi.softAP(CONFIG_AP_SSID, CONFIG_AP_PASSWORD);
  IPAddress apIP = WiFi.softAPIP();
  Serial.print("[SETUP] AP IP address: ");
  Serial.println(apIP);

  server.on("/config", HTTP_POST, handleConfig);
  server.on("/config", HTTP_OPTIONS, handleOptions);
  server.begin();

  Serial.println("[SETUP] Connect to WiFi 'SmartBell-Config' (password: 'password')");

  while (true) {
    server.handleClient();
    yield();
  }
}

// =================================================================
// WIFI & NETWORK OPERATIONS
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
    Serial.print("[WIFI] IP address: ");
    Serial.println(WiFi.localIP());
    digitalWrite(LED_PIN, HIGH);
  } else {
    Serial.println("\n[WIFI] Failed to connect. Entering config mode.");
    clearConfig();
  }
}

// =================================================================
// SUPABASE & SCHEDULE SYNC
// =================================================================

void syncSchedule() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  Serial.println("[SYNC] Fetching schedule from Supabase...");
  
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

    if (httpCode > 0) {
      String payload = http.getString();
      if (httpCode == HTTP_CODE_OK) {
        DeserializationError error = deserializeJson(scheduleDoc, payload);
        if (error) {
          Serial.print("[ERROR] Failed to parse schedule JSON: ");
          Serial.println(error.c_str());
        } else {
          Serial.println("[SYNC] Schedule updated successfully.");
          testBellActive = scheduleDoc["test_bell_active"].as<bool>();
        }
      } else {
        Serial.print("[ERROR] HTTP request failed with code: ");
        Serial.println(httpCode);
        Serial.println(payload);
      }
    } else {
      Serial.printf("[ERROR] HTTP POST failed, error: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[ERROR] Unable to begin HTTP connection to Edge Function.");
  }
}

// =================================================================
// CORE DEVICE LOGIC
// =================================================================

void ringBell() {
  Serial.println("[BELL] Ringing scheduled bell!");
  digitalWrite(LED_PIN, LOW);
  digitalWrite(BELL_PIN, HIGH);
  delay(2000); // Ring for 2 seconds
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH);
  Serial.println("[BELL] Bell sequence finished.");
}

void ringTestBell() {
  Serial.println("[BELL] Ringing TEST bell for 30 seconds!");
  digitalWrite(LED_PIN, LOW);
  digitalWrite(BELL_PIN, HIGH);
  delay(30000); // Ring for 30 seconds
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH);
  Serial.println("[BELL] Test bell sequence finished.");
}

void checkSchedule() {
  if (!timeClient.isTimeSet()) {
    return;
  }

  if (testBellActive) {
    ringTestBell();
    testBellActive = false;
  }

  JsonArray bells = scheduleDoc["bells"].as<JsonArray>();
  if (bells.isNull()) {
    return;
  }

  int currentDay = timeClient.getDay();
  String currentTime = timeClient.getFormattedTime().substring(0, 5);

  static String lastTriggeredTime = "";

  if (currentTime == lastTriggeredTime) {
    return;
  }

  for (JsonObject bell : bells) {
    String bellTime = bell["time"].as<String>().substring(0, 5);
    JsonArray days = bell["days_of_week"].as<JsonArray>();

    if (bellTime == currentTime) {
      for (JsonVariant day : days) {
        if (day.as<int>() == currentDay) {
          ringBell();
          lastTriggeredTime = currentTime;
          return;
        }
      }
    }
  }
}

// =================================================================
// ARDUINO SETUP & LOOP
// =================================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n[INFO] Smart Bell Scheduler v2.4 Starting...");

  pinMode(BELL_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH);

  loadConfig();

  if (!config.configured) {
    startConfigPortal();
  } else {
    connectToWiFi();
    if (WiFi.status() == WL_CONNECTED) {
      timeClient.begin();
      timeClient.forceUpdate();
      Serial.print("[TIME] Initial time sync: ");
      Serial.println(timeClient.getFormattedTime());
    }
  }
}

void loop() {
  if (!config.configured) {
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Connection lost. Reconnecting...");
    connectToWiFi();
  } else {
    digitalWrite(LED_PIN, LOW);
    delay(50);
    digitalWrite(LED_PIN, HIGH);

    timeClient.update();

    unsigned long currentTime = millis();
    if (currentTime - lastSyncTime >= syncInterval) {
      lastSyncTime = currentTime;
      syncSchedule();
    }

    checkSchedule();
  }

  delay(1000);
}