// DHT22 Sensor Reader for Greenhouse Telemetry
// This script can be used with Arduino or Raspberry Pi to read DHT22 sensor data
// and send it to the Plant Management system

const axios = require('axios');

// Example function to simulate DHT22 sensor reading
// In a real implementation, this would interface with actual hardware
const readDHT22Data = () => {
  // Simulate DHT22 sensor readings
  const temperature = 22.5 + (Math.random() - 0.5) * 6; // 19.5°C to 25.5°C
  const humidity = 60 + (Math.random() - 0.5) * 20; // 50% to 70%
  const soilMoisture = 65 + (Math.random() - 0.5) * 30; // 50% to 80%
  const lightLevel = 800 + (Math.random() - 0.5) * 200; // 700 to 900 lux
  
  return {
    temperature: Math.round(temperature * 10) / 10,
    humidity: Math.round(humidity * 10) / 10,
    soilMoisture: Math.round(soilMoisture * 10) / 10,
    lightLevel: Math.round(lightLevel)
  };
};

// Send telemetry data to the Plant Management system
const sendTelemetryData = async (greenhouseId = 'GH-01') => {
  try {
    const sensorData = readDHT22Data();
    
    const telemetryData = {
      greenhouseId,
      ...sensorData
    };

    const response = await axios.post('http://localhost:5000/api/telemetry', telemetryData);
    
    if (response.data.success) {
      console.log(`✅ Telemetry data sent for ${greenhouseId}:`, sensorData);
    } else {
      console.error('❌ Failed to send telemetry data:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error sending telemetry data:', error.message);
  }
};

// Arduino-style setup function
const setup = () => {
  console.log('🌱 DHT22 Sensor Reader Started');
  console.log('📡 Sending telemetry data every 30 seconds...');
  
  // Send initial data
  sendTelemetryData();
  
  // Set up interval to send data every 30 seconds
  setInterval(() => {
    sendTelemetryData();
  }, 30000); // 30 seconds
};

// Start the sensor reader
setup();

// Export functions for use in other modules
module.exports = {
  readDHT22Data,
  sendTelemetryData,
  setup
};

