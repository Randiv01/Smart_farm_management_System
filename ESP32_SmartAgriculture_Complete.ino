// Complete Smart Agriculture System with ESP32 + WebSocket Support
// Multi-WiFi Support + All Sensors + Web Control + Real-time Data
#include <DHTesp.h>
#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

// WiFi Credentials - Replace with your networks
const char* ssid1 = "Danuz";        // 1st priority - Mobile Hotspot
const char* password1 = "12345678";

const char* ssid2 = "SLT-Fiber-A577";    // 2nd priority - University WiFi
const char* password2 = "5FC@a557";

const char* ssid3 = "Iphone 11";    // 3rd priority - Home WiFi
const char* password3 = "22222222";

// Static IP configurations for each network
IPAddress staticIP1(172, 20, 10, 2);    // IP for Danuz network
IPAddress gateway1(172, 20, 10, 1);     // Gateway for Danuz
IPAddress subnet1(255, 255, 255, 240);  // Subnet for Danuz

IPAddress staticIP2(192, 168, 1, 100);  // IP for SLT-Fiber-A577 network
IPAddress gateway2(192, 168, 1, 1);     // Gateway for SLT-Fiber-A577
IPAddress subnet2(255, 255, 255, 0);    // Subnet for SLT-Fiber-A577

IPAddress staticIP3(172, 20, 10, 3);    // IP for Iphone 11 network
IPAddress gateway3(172, 20, 10, 1);     // Gateway for Iphone 11
IPAddress subnet3(255, 255, 255, 240);  // Subnet for Iphone 11

// Sensor pins
#define SOIL_MOISTURE_PIN 34   // GPIO34 for soil moisture sensor
#define DHT_PIN 4              // GPIO4 for DHT22 sensor

// Relay control pins
#define FAN_RELAY_PIN 16       // GPIO16 for fan relay (IN1)
#define HEATER_RELAY_PIN 17    // GPIO17 for heater relay (IN2) 
#define PUMP_RELAY_PIN 18      // GPIO18 for water pump relay (IN3)
#define LIGHT_RELAY_PIN 19     // GPIO19 for light relay (IN4)

// Temperature thresholds - UPDATED VALUES
#define MAX_TEMP 35.0          // Fan turns ON above this temperature
#define MIN_TEMP 28.0          // Heater turns ON below this temperature
#define HEATER_OFF_TEMP 30.0   // Heater turns OFF above this temperature

// Soil moisture threshold (adjust based on your sensor readings)
#define SOIL_DRY_THRESHOLD 2000  // Value when soil is dry
#define SOIL_WET_THRESHOLD 1000  // Value when soil is wet

// Create sensor objects
DHTesp dht;

// Create web server on port 80
WebServer server(80);

// Create WebSocket server on port 81
WebSocketsServer webSocket = WebSocketsServer(81);

// Variables to store sensor data
float temperature = 0;
float humidity = 0;
int soilMoisture = 0;

// Variables to store device states - UPDATED LIGHT DEFAULT
bool fanState = false;
bool heaterState = false;
bool pumpState = false;
bool lightState = false;  // Light OFF by default (changed from true to false)
bool autoMode = true;
bool autoWatering = true;

// Timer variables
unsigned long fanTimerEnd = 0;
unsigned long lightTimerEnd = 0;
unsigned long pumpTimerEnd = 0;
unsigned long heaterTimerEnd = 0;

// WiFi connection variables
int wifiTimeout = 15000; // 15 seconds timeout for each WiFi
String connectedSSID = "";
unsigned long lastReconnectAttempt = 0;
const unsigned long RECONNECT_INTERVAL = 30000; // 30 seconds

// Data broadcast interval
unsigned long lastBroadcast = 0;
const unsigned long BROADCAST_INTERVAL = 2000; // Broadcast every 2 seconds

// Sensor error tracking
int dhtErrorCount = 0;
bool dhtInitialized = false;
bool dhtSensorWorking = false;

// Server health tracking
unsigned long lastClientRequest = 0;
bool serverHealthy = true;

