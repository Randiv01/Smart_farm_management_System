import mongoose from 'mongoose';
import Greenhouse from '../models/greenhouseModel.js';
import Inspection from '../models/inspectionModel.js';
import Pest from '../models/Pest.js';
import Consultation from '../models/P-Consultation.js';
import Productivity from '../models/productivityModel.js';
import Fertilizing from '../models/fertilizingModel.js';

// Connect to MongoDB
const MONGO_URI = "mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Greenhouse data
const greenhouseData = [
  { greenhouseName: 'Greenhouse GH01', location: 'North Wing', temperature: 24.5, humidity: 65, status: 'Active' },
  { greenhouseName: 'Greenhouse GH02', location: 'North Wing', temperature: 26.2, humidity: 70, status: 'Active' },
  { greenhouseName: 'Greenhouse GH03', location: 'South Wing', temperature: 25.8, humidity: 68, status: 'Active' },
  { greenhouseName: 'Greenhouse GH04', location: 'South Wing', temperature: 27.1, humidity: 72, status: 'Active' },
  { greenhouseName: 'Greenhouse GH05', location: 'East Wing', temperature: 23.9, humidity: 63, status: 'Active' },
  { greenhouseName: 'Greenhouse GH06', location: 'East Wing', temperature: 25.3, humidity: 67, status: 'Active' },
  { greenhouseName: 'Greenhouse GH07', location: 'West Wing', temperature: 26.7, humidity: 69, status: 'Active' },
  { greenhouseName: 'Greenhouse GH08', location: 'West Wing', temperature: 24.8, humidity: 64, status: 'Active' },
  { greenhouseName: 'Greenhouse GH09', location: 'Central Wing', temperature: 25.1, humidity: 66, status: 'Active' },
  { greenhouseName: 'Greenhouse GH10', location: 'Central Wing', temperature: 26.9, humidity: 71, status: 'Active' },
  { greenhouseName: 'Greenhouse GH11', location: 'Research Wing', temperature: 24.2, humidity: 62, status: 'Active' },
  { greenhouseName: 'Greenhouse GH12', location: 'Research Wing', temperature: 25.6, humidity: 68, status: 'Active' },
  { greenhouseName: 'Greenhouse GH13', location: 'Production Wing', temperature: 27.3, humidity: 73, status: 'Active' },
  { greenhouseName: 'Greenhouse GH14', location: 'Production Wing', temperature: 26.0, humidity: 69, status: 'Active' },
  { greenhouseName: 'Greenhouse GH15', location: 'Storage Wing', temperature: 23.5, humidity: 60, status: 'Active' },
  { greenhouseName: 'Greenhouse GH16', location: 'Storage Wing', temperature: 24.7, humidity: 65, status: 'Active' },
  { greenhouseName: 'Greenhouse GH17', location: 'Testing Wing', temperature: 25.4, humidity: 67, status: 'Maintenance' },
  { greenhouseName: 'Greenhouse GH18', location: 'Testing Wing', temperature: 26.8, humidity: 70, status: 'Active' },
  { greenhouseName: 'Greenhouse GH19', location: 'Quality Wing', temperature: 24.9, humidity: 66, status: 'Active' },
  { greenhouseName: 'Greenhouse GH20', location: 'Quality Wing', temperature: 25.7, humidity: 68, status: 'Inactive' },
  { greenhouseName: 'Greenhouse GH21', location: 'Experimental Wing', temperature: 27.0, humidity: 72, status: 'Active' },
  { greenhouseName: 'Greenhouse GH22', location: 'Experimental Wing', temperature: 24.1, humidity: 61, status: 'Active' },
  { greenhouseName: 'Greenhouse GH23', location: 'Training Wing', temperature: 26.3, humidity: 69, status: 'Active' },
  { greenhouseName: 'Greenhouse GH24', location: 'Training Wing', temperature: 25.0, humidity: 67, status: 'Active' },
  { greenhouseName: 'Greenhouse GH25', location: 'Backup Wing', temperature: 24.6, humidity: 64, status: 'Active' }
];

