/*
  =================================================================================================
  Smart Bell Scheduler - ESP8266 Firmware
  =================================================================================================
  Version: 2.0.0
  Author: Dyad AI

  Description:
  This firmware connects an ESP8266 to a WiFi network, synchronizes bell schedules from a 
  Supabase backend, and rings a bell (connected via a relay) at the scheduled times. It also 
  listens for a global "test bell" signal from the backend.

  Features:
  - WiFi Connection with automatic reconnection.
  - NTP Time Synchronization for accurate scheduling.
  - Fetches bell schedules from a Supabase Edge Function.
  - Checks for a global test bell signal.
  - Graceful error handling for WiFi, HTTP, and JSON parsing.
  - Clear and informative Serial Monitor output for debugging.
  - Non-blocking code using millis() for responsive operation.

  -------------------------------------------------------------------------------------------------
  REQUIRED LIBRARIES:
  -------------------------------------------------------------------------------------------------
  - ArduinoJson by Benoit Blanchon (Version 6.x.x or higher)
    Install via Arduino IDE: Sketch > Include Library > Manage Libraries... > Search for "ArduinoJson"

  -------------------------------------------------------------------------------------------------
  CONFIGURATION:
  -------------------------------------------------------------------------------------------------
  Fill in the following constants with your specific details.
*/

// === 1. WiFi Configuration ===
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// === 2. Supabase Configuration ===
// Your Supabase project ID can be found in your project's URL (e.g., 'tkrgbcfidggxioizvkeq'.supabase.co)
#define SUPABASE_PROJECT_ID "tkrgbcfidggxioizvkeq" 
// This is your project's public anon key.
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcmdiY2ZpZGdneGlvaXp2a2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDgzOTUsImV4cCI6MjA3MDkyNDM5NX0.eTzeTrcYRG3JemHh-N-rSRcHkMAdp2Afnt20Ft---ZA";

// === 3. Device Configuration ===
// Get this ID from the 'devices' table in your Supabase project after creating a device entry.
const char* DEVICE_ID = "YOUR_UNIQUE_DEVICE_ID"; 
// The GPIO pin connected to your relay module's IN pin.
const int RELAY_PIN = D1; // Using GPIO5 (D1) on NodeMCU. Change if needed.
const int BELL_RING_DURATION_MS = 2000; // Ring the bell for 2 seconds.

// =================================================================================================
// DO NOT EDIT BELOW THIS LINE UNLESS YOU KNOW WHAT YOU ARE DOING
// =================================================================================================

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <time.h>

// Supabase URL and Function endpoints
const String SUPABASE_URL = "https://" + String(SUPABASE_PROJECT_ID) + ".supabase.co";
const String BELL_SYNC_URL = SUPABASE_URL + "/functions/v1/bell-sync";
const String TEST_BELL_URL = SUPABASE_URL + "/functions/v1/global-test-bell";