void setup() {
  // Start serial communication
  Serial.begin(115200);
  Serial.println("\n🌱 Smart Agriculture System Starting...");
  Serial.println("🔧 With WebSocket Support for Real-time Control");
  Serial.println("⚙️ New Temperature Settings:");
  Serial.println("   - Fan ON >35°C, Fan OFF <35°C");
  Serial.println("   - Heater ON <28°C, Heater OFF >30°C");
  Serial.println("💡 Light Default: OFF");
  Serial.println("📡 Static IP Configuration:");
  Serial.println("   - Danuz: 172.20.10.2");
  Serial.println("   - SLT-Fiber-A577: 192.168.1.100");
  Serial.println("   - Iphone 11: 172.20.10.3");
  
  // Initialize DHT sensor with proper configuration
  initializeDHT();
  
  // Set pin modes for relays
  pinMode(FAN_RELAY_PIN, OUTPUT);
  pinMode(HEATER_RELAY_PIN, OUTPUT);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(LIGHT_RELAY_PIN, OUTPUT);
  
  // Initially turn off all relays (LOW signal activates relay)
  digitalWrite(FAN_RELAY_PIN, HIGH);
  digitalWrite(HEATER_RELAY_PIN, HIGH);
  digitalWrite(PUMP_RELAY_PIN, HIGH);
  digitalWrite(LIGHT_RELAY_PIN, HIGH);  // Light OFF by default (changed from LOW to HIGH)
  
  // Connect to WiFi
  connectToWiFi();
  
  // Setup web server routes with improved error handling
  setupServerRoutes();
  
  // Start web server
  server.begin();
  Serial.println("✅ Web server started on port 80!");
  
  // Start WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("✅ WebSocket server started on port 81!");
  
  // Test sensor reading
  testDHTsensor();
  
  lastClientRequest = millis();
}

void initializeDHT() {
  dht.setup(DHT_PIN, DHTesp::DHT22);
  pinMode(DHT_PIN, INPUT_PULLUP);
  dhtInitialized = true;
  dhtSensorWorking = false; // Assume not working until proven
  Serial.println("✅ DHT22 Sensor initialized with internal pull-up");
}

void setupServerRoutes() {
  // Enable CORS for all routes
  server.enableCORS(true);
  
  // Handle OPTIONS requests for CORS preflight
  server.on("/status", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  });
  
  server.on("/control", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  });
  
  server.on("/health", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  });

  // Your existing routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/toggleLight", HTTP_GET, handleToggleLight);
  server.on("/togglePump", HTTP_GET, handleTogglePump);
  server.on("/toggleMode", HTTP_GET, handleToggleMode);
  server.on("/toggleWatering", HTTP_GET, handleToggleWatering);
  server.on("/sensorData", HTTP_GET, handleSensorData);
  server.on("/control", HTTP_POST, handleControl);
  server.on("/restart", HTTP_GET, handleRestart);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/health", HTTP_GET, handleHealth);
  
  // Handle 404 errors
  server.onNotFound(handleNotFound);
}

void testDHTsensor() {
  Serial.println("\n🔍 Testing DHT22 Sensor...");
  TempAndHumidity data = dht.getTempAndHumidity();
  
  if (dht.getStatus() == DHTesp::ERROR_NONE) {
    dhtSensorWorking = true;
    Serial.println("✅ DHT22 Sensor Test PASSED");
    Serial.println("🌡️ Temperature: " + String(data.temperature) + "°C");
    Serial.println("💧 Humidity: " + String(data.humidity) + "%");
  } else {
    dhtSensorWorking = false;
    Serial.println("❌ DHT22 Sensor Test FAILED: " + String(dht.getStatusString()));
    Serial.println("💡 Check: 1) Wiring 2) 3.3V power 3) GPIO connection");
  }
}

void connectToWiFi() {
  Serial.println("\n🔍 Searching for available WiFi networks...");
  
  // Try connecting to WiFi 1 (Danuz) with static IP
  if (connectToNetwork(ssid1, password1, 1)) {
    return;
  }
  
  // If WiFi 1 fails, try WiFi 2 (SLT-Fiber-A577) with static IP
  if (connectToNetwork(ssid2, password2, 2)) {
    return;
  }
  
  // If WiFi 2 fails, try WiFi 3 (Iphone 11) with static IP
  if (connectToNetwork(ssid3, password3, 3)) {
    return;
  }
  
  // If all WiFi connections fail, start Access Point
  startAccessPoint();
}

