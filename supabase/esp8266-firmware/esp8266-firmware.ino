/*
  Smart Bell Scheduler - ESP8266 Firmware

  This code connects your ESP8266 device to Supabase to listen for a "Test Bell" signal.
  
  SETUP INSTRUCTIONS:
  1. Open this file in the Arduino IDE.
  2. Install the required libraries:
     - Go to Sketch > Include Library > Manage Libraries...
     - Search for and install "ArduinoJson" by Benoit Blanchon.
     - Search for and install "ESP8266HTTPClient" (usually comes with the ESP8266 board manager).
  3. Fill in your WiFi credentials, User ID, and the pin connected to your bell relay below.
  4. Upload the code to your ESP8266.
*/

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

// --- IMPORTANT: CONFIGURE THESE VALUES ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Find this in your Supabase Dashboard: Authentication > Users > Copy User UID
String userId = "YOUR_SUPABASE_USER_ID"; 

// The GPIO pin on your ESP8266 connected to the bell relay or an LED for testing.
const int bellPin = D1; 
// -----------------------------------------

// --- Supabase Project Details (Pre-filled) ---
String supabaseUrl = "https://tkrgbcfidggxioizvkeq.supabase.co";
String supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcmdiY2ZpZGdneGlvaXp2a2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDgzOTUsImV4cCI6MjA3MDkyNDM5NX0.eTzeTrcYRG3JemHh-N-rSRcHkMAdp2Afnt20Ft---ZA";
// ---------------------------------------------

// Use a WiFiClientSecure object to handle HTTPS requests
WiFiClientSecure client;

void setup() {
  Serial.begin(115200);
  pinMode(bellPin, OUTPUT);
  digitalWrite(bellPin, LOW); // Ensure bell is off by default

  // Allow insecure connections for ESP8266 compatibility with Supabase certs
  client.setInsecure();

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  checkTestBellStatus();
  delay(3000); // Check the status every 3 seconds
}

void checkTestBellStatus() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Construct the URL to query the 'test_bells' table for our specific user
    String url = supabaseUrl + "/rest/v1/test_bells?select=is_active&user_id=eq." + userId + "&is_active=eq.true";
    
    http.begin(client, url); // Use the secure client
    http.addHeader("apikey", supabaseAnonKey);
    http.addHeader("Authorization", "Bearer " + supabaseAnonKey);

    int httpCode = http.GET();

    if (httpCode == HTTP_CODE_OK) {
      String payload = http.getString();
      Serial.println("Response: " + payload);

      // The response is a JSON array. If it's not empty ("[]"), the bell should be active.
      if (payload != "[]") {
        Serial.println("Test bell is ACTIVE. Ringing bell...");
        digitalWrite(bellPin, HIGH); // Turn the bell ON
      } else {
        Serial.println("Test bell is INACTIVE.");
        digitalWrite(bellPin, LOW); // Turn the bell OFF
      }
    } else {
      Serial.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpCode).c_str());
    }
    
    http.end();
  } else {
    Serial.println("WiFi disconnected. Attempting to reconnect...");
  }
}