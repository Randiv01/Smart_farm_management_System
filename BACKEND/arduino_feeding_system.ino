/*
 * Smart Farm Feeding System - Arduino Code
 * ESP32-based automated feeding system
 * 
 * Features:
 * - Web server for receiving feeding commands
 * - Servo motor control for feed dispensing
 * - Simple quantity-based feeding (no weight sensor)
 * - WiFi connectivity
 * - RESTful API endpoints
 * 
 * Hardware Requirements:
 * - ESP32 development board
 * - Servo motor (SG90 or similar)
 * - WiFi connection
 * - Power supply
 * 
 * Author: Smart Farm Management System
 * Version: 1.0
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>

// WiFi credentials - Update these with your network details
const char* ssid = "Iphone 11";
const char* password = "22222222";

// Servo motor configuration
#define SERVO_PIN 18
#define SERVO_OPEN_ANGLE 45    // Angle when servo is open (dispensing feed)
#define SERVO_CLOSE_ANGLE 0    // Angle when servo is closed (not dispensing)

// Buzzer configuration
#define BUZZER_PIN 5

// Feeding parameters
#define FEED_RATE 1.0          // grams per second (adjust based on your setup)
#define MIN_FEED_QUANTITY 1    // Minimum feed quantity in grams
#define MAX_FEED_QUANTITY 1000 // Maximum feed quantity in grams

// Global variables
WebServer server(80);
Servo feedServo;
bool isFeeding = false;
unsigned long feedingStartTime = 0;
float currentFeedQuantity = 0;
float targetFeedQuantity = 0;

// Function prototypes
void setupWiFi();
void setupWebServer();
void handleRoot();
void handleFeed();
void handleStatus();
void handleNotFound();
void startFeeding(float quantity);
void stopFeeding();
void updateFeeding();
void buzzerBeep(int duration = 200);
void buzzerSuccess();
void buzzerError();

void setup() {
  Serial.begin(115200);
  delay(2000); // Give time for serial to initialize
  
  Serial.println();
  Serial.println("========================================");
  Serial.println("Smart Farm Feeding System Starting...");
  Serial.println("========================================");
  
  // Initialize servo motor
  Serial.println("Initializing servo motor...");
  feedServo.attach(SERVO_PIN);
  feedServo.write(SERVO_CLOSE_ANGLE);
  delay(1000);
  Serial.println("Servo motor initialized on GPIO " + String(SERVO_PIN));
  
  // Initialize buzzer
  Serial.println("Initializing buzzer...");
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  Serial.println("Buzzer initialized on GPIO " + String(BUZZER_PIN));
  
  // System startup beep
  Serial.println("Playing startup beeps...");
  buzzerBeep(100);
  delay(100);
  buzzerBeep(100);
  Serial.println("Startup beeps completed");
  
  // Setup WiFi
  Serial.println("Setting up WiFi connection...");
  setupWiFi();
  
  // Setup web server
  Serial.println("Setting up web server...");
  setupWebServer();
  
  Serial.println("========================================");
  Serial.println("System ready!");
  Serial.print("Server IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("WiFi SSID: ");
  Serial.println(ssid);
  Serial.print("WiFi Status: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
  Serial.println("========================================");
}

void loop() {
  server.handleClient();
  updateFeeding();
  delay(10);
}

void setupWiFi() {
  Serial.println("Attempting to connect to WiFi...");
  Serial.print("SSID: ");
  Serial.println(ssid);
  Serial.print("Password: ");
  Serial.println(password);
  
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected successfully!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("MAC address: ");
    Serial.println(WiFi.macAddress());
    Serial.print("Signal strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("WiFi connection failed!");
    Serial.print("Status code: ");
    Serial.println(WiFi.status());
    Serial.println("Please check your WiFi credentials and try again.");
  }
}

void setupWebServer() {
  Serial.println("Configuring web server endpoints...");
  
  // Root endpoint - system status
  server.on("/", HTTP_GET, handleRoot);
  Serial.println("  - GET / (status page)");
  
  // Feed endpoint - start feeding with specified quantity
  server.on("/feed", HTTP_POST, handleFeed);
  Serial.println("  - POST /feed (feeding control)");
  
  // Status endpoint - get current system status
  server.on("/status", HTTP_GET, handleStatus);
  Serial.println("  - GET /status (JSON status)");
  
  // Test endpoint for debugging
  server.on("/test", HTTP_POST, []() {
    Serial.println("=== TEST REQUEST RECEIVED ===");
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    
    String body = "";
    if (server.hasArg("plain")) {
      body = server.arg("plain");
    } else {
      // Try to get from client stream
      WiFiClient client = server.client();
      if (client.available()) {
        while (client.available()) {
          body += (char)client.read();
        }
      }
    }
    
    Serial.print("Test body: '");
    Serial.print(body);
    Serial.println("'");
    
    server.send(200, "text/plain", "Test OK - Received: " + body);
  });
  Serial.println("  - POST /test (debug endpoint)");
  
  // CORS preflight handler
  server.on("/", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(200, "text/plain", "");
  });
  
  server.on("/feed", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(200, "text/plain", "");
  });
  
  server.on("/status", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(200, "text/plain", "");
  });
  
  Serial.println("  - OPTIONS handlers configured for CORS");
  
  // Handle 404 errors
  server.onNotFound(handleNotFound);
  Serial.println("  - 404 handler configured");
  
  server.begin();
  Serial.println("Web server started successfully!");
  Serial.println("Server is listening for connections...");
}

void handleRoot() {
  Serial.println("=== ROOT REQUEST RECEIVED ===");
  Serial.println("Request method: GET");
  Serial.println("Request URI: /");
  
  // Add CORS headers
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  
  String html = "<!DOCTYPE html><html><head><title>Smart Farm Feeding System</title></head><body>";
  html += "<h1>Smart Farm Feeding System</h1>";
  html += "<h2>System Status</h2>";
  html += "<p><strong>Status:</strong> " + String(isFeeding ? "Feeding" : "Ready") + "</p>";
  html += "<p><strong>Current Feed Quantity:</strong> " + String(currentFeedQuantity, 2) + "g</p>";
  html += "<p><strong>Target Feed Quantity:</strong> " + String(targetFeedQuantity, 2) + "g</p>";
  html += "<p><strong>WiFi Status:</strong> " + String(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected") + "</p>";
  html += "<p><strong>IP Address:</strong> " + WiFi.localIP().toString() + "</p>";
  html += "<h2>API Endpoints</h2>";
  html += "<ul>";
  html += "<li><strong>GET /</strong> - This status page</li>";
  html += "<li><strong>POST /feed</strong> - Start feeding (send quantity as plain text)</li>";
  html += "<li><strong>GET /status</strong> - Get JSON status</li>";
  html += "</ul>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
  Serial.println("Root page sent successfully");
}

void handleFeed() {
  Serial.println("=== FEED REQUEST RECEIVED ===");
  Serial.println("Request method: POST");
  Serial.println("Request URI: /feed");
  Serial.print("Content-Type: ");
  Serial.println(server.header("Content-Type"));
  Serial.print("Content-Length: ");
  Serial.println(server.header("Content-Length"));
  Serial.print("Has plain arg: ");
  Serial.println(server.hasArg("plain") ? "YES" : "NO");
  Serial.print("Client connected: ");
  Serial.println(server.client().connected() ? "YES" : "NO");
  
  // Add CORS headers
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (isFeeding) {
    Serial.println("ERROR: Already feeding!");
    buzzerError();
    server.send(409, "text/plain", "Already feeding. Please wait for current feeding to complete.");
    return;
  }
  
  // Get quantity from request body (plain text)
  String body = "";
  
  // Try different methods to get the body
  if (server.hasArg("plain")) {
    body = server.arg("plain");
    Serial.println("Got body from 'plain' arg");
  } else {
    // Try to get from client stream
    WiFiClient client = server.client();
    if (client.available()) {
      while (client.available()) {
        body += (char)client.read();
      }
      Serial.println("Got body from client stream");
    } else {
      Serial.println("No body found in any method");
    }
  }
  
  Serial.print("Raw request body: '");
  Serial.print(body);
  Serial.println("'");
  
  float quantity = body.toFloat();
  
  Serial.print("Requested quantity: ");
  Serial.print(body);
  Serial.print(" (parsed as: ");
  Serial.print(quantity);
  Serial.println("g)");
  
  // Validate quantity
  if (quantity <= 0 || quantity < MIN_FEED_QUANTITY || quantity > MAX_FEED_QUANTITY) {
    Serial.print("ERROR: Invalid quantity! Min: ");
    Serial.print(MIN_FEED_QUANTITY);
    Serial.print("g, Max: ");
    Serial.print(MAX_FEED_QUANTITY);
    Serial.print("g, Received: ");
    Serial.print(quantity);
    Serial.println("g");
    Serial.print("Body was: '");
    Serial.print(body);
    Serial.println("'");
    buzzerError();
    server.send(400, "text/plain", "Invalid quantity. Must be between " + String(MIN_FEED_QUANTITY) + " and " + String(MAX_FEED_QUANTITY) + " grams. Received: " + body);
    return;
  }
  
  // Start feeding
  Serial.println("Starting feeding process...");
  startFeeding(quantity);
  buzzerSuccess();
  server.send(200, "text/plain", "Feeding started: " + String(quantity) + "g");
  
  Serial.println("=== FEEDING STARTED SUCCESSFULLY ===");
}

void handleStatus() {
  Serial.println("=== STATUS REQUEST RECEIVED ===");
  Serial.println("Request method: GET");
  Serial.println("Request URI: /status");
  
  // Add CORS headers
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  
  String json = "{";
  json += "\"status\":\"" + String(isFeeding ? "feeding" : "ready") + "\",";
  json += "\"currentQuantity\":" + String(currentFeedQuantity, 2) + ",";
  json += "\"targetQuantity\":" + String(targetFeedQuantity, 2) + ",";
  json += "\"wifiConnected\":" + String(WiFi.status() == WL_CONNECTED ? "true" : "false") + ",";
  json += "\"ipAddress\":\"" + WiFi.localIP().toString() + "\"";
  json += "}";
  
  server.send(200, "application/json", json);
  Serial.println("Status JSON sent successfully");
}

void handleNotFound() {
  server.send(404, "text/plain", "Not found");
}

void startFeeding(float quantity) {
  Serial.println("=== STARTING FEEDING PROCESS ===");
  Serial.print("Target quantity: ");
  Serial.print(quantity);
  Serial.println("g");
  
  isFeeding = true;
  targetFeedQuantity = quantity;
  currentFeedQuantity = 0;
  feedingStartTime = millis();
  
  Serial.print("Opening servo to angle: ");
  Serial.println(SERVO_OPEN_ANGLE);
  
  // Open servo to start dispensing
  feedServo.write(SERVO_OPEN_ANGLE);
  
  Serial.println("Servo opened - Feed dispensing started");
  Serial.println("Feeding process initiated successfully");
}

void stopFeeding() {
  Serial.println("=== STOPPING FEEDING PROCESS ===");
  
  isFeeding = false;
  
  Serial.print("Closing servo to angle: ");
  Serial.println(SERVO_CLOSE_ANGLE);
  
  // Close servo to stop dispensing
  feedServo.write(SERVO_CLOSE_ANGLE);
  
  Serial.print("Feeding completed - Total dispensed: ");
  Serial.print(currentFeedQuantity, 2);
  Serial.println("g");
  
  // Success beep sequence
  Serial.println("Playing success beep sequence...");
  buzzerSuccess();
  
  // Reset quantities
  currentFeedQuantity = 0;
  targetFeedQuantity = 0;
  
  Serial.println("=== FEEDING PROCESS COMPLETED ===");
}

void updateFeeding() {
  if (!isFeeding) return;
  
  // Calculate feeding progress based on time
  unsigned long currentTime = millis();
  unsigned long feedingDuration = currentTime - feedingStartTime;
  
  // Calculate current feed quantity based on time and feed rate
  currentFeedQuantity = (feedingDuration / 1000.0) * FEED_RATE;
  
  // Check if target quantity has been reached
  if (currentFeedQuantity >= targetFeedQuantity) {
    stopFeeding();
  }
}

/*
 * Configuration Notes:
 * 
 * 1. WiFi Setup:
 *    - Update ssid and password variables with your network credentials
 *    - Ensure your network is 2.4GHz (ESP32 doesn't support 5GHz)
 * 
 * 2. Servo Motor:
 *    - Connect servo signal wire to GPIO 2
 *    - Connect servo power (5V) and ground
 *    - Adjust SERVO_OPEN_ANGLE and SERVO_CLOSE_ANGLE based on your physical setup
 * 
 * 3. Feed Rate Calibration:
 *    - Adjust FEED_RATE constant based on your actual dispensing rate
 *    - Test with known quantities and measure actual output
 *    - Formula: FEED_RATE = actual_grams_dispensed / time_in_seconds
 * 
 * 4. Safety Limits:
 *    - MIN_FEED_QUANTITY and MAX_FEED_QUANTITY prevent invalid feeding requests
 *    - Adjust based on your system's capabilities
 * 
 * 5. API Usage:
 *    - POST /feed with quantity as plain text in request body
 *    - Example: curl -X POST http://ESP32_IP/feed -d "50"
 *    - System will dispense 50 grams of feed
 * 
 * 6. Monitoring:
 *    - GET /status returns JSON with current system status
 *    - GET / returns HTML status page
 *    - Serial monitor shows detailed logs
 * 
 * 7. Buzzer Functions:
 *    - Startup beeps when system initializes
 *    - Success beeps when feeding starts/completes
 *    - Error beeps for invalid requests or system errors
 */

// Buzzer control functions
void buzzerBeep(int duration) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
}

void buzzerSuccess() {
  // Success pattern: short beep
  buzzerBeep(150);
  delay(50);
  buzzerBeep(150);
}

void buzzerError() {
  // Error pattern: long beep
  buzzerBeep(500);
}
