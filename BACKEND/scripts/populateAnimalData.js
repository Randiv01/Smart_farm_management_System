import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AnimalType from '../AnimalManagement/models/AnimalType.js';
import Animal from '../AnimalManagement/models/Animal.js';
import Zone from '../AnimalManagement/models/Zone.js';
import AnimalProductivity from '../AnimalManagement/models/AnimalProductivity.js';
import FeedingHistory from '../AnimalManagement/models/feedingHistoryModel.js';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clean existing data
const cleanDatabase = async () => {
  try {
    console.log('🧹 Cleaning existing animal management data...');
    
    await Animal.deleteMany({});
    console.log('✅ Animals collection cleaned');
    
    await AnimalType.deleteMany({});
    console.log('✅ AnimalTypes collection cleaned');
    
    await AnimalProductivity.deleteMany({});
    console.log('✅ AnimalProductivity collection cleaned');
    
    await FeedingHistory.deleteMany({});
    console.log('✅ FeedingHistory collection cleaned');
    
    // Keep zones but reset occupancy
    await Zone.updateMany({}, { currentOccupancy: 0, assignedBatch: [] });
    console.log('✅ Zones occupancy reset');
    
    console.log('🎉 Database cleaning completed!');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
};

// Create zones
const createZones = async () => {
  try {
    console.log('🏗️ Creating zones...');
    
    const zones = [
      {
        zoneID: 'ZONE-001',
        name: 'Cattle Barn A',
        type: 'Barn',
        dimensions: { length: 50, width: 30, unit: 'm' },
        capacity: 25,
        currentOccupancy: 0,
        environment: { temperature: 22, humidity: 60 },
        assignedAnimalTypes: ['cattle']
      },
      {
        zoneID: 'ZONE-002',
        name: 'Cattle Barn B',
        type: 'Barn',
        dimensions: { length: 45, width: 25, unit: 'm' },
        capacity: 20,
        currentOccupancy: 0,
        environment: { temperature: 22, humidity: 60 },
        assignedAnimalTypes: ['cattle']
      },
      {
        zoneID: 'ZONE-003',
        name: 'Poultry House 1',
        type: 'Shelter',
        dimensions: { length: 40, width: 20, unit: 'm' },
        capacity: 500,
        currentOccupancy: 0,
        environment: { temperature: 25, humidity: 55 },
        assignedAnimalTypes: ['poultry']
      },
      {
        zoneID: 'ZONE-004',
        name: 'Poultry House 2',
        type: 'Shelter',
        dimensions: { length: 35, width: 18, unit: 'm' },
        capacity: 400,
        currentOccupancy: 0,
        environment: { temperature: 25, humidity: 55 },
        assignedAnimalTypes: ['poultry']
      },
      {
        zoneID: 'ZONE-005',
        name: 'Goat Pen Alpha',
        type: 'Shelter',
        dimensions: { length: 30, width: 20, unit: 'm' },
        capacity: 30,
        currentOccupancy: 0,
        environment: { temperature: 24, humidity: 50 },
        assignedAnimalTypes: ['goats']
      },
      {
        zoneID: 'ZONE-006',
        name: 'Goat Pen Beta',
        type: 'Shelter',
        dimensions: { length: 25, width: 15, unit: 'm' },
        capacity: 25,
        currentOccupancy: 0,
        environment: { temperature: 24, humidity: 50 },
        assignedAnimalTypes: ['goats']
      },
      {
        zoneID: 'ZONE-007',
        name: 'Pig Sty 1',
        type: 'Shelter',
        dimensions: { length: 20, width: 15, unit: 'm' },
        capacity: 20,
        currentOccupancy: 0,
        environment: { temperature: 26, humidity: 65 },
        assignedAnimalTypes: ['pigs']
      },
      {
        zoneID: 'ZONE-008',
        name: 'Pig Sty 2',
        type: 'Shelter',
        dimensions: { length: 18, width: 12, unit: 'm' },
        capacity: 15,
        currentOccupancy: 0,
        environment: { temperature: 26, humidity: 65 },
        assignedAnimalTypes: ['pigs']
      },
      {
        zoneID: 'ZONE-009',
        name: 'Fish Pond A',
        type: 'Pond',
        dimensions: { length: 100, width: 50, unit: 'm' },
        capacity: 1000,
        currentOccupancy: 0,
        environment: { temperature: 28, humidity: 80, waterDepth: 2.5 },
        assignedAnimalTypes: ['fish']
      },
      {
        zoneID: 'ZONE-010',
        name: 'Fish Pond B',
        type: 'Pond',
        dimensions: { length: 80, width: 40, unit: 'm' },
        capacity: 800,
        currentOccupancy: 0,
        environment: { temperature: 28, humidity: 80, waterDepth: 2.0 },
        assignedAnimalTypes: ['fish']
      }
    ];

    await Zone.insertMany(zones);
    console.log('✅ Zones created successfully');
    return zones;
  } catch (error) {
    console.error('❌ Error creating zones:', error);
    throw error;
  }
};

// Create animal types
const createAnimalTypes = async () => {
  try {
    console.log('🐄 Creating animal types...');
    
    const animalTypes = [
      {
        name: 'Cattle',
        typeId: 'CATTLE-001',
        managementType: 'individual',
        bannerImage: '/images/cattle-banner.jpg',
        categories: [
          {
            name: 'Basic Info',
            fields: [
              { name: 'name', label: 'Animal Name', type: 'text', required: true },
              { name: 'breed', label: 'Breed', type: 'select', options: ['Holstein', 'Jersey', 'Angus', 'Hereford', 'Brahman', 'Local'], required: true },
              { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], required: true },
              { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
              { name: 'weight', label: 'Weight (kg)', type: 'number', required: true },
              { name: 'color', label: 'Color', type: 'text', required: true },
              { name: 'motherId', label: 'Mother ID', type: 'text' },
              { name: 'fatherId', label: 'Father ID', type: 'text' }
            ]
          },
          {
            name: 'Health Info',
            fields: [
              { name: 'vaccinationStatus', label: 'Vaccination Status', type: 'select', options: ['Up to Date', 'Pending', 'Overdue'], required: true },
              { name: 'lastVaccination', label: 'Last Vaccination Date', type: 'date' },
              { name: 'healthStatus', label: 'Health Status', type: 'select', options: ['Healthy', 'Sick', 'Under Treatment', 'Recovering'], required: true },
              { name: 'medicalNotes', label: 'Medical Notes', type: 'text' }
            ]
          }
        ],
        productivityFields: [
          { name: 'milkProduction', label: 'Milk Production', type: 'number', unit: 'liters/day', required: true },
          { name: 'milkQuality', label: 'Milk Quality Grade', type: 'select', options: ['A', 'B', 'C'], required: true }
        ],
        caretakers: [
          { id: 'CT001', name: 'John Silva', mobile: '+94 77 123 4567' },
          { id: 'CT002', name: 'Maria Perera', mobile: '+94 77 234 5678' }
        ]
      },
      {
        name: 'Poultry',
        typeId: 'POULTRY-001',
        managementType: 'batch',
        bannerImage: '/images/poultry-banner.jpg',
        categories: [
          {
            name: 'Batch Info',
            fields: [
              { name: 'batchName', label: 'Batch Name', type: 'text', required: true },
              { name: 'breed', label: 'Breed', type: 'select', options: ['Broiler', 'Layer', 'Local', 'Rhode Island Red', 'Leghorn'], required: true },
              { name: 'hatchDate', label: 'Hatch Date', type: 'date', required: true },
              { name: 'source', label: 'Source', type: 'select', options: ['Hatchery', 'Local Farm', 'Breeder'], required: true },
              { name: 'age', label: 'Age (weeks)', type: 'number', required: true },
              { name: 'averageWeight', label: 'Average Weight (g)', type: 'number', required: true }
            ]
          },
          {
            name: 'Health Info',
            fields: [
              { name: 'vaccinationStatus', label: 'Vaccination Status', type: 'select', options: ['Complete', 'Partial', 'Pending'], required: true },
              { name: 'healthStatus', label: 'Health Status', type: 'select', options: ['Healthy', 'Sick', 'Under Treatment'], required: true },
              { name: 'mortalityRate', label: 'Mortality Rate (%)', type: 'number' }
            ]
          }
        ],
        productivityFields: [
          { name: 'eggProduction', label: 'Egg Production', type: 'number', unit: 'eggs/day', required: true },
          { name: 'feedConsumption', label: 'Feed Consumption', type: 'number', unit: 'kg/day', required: true }
        ],
        caretakers: [
          { id: 'CT003', name: 'Kamal Fernando', mobile: '+94 77 345 6789' },
          { id: 'CT004', name: 'Sunil Jayawardena', mobile: '+94 77 456 7890' }
        ]
      },
      {
        name: 'Goats',
        typeId: 'GOATS-001',
        managementType: 'individual',
        bannerImage: '/images/goats-banner.jpg',
        categories: [
          {
            name: 'Basic Info',
            fields: [
              { name: 'name', label: 'Animal Name', type: 'text', required: true },
              { name: 'breed', label: 'Breed', type: 'select', options: ['Boer', 'Nubian', 'Saanen', 'Local', 'Jamnapari'], required: true },
              { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], required: true },
              { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
              { name: 'weight', label: 'Weight (kg)', type: 'number', required: true },
              { name: 'color', label: 'Color', type: 'text', required: true },
              { name: 'hornStatus', label: 'Horn Status', type: 'select', options: ['Horned', 'Polled', 'Dehorned'], required: true }
            ]
          },
          {
            name: 'Health Info',
            fields: [
              { name: 'vaccinationStatus', label: 'Vaccination Status', type: 'select', options: ['Up to Date', 'Pending', 'Overdue'], required: true },
              { name: 'dewormingStatus', label: 'Deworming Status', type: 'select', options: ['Current', 'Due', 'Overdue'], required: true },
              { name: 'healthStatus', label: 'Health Status', type: 'select', options: ['Healthy', 'Sick', 'Under Treatment', 'Recovering'], required: true }
            ]
          }
        ],
        productivityFields: [
          { name: 'milkProduction', label: 'Milk Production', type: 'number', unit: 'liters/day', required: true },
          { name: 'breedingStatus', label: 'Breeding Status', type: 'select', options: ['Breeding', 'Pregnant', 'Lactating', 'Dry'], required: true }
        ],
        caretakers: [
          { id: 'CT005', name: 'Priya Kumari', mobile: '+94 77 567 8901' },
          { id: 'CT006', name: 'Ravi Bandara', mobile: '+94 77 678 9012' }
        ]
      },
      {
        name: 'Pigs',
        typeId: 'PIGS-001',
        managementType: 'batch',
        bannerImage: '/images/pigs-banner.jpg',
        categories: [
          {
            name: 'Batch Info',
            fields: [
              { name: 'batchName', label: 'Batch Name', type: 'text', required: true },
              { name: 'breed', label: 'Breed', type: 'select', options: ['Large White', 'Landrace', 'Duroc', 'Local', 'Crossbred'], required: true },
              { name: 'birthDate', label: 'Birth Date', type: 'date', required: true },
              { name: 'age', label: 'Age (weeks)', type: 'number', required: true },
              { name: 'averageWeight', label: 'Average Weight (kg)', type: 'number', required: true },
              { name: 'purpose', label: 'Purpose', type: 'select', options: ['Breeding', 'Meat Production', 'Show'], required: true }
            ]
          },
          {
            name: 'Health Info',
            fields: [
              { name: 'vaccinationStatus', label: 'Vaccination Status', type: 'select', options: ['Complete', 'Partial', 'Pending'], required: true },
              { name: 'healthStatus', label: 'Health Status', type: 'select', options: ['Healthy', 'Sick', 'Under Treatment'], required: true },
              { name: 'feedType', label: 'Feed Type', type: 'select', options: ['Starter', 'Grower', 'Finisher', 'Breeder'], required: true }
            ]
          }
        ],
        productivityFields: [
          { name: 'weightGain', label: 'Daily Weight Gain', type: 'number', unit: 'kg/day', required: true },
          { name: 'feedConversion', label: 'Feed Conversion Ratio', type: 'number', unit: 'kg feed/kg gain', required: true }
        ],
        caretakers: [
          { id: 'CT007', name: 'Nimal Rajapaksa', mobile: '+94 77 789 0123' },
          { id: 'CT008', name: 'Chamari Wickramasinghe', mobile: '+94 77 890 1234' }
        ]
      },
      {
        name: 'Fish',
        typeId: 'FISH-001',
        managementType: 'batch',
        bannerImage: '/images/fish-banner.jpg',
        categories: [
          {
            name: 'Batch Info',
            fields: [
              { name: 'batchName', label: 'Batch Name', type: 'text', required: true },
              { name: 'species', label: 'Species', type: 'select', options: ['Tilapia', 'Carp', 'Catfish', 'Milkfish', 'Local'], required: true },
              { name: 'stockingDate', label: 'Stocking Date', type: 'date', required: true },
              { name: 'age', label: 'Age (months)', type: 'number', required: true },
              { name: 'averageSize', label: 'Average Size (cm)', type: 'number', required: true },
              { name: 'pondType', label: 'Pond Type', type: 'select', options: ['Earthen', 'Concrete', 'Cage'], required: true }
            ]
          },
          {
            name: 'Health Info',
            fields: [
              { name: 'waterQuality', label: 'Water Quality', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true },
              { name: 'diseaseStatus', label: 'Disease Status', type: 'select', options: ['Healthy', 'Sick', 'Under Treatment'], required: true },
              { name: 'oxygenLevel', label: 'Oxygen Level (mg/L)', type: 'number' }
            ]
          }
        ],
        productivityFields: [
          { name: 'growthRate', label: 'Growth Rate', type: 'number', unit: 'g/day', required: true },
          { name: 'feedConsumption', label: 'Feed Consumption', type: 'number', unit: 'kg/day', required: true }
        ],
        caretakers: [
          { id: 'CT009', name: 'Samantha Karunaratne', mobile: '+94 77 901 2345' },
          { id: 'CT010', name: 'Dilshan Mendis', mobile: '+94 77 012 3456' }
        ]
      }
    ];

    const createdTypes = await AnimalType.insertMany(animalTypes);
    console.log('✅ Animal types created successfully');
    return createdTypes;
  } catch (error) {
    console.error('❌ Error creating animal types:', error);
    throw error;
  }
};

// Generate sample animals
const generateSampleAnimals = async (animalTypes, zones) => {
  try {
    console.log('🐾 Generating sample animals...');
    
    const cattleType = animalTypes.find(t => t.name === 'Cattle');
    const poultryType = animalTypes.find(t => t.name === 'Poultry');
    const goatsType = animalTypes.find(t => t.name === 'Goats');
    const pigsType = animalTypes.find(t => t.name === 'Pigs');
    const fishType = animalTypes.find(t => t.name === 'Fish');

    const cattleZones = zones.filter(z => z.assignedAnimalTypes.includes('cattle'));
    const poultryZones = zones.filter(z => z.assignedAnimalTypes.includes('poultry'));
    const goatZones = zones.filter(z => z.assignedAnimalTypes.includes('goats'));
    const pigZones = zones.filter(z => z.assignedAnimalTypes.includes('pigs'));
    const fishZones = zones.filter(z => z.assignedAnimalTypes.includes('fish'));

    const animals = [];

    // Generate 15 Cattle (Individual Management)
    for (let i = 1; i <= 15; i++) {
      const zone = cattleZones[Math.floor(Math.random() * cattleZones.length)];
      const breeds = ['Holstein', 'Jersey', 'Angus', 'Hereford', 'Brahman', 'Local'];
      const genders = ['Male', 'Female'];
      const colors = ['Black', 'White', 'Brown', 'Black & White', 'Red', 'Spotted'];
      const healthStatuses = ['Healthy', 'Sick', 'Under Treatment', 'Recovering'];
      const vaccinationStatuses = ['Up to Date', 'Pending', 'Overdue'];

      const animal = {
        type: cattleType._id,
        animalId: `CATTLE-${String(i).padStart(3, '0')}`,
        data: {
          name: `Cattle-${i}`,
          breed: breeds[Math.floor(Math.random() * breeds.length)],
          gender: genders[Math.floor(Math.random() * genders.length)],
          dateOfBirth: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          weight: 300 + Math.floor(Math.random() * 200),
          color: colors[Math.floor(Math.random() * colors.length)],
          motherId: i > 5 ? `CATTLE-${String(Math.floor(Math.random() * 5) + 1).padStart(3, '0')}` : null,
          fatherId: i > 5 ? `CATTLE-${String(Math.floor(Math.random() * 5) + 1).padStart(3, '0')}` : null,
          vaccinationStatus: vaccinationStatuses[Math.floor(Math.random() * vaccinationStatuses.length)],
          lastVaccination: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          healthStatus: healthStatuses[Math.floor(Math.random() * healthStatuses.length)],
          medicalNotes: healthStatuses[Math.floor(Math.random() * healthStatuses.length)] === 'Sick' ? 'Under observation for minor health issues' : null
        },
        assignedZone: zone._id,
        count: 1,
        isBatch: false
      };
      animals.push(animal);
    }

    // Generate 15 Poultry Batches (Batch Management)
    for (let i = 1; i <= 15; i++) {
      const zone = poultryZones[Math.floor(Math.random() * poultryZones.length)];
      const breeds = ['Broiler', 'Layer', 'Local', 'Rhode Island Red', 'Leghorn'];
      const sources = ['Hatchery', 'Local Farm', 'Breeder'];
      const healthStatuses = ['Healthy', 'Sick', 'Under Treatment'];
      const vaccinationStatuses = ['Complete', 'Partial', 'Pending'];

      const batchSize = 50 + Math.floor(Math.random() * 100);

      const animal = {
        type: poultryType._id,
        animalId: `POULTRY-BATCH-${String(i).padStart(3, '0')}`,
        data: {
          batchName: `Poultry Batch ${i}`,
          breed: breeds[Math.floor(Math.random() * breeds.length)],
          hatchDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          source: sources[Math.floor(Math.random() * sources.length)],
          age: 1 + Math.floor(Math.random() * 20),
          averageWeight: 500 + Math.floor(Math.random() * 1000),
          vaccinationStatus: vaccinationStatuses[Math.floor(Math.random() * vaccinationStatuses.length)],
          healthStatus: healthStatuses[Math.floor(Math.random() * healthStatuses.length)],
          mortalityRate: Math.floor(Math.random() * 5)
        },
        assignedZone: zone._id,
        batchId: `POULTRY-BATCH-${String(i).padStart(3, '0')}`,
        count: batchSize,
        isBatch: true
      };
      animals.push(animal);
    }

    // Generate 15 Goats (Individual Management)
    for (let i = 1; i <= 15; i++) {
      const zone = goatZones[Math.floor(Math.random() * goatZones.length)];
      const breeds = ['Boer', 'Nubian', 'Saanen', 'Local', 'Jamnapari'];
      const genders = ['Male', 'Female'];
      const colors = ['White', 'Black', 'Brown', 'Mixed', 'Spotted'];
      const hornStatuses = ['Horned', 'Polled', 'Dehorned'];
      const healthStatuses = ['Healthy', 'Sick', 'Under Treatment', 'Recovering'];
      const vaccinationStatuses = ['Up to Date', 'Pending', 'Overdue'];
      const dewormingStatuses = ['Current', 'Due', 'Overdue'];

      const animal = {
        type: goatsType._id,
        animalId: `GOAT-${String(i).padStart(3, '0')}`,
        data: {
          name: `Goat-${i}`,
          breed: breeds[Math.floor(Math.random() * breeds.length)],
          gender: genders[Math.floor(Math.random() * genders.length)],
          dateOfBirth: new Date(2021 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          weight: 25 + Math.floor(Math.random() * 40),
          color: colors[Math.floor(Math.random() * colors.length)],
          hornStatus: hornStatuses[Math.floor(Math.random() * hornStatuses.length)],
          vaccinationStatus: vaccinationStatuses[Math.floor(Math.random() * vaccinationStatuses.length)],
          dewormingStatus: dewormingStatuses[Math.floor(Math.random() * dewormingStatuses.length)],
          healthStatus: healthStatuses[Math.floor(Math.random() * healthStatuses.length)]
        },
        assignedZone: zone._id,
        count: 1,
        isBatch: false
      };
      animals.push(animal);
    }

    // Generate 15 Pig Batches (Batch Management)
    for (let i = 1; i <= 15; i++) {
      const zone = pigZones[Math.floor(Math.random() * pigZones.length)];
      const breeds = ['Large White', 'Landrace', 'Duroc', 'Local', 'Crossbred'];
      const purposes = ['Breeding', 'Meat Production', 'Show'];
      const healthStatuses = ['Healthy', 'Sick', 'Under Treatment'];
      const vaccinationStatuses = ['Complete', 'Partial', 'Pending'];
      const feedTypes = ['Starter', 'Grower', 'Finisher', 'Breeder'];

      const batchSize = 8 + Math.floor(Math.random() * 12);

      const animal = {
        type: pigsType._id,
        animalId: `PIG-BATCH-${String(i).padStart(3, '0')}`,
        data: {
          batchName: `Pig Batch ${i}`,
          breed: breeds[Math.floor(Math.random() * breeds.length)],
          birthDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          age: 1 + Math.floor(Math.random() * 24),
          averageWeight: 20 + Math.floor(Math.random() * 80),
          purpose: purposes[Math.floor(Math.random() * purposes.length)],
          vaccinationStatus: vaccinationStatuses[Math.floor(Math.random() * vaccinationStatuses.length)],
          healthStatus: healthStatuses[Math.floor(Math.random() * healthStatuses.length)],
          feedType: feedTypes[Math.floor(Math.random() * feedTypes.length)]
        },
        assignedZone: zone._id,
        batchId: `PIG-BATCH-${String(i).padStart(3, '0')}`,
        count: batchSize,
        isBatch: true
      };
      animals.push(animal);
    }

    // Generate 15 Fish Batches (Batch Management)
    for (let i = 1; i <= 15; i++) {
      const zone = fishZones[Math.floor(Math.random() * fishZones.length)];
      const species = ['Tilapia', 'Carp', 'Catfish', 'Milkfish', 'Local'];
      const pondTypes = ['Earthen', 'Concrete', 'Cage'];
      const waterQualities = ['Excellent', 'Good', 'Fair', 'Poor'];
      const diseaseStatuses = ['Healthy', 'Sick', 'Under Treatment'];

      const batchSize = 200 + Math.floor(Math.random() * 300);

      const animal = {
        type: fishType._id,
        animalId: `FISH-BATCH-${String(i).padStart(3, '0')}`,
        data: {
          batchName: `Fish Batch ${i}`,
          species: species[Math.floor(Math.random() * species.length)],
          stockingDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          age: 1 + Math.floor(Math.random() * 12),
          averageSize: 5 + Math.floor(Math.random() * 15),
          pondType: pondTypes[Math.floor(Math.random() * pondTypes.length)],
          waterQuality: waterQualities[Math.floor(Math.random() * waterQualities.length)],
          diseaseStatus: diseaseStatuses[Math.floor(Math.random() * diseaseStatuses.length)],
          oxygenLevel: 5 + Math.floor(Math.random() * 3)
        },
        assignedZone: zone._id,
        batchId: `FISH-BATCH-${String(i).padStart(3, '0')}`,
        count: batchSize,
        isBatch: true
      };
      animals.push(animal);
    }

    const createdAnimals = await Animal.insertMany(animals);
    console.log('✅ Sample animals created successfully');

    // Update zone occupancy
    for (const animal of createdAnimals) {
      await Zone.findByIdAndUpdate(animal.assignedZone, {
        $inc: { currentOccupancy: animal.count }
      });
    }
    console.log('✅ Zone occupancy updated');

    return createdAnimals;
  } catch (error) {
    console.error('❌ Error generating sample animals:', error);
    throw error;
  }
};

// Generate productivity data
const generateProductivityData = async (animals, animalTypes) => {
  try {
    console.log('📊 Generating productivity data...');
    
    const productivityData = [];

    for (const animal of animals) {
      const animalType = animalTypes.find(t => t._id.toString() === animal.type.toString());
      
      // Generate 5-10 productivity records per animal
      const recordCount = 5 + Math.floor(Math.random() * 6);
      
      for (let i = 0; i < recordCount; i++) {
        const recordDate = new Date();
        recordDate.setDate(recordDate.getDate() - Math.floor(Math.random() * 30));

        let productivityRecord = {
          animalId: animal._id,
          animalType: animalType._id,
          date: recordDate,
          recordedBy: 'System Admin',
          data: {}
        };

        // Add productivity fields based on animal type
        if (animalType.name === 'Cattle') {
          productivityRecord.data = {
            milkProduction: 15 + Math.floor(Math.random() * 20),
            milkQuality: ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
          };
        } else if (animalType.name === 'Poultry') {
          productivityRecord.data = {
            eggProduction: 80 + Math.floor(Math.random() * 40),
            feedConsumption: 25 + Math.floor(Math.random() * 15)
          };
        } else if (animalType.name === 'Goats') {
          productivityRecord.data = {
            milkProduction: 2 + Math.floor(Math.random() * 3),
            breedingStatus: ['Breeding', 'Pregnant', 'Lactating', 'Dry'][Math.floor(Math.random() * 4)]
          };
        } else if (animalType.name === 'Pigs') {
          productivityRecord.data = {
            weightGain: 0.5 + Math.floor(Math.random() * 1.5 * 10) / 10,
            feedConversion: 2.5 + Math.floor(Math.random() * 1.5 * 10) / 10
          };
        } else if (animalType.name === 'Fish') {
          productivityRecord.data = {
            growthRate: 1 + Math.floor(Math.random() * 3),
            feedConsumption: 5 + Math.floor(Math.random() * 10)
          };
        }

        productivityData.push(productivityRecord);
      }
    }

    await AnimalProductivity.insertMany(productivityData);
    console.log('✅ Productivity data created successfully');
  } catch (error) {
    console.error('❌ Error generating productivity data:', error);
    throw error;
  }
};

// Generate feeding data
const generateFeedingData = async (animals) => {
  try {
    console.log('🍽️ Generating feeding data...');
    
    const feedingData = [];

    for (const animal of animals) {
      // Generate 3-7 feeding records per animal
      const recordCount = 3 + Math.floor(Math.random() * 5);
      
      for (let i = 0; i < recordCount; i++) {
        const feedDate = new Date();
        feedDate.setDate(feedDate.getDate() - Math.floor(Math.random() * 14));

        const feedingRecord = {
          animalId: animal._id,
          batchId: animal.batchId || null,
          feedType: ['Concentrate', 'Hay', 'Grass', 'Pellets', 'Mixed Feed'][Math.floor(Math.random() * 5)],
          quantity: 1 + Math.floor(Math.random() * 10),
          unit: 'kg',
          feedingTime: new Date(feedDate.getTime() + Math.floor(Math.random() * 24 * 60 * 60 * 1000)),
          notes: 'Regular feeding schedule',
          recordedBy: 'Farm Staff'
        };

        feedingData.push(feedingRecord);
      }
    }

    await FeedingHistory.insertMany(feedingData);
    console.log('✅ Feeding data created successfully');
  } catch (error) {
    console.error('❌ Error generating feeding data:', error);
    throw error;
  }
};

// Main execution function
const main = async () => {
  try {
    console.log('🚀 Starting animal management data population...');
    
    await connectDB();
    await cleanDatabase();
    
    const zones = await createZones();
    const animalTypes = await createAnimalTypes();
    const animals = await generateSampleAnimals(animalTypes, zones);
    
    await generateProductivityData(animals, animalTypes);
    await generateFeedingData(animals);
    
    console.log('🎉 Animal management data population completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Animal Types: ${animalTypes.length}`);
    console.log(`   - Zones: ${zones.length}`);
    console.log(`   - Animals: ${animals.length}`);
    console.log(`   - Individual Animals: ${animals.filter(a => !a.isBatch).length}`);
    console.log(`   - Batch Animals: ${animals.filter(a => a.isBatch).length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in main execution:', error);
    process.exit(1);
  }
};

// Run the script
main();

