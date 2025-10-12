// ESP32 Connection Test Script
// This script tests connectivity to your ESP32 device

import axios from 'axios';

const ESP32_IPS = [
  '172.20.10.2',    // Danuz network
  '192.168.1.100',  // SLT-Fiber-A577 network
  '172.20.10.3',    // Iphone 11 network
  '192.168.4.1'     // ESP32 AP mode default
];

const testESP32Connection = async (ip) => {
  try {
    console.log(`🔍 Testing connection to ${ip}...`);
    
    // Test health endpoint
    const healthResponse = await axios.get(`http://${ip}/health`, {
      timeout: 5000
    });
    console.log(`✅ Health check successful:`, healthResponse.data);
    
    // Test status endpoint
    const statusResponse = await axios.get(`http://${ip}/status`, {
      timeout: 5000
    });
    console.log(`✅ Status check successful:`, statusResponse.data);
    
    return { success: true, ip, data: statusResponse.data };
  } catch (error) {
    console.log(`❌ Connection failed to ${ip}:`, error.message);
    return { success: false, ip, error: error.message };
  }
};

const testAllESP32Connections = async () => {
  console.log('🧪 Starting ESP32 connectivity test...\n');
  
  const results = [];
  for (const ip of ESP32_IPS) {
    const result = await testESP32Connection(ip);
    results.push(result);
    console.log(''); // Empty line for readability
  }
  
  const activeESP32 = results.find(r => r.success);
  
  console.log('📊 Test Results Summary:');
  console.log('========================');
  
  if (activeESP32) {
    console.log(`✅ ESP32 Found at: ${activeESP32.ip}`);
    console.log('📡 Sensor Data:');
    console.log(`   Temperature: ${activeESP32.data.temperature}°C`);
    console.log(`   Humidity: ${activeESP32.data.humidity}%`);
    console.log(`   Soil Moisture: ${activeESP32.data.soilMoisture}`);
    console.log(`   Fan State: ${activeESP32.data.fanState ? 'ON' : 'OFF'}`);
    console.log(`   Light State: ${activeESP32.data.lightState ? 'ON' : 'OFF'}`);
    console.log(`   Pump State: ${activeESP32.data.pumpState ? 'ON' : 'OFF'}`);
    console.log(`   Heater State: ${activeESP32.data.heaterState ? 'ON' : 'OFF'}`);
    console.log(`   Auto Mode: ${activeESP32.data.autoMode ? 'ON' : 'OFF'}`);
    console.log(`   DHT Sensor: ${activeESP32.data.dhtSensorWorking ? 'WORKING' : 'NOT WORKING'}`);
  } else {
    console.log('❌ No ESP32 devices found');
    console.log('💡 Make sure your ESP32 is:');
    console.log('   1. Powered on');
    console.log('   2. Connected to WiFi');
    console.log('   3. Running the Arduino code');
    console.log('   4. On the same network as this computer');
  }
  
  console.log('\n📋 All test results:');
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.ip}: ${result.success ? 'Connected' : result.error}`);
  });
};

// Run the test
testAllESP32Connections().catch(console.error);

