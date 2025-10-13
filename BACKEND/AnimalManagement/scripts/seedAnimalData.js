// Script to seed realistic animal type and animal data
import mongoose from 'mongoose';
import AnimalType from '../models/AnimalType.js';
import Animal from '../models/Animal.js';
import AnimalProductivity from '../models/AnimalProductivity.js';

// MongoDB connection string
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority';

// Animal Type Definitions
const animalTypes = [
  {
    name: 'Buffalo',
    typeId: 'buffalo',
    managementType: 'individual',
    caretakers: [
      { id: 'CT001', name: 'John Smith', mobile: '+94771234567' },
      { id: 'CT002', name: 'Sarah Johnson', mobile: '+94772345678' }
    ],
    categories: [
      {
        name: 'Basic Information',
        fields: [
          { name: 'animalId', label: 'Animal ID', type: 'text', required: true, readOnly: true },
          { name: 'name', label: 'Buffalo Name', type: 'text', required: true },
          { name: 'tagId', label: 'Tag ID', type: 'text', required: true },
          { name: 'breed', label: 'Breed', type: 'select', options: ['Murrah', 'Nili-Ravi', 'Surti', 'Jaffarabadi', 'Mediterranean'], required: true },
          { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], required: true },
          { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
          { name: 'age', label: 'Age (Years)', type: 'number', required: false, readOnly: true },
          { name: 'weight', label: 'Weight (kg)', type: 'number', required: true },
          { name: 'color', label: 'Color', type: 'text', required: false },
          { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: false },
          { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false },
          { name: 'source', label: 'Source/Supplier', type: 'text', required: false },
        ]
      },
      {
        name: 'Health Information',
        fields: [
          { name: 'healthStatus', label: 'Health Status', type: 'select', options: ['Healthy', 'Sick', 'Under Treatment', 'Quarantine'], required: true },
          { name: 'lastCheckup', label: 'Last Health Checkup', type: 'date', required: false },
          { name: 'lastVaccination', label: 'Last Vaccination Date', type: 'date', required: false },
          { name: 'vaccinationType', label: 'Vaccination Type', type: 'text', required: false },
          { name: 'nextVaccination', label: 'Next Vaccination Date', type: 'date', required: false },
          { name: 'veterinarian', label: 'Veterinarian Name', type: 'text', required: false },
          { name: 'medicalNotes', label: 'Medical Notes', type: 'text', required: false },
        ]
      },
      {
        name: 'Breeding Information',
        fields: [
          { name: 'breedingStatus', label: 'Breeding Status', type: 'select', options: ['Not Breeding', 'Pregnant', 'Lactating', 'Breeding'], required: false },
          { name: 'lastBreedingDate', label: 'Last Breeding Date', type: 'date', required: false },
          { name: 'expectedDeliveryDate', label: 'Expected Delivery Date', type: 'date', required: false },
          { name: 'numberOfCalves', label: 'Number of Calves Born', type: 'number', required: false, readOnly: true },
        ]
      }
    ],
    productivityFields: [
      { name: 'milkYield', label: 'Milk Yield', type: 'number', unit: 'liters', required: true },
      { name: 'fatContent', label: 'Fat Content', type: 'number', unit: '%', required: false },
      { name: 'proteinContent', label: 'Protein Content', type: 'number', unit: '%', required: false },
    ]
  },
  {
    name: 'Goat',
    typeId: 'goat',
    managementType: 'individual',
    caretakers: [
      { id: 'CT003', name: 'Michael Brown', mobile: '+94773456789' },
      { id: 'CT004', name: 'Emma Wilson', mobile: '+94774567890' }
    ],
    categories: [
      {
        name: 'Basic Information',
        fields: [
          { name: 'animalId', label: 'Animal ID', type: 'text', required: true, readOnly: true },
          { name: 'name', label: 'Goat Name', type: 'text', required: true },
          { name: 'tagId', label: 'Tag ID', type: 'text', required: true },
          { name: 'breed', label: 'Breed', type: 'select', options: ['Boer', 'Saanen', 'Alpine', 'Nubian', 'LaMancha', 'Toggenburg'], required: true },
          { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], required: true },
          { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
          { name: 'age', label: 'Age (Years)', type: 'number', required: false, readOnly: true },
          { name: 'weight', label: 'Weight (kg)', type: 'number', required: true },
          { name: 'color', label: 'Color', type: 'text', required: false },
          { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: false },
          { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: false },
        ]
      },
      {
        name: 'Health Information',
        fields: [
          { name: 'healthStatus', label: 'Health Status', type: 'select', options: ['Healthy', 'Sick', 'Under Treatment', 'Quarantine'], required: true },
          { name: 'lastCheckup', label: 'Last Health Checkup', type: 'date', required: false },
          { name: 'lastVaccination', label: 'Last Vaccination Date', type: 'date', required: false },
          { name: 'nextVaccination', label: 'Next Vaccination Date', type: 'date', required: false },
          { name: 'dewormingDate', label: 'Last Deworming Date', type: 'date', required: false },
        ]
      },
      {
        name: 'Breeding Information',
        fields: [
          { name: 'breedingStatus', label: 'Breeding Status', type: 'select', options: ['Not Breeding', 'Pregnant', 'Lactating'], required: false },
          { name: 'lastBreedingDate', label: 'Last Breeding Date', type: 'date', required: false },
          { name: 'numberOfKids', label: 'Number of Kids Born', type: 'number', required: false, readOnly: true },
        ]
      }
    ],
    productivityFields: [
      { name: 'milkYield', label: 'Milk Yield', type: 'number', unit: 'liters', required: true },
      { name: 'weight', label: 'Current Weight', type: 'number', unit: 'kg', required: false },
    ]
  },
  {
    name: 'Sheep',
    typeId: 'sheep',
    managementType: 'individual',
    caretakers: [
      { id: 'CT005', name: 'David Martinez', mobile: '+94775678901' },
      { id: 'CT006', name: 'Lisa Anderson', mobile: '+94776789012' }
    ],
    categories: [
      {
        name: 'Basic Information',
        fields: [
          { name: 'animalId', label: 'Animal ID', type: 'text', required: true, readOnly: true },
          { name: 'name', label: 'Sheep Name', type: 'text', required: true },
          { name: 'tagId', label: 'Tag ID', type: 'text', required: true },
          { name: 'breed', label: 'Breed', type: 'select', options: ['Merino', 'Suffolk', 'Dorper', 'Hampshire', 'Texel', 'Romney'], required: true },
          { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], required: true },
          { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
          { name: 'age', label: 'Age (Years)', type: 'number', required: false, readOnly: true },
          { name: 'weight', label: 'Weight (kg)', type: 'number', required: true },
          { name: 'color', label: 'Color', type: 'text', required: false },
          { name: 'woolQuality', label: 'Wool Quality', type: 'select', options: ['Excellent', 'Good', 'Average', 'Poor'], required: false },
          { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: false },
        ]
      },
      {
        name: 'Health Information',
        fields: [
          { name: 'healthStatus', label: 'Health Status', type: 'select', options: ['Healthy', 'Sick', 'Under Treatment', 'Quarantine'], required: true },
          { name: 'lastCheckup', label: 'Last Health Checkup', type: 'date', required: false },
          { name: 'lastVaccination', label: 'Last Vaccination Date', type: 'date', required: false },
          { name: 'nextVaccination', label: 'Next Vaccination Date', type: 'date', required: false },
          { name: 'lastShearing', label: 'Last Shearing Date', type: 'date', required: false },
        ]
      },
      {
        name: 'Breeding Information',
        fields: [
          { name: 'breedingStatus', label: 'Breeding Status', type: 'select', options: ['Not Breeding', 'Pregnant', 'Breeding'], required: false },
          { name: 'numberOfLambs', label: 'Number of Lambs Born', type: 'number', required: false, readOnly: true },
        ]
      }
    ],
    productivityFields: [
      { name: 'woolYield', label: 'Wool Yield', type: 'number', unit: 'kg', required: true },
      { name: 'woolQuality', label: 'Wool Quality Grade', type: 'text', unit: '', required: false },
      { name: 'weight', label: 'Current Weight', type: 'number', unit: 'kg', required: false },
    ]
  },
  {
    name: 'Duck',
    typeId: 'duck',
    managementType: 'batch',
    caretakers: [
      { id: 'CT007', name: 'Robert Taylor', mobile: '+94777890123' },
      { id: 'CT008', name: 'Jennifer Lee', mobile: '+94778901234' }
    ],
    categories: [
      {
        name: 'Basic Information',
        fields: [
          { name: 'batchId', label: 'Batch ID', type: 'text', required: true, readOnly: true },
          { name: 'name', label: 'Batch Name', type: 'text', required: true },
          { name: 'tagId', label: 'Tag ID', type: 'text', required: true },
          { name: 'breed', label: 'Breed', type: 'select', options: ['Pekin', 'Muscovy', 'Khaki Campbell', 'Indian Runner', 'Rouen'], required: true },
          { name: 'count', label: 'Number of Ducks', type: 'number', required: true },
          { name: 'dateOfBirth', label: 'Batch Start Date', type: 'date', required: true },
          { name: 'age', label: 'Age (Weeks)', type: 'number', required: false, readOnly: true },
          { name: 'averageWeight', label: 'Average Weight (kg)', type: 'number', required: false },
          { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: false },
          { name: 'source', label: 'Source/Supplier', type: 'text', required: false },
        ]
      },
      {
        name: 'Health Information',
        fields: [
          { name: 'healthStatus', label: 'Overall Health Status', type: 'select', options: ['Healthy', 'Sick', 'Under Treatment', 'Quarantine'], required: true },
          { name: 'mortalityCount', label: 'Mortality Count', type: 'number', required: false, readOnly: true },
          { name: 'lastVaccination', label: 'Last Vaccination Date', type: 'date', required: false },
          { name: 'nextVaccination', label: 'Next Vaccination Date', type: 'date', required: false },
          { name: 'feedType', label: 'Feed Type', type: 'text', required: false },
        ]
      },
      {
        name: 'Production Information',
        fields: [
          { name: 'layingPercentage', label: 'Laying Percentage', type: 'number', required: false, readOnly: true },
          { name: 'totalEggsProduced', label: 'Total Eggs Produced', type: 'number', required: false, readOnly: true },
        ]
      }
    ],
    productivityFields: [
      { name: 'eggProduction', label: 'Egg Production', type: 'number', unit: 'eggs', required: true },
      { name: 'feedConsumption', label: 'Feed Consumption', type: 'number', unit: 'kg', required: false },
      { name: 'mortality', label: 'Mortality Count', type: 'number', unit: 'pcs', required: false },
    ]
  }
];

