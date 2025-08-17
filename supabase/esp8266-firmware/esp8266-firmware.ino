/*
  Smart Bell Scheduler - ESP8266 Firmware (v3.1)
  
  This firmware connects an ESP8266 to a WiFi network, fetches bell schedules
  from a Supabase Edge Function, and rings a bell (by controlling a GPIO pin)
  at the scheduled times.

  Version 3.1 Fixes:
  - Adds handling for the Supabase Anon Key.
  - Sends the 'apikey' and 'Authorization' headers with requests to the Edge Function
    to solve the 401 Unauthorized error from the Supabase API Gateway.
  - Increased EEPROM size to store the additional configuration.
  - Improved HTTP response handling to correctly differentiate between success (200 OK)
    and server-side errors (4xx, 5xx).
*/

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

// --- PIN CONFIGURATION ---
const int BELL_PIN = D1;

// --- EEPROM CONFIGURATION ---
#define EEPROM_SIZE 1024
#define SSID_ADDR 0
#define PASS_ADDR 64
#define EDGE_URL_ADDR 128
#define USER_ID_ADDR 384
#define ANON_KEY_ADDR 448
#define CONFIG_FLAG_ADDR 1022

// --- NETWORK & TIME CONFIGURATION ---
ESP8266WebServer server(80);
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800, 60000);

// --- GLOBAL VARIABLES ---
String ssid = "";
String password = "";
String edgeUrl = "";
String userId = "";
String anonKey = "";

unsigned long lastSyncTime = 0;
const long syncInterval = 30000; // Sync every 30 seconds

// --- FUNCTION PROTOTYPES ---
void saveCredentials();
void loadCredentials();
void clearCredentials();
void connectToWiFi();
void startConfigServer();
void handleRoot();
void handleConfig();
void handleStatus();
void handleDisconnect();
void syncWithSupabase();
void ringBell();

// =================================================================
// SETUP
// =================================================================
void setup() {
  Serial.begin(115200);
  EEPROM.begin(EEPROM_SIZE);
  pinMode(BELL_PIN, OUTPUT);
  digitalWrite(BELL_PIN, LOW);

  Serial.println("\n\nSmart Bell Scheduler Initializing...");
  loadCredentials();

  if (ssid.length() > 0) {
    connectToWiFi();
  } else {
    Serial.println("No credentials found. Starting configuration server.");
    startConfigServer();
  }
}

// =================================================================
// LOOP
// =================================================================
void loop() {
  server.handleClient();
  if (WiFi.status() != WL_CONNECTED && ssid.length() > 0) {
    Serial.println("WiFi disconnected. Attempting to reconnect...");
    connectToWiFi();
    delay(10000);
  } else if (WiFi.status() == WL_CONNECTED) {
    unsigned long currentMillis = millis();
    if (currentMillis - lastSyncTime >= syncInterval) {
      lastSyncTime = currentMillis;
      syncWithSupabase();
    }
  }
}

// =================================================================
// CREDENTIALS MANAGEMENT
// =================================================================
void saveCredentials() {
  Serial.println("Saving credentials to EEPROM...");
  EEPROM.write(CONFIG_FLAG_ADDR, 'C');
  for (int i = 0; i < ANON_KEY_ADDR + 256; i++) { EEPROM.write(i, 0); }

  ssid.toCharArray((char*)EEPROM.getDataPtr() + SSID_ADDR, 64);
  password.toCharArray((char*)EEPROM.getDataPtr() + PASS_ADDR, 64);
  edgeUrl.toCharArray((char*)EEPROM.getDataPtr() + EDGE_URL_ADDR, 256);
  userId.toCharArray((char*)EEPROM.getDataPtr() + USER_ID_ADDR, 64);
  anonKey.toCharArray((char*)EEPROM.getDataPtr() + ANON_KEY_ADDR, 256);
  
  EEPROM.commit();
  Serial.println("Credentials saved.");
}

void loadCredentials() {
  if (EEPROM.read(CONFIG_FLAG_ADDR) == 'C') {
    Serial.println("Loading credentials from EEPROM...");
    ssid = String((char*)EEPROM.getDataPtr() + SSID_ADDR);
    password = String((char*)EEPROM.getDataPtr() + PASS_ADDR);
    edgeUrl = String((char*)EEPROM.getDataPtr() + EDGE_URL_ADDR);
    userId = String((char*)EEPROM.getDataPtr() + USER_ID_ADDR);
    anonKey = String((char*)EEPROM.getDataPtr() + ANON_KEY_ADDR);
    Serial.println("Credentials loaded.");
  } else {
    Serial.println("No valid configuration found in EEPROM.");
  }
}

void clearCredentials() {
  Serial.println("Clearing credentials from EEPROM...");
  EEPROM.write(CONFIG_FLAG_ADDR, 0);
  for (int i = 0; i < EEPROM_SIZE; i++) { EEPROM.write(i, 0); }
  EEPROM.commit();
  ssid = ""; password = ""; edgeUrl = ""; userId = ""; anonKey = "";
  Serial.println("Credentials cleared.");
}

