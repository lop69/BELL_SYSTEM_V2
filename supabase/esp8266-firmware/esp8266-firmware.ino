#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <DNSServer.h>
#include <WiFiManager.h> // https://github.com/tzapu/WiFiManager
#include <ArduinoJson.h> // https://github.com/bblanchon/ArduinoJson
#include <NTPClient.h>   // https://github.com/arduino-libraries/NTPClient
#include <WiFiUdp.h>
#include <HTTPClient.h>

// Define your bell pin (e.g., D1 on NodeMCU, GPIO5)
const int BELL_PIN = D1; 

// NTP Client
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000); // UTC offset 0, update every 60 seconds

// Web Server for configuration and status
ESP8266WebServer server(80);
DNSServer dns;

// WiFiManager custom parameters
char supabase_edge_function_url[256];
char supabase_user_id[64];

// Bell schedule data (fetched from Edge Function)
struct Bell {
  String schedule_id;
  String time; // HH:MM format
  String label;
  int days_of_week[7]; // 0=Sun, 1=Mon, ..., 6=Sat
  int num_days;
};

Bell bells[20]; // Max 20 bells
int numBells = 0;
bool testBellActive = false;
unsigned long testBellStartTime = 0;
const unsigned long TEST_BELL_DURATION_MS = 30 * 1000; // 30 seconds

unsigned long lastScheduleFetchTime = 0;
const unsigned long SCHEDULE_FETCH_INTERVAL_MS = 5 * 60 * 1000; // Fetch every 5 minutes

void setup() {
  Serial.begin(115200);
  pinMode(BELL_PIN, OUTPUT);
  digitalWrite(BELL_PIN, LOW); // Ensure bell is off initially

  // WiFiManager setup
  WiFiManager wifiManager;
  
  // Add custom parameters for Supabase Edge Function URL and User ID
  WiFiManagerParameter custom_edge_function_url("edge_url", "Supabase Edge Function URL", supabase_edge_function_url, 255);
  WiFiManagerParameter custom_user_id("user_id", "Supabase User ID", supabase_user_id, 63);
  
  wifiManager.addParameter(&custom_edge_function_url);
  wifiManager.addParameter(&custom_user_id);

  // Set callback for saving configuration
  wifiManager.setSaveConfigCallback(saveConfigCallback);

  // Try to connect to WiFi, if not configured, start AP
  if (!wifiManager.autoConnect("SmartBellSetupAP")) {
    Serial.println("Failed to connect and timed out.");
    delay(3000);
    ESP.reset();
    delay(5000);
  }

  // Copy custom parameters to global variables
  strcpy(supabase_edge_function_url, custom_edge_function_url.getValue());
  strcpy(supabase_user_id, custom_user_id.getValue());

  Serial.println("Connected to WiFi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Edge Function URL: ");
  Serial.println(supabase_edge_function_url);
  Serial.print("User ID: ");
  Serial.println(supabase_user_id);

  // Start NTP client
  timeClient.begin();
  timeClient.update(); // Initial update

  // Setup web server routes
  server.on("/status", handleStatus);
  server.on("/config", HTTP_POST, handleConfig); // For re-configuring WiFi/Supabase
  server.on("/disconnect", handleDisconnect);
  server.onNotFound(handleNotFound);
  server.begin();

  // Initial fetch of schedule
  fetchScheduleFromEdgeFunction();
}

void loop() {
  server.handleClient();
  timeClient.update(); // Update time

  // Check for test bell deactivation
  if (testBellActive && millis() - testBellStartTime >= TEST_BELL_DURATION_MS) {
    digitalWrite(BELL_PIN, LOW);
    testBellActive = false;
    Serial.println("Test bell deactivated.");
  }

  // Periodically fetch schedule from Edge Function
  if (millis() - lastScheduleFetchTime >= SCHEDULE_FETCH_INTERVAL_MS) {
    fetchScheduleFromEdgeFunction();
    lastScheduleFetchTime = millis();
  }

  // Check for scheduled bells
  checkScheduledBells();
}

void saveConfigCallback() {
  Serial.println("Should save config");
}

void handleStatus() {
  StaticJsonDocument<256> doc;
  doc["status"] = WiFi.status() == WL_CONNECTED ? "connected" : "disconnected";
  doc["ip"] = WiFi.localIP().toString();
  doc["ssid"] = WiFi.SSID();
  doc["test_bell_active"] = testBellActive;
  doc["current_time"] = timeClient.getFormattedTime();

  String jsonResponse;
  serializeJson(doc, jsonResponse);
  server.send(200, "application/json", jsonResponse);
}