// Inspection data
const inspectionData = [
  { tunnel: 'GH01', date: new Date('2024-01-15'), inspector: 'John Smith', status: 'cleared', notes: 'All systems functioning normally. Temperature and humidity within optimal range.' },
  { tunnel: 'GH02', date: new Date('2024-01-16'), inspector: 'Sarah Johnson', status: 'issue', notes: 'Minor temperature fluctuation detected. Monitoring required.' },
  { tunnel: 'GH03', date: new Date('2024-01-17'), inspector: 'Mike Davis', status: 'cleared', notes: 'Excellent plant growth observed. No issues found.' },
  { tunnel: 'GH04', date: new Date('2024-01-18'), inspector: 'Emily Brown', status: 'cleared', notes: 'All irrigation systems working properly.' },
  { tunnel: 'GH05', date: new Date('2024-01-19'), inspector: 'David Wilson', status: 'issue', notes: 'Humidity sensor malfunction detected. Replacement scheduled.' },
  { tunnel: 'GH06', date: new Date('2024-01-20'), inspector: 'Lisa Anderson', status: 'cleared', notes: 'Plant health excellent. No pest activity observed.' },
  { tunnel: 'GH07', date: new Date('2024-01-21'), inspector: 'Robert Taylor', status: 'cleared', notes: 'Optimal growing conditions maintained.' },
  { tunnel: 'GH08', date: new Date('2024-01-22'), inspector: 'Jennifer Martinez', status: 'issue', notes: 'Water pressure low in section 3. Investigation needed.' },
  { tunnel: 'GH09', date: new Date('2024-01-23'), inspector: 'William Garcia', status: 'cleared', notes: 'All automated systems functioning correctly.' },
  { tunnel: 'GH10', date: new Date('2024-01-24'), inspector: 'Amanda Rodriguez', status: 'cleared', notes: 'Plant growth rate above average this week.' },
  { tunnel: 'GH11', date: new Date('2024-01-25'), inspector: 'Christopher Lee', status: 'issue', notes: 'Minor ventilation issue in corner unit.' },
  { tunnel: 'GH12', date: new Date('2024-01-26'), inspector: 'Michelle White', status: 'cleared', notes: 'Research plants showing promising results.' },
  { tunnel: 'GH13', date: new Date('2024-01-27'), inspector: 'Kevin Harris', status: 'cleared', notes: 'Production targets being met consistently.' },
  { tunnel: 'GH14', date: new Date('2024-01-28'), inspector: 'Nicole Clark', status: 'issue', notes: 'Soil pH levels slightly elevated. Adjustment recommended.' },
  { tunnel: 'GH15', date: new Date('2024-01-29'), inspector: 'Daniel Lewis', status: 'cleared', notes: 'Storage conditions optimal for seed preservation.' },
  { tunnel: 'GH16', date: new Date('2024-01-30'), inspector: 'Ashley Walker', status: 'cleared', notes: 'All equipment properly maintained.' },
  { tunnel: 'GH17', date: new Date('2024-01-31'), inspector: 'Matthew Hall', status: 'issue', notes: 'Maintenance work in progress. Expected completion next week.' },
  { tunnel: 'GH18', date: new Date('2024-02-01'), inspector: 'Stephanie Young', status: 'cleared', notes: 'Testing procedures completed successfully.' },
  { tunnel: 'GH19', date: new Date('2024-02-02'), inspector: 'Andrew Allen', status: 'cleared', notes: 'Quality standards maintained across all samples.' },
  { tunnel: 'GH20', date: new Date('2024-02-03'), inspector: 'Rachel King', status: 'issue', notes: 'Greenhouse currently offline for upgrades.' },
  { tunnel: 'GH21', date: new Date('2024-02-04'), inspector: 'James Wright', status: 'cleared', notes: 'Experimental protocols being followed precisely.' },
  { tunnel: 'GH22', date: new Date('2024-02-05'), inspector: 'Brittany Lopez', status: 'cleared', notes: 'New growth medium showing positive results.' },
  { tunnel: 'GH23', date: new Date('2024-02-06'), inspector: 'Ryan Hill', status: 'issue', notes: 'Training equipment needs calibration.' },
  { tunnel: 'GH24', date: new Date('2024-02-07'), inspector: 'Samantha Scott', status: 'cleared', notes: 'Student training program running smoothly.' },
  { tunnel: 'GH25', date: new Date('2024-02-08'), inspector: 'Tyler Green', status: 'cleared', notes: 'Backup systems ready for activation if needed.' }
];

