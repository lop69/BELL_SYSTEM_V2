/*
  Smart Bell Scheduler - Simplified Firmware (API v2)
  ---------------------------------------------------
  This firmware is pre-configured to connect directly to your Wi-Fi and Supabase.
  The complex setup process has been removed for simplicity.

  --- ACTION REQUIRED ---
  1. Fill in your Wi-Fi network name (SSID) and password below.
  2. Create a device in your Supabase 'devices' table.
  3. Copy the 'id' of that device and paste it into the DEVICE_ID field below.
  4. Upload this code to your ESP8266.
*/

// --- START CONFIGURATION ---
#define WIFI_SSID "OnePlus Nord CE4 5g"
#define WIFI_PASSWORD "loplop@007"
#define DEVICE_ID "c18d2575-e72d-455e-b126-7c91884fdb99"
// --- END CONFIGURATION ---

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h> // Required for HTTPS
#include <ArduinoJson.h>

// Supabase credentials (Hardcoded for this project)
const char* SUPABASE_URL = "https://tkrgbcfidggxioizvkeq.supabase.co";
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcmdiY2ZpZGdneGlvaXp2a2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDgzOTUsImV4cCI6MjA3MDkyNDM5NX0.eTzeTrcYRG3JemHh-N-rSRcHkMAdp2Afnt20Ft---ZA";
String EDGE_FUNCTION_URL = String(SUPABASE_URL) + "/functions/v1/bell-sync";
String TEST_BELL_URL = String(SUPABASE_URL) + "/functions/v1/global-test-bell";


// Pin Configuration
const int RELAY_PIN = D1; // Relay connected to D1 pin

// Timing variables
unsigned long lastSyncTime = 0;
const long syncInterval = 30000; // Sync every 30 seconds

// Schedule storage
JsonArray bells;
String scheduleName = "None";

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Ensure relay is off initially

  connectToWiFi();
  
  // Set up time - crucial for schedule checking
  configTime(19800, 0, "pool.ntp.org", "time.nist.gov"); // IST timezone (GMT+5:30)
  Serial.println("\nWaiting for time synchronization");
  while (time(nullptr) < 1510644967) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nTime synchronized");

  fetchSchedule(); // Initial fetch
}

void loop() {
  unsigned long currentMillis = millis();

  // Periodically sync the schedule with Supabase
  if (currentMillis - lastSyncTime >= syncInterval) {
    lastSyncTime = currentMillis;
    fetchSchedule();
    checkTestBell();
  }

  // Check if any bells should be rung
  checkSchedule();

  delay(1000); // Check every second
}

void connectToWiFi() {
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void fetchSchedule() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot fetch schedule.");
    return;
  }

  Serial.println("Fetching schedule from Supabase...");

  // Use WiFiClientSecure for HTTPS connections
  WiFiClientSecure client;
  HTTPClient http;
  
  // This is needed for HTTPS requests without certificate validation
  client.setInsecure();

  http.begin(client, EDGE_FUNCTION_URL); // Corrected API call
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);

  String payload = "{\"device_id\":\"" + String(DEVICE_ID) + "\"}";
  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Response: " + response);

    DynamicJsonDocument doc(2048);
    DeserializationError error = deserializeJson(doc, response);

    if (error) {
      Serial.print("deserializeJson() failed: ");
      Serial.println(error.c_str());
      return;
    }

    scheduleName = doc["schedule_name"].as<String>();
    bells = doc["bells"].as<JsonArray>();
    Serial.println("Schedule '" + scheduleName + "' synced successfully.");

  } else {
    Serial.print("HTTP POST failed, error: ");
    Serial.println(http.errorToString(httpCode).c_str());
  }

  http.end();
}

void checkSchedule() {
  if (!bells || bells.size() == 0) {
    return; // No bells to check
  }

  time_t now = time(nullptr);
  struct tm* timeinfo = localtime(&now);

  int currentDay = timeinfo->tm_wday; // 0=Sun, 1=Mon, ...
  int currentHour = timeinfo->tm_hour;
  int currentMinute = timeinfo->tm_min;
  int currentSecond = timeinfo->tm_sec;

  // Only check once per minute to avoid multiple rings
  if (currentSecond != 0) {
    return;
  }

  for (JsonObject bell : bells) {
    String timeStr = bell["time"]; // "HH:MM:SS"
    int bellHour = timeStr.substring(0, 2).toInt();
    int bellMinute = timeStr.substring(3, 5).toInt();

    if (bellHour == currentHour && bellMinute == currentMinute) {
      JsonArray days = bell["days_of_week"];
      for (int day : days) {
        if (day == currentDay) {
          Serial.print("Ringing bell for: ");
          Serial.println(bell["label"].as<String>());
          ringBell();
          break; // Ring only once even if multiple conditions match
        }
      }
    }
  }
}

void checkTestBell() {
    if (WiFi.status() != WL_CONNECTED) {
        return;
    }

    // Use WiFiClientSecure for HTTPS connections
    WiFiClientSecure client;
    HTTPClient http;

    // This is needed for HTTPS requests without certificate validation
    client.setInsecure();

    http.begin(client, TEST_BELL_URL); // Corrected API call
    http.addHeader("apikey", SUPABASE_ANON_KEY);
    int httpCode = http.GET();

    if (httpCode == HTTP_CODE_OK) {
        String response = http.getString();
        DynamicJsonDocument doc(256);
        deserializeJson(doc, response);
        if (doc["test_bell_active"] == true) {
            Serial.println("Global test bell signal received. Ringing bell.");
            ringBell();
        }
    }
    http.end();
}


void ringBell() {
  digitalWrite(RELAY_PIN, HIGH);
  delay(30000); // Ring for 30 seconds
  digitalWrite(RELAY_PIN, LOW);
}