// =================================================================
// WIFI & SERVER MANAGEMENT
// =================================================================
void connectToWiFi() {
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid.c_str(), password.c_str());
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    timeClient.begin();
    startConfigServer();
  } else {
    Serial.println("\nFailed to connect to WiFi. Starting config server in AP mode.");
    startConfigServer();
  }
}

void startConfigServer() {
  if (WiFi.getMode() != WIFI_AP) {
    WiFi.softAP("SmartBell-Setup");
    Serial.print("AP IP address: ");
    Serial.println(WiFi.softAPIP());
  }

  server.on("/", HTTP_GET, handleRoot);
  server.on("/config", HTTP_POST, handleConfig);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/disconnect", HTTP_POST, handleDisconnect);
  
  server.begin();
  Serial.println("HTTP server started.");
}

// =================================================================
// WEB SERVER HANDLERS
// =================================================================
void handleRoot() {
  server.send(200, "text/plain", "ESP8266 Smart Bell Config Server");
}

void handleConfig() {
  if (!server.hasArg("plain")) {
    server.send(400, "text/plain", "Body not received");
    return;
  }
  
  String body = server.arg("plain");
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, body);

  if (error) {
    server.send(400, "text/plain", "JSON parsing failed");
    return;
  }

  ssid = doc["ssid"].as<String>();
  password = doc["password"].as<String>();
  edgeUrl = doc["edge_url"].as<String>();
  userId = doc["user_id"].as<String>();
  anonKey = doc["anon_key"].as<String>();

  saveCredentials();
  
  server.send(200, "application/json", "{\"status\":\"ok\", \"message\":\"Configuration received. Restarting...\"}");
  delay(1000);
  ESP.restart();
}

void handleStatus() {
  String status = (WiFi.status() == WL_CONNECTED) ? "connected" : "disconnected";
  String ip = (WiFi.status() == WL_CONNECTED) ? WiFi.localIP().toString() : "N/A";
  String response = "{\"status\":\"" + status + "\", \"ip\":\"" + ip + "\"}";
  server.send(200, "application/json", response);
}

void handleDisconnect() {
  clearCredentials();
  server.send(200, "application/json", "{\"status\":\"ok\", \"message\":\"Credentials cleared. Restarting...\"}");
  delay(1000);
  ESP.restart();
}

// =================================================================
// SUPABASE SYNC & BELL LOGIC
// =================================================================
void syncWithSupabase() {
  if (WiFi.status() != WL_CONNECTED || edgeUrl.length() == 0 || userId.length() == 0 || anonKey.length() == 0) {
    Serial.println("Cannot sync: Not connected or not fully configured.");
    return;
  }

  timeClient.update();
  
  std::unique_ptr<BearSSL::WiFiClientSecure>client(new BearSSL::WiFiClientSecure);
  client->setInsecure();
  
  HTTPClient http;

  if (http.begin(*client, edgeUrl)) {
    String bearer = "Bearer " + anonKey;
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", anonKey);
    http.addHeader("Authorization", bearer);

    String requestBody = "{\"user_id\":\"" + userId + "\"}";
    int httpCode = http.POST(requestBody);

    // --- MODIFICATION START ---
    // Check for a successful response (200 OK) specifically
    if (httpCode == HTTP_CODE_OK) {
      String payload = http.getString();
      Serial.println("[HTTP] POST... Success (200 OK)");
      
      StaticJsonDocument<1024> doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print("JSON parsing failed: ");
        Serial.println(error.c_str());
      } else {
        Serial.println("Successfully parsed schedule data.");
        if (doc["test_bell_active"]) {
          Serial.println("Test bell is active! Ringing now.");
          ringBell();
        } else {
          JsonArray bells = doc["bells"];
          int currentDay = timeClient.getDay();
          int adjustedDay = (currentDay == 0) ? 6 : currentDay - 1; // Adjust Sunday from 0 to 6
          String currentTime = timeClient.getFormattedTime().substring(0, 5);

          for (JsonObject bell : bells) {
            bool todayIsBellDay = false;
            for (int day : bell["days_of_week"].as<JsonArray>()) {
              if (day == adjustedDay) {
                todayIsBellDay = true;
                break;
              }
            }
            if (todayIsBellDay && bell["time"].as<String>() == currentTime) {
              Serial.print("Scheduled bell match! Label: ");
              Serial.println(bell["label"].as<String>());
              ringBell();
              break; // Ring only once per sync cycle
            }
          }
        }
      }
    } 
    // Handle server-side errors (e.g., 401, 404, 500)
    else if (httpCode > 0) {
      String errorPayload = http.getString();
      Serial.printf("[HTTP] POST... Server Error, code: %d\n", httpCode);
      Serial.println("Server response: " + errorPayload);
    } 
    // Handle connection errors
    else {
      Serial.printf("[HTTP] POST... failed, error: %s\n", http.errorToString(httpCode).c_str());
    }
    // --- MODIFICATION END ---

    http.end();
  } else {
    Serial.printf("[HTTP] Unable to connect to: %s\n", edgeUrl.c_str());
  }
}

void ringBell() {
  Serial.println("Ringing bell...");
  digitalWrite(BELL_PIN, HIGH);
  delay(1000);
  digitalWrite(BELL_PIN, LOW);
  Serial.println("Bell off.");
}