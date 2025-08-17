// ============================================================================
// Smart Bell Scheduler Firmware for ESP8266 (v1.1)
// ============================================================================
// This firmware connects the ESP8266 to a WiFi network, fetches a specific
// bell schedule from a Supabase Edge Function, and rings a bell at the
// scheduled times. It also supports a real-time "Test Bell" feature.
//
// Required Libraries:
// - ESP8266WiFi
// - ESP8266HTTPClient
// - ArduinoJson (version 6.x)
// - NTPClient
// - WiFiUdp
//
// Connections:
// - Connect a relay module to the `BELL_RELAY_PIN` (D1 / GPIO5). The relay
//   will control the physical bell.
// ============================================================================

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h> // Required for the updated HTTPClient
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESP8266WebServer.h>

// --- Pin Configuration ---
const int BELL_RELAY_PIN = D1; // GPIO5

// --- Web Server for Configuration ---
ESP8266WebServer server(80);

// --- WiFi & Supabase Configuration (will be set via web server) ---
char ssid[32] = "";
char password[64] = "";
char edge_url[256] = "";
char schedule_id[64] = "";
char anon_key[256] = "";

// --- Time Configuration ---
WiFiUDP ntpUDP;
// IST (UTC+5:30) offset in seconds
const long utcOffsetInSeconds = 19800; 
NTPClient timeClient(ntpUDP, "pool.ntp.org", utcOffsetInSeconds);

// --- Scheduling Logic ---
unsigned long lastScheduleCheck = 0;
const long scheduleCheckInterval = 60000; // Check schedule every 60 seconds
bool hasRungForCurrentMinute = false;

// --- Bell Ringing ---
const int ringDuration = 1000; // Ring bell for 1 second

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  pinMode(BELL_RELAY_PIN, OUTPUT);
  digitalWrite(BELL_RELAY_PIN, LOW); // Ensure bell is off initially

  setupWebServer();
  
  Serial.println("\nDevice started. Waiting for configuration.");
  Serial.print("Connect to WiFi 'SmartBell-Config' and go to 192.168.4.1\n");

  // Start in Access Point mode to receive configuration
  WiFi.softAP("SmartBell-Config", "password");
  
  while (strlen(ssid) == 0) {
    server.handleClient();
    delay(100);
  }

  // Configuration received, now connect to user's WiFi
  connectToWiFi();
  timeClient.begin();
}

// ============================================================================
// MAIN LOOP
// ============================================================================
void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    timeClient.update();
    
    unsigned long currentMillis = millis();
    if (currentMillis - lastScheduleCheck >= scheduleCheckInterval) {
      lastScheduleCheck = currentMillis;
      checkScheduleAndRing();
    }

    // Reset the "has rung" flag when the minute changes
    if (timeClient.getSeconds() == 0 && hasRungForCurrentMinute) {
      hasRungForCurrentMinute = false;
    }

  } else {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

void connectToWiFi() {
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect to WiFi.");
  }
}

void checkScheduleAndRing() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClient client;
  HTTPClient http;
  
  // ** FIX: Use the new http.begin() method with a WiFiClient object **
  http.begin(client, edge_url);
  
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", anon_key);
  http.addHeader("Authorization", "Bearer " + String(anon_key));

  String requestBody = "{\"schedule_id\":\"" + String(schedule_id) + "\"}";
  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    String payload = http.getString();
    Serial.println("Response from server: " + payload);

    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (error) {
      Serial.print("deserializeJson() failed: ");
      Serial.println(error.c_str());
      http.end();
      return;
    }

    // 1. Check for Test Bell
    if (doc["test_bell_active"] == true) {
      Serial.println("Test bell is active! Ringing now.");
      ringBell();
      http.end();
      return; // Don't check regular schedule if test bell is active
    }

    // 2. Check Regular Schedule
    if (hasRungForCurrentMinute) {
      http.end();
      return; // Already rang for this minute
    }

    int currentDay = timeClient.getDay(); // Sunday = 0, Monday = 1, ...
    int currentHour = timeClient.getHours();
    int currentMinute = timeClient.getMinutes();

    JsonArray bells = doc["bells"];
    for (JsonObject bell : bells) {
      const char* timeStr = bell["time"]; // "HH:MM"
      int bellHour = String(strtok((char*)timeStr, ":")).toInt();
      int bellMinute = String(strtok(NULL, ":")).toInt();

      if (bellHour == currentHour && bellMinute == currentMinute) {
        JsonArray days = bell["days_of_week"];
        for (int day : days) {
          if (day == currentDay) {
            Serial.print("Schedule match! Ringing for: ");
            Serial.println(bell["label"].as<const char*>());
            ringBell();
            hasRungForCurrentMinute = true;
            break; // Exit day loop
          }
        }
      }
      if (hasRungForCurrentMinute) break; // Exit bell loop
    }
  } else {
    Serial.print("Error on HTTP request: ");
    Serial.println(httpResponseCode);
  }
  http.end();
}

void ringBell() {
  digitalWrite(BELL_RELAY_PIN, HIGH);
  delay(ringDuration);
  digitalWrite(BELL_RELAY_PIN, LOW);
}

// ============================================================================
// WEB SERVER FOR INITIAL CONFIGURATION
// ============================================================================

void setupWebServer() {
  server.on("/", HTTP_GET, handleRoot);
  server.on("/config", HTTP_POST, handleConfig);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/disconnect", HTTP_POST, handleDisconnect);
  server.begin();
}

void handleRoot() {
  server.send(200, "text/html", "<h1>Smart Bell Config</h1><p>Send a POST request to /config with your credentials.</p>");
}

void handleConfig() {
  if (server.hasArg("plain") == false) {
    server.send(400, "text/plain", "Body not received");
    return;
  }
  String body = server.arg("plain");
  StaticJsonDocument<512> doc;
  deserializeJson(doc, body);

  strlcpy(ssid, doc["ssid"], sizeof(ssid));
  strlcpy(password, doc["password"], sizeof(password));
  strlcpy(edge_url, doc["edge_url"], sizeof(edge_url));
  strlcpy(schedule_id, doc["schedule_id"], sizeof(schedule_id));
  strlcpy(anon_key, doc["anon_key"], sizeof(anon_key));

  Serial.println("Configuration received:");
  Serial.println("SSID: " + String(ssid));
  Serial.println("Edge URL: " + String(edge_url));
  Serial.println("Schedule ID: " + String(schedule_id));

  server.send(200, "application/json", "{\"status\":\"ok\", \"message\":\"Configuration received\"}");
  
  // Stop the server and AP mode after config
  server.stop();
  WiFi.softAPdisconnect(true);
}

void handleStatus() {
  String status = (WiFi.status() == WL_CONNECTED) ? "connected" : "disconnected";
  String ip = WiFi.localIP().toString();
  server.send(200, "application/json", "{\"status\":\"" + status + "\", \"ip\":\"" + ip + "\"}");
}

void handleDisconnect() {
  WiFi.disconnect(true);
  // Reset config variables to re-enable AP mode on reboot
  memset(ssid, 0, sizeof(ssid));
  server.send(200, "application/json", "{\"status\":\"ok\", \"message\":\"Device disconnected and config cleared\"}");
  ESP.restart();
}