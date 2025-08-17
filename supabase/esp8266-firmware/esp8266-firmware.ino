/*
 * =================================================================
 * Smart Bell Scheduler - Main Firmware v3.0
 * =================================================================
 *
 * This firmware connects your ESP8266 device to the Smart Bell
 * Scheduler application via Supabase.
 *
 * Features:
 * - WiFiManager for easy, on-the-fly configuration.
 * - Fetches bell schedules from a Supabase Edge Function.
 * - Synchronizes time using an NTP server.
 * - Rings a relay/bell at scheduled times.
 * - Checks for a global test signal.
 *
 * Required Libraries (Install via Arduino Library Manager):
 * 1. WiFiManager by tzapu
 * 2. ArduinoJson by bblanchon
 *
 * =================================================================
 * HOW IT WORKS:
 * =================================================================
 *
 * 1. First Boot (Configuration Mode):
 *    - The ESP8266 creates a WiFi network called "SmartBell-Config".
 *    - Connect to this network with your phone/computer (password: "password").
 *    - A configuration portal will open automatically (or go to 192.168.4.1).
 *    - Enter your home/school WiFi credentials, the Schedule ID from the app,
 *      and a name for this device.
 *    - The device will save these details and restart.
 *
 * 2. Normal Operation:
 *    - The device connects to your specified WiFi network.
 *    - It syncs the time with an NTP server.
 *    - Every 5 minutes, it calls the Supabase Edge Function to get the latest
 *      bell schedule for its assigned Schedule ID.
 *    - It continuously checks the current time against the schedule.
 *    - When a bell time is reached on a correct day of the week, it activates
 *      the bell relay for a few seconds.
 *    - It also checks for the global test signal every 10 seconds.
 *
 * =================================================================
 */

// LIBRARIES
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>
#include <time.h>

// =================================================================
// PIN CONFIGURATION
// =================================================================
const int BELL_PIN = D1;      // Pin connected to the relay module
const int LED_PIN = LED_BUILTIN; // Built-in LED for status

// =================================================================
// SUPABASE CONFIGURATION (DO NOT CHANGE THESE)
// =================================================================
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcmdiY2ZpZGdneGlvaXp2a2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDgzOTUsImV4cCI6MjA3MDkyNDM5NX0.eTzeTrcYRG3JemHh-N-rSRcHkMAdp2Afnt20Ft---ZA";
const char* BELL_SYNC_URL = "https://tkrgbcfidggxioizvkeq.supabase.co/functions/v1/bell-sync";
const char* GLOBAL_TEST_URL = "https://tkrgbcfidggxioizvkeq.supabase.co/functions/v1/global-test-bell";

// =================================================================
// TIME & SYNC CONFIGURATION
// =================================================================
const char* NTP_SERVER = "pool.ntp.org";
const long  GMT_OFFSET_SEC = 19800; // India Standard Time (UTC +5:30)
const int   DAYLIGHT_OFFSET_SEC = 0;
unsigned long lastSyncTime = 0;
const long syncInterval = 5 * 60 * 1000; // 5 minutes
unsigned long lastTestCheck = 0;
const long testCheckInterval = 10000; // 10 seconds

// =================================================================
// GLOBAL VARIABLES
// =================================================================
char schedule_id[37] = ""; // UUID is 36 chars + null terminator
char device_name[40] = "";

struct Bell {
  int hour;
  int minute;
  bool days[7]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
};

Bell bellSchedule[20]; // Max 20 bells per schedule
int bellCount = 0;
int lastMinuteChecked = -1;

// =================================================================
// FUNCTIONS
// =================================================================

void ringBell(int duration_ms) {
  Serial.println("[BELL] Ringing bell!");
  digitalWrite(LED_PIN, LOW); // Turn LED ON
  digitalWrite(BELL_PIN, HIGH);
  delay(duration_ms);
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH); // Turn LED OFF
}

void setupWiFiManager() {
  WiFiManager wm;
  wm.setDebugOutput(true);

  // Custom parameters for Schedule ID and Device Name
  WiFiManagerParameter custom_schedule_id("schedule_id", "Schedule ID from App", schedule_id, 37);
  WiFiManagerParameter custom_device_name("device_name", "Device Name", device_name, 40);
  wm.addParameter(&custom_schedule_id);
  wm.addParameter(&custom_device_name);

  wm.setTitle("SmartBell-Config");
  wm.setAPStaticIPConfig(IPAddress(192,168,4,1), IPAddress(192,168,4,1), IPAddress(255,255,255,0));
  
  Serial.println("[WiFiManager] Starting configuration portal.");
  digitalWrite(LED_PIN, LOW); // Turn on LED to indicate config mode
  
  if (!wm.autoConnect("SmartBell-Config", "password")) {
    Serial.println("[WiFiManager] Failed to connect and hit timeout. Resetting...");
    ESP.reset();
    delay(1000);
  }
  
  digitalWrite(LED_PIN, HIGH); // Turn off LED
  Serial.println("[WiFiManager] Connected to WiFi!");

  // Save the custom parameters
  strcpy(schedule_id, custom_schedule_id.getValue());
  strcpy(device_name, custom_device_name.getValue());

  Serial.print("[WiFiManager] Schedule ID: ");
  Serial.println(schedule_id);
  Serial.print("[WiFiManager] Device Name: ");
  Serial.println(device_name);
}

