// Script to populate dashboard with realistic sample data
import mongoose from 'mongodb';
import Greenhouse from '../models/greenhouseModel.js';
import Productivity from '../models/productivityModel.js';
import Fertilizing from '../models/fertilizingModel.js';
import Inspection from '../models/inspectionModel.js';
import Pest from '../models/Pest.js';

// Connect to MongoDB - adjust the connection string as needed
const connectDB = async () => {
  try {
    // Use the same connection as your main app
    console.log('📊 Updating dashboard data with realistic sample data...');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Update greenhouse statuses
const updateGreenhouseStatuses = async () => {
  try {
    console.log('🗃️  Updating greenhouse statuses...');
    
    // Update each greenhouse with realistic statuses
    await Greenhouse.findByIdAndUpdate({ greenhouseName: 'GH-01' }, { status: 'Active' });
    await Greenhouse.findOneAndUpdate({ greenhouseName: 'GH-02' }, { status: 'Active' });
    await Greenhouse.findOneAndUpdate({ greenhouseName: 'GH-03' }, { status: 'Maintenance' });
    await Greenhouse.findOneAndUpdate({ greenhouseName: 'GH-04' }, { status: 'Active' });
    await Greenhouse.findOneAndUpdate({ greenhouseName: 'GH-05' }, { status: 'Inactive' });
    
    console.log('✅ Greenhouse statuses updated');
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
      console.log('📈 Productivity data already exists, skipping...');
      return;
    }
    
    const productivityData = [
      // Recent months with realistic yields
      { plantType: 'Tomatoes', greenhouseNo: 'GH-01', harvestDate: new Date(2024, 10, 15), quantity: 120, qualityGrade: 'A', worker: 'John Smith' },
      { plantType: 'Lettuce', greenhouseNo: 'GH-02', harvestDate: new Date(2024, 10, 20), quantity: 85, qualityGrade: 'A', worker: 'Jane Doe' },
      { plantType: 'Tomatoes', greenhouseNo: 'GH-01', harvestDate: new Date(2024, 10, 25), quantity: 95, qualityGrade: 'B', worker: 'Bob Wilson' },
      { plantType: 'Peppers', greenhouseNo: 'GH-04', harvestDate: new Date(2024, 10, 30), quantity: 60, qualityGrade: 'A', worker: 'Alice Brown' },
      { plantType: 'Lettuce', greenhouseNo: 'GH-02', harvestDate: new Date(2024, 11, 5), quantity: 75, qualityGrade: 'B', worker: 'Charlie Davis' },
      { plantType: 'Tomatoes', greenhouseNo: 'GH-01', harvestDate: new Date(2024, 11, 10), quantity: 110, qualityGrade: 'A', worker: 'John Smith' },
      { plantType: 'Peppers', greenhouseNo: 'GH-04', harvestDate: new Date(2024, 11, 15), quantity: 55, qualityGrade: 'B', worker: 'Alice Brown' },
      // Previous months data for yearly trend
      { plantType: 'Tomatoes', greenhouseNo: 'GH-01', harvestDate: new Date(2024, 8, 15), quantity: 130, qualityGrade: 'A', worker: 'John Smith' },
      { plantType: 'Lettuce', greenhouseNo: 'GH-02', harvestDate: new Date(2024, 8, 20), quantity: 90, qualityGrade: 'A', worker: 'Jane Doe' },
      { plantType: 'Peppers', greenhouseNo: 'GH-04', harvestDate: new Date(2024, 8, 25), quantity: 70, qualityGrade: 'A', worker: 'Alice Brown' },
      { plantType: 'Tomatoes', greenhouseNo: 'GH-01', harvestDate: new Date(2024, 9, 10), quantity: 100, qualityGrade: 'B', worker: 'John Smith' },
      { plantType: 'Lettuce', greenhouseNo: 'GH-02', harvestDate: new Date(2024, 9, 15), quantity: 80, qualityGrade: 'A', worker: 'Jane Doe' }
    ];
    
    await Productivity.insertMany(productivityData);
    console.log('✅ Sample productivity data added');
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
      console.log('🌱 Fertilizing data already exists, skipping...');
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
    console.log('✅ Sample fertilizing data added');
  } catch (error) {
    console.error('❌ Error adding fertilizing data:', error);
  }
};

// Update existing inspection data with more issues
const updateInspectionData = async () => {
  try {
    console.log('🔍 Checking inspection data...');
    
    // The API already shows 3 active issues, which is realistic
    const issueCount = await Inspection.countDocuments({ status: 'issue' });
    console.log(`🔍 Found ${issueCount} active inspection issues`);
    
    if (issueCount < 5) {
      // Add a couple more issues if we have less than 5
      const additionalIssues = [
        { tunnel: 'GH-03', date: new Date(2024, 11, 12), inspector: 'Tech Team', status: 'issue', notes: 'Heating system requires maintenance check.' },
        { tunnel: 'GH-01', date: new Date(2024, 11, 14), inspector: 'Quality Control', status: 'issue', notes: 'Ventilation fan showing abnormal noise levels.' }
      ];
      
      await Inspection.insertMany(additionalIssues);
      console.log('✅ Additional inspection issues added');
    }
  } catch (error) {
    console.error('❌ Error updating inspection data:', error);
  }
};

// Add sample pest data if needed
const updatePestData = async () => {
  try {
    console.log('🐛 Checking pest data...');
    
    const pestCount = await Pest.countDocuments({ status: 'Active' });
    console.log(`🐛 Found ${pestCount} active pest issues`);
    
    // Keep existing pest data as it's already realistic
  } catch (error) {
    console.error('❌ Error checking pest data:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await updateGreenhouseStatuses();
    await addSampleProductivityData();
    await addSampleFertilizingData();
    await updateInspectionData();
    await updatePestData();
    
    console.log('🎉 Dashboard data population completed!');
    console.log('🔄 Please refresh the dashboard to see the updated data.');
  } catch (error) {
    console.error('❌ Error in main execution:', error);
  }
};

main();

