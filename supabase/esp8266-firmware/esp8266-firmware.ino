/*
  Smart Bell Scheduler - ESP8266 Firmware (v2)
  
  This firmware connects an ESP8266 to a WiFi network, fetches bell schedules
  from a Supabase Edge Function, and rings a bell (by controlling a GPIO pin)
  at the scheduled times.

  Version 2 Fixes:
  - Updated HTTPClient usage to be compatible with modern ESP8266 core libraries.
  - Uses WiFiClientSecure to handle HTTPS connections to Supabase.

  Features:
  - WiFi Connection with credentials saved in EEPROM.
  - Access Point (AP) mode for initial configuration if no credentials are saved.
  - A simple web server in AP mode to receive WiFi SSID, password, Edge Function URL, and User ID.
  - NTP client for accurate timekeeping.
  - Regular polling of the Supabase Edge Function to get the latest schedule.
  - Control of a relay/bell connected to a GPIO pin.
  - Handles "Test Bell" functionality from the web app.

  Libraries needed in Arduino IDE:
  - ArduinoJson by Benoit Blanchon (version 6.x or 7.x)
*/

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h> // Required for HTTPS
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

// --- PIN CONFIGURATION ---
const int BELL_PIN = D1; // GPIO pin connected to the relay that controls the bell.

// --- EEPROM CONFIGURATION ---
// Memory layout for storing configuration data.
#define EEPROM_SIZE 512
#define SSID_ADDR 0
#define PASS_ADDR 64
#define EDGE_URL_ADDR 128
#define USER_ID_ADDR 356
#define CONFIG_FLAG_ADDR 510

// --- NETWORK & TIME CONFIGURATION ---
ESP8266WebServer server(80);
WiFiUDP ntpUDP;
// NTP client for fetching UTC time. Offset is in seconds (e.g., UTC+5:30 is 19800)
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800, 60000); 

// --- GLOBAL VARIABLES ---
String ssid = "";
String password = "";
String edgeUrl = "";
String userId = "";

unsigned long lastSyncTime = 0;
const long syncInterval = 30000; // Sync with Supabase every 30 seconds

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
// SETUP: Runs once on boot.
// =================================================================
void setup() {
  Serial.begin(115200);
  EEPROM.begin(EEPROM_SIZE);
  pinMode(BELL_PIN, OUTPUT);
  digitalWrite(BELL_PIN, LOW); // Ensure bell is off initially

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
// LOOP: Runs continuously.
// =================================================================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    // If we lose connection and we have credentials, try to reconnect.
    if (ssid.length() > 0) {
      Serial.println("WiFi disconnected. Attempting to reconnect...");
      connectToWiFi();
      delay(10000); // Wait before retrying
    } else {
      // If no credentials, just handle server requests (in AP mode).
      server.handleClient();
    }
  } else {
    // If connected, sync with Supabase periodically.
    server.handleClient(); // Also handle server requests when connected
    unsigned long currentMillis = millis();
    if (currentMillis - lastSyncTime >= syncInterval) {
      lastSyncTime = currentMillis;
      syncWithSupabase();
    }
  }
}

// =================================================================
// CREDENTIALS MANAGEMENT (EEPROM)
// =================================================================
void saveCredentials() {
  Serial.println("Saving credentials to EEPROM...");
  EEPROM.write(CONFIG_FLAG_ADDR, 'C'); // 'C' for Configured
  
  // Clear old data
  for (int i = 0; i < (EDGE_URL_ADDR + 255); i++) { EEPROM.write(i, 0); }

  ssid.toCharArray((char*)EEPROM.getDataPtr() + SSID_ADDR, 64);
  password.toCharArray((char*)EEPROM.getDataPtr() + PASS_ADDR, 64);
  edgeUrl.toCharArray((char*)EEPROM.getDataPtr() + EDGE_URL_ADDR, 228);
  userId.toCharArray((char*)EEPROM.getDataPtr() + USER_ID_ADDR, 154);
  
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
  ssid = "";
  password = "";
  edgeUrl = "";
  userId = "";
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
    startConfigServer(); // Start server even in client mode for status checks
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
  server.send(200, "text/plain", "ESP8266 Smart Bell Config. Send a POST to /config with ssid, password, edge_url, user_id.");
}