void syncTime() {
  Serial.println("[TIME] Syncing time with NTP server...");
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("[ERROR] Failed to obtain time.");
    return;
  }
  Serial.print("[TIME] Current time: ");
  Serial.println(asctime(&timeinfo));
}

void syncWithSupabase() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] WiFi not connected. Skipping sync.");
    return;
  }

  Serial.println("[SYNC] Syncing with Supabase...");
  
  // Use WiFiClientSecure for HTTPS
  std::unique_ptr<BearSSL::WiFiClientSecure>client(new BearSSL::WiFiClientSecure);
  client->setInsecure(); // IMPORTANT: Bypass SSL certificate validation
  
  HTTPClient http;

  if (http.begin(*client, BELL_SYNC_URL)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_ANON_KEY);
    http.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));

    // Create JSON body
    JsonDocument doc;
    doc["schedule_id"] = schedule_id;
    String requestBody;
    serializeJson(doc, requestBody);

    int httpCode = http.POST(requestBody);

    if (httpCode == HTTP_CODE_OK) {
      Serial.println("[SYNC] Successfully fetched schedule.");
      JsonDocument responseDoc;
      DeserializationError error = deserializeJson(responseDoc, http.getString());

      if (error) {
        Serial.print(F("[ERROR] deserializeJson() failed: "));
        Serial.println(error.f_str());
        return;
      }

      bellCount = 0;
      JsonArray bells = responseDoc["bells"].as<JsonArray>();
      for (JsonObject bell_obj : bells) {
        if (bellCount >= 20) break;
        
        const char* time_str = bell_obj["time"]; // "HH:MM:SS"
        sscanf(time_str, "%d:%d", &bellSchedule[bellCount].hour, &bellSchedule[bellCount].minute);

        JsonArray days = bell_obj["days_of_week"].as<JsonArray>();
        for(int i=0; i<7; i++) bellSchedule[bellCount].days[i] = false; // Reset days
        for(JsonVariant day : days) {
          bellSchedule[bellCount].days[day.as<int>()] = true;
        }
        bellCount++;
      }
      Serial.printf("[SYNC] Parsed %d bells for schedule '%s'.\n", bellCount, responseDoc["schedule_name"].as<const char*>());

    } else {
      Serial.printf("[ERROR] HTTP POST failed. Status Code: %d\n", httpCode);
      Serial.println("[ERROR] Server Response: " + http.getString());
    }
    http.end();
  } else {
    Serial.println("[ERROR] Unable to begin HTTP connection.");
  }
}

void checkGlobalTest() {
    if (WiFi.status() != WL_CONNECTED) return;

    std::unique_ptr<BearSSL::WiFiClientSecure>client(new BearSSL::WiFiClientSecure);
    client->setInsecure();
    HTTPClient http;

    if (http.begin(*client, GLOBAL_TEST_URL)) {
        http.addHeader("apikey", SUPABASE_ANON_KEY);
        int httpCode = http.GET();
        if (httpCode == HTTP_CODE_OK) {
            JsonDocument doc;
            deserializeJson(doc, http.getString());
            if (doc["test_bell_active"].as<bool>()) {
                Serial.println("[TEST] Global test signal is active!");
                ringBell(30000); // Ring for 30 seconds for a test
            }
        }
        http.end();
    }
}


void checkSchedule() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return; // Can't check schedule if we don't know the time
  }

  int currentHour = timeinfo.tm_hour;
  int currentMinute = timeinfo.tm_min;
  int currentDayOfWeek = timeinfo.tm_wday; // Sunday = 0, Saturday = 6

  if (currentMinute == lastMinuteChecked) {
    return; // Already checked this minute
  }
  lastMinuteChecked = currentMinute;

  Serial.printf("[CHECK] Time: %02d:%02d, Day: %d. Checking %d bells.\n", currentHour, currentMinute, currentDayOfWeek, bellCount);

  for (int i = 0; i < bellCount; i++) {
    if (bellSchedule[i].hour == currentHour && bellSchedule[i].minute == currentMinute) {
      if (bellSchedule[i].days[currentDayOfWeek]) {
        Serial.printf("[MATCH] Bell %d matched schedule. Ringing!\n", i);
        ringBell(3000); // Ring for 3 seconds for a scheduled bell
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n[INFO] Smart Bell Scheduler Firmware v3.0");

  pinMode(BELL_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BELL_PIN, LOW);
  digitalWrite(LED_PIN, HIGH); // LED off

  setupWiFiManager();
  syncTime();
  syncWithSupabase();
  lastSyncTime = millis();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Connection lost. Attempting to reconnect...");
    // WiFiManager should handle reconnects, but we can force a check or reset
    // For now, we'll just wait. A watchdog timer would be good here in a future version.
    delay(5000);
    return;
  }

  // Check for schedule sync
  if (millis() - lastSyncTime >= syncInterval) {
    syncWithSupabase();
    lastSyncTime = millis();
  }

  // Check for global test signal more frequently
  if (millis() - lastTestCheck >= testCheckInterval) {
      checkGlobalTest();
      lastTestCheck = millis();
  }

  // Check if a bell needs to ring
  checkSchedule();

  delay(1000); // Main loop delay
}