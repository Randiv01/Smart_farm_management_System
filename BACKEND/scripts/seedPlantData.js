import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
import Greenhouse from '../PlantManagement/models/greenhouseModel.js';
import Inspection from '../PlantManagement/models/inspectionModel.js';
import Productivity from '../PlantManagement/models/productivityModel.js';
import Fertilizing from '../PlantManagement/models/fertilizingModel.js';
import Pest from '../PlantManagement/models/Pest.js';
import Consultation from '../PlantManagement/models/P-Consultation.js';

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority";

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Greenhouse.deleteMany({});
    await Inspection.deleteMany({});
    await Productivity.deleteMany({});
    await Fertilizing.deleteMany({});
    await Pest.deleteMany({});
    await Consultation.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Seed Greenhouses
    const greenhouses = [
      {
        greenhouseName: 'GH-01',
        location: 'North Wing',
        temperature: 25.5,
        humidity: 65
      },
      {
        greenhouseName: 'GH-02',
        location: 'South Wing',
        temperature: 24.8,
        humidity: 70
      },
      {
        greenhouseName: 'GH-03',
        location: 'East Wing',
        temperature: 26.2,
        humidity: 68
      },
      {
        greenhouseName: 'GH-04',
        location: 'West Wing',
        temperature: 25.0,
        humidity: 72
      },
      {
        greenhouseName: 'GH-05',
        location: 'Central Wing',
        temperature: 24.5,
        humidity: 75
      }
    ];

    const createdGreenhouses = await Greenhouse.insertMany(greenhouses);
    console.log('🌱 Seeded greenhouses:', createdGreenhouses.length);

    // Seed Inspections
    const inspections = [
      {
        tunnel: 'GH-01',
        date: new Date('2024-01-15'),
        inspector: 'John Smith',
        status: 'cleared',
        notes: 'All systems functioning normally. No issues detected.'
      },
      {
        tunnel: 'GH-02',
        date: new Date('2024-01-16'),
        inspector: 'Jane Doe',
        status: 'issue',
        notes: 'Temperature sensor malfunction detected. Requires immediate attention.'
      },
      {
        tunnel: 'GH-03',
        date: new Date('2024-01-17'),
        inspector: 'Mike Johnson',
        status: 'cleared',
        notes: 'Regular maintenance completed. All equipment operational.'
      },
      {
        tunnel: 'GH-01',
        date: new Date('2024-01-18'),
        inspector: 'Sarah Wilson',
        status: 'issue',
        notes: 'Watering system leak detected in section A.'
      },
      {
        tunnel: 'GH-04',
        date: new Date('2024-01-19'),
        inspector: 'David Brown',
        status: 'cleared',
        notes: 'Inspection completed successfully. No issues found.'
      },
      {
        tunnel: 'GH-05',
        date: new Date('2024-01-20'),
        inspector: 'Lisa Davis',
        status: 'issue',
        notes: 'Humidity control system needs calibration.'
      }
    ];

    const createdInspections = await Inspection.insertMany(inspections);
    console.log('🔍 Seeded inspections:', createdInspections.length);

    // Seed Productivity
    const productivity = [
      {
        plantType: 'Tomatoes',
        greenhouseNo: 'GH-01',
        harvestDate: new Date('2024-01-10'),
        quantity: 150,
        qualityGrade: 'A',
        worker: 'Alice Green'
      },
      {
        plantType: 'Lettuce',
        greenhouseNo: 'GH-02',
        harvestDate: new Date('2024-01-12'),
        quantity: 200,
        qualityGrade: 'B',
        worker: 'Bob White'
      },
      {
        plantType: 'Cucumbers',
        greenhouseNo: 'GH-03',
        harvestDate: new Date('2024-01-14'),
        quantity: 120,
        qualityGrade: 'A',
        worker: 'Carol Blue'
      },
      {
        plantType: 'Tomatoes',
        greenhouseNo: 'GH-01',
        harvestDate: new Date('2024-01-20'),
        quantity: 180,
        qualityGrade: 'A',
        worker: 'Alice Green'
      },
      {
        plantType: 'Peppers',
        greenhouseNo: 'GH-04',
        harvestDate: new Date('2024-01-18'),
        quantity: 90,
        qualityGrade: 'B',
        worker: 'Dan Red'
      },
      {
        plantType: 'Lettuce',
        greenhouseNo: 'GH-05',
        harvestDate: new Date('2024-01-22'),
        quantity: 160,
        qualityGrade: 'A',
        worker: 'Eve Purple'
      }
    ];

    const createdProductivity = await Productivity.insertMany(productivity);
    console.log('📊 Seeded productivity:', createdProductivity.length);

    // Seed Fertilizing
    const fertilizing = [
      {
        greenhouseNo: 'GH-01',
        date: new Date('2024-01-05'),
        fertilizerType: 'NPK 20-20-20',
        quantity: 5,
        staff: 'Alice Green',
        status: 'Completed'
      },
      {
        greenhouseNo: 'GH-02',
        date: new Date('2024-01-08'),
        fertilizerType: 'Organic Compost',
        quantity: 10,
        staff: 'Bob White',
        status: 'Completed'
      },
      {
        greenhouseNo: 'GH-03',
        date: new Date('2024-01-12'),
        fertilizerType: 'Liquid Fertilizer',
        quantity: 3,
        staff: 'Carol Blue',
        status: 'Completed'
      },
      {
        greenhouseNo: 'GH-01',
        date: new Date('2024-01-15'),
        fertilizerType: 'NPK 15-15-15',
        quantity: 4,
        staff: 'Alice Green',
        status: 'Completed'
      },
      {
        greenhouseNo: 'GH-04',
        date: new Date('2024-01-18'),
        fertilizerType: 'Calcium Nitrate',
        quantity: 2,
        staff: 'Dan Red',
        status: 'Completed'
      },
      {
        greenhouseNo: 'GH-05',
        date: new Date('2024-01-20'),
        fertilizerType: 'Organic Compost',
        quantity: 8,
        staff: 'Eve Purple',
        status: 'Completed'
      }
    ];

    const createdFertilizing = await Fertilizing.insertMany(fertilizing);
    console.log('🌿 Seeded fertilizing:', createdFertilizing.length);

    // Seed Pests
    const pests = [
      {
        greenhouseNo: 'GH-01',
        date: new Date('2024-01-10'),
        issueType: 'Fungus',
        description: 'White powdery mildew detected on tomato leaves. Affecting approximately 20% of plants in section A.',
        status: 'Active',
        severity: 'Medium',
        createdBy: 'Alice Green'
      },
      {
        greenhouseNo: 'GH-02',
        date: new Date('2024-01-12'),
        issueType: 'Insect',
        description: 'Aphid infestation on lettuce plants. Heavy concentration on new growth.',
        status: 'Under Treatment',
        severity: 'High',
        createdBy: 'Bob White'
      },
      {
        greenhouseNo: 'GH-03',
        date: new Date('2024-01-15'),
        issueType: 'Virus',
        description: 'Mosaic virus symptoms observed on cucumber plants. Yellowing and stunted growth.',
        status: 'Active',
        severity: 'Critical',
        createdBy: 'Carol Blue'
      },
      {
        greenhouseNo: 'GH-04',
        date: new Date('2024-01-18'),
        issueType: 'Fungus',
        description: 'Root rot detected in pepper plants. Caused by overwatering.',
        status: 'Resolved',
        severity: 'Medium',
        createdBy: 'Dan Red'
      },
      {
        greenhouseNo: 'GH-05',
        date: new Date('2024-01-20'),
        issueType: 'Insect',
        description: 'Spider mite infestation on lettuce. Fine webbing visible on leaves.',
        status: 'Active',
        severity: 'Low',
        createdBy: 'Eve Purple'
      }
    ];

    const createdPests = await Pest.insertMany(pests);
    console.log('🐛 Seeded pests:', createdPests.length);

    // Seed Consultations
    const consultations = [
      {
        pestId: createdPests[0]._id,
        specialistName: 'Dr. Plant Pathologist',
        dateAssigned: new Date('2024-01-11'),
        greenhouseNo: 'GH-01',
        treatedIssue: 'White powdery mildew treatment with systemic fungicide. Applied copper-based spray to affected areas.',
        specialistNotes: 'Recommended fungicide treatment. Monitoring progress.',
        status: 'In Progress',
        treatmentStartDate: new Date('2024-01-11'),
        followUpRequired: true,
        followUpDate: new Date('2024-01-25'),
        cost: 150.00,
        createdBy: 'System'
      },
      {
        pestId: createdPests[1]._id,
        specialistName: 'Dr. Entomologist',
        dateAssigned: new Date('2024-01-13'),
        greenhouseNo: 'GH-02',
        treatedIssue: 'Aphid infestation control using neonicotinoid insecticide and beneficial insects introduction.',
        specialistNotes: 'Treatment applied successfully. Aphid population reduced by 80%.',
        status: 'Resolved',
        treatmentStartDate: new Date('2024-01-13'),
        treatmentEndDate: new Date('2024-01-20'),
        followUpRequired: false,
        cost: 200.00,
        createdBy: 'System'
      },
      {
        pestId: createdPests[2]._id,
        specialistName: 'Dr. Virologist',
        dateAssigned: new Date('2024-01-16'),
        greenhouseNo: 'GH-03',
        treatedIssue: 'Mosaic virus containment and plant removal. Implemented strict quarantine protocols.',
        specialistNotes: 'Virus confirmed. Implementing quarantine measures.',
        status: 'In Progress',
        treatmentStartDate: new Date('2024-01-16'),
        followUpRequired: true,
        followUpDate: new Date('2024-02-01'),
        cost: 300.00,
        createdBy: 'System'
      }
    ];

    const createdConsultations = await Consultation.insertMany(consultations);
    console.log('👨‍⚕️ Seeded consultations:', createdConsultations.length);

    console.log('✅ All data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Greenhouses: ${createdGreenhouses.length}`);
    console.log(`- Inspections: ${createdInspections.length}`);
    console.log(`- Productivity: ${createdProductivity.length}`);
    console.log(`- Fertilizing: ${createdFertilizing.length}`);
    console.log(`- Pests: ${createdPests.length}`);
    console.log(`- Consultations: ${createdConsultations.length}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding function
seedData();
