# Smart Farm Feeding System - Arduino Setup Guide

## Overview
This Arduino code provides a simplified feeding system for the Smart Farm Management System. It uses an ESP32 microcontroller to control a servo motor for automated feed dispensing.

## Hardware Requirements

### Components Needed:
- **ESP32 Development Board** (ESP32-WROOM-32 or similar)
- **Servo Motor** (SG90 or similar micro servo)
- **Buzzer** (Active buzzer 5V)
- **Jumper Wires**
- **Breadboard** (optional, for prototyping)
- **Power Supply** (5V for servo and buzzer, 3.3V for ESP32)
- **WiFi Network** (2.4GHz)

### Wiring Diagram:
```
ESP32          Servo Motor (SG90)
------         ------------------
GPIO 18   -->  Signal (Orange)
5V        -->  Power (Red) - External power recommended
GND       -->  Ground (Brown)

ESP32          Buzzer
------         ------
GPIO 5     -->  Positive terminal
GND        -->  Negative terminal
```

## Software Setup

### 1. Arduino IDE Configuration
1. Install Arduino IDE (version 1.8.19 or later)
2. Install ESP32 board package:
   - Go to File → Preferences
   - Add this URL to "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to Tools → Board → Boards Manager
   - Search for "ESP32" and install "ESP32 by Espressif Systems"

### 2. Required Libraries
The code uses these libraries:
- **WiFi** (built-in for ESP32)
- **WebServer** (built-in for ESP32)
- **ESP32Servo** (must be installed)

#### Installing ESP32Servo Library:
1. Open Arduino IDE
2. Go to **Tools** → **Manage Libraries**
3. Search for "**ESP32Servo**"
4. Install the library by **Kevin Harrington**
5. Alternative: Go to **Sketch** → **Include Library** → **Add .ZIP Library** and download from: https://github.com/madhephaestus/ESP32Servo

### 3. Code Configuration
Before uploading, update these variables in the code:

```cpp
// WiFi credentials - Update these with your network details
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 4. Upload Settings
1. Select your ESP32 board: Tools → Board → ESP32 Arduino → ESP32 Dev Module
2. Select the correct COM port: Tools → Port → [Your ESP32 Port]
3. Set upload speed: Tools → Upload Speed → 115200
4. Upload the code

## Calibration

### 1. Servo Motor Calibration
Test and adjust these values based on your physical setup:
```cpp
#define SERVO_PIN 18           // GPIO pin for servo signal
#define SERVO_OPEN_ANGLE 90    // Angle when dispensing feed
#define SERVO_CLOSE_ANGLE 0    // Angle when not dispensing
```

### 2. Buzzer Configuration
The buzzer is configured for audio feedback:
```cpp
#define BUZZER_PIN 5           // GPIO pin for buzzer
```
- **Startup**: Two short beeps when system initializes
- **Success**: Two short beeps when feeding starts/completes
- **Error**: One long beep for invalid requests

### 3. Feed Rate Calibration
Determine your system's actual dispensing rate:
1. Set a test quantity (e.g., 50g)
2. Time how long it takes to dispense
3. Calculate: `FEED_RATE = grams_dispensed / time_in_seconds`
4. Update the constant:
```cpp
#define FEED_RATE 1.0          // grams per second
```

### 4. Safety Limits
Adjust based on your system's capabilities:
```cpp
#define MIN_FEED_QUANTITY 1    // Minimum feed quantity in grams
#define MAX_FEED_QUANTITY 1000 // Maximum feed quantity in grams
```

## API Endpoints

### 1. System Status
- **GET /** - HTML status page
- **GET /status** - JSON status response

### 2. Feeding Control
- **POST /feed** - Start feeding
  - Content-Type: text/plain
  - Body: quantity in grams (e.g., "50")
  - Response: 200 OK or error message

### Example Usage:
```bash
# Check system status
curl http://ESP32_IP/status

