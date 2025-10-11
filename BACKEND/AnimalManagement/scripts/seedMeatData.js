// Script to seed realistic meat productivity data
import mongoose from 'mongoose';
import MeatProductivity from '../models/MeatProductivity.js';
import HarvestHistory from '../models/HarvestHistory.js';

// MongoDB connection string - using the same as app.js
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority';

// Realistic meat data
const meatData = [
  // Beef batches
  {
    batchName: 'Premium Beef Batch A',
    animalType: 'Cow',
    meatType: 'Beef Steak',
    quantity: 150,
    unit: 'kg',
    productionDate: new Date('2025-09-15'),
    expiryDate: new Date('2025-12-15'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'High-quality grass-fed beef from local farm',
  },
  {
    batchName: 'Ground Beef Batch B',
    animalType: 'Cow',
    meatType: 'Ground Beef',
    quantity: 200,
    unit: 'kg',
    productionDate: new Date('2025-09-20'),
    expiryDate: new Date('2025-11-20'),
    status: 'Stored',
    healthCondition: 'Good',
    notes: 'Lean ground beef, 85/15 ratio',
  },
  {
    batchName: 'Beef Ribs Batch C',
    animalType: 'Cow',
    meatType: 'Beef Ribs',
    quantity: 120,
    unit: 'kg',
    productionDate: new Date('2025-09-25'),
    expiryDate: new Date('2025-12-25'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Short ribs and back ribs mix',
  },
  
  // Chicken batches
  {
    batchName: 'Chicken Breast Batch A',
    animalType: 'Chicken',
    meatType: 'Chicken Breast',
    quantity: 180,
    unit: 'kg',
    productionDate: new Date('2025-10-01'),
    expiryDate: new Date('2025-10-15'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Boneless, skinless chicken breast',
  },
  {
    batchName: 'Chicken Wings Batch B',
    animalType: 'Chicken',
    meatType: 'Chicken Wings',
    quantity: 100,
    unit: 'kg',
    productionDate: new Date('2025-10-03'),
    expiryDate: new Date('2025-10-17'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Fresh chicken wings for grilling',
  },
  {
    batchName: 'Whole Chicken Batch C',
    animalType: 'Chicken',
    meatType: 'Whole Chicken',
    quantity: 250,
    unit: 'kg',
    productionDate: new Date('2025-10-05'),
    expiryDate: new Date('2025-10-19'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Free-range whole chickens',
  },
  {
    batchName: 'Chicken Thighs Batch D',
    animalType: 'Chicken',
    meatType: 'Chicken Thighs',
    quantity: 140,
    unit: 'kg',
    productionDate: new Date('2025-10-07'),
    expiryDate: new Date('2025-10-21'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Bone-in chicken thighs',
  },
  
  // Pork batches
  {
    batchName: 'Pork Chops Batch A',
    animalType: 'Pig',
    meatType: 'Pork Chops',
    quantity: 130,
    unit: 'kg',
    productionDate: new Date('2025-09-28'),
    expiryDate: new Date('2025-11-28'),
    status: 'Stored',
    healthCondition: 'Good',
    notes: 'Center-cut pork chops',
  },
  {
    batchName: 'Ground Pork Batch B',
    animalType: 'Pig',
    meatType: 'Ground Pork',
    quantity: 160,
    unit: 'kg',
    productionDate: new Date('2025-10-02'),
    expiryDate: new Date('2025-11-02'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Fresh ground pork for sausages',
  },
  {
    batchName: 'Pork Ribs Batch C',
    animalType: 'Pig',
    meatType: 'Pork Ribs',
    quantity: 110,
    unit: 'kg',
    productionDate: new Date('2025-10-04'),
    expiryDate: new Date('2025-12-04'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Baby back ribs',
  },
  
  // Lamb batches
  {
    batchName: 'Lamb Chops Batch A',
    animalType: 'Sheep',
    meatType: 'Lamb Chops',
    quantity: 80,
    unit: 'kg',
    productionDate: new Date('2025-09-18'),
    expiryDate: new Date('2025-12-18'),
    status: 'Stored',
    healthCondition: 'Good',
    notes: 'Premium lamb chops from local farm',
  },
  {
    batchName: 'Ground Lamb Batch B',
    animalType: 'Sheep',
    meatType: 'Ground Lamb',
    quantity: 90,
    unit: 'kg',
    productionDate: new Date('2025-09-22'),
    expiryDate: new Date('2025-11-22'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Ground lamb for kebabs',
  },
  {
    batchName: 'Lamb Leg Batch C',
    animalType: 'Sheep',
    meatType: 'Lamb Leg',
    quantity: 70,
    unit: 'kg',
    productionDate: new Date('2025-10-06'),
    expiryDate: new Date('2025-12-06'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Whole lamb legs for roasting',
  },
  
  // Turkey batches
  {
    batchName: 'Turkey Breast Batch A',
    animalType: 'Turkey',
    meatType: 'Turkey Breast',
    quantity: 120,
    unit: 'kg',
    productionDate: new Date('2025-10-08'),
    expiryDate: new Date('2025-10-22'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Boneless turkey breast',
  },
  {
    batchName: 'Ground Turkey Batch B',
    animalType: 'Turkey',
    meatType: 'Ground Turkey',
    quantity: 95,
    unit: 'kg',
    productionDate: new Date('2025-10-09'),
    expiryDate: new Date('2025-10-23'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Lean ground turkey',
  },
  {
    batchName: 'Whole Turkey Batch C',
    animalType: 'Turkey',
    meatType: 'Whole Turkey',
    quantity: 200,
    unit: 'kg',
    productionDate: new Date('2025-10-10'),
    expiryDate: new Date('2025-10-24'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Whole turkeys for holiday season',
  },
  
  // Duck batches
  {
    batchName: 'Duck Breast Batch A',
    animalType: 'Duck',
    meatType: 'Duck Breast',
    quantity: 60,
    unit: 'kg',
    productionDate: new Date('2025-09-30'),
    expiryDate: new Date('2025-10-14'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Premium duck breast fillets',
  },
  {
    batchName: 'Whole Duck Batch B',
    animalType: 'Duck',
    meatType: 'Whole Duck',
    quantity: 85,
    unit: 'kg',
    productionDate: new Date('2025-10-02'),
    expiryDate: new Date('2025-10-16'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Whole ducks for roasting',
  },
  
  // Fish batches
  {
    batchName: 'Salmon Fillets Batch A',
    animalType: 'Fish',
    meatType: 'Salmon',
    quantity: 110,
    unit: 'kg',
    productionDate: new Date('2025-10-09'),
    expiryDate: new Date('2025-10-16'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Fresh Atlantic salmon fillets',
  },
  {
    batchName: 'Tuna Steaks Batch B',
    animalType: 'Fish',
    meatType: 'Tuna',
    quantity: 75,
    unit: 'kg',
    productionDate: new Date('2025-10-10'),
    expiryDate: new Date('2025-10-17'),
    status: 'Fresh',
    healthCondition: 'Good',
    notes: 'Yellowfin tuna steaks',
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Clear existing data
    console.log('\nClearing existing meat productivity data...');
    const deletedMeat = await MeatProductivity.deleteMany({});
    console.log(`Deleted ${deletedMeat.deletedCount} meat batches`);

    console.log('Clearing existing harvest history data...');
    const deletedHistory = await HarvestHistory.deleteMany({});
    console.log(`Deleted ${deletedHistory.deletedCount} harvest records`);

    // Insert new data one by one to trigger pre-save hooks
    console.log('\nInserting 20 new meat batches...');
    const insertedBatches = [];
    const harvestRecords = [];
    
    for (let i = 0; i < meatData.length; i++) {
      const data = meatData[i];
      const batch = new MeatProductivity(data);
      await batch.save();
      insertedBatches.push(batch);
      
      // Harvest every other batch (10 active, 10 harvested)
      if (i % 2 === 0) {
        const slaughterDate = new Date(data.productionDate);
        slaughterDate.setDate(slaughterDate.getDate() + 7); // 7 days after production
        
        const totalMeatProduced = data.quantity * 0.85; // 85% yield
        
        // Create harvest history record
        const harvestRecord = new HarvestHistory({
          batchId: batch.batchId,
          batchName: batch.batchName,
          animalType: batch.animalType,
          meatType: batch.meatType,
          quantity: batch.quantity,
          unit: batch.unit,
          productionDate: batch.productionDate,
          slaughterDate: slaughterDate,
          totalMeatProduced: totalMeatProduced,
          storageLocation: `Cold Storage ${String.fromCharCode(65 + Math.floor(i / 2))}`,
          notes: batch.notes,
          harvestNotes: 'Successfully harvested and stored',
          statusAtHarvest: batch.status,
          healthConditionAtHarvest: batch.healthCondition,
        });
        
        await harvestRecord.save();
        harvestRecords.push(harvestRecord);
        
        // Update the batch to mark as harvested
        batch.isActive = false;
        batch.slaughterDate = slaughterDate;
        batch.totalMeatProduced = totalMeatProduced;
        batch.storageLocation = harvestRecord.storageLocation;
        batch.harvestNotes = 'Successfully harvested and stored';
        await batch.save();
      }
    }
    
    console.log(`Successfully inserted ${insertedBatches.length} meat batches!`);
    console.log(`  - Active batches: ${insertedBatches.filter(b => b.isActive).length}`);
    console.log(`  - Harvested batches: ${harvestRecords.length}`);

    // Display summary
    console.log('\n=== Data Summary ===');
    const summary = await MeatProductivity.aggregate([
      {
        $group: {
          _id: '$meatType',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log('\nMeat Types Distribution:');
    summary.forEach((item) => {
      console.log(`  ${item._id}: ${item.count} batches, ${item.totalQuantity} kg`);
    });

    const totalQuantity = summary.reduce((sum, item) => sum + item.totalQuantity, 0);
    console.log(`\nTotal Quantity: ${totalQuantity} kg`);
    console.log(`Total Batches: ${insertedBatches.length}`);

    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
  }
}

// Run the seed function
seedDatabase();
