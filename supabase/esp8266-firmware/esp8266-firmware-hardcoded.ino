// ============================================================================
// Smart Bell Scheduler Firmware (Hardcoded Credentials Version)
// ============================================================================
// This simplified firmware is for direct testing and deployment. It connects
// using credentials that you manually enter into this file, bypassing the
// need for app-based configuration.
//
// ACTION REQUIRED:
// Fill in your details in the "User Configuration" section below.
// ============================================================================

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

// --- Pin Configuration ---
const int BELL_RELAY_PIN = D1; // GPIO5
const int LED_PIN = LED_BUILTIN; // Onboard blue LED

// ============================================================================
// <<<--- USER CONFIGURATION: EDIT THESE 5 LINES ---<<<
// ============================================================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* edge_url = "https://tkrgbcfidggxioizvkeq.supabase.co/functions/v1/bell-sync";
const char* schedule_id = "YOUR_SCHEDULE_ID";
const char* anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcmdiY2ZpZGdneGlvaXp2a2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDgzOTUsImV4cCI6MjA3MDkyNDM5NX0.eTzeTrcYRG3JemHh-N-rSRcHkMAdp2Afnt20Ft---ZA";
// ============================================================================
// --- END OF USER CONFIGURATION ---
// ============================================================================

// --- Time Configuration ---
WiFiUDP ntpUDP;
const long utcOffsetInSeconds = 19800; // IST (UTC+5:30)
NTPClient timeClient(ntpUDP, "pool.ntp.org", utcOffsetInSeconds);

// --- Scheduling Logic ---
unsigned long lastScheduleCheck = 0;
const long scheduleCheckInterval = 30000; // Check schedule every 30 seconds
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

  Serial.println("\n[INFO] Smart Bell Scheduler (Hardcoded) Starting...");
  
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
    Serial.println("\n[WIFI] Failed to connect. Please check credentials.");
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
    } else {
      if (doc["test_bell_active"] == true) {
        Serial.println("[ACTION] Test Bell is active! Ringing now.");
        ringBell();
      } 
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