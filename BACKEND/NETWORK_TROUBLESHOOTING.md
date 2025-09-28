# ESP32 Network Troubleshooting Guide

## Problem: Frontend Cannot Connect to ESP32

### Symptoms:
- ESP32 shows IP: 172.20.10.3 (mobile hotspot)
- Frontend shows "Failed to connect to ESP32 device"
- Browser console shows: `net::ERR_CONNECTION_TIMED_OUT`

## Root Cause Analysis

The ESP32 is connected to a **different network** than your development machine:

- **ESP32 Network**: 172.20.10.3 (iPhone hotspot)
- **Development Machine**: Likely on home/office WiFi (192.168.x.x or 10.x.x.x)

## Solutions

### Solution 1: Connect Both Devices to Same Network (Recommended)

1. **Connect your development machine to the iPhone hotspot:**
   - Go to WiFi settings on your computer
   - Connect to "Iphone 11" network
   - Use password: "22222222"

2. **Verify both devices are on same network:**
   - ESP32: 172.20.10.3
   - Your computer should get IP like: 172.20.10.x

3. **Test connection:**
   - Open browser and go to: `http://172.20.10.3`
   - You should see the ESP32 status page

### Solution 2: Change ESP32 to Your Home Network

1. **Update WiFi credentials in Arduino code:**
   ```cpp
   const char* ssid = "YOUR_HOME_WIFI_NAME";
   const char* password = "YOUR_HOME_WIFI_PASSWORD";
   ```

2. **Upload updated code to ESP32**

3. **Check Serial Monitor for new IP address**

4. **Update frontend with new IP address**

### Solution 3: Use Computer as Hotspot

1. **Create hotspot on your computer:**
   - Windows: Settings → Network & Internet → Mobile hotspot
   - Mac: System Preferences → Sharing → Internet Sharing

2. **Connect ESP32 to your computer's hotspot**

3. **Update ESP32 WiFi credentials accordingly**

## Network Testing Commands

### Test ESP32 Connectivity

1. **Ping test:**
   ```bash
   ping 172.20.10.3
   ```

2. **Browser test:**
   ```
   http://172.20.10.3
   ```

3. **Curl test:**
   ```bash
   curl http://172.20.10.3/status
   ```

### Check Your Computer's Network

1. **Windows:**
   ```cmd
   ipconfig
   ```

2. **Mac/Linux:**
   ```bash
   ifconfig
   ```

## Common Network Issues

### Issue 1: Firewall Blocking Connection
- **Solution**: Temporarily disable firewall or add exception for ESP32 IP

### Issue 2: CORS Errors
- **Solution**: Updated Arduino code now includes CORS headers

### Issue 3: Mobile Hotspot Limitations
- **Solution**: Some mobile hotspots block device-to-device communication
- **Workaround**: Use home WiFi network instead

## Verification Steps

1. **ESP32 Serial Monitor should show:**
   ```
   WiFi connected successfully!
   IP address: 172.20.10.3
   Web server started successfully!
   ```

2. **Browser should show ESP32 status page at:**
   ```
   http://172.20.10.3
   ```

3. **Frontend should connect successfully**

## Quick Fix Checklist

- [ ] Both devices on same network
- [ ] ESP32 IP address correct in frontend
- [ ] No firewall blocking connection
- [ ] ESP32 web server running (check Serial Monitor)
- [ ] WiFi credentials correct
- [ ] Updated Arduino code with CORS headers uploaded

## Network Configuration Examples

### iPhone Hotspot Network:
- **Network**: Iphone 11
- **Password**: 22222222
- **IP Range**: 172.20.10.x
- **Gateway**: 172.20.10.1

### Home WiFi Network:
- **Network**: YourHomeWiFi
- **Password**: YourPassword
- **IP Range**: 192.168.1.x or 10.0.0.x
- **Gateway**: Usually 192.168.1.1 or 10.0.0.1

## Still Having Issues?

1. **Check ESP32 Serial Monitor** for detailed connection logs
2. **Verify WiFi credentials** are exactly correct
3. **Try different network** (home WiFi vs mobile hotspot)
4. **Restart both devices** (ESP32 and computer)
5. **Check network security settings** (WPA2, WPA3 compatibility)
