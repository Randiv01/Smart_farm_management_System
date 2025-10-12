// Optimized Smart Agriculture System with ESP32 + WebSocket Support
// Memory-optimized version for compilation
#include <DHTesp.h>
#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

// WiFi Credentials - Replace with your networks
const char* ssid1 = "Danuz";
const char* password1 = "12345678";
const char* ssid2 = "SLT-Fiber-A577";
const char* password2 = "5FC@a557";
const char* ssid3 = "Iphone 11";
const char* password3 = "22222222";

// Static IP configurations
IPAddress staticIP1(172, 20, 10, 2);
IPAddress gateway1(172, 20, 10, 1);
IPAddress subnet1(255, 255, 255, 240);
IPAddress staticIP2(192, 168, 1, 100);
IPAddress gateway2(192, 168, 1, 1);
IPAddress subnet2(255, 255, 255, 0);
IPAddress staticIP3(172, 20, 10, 3);
IPAddress gateway3(172, 20, 10, 1);
IPAddress subnet3(255, 255, 255, 240);

// Pin definitions
#define SOIL_MOISTURE_PIN 34
#define DHT_PIN 4
#define FAN_RELAY_PIN 16
#define HEATER_RELAY_PIN 17
#define PUMP_RELAY_PIN 18
#define LIGHT_RELAY_PIN 19

// Thresholds
#define MAX_TEMP 35.0
#define MIN_TEMP 28.0
#define HEATER_OFF_TEMP 30.0
#define SOIL_DRY_THRESHOLD 2000

// Objects
DHTesp dht;
WebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81);

// Variables
float temperature = 0;
float humidity = 0;
int soilMoisture = 0;
bool fanState = false;
bool heaterState = false;
bool pumpState = false;
bool lightState = false;
bool autoMode = true;
bool autoWatering = true;
bool dhtSensorWorking = false;
String connectedSSID = "";

// Timers
unsigned long fanTimerEnd = 0;
unsigned long lightTimerEnd = 0;
unsigned long pumpTimerEnd = 0;
unsigned long heaterTimerEnd = 0;
unsigned long lastBroadcast = 0;
unsigned long lastClientRequest = 0;
const unsigned long BROADCAST_INTERVAL = 2000;

void setup() {
  Serial.begin(115200);
  Serial.println("Smart Agriculture System Starting...");
  
  // Initialize sensor
  dht.setup(DHT_PIN, DHTesp::DHT22);
  pinMode(DHT_PIN, INPUT_PULLUP);
  
  // Set pin modes
  pinMode(FAN_RELAY_PIN, OUTPUT);
  pinMode(HEATER_RELAY_PIN, OUTPUT);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(LIGHT_RELAY_PIN, OUTPUT);
  
  // Initialize relays
  digitalWrite(FAN_RELAY_PIN, HIGH);
  digitalWrite(HEATER_RELAY_PIN, HIGH);
  digitalWrite(PUMP_RELAY_PIN, HIGH);
  digitalWrite(LIGHT_RELAY_PIN, HIGH);
  
  // Connect to WiFi
  connectToWiFi();
  
  // Setup server
  setupServer();
  
  server.begin();
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  
  Serial.println("Servers started!");
  testSensor();
  lastClientRequest = millis();
}

void connectToWiFi() {
  Serial.println("Connecting to WiFi...");
  
  if (connectToNetwork(ssid1, password1, 1)) return;
  if (connectToNetwork(ssid2, password2, 2)) return;
  if (connectToNetwork(ssid3, password3, 3)) return;
  
  startAccessPoint();
}

bool connectToNetwork(const char* ssid, const char* password, int networkNum) {
  Serial.println("Trying network " + String(networkNum) + ": " + String(ssid));
  
  WiFi.disconnect();
  delay(1000);
  
  bool configSuccess = false;
  switch(networkNum) {
    case 1: configSuccess = WiFi.config(staticIP1, gateway1, subnet1); break;
    case 2: configSuccess = WiFi.config(staticIP2, gateway2, subnet2); break;
    case 3: configSuccess = WiFi.config(staticIP3, gateway3, subnet3); break;
  }
  
  WiFi.begin(ssid, password);
  
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startTime < 15000) {
    delay(500);
    Serial.print(".");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    connectedSSID = String(ssid);
    Serial.println("\nConnected to: " + String(ssid));
    Serial.println("IP: " + WiFi.localIP().toString());
    return true;
  } else {
    Serial.println("\nFailed to connect to: " + String(ssid));
    return false;
  }
}

void startAccessPoint() {
  Serial.println("Starting Access Point...");
  WiFi.softAP("SmartFarm-AP", "farm1234");
  Serial.println("AP IP: " + WiFi.softAPIP().toString());
  connectedSSID = "SmartFarm-AP";
}

void setupServer() {
  server.enableCORS(true);
  
  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/health", HTTP_GET, handleHealth);
  server.on("/control", HTTP_POST, handleControl);
  server.on("/toggleMode", HTTP_GET, handleToggleMode);
  
  server.onNotFound([]() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(404, "text/plain", "Not found");
  });
}

void testSensor() {
  TempAndHumidity data = dht.getTempAndHumidity();
  if (dht.getStatus() == DHTesp::ERROR_NONE) {
    dhtSensorWorking = true;
    Serial.println("DHT Sensor: OK");
  } else {
    dhtSensorWorking = false;
    Serial.println("DHT Sensor: ERROR");
  }
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_CONNECTED:
      sendStatus(num);
      break;
    case WStype_TEXT:
      handleWebSocketMessage(num, payload, length);
      break;
  }
}

void handleWebSocketMessage(uint8_t num, uint8_t * payload, size_t length) {
  String message = String((char*)payload);
  
  DynamicJsonDocument doc(512);
  if (deserializeJson(doc, message) != DeserializationError::Ok) return;
  
  String type = doc["type"];
  
  if (type == "getData") {
    sendStatus(num);
  } else if (type == "control") {
    String device = doc["device"];
    String action = doc["action"];
    controlDevice(device, action, 0);
    broadcastStatus();
  } else if (type == "setMode") {
    String mode = doc["mode"];
    autoMode = (mode == "auto");
    broadcastStatus();
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
  DynamicJsonDocument doc(512);
  
  if (dhtSensorWorking) {
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
  } else {
    doc["temperature"] = nullptr;
    doc["humidity"] = nullptr;
  }
  
  doc["soilMoisture"] = soilMoisture;
  doc["fanState"] = fanState;
  doc["heaterState"] = heaterState;
  doc["pumpState"] = pumpState;
  doc["lightState"] = lightState;
  doc["autoMode"] = autoMode;
  doc["autoWatering"] = autoWatering;
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["signalStrength"] = WiFi.RSSI();
  doc["connectedSSID"] = WiFi.SSID();
  doc["webSocketClients"] = webSocket.connectedClients();
  doc["dhtSensorWorking"] = dhtSensorWorking;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  return jsonString;
}

void controlDevice(String device, String action, int duration) {
  bool state = (action == "on");
  
  if (device == "fan") {
    fanState = state;
    digitalWrite(FAN_RELAY_PIN, fanState ? LOW : HIGH);
  } else if (device == "lights") {
    lightState = state;
    digitalWrite(LIGHT_RELAY_PIN, lightState ? LOW : HIGH);
  } else if (device == "waterPump") {
    pumpState = state;
    digitalWrite(PUMP_RELAY_PIN, pumpState ? LOW : HIGH);
  } else if (device == "heater") {
    heaterState = state;
    digitalWrite(HEATER_RELAY_PIN, heaterState ? LOW : HIGH);
  }
}

void loop() {
  server.handleClient();
  webSocket.loop();
  
  if (server.args() > 0) {
    lastClientRequest = millis();
  }
  
  readSensors();
  checkTimers();
  
  if (autoMode && dhtSensorWorking) {
    controlTemperature();
  }
  
  if (autoWatering) {
    controlWatering();
  }
  
  if (millis() - lastBroadcast > BROADCAST_INTERVAL) {
    broadcastStatus();
    lastBroadcast = millis();
  }
  
  displayStatus();
  delay(2000);
}

void readSensors() {
  soilMoisture = analogRead(SOIL_MOISTURE_PIN);
  
  TempAndHumidity data = dht.getTempAndHumidity();
  if (dht.getStatus() == DHTesp::ERROR_NONE) {
    temperature = data.temperature;
    humidity = data.humidity;
    dhtSensorWorking = true;
  } else {
    dhtSensorWorking = false;
  }
}

void controlTemperature() {
  if (dhtSensorWorking && !isnan(temperature)) {
    if (temperature > MAX_TEMP && !fanState) {
      digitalWrite(FAN_RELAY_PIN, LOW);
      fanState = true;
    } else if (temperature < MAX_TEMP && fanState) {
      digitalWrite(FAN_RELAY_PIN, HIGH);
      fanState = false;
    }
    
    if (temperature < MIN_TEMP && !heaterState) {
      digitalWrite(HEATER_RELAY_PIN, LOW);
      heaterState = true;
    } else if (temperature > HEATER_OFF_TEMP && heaterState) {
      digitalWrite(HEATER_RELAY_PIN, HIGH);
      heaterState = false;
    }
  }
}

void controlWatering() {
  if (soilMoisture > SOIL_DRY_THRESHOLD && !pumpState) {
    digitalWrite(PUMP_RELAY_PIN, LOW);
    pumpState = true;
    delay(5000);
    digitalWrite(PUMP_RELAY_PIN, HIGH);
    pumpState = false;
  }
}

void checkTimers() {
  unsigned long currentTime = millis();
  
  if (fanTimerEnd > 0 && currentTime >= fanTimerEnd) {
    fanState = false;
    digitalWrite(FAN_RELAY_PIN, HIGH);
    fanTimerEnd = 0;
  }
  
  if (lightTimerEnd > 0 && currentTime >= lightTimerEnd) {
    lightState = false;
    digitalWrite(LIGHT_RELAY_PIN, HIGH);
    lightTimerEnd = 0;
  }
  
  if (pumpTimerEnd > 0 && currentTime >= pumpTimerEnd) {
    pumpState = false;
    digitalWrite(PUMP_RELAY_PIN, HIGH);
    pumpTimerEnd = 0;
  }
  
  if (heaterTimerEnd > 0 && currentTime >= heaterTimerEnd) {
    heaterState = false;
    digitalWrite(HEATER_RELAY_PIN, HIGH);
    heaterTimerEnd = 0;
  }
}

void displayStatus() {
  Serial.println("=== SMART FARM STATUS ===");
  Serial.println("Network: " + String(WiFi.SSID()));
  Serial.println("IP: " + WiFi.localIP().toString());
  Serial.println("Signal: " + String(WiFi.RSSI()) + " dBm");
  Serial.println("DHT: " + String(dhtSensorWorking ? "OK" : "ERROR"));
  
  if (dhtSensorWorking) {
    Serial.println("Temp: " + String(temperature, 1) + "°C");
    Serial.println("Humidity: " + String(humidity, 1) + "%");
  }
  
  Serial.println("Soil: " + String(soilMoisture));
  Serial.println("Fan: " + String(fanState ? "ON" : "OFF"));
  Serial.println("Heater: " + String(heaterState ? "ON" : "OFF"));
  Serial.println("Pump: " + String(pumpState ? "ON" : "OFF"));
  Serial.println("Light: " + String(lightState ? "ON" : "OFF"));
  Serial.println("Mode: " + String(autoMode ? "AUTO" : "MANUAL"));
  Serial.println("========================");
}

// Web Server Handlers
void handleRoot() {
  lastClientRequest = millis();
  String html = "<!DOCTYPE html><html><head><title>Smart Farm</title></head><body>";
  html += "<h1>Smart Farm Control</h1>";
  html += "<p>IP: " + WiFi.localIP().toString() + "</p>";
  html += "<p>Use React app for full control</p>";
  html += "</body></html>";
  server.send(200, "text/html", html);
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
  doc["dhtSensorWorking"] = dhtSensorWorking;
  
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
    controlDevice(device, action, 0);
    server.send(200, "text/plain", "OK");
  } else {
    server.send(400, "text/plain", "Missing parameters");
  }
}

void handleToggleMode() {
  lastClientRequest = millis();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  autoMode = !autoMode;
  server.send(200, "text/plain", "Mode " + String(autoMode ? "AUTO" : "MANUAL"));
  broadcastStatus();
}