// Pest data
const pestData = [
  { greenhouseNo: 'GH01', date: new Date('2024-01-15'), issueType: 'Fungus', description: 'Powdery mildew detected on tomato leaves. White powdery coating visible on upper leaf surfaces.', status: 'Active', severity: 'Medium' },
  { greenhouseNo: 'GH02', date: new Date('2024-01-16'), issueType: 'Insect', description: 'Aphid infestation on pepper plants. Small green insects clustered on new growth and undersides of leaves.', status: 'Under Treatment', severity: 'High' },
  { greenhouseNo: 'GH03', date: new Date('2024-01-17'), issueType: 'Virus', description: 'Mosaic virus symptoms observed on cucumber plants. Yellowing and mottling of leaves.', status: 'Active', severity: 'Critical' },
  { greenhouseNo: 'GH04', date: new Date('2024-01-18'), issueType: 'Other', description: 'Environmental stress causing leaf curl in lettuce plants. Possible heat damage or nutrient deficiency.', status: 'Resolved', severity: 'Low' },
  { greenhouseNo: 'GH05', date: new Date('2024-01-19'), issueType: 'Insect', description: 'Spider mite infestation on herbs. Fine webbing visible between leaves with yellowing.', status: 'Active', severity: 'Medium' },
  { greenhouseNo: 'GH06', date: new Date('2024-01-20'), issueType: 'Fungus', description: 'Fusarium wilt affecting basil plants. Yellowing and wilting of lower leaves.', status: 'Under Treatment', severity: 'High' },
  { greenhouseNo: 'GH07', date: new Date('2024-01-21'), issueType: 'Insect', description: 'Whitefly presence on eggplants. Small white insects flying when disturbed.', status: 'Active', severity: 'Medium' },
  { greenhouseNo: 'GH08', date: new Date('2024-01-22'), issueType: 'Virus', description: 'Tobacco mosaic virus on pepper plants. Distinct mosaic pattern on leaves.', status: 'Active', severity: 'Critical' },
  { greenhouseNo: 'GH09', date: new Date('2024-01-23'), issueType: 'Other', description: 'Physiological disorder in strawberry plants. Blossom end rot affecting fruit development.', status: 'Under Treatment', severity: 'High' },
  { greenhouseNo: 'GH10', date: new Date('2024-01-24'), issueType: 'Insect', description: 'Thrips damage on rose plants. Silver streaks and black spots on petals.', status: 'Active', severity: 'Low' },
  { greenhouseNo: 'GH11', date: new Date('2024-01-25'), issueType: 'Fungus', description: 'Downy mildew on spinach leaves. Yellow spots with purple underside.', status: 'Resolved', severity: 'Medium' },
  { greenhouseNo: 'GH12', date: new Date('2024-01-26'), issueType: 'Insect', description: 'Scale insects on citrus saplings. Brown, circular bumps on stems and leaves.', status: 'Active', severity: 'Medium' },
  { greenhouseNo: 'GH13', date: new Date('2024-01-27'), issueType: 'Virus', description: 'Cucumber mosaic virus on melon plants. Distorted leaves and stunted growth.', status: 'Active', severity: 'High' },
  { greenhouseNo: 'GH14', date: new Date('2024-01-28'), issueType: 'Other', description: 'Mechanical damage from equipment in bean plants. Crushed stems and broken branches observed.', status: 'Under Treatment', severity: 'Medium' },
  { greenhouseNo: 'GH15', date: new Date('2024-01-29'), issueType: 'Insect', description: 'Mealybug infestation on succulents. White, cottony masses on plant joints.', status: 'Active', severity: 'Low' },
  { greenhouseNo: 'GH16', date: new Date('2024-01-30'), issueType: 'Fungus', description: 'Rust disease on wheat grass. Orange pustules on leaf surfaces.', status: 'Resolved', severity: 'Medium' },
  { greenhouseNo: 'GH17', date: new Date('2024-01-31'), issueType: 'Insect', description: 'Caterpillar damage on cabbage plants. Holes in leaves with frass present.', status: 'Active', severity: 'High' },
  { greenhouseNo: 'GH18', date: new Date('2024-02-01'), issueType: 'Virus', description: 'Tomato spotted wilt virus on peppers. Ring spots and wilting symptoms.', status: 'Under Treatment', severity: 'Critical' },
  { greenhouseNo: 'GH19', date: new Date('2024-02-02'), issueType: 'Fungus', description: 'Sooty mold on citrus plants. Black coating on leaves from honeydew.', status: 'Active', severity: 'Low' },
  { greenhouseNo: 'GH20', date: new Date('2024-02-03'), issueType: 'Other', description: 'Chemical burn from pesticide application on spinach plants. Brown, necrotic leaf edges.', status: 'Resolved', severity: 'Medium' },
  { greenhouseNo: 'GH21', date: new Date('2024-02-04'), issueType: 'Fungus', description: 'Phytophthora blight on peppers. Water-soaked lesions on stems and fruits.', status: 'Active', severity: 'High' },
  { greenhouseNo: 'GH22', date: new Date('2024-02-05'), issueType: 'Insect', description: 'Cutworm damage on seedlings. Plants severed at soil level.', status: 'Under Treatment', severity: 'Medium' },
  { greenhouseNo: 'GH23', date: new Date('2024-02-06'), issueType: 'Virus', description: 'Bean common mosaic virus on legumes. Yellow mosaic pattern on leaves.', status: 'Active', severity: 'Medium' },
  { greenhouseNo: 'GH24', date: new Date('2024-02-07'), issueType: 'Other', description: 'Nutritional deficiency in brassicas. Yellowing leaves indicating nitrogen deficiency.', status: 'Active', severity: 'Critical' },
  { greenhouseNo: 'GH25', date: new Date('2024-02-08'), issueType: 'Insect', description: 'Flea beetle damage on radishes. Small holes giving leaves shot-hole appearance.', status: 'Resolved', severity: 'Low' }
];

