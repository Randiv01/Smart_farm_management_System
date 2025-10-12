# ESP32 Smart Agriculture Integration Guide

This guide explains how to integrate your ESP32 Arduino code with the Smart Agriculture System frontend and backend.

## 🌟 Features

Your ESP32 system provides:
- **Real-time sensor monitoring** (Temperature, Humidity, Soil Moisture)
- **WebSocket communication** for instant updates
- **Device control** (Fan, Heater, Water Pump, Lights)
- **Auto/Manual modes** with smart temperature control
- **Multi-WiFi support** with static IP configuration
- **Timer functionality** for devices
- **Health monitoring** and error handling

## 🔧 Setup Instructions

### 1. ESP32 Arduino Code Setup

Your Arduino code is already configured with:
- **Multi-WiFi networks**: Danuz, SLT-Fiber-A577, Iphone 11
- **Static IP addresses**: 
  - Danuz: `172.20.10.2`
  - SLT-Fiber-A577: `192.168.1.100`
  - Iphone 11: `172.20.10.3`
- **WebSocket server** on port 81
- **HTTP server** on port 80
- **Temperature thresholds**: Fan ON >35°C, Heater ON <28°C
- **Light default**: OFF

### 2. Backend Integration

The backend now includes:
- **ESP32 proxy routes** (`/routes/esp32Routes.js`)
- **Automatic IP detection** and connection testing
- **HTTP fallback** when WebSocket fails
- **Error handling** and retry logic

### 3. Frontend Integration

The frontend includes:
- **ESP32 WebSocket service** (`/utils/esp32WebSocketService.js`)
- **Real-time data display** with gauges
- **Device control buttons** with timer functionality
- **Connection status monitoring**
- **Automatic fallback** to HTTP polling

## 📡 Network Configuration

### WiFi Networks (Priority Order)
1. **Danuz** - `172.20.10.2` (Mobile Hotspot)
2. **SLT-Fiber-A577** - `192.168.1.100` (University WiFi)
3. **Iphone 11** - `172.20.10.3` (Home WiFi)

### Connection Methods
1. **WebSocket** (Port 81) - Real-time communication
2. **HTTP** (Port 80) - Fallback polling method

## 🎮 Control Features

### Device Controls
- **Fan**: Auto control based on temperature >35°C
- **Heater**: Auto control based on temperature <28°C
- **Lights**: Manual control in any mode, timer support
- **Water Pump**: Auto watering based on soil moisture

### Timer Support
- Set timers for any device (hours + minutes)
- Automatic shutoff when timer expires
- Visual timer indicators in UI

### Mode Switching
- **Auto Mode**: Temperature-based fan/heater control
- **Manual Mode**: Full manual control of all devices
- **Lights**: Always controllable regardless of mode

## 🔍 Testing & Troubleshooting

### Test ESP32 Connection
```bash
# Run the test script
node BACKEND/scripts/testESP32Connection.js
```

### Manual Testing
1. **Check ESP32 Serial Monitor** for connection status
2. **Test WebSocket** using browser dev tools
3. **Verify IP addresses** in your network
4. **Check firewall settings** if connection fails

### Common Issues

#### ESP32 Not Found
- Verify WiFi credentials in Arduino code
- Check if ESP32 is on the same network
- Ensure static IP configuration is correct
- Test with `ping 172.20.10.2`

#### WebSocket Connection Failed
- Check if port 81 is accessible
- Verify ESP32 WebSocket server is running
- Test HTTP endpoints first: `http://172.20.10.2/health`

#### Sensor Data Issues
- Check DHT22 sensor wiring and power
- Verify sensor is connected to GPIO4
- Check for sensor errors in serial monitor

## 📊 API Endpoints

### ESP32 Direct Endpoints
- `GET /health` - Device health status
- `GET /status` - Current sensor data and device states
- `POST /control` - Send control commands
- `GET /toggleMode` - Switch auto/manual mode
- `GET /toggleWatering` - Toggle auto watering

### Backend Proxy Endpoints
- `GET /health` - Proxy to ESP32 health check
- `GET /status` - Proxy to ESP32 status
- `POST /control` - Proxy control commands
- `GET /toggleMode` - Proxy mode toggle
- `GET /config` - ESP32 configuration info
- `GET /test` - Test ESP32 connectivity

## 🔄 Data Flow

1. **ESP32** reads sensors and controls devices
2. **WebSocket** sends real-time data to frontend
3. **Frontend** displays data and sends control commands
4. **Backend** provides proxy routes as fallback
5. **HTTP polling** used when WebSocket fails

## 🎯 Usage Instructions

### For Real-time Monitoring
1. Select **GH-01** greenhouse
2. System automatically connects to ESP32
3. View real-time sensor data in gauges
4. Monitor connection status

### For Device Control
1. Switch to **Manual Mode** for full control
2. Use toggle buttons to control devices
3. Set timers using the clock button
4. **Lights** can be controlled in any mode

### For Troubleshooting
1. Click **Test** button to check connectivity
2. Use **Refresh** to manually update data
3. Check connection status in the header
4. Monitor browser console for errors

## 🔧 Configuration

### Update ESP32 IP Addresses
Edit `BACKEND/routes/esp32Routes.js`:
```javascript
const ESP32_CONFIG = {
  primaryIPs: [
    '172.20.10.2',    // Your ESP32 IP
    '192.168.1.100',  // Alternative IP
    // Add more IPs as needed
  ]
};
```

### Update Frontend IPs
Edit `FRONTEND/src/utils/esp32WebSocketService.js`:
```javascript
this.esp32IPs = [
  '172.20.10.2',    // Your ESP32 IP
  '192.168.1.100',  // Alternative IP
  // Add more IPs as needed
];
```

## 📈 Performance

- **WebSocket**: ~2-second update interval
- **HTTP Polling**: ~2-second fallback interval
- **Connection timeout**: 5 seconds
- **Reconnection attempts**: 5 maximum
- **Heartbeat monitoring**: 30-second intervals

## 🚀 Next Steps

1. **Upload Arduino code** to your ESP32
2. **Start backend server**: `npm run dev`
3. **Start frontend**: `npm start`
4. **Test connection** using the test script
5. **Monitor real-time data** in the web interface

Your ESP32 Smart Agriculture System is now fully integrated with the web application! 🌱