void handleConfig() {
  if (server.hasArg("ssid") && server.hasArg("password") && server.hasArg("edge_url") && server.hasArg("user_id")) {
    String newSsid = server.arg("ssid");
    String newPassword = server.arg("password");
    String newEdgeUrl = server.arg("edge_url");
    String newUserId = server.arg("user_id");

    Serial.print("Reconfiguring WiFi to: ");
    Serial.println(newSsid);
    Serial.print("New Edge URL: ");
    Serial.println(newEdgeUrl);
    Serial.print("New User ID: ");
    Serial.println(newUserId);

    // Save new config to WiFiManager parameters (which saves to EEPROM)
    WiFiManager wifiManager;
    WiFiManagerParameter custom_edge_function_url_update("edge_url", "Supabase Edge Function URL", newEdgeUrl.c_str(), 255);
    WiFiManagerParameter custom_user_id_update("user_id", "Supabase User ID", newUserId.c_str(), 63);
    
    wifiManager.addParameter(&custom_edge_function_url_update);
    wifiManager.addParameter(&custom_user_id_update);
    
    wifiManager.saveConfigCallback(); // Trigger save

    // Update global variables
    strcpy(supabase_edge_function_url, newEdgeUrl.c_str());
    strcpy(supabase_user_id, newUserId.c_str());

    WiFi.begin(newSsid.c_str(), newPassword.c_str());
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("Reconnected to new WiFi!");
      server.send(200, "text/plain", "WiFi reconfigured and connected.");
      timeClient.begin(); // Re-initialize NTP
      timeClient.update();
      fetchScheduleFromEdgeFunction(); // Fetch new schedule
    } else {
      Serial.println("Failed to reconnect to new WiFi.");
      server.send(500, "text/plain", "Failed to reconfigure WiFi.");
    }
  } else {
    server.send(400, "text/plain", "Missing parameters.");
  }
}

void handleDisconnect() {
  Serial.println("Disconnecting from WiFi...");
  WiFi.disconnect();
  server.send(200, "text/plain", "Disconnected from WiFi.");
}

void handleNotFound() {
  server.send(404, "text/plain", "Not Found");
}

void fetchScheduleFromEdgeFunction() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Not connected to WiFi, cannot fetch schedule.");
    return;
  }
  if (strlen(supabase_edge_function_url) == 0 || strlen(supabase_user_id) == 0) {
    Serial.println("Supabase Edge Function URL or User ID not configured.");
    return;
  }

  HTTPClient http;
  http.begin(supabase_edge_function_url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<128> requestDoc;
  requestDoc["user_id"] = supabase_user_id;
  String requestBody;
  serializeJson(requestDoc, requestBody);

  Serial.print("Fetching schedule from Edge Function: ");
  Serial.println(supabase_edge_function_url);
  Serial.print("Request Body: ");
  Serial.println(requestBody);

  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);

    StaticJsonDocument<1024> doc; // Adjust size as needed
    DeserializationError error = deserializeJson(doc, response);

    if (error) {
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.f_str());
      return;
    }

    // Parse bells
    JsonArray bellsArray = doc["bells"].as<JsonArray>();
    numBells = 0;
    for (JsonObject bellObj : bellsArray) {
      if (numBells < 20) {
        bells[numBells].schedule_id = bellObj["schedule_id"].as<String>();
        bells[numBells].time = bellObj["time"].as<String>();
        bells[numBells].label = bellObj["label"].as<String>();
        
        JsonArray daysArray = bellObj["days_of_week"].as<JsonArray>();
        bells[numBells].num_days = 0;
        for (int day : daysArray) {
          if (bells[numBells].num_days < 7) {
            bells[numBells].days_of_week[bells[numBells].num_days++] = day;
          }
        }
        numBells++;
      }
    }
    Serial.print("Fetched ");
    Serial.print(numBells);
    Serial.println(" bells.");

    // Parse test bell status
    testBellActive = doc["test_bell_active"].as<bool>();
    if (testBellActive) {
      digitalWrite(BELL_PIN, HIGH);
      testBellStartTime = millis();
      Serial.println("Test bell activated by Edge Function.");
    } else {
      digitalWrite(BELL_PIN, LOW);
      Serial.println("Test bell deactivated by Edge Function.");
    }

  } else {
    Serial.print("Error on HTTP request: ");
    Serial.println(httpResponseCode);
  }
  http.end();
}

void checkScheduledBells() {
  int currentHour = timeClient.getHours();
  int currentMinute = timeClient.getMinutes();
  int currentSecond = timeClient.getSeconds();
  int currentDay = timeClient.getDay(); // 0 for Sunday, 1 for Monday, etc.

  for (int i = 0; i < numBells; i++) {
    int bellHour = bells[i].time.substring(0, 2).toInt();
    int bellMinute = bells[i].time.substring(3, 5).toInt();

    bool todayIsBellDay = false;
    for (int d = 0; d < bells[i].num_days; d++) {
      if (bells[i].days_of_week[d] == currentDay) {
        todayIsBellDay = true;
        break;
      }
    }

    if (todayIsBellDay && currentHour == bellHour && currentMinute == bellMinute && currentSecond == 0) {
      // Trigger bell for 5 seconds
      digitalWrite(BELL_PIN, HIGH);
      Serial.print("Ringing bell for: ");
      Serial.println(bells[i].label);
      delay(5000); // Ring for 5 seconds
      digitalWrite(BELL_PIN, LOW);
      Serial.println("Bell off.");
      delay(1000); // Small delay to prevent multiple triggers in the same second
    }
  }
}