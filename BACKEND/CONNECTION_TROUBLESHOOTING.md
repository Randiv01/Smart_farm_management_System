# ESP32 Connection Troubleshooting Guide

## Problem: AbortError - Connection Timeout

### Error Symptoms:
- `AbortError: signal is aborted without reason`
- `net::ERR_CONNECTION_TIMED_OUT`
- ESP32 not responding to HTTP requests

## Step-by-Step Troubleshooting

### Step 1: Verify ESP32 is Running
1. **Check Serial Monitor** - Should show:
   ```
   System ready!
   Server IP: 172.20.10.3
   WiFi SSID: Iphone 11
   WiFi Status: Connected
   ```

2. **Look for any error messages** in Serial Monitor

### Step 2: Test Basic Connectivity

#### Option A: Browser Test
1. Open your web browser
2. Go to: `http://172.20.10.3`
3. You should see the ESP32 status page

#### Option B: Command Line Test
```bash
# Windows Command Prompt
ping 172.20.10.3

# Test HTTP connection
curl http://172.20.10.3
```

#### Option C: Use Frontend Ping Test
1. Click the **"Ping Test"** button in the frontend
2. Check browser console for results

### Step 3: Check Network Configuration

#### Verify Both Devices on Same Network:
1. **ESP32 Network**: 172.20.10.3 (iPhone hotspot)
2. **Your Computer**: Should be 172.20.10.x

#### Check Your Computer's IP:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

### Step 4: Common Issues and Solutions

#### Issue 1: ESP32 Not Connected to WiFi
**Symptoms**: Serial Monitor shows connection failed
**Solution**: 
- Check WiFi credentials in Arduino code
- Verify "Iphone 11" network is available
- Check password: "22222222"

#### Issue 2: Different Networks
**Symptoms**: Can't reach ESP32 from browser
**Solution**:
- Connect your computer to "Iphone 11" hotspot
- Use password: "22222222"
- Both devices should get 172.20.10.x IP addresses

#### Issue 3: Firewall Blocking
**Symptoms**: Ping works but HTTP doesn't
**Solution**:
- Temporarily disable Windows Firewall
- Add exception for ESP32 IP address

#### Issue 4: Mobile Hotspot Limitations
**Symptoms**: Connection works sometimes but not always
**Solution**:
- Some mobile hotspots block device-to-device communication
- Try using home WiFi instead

### Step 5: ESP32 Web Server Issues

#### Check if Web Server is Running:
Look for this in Serial Monitor:
```
Web server started successfully!
Server is listening for connections...
```

#### If Web Server Not Starting:
1. Check for memory issues
2. Restart ESP32
3. Re-upload code

### Step 6: Advanced Debugging

#### Enable Detailed Logging:
The updated Arduino code includes detailed request logging. When you make a request, you should see:
```
=== ROOT REQUEST RECEIVED ===
Request method: GET
Request URI: /
Content-Type: text/html
Root page sent successfully
```

#### Test with curl:
```bash
# Test root page
curl -v http://172.20.10.3/

# Test status endpoint
curl -v http://172.20.10.3/status

# Test feed endpoint
curl -X POST http://172.20.10.3/feed -H "Content-Type: text/plain" -d "50"
```

## Quick Fix Checklist

- [ ] ESP32 Serial Monitor shows "System ready!"
- [ ] ESP32 IP is 172.20.10.3
- [ ] Your computer is on same network (172.20.10.x)
- [ ] Browser can access http://172.20.10.3
- [ ] Ping test works: `ping 172.20.10.3`
- [ ] No firewall blocking connection
- [ ] ESP32 web server is running

## Alternative Solutions

### Solution 1: Use Home WiFi
1. Update ESP32 WiFi credentials to your home network
2. Connect your computer to same home network
3. Update frontend with new ESP32 IP

### Solution 2: Create Computer Hotspot
1. Create hotspot on your computer
2. Connect ESP32 to your computer's hotspot
3. Both devices will be on same network

### Solution 3: Use USB Connection
1. Connect ESP32 via USB
2. Use localhost or 127.0.0.1 for testing
3. Not suitable for production but good for debugging

## Still Having Issues?

1. **Check ESP32 Serial Monitor** for any error messages
2. **Try different network** (home WiFi vs mobile hotspot)
3. **Restart both devices** (ESP32 and computer)
4. **Check ESP32 power supply** - insufficient power can cause connection issues
5. **Try different ESP32 board** if available

## Expected Working State

When everything is working correctly:
- ✅ ESP32 Serial Monitor shows "System ready!"
- ✅ Browser can access http://172.20.10.3
- ✅ Frontend "System Check" button works
- ✅ Frontend "Ping Test" button works
- ✅ "Feed Now" button works
- ✅ Servo opens and buzzer beeps