// Helper function to generate random date within range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate realistic animal data
function generateAnimalData(type, index) {
  const baseData = {
    name: `${type.name} ${String(index + 1).padStart(3, '0')}`,
    tagId: `${type.typeId.toUpperCase()}-${String(index + 1).padStart(4, '0')}`,
    animalId: `${type.typeId.toUpperCase()}-${String(index + 1).padStart(4, '0')}`, // Readonly field
  };

  switch (type.typeId) {
    case 'buffalo':
      const buffaloBreeds = ['Murrah', 'Nili-Ravi', 'Surti', 'Jaffarabadi', 'Mediterranean'];
      const buffaloAge = Math.floor(Math.random() * 8) + 2; // 2-10 years
      const buffaloGender = Math.random() > 0.3 ? 'Female' : 'Male';
      const breedingStatus = buffaloGender === 'Female' ? ['Not Breeding', 'Pregnant', 'Lactating', 'Breeding'][Math.floor(Math.random() * 4)] : 'Not Breeding';
      
      return {
        ...baseData,
        breed: buffaloBreeds[Math.floor(Math.random() * buffaloBreeds.length)],
        gender: buffaloGender,
        dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - buffaloAge)),
        age: buffaloAge, // Readonly field
        weight: Math.floor(Math.random() * 300) + 400, // 400-700 kg
        color: ['Black', 'Dark Grey', 'Brown'][Math.floor(Math.random() * 3)],
        purchaseDate: randomDate(new Date(2020, 0, 1), new Date(2024, 0, 1)),
        purchasePrice: Math.floor(Math.random() * 50000) + 100000, // 100k-150k
        source: ['Local Farm', 'Auction', 'Breeder', 'Import'][Math.floor(Math.random() * 4)],
        healthStatus: Math.random() > 0.1 ? 'Healthy' : 'Under Treatment',
        lastCheckup: randomDate(new Date(2024, 6, 1), new Date()),
        lastVaccination: randomDate(new Date(2024, 0, 1), new Date()),
        vaccinationType: ['FMD', 'Anthrax', 'HS', 'BQ'][Math.floor(Math.random() * 4)],
        nextVaccination: randomDate(new Date(), new Date(2026, 0, 1)),
        veterinarian: ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams'][Math.floor(Math.random() * 3)],
        medicalNotes: Math.random() > 0.8 ? 'Minor health issue resolved' : '',
        breedingStatus: breedingStatus,
        lastBreedingDate: buffaloGender === 'Female' ? randomDate(new Date(2024, 0, 1), new Date()) : null,
        expectedDeliveryDate: breedingStatus === 'Pregnant' ? randomDate(new Date(), new Date(2025, 6, 1)) : null,
        numberOfCalves: buffaloGender === 'Female' ? Math.floor(Math.random() * 5) : 0, // Readonly field
      };

    case 'goat':
      const goatBreeds = ['Boer', 'Saanen', 'Alpine', 'Nubian', 'LaMancha', 'Toggenburg'];
      const goatAge = Math.floor(Math.random() * 6) + 1; // 1-7 years
      const goatGender = Math.random() > 0.4 ? 'Female' : 'Male';
      const goatBreedingStatus = goatGender === 'Female' ? ['Not Breeding', 'Pregnant', 'Lactating'][Math.floor(Math.random() * 3)] : 'Not Breeding';
      
      return {
        ...baseData,
        breed: goatBreeds[Math.floor(Math.random() * goatBreeds.length)],
        gender: goatGender,
        dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - goatAge)),
        age: goatAge, // Readonly
        weight: Math.floor(Math.random() * 50) + 30, // 30-80 kg
        color: ['White', 'Brown', 'Black', 'Spotted'][Math.floor(Math.random() * 4)],
        purchaseDate: randomDate(new Date(2020, 0, 1), new Date(2024, 0, 1)),
        purchasePrice: Math.floor(Math.random() * 10000) + 15000,
        healthStatus: Math.random() > 0.15 ? 'Healthy' : 'Under Treatment',
        lastCheckup: randomDate(new Date(2024, 6, 1), new Date()),
        lastVaccination: randomDate(new Date(2024, 0, 1), new Date()),
        nextVaccination: randomDate(new Date(), new Date(2026, 0, 1)),
        dewormingDate: randomDate(new Date(2024, 6, 1), new Date()),
        breedingStatus: goatBreedingStatus,
        lastBreedingDate: goatGender === 'Female' ? randomDate(new Date(2024, 0, 1), new Date()) : null,
        numberOfKids: goatGender === 'Female' ? Math.floor(Math.random() * 8) : 0, // Readonly
      };

    case 'sheep':
      const sheepBreeds = ['Merino', 'Suffolk', 'Dorper', 'Hampshire', 'Texel', 'Romney'];
      const sheepAge = Math.floor(Math.random() * 6) + 1; // 1-7 years
      const sheepGender = Math.random() > 0.4 ? 'Female' : 'Male';
      const sheepBreedingStatus = sheepGender === 'Female' ? ['Not Breeding', 'Pregnant', 'Breeding'][Math.floor(Math.random() * 3)] : 'Not Breeding';
      
      return {
        ...baseData,
        breed: sheepBreeds[Math.floor(Math.random() * sheepBreeds.length)],
        gender: sheepGender,
        dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - sheepAge)),
        age: sheepAge, // Readonly
        weight: Math.floor(Math.random() * 60) + 40, // 40-100 kg
        color: ['White', 'Black', 'Brown', 'Grey'][Math.floor(Math.random() * 4)],
        woolQuality: ['Excellent', 'Good', 'Average', 'Poor'][Math.floor(Math.random() * 4)],
        purchaseDate: randomDate(new Date(2020, 0, 1), new Date(2024, 0, 1)),
        healthStatus: Math.random() > 0.15 ? 'Healthy' : 'Under Treatment',
        lastCheckup: randomDate(new Date(2024, 6, 1), new Date()),
        lastVaccination: randomDate(new Date(2024, 0, 1), new Date()),
        nextVaccination: randomDate(new Date(), new Date(2026, 0, 1)),
        lastShearing: randomDate(new Date(2024, 0, 1), new Date()),
        breedingStatus: sheepBreedingStatus,
        numberOfLambs: sheepGender === 'Female' ? Math.floor(Math.random() * 6) : 0, // Readonly
      };

    case 'duck':
      const duckBreeds = ['Pekin', 'Muscovy', 'Khaki Campbell', 'Indian Runner', 'Rouen'];
      const duckWeeks = Math.floor(Math.random() * 100) + 20; // 20-120 weeks
      const duckCount = Math.floor(Math.random() * 30) + 20; // 20-50 ducks
      const totalEggs = Math.floor(Math.random() * 5000) + 1000;
      
      return {
        ...baseData,
        batchId: `BATCH-DUCK-${String(index + 1).padStart(3, '0')}`, // Readonly
        breed: duckBreeds[Math.floor(Math.random() * duckBreeds.length)],
        count: duckCount,
        dateOfBirth: new Date(new Date().getTime() - (duckWeeks * 7 * 24 * 60 * 60 * 1000)),
        age: Math.floor(duckWeeks / 4), // Readonly - in weeks
        averageWeight: (Math.random() * 1.5 + 2.5).toFixed(2), // 2.5-4 kg
        purchaseDate: randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1)),
        source: ['Local Hatchery', 'Import', 'Breeder'][Math.floor(Math.random() * 3)],
        healthStatus: Math.random() > 0.1 ? 'Healthy' : 'Under Treatment',
        mortalityCount: Math.floor(Math.random() * 5), // Readonly
        lastVaccination: randomDate(new Date(2024, 0, 1), new Date()),
        nextVaccination: randomDate(new Date(), new Date(2026, 0, 1)),
        feedType: ['Layer Feed', 'Grower Feed', 'Starter Feed'][Math.floor(Math.random() * 3)],
        layingPercentage: Math.floor(Math.random() * 30) + 70, // Readonly - 70-100%
        totalEggsProduced: totalEggs, // Readonly
      };

    default:
      return baseData;
  }
}