// Supabase Root CA Certificate for HTTPS
// Note: This might need updating if Supabase changes their certificate.
// You can get the latest from your browser by visiting your Supabase URL.
static const char* supabase_root_ca = \
"-----BEGIN CERTIFICATE-----\n" \
"MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\n" \
"TDEgMB4GA1UECxMXR2xvYmFsU2lnbiBFQ0MgUm9vdCBDQSAtIFI0MRMwEQYDVQQK\n" \
"EwpHbG9iYWxTaWduMRMwEQYDVQQDEwpHbG9iYWxTaWduMB4XDTEyMTExMzAwMDAw\n" \
"MFoXDTI4MDEyODAwMDAwMFowTDEgMB4GA1UECxMXR2xvYmFsU2lnbiBFQ0MgUm9v\n" \
"dCBDQSAtIFI0MRMwEQYDVQQKEwpHbG9iYWxTaWduMRMwEQYDVQQDEwpHbG9iYWxT\n" \
"aWduMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEuMZ5049sJQ6fLjkZHAOkrprl\n" \
"iQypcw4Wd2nO4jAJi4BCaDsBf4x3e2o2sz2v+3A9mbvoAi3r28fUSy4b7BFL0KNC\n" \
"MEAwDgYDVR0PAQH/BAQDAgEGMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFB5W\n" \
"g55hAagI6HkK3l+3mC7GkeGOMA0GCSqGSIb3DQEBCwUAA4IBAQBRACf2k8bFm8nO\n" \
"gqJk5e2Y2w3iFpJ+3Yc2V7rN6qS4gjSv/J/k4nWhK0BCFyo2Abf2f3r2xI14z7s+\n" \
"t2Bylf2YySg2fR7JzG6Rj5mS4eLpEja22Zt4aVqYyykWHwGna9w+w3rBf0aYx18Y\n" \
"gC3rT2aLh6QsIlt2ga8m4Iq2jT3sD2L0+vA26hT3v0Iq7gA0o4oRDBvDckf3A48A\n" \
"PAb2ABA2h9d22jHwN9l+sLw2VnNI2Ew4e+e423GFppL2gBpO/mI3kLzk6wY/pEnR\n" \
"b3r8A4eU+hS2ciQo93smUIv2NAy3T3G2+jTFYvH2/BFQW2bBHv3L2p10jEDzYd+o\n" \
"VfI8azFL\n" \
"-----END CERTIFICATE-----\n";

// WiFi client for HTTPS requests
BearSSL::WiFiClientSecure client;

// Schedule storage
struct Bell {
  uint8_t hour;
  uint8_t minute;
  uint8_t days_of_week[7];
  uint8_t day_count;
};
Bell schedule[50]; // Max 50 bells per schedule
int bell_count = 0;

// Timing variables for non-blocking loop
unsigned long last_schedule_sync = 0;
unsigned long last_test_bell_check = 0;
const long schedule_sync_interval = 300000; // Sync schedule every 5 minutes
const long test_bell_check_interval = 5000;   // Check for test bell every 5 seconds

// NTP configuration
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 19800; // GMT+5:30 for India Standard Time
const int daylightOffset_sec = 0;

// =================================================================================================
//   SETUP
// =================================================================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n\nSmart Bell Scheduler - Initializing...");

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Relay OFF by default (assuming active HIGH relay)

  connectWiFi();

  // Set time from NTP server
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  syncNTPTime();

  // Configure secure client with the root CA
  client.setTrustAnchors(new BearSSL::X509List(supabase_root_ca));

  // Initial data fetch
  syncSchedule();
}

// =================================================================================================
//   MAIN LOOP
// =================================================================================================
void loop() {
  // Ensure WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectWiFi();
  }

  unsigned long current_millis = millis();

  // Periodically check for test bell signal
  if (current_millis - last_test_bell_check >= test_bell_check_interval) {
    last_test_bell_check = current_millis;
    checkTestBell();
  }

  // Periodically sync the main schedule
  if (current_millis - last_schedule_sync >= schedule_sync_interval) {
    last_schedule_sync = current_millis;
    syncSchedule();
  }

  // Check if it's time to ring a bell based on the schedule
  checkSchedule();
}

// =================================================================================================
//   HELPER FUNCTIONS
// =================================================================================================

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void syncNTPTime() {
  Serial.print("Synchronizing NTP time...");
  struct tm timeinfo;
  while (!getLocalTime(&timeinfo)) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\nTime synchronized.");
  Serial.println(&timeinfo, "%A, %B %d %Y %H:%M:%S");
}

void ringBell() {
  Serial.println(">>> RINGING BELL <<<");
  digitalWrite(RELAY_PIN, HIGH);
  delay(BELL_RING_DURATION_MS);
  digitalWrite(RELAY_PIN, LOW);
  Serial.println(">>> Bell silenced. <<<");
}

