/*
 * Smart Bell Scheduler - HARDWARE TEST FIRMWARE v1.7 (Schedule-Based Testing)
 *
 * CHANGELOG v1.7:
 * - Removed USER_ID requirement. Testing is now based on SCHEDULE_ID.
 * - This makes the test firmware much easier to configure.
 * - Updated instructions to guide user to find the Schedule ID in the app.
*/

// LIBRARIES
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>

// =================================================================
// >>>>>>>>>> USER CONFIGURATION - FILL IN YOUR DETAILS HERE <<<<<<<<<<
// =================================================================

// STEP 1: Open the Smart Bell Scheduler app and go to the 'Connection' page.
// STEP 2: In 'Step 2: Send Configuration', select the schedule you want this device to run.
// STEP 3: A box will appear showing the 'Selected Schedule ID'.
// STEP 4: Copy this ID and paste it below, replacing "YOUR_SCHEDULE_ID".

const char* WIFI_SSID = "YOUR_WIFI_SSID";         // <-- REPLACE with your WiFi network name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";     // <-- REPLACE with your WiFi password
const char* SCHEDULE_ID = "YOUR_SCHEDULE_ID";       // <-- PASTE your Schedule ID from the app here

// =================================================================
// SUPABASE CONFIGURATION (DO NOT CHANGE)
// =================================================================

const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcmdiY2ZpZGdneGlvaXp2a2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDgzOTUsImV4cCI6MjA3MDkyNDM5NX0.eTzeTrcYRG3JemHh-N-rSRcHkMAdp2Afnt20Ft---ZA";
const char* SUPABASE_EDGE_URL = "https://tkrgbcfidggxioizvkeq.supabase.co/functions/v1/test-bell-check";

// =================================================================

const int BELL_PIN = D1;
const int LED_PIN = LED_BUILTIN;
unsigned long lastSyncTime = 0;
const long syncInterval = 5000;

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
  digitalWrite(LED_PIN, HIGH);
}

void ringTestBell() {
  Serial.println("[BELL] Test signal received! Ringing bell for 30 seconds.");
  digitalWrite(LED_PIN, LOW);
  digitalWrite(BELL_PIN, HIGH);
  delay(30000);
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH);
  Serial.println("[BELL] Test complete.");
}

void checkTestBellStatus() {
  if (WiFi.status() != WL_CONNECTED) return;
  Serial.println("[SYNC] Checking for test signal...");
  
  WiFiClientSecure client;
  HTTPClient http;
  client.setInsecure();

  if (http.begin(client, SUPABASE_EDGE_URL)) {
    http.setTimeout(10000);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_ANON_KEY);
    http.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));

    JsonDocument requestBody;
    requestBody["schedule_id"] = SCHEDULE_ID; // Use schedule_id now
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
      Serial.println("[ERROR] Server Response: " + http.getString());
    }
    http.end();
  } else {
    Serial.println("[ERROR] Unable to begin HTTP connection.");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n[INFO] Hardware Test Firmware v1.7");

  pinMode(BELL_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH);

  if (strcmp(WIFI_SSID, "YOUR_WIFI_SSID") == 0 || 
      strcmp(WIFI_PASSWORD, "YOUR_WIFI_PASSWORD") == 0 || 
      strcmp(SCHEDULE_ID, "YOUR_SCHEDULE_ID") == 0) {
    Serial.println("\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    Serial.println("[FATAL ERROR] Configuration placeholders detected.");
    Serial.println("Please open 'test-bell.ino' and replace placeholders.");
    Serial.println("You can find the SCHEDULE_ID on the Connection page of the app.");
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