// Helper function to generate productivity data
function generateProductivityData(animal, animalType, days = 30) {
  const productivityRecords = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    let productivityData = {
      animalId: animal._id,
      date: date,
      recordedBy: 'Farm Manager',
      notes: '',
    };

    switch (animalType.typeId) {
      case 'buffalo':
        if (animal.data.gender === 'Female') {
          productivityData.milkYield = Math.floor(Math.random() * 5) + 8; // 8-13 liters
          productivityData.fatContent = (Math.random() * 2 + 6).toFixed(1); // 6-8%
          productivityData.productType = 'Milk';
          productivityData.quantity = productivityData.milkYield;
        }
        break;

      case 'goat':
        if (animal.data.gender === 'Female') {
          productivityData.milkYield = Math.floor(Math.random() * 2) + 2; // 2-4 liters
          productivityData.productType = 'Milk';
          productivityData.quantity = productivityData.milkYield;
        }
        break;

      case 'sheep':
        // Wool is typically sheared 1-2 times per year
        if (i % 180 === 0) { // Every 6 months
          productivityData.woolYield = Math.floor(Math.random() * 3) + 3; // 3-6 kg
          productivityData.productType = 'Wool';
          productivityData.quantity = productivityData.woolYield;
        }
        break;

      case 'duck':
        if (animal.data.gender === 'Female') {
          productivityData.eggProduction = Math.random() > 0.2 ? 1 : 0; // 80% chance of laying
          productivityData.productType = 'Eggs';
          productivityData.quantity = productivityData.eggProduction;
        }
        break;
    }

    // Only add if there's actual productivity data
    if (productivityData.quantity > 0) {
      productivityRecords.push(productivityData);
    }
  }

  return productivityRecords;
}