bool connectToNetwork(const char* ssid, const char* password, int networkNum) {
  Serial.println("📶 Attempting to connect to WiFi " + String(networkNum) + ": " + String(ssid));
  
  WiFi.disconnect();
  delay(1000);
  
  // Configure static IP based on network number
  bool configSuccess = false;
  switch(networkNum) {
    case 1:
      configSuccess = WiFi.config(staticIP1, gateway1, subnet1);
      Serial.println("📡 Static IP configured: 172.20.10.2");
      break;
    case 2:
      configSuccess = WiFi.config(staticIP2, gateway2, subnet2);
      Serial.println("📡 Static IP configured: 192.168.1.100");
      break;
    case 3:
      configSuccess = WiFi.config(staticIP3, gateway3, subnet3);
      Serial.println("📡 Static IP configured: 172.20.10.3");
      break;
  }
  
  if (!configSuccess) {
    Serial.println("❌ Failed to configure static IP for network " + String(networkNum));
  }
  
  WiFi.begin(ssid, password);
  
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startTime < wifiTimeout) {
    delay(500);
    Serial.print(".");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    connectedSSID = String(ssid);
    Serial.println("\n✅ SUCCESS! Connected to WiFi " + String(networkNum));
    Serial.print("📡 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("🔒 Subnet Mask: ");
    Serial.println(WiFi.subnetMask());
    Serial.print("🌐 Gateway: ");
    Serial.println(WiFi.gatewayIP());
    Serial.println("💪 Signal Strength: " + String(WiFi.RSSI()) + " dBm");
    return true;
  } else {
    Serial.println("\n❌ FAILED! Could not connect to WiFi " + String(networkNum));
    return false;
  }
}

void startAccessPoint() {
  Serial.println("🚨 All WiFi connections failed! Starting Access Point...");
  
  const char* ap_ssid = "SmartFarm-AP";
  const char* ap_password = "farm1234";
  
  WiFi.softAP(ap_ssid, ap_password);
  Serial.print("📡 Access Point Started: ");
  Serial.println(ap_ssid);
  Serial.print("🔑 Password: ");
  Serial.println(ap_password);
  Serial.print("🌐 AP IP Address: ");
  Serial.println(WiFi.softAPIP());
  
  connectedSSID = "Access Point: " + String(ap_ssid);
}

// WebSocket Event Handler
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      break;
      
    case WStype_CONNECTED:
      {
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("[%u] Connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
        // Send current status to newly connected client
        sendStatus(num);
      }
      break;
      
    case WStype_TEXT:
      handleWebSocketMessage(num, payload, length);
      break;
      
    case WStype_ERROR:
      Serial.printf("[%u] WebSocket error!\n", num);
      break;
  }
}