void handleConfig() {
  if (server.hasArg("plain") == false) {
    server.send(400, "text/plain", "Body not received");
    return;
  }
  
  String body = server.arg("plain");
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, body);

  if (error) {
    server.send(400, "text/plain", "JSON parsing failed");
    return;
  }

  ssid = doc["ssid"].as<String>();
  password = doc["password"].as<String>();
  edgeUrl = doc["edge_url"].as<String>();
  userId = doc["user_id"].as<String>();

  saveCredentials();
  
  server.send(200, "application/json", "{\"status\":\"ok\", \"message\":\"Configuration received. Restarting device...\"}");
  
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
  server.send(200, "application/json", "{\"status\":\"ok\", \"message\":\"Credentials cleared. Restarting in AP mode...\"}");
  delay(1000);
  ESP.restart();
}

// =================================================================
// SUPABASE SYNC & BELL LOGIC
// =================================================================
void syncWithSupabase() {
  if (WiFi.status() != WL_CONNECTED || edgeUrl.length() == 0 || userId.length() == 0) {
    Serial.println("Cannot sync: Not connected or not configured.");
    return;
  }

  timeClient.update();
  
  // Use WiFiClientSecure for HTTPS connections
  std::unique_ptr<BearSSL::WiFiClientSecure>client(new BearSSL::WiFiClientSecure);
  
  // Supabase functions use HTTPS. For simplicity, we'll allow insecure connections
  // by skipping certificate validation. In a production environment, you should use 
  // certificate fingerprint validation for better security.
  client->setInsecure();
  
  HTTPClient http;

  Serial.print("[HTTP] begin...\n");
  if (http.begin(*client, edgeUrl)) { // The corrected begin() method call
    http.addHeader("Content-Type", "application/json");

    String requestBody = "{\"user_id\":\"" + userId + "\"}";
    int httpCode = http.POST(requestBody);

    if (httpCode > 0) {
      Serial.printf("[HTTP] POST... code: %d\n", httpCode);
      String payload = http.getString();
      Serial.println("Sync successful. Payload received:");
      Serial.println(payload);

      StaticJsonDocument<1024> doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print("deserializeJson() failed: ");
        Serial.println(error.c_str());
        http.end();
        return;
      }

      // Check for test bell
      bool testBellActive = doc["test_bell_active"];
      if (testBellActive) {
        Serial.println("Test bell is active! Ringing now.");
        ringBell();
        http.end();
        return; // Don't check regular schedule if test bell is active
      }

      // Check scheduled bells
      JsonArray bells = doc["bells"];
      int currentDay = timeClient.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
      int adjustedDay = (currentDay == 0) ? 6 : currentDay - 1; // Adjust to Mon=0, Sun=6

      String currentTime = timeClient.getFormattedTime().substring(0, 5); // HH:MM

      for (JsonObject bell : bells) {
        String bellTime = bell["time"]; // "HH:MM"
        JsonArray daysOfWeek = bell["days_of_week"];

        bool todayIsBellDay = false;
        for (int day : daysOfWeek) {
          if (day == adjustedDay) {
            todayIsBellDay = true;
            break;
          }
        }

        if (todayIsBellDay && bellTime == currentTime) {
          Serial.print("Scheduled bell match! Label: ");
          Serial.println(bell["label"].as<String>());
          ringBell();
          break; // Ring only once per sync cycle
        }
      }
    } else {
      Serial.printf("[HTTP] POST... failed, error: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.printf("[HTTP] Unable to connect to: %s\n", edgeUrl.c_str());
  }
}

void ringBell() {
  Serial.println("Ringing bell...");
  digitalWrite(BELL_PIN, HIGH);
  delay(1000); // Ring for 1 second
  digitalWrite(BELL_PIN, LOW);
  Serial.println("Bell off.");
}