async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Clear existing data - CLEAR ALL COLLECTIONS
    console.log('\n=== Clearing ALL Existing Data ===');
    
    console.log('Clearing ALL animal productivity data...');
    const deletedProductivity = await AnimalProductivity.deleteMany({});
    console.log(`Deleted ${deletedProductivity.deletedCount} productivity records`);

    console.log('Clearing ALL animal data...');
    const deletedAnimals = await Animal.deleteMany({});
    console.log(`Deleted ${deletedAnimals.deletedCount} animals`);

    console.log('Clearing ALL animal type data...');
    const deletedTypes = await AnimalType.deleteMany({});
    console.log(`Deleted ${deletedTypes.deletedCount} animal types`);

    // Insert Animal Types
    console.log('\n=== Creating Animal Types ===');
    const createdTypes = [];
    for (const typeData of animalTypes) {
      const animalType = new AnimalType(typeData);
      await animalType.save();
      createdTypes.push(animalType);
      console.log(`✓ Created animal type: ${animalType.name}`);
    }

    // Insert Animals and Productivity Data
    console.log('\n=== Creating Animals and Productivity Data ===');
    let totalAnimals = 0;
    let totalProductivity = 0;

    for (const animalType of createdTypes) {
      if (animalType.managementType === 'batch') {
        // Create batches for Duck (20 batches with varying counts)
        console.log(`\nCreating 20 ${animalType.name} batches...`);
        
        for (let i = 0; i < 20; i++) {
          const animalData = generateAnimalData(animalType, i);
          const batchCount = Math.floor(Math.random() * 30) + 20; // 20-50 ducks per batch
          const batchId = `BATCH-${animalType.typeId.toUpperCase()}-${String(i + 1).padStart(3, '0')}`;
          
          // Create batch animal
          const animal = new Animal({
            type: animalType._id,
            animalId: animalData.tagId,
            data: animalData,
            isBatch: true,
            batchId: batchId,
            count: batchCount,
          });
          
          await animal.save();
          totalAnimals++;

          // Generate productivity data for the batch (last 30 days)
          const productivityRecords = generateProductivityData(animal, animalType, 30);
          
          if (productivityRecords.length > 0) {
            for (const record of productivityRecords) {
              // Multiply productivity by batch count
              record.quantity = record.quantity * batchCount;
              record.batchId = batchId;
              record.isGroup = true;
              record.notes = `Batch of ${batchCount} ducks`;
              
              const productivity = new AnimalProductivity(record);
              await productivity.save();
              totalProductivity++;
            }
          }
        }
        
        console.log(`✓ Created 20 ${animalType.name} batches with productivity data`);
      } else {
        // Create individual animals for Buffalo, Goat, Sheep
        console.log(`\nCreating 20 individual ${animalType.name}s...`);
        
        for (let i = 0; i < 20; i++) {
          // Generate animal data
          const animalData = generateAnimalData(animalType, i);
          
          // Create animal
          const animal = new Animal({
            type: animalType._id,
            animalId: animalData.tagId,
            data: animalData,
          });
          
          await animal.save();
          totalAnimals++;

          // Generate productivity data (last 30 days)
          const productivityRecords = generateProductivityData(animal, animalType, 30);
          
          if (productivityRecords.length > 0) {
            for (const record of productivityRecords) {
              const productivity = new AnimalProductivity(record);
              await productivity.save();
              totalProductivity++;
            }
          }
        }
        
        console.log(`✓ Created 20 individual ${animalType.name}s with productivity data`);
      }
    }

    // Display Summary
    console.log('\n=== Summary ===');
    console.log(`Total Animal Types Created: ${createdTypes.length}`);
    console.log(`Total Animals Created: ${totalAnimals}`);
    console.log(`Total Productivity Records Created: ${totalProductivity}`);

    console.log('\nAnimal Distribution:');
    for (const type of createdTypes) {
      const count = await Animal.countDocuments({ type: type._id });
      console.log(`  ${type.name}: ${count} animals`);
    }

    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
  }
}

// Run the seed function
seedDatabase();
