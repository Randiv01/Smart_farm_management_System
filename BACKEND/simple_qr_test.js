// simple_qr_test.js - Simple QR code test
import QRCode from 'qrcode';

// Create a test QR code data
const testQRData = {
  id: "test-animal-123",
  type: "animal",
  timestamp: new Date().toISOString(),
  system: "SmartFarm"
};

const qrString = JSON.stringify(testQRData);

console.log('🧪 QR Code System Test');
console.log('=' .repeat(50));
console.log('Test QR Data:');
console.log(qrString);
console.log('=' .repeat(50));

// Generate QR code as data URL
QRCode.toDataURL(qrString, {
  width: 300,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
}).then(qrCodeDataURL => {
  console.log('✅ QR Code generated successfully!');
  console.log('📱 QR Code Data URL length:', qrCodeDataURL.length);
  console.log('\n💡 Copy the QR data above and use it in the frontend scanner!');
  console.log('\n🔗 To test:');
  console.log('1. Go to http://localhost:3000');
  console.log('2. Login to Animal Management');
  console.log('3. Go to QR Scanner page');
  console.log('4. Use the QR data above to test scanning');
}).catch(err => {
  console.error('❌ QR Code generation error:', err);
});

