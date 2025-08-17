/*
 * Smart Bell Scheduler - HARDWARE TEST FIRMWARE v1.2 (Robust Edition)
 *
 * CHANGELOG v1.2:
 * - Pre-flight Check: The firmware will now refuse to run if you haven't replaced
 *   the placeholder WiFi and Schedule ID values. It will print an error in the
 *   Serial Monitor until you update the code. This prevents 400/500 errors.
 * - Graceful Error Handling: Provides clear, human-readable error messages in the
 *   Serial Monitor for different HTTP status codes (e.g., 400, 404, 500).
 * - Improved Logging: More detailed serial output to make debugging easier.
*/

// LIBRARIES
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

// =================================================================
// >>>>>>>>>> USER CONFIGURATION - FILL IN YOUR DETAILS HERE <<<<<<<<<<
// =================================================================

const char* WIFI_SSID = "YOUR_WIFI_SSID";         // <-- REPLACE with your WiFi network name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // <-- REPLACE with your WiFi password
const char* SCHEDULE_ID = "YOUR_SCHEDULE_ID";     // <-- REPLACE with a real Schedule ID from your app

// =================================================================
// SUPABASE CONFIGURATION (DO NOT CHANGE)
// =================================================================

const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcmdiY2ZpZGdneGlvaXp2a2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDgzOTUsImV4cCI6MjA3MDkyNDM5NX0.eTzeTrcYRG3JemHh-N-rSRcHkMAdp2Afnt20Ft---ZA";
const char* SUPABASE_EDGE_URL = "https://tkrgbcfidggxioizvkeq.supabase.co/functions/v1/bell-sync";

// =================================================================

// PIN DEFINITIONS
const int BELL_PIN = D1;
const int LED_PIN = LED_BUILTIN;

// TIMING
unsigned long lastSyncTime = 0;
const long syncInterval = 5000; // Check for test signal every 5 seconds

void connectToWiFi() {
  Serial.print("[WIFI] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(200);
    Serial.print(".");
  }

  Serial.println("\n[WIFI] Connected!");
  Serial.print("[WIFI] IP: ");
  Serial.println(WiFi.localIP());
  digitalWrite(LED_PIN, HIGH); // LED Off (indicates idle)
}

void ringTestBell() {
  Serial.println("[BELL] Test signal received! Ringing bell for 30 seconds.");
  digitalWrite(LED_PIN, LOW); // LED On (indicates activity)
  digitalWrite(BELL_PIN, HIGH);
  delay(30000); // Ring for 30 seconds for the test
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH);
  Serial.println("[BELL] Test complete.");
}

void checkTestBellStatus() {
  if (WiFi.status() != WL_CONNECTED) return;

  Serial.println("[SYNC] Checking for test signal...");
  
  WiFiClient client;
  HTTPClient http;

  if (http.begin(client, SUPABASE_EDGE_URL)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_ANON_KEY);
    http.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));

    JsonDocument requestBody;
    requestBody["schedule_id"] = SCHEDULE_ID;
    String requestBodyString;
    serializeJson(requestBody, requestBodyString);

    int httpCode = http.POST(requestBodyString);
    if (httpCode == HTTP_CODE_OK) {
      JsonDocument doc;
      deserializeJson(doc, http.getString());
      
      if (doc["test_bell_active"].as<bool>()) {
        ringTestBell();
      } else {
        Serial.println("[SYNC] No test signal active.");
      }
    } else {
      // --- GRACEFUL ERROR HANDLING ---
      Serial.printf("[ERROR] HTTP request failed. Status Code: %d\n", httpCode);
      String payload = http.getString();
      Serial.println("[ERROR] Server Response: " + payload);
      
      if (httpCode == 400) {
        Serial.println("[HINT] Bad Request (400). The server rejected the data. This can happen if the SCHEDULE_ID is an empty string.");
      } else if (httpCode == 404) {
        Serial.println("[HINT] Not Found (404). The SCHEDULE_ID you provided does not exist in the database. Please double-check it.");
      } else if (httpCode >= 500) {
        Serial.println("[HINT] Server Error (5xx). There is an issue with the Supabase Edge Function. Check the function logs in your Supabase dashboard.");
      }
    }
    http.end();
  } else {
    Serial.println("[ERROR] Unable to begin HTTP connection. Check your network.");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n[INFO] Hardware Test Firmware v1.2");

  pinMode(BELL_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH);

  // --- PRE-FLIGHT CHECK ---
  if (strcmp(WIFI_SSID, "YOUR_WIFI_SSID") == 0 || 
      strcmp(WIFI_PASSWORD, "YOUR_WIFI_PASSWORD") == 0 || 
      strcmp(SCHEDULE_ID, "YOUR_SCHEDULE_ID") == 0) {
    Serial.println("\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    Serial.println("[FATAL ERROR] Configuration placeholders detected.");
    Serial.println("Please open 'test-bell.ino' and replace the following:");
    Serial.println(" - WIFI_SSID");
    Serial.println(" - WIFI_PASSWORD");
    Serial.println(" - SCHEDULE_ID");
    Serial.println("Halting execution until code is updated.");
    Serial.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    while(true) { // Halt indefinitely
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

  delay(100); // Small delay to keep the loop from running too fast
}