// Productivity data
const productivityData = [
  { plantType: 'Tomatoes', greenhouseNo: 'GH01', harvestDate: new Date('2024-01-15'), quantity: 45, qualityGrade: 'A', worker: 'John Smith' },
  { plantType: 'Peppers', greenhouseNo: 'GH02', harvestDate: new Date('2024-01-16'), quantity: 32, qualityGrade: 'B', worker: 'Sarah Johnson' },
  { plantType: 'Lettuce', greenhouseNo: 'GH03', harvestDate: new Date('2024-01-17'), quantity: 68, qualityGrade: 'A', worker: 'Mike Davis' },
  { plantType: 'Cucumbers', greenhouseNo: 'GH04', harvestDate: new Date('2024-01-18'), quantity: 28, qualityGrade: 'C', worker: 'Emily Brown' },
  { plantType: 'Basil', greenhouseNo: 'GH05', harvestDate: new Date('2024-01-19'), quantity: 15, qualityGrade: 'A', worker: 'David Wilson' },
  { plantType: 'Spinach', greenhouseNo: 'GH06', harvestDate: new Date('2024-01-20'), quantity: 52, qualityGrade: 'B', worker: 'Lisa Anderson' },
  { plantType: 'Eggplants', greenhouseNo: 'GH07', harvestDate: new Date('2024-01-21'), quantity: 18, qualityGrade: 'A', worker: 'Robert Taylor' },
  { plantType: 'Strawberries', greenhouseNo: 'GH08', harvestDate: new Date('2024-01-22'), quantity: 35, qualityGrade: 'B', worker: 'Jennifer Martinez' },
  { plantType: 'Herbs', greenhouseNo: 'GH09', harvestDate: new Date('2024-01-23'), quantity: 22, qualityGrade: 'A', worker: 'William Garcia' },
  { plantType: 'Roses', greenhouseNo: 'GH10', harvestDate: new Date('2024-01-24'), quantity: 12, qualityGrade: 'C', worker: 'Amanda Rodriguez' },
  { plantType: 'Melons', greenhouseNo: 'GH11', harvestDate: new Date('2024-01-25'), quantity: 8, qualityGrade: 'B', worker: 'Christopher Lee' },
  { plantType: 'Beans', greenhouseNo: 'GH12', harvestDate: new Date('2024-01-26'), quantity: 41, qualityGrade: 'A', worker: 'Michelle White' },
  { plantType: 'Wheat Grass', greenhouseNo: 'GH13', harvestDate: new Date('2024-01-27'), quantity: 75, qualityGrade: 'B', worker: 'Kevin Harris' },
  { plantType: 'Cabbage', greenhouseNo: 'GH14', harvestDate: new Date('2024-01-28'), quantity: 26, qualityGrade: 'C', worker: 'Nicole Clark' },
  { plantType: 'Radishes', greenhouseNo: 'GH15', harvestDate: new Date('2024-01-29'), quantity: 58, qualityGrade: 'A', worker: 'Daniel Lewis' },
  { plantType: 'Carrots', greenhouseNo: 'GH16', harvestDate: new Date('2024-01-30'), quantity: 33, qualityGrade: 'B', worker: 'Ashley Walker' },
  { plantType: 'Kale', greenhouseNo: 'GH17', harvestDate: new Date('2024-01-31'), quantity: 29, qualityGrade: 'A', worker: 'Matthew Hall' },
  { plantType: 'Broccoli', greenhouseNo: 'GH18', harvestDate: new Date('2024-02-01'), quantity: 19, qualityGrade: 'B', worker: 'Stephanie Young' },
  { plantType: 'Cauliflower', greenhouseNo: 'GH19', harvestDate: new Date('2024-02-02'), quantity: 14, qualityGrade: 'C', worker: 'Andrew Allen' },
  { plantType: 'Brussels Sprouts', greenhouseNo: 'GH20', harvestDate: new Date('2024-02-03'), quantity: 21, qualityGrade: 'A', worker: 'Rachel King' },
  { plantType: 'Sweet Corn', greenhouseNo: 'GH21', harvestDate: new Date('2024-02-04'), quantity: 16, qualityGrade: 'B', worker: 'James Wright' },
  { plantType: 'Zucchini', greenhouseNo: 'GH22', harvestDate: new Date('2024-02-05'), quantity: 24, qualityGrade: 'A', worker: 'Brittany Lopez' },
  { plantType: 'Squash', greenhouseNo: 'GH23', harvestDate: new Date('2024-02-06'), quantity: 17, qualityGrade: 'C', worker: 'Ryan Hill' },
  { plantType: 'Pumpkins', greenhouseNo: 'GH24', harvestDate: new Date('2024-02-07'), quantity: 9, qualityGrade: 'B', worker: 'Samantha Scott' },
  { plantType: 'Peas', greenhouseNo: 'GH25', harvestDate: new Date('2024-02-08'), quantity: 37, qualityGrade: 'A', worker: 'Tyler Green' }
];