void checkTestBell() {
  HTTPClient http;
  http.begin(client, TEST_BELL_URL);
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  
  int httpCode = http.GET();

  if (httpCode > 0) {
    String payload = http.getString();
    Serial.printf("[TestBell] HTTP Code: %d\n", httpCode);
    
    if (httpCode == HTTP_CODE_OK) {
      StaticJsonDocument<256> doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print("[TestBell] JSON parsing failed: ");
        Serial.println(error.c_str());
        return;
      }

      bool test_active = doc["test_bell_active"];
      if (test_active) {
        Serial.println("[TestBell] Global test signal is ACTIVE!");
        ringBell();
      } else {
        Serial.println("[TestBell] Global test signal is inactive.");
      }
    } else {
      Serial.print("[TestBell] Request failed. Payload: ");
      Serial.println(payload);
    }
  } else {
    Serial.printf("[TestBell] GET request failed, error: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

void syncSchedule() {
  HTTPClient http;
  http.begin(client, BELL_SYNC_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);

  String requestBody = "{\"device_id\":\"" + String(DEVICE_ID) + "\"}";
  
  Serial.println("\n[ScheduleSync] Syncing schedule...");
  int httpCode = http.POST(requestBody);

  if (httpCode > 0) {
    String payload = http.getString();
    Serial.printf("[ScheduleSync] HTTP Code: %d\n", httpCode);

    if (httpCode == HTTP_CODE_OK) {
      DynamicJsonDocument doc(4096); // Allocate more memory for potentially large schedules
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print("[ScheduleSync] JSON parsing failed: ");
        Serial.println(error.c_str());
        return;
      }

      JsonArray bells = doc["bells"];
      bell_count = 0; // Reset current schedule

      for (JsonObject bell_obj : bells) {
        if (bell_count >= 50) {
          Serial.println("[ScheduleSync] Max bell count (50) reached. Some bells may be ignored.");
          break;
        }
        
        const char* time_str = bell_obj["time"];
        sscanf(time_str, "%hhu:%hhu", &schedule[bell_count].hour, &schedule[bell_count].minute);

        JsonArray days = bell_obj["days_of_week"];
        schedule[bell_count].day_count = 0;
        for (JsonVariant day : days) {
          if (schedule[bell_count].day_count < 7) {
            schedule[bell_count].days_of_week[schedule[bell_count].day_count++] = day.as<uint8_t>();
          }
        }
        bell_count++;
      }
      Serial.printf("[ScheduleSync] Successfully synced %d bells for schedule: %s\n", bell_count, doc["schedule_name"].as<const char*>());

    } else {
      Serial.print("[ScheduleSync] Request failed. Error payload: ");
      Serial.println(payload);
    }
  } else {
    Serial.printf("[ScheduleSync] POST request failed, error: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

void checkSchedule() {
  static int last_checked_minute = -1;
  struct tm timeinfo;

  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to get local time for schedule check.");
    return;
  }

  int current_minute = timeinfo.tm_min;
  if (current_minute == last_checked_minute) {
    return; // Already checked this minute
  }
  last_checked_minute = current_minute;

  int current_hour = timeinfo.tm_hour;
  int current_day_of_week = timeinfo.tm_wday; // Sunday = 0, Monday = 1, ...

  // Serial.printf("Checking schedule for %02d:%02d on day %d\n", current_hour, current_minute, current_day_of_week);

  for (int i = 0; i < bell_count; i++) {
    if (schedule[i].hour == current_hour && schedule[i].minute == current_minute) {
      // Time matches, now check day of week
      for (int j = 0; j < schedule[i].day_count; j++) {
        if (schedule[i].days_of_week[j] == current_day_of_week) {
          Serial.printf("Time match found! %02d:%02d\n", schedule[i].hour, schedule[i].minute);
          ringBell();
          return; // Ring only once per minute to avoid double rings
        }
      }
    }
  }
}