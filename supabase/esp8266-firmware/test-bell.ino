/*
 * Smart Bell Scheduler - HARDWARE TEST FIRMWARE v1.6 (HTTPS Fix)
 *
 * CHANGELOG v1.6:
 * - Switched to WiFiClientSecure to enable proper HTTPS communication with Supabase.
 * - This fixes the '400 Bad Request' error when connecting to edge functions.
*/

// LIBRARIES
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h> // For HTTPS

// =================================================================
// >>>>>>>>>> USER CONFIGURATION - FILL IN YOUR DETAILS HERE <<<<<<<<<<
// =================================================================

// STEP 1: Log in to your Supabase dashboard.
// STEP 2: Go to 'Authentication' -> 'Users'.
// STEP 3: Find your user account and copy the 'UID' value.
// STEP 4: Paste the copied UID below, replacing "YOUR_USER_ID".

const char* WIFI_SSID = "YOUR_WIFI_SSID";     // <-- REPLACE with your WiFi network name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // <-- REPLACE with your WiFi password
const char* USER_ID = "YOUR_USER_ID";         // <-- PASTE your User ID (UID) from Supabase here

// =================================================================
// SUPABASE CONFIGURATION (DO NOT CHANGE)
// =================================================================

const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcmdiY2ZpZGdneGlvaXp2a2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDgzOTUsImV4cCI6MjA3MDkyNDM5NX0.eTzeTrcYRG3JemHh-N-rSRcHkMAdp2Afnt20Ft---ZA";
const char* SUPABASE_EDGE_URL = "https://tkrgbcfidggxioizvkeq.supabase.co/functions/v1/test-bell-check";

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
  
  // Use WiFiClientSecure for HTTPS connections
  WiFiClientSecure client;
  HTTPClient http;

  // Allow insecure connections to bypass certificate validation on the ESP8266
  // This is often necessary as these devices have limited memory for root certificates.
  client.setInsecure();

  if (http.begin(client, SUPABASE_EDGE_URL)) {
    http.setTimeout(10000); // Set a 10-second timeout for the request
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_ANON_KEY);
    http.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));

    JsonDocument requestBody;
    requestBody["user_id"] = USER_ID;
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
      Serial.printf("[ERROR] HTTP request failed. Status Code: %d\n", httpCode);
      String payload = http.getString();
      Serial.println("[ERROR] Server Response: " + payload);
    }
    http.end();
  } else {
    Serial.println("[ERROR] Unable to begin HTTP connection. Check your network.");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n[INFO] Hardware Test Firmware v1.6");

  pinMode(BELL_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH);

  if (strcmp(WIFI_SSID, "YOUR_WIFI_SSID") == 0 || 
      strcmp(WIFI_PASSWORD, "YOUR_WIFI_PASSWORD") == 0 || 
      strcmp(USER_ID, "YOUR_USER_ID") == 0) {
    Serial.println("\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    Serial.println("[FATAL ERROR] Configuration placeholders detected.");
    Serial.println("Please open 'test-bell.ino' and replace the following:");
    Serial.println(" - WIFI_SSID");
    Serial.println(" - WIFI_PASSWORD");
    Serial.println(" - USER_ID (Find this in Supabase Authentication -> Users)");
    Serial.println("Halting execution until code is updated.");
    Serial.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    while(true) {
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
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