// Fertilizing data - Only 5 fertilizer types: Urea, Organic Compost, NPK 20-20-20, Calcium Nitrate, Liquid Fertilizer
const fertilizingData = [
  { greenhouseNo: 'GH01', date: new Date('2024-01-15'), fertilizerType: 'NPK 20-20-20', quantity: 5, staff: 'John Smith', status: 'Completed' },
  { greenhouseNo: 'GH02', date: new Date('2024-01-16'), fertilizerType: 'Organic Compost', quantity: 12, staff: 'Sarah Johnson', status: 'Completed' },
  { greenhouseNo: 'GH03', date: new Date('2024-01-17'), fertilizerType: 'Calcium Nitrate', quantity: 3, staff: 'Mike Davis', status: 'Completed' },
  { greenhouseNo: 'GH04', date: new Date('2024-01-18'), fertilizerType: 'Liquid Fertilizer', quantity: 8, staff: 'Emily Brown', status: 'In Progress' },
  { greenhouseNo: 'GH05', date: new Date('2024-01-19'), fertilizerType: 'Urea', quantity: 2, staff: 'David Wilson', status: 'Completed' },
  { greenhouseNo: 'GH06', date: new Date('2024-01-20'), fertilizerType: 'NPK 20-20-20', quantity: 4, staff: 'Lisa Anderson', status: 'Completed' },
  { greenhouseNo: 'GH07', date: new Date('2024-01-21'), fertilizerType: 'Organic Compost', quantity: 6, staff: 'Robert Taylor', status: 'Completed' },
  { greenhouseNo: 'GH08', date: new Date('2024-01-22'), fertilizerType: 'Calcium Nitrate', quantity: 7, staff: 'Jennifer Martinez', status: 'Pending' },
  { greenhouseNo: 'GH09', date: new Date('2024-01-23'), fertilizerType: 'Liquid Fertilizer', quantity: 10, staff: 'William Garcia', status: 'Completed' },
  { greenhouseNo: 'GH10', date: new Date('2024-01-24'), fertilizerType: 'Urea', quantity: 5, staff: 'Amanda Rodriguez', status: 'Completed' },
  { greenhouseNo: 'GH11', date: new Date('2024-01-25'), fertilizerType: 'NPK 20-20-20', quantity: 3, staff: 'Christopher Lee', status: 'In Progress' },
  { greenhouseNo: 'GH12', date: new Date('2024-01-26'), fertilizerType: 'Organic Compost', quantity: 15, staff: 'Michelle White', status: 'Completed' },
  { greenhouseNo: 'GH13', date: new Date('2024-01-27'), fertilizerType: 'Calcium Nitrate', quantity: 4, staff: 'Kevin Harris', status: 'Completed' },
  { greenhouseNo: 'GH14', date: new Date('2024-01-28'), fertilizerType: 'Liquid Fertilizer', quantity: 9, staff: 'Nicole Clark', status: 'Completed' },
  { greenhouseNo: 'GH15', date: new Date('2024-01-29'), fertilizerType: 'Urea', quantity: 6, staff: 'Daniel Lewis', status: 'Pending' },
  { greenhouseNo: 'GH16', date: new Date('2024-01-30'), fertilizerType: 'NPK 20-20-20', quantity: 2, staff: 'Ashley Walker', status: 'Completed' },
  { greenhouseNo: 'GH17', date: new Date('2024-01-31'), fertilizerType: 'Organic Compost', quantity: 8, staff: 'Matthew Hall', status: 'In Progress' },
  { greenhouseNo: 'GH18', date: new Date('2024-02-01'), fertilizerType: 'Calcium Nitrate', quantity: 5, staff: 'Stephanie Young', status: 'Completed' },
  { greenhouseNo: 'GH19', date: new Date('2024-02-02'), fertilizerType: 'Liquid Fertilizer', quantity: 7, staff: 'Andrew Allen', status: 'Completed' },
  { greenhouseNo: 'GH20', date: new Date('2024-02-03'), fertilizerType: 'Urea', quantity: 12, staff: 'Rachel King', status: 'Completed' },
  { greenhouseNo: 'GH21', date: new Date('2024-02-04'), fertilizerType: 'NPK 20-20-20', quantity: 4, staff: 'James Wright', status: 'Pending' },
  { greenhouseNo: 'GH22', date: new Date('2024-02-05'), fertilizerType: 'Organic Compost', quantity: 3, staff: 'Brittany Lopez', status: 'Completed' },
  { greenhouseNo: 'GH23', date: new Date('2024-02-06'), fertilizerType: 'Calcium Nitrate', quantity: 6, staff: 'Ryan Hill', status: 'Completed' },
  { greenhouseNo: 'GH24', date: new Date('2024-02-07'), fertilizerType: 'Liquid Fertilizer', quantity: 4, staff: 'Samantha Scott', status: 'In Progress' },
  { greenhouseNo: 'GH25', date: new Date('2024-02-08'), fertilizerType: 'Urea', quantity: 10, staff: 'Tyler Green', status: 'Completed' }
];

