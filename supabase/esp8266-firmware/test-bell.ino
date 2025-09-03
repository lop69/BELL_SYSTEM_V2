/*
 * Smart Bell Scheduler - UNIVERSAL TEST FIRMWARE v2.0
 *
 * CHANGELOG v2.0:
 * - Simplified! No longer requires a Schedule ID.
 * - This firmware works for any user to test any bell hardware.
 * - Just add your WiFi details, upload, and trigger from the app.
*/

// LIBRARIES
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>

// =================================================================
// >>>>>>>>>> USER CONFIGURATION - FILL IN YOUR DETAILS HERE <<<<<<<<<<
// =================================================================

const char* WIFI_SSID = "YOUR_WIFI_SSID";         // <-- REPLACE with your WiFi network name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";     // <-- REPLACE with your WiFi password

// =================================================================
// SUPABASE CONFIGURATION (DO NOT CHANGE)
// =================================================================

const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcmdiY2ZpZGdneGlvaXp2a2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDgzOTUsImV4cCI6MjA3MDkyNDM5NX0.eTzeTrcYRG3JemHh-N-rSRcHkMAdp2Afnt20Ft---ZA";
const char* SUPABASE_EDGE_URL = "https://tkrgbcfidggxioizvkeq.supabase.co/functions/v1/global-test-bell";

// =================================================================

const int BELL_PIN = D1;
const int LED_PIN = LED_BUILTIN;
unsigned long lastSyncTime = 0;
const long syncInterval = 5000; // Check every 5 seconds

void connectToWiFi() {
  Serial.print("[WIFI] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(200);
    Serial.print(".");
  }
  Serial.println("\n[WIFI] Connected!");
  Serial.print("[WIFI] IP: ");
  Serial.println(WiFi.localIP());
  digitalWrite(LED_PIN, HIGH); // Turn LED off (HIGH is off for built-in)
}

void ringTestBell() {
  Serial.println("[BELL] Test signal received! Ringing bell for 30 seconds.");
  digitalWrite(LED_PIN, LOW); // Turn LED on
  digitalWrite(BELL_PIN, HIGH);
  delay(30000);
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH); // Turn LED off
  Serial.println("[BELL] Test complete.");
}

void checkTestBellStatus() {
  if (WiFi.status() != WL_CONNECTED) return;
  Serial.println("[SYNC] Checking for test signal...");
  
  WiFiClientSecure client;
  HTTPClient http;
  client.setInsecure(); // Bypass SSL certificate validation

  if (http.begin(client, SUPABASE_EDGE_URL)) {
    http.setTimeout(10000);
    http.addHeader("apikey", SUPABASE_ANON_KEY);
    http.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));

    int httpCode = http.GET(); // Simple GET request, no body needed
    
    if (httpCode == HTTP_CODE_OK) {
      JsonDocument doc;
      deserializeJson(doc, http.getString());
      if (doc["test_bell_active"].as<bool>()) {
        ringTestBell();
      } else {
        Serial.println("[SYNC] No test signal active.");
      }
    } else {
      Serial.printf("[ERROR] HTTP request failed. Status Code: %d\n", httpCode);
      Serial.println("[ERROR] Server Response: " + http.getString());
    }
    http.end();
  } else {
    Serial.println("[ERROR] Unable to begin HTTP connection.");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n[INFO] Universal Test Firmware v2.0");

  pinMode(BELL_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH); // LED off

  if (strcmp(WIFI_SSID, "YOUR_WIFI_SSID") == 0 || 
      strcmp(WIFI_PASSWORD, "YOUR_WIFI_PASSWORD") == 0) {
    Serial.println("\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    Serial.println("[FATAL ERROR] WiFi details are missing.");
    Serial.println("Please open 'test-bell.ino' and add your WiFi credentials.");
    Serial.println("Halting execution until code is updated.");
    Serial.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    while(true) {
      digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Blink LED rapidly
      delay(100);
    }
  }
  connectToWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Connection lost. Reconnecting...");
    connectToWiFi();
  }
  if (millis() - lastSyncTime >= syncInterval) {
    lastSyncTime = millis();
    checkTestBellStatus();
  }
  delay(100);
}