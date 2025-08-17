/*
 * Smart Bell Scheduler - MAIN FIRMWARE v1.5
 *
 * CHANGELOG v1.5:
 * - Switched to WiFiClientSecure to enable proper HTTPS communication with Supabase.
 * - Added setInsecure() to bypass certificate validation, a common need for ESP8266.
*/

// LIBRARIES
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>
#include <WiFiClientSecure.h> // For HTTPS
#include <EEPROM.h>

// PIN DEFINITIONS
const int BELL_PIN = D1;
const int LED_PIN = LED_BUILTIN; // Onboard LED

// CONFIGURATION STRUCT
struct Config {
  char ssid[32];
  char password[64];
  char anon_key[256];
  char edge_url[256];
  char schedule_id[64];
};

Config config;
unsigned long lastSyncTime = 0;
const long syncInterval = 10000; // 10 seconds

// EEPROM FUNCTIONS
void saveConfig() {
  EEPROM.begin(sizeof(Config));
  EEPROM.put(0, config);
  EEPROM.commit();
  EEPROM.end();
  Serial.println("[EEPROM] Configuration saved.");
}

void loadConfig() {
  EEPROM.begin(sizeof(Config));
  EEPROM.get(0, config);
  EEPROM.end();
  Serial.println("[EEPROM] Configuration loaded.");
}

void syncWithSupabase() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  Serial.println("[SYNC] Syncing with Supabase...");

  // Use WiFiClientSecure for HTTPS connections
  WiFiClientSecure client;
  HTTPClient http;

  // Allow insecure connections to bypass certificate validation on the ESP8266
  client.setInsecure();

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
      JsonDocument doc;
      deserializeJson(doc, http.getString());

      if (doc["test_bell_active"].as<bool>()) {
        Serial.println("[BELL] Test bell active, ringing now.");
        digitalWrite(BELL_PIN, HIGH);
        delay(30000);
        digitalWrite(BELL_PIN, LOW);
      } else {
        // Main bell logic would go here
        Serial.println("[SYNC] Sync complete. No test bell active.");
      }
    } else {
      Serial.printf("[ERROR] Sync failed, HTTP code: %d\n", httpCode);
      Serial.println(http.getString());
    }
    http.end();
  } else {
    Serial.println("[ERROR] Unable to begin HTTP connection.");
  }
}

void connectToWiFi() {
  WiFi.begin(config.ssid, config.password);
  Serial.print("[WIFI] Connecting");
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 50) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(200);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected!");
    digitalWrite(LED_PIN, HIGH); // LED Off
  } else {
    Serial.println("\n[WIFI] Failed to connect. Entering config mode.");
    WiFiManager wifiManager;
    wifiManager.startConfigPortal("SmartBell-Config", "password");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BELL_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH);

  loadConfig();

  if (strlen(config.ssid) == 0) {
    Serial.println("[INFO] No config found. Starting WiFi Manager.");
    WiFiManager wifiManager;
    wifiManager.startConfigPortal("SmartBell-Config", "password");
  } else {
    connectToWiFi();
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  if (millis() - lastSyncTime > syncInterval) {
    lastSyncTime = millis();
    syncWithSupabase();
  }
}