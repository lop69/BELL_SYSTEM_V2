/*
 * Smart Bell Scheduler - HARDWARE TEST FIRMWARE v1.0
 *
 * PURPOSE:
 * This is a simplified firmware designed ONLY for testing the bell hardware.
 * It connects directly to your WiFi and listens for the "Test Bell" command
 * from the web app's dashboard. It does NOT handle regular schedules.
 *
 * HOW TO USE:
 * 1. FILL IN YOUR DETAILS in the "USER CONFIGURATION" section below.
 *    - Your WiFi Network Name (SSID)
 *    - Your WiFi Password
 *    - A valid Schedule ID from your application's database.
 * 2. Upload this code to your ESP8266.
 * 3. Open the Serial Monitor in the Arduino IDE (baud rate 115200).
 * 4. The device will connect to your WiFi.
 * 5. Go to your web app's dashboard and press the "Test Bell" button.
 * 6. The bell should ring for 5 seconds.
 *
 * REQUIRED LIBRARIES (Install via Arduino IDE Library Manager):
 * 1. ArduinoJson (by Benoit Blanchon)
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
  Serial.println("[BELL] Test signal received! Ringing bell for 5 seconds.");
  digitalWrite(LED_PIN, LOW); // LED On (indicates activity)
  digitalWrite(BELL_PIN, HIGH);
  delay(5000); // Ring for 5 seconds for the test
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
      Serial.printf("[ERROR] HTTP request failed, code: %d\n", httpCode);
    }
    http.end();
  } else {
    Serial.println("[ERROR] Unable to begin HTTP connection.");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n[INFO] Hardware Test Firmware v1.0");

  pinMode(BELL_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH);

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