# Start feeding 50 grams
curl -X POST http://ESP32_IP/feed -d "50"
```

## Integration with Frontend

The FeedingScheduler component sends feeding requests like this:
```javascript
const feedRes = await fetch(`http://${esp32Ip}/feed`, {
  method: "POST",
  headers: { "Content-Type": "text/plain" },
  body: formData.quantity.toString(),
});
```

## Troubleshooting

### Common Issues:

1. **Servo Library Compilation Error**
   - Error: "This library only supports boards with an AVR, SAM, SAMD..."
   - Solution: Install ESP32Servo library instead of standard Servo library
   - Go to Tools → Manage Libraries → Search "ESP32Servo" → Install

2. **WiFi Connection Failed**
   - Check SSID and password
   - Ensure network is 2.4GHz (not 5GHz)
   - Check signal strength

3. **Servo Not Moving**
   - Verify wiring connections (GPIO 18 for signal)
   - Check power supply (servo needs 5V)
   - Test servo angles in code
   - Ensure external power supply for servo if it stalls

4. **Buzzer Not Working**
   - Check wiring (GPIO 5 for positive, GND for negative)
   - Verify buzzer is active type (5V)
   - Test with simple digitalWrite(BUZZER_PIN, HIGH)

5. **Inaccurate Feeding**
   - Recalibrate FEED_RATE constant
   - Check for feed blockages
   - Verify servo movement range

6. **Web Server Not Responding**
   - Check serial monitor for IP address
   - Verify firewall settings
   - Test with curl or browser

### Serial Monitor Output:
```
========================================
Smart Farm Feeding System Starting...
========================================
Initializing servo motor...
Servo motor initialized on GPIO 18
Initializing buzzer...
Buzzer initialized on GPIO 5
Playing startup beeps...
Startup beeps completed
Setting up WiFi connection...
Attempting to connect to WiFi...
SSID: Iphone 11
Password: 22222222
Connecting to WiFi........
WiFi connected successfully!
IP address: 192.168.1.100
MAC address: 24:6F:28:XX:XX:XX
Signal strength (RSSI): -45 dBm
Setting up web server...
Configuring web server endpoints...
  - GET / (status page)
  - POST /feed (feeding control)
  - GET /status (JSON status)
  - 404 handler configured
Web server started successfully!
Server is listening for connections...
========================================
System ready!
Server IP: 192.168.1.100
WiFi SSID: Iphone 11
WiFi Status: Connected
========================================
```

### Troubleshooting Serial Monitor Issues:

**If you see no output in Serial Monitor:**

1. **Check Serial Monitor Settings:**
   - Go to Tools → Serial Monitor
   - Set baud rate to **115200**
   - Set line ending to **Both NL & CR**

2. **Check Board Selection:**
   - Go to Tools → Board → ESP32 Arduino → ESP32 Dev Module
   - Verify correct COM port is selected

3. **Check USB Cable:**
   - Use a data cable (not just charging cable)
   - Try different USB port
   - Try different USB cable

4. **Reset ESP32:**
   - Press and hold BOOT button
   - Press and release RESET button
   - Release BOOT button
   - Upload code again

5. **Check WiFi Credentials:**
   - Verify SSID and password are correct
   - Ensure network is 2.4GHz (not 5GHz)
   - Check if network requires special authentication

## Safety Considerations

1. **Power Supply**: Ensure adequate power for ESP32, servo motor, and buzzer
2. **Feed Storage**: Keep feed containers clean and dry
3. **Servo Limits**: Don't exceed servo's mechanical limits
4. **Buzzer Volume**: Consider noise levels in your environment
5. **Network Security**: Consider using WPA3 or enterprise WiFi
6. **Physical Safety**: Ensure servo movement doesn't cause injury

## Maintenance

1. **Regular Cleaning**: Clean feed dispensing mechanism
2. **Servo Lubrication**: Lubricate servo gears if needed
3. **Buzzer Testing**: Test buzzer functionality periodically
4. **WiFi Monitoring**: Monitor connection stability
5. **Calibration Check**: Periodically verify feed rate accuracy

## Future Enhancements

Potential improvements for the system:
- Weight sensor integration for precise feeding
- Multiple servo support for different feed types
- Temperature and humidity monitoring
- Mobile app integration
- Data logging and analytics
- Emergency stop functionality
