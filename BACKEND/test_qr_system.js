// test_qr_system.js
import mongoose from 'mongoose';
import { generateQRCodeForAnimal, generateQRCodeForAnimalType } from './AnimalManagement/services/qrCodeService.js';
import Animal from './AnimalManagement/models/Animal.js';
import AnimalType from './AnimalManagement/models/AnimalType.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://randiv:randiv123@cluster0.owlbj1f.mongodb.net/smartfarm?retryWrites=true&w=majority');
    console.log('✅ MongoDB Connected for QR Testing');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testQRSystem = async () => {
  try {
    console.log('\n🔍 Testing QR Code System...\n');

    // 1. Find an existing animal
    const animal = await Animal.findOne().populate('type');
    if (!animal) {
      console.log('❌ No animals found in database. Please create some animals first.');
      return;
    }

    console.log(`📱 Found animal: ${animal.name} (${animal.animalId})`);
    console.log(`   Type: ${animal.type?.name || 'Unknown'}`);
    console.log(`   Is Batch: ${animal.isBatch ? 'Yes' : 'No'}`);

    // 2. Generate QR code for the animal
    console.log('\n🔧 Generating QR code...');
    const qrResult = await generateQRCodeForAnimal(animal._id);
    
    console.log('✅ QR Code generated successfully!');
    console.log(`   QR Data: ${qrResult.qrData}`);
    console.log(`   QR Code Type: ${qrResult.type}`);
    console.log(`   Animal ID: ${qrResult.animalId}`);

    // 3. Test QR code parsing
    console.log('\n🔍 Testing QR code parsing...');
    const qrData = JSON.parse(qrResult.qrData);
    console.log('✅ QR code parsed successfully!');
    console.log(`   Parsed ID: ${qrData.id}`);
    console.log(`   Parsed Type: ${qrData.type}`);
    console.log(`   Parsed System: ${qrData.system}`);
    console.log(`   Parsed Timestamp: ${qrData.timestamp}`);

    // 4. Test with animal type if available
    if (animal.type) {
      console.log('\n🔧 Testing Animal Type QR code...');
      const typeQRResult = await generateQRCodeForAnimalType(animal.type._id);
      console.log('✅ Animal Type QR Code generated successfully!');
      console.log(`   Type QR Data: ${typeQRResult.qrData}`);
    }

    // 5. Create a test QR code data for manual testing
    console.log('\n📋 Test QR Code Data for Manual Testing:');
    console.log('=' .repeat(50));
    console.log(qrResult.qrData);
    console.log('=' .repeat(50));
    console.log('\n💡 Copy this QR data and use it in the frontend QR scanner!');

    console.log('\n🎉 QR Code System Test Completed Successfully!');
    console.log('\n📱 Next Steps:');
    console.log('1. Open your browser and go to http://localhost:3000');
    console.log('2. Login to Animal Management');
    console.log('3. Go to QR Scanner page');
    console.log('4. Use the QR data above to test scanning');

  } catch (error) {
    console.error('❌ QR System Test Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the test
connectDB().then(() => {
  testQRSystem();
});

