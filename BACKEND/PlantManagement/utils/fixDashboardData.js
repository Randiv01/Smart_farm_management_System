// Script to fix dashboard data - update greenhouses with status and add sample data
import mongoose from 'mongoose';
import Greenhouse from '../models/greenhouseModel.js';
import Productivity from '../models/productivityModel.js';
import Fertilizing from '../models/fertilizingModel.js';

// MongoDB connection string (same as main app)
const MONGO_URI = "mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📊 Connected to MongoDB:', conn.connection.host);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Update greenhouse statuses
const updateGreenhouseStatuses = async () => {
  try {
    console.log('🗃️  Updating greenhouse statuses...');
    
    // Update each greenhouse with realistic statuses using greenhouseName
    const updates = [
      { greenhouseName: 'GH-01', status: 'Active' },
      { greenhouseName: 'GH-02', status: 'Active' },
      { greenhouseName: 'GH-03', status: 'Maintenance' },
      { greenhouseName: 'GH-04', status: 'Active' },
      { greenhouseName: 'GH-05', status: 'Inactive' }
    ];
    
    for (const update of updates) {
      const result = await Greenhouse.findOneAndUpdate(
        { greenhouseName: update.greenhouseName },
        { status: update.status },
        { new: true }
      );
      if (result) {
        console.log(`✅ Updated ${update.greenhouseName} status to ${update.status}`);
      } else {
        console.log(`⚠️  Could not find ${update.greenhouseName}`);
      }
    }
  } catch (error) {
    console.error('❌ Error updating greenhouse statuses:', error);
  }
};

// Add sample productivity data
const addSampleProductivityData = async () => {
  try {
    console.log('📈 Adding sample productivity data...');
    
    // Check if productivity data already exists
    const existingProductivity = await Productivity.countDocuments();
    if (existingProductivity > 0) {
      console.log(`📈 Found ${existingProductivity} existing productivity records, skipping...`);
      return;
    }
    
    const productivityData = [
      // November 2024 data (this month)
      { plantType: 'Tomatoes', greenhouseNo: 'GH-01', harvestDate: new Date(2024, 10, 15), quantity: 120, qualityGrade: 'A', worker: 'John Smith' },
      { plantType: 'Lettuce', greenhouseNo: 'GH-02', harvestDate: new Date(2024, 10, 20), quantity: 85, qualityGrade: 'A', worker: 'Jane Doe' },
      { plantType: 'Tomatoes', greenhouseNo: 'GH-01', harvestDate: new Date(2024, 10, 25), quantity: 95, qualityGrade: 'B', worker: 'Bob Wilson' },
      { plantType: 'Peppers', greenhouseNo: 'GH-04', harvestDate: new Date(2024, 10, 30), quantity: 60, qualityGrade: 'A', worker: 'Alice Brown' },
      
      // December 2024 data (current month)
      { plantType: 'Lettuce', greenhouseNo: 'GH-02', harvestDate: new Date(2024, 11, 5), quantity: 75, qualityGrade: 'B', worker: 'Charlie Davis' },
      { plantType: 'Tomatoes', greenhouseNo: 'GH-01', harvestDate: new Date(2024, 11, 10), quantity: 110, qualityGrade: 'A', worker: 'John Smith' },
      
      // October 2024 data
      { plantType: 'Tomatoes', greenhouseNo: 'GH-01', harvestDate: new Date(2024, 9, 15), quantity: 100, qualityGrade: 'A', worker: 'John Smith' },
      { plantType: 'Lettuce', greenhouseNo: 'GH-02', harvestDate: new Date(2024, 9, 20), quantity: 80, qualityGrade: 'B', worker: 'Jane Doe' },
      
      // September 2024 data
      { plantType: 'Tomatoes', greenhouseNo: 'GH-01', harvestDate: new Date(2024, 8, 10), quantity: 130, qualityGrade: 'A', worker: 'John Smith' },
      { plantType: 'Peppers', greenhouseNo: 'GH-04', harvestDate: new Date(2024, 8, 25), quantity: 70, qualityGrade: 'A', worker: 'Alice Brown' }
    ];
    
    await Productivity.insertMany(productivityData);
    console.log(`✅ Added ${productivityData.length} productivity records`);
  } catch (error) {
    console.error('❌ Error adding productivity data:', error);
  }
};

// Add sample fertilizing data
const addSampleFertilizingData = async () => {
  try {
    console.log('🌱 Adding sample fertilizing data...');
    
    // Check if fertilizing data already exists
    const existingFertilizing = await Fertilizing.countDocuments();
    if (existingFertilizing > 0) {
      console.log(`🌱 Found ${existingFertilizing} existing fertilizing records, skipping...`);
      return;
    }
    
    const fertilizingData = [
      { greenhouseNo: 'GH-01', date: new Date(2024, 11, 1), fertilizerType: 'NPK 20-20-20', quantity: 50, staff: 'John Smith', status: 'Completed' },
      { greenhouseNo: 'GH-01', date: new Date(2024, 11, 8), fertilizerType: 'Calcium Nitrate', quantity: 30, staff: 'John Smith', status: 'Completed' },
      { greenhouseNo: 'GH-02', date: new Date(2024, 11, 2), fertilizerType: 'NPK 15-15-15', quantity: 45, staff: 'Jane Doe', status: 'Completed' },
      { greenhouseNo: 'GH-02', date: new Date(2024, 11, 9), fertilizerType: 'Iron Chelate', quantity: 25, staff: 'Jane Doe', status: 'Completed' },
      { greenhouseNo: 'GH-03', date: new Date(2024, 11, 3), fertilizerType: 'NPK 18-18-18', quantity: 40, staff: 'Bob Wilson', status: 'Completed' },
      { greenhouseNo: 'GH-04', date: new Date(2024, 11, 4), fertilizerType: 'NPK 20-20-20', quantity: 55, staff: 'Alice Brown', status: 'Completed' },
      { greenhouseNo: 'GH-04', date: new Date(2024, 11, 11), fertilizerType: 'Magnesium Sulfate', quantity: 35, staff: 'Alice Brown', status: 'Completed' },
      { greenhouseNo: 'GH-05', date: new Date(2024, 11, 5), fertilizerType: 'NPK 15-15-15', quantity: 42, staff: 'Charlie Davis', status: 'Pending' }
    ];
    
    await Fertilizing.insertMany(fertilizingData);
    console.log(`✅ Added ${fertilizingData.length} fertilizing records`);
  } catch (error) {
    console.error('❌ Error adding fertilizing data:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await updateGreenhouseStatuses();
    await addSampleProductivityData();
    await addSampleFertilizingData();
    
    console.log('🎉 Dashboard data update completed successfully!');
    console.log('🔄 Refresh the dashboard to see updated data.');
  } catch (error) {
    console.error('❌ Error in main execution:', error);
  } finally {
    mongoose.connection.close();
  }
};

main();

