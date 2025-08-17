// ============================================================================
// Smart Bell Scheduler Firmware for ESP8266 (v2.0 - Robust)
// ============================================================================
// This firmware connects the ESP8266 to a WiFi network, fetches a specific
// bell schedule from a Supabase Edge Function, and rings a bell at the
// scheduled times. It includes a real-time "Test Bell" feature, a visual
// heartbeat LED, and improved error reporting.
//
// Required Libraries:
// - ESP8266WiFi
// - ESP8266HTTPClient
// - ArduinoJson (version 6.x or 7.x)
// - NTPClient
// - WiFiUdp
//
// Connections:
// - Connect a relay module to the `BELL_RELAY_PIN` (D1 / GPIO5).
// ============================================================================

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESP8266WebServer.h>

// --- Pin Configuration ---
const int BELL_RELAY_PIN = D1; // GPIO5
const int LED_PIN = LED_BUILTIN; // Onboard blue LED

// --- Web Server for Configuration ---
ESP8266WebServer server(80);

// --- WiFi & Supabase Configuration ---
// IMPORTANT: These values are set via the web portal from the app.
// Do not hardcode your credentials here.
char ssid[32] = "";
char password[64] = "";
char edge_url[256] = "";
char schedule_id[64] = "";
char anon_key[256] = "";

// --- Time Configuration ---
WiFiUDP ntpUDP;
const long utcOffsetInSeconds = 19800; // IST (UTC+5:30)
NTPClient timeClient(ntpUDP, "pool.ntp.org", utcOffsetInSeconds);

// --- Scheduling Logic ---
unsigned long lastScheduleCheck = 0;
const long scheduleCheckInterval = 30000; // Check schedule every 30 seconds for responsiveness
bool hasRungForCurrentMinute = false;

// --- Bell Ringing ---
const int ringDuration = 1000; // Ring bell for 1 second

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  pinMode(BELL_RELAY_PIN, OUTPUT);
  digitalWrite(BELL_RELAY_PIN, LOW);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH); // LED is active low, so HIGH is OFF

  Serial.println("\n[INFO] Smart Bell Scheduler v2.0 Starting...");

  setupWebServer();
  
  Serial.println("[SETUP] Starting configuration server.");
  Serial.println("[SETUP] Connect to WiFi 'SmartBell-Config' (password: 'password')");
  Serial.println("[SETUP] Then open 192.168.4.1 in a browser.");
  
  WiFi.softAP("SmartBell-Config", "password");
  
  // This loop waits until the device is configured via the web portal or app
  while (strlen(ssid) == 0) {
    server.handleClient();
    delay(100);
  }

  Serial.println("[SETUP] Configuration received. Connecting to your WiFi...");
  connectToWiFi();
  timeClient.begin();
}

// ============================================================================
// MAIN LOOP
// ============================================================================
void loop() {
  // Heartbeat LED to show the device is running
  digitalWrite(LED_PIN, LOW); // ON
  delay(50);
  digitalWrite(LED_PIN, HIGH); // OFF
  delay(950);

  if (WiFi.status() == WL_CONNECTED) {
    timeClient.update();
    
    unsigned long currentMillis = millis();
    if (currentMillis - lastScheduleCheck >= scheduleCheckInterval) {
      lastScheduleCheck = currentMillis;
      checkScheduleAndRing();
    }

    if (timeClient.getSeconds() == 0 && hasRungForCurrentMinute) {
      Serial.println("[TIME] New minute started. Resetting ring status.");
      hasRungForCurrentMinute = false;
    }

  } else {
    Serial.println("[ERROR] WiFi disconnected. Attempting to reconnect...");
    connectToWiFi();
  }
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

void connectToWiFi() {
  Serial.print("[WIFI] Connecting to: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connection successful!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WIFI] Failed to connect. Please check credentials and restart device.");
  }
}

void checkScheduleAndRing() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] Cannot check schedule, WiFi is not connected.");
    return;
  }

  Serial.println("[HTTP] Fetching schedule from server...");

  WiFiClient client;
  HTTPClient http;
  
  http.begin(client, edge_url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", anon_key);
  http.addHeader("Authorization", "Bearer " + String(anon_key));

  String requestBody = "{\"schedule_id\":\"" + String(schedule_id) + "\"}";
  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.println("[HTTP] Server Response: " + payload);

    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (error) {
      Serial.println("[ERROR] Failed to parse schedule data from server.");
      Serial.print("        Reason: ");
      Serial.println(error.c_str());
    } else {
      // 1. Check for Test Bell
      if (doc["test_bell_active"] == true) {
        Serial.println("[ACTION] Test Bell is active! Ringing now.");
        ringBell();
      } 
      // 2. Check Regular Schedule
      else if (!hasRungForCurrentMinute) {
        int currentDay = timeClient.getDay();
        int currentHour = timeClient.getHours();
        int currentMinute = timeClient.getMinutes();

        JsonArray bells = doc["bells"];
        for (JsonObject bell : bells) {
          const char* timeStr = bell["time"];
          int bellHour = String(strtok((char*)timeStr, ":")).toInt();
          int bellMinute = String(strtok(NULL, ":")).toInt();

          if (bellHour == currentHour && bellMinute == currentMinute) {
            JsonArray days = bell["days_of_week"];
            for (int day : days) {
              if (day == currentDay) {
                Serial.print("[ACTION] Schedule match! Ringing for: ");
                Serial.println(bell["label"].as<const char*>());
                ringBell();
                hasRungForCurrentMinute = true;
                break;
              }
            }
          }
          if (hasRungForCurrentMinute) break;
        }
      }
    }
  } else {
    Serial.print("[ERROR] Server request failed. HTTP Code: ");
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
  server.begin();
}

void handleRoot() {
  server.send(200, "text/html", "<h1>Smart Bell Config</h1><p>This device is configured through the Smart Bell Scheduler app.</p>");
}

void handleConfig() {
  if (!server.hasArg("plain")) {
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

  server.send(200, "application/json", "{\"status\":\"ok\", \"message\":\"Configuration received\"}");
  
  Serial.println("[SETUP] Configuration received via app. Stopping config server.");
  server.stop();
  WiFi.softAPdisconnect(true);
}

void handleStatus() {
  String status = (WiFi.status() == WL_CONNECTED) ? "connected" : "disconnected";
  String ip = WiFi.localIP().toString();
  server.send(200, "application/json", "{\"status\":\"" + status + "\", \"ip\":\"" + ip + "\"}");
}