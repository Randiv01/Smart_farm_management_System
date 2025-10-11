// ESP32 Network Scanner
// This script scans the local network to find your ESP32 device

import axios from 'axios';

const NETWORK_RANGE = '192.168.1'; // ESP32 network
const START_IP = 1;
const END_IP = 254;

const scanForESP32 = async (ip) => {
  try {
    // Try health endpoint first (faster)
    const response = await axios.get(`http://${ip}/health`, {
      timeout: 2000,
      validateStatus: () => true // Don't throw on non-200 status
    });
    
    if (response.status === 200) {
      console.log(`✅ ESP32 Found at ${ip}!`);
      console.log(`   Health Response:`, response.data);
      
      // Try to get full status
      try {
        const statusResponse = await axios.get(`http://${ip}/status`, {
          timeout: 2000
        });
        console.log(`   Status Response:`, statusResponse.data);
        return { success: true, ip, health: response.data, status: statusResponse.data };
      } catch (error) {
        console.log(`   Status endpoint failed: ${error.message}`);
        return { success: true, ip, health: response.data, status: null };
      }
    }
  } catch (error) {
    // Device not responding or not ESP32
  }
  
  return { success: false, ip };
};

const scanNetwork = async () => {
  console.log(`🔍 Scanning network ${NETWORK_RANGE}.x for ESP32 devices...`);
  console.log(`📡 This may take a few minutes...\n`);
  
  const results = [];
  const promises = [];
  
  // Create promises for all IP addresses
  for (let i = START_IP; i <= END_IP; i++) {
    const ip = `${NETWORK_RANGE}.${i}`;
    promises.push(scanForESP32(ip));
  }
  
  // Wait for all scans to complete
  const scanResults = await Promise.allSettled(promises);
  
  // Process results
  scanResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else {
      console.log(`❌ Error scanning ${NETWORK_RANGE}.${START_IP + index}:`, result.reason.message);
    }
  });
  
  // Find successful results
  const foundESP32s = results.filter(r => r.success);
  
  console.log('\n📊 Scan Results:');
  console.log('================');
  
  if (foundESP32s.length > 0) {
    console.log(`🎉 Found ${foundESP32s.length} ESP32 device(s):`);
    foundESP32s.forEach(device => {
      console.log(`\n✅ ESP32 at ${device.ip}`);
      if (device.health) {
        console.log(`   Health: ${JSON.stringify(device.health)}`);
      }
      if (device.status) {
        console.log(`   Temperature: ${device.status.temperature}°C`);
        console.log(`   Humidity: ${device.status.humidity}%`);
        console.log(`   Soil Moisture: ${device.status.soilMoisture}`);
        console.log(`   Auto Mode: ${device.status.autoMode ? 'ON' : 'OFF'}`);
      }
    });
    
    console.log('\n💡 Update your ESP32 IP configuration:');
    foundESP32s.forEach(device => {
      console.log(`   Add "${device.ip}" to your ESP32 IP list`);
    });
  } else {
    console.log('❌ No ESP32 devices found on the network');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure ESP32 is powered on');
    console.log('   2. Check WiFi connection');
    console.log('   3. Verify Arduino code is uploaded');
    console.log('   4. Check if ESP32 is on a different network');
  }
  
  return foundESP32s;
};

// Run the scan
scanNetwork().catch(console.error);