async function populateData() {
  try {
    console.log('Starting data population...');

    // Clear existing data
    await Greenhouse.deleteMany({});
    await Inspection.deleteMany({});
    await Pest.deleteMany({});
    await Consultation.deleteMany({});
    await Productivity.deleteMany({});
    await Fertilizing.deleteMany({});

    console.log('Cleared existing data');

    // Insert greenhouse data
    const greenhouses = await Greenhouse.insertMany(greenhouseData);
    console.log(`Inserted ${greenhouses.length} greenhouse records`);

    // Insert inspection data
    const inspections = await Inspection.insertMany(inspectionData);
    console.log(`Inserted ${inspections.length} inspection records`);

    // Insert pest data
    const pests = await Pest.insertMany(pestData);
    console.log(`Inserted ${pests.length} pest records`);

    // Create consultation data linked to pests
    const consultationData = [];
    for (let i = 0; i < pests.length; i++) {
      const pest = pests[i];
      const specialists = [
        'Dr. Sarah Mitchell', 'Dr. Michael Chen', 'Dr. Emily Rodriguez', 
        'Dr. David Thompson', 'Dr. Lisa Wang', 'Dr. Robert Kim'
      ];
      const statuses = ['Assigned', 'In Progress', 'Resolved'];
      
      consultationData.push({
        pestId: pest._id,
        specialistName: specialists[i % specialists.length],
        dateAssigned: new Date(pest.date.getTime() + (24 * 60 * 60 * 1000)), // Next day
        greenhouseNo: pest.greenhouseNo,
        treatedIssue: pest.description,
        specialistNotes: `Treatment protocol initiated for ${pest.issueType} in ${pest.greenhouseNo}. Monitoring progress closely.`,
        status: statuses[i % statuses.length],
        treatmentStartDate: new Date(pest.date.getTime() + (48 * 60 * 60 * 1000)), // 2 days later
        treatmentEndDate: pest.status === 'Resolved' ? new Date(pest.date.getTime() + (7 * 24 * 60 * 60 * 1000)) : null,
        followUpRequired: pest.severity === 'Critical' || pest.severity === 'High',
        followUpDate: pest.severity === 'Critical' || pest.severity === 'High' ? new Date(pest.date.getTime() + (14 * 24 * 60 * 60 * 1000)) : null,
        cost: Math.floor(Math.random() * 500) + 100,
        createdBy: 'System'
      });
    }

    const consultations = await Consultation.insertMany(consultationData);
    console.log(`Inserted ${consultations.length} consultation records`);

    // Insert productivity data
    const productivity = await Productivity.insertMany(productivityData);
    console.log(`Inserted ${productivity.length} productivity records`);

    // Insert fertilizing data
    const fertilizing = await Fertilizing.insertMany(fertilizingData);
    console.log(`Inserted ${fertilizing.length} fertilizing records`);

    console.log('Data population completed successfully!');
    console.log(`Total records created:
    - Greenhouses: ${greenhouses.length}
    - Inspections: ${inspections.length}
    - Pests: ${pests.length}
    - Consultations: ${consultations.length}
    - Productivity: ${productivity.length}
    - Fertilizing: ${fertilizing.length}`);

  } catch (error) {
    console.error('Error populating data:', error);
  } finally {
    mongoose.connection.close();
  }
}

populateData();
