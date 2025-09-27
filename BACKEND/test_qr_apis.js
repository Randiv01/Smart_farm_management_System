// test_qr_apis.js - Test QR Code APIs
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

const testQRAPIs = async () => {
  console.log('🧪 Testing QR Code APIs...\n');

  // Test 1: Validate QR Code
  console.log('1️⃣ Testing QR Code Validation...');
  try {
    const validateResponse = await fetch(`${BASE_URL}/api/qr-codes/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrData: '{"id":"test-animal-123","type":"animal","timestamp":"2025-09-26T19:35:27.162Z","system":"SmartFarm"}'
      })
    });
    
    const validateResult = await validateResponse.json();
    console.log('✅ Validation Result:', validateResult);
  } catch (error) {
    console.error('❌ Validation Error:', error.message);
  }

  // Test 2: Get QR Code Info
  console.log('\n2️⃣ Testing QR Code Info...');
  try {
    const infoResponse = await fetch(`${BASE_URL}/api/qr-codes/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrData: '{"id":"test-animal-123","type":"animal","timestamp":"2025-09-26T19:35:27.162Z","system":"SmartFarm"}'
      })
    });
    
    const infoResult = await infoResponse.json();
    console.log('✅ Info Result:', infoResult);
  } catch (error) {
    console.error('❌ Info Error:', error.message);
  }

  // Test 3: Scan QR Code (will fail for test data, but should show proper error)
  console.log('\n3️⃣ Testing QR Code Scanning...');
  try {
    const scanResponse = await fetch(`${BASE_URL}/api/qr-codes/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrData: '{"id":"test-animal-123","type":"animal","timestamp":"2025-09-26T19:35:27.162Z","system":"SmartFarm"}'
      })
    });
    
    const scanResult = await scanResponse.json();
    console.log('✅ Scan Result:', scanResult);
  } catch (error) {
    console.error('❌ Scan Error:', error.message);
  }

  // Test 4: Test invalid QR code
  console.log('\n4️⃣ Testing Invalid QR Code...');
  try {
    const invalidResponse = await fetch(`${BASE_URL}/api/qr-codes/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrData: 'invalid-qr-data'
      })
    });
    
    const invalidResult = await invalidResponse.json();
    console.log('✅ Invalid QR Result (should show error):', invalidResult);
  } catch (error) {
    console.error('❌ Invalid QR Error:', error.message);
  }

  console.log('\n🎉 QR Code API Testing Completed!');
  console.log('\n📱 Next Steps:');
  console.log('1. Go to http://localhost:3000');
  console.log('2. Login to Animal Management');
  console.log('3. Navigate to QR Scanner page');
  console.log('4. Test the frontend interface');
};

// Run the tests
testQRAPIs().catch(console.error);

