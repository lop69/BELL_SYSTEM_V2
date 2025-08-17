/*
 * Smart Bell Scheduler - HARDWARE TEST FIRMWARE v1.4 (User-Friendly Edition)
 *
 * CHANGELOG v1.4:
 * - Improved User Guidance: Comments now explicitly direct you to the 'Connection'
 *   page in the app, where you can easily copy the correct Schedule ID.
 * - Retained all robust error handling and timeout features from v1.3.
*/

// LIBRARIES
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

// =================================================================
// >>>>>>>>>> USER CONFIGURATION - FILL IN YOUR DETAILS HERE <<<<<<<<<<
// =================================================================

// STEP 1: Go to the "Connection" page in the Smart Bell Scheduler app.
// STEP 2: Select a schedule from the dropdown menu.
// STEP 3: The Schedule ID will appear. Click the 'Copy' button next to it.
// STEP 4: Paste the copied ID below, replacing "YOUR_SCHEDULE_ID".

const char* WIFI_SSID = "YOUR_WIFI_SSID";         // <-- REPLACE with your WiFi network name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // <-- REPLACE with your WiFi password
const char* SCHEDULE_ID = "YOUR_SCHEDULE_ID";     // <-- PASTE the ID from the app here

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
  
  WiFiClient client;
  HTTPClient http;

  if (http.begin(client, SUPABASE_EDGE_URL)) {
    http.setTimeout(10000); // Set a 10-second timeout for the request
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
        Serial.println("[HINT] Bad Request (400). The server rejected the data. This can happen if the SCHEDULE_ID is an empty string or invalid.");
      } else if (httpCode == 404) {
        Serial.println("[HINT] Not Found (404). The SCHEDULE_ID you provided does not exist in the database. Please double-check it.");
      } else if (httpCode == -11) { // HTTPC_ERROR_READ
        Serial.println("[HINT] Read Timeout (-11). The device connected to the server but failed to read the response in time. This is usually a temporary network issue. It will try again.");
      } else if (httpCode < 0) {
        Serial.println("[HINT] This is a client-side error. Check your WiFi connection and ensure the server URL is correct.");
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
  Serial.println("\n\n[INFO] Hardware Test Firmware v1.4");

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
    Serial.println(" - SCHEDULE_ID (Find this in the app's Connection page!)");
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