void handleWebSocketMessage(uint8_t num, uint8_t * payload, size_t length) {
  String message = String((char*)payload);
  Serial.println("📨 Received WebSocket message: " + message);
  
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.print("❌ JSON deserialize failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  String type = doc["type"];
  
  if (type == "getData") {
    sendStatus(num);
  } else if (type == "control") {
    String device = doc["device"];
    String action = doc["action"];
    int duration = doc["duration"] | 0;
    
    controlDevice(device, action, duration);
    broadcastStatus();
  } else if (type == "setMode") {
    String mode = doc["mode"];
    autoMode = (mode == "auto");
    Serial.println("⚙️ Mode changed to: " + String(autoMode ? "AUTO" : "MANUAL"));
    broadcastStatus();
  } else {
    Serial.println("❌ Unknown WebSocket message type: " + type);
  }
}

void sendStatus(uint8_t num) {
  String json = getStatusJSON();
  webSocket.sendTXT(num, json);
}

void broadcastStatus() {
  String json = getStatusJSON();
  webSocket.broadcastTXT(json);
}

String getStatusJSON() {
  DynamicJsonDocument doc(1024);
  
  // Sensor data - send null when sensor is not working
  if (dhtSensorWorking && temperature != -999.0 && !isnan(temperature)) {
    doc["temperature"] = temperature;
  } else {
    doc["temperature"] = nullptr; // Send null instead of -999
  }
  
  if (dhtSensorWorking && humidity != -999.0 && !isnan(humidity)) {
    doc["humidity"] = humidity;
  } else {
    doc["humidity"] = nullptr; // Send null instead of -999
  }
  
  doc["soilMoisture"] = soilMoisture;
  
  // Device states
  doc["fanState"] = fanState;
  doc["heaterState"] = heaterState;
  doc["pumpState"] = pumpState;
  doc["lightState"] = lightState;
  doc["autoMode"] = autoMode;
  doc["autoWatering"] = autoWatering;
  
  // Network information
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["subnetMask"] = WiFi.subnetMask().toString();
  doc["gateway"] = WiFi.gatewayIP().toString();
  doc["signalStrength"] = WiFi.RSSI();
  doc["connectedSSID"] = WiFi.SSID();
  doc["webSocketClients"] = webSocket.connectedClients();
  
  // Sensor status
  doc["dhtSensorWorking"] = dhtSensorWorking;
  doc["dhtError"] = dht.getStatusString();
  doc["serverHealthy"] = serverHealthy;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  return jsonString;
}

void controlDevice(String device, String action, int duration) {
  bool state = (action == "on");
  unsigned long timerEnd = 0;
  
  if (duration > 0) {
    timerEnd = millis() + (duration * 60 * 1000);
    Serial.println("⏰ Timer set for " + device + ": " + String(duration) + " minutes");
  }
  
  if (device == "fan") {
    fanState = state;
    digitalWrite(FAN_RELAY_PIN, fanState ? LOW : HIGH);
    fanTimerEnd = timerEnd;
    Serial.println("🌀 Fan " + String(fanState ? "ON" : "OFF"));
    
  } else if (device == "lights") {
    lightState = state;
    digitalWrite(LIGHT_RELAY_PIN, lightState ? LOW : HIGH);
    lightTimerEnd = timerEnd;
    Serial.println("💡 Light " + String(lightState ? "ON" : "OFF"));
    
  } else if (device == "waterPump") {
    pumpState = state;
    digitalWrite(PUMP_RELAY_PIN, pumpState ? LOW : HIGH);
    pumpTimerEnd = timerEnd;
    Serial.println("💧 Water Pump " + String(pumpState ? "ON" : "OFF"));
    
  } else if (device == "heater") {
    heaterState = state;
    digitalWrite(HEATER_RELAY_PIN, heaterState ? LOW : HIGH);
    heaterTimerEnd = timerEnd;
    Serial.println("🔥 Heater " + String(heaterState ? "ON" : "OFF"));
    
  } else {
    Serial.println("❌ Unknown device: " + device);
    return;
  }
}

void checkTimers() {
  unsigned long currentTime = millis();
  
  if (fanTimerEnd > 0 && currentTime >= fanTimerEnd) {
    fanState = false;
    digitalWrite(FAN_RELAY_PIN, HIGH);
    fanTimerEnd = 0;
    Serial.println("⏰ Fan timer expired - Turning OFF");
    broadcastStatus();
  }
  
  if (lightTimerEnd > 0 && currentTime >= lightTimerEnd) {
    lightState = false;
    digitalWrite(LIGHT_RELAY_PIN, HIGH);
    lightTimerEnd = 0;
    Serial.println("⏰ Light timer expired - Turning OFF");
    broadcastStatus();
  }
  
  if (pumpTimerEnd > 0 && currentTime >= pumpTimerEnd) {
    pumpState = false;
    digitalWrite(PUMP_RELAY_PIN, HIGH);
    pumpTimerEnd = 0;
    Serial.println("⏰ Water Pump timer expired - Turning OFF");
    broadcastStatus();
  }
  
  if (heaterTimerEnd > 0 && currentTime >= heaterTimerEnd) {
    heaterState = false;
    digitalWrite(HEATER_RELAY_PIN, HIGH);
    heaterTimerEnd = 0;
    Serial.println("⏰ Heater timer expired - Turning OFF");
    broadcastStatus();
  }
}

void loop() {
  server.handleClient();
  webSocket.loop();
  
  // Update last client request time
  if (server.args() > 0 || server.uri() != "/") {
    lastClientRequest = millis();
  }
  
  // Check server health
  if (millis() - lastClientRequest > 30000) {
    serverHealthy = true;
    lastClientRequest = millis();
  }
  
  // Check WiFi connection status and reconnect if necessary
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastReconnectAttempt > RECONNECT_INTERVAL) {
      Serial.println("⚠️ WiFi connection lost! Attempting to reconnect...");
      connectToWiFi();
      lastReconnectAttempt = millis();
    }
  }
  
  readSensors();
  checkTimers();
  
  if (autoMode && dhtSensorWorking) {
    controlTemperature();
  }
  
  if (autoWatering) {
    controlWatering();
  }
  
  // Broadcast data to all WebSocket clients periodically
  if (millis() - lastBroadcast > BROADCAST_INTERVAL) {
    broadcastStatus();
    lastBroadcast = millis();
  }
  
  displaySerialData();
  delay(2000);
}

void readSensors() {
  // Read soil moisture (always works)
  soilMoisture = analogRead(SOIL_MOISTURE_PIN);
  
  // Read temperature and humidity using DHTesp library
  TempAndHumidity data = dht.getTempAndHumidity();
  
  if (dht.getStatus() == DHTesp::ERROR_NONE) {
    // Successful reading
    temperature = data.temperature;
    humidity = data.humidity;
    dhtErrorCount = 0;
    dhtSensorWorking = true;
  } else {
    // Failed reading
    Serial.println("❌ DHT Sensor Error: " + String(dht.getStatusString()));
    temperature = -999.0;
    humidity = -999.0;
    dhtErrorCount++;
    dhtSensorWorking = false;
    
    // Attempt to recover by reinitializing sensor after multiple failures
    if (dhtErrorCount > 5) {
      Serial.println("🔄 Reinitializing DHT sensor...");
      initializeDHT();
      dhtErrorCount = 0;
      delay(2500);
    }
  }
}

void controlTemperature() {
  // Only control temperature if DHT sensor is working and reading is valid
  if (dhtSensorWorking && temperature != -999.0 && !isnan(temperature)) {
    // Fan control logic
    if (temperature > MAX_TEMP && !fanState) {
      digitalWrite(FAN_RELAY_PIN, LOW);
      fanState = true;
      Serial.println("🌡️ Temperature high (" + String(temperature, 1) + "°C > " + String(MAX_TEMP) + "°C) - Fan turned ON");
      broadcastStatus();
    } else if (temperature < MAX_TEMP && fanState && fanTimerEnd == 0) {
      digitalWrite(FAN_RELAY_PIN, HIGH);
      fanState = false;
      Serial.println("🌡️ Temperature normal (" + String(temperature, 1) + "°C < " + String(MAX_TEMP) + "°C) - Fan turned OFF");
      broadcastStatus();
    }
    
    // Heater control logic
    if (temperature < MIN_TEMP && !heaterState) {
      digitalWrite(HEATER_RELAY_PIN, LOW);
      heaterState = true;
      Serial.println("🌡️ Temperature low (" + String(temperature, 1) + "°C < " + String(MIN_TEMP) + "°C) - Heater turned ON");
      broadcastStatus();
    } else if (temperature > HEATER_OFF_TEMP && heaterState && heaterTimerEnd == 0) {
      digitalWrite(HEATER_RELAY_PIN, HIGH);
      heaterState = false;
      Serial.println("🌡️ Temperature warm (" + String(temperature, 1) + "°C > " + String(HEATER_OFF_TEMP) + "°C) - Heater turned OFF");
      broadcastStatus();
    }
  }
}

void controlWatering() {
  if (soilMoisture > SOIL_DRY_THRESHOLD && !pumpState && pumpTimerEnd == 0) {
    digitalWrite(PUMP_RELAY_PIN, LOW);
    pumpState = true;
    Serial.println("💧 Auto watering: Pump ON - Soil is dry");
    broadcastStatus();
    
    delay(5000);
    
    digitalWrite(PUMP_RELAY_PIN, HIGH);
    pumpState = false;
    Serial.println("💧 Auto watering: Pump OFF");
    broadcastStatus();
  }
}

void displaySerialData() {
  Serial.println("\n=== 🌱 SMART FARM STATUS ===");
  Serial.println("📶 Network: " + String(WiFi.SSID()));
  Serial.println("📡 IP Address: " + WiFi.localIP().toString());
  Serial.println("🔒 Subnet Mask: " + WiFi.subnetMask().toString());
  Serial.println("🌐 Gateway: " + WiFi.gatewayIP().toString());
  Serial.println("💪 Signal Strength: " + String(WiFi.RSSI()) + " dBm");
  Serial.println("🔌 WebSocket Clients: " + String(webSocket.connectedClients()));
  Serial.println("🏥 Server Health: " + String(serverHealthy ? "HEALTHY" : "ISSUES"));
  Serial.println("🌡️ DHT Sensor: " + String(dhtSensorWorking ? "WORKING" : "NOT WORKING"));
  
  if (dhtSensorWorking) {
    Serial.println("🌡️ Temperature: " + String(temperature, 1) + " °C");
    Serial.println("💧 Humidity: " + String(humidity, 1) + " %");
  } else {
    Serial.println("🌡️ Temperature: ❌ SENSOR ERROR");
    Serial.println("💧 Humidity: ❌ SENSOR ERROR");
  }
  
  Serial.println("🌱 Soil Moisture: " + String(soilMoisture));
  Serial.println("🌀 Fan: " + String(fanState ? "ON" : "OFF"));
  Serial.println("🔥 Heater: " + String(heaterState ? "ON" : "OFF"));
  Serial.println("💧 Pump: " + String(pumpState ? "ON" : "OFF"));
  Serial.println("💡 Light: " + String(lightState ? "ON" : "OFF"));
  Serial.println("⚙️ Mode: " + String(autoMode ? "AUTO" : "MANUAL"));
  Serial.println("💦 Auto Watering: " + String(autoWatering ? "ON" : "OFF"));
  Serial.println("🎯 Fan: ON >" + String(MAX_TEMP) + "°C, OFF <" + String(MAX_TEMP) + "°C");
  Serial.println("🎯 Heater: ON <" + String(MIN_TEMP) + "°C, OFF >" + String(HEATER_OFF_TEMP) + "°C");
  Serial.println("============================\n");
}

// Web Server Handlers
void handleRoot() {
  lastClientRequest = millis();
  
  String html = "<!DOCTYPE html><html><head><title>Smart Farm Control</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<meta http-equiv='refresh' content='10'>";
  html += "<style>body {font-family: Arial; margin: 20px;}</style></head><body>";
  html += "<h1>🌱 Smart Farm Control System</h1>";
  html += "<p><strong>Connected to:</strong> " + String(WiFi.SSID()) + "</p>";
  html += "<p><strong>IP Address:</strong> " + WiFi.localIP().toString() + "</p>";
  html += "<p><strong>Subnet Mask:</strong> " + WiFi.subnetMask().toString() + "</p>";
  html += "<p><strong>Gateway:</strong> " + WiFi.gatewayIP().toString() + "</p>";
  html += "<p><strong>DHT Sensor Status:</strong> " + String(dhtSensorWorking ? "WORKING" : "NOT WORKING") + "</p>";
  html += "<p><strong>Fan Control:</strong> ON >" + String(MAX_TEMP) + "°C, OFF <" + String(MAX_TEMP) + "°C</p>";
  html += "<p><strong>Heater Control:</strong> ON <" + String(MIN_TEMP) + "°C, OFF >" + String(HEATER_OFF_TEMP) + "°C</p>";
  html += "<p><strong>Light Default:</strong> OFF</p>";
  html += "<p>Use the React application for full control functionality.</p>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

void handleToggleLight() {
  lastClientRequest = millis();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  lightState = !lightState;
  digitalWrite(LIGHT_RELAY_PIN, lightState ? LOW : HIGH);
  server.send(200, "text/plain", "Light " + String(lightState ? "ON" : "OFF"));
  broadcastStatus();
}

void handleTogglePump() {
  lastClientRequest = millis();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  pumpState = !pumpState;
  digitalWrite(PUMP_RELAY_PIN, pumpState ? LOW : HIGH);
  server.send(200, "text/plain", "Pump " + String(pumpState ? "ON" : "OFF"));
  broadcastStatus();
}

void handleToggleMode() {
  lastClientRequest = millis();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  autoMode = !autoMode;
  server.send(200, "text/plain", "Mode " + String(autoMode ? "AUTO" : "MANUAL"));
  broadcastStatus();
}

void handleToggleWatering() {
  lastClientRequest = millis();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  autoWatering = !autoWatering;
  server.send(200, "text/plain", "Auto Watering " + String(autoWatering ? "ON" : "OFF"));
  broadcastStatus();
}

void handleSensorData() {
  lastClientRequest = millis();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", getStatusJSON());
}

void handleStatus() {
  lastClientRequest = millis();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", getStatusJSON());
}

void handleHealth() {
  lastClientRequest = millis();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  
  DynamicJsonDocument doc(256);
  doc["status"] = "healthy";
  doc["timestamp"] = millis();
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["wifiStatus"] = WiFi.status();
  doc["dhtSensorWorking"] = dhtSensorWorking;
  doc["dhtStatus"] = dht.getStatusString();
  
  String json;
  serializeJson(doc, json);
  server.send(200, "application/json", json);
}

void handleControl() {
  lastClientRequest = millis();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  
  if (server.hasArg("device") && server.hasArg("action")) {
    String device = server.arg("device");
    String action = server.arg("action");
    int duration = server.hasArg("duration") ? server.arg("duration").toInt() : 0;
    
    controlDevice(device, action, duration);
    server.send(200, "text/plain", "OK");
  } else {
    server.send(400, "text/plain", "Missing parameters");
  }
}

void handleRestart() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "System restarting...");
  delay(1000);
  ESP.restart();
}

void handleNotFound() {
  lastClientRequest = millis();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(404, "text/plain", "Endpoint not found");
}
