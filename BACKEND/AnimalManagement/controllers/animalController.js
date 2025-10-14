import { v4 as uuidv4 } from 'uuid';
import Animal from '../models/Animal.js';
import AnimalType from '../models/AnimalType.js';
import Zone from '../models/Zone.js';
import mongoose from 'mongoose';
import { canZoneAccommodate, updateZoneOccupancy } from '../utils/zoneOccupancy.js';

// Helper function to delete all productivity records for a batch
const deleteAllProductivityRecords = async (batchId, batchAnimal, individualAnimals, session) => {
  const AnimalProductivity = (await import('../models/AnimalProductivity.js')).default;
  
  // Get all possible IDs that might be linked to productivity records
  const allAnimalIds = [
    batchAnimal._id,
    ...individualAnimals.map(a => a._id)
  ];
  
  // Try multiple deletion strategies
  const deletionQueries = [
    { batchId: batchId },
    { batchId: batchAnimal.batchId },
    { animalId: { $in: allAnimalIds } },
    { isGroup: true, batchId: batchId },
    { isGroup: false, animalId: { $in: allAnimalIds } }
  ];
  
  let totalDeleted = 0;
  
  for (const query of deletionQueries) {
    const result = await AnimalProductivity.deleteMany(query, { session });
    if (result.deletedCount > 0) {
      console.log(`Deleted ${result.deletedCount} productivity records with query:`, query);
      totalDeleted += result.deletedCount;
    }
  }
  
  // Also try to find any remaining records by searching for the batch name or animal IDs
  const remainingRecords = await AnimalProductivity.find({
    $or: [
      { animalId: { $in: allAnimalIds } },
      { batchId: batchId },
      { batchId: batchAnimal.batchId }
    ]
  });
  
  if (remainingRecords.length > 0) {
    console.log(`Found ${remainingRecords.length} remaining productivity records, deleting by ID...`);
    const finalResult = await AnimalProductivity.deleteMany({
      _id: { $in: remainingRecords.map(r => r._id) }
    }, { session });
    totalDeleted += finalResult.deletedCount;
  }
  
  console.log(`Total productivity records deleted: ${totalDeleted}`);
  return totalDeleted;
};


// Create new animal with auto-generated AnimalID
export const createAnimal = async (req, res) => {
  try {
    const { type, data, generateQR, zoneId, batchId } = req.body;

    let animalType;
    if (mongoose.Types.ObjectId.isValid(type)) {
      animalType = await AnimalType.findById(type);
    } else {
      animalType = await AnimalType.findOne({ name: { $regex: new RegExp(type, 'i') } });
    }
    if (!animalType) return res.status(400).json({ message: 'Invalid animal type' });

    // Check if zone can accommodate this animal
    if (zoneId) {
      const accommodationCheck = await canZoneAccommodate(zoneId, 1);
      if (!accommodationCheck.canAccommodate) {
        return res.status(400).json({ 
          message: 'Cannot add animal to zone', 
          reason: accommodationCheck.reason 
        });
      }
    }

    const qrCode = generateQR ? uuidv4() : undefined;

    // FIXED: Better animal ID generation with proper error handling
    let nextNumber = 1;
    let animalId;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      // Get the highest animal ID for this type
      const lastAnimal = await Animal.findOne({ 
        type: animalType._id,
        animalId: new RegExp(`^MO-${animalType.typeId}-`)
      })
      .sort({ animalId: -1 })
      .select('animalId');

      if (lastAnimal && lastAnimal.animalId) {
        const lastIdParts = lastAnimal.animalId.split('-');
        if (lastIdParts.length === 3) {
          const lastNumber = parseInt(lastIdParts[2]);
          if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
          }
        }
      }

      animalId = `MO-${animalType.typeId}-${String(nextNumber).padStart(3, '0')}`;
      
      // Check if this ID already exists (double-check)
      const existingAnimal = await Animal.findOne({ animalId });
      if (!existingAnimal) {
        break; // ID is available
      }
      
      nextNumber++;
      attempts++;
      
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return res.status(500).json({ 
        message: 'Failed to generate unique animal ID after multiple attempts' 
      });
    }

    const animal = new Animal({ 
      type: animalType._id, 
      data, 
      qrCode, 
      animalId,
      assignedZone: zoneId || null,
      batchId: batchId || null
    });
    
    await animal.save();

    // Update zone occupancy if zone is assigned
    if (zoneId) {
      await updateZoneOccupancy(zoneId, 1);
    }

    res.status(201).json(animal);
  } catch (error) {
    console.error('Create animal error:', error);
    if (error.code === 11000) {
      // If we still get a duplicate error, try one more time with a different approach
      try {
        // Emergency fallback: find the absolute highest number across all animals
        const allAnimals = await Animal.find({
          animalId: new RegExp(`^MO-${animalType.typeId}-`)
        }).select('animalId');
        
        let maxNumber = 0;
        allAnimals.forEach(animal => {
          const parts = animal.animalId.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2]);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        });
        
        const animalId = `MO-${animalType.typeId}-${String(maxNumber + 1).padStart(3, '0')}`;
        
        // Retry with the new ID
        const animal = new Animal({ 
          type: animalType._id, 
          data, 
          qrCode, 
          animalId,
          assignedZone: zoneId || null,
          batchId: batchId || null
        });
        
        await animal.save();
        
        if (zoneId) {
          await updateZoneOccupancy(zoneId, 1);
        }
        
        
        return res.status(201).json(animal.toObject());
      } catch (fallbackError) {
        return res.status(500).json({ 
          message: 'Critical error in animal ID generation',
          error: fallbackError.message 
        });
      }
    }
    res.status(400).json({ message: error.message });
  }
};

// Create batch animals - FIXED: Create only ONE record for the entire batch
export const createBatchAnimals = async (req, res) => {
  try {
    const { type, data, zoneId, batchId, count, generateQR } = req.body;

    let animalType;
    if (mongoose.Types.ObjectId.isValid(type)) {
      animalType = await AnimalType.findById(type);
    } else {
      animalType = await AnimalType.findOne({ name: { $regex: new RegExp(type, 'i') } });
    }
    if (!animalType) return res.status(400).json({ message: 'Invalid animal type' });

    // Check if zone can accommodate all animals in batch
    if (zoneId) {
      const accommodationCheck = await canZoneAccommodate(zoneId, count);
      if (!accommodationCheck.canAccommodate) {
        return res.status(400).json({ 
          message: 'Cannot add batch to zone', 
          reason: accommodationCheck.reason 
        });
      }
    }

    // Generate batch ID if not provided
    const batchIdentifier = batchId || `BATCH-${Date.now()}`;

    // Generate a single animal ID for the entire batch
    const lastAnimal = await Animal.findOne({ type: animalType._id })
      .sort({ animalId: -1 })
      .select('animalId');

    let nextNumber = 1;
    if (lastAnimal && lastAnimal.animalId) {
      const lastIdParts = lastAnimal.animalId.split('-');
      if (lastIdParts.length >= 3) {
        const lastNumber = parseInt(lastIdParts[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    const animalId = `MO-${animalType.typeId}-${String(nextNumber).padStart(3, '0')}`;

    // Create ONLY ONE animal record for the entire batch
    const animal = new Animal({
      type: animalType._id,
      data: { 
        ...data, 
        batchId: batchIdentifier
      },
      qrCode: batchIdentifier, // Use batch ID as QR code
      animalId,
      assignedZone: zoneId || null,
      batchId: batchIdentifier,
      count: count, // Store the total count
      isBatch: true // Mark as batch record
    });

    await animal.save();

    // Update zone occupancy if zone is assigned
    if (zoneId) {
      await updateZoneOccupancy(zoneId, count);
    }

    res.status(201).json({
      message: `Created batch of ${count} animals`,
      batchId: batchIdentifier,
      animalsCount: count,
      animal: animal, // Return the single animal record
      batchQRCode: batchIdentifier
    });
  } catch (error) {
    console.error('Create batch animals error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate animal ID. Please try again.',
        error: error.message 
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// Get all animals (optionally filtered by type) - FIXED: Proper population
// Get all animals (optionally filtered by type)
export const getAnimals = async (req, res) => {
  try {
    const query = {};
    if (req.query.type) {
      const typeParam = req.query.type;
      let typeDoc;
      
      if (mongoose.Types.ObjectId.isValid(typeParam)) {
        typeDoc = await AnimalType.findById(typeParam);
      } else {
        typeDoc = await AnimalType.findOne({ name: { $regex: new RegExp(typeParam, 'i') } });
      }
      
      if (!typeDoc) return res.status(404).json({ message: 'Animal type not found' });
      query.type = typeDoc._id;
    }
    
    const animals = await Animal.find(query)
      .populate('type')
      .populate('assignedZone')
      .sort({ isBatch: 1, createdAt: -1 }); // Sort batch records first
    
    // Transform the data for frontend
    const transformedAnimals = animals.map(animal => {
      const animalObj = animal.toObject();
      
      // For batch animals, show count instead of individual animal
      if (animal.isBatch) {
        return {
          ...animalObj,
          // This will make it display as "Batch: ID" with the count
          displayId: `Batch: ${animal.animalId}`,
          count: animal.count
        };
      }
      
      return animalObj;
    });
    
    res.json(transformedAnimals);
  } catch (error) {
    console.error('Get animals error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single animal
export const getAnimal = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id)
      .populate('type')
      .populate('assignedZone');
    if (!animal) return res.status(404).json({ message: 'Animal not found' });
    res.json(animal);
  } catch (error) {
    console.error('Get animal error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update animal
export const updateAnimal = async (req, res) => {
  try {
    const { data, generateQR, zoneId } = req.body;
    const qrCodeUpdate = generateQR ? uuidv4() : undefined;

    // If zone is being updated, handle occupancy changes
    if (zoneId) {
      const animal = await Animal.findById(req.params.id);
      if (!animal) return res.status(404).json({ message: 'Animal not found' });

      // Check if new zone can accommodate the animal
      const accommodationCheck = await canZoneAccommodate(zoneId, 1);
      if (!accommodationCheck.canAccommodate) {
        return res.status(400).json({ 
          message: 'Cannot move animal to zone', 
          reason: accommodationCheck.reason 
        });
      }

      // Update occupancy in both zones if zone is changing
      if (animal.assignedZone && animal.assignedZone.toString() !== zoneId) {
        await updateZoneOccupancy(animal.assignedZone.toString(), -1);
        await updateZoneOccupancy(zoneId, 1);
      } else if (!animal.assignedZone && zoneId) {
        // Animal didn't have a zone before
        await updateZoneOccupancy(zoneId, 1);
      }
    }

    const updateFields = {
      data,
      updatedAt: Date.now(),
      ...(qrCodeUpdate && { qrCode: qrCodeUpdate }),
      ...(zoneId && { assignedZone: zoneId })
    };

    const updatedAnimal = await Animal.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).populate('type').populate('assignedZone');

    if (!updatedAnimal) return res.status(404).json({ message: 'Animal not found' });
    res.json(updatedAnimal);
  } catch (error) {
    console.error('Update animal error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete animal
export const deleteAnimal = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    // Store zone ID and batch ID before deletion
    const zoneId = animal.assignedZone;
    const batchId = animal.batchId;
    const animalId = animal._id;

    // Start a transaction for cascading deletes
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Delete the animal record
      await Animal.findByIdAndDelete(req.params.id, { session });

      // 2. Delete productivity records for this specific animal
      const AnimalProductivity = (await import('../models/AnimalProductivity.js')).default;
      const productivityResult = await AnimalProductivity.deleteMany({ animalId }, { session });
      console.log(`Deleted ${productivityResult.deletedCount} productivity records for animal ${animalId}`);

      // 3. Delete feeding history records for this animal
      const FeedingHistory = (await import('../models/feedingHistoryModel.js')).default;
      const feedingResult = await FeedingHistory.deleteMany({ animalId }, { session });
      console.log(`Deleted ${feedingResult.deletedCount} feeding history records for animal ${animalId}`);

      // 4. Delete harvest history records if this animal has any
      const HarvestHistory = (await import('../models/HarvestHistory.js')).default;
      const harvestResult = await HarvestHistory.deleteMany({ 
        $or: [
          { animalId: animalId },
          { batchId: batchId }
        ]
      }, { session });
      console.log(`Deleted ${harvestResult.deletedCount} harvest records for animal ${animalId}`);

      // 5. Delete meat productivity records if this animal has any
      const MeatProductivity = (await import('../models/MeatProductivity.js')).default;
      const meatResult = await MeatProductivity.deleteMany({ 
        $or: [
          { animalId: animalId },
          { batchId: batchId }
        ]
      }, { session });
      console.log(`Deleted ${meatResult.deletedCount} meat productivity records for animal ${animalId}`);

      // 6. Delete notifications related to this animal
      const Notification = (await import('../models/Notification.js')).default;
      const notificationResult = await Notification.deleteMany({
        'relatedEntity.id': animalId
      }, { session });
      console.log(`Deleted ${notificationResult.deletedCount} notifications for animal ${animalId}`);

      // 3. Update zone occupancy if animal was assigned to a zone
      if (zoneId) {
        await updateZoneOccupancy(zoneId.toString(), -1);
        console.log(`Updated zone ${zoneId} occupancy by -1`);
      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.json({ 
        message: 'Animal deleted successfully',
        details: {
          productivityRecords: productivityResult.deletedCount,
          feedingRecords: feedingResult.deletedCount,
          harvestRecords: harvestResult.deletedCount,
          meatRecords: meatResult.deletedCount,
          notifications: notificationResult.deletedCount,
          zoneOccupancyReduced: 1
        }
      });

    } catch (transactionError) {
      // Rollback the transaction
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }

  } catch (error) {
    console.error('Delete animal error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete batch animals
// Delete batch animals - FIXED: Handle count properly
export const deleteBatchAnimals = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Find the batch animal record
    const batchAnimal = await Animal.findOne({ batchId, isBatch: true });
    if (!batchAnimal) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Store zone ID and count before deletion
    const zoneId = batchAnimal.assignedZone;
    const count = batchAnimal.count || 1; // Ensure count is at least 1
    const animalType = batchAnimal.type;
    
    console.log(`Deleting batch ${batchId}: count=${count}, zoneId=${zoneId}`);

    // Start a transaction for cascading deletes
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Delete all individual animals in this batch (if any exist)
      const individualAnimals = await Animal.find({ batchId, isBatch: false });
      const individualCount = individualAnimals.length;
      
      if (individualCount > 0) {
        await Animal.deleteMany({ batchId, isBatch: false }, { session });
        console.log(`Deleted ${individualCount} individual animals from batch ${batchId}`);
      }

      // 2. Delete the batch record
      await Animal.findByIdAndDelete(batchAnimal._id, { session });

      // 3. Delete all productivity records for this batch (total/day/week/month/year)
      const productivityDeletedCount = await deleteAllProductivityRecords(batchId, batchAnimal, individualAnimals, session);
      
      // Verify all productivity records are deleted
      const AnimalProductivity = (await import('../models/AnimalProductivity.js')).default;
      const remainingProductivity = await AnimalProductivity.find({
        $or: [
          { batchId: batchId },
          { animalId: batchAnimal._id },
          { animalId: { $in: individualAnimals.map(a => a._id) } }
        ]
      });
      
      if (remainingProductivity.length > 0) {
        console.log(`WARNING: ${remainingProductivity.length} productivity records still exist after deletion!`);
        console.log('Remaining records:', remainingProductivity.map(r => ({ id: r._id, batchId: r.batchId, animalId: r.animalId })));
      } else {
        console.log(`✅ All productivity records successfully deleted for batch ${batchId}`);
      }

      // 4. Delete all harvest history records for this batch
      const HarvestHistory = (await import('../models/HarvestHistory.js')).default;
      const harvestResult = await HarvestHistory.deleteMany({ batchId }, { session });
      console.log(`Deleted ${harvestResult.deletedCount} harvest records for batch ${batchId}`);

      // 5. Delete all meat productivity records for this batch
      const MeatProductivity = (await import('../models/MeatProductivity.js')).default;
      const meatResult = await MeatProductivity.deleteMany({ batchId }, { session });
      console.log(`Deleted ${meatResult.deletedCount} meat productivity records for batch ${batchId}`);

      // 6. Delete all feeding history records for individual animals in this batch
      const FeedingHistory = (await import('../models/feedingHistoryModel.js')).default;
      const feedingResult = await FeedingHistory.deleteMany({ 
        animalId: { $in: individualAnimals.map(a => a._id) } 
      }, { session });
      console.log(`Deleted ${feedingResult.deletedCount} feeding history records for batch ${batchId}`);

      // 7. Delete all notifications related to this batch
      const Notification = (await import('../models/Notification.js')).default;
      const notificationResult = await Notification.deleteMany({
        $or: [
          { 'relatedEntity.id': { $in: individualAnimals.map(a => a._id) } },
          { 'relatedEntity.id': batchAnimal._id }
        ]
      }, { session });
      console.log(`Deleted ${notificationResult.deletedCount} notifications for batch ${batchId}`);

      // 6. Update zone occupancy if batch was assigned to a zone
      if (zoneId) {
        console.log(`Updating zone ${zoneId} occupancy by -${count} (current count: ${count})`);
        const updatedZone = await updateZoneOccupancy(zoneId.toString(), -count);
        console.log(`Zone ${zoneId} occupancy updated: ${updatedZone.currentOccupancy}/${updatedZone.capacity}`);
      } else {
        console.log(`No zone assigned to batch ${batchId}, skipping zone update`);
      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.json({ 
        message: `Successfully deleted batch ${batchId}`,
        details: {
          batchAnimals: count,
          individualAnimals: individualCount,
          productivityRecords: productivityDeletedCount,
          harvestRecords: harvestResult.deletedCount,
          meatRecords: meatResult.deletedCount,
          feedingRecords: feedingResult.deletedCount,
          notifications: notificationResult.deletedCount,
          zoneOccupancyReduced: count
        }
      });

    } catch (transactionError) {
      // Rollback the transaction
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }

  } catch (error) {
    console.error('Delete batch animals error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete all animals of a specific type (cascading delete for animal type deletion)
export const deleteAnimalsByType = async (req, res) => {
  try {
    const { animalTypeId } = req.params;
    
    // Find all animals of this type
    const animals = await Animal.find({ type: animalTypeId });
    if (animals.length === 0) {
      return res.json({ 
        message: 'No animals found for this type',
        details: { deletedCount: 0 }
      });
    }

    // Start a transaction for cascading deletes
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let totalZoneOccupancyReduced = 0;
      let totalProductivityRecords = 0;
      let totalHarvestRecords = 0;
      let totalMeatRecords = 0;
      const batchIds = new Set();

      // Collect batch IDs and count zone occupancy
      animals.forEach(animal => {
        if (animal.batchId) {
          batchIds.add(animal.batchId);
        }
        if (animal.assignedZone) {
          totalZoneOccupancyReduced += animal.count || 1;
        }
      });

      // 1. Delete all animals of this type
      await Animal.deleteMany({ type: animalTypeId }, { session });
      console.log(`Deleted ${animals.length} animals of type ${animalTypeId}`);

      // 2. Delete productivity records for all animals of this type
      const AnimalProductivity = (await import('../models/AnimalProductivity.js')).default;
      const productivityResult = await AnimalProductivity.deleteMany({ 
        animalId: { $in: animals.map(a => a._id) } 
      }, { session });
      totalProductivityRecords = productivityResult.deletedCount;
      console.log(`Deleted ${totalProductivityRecords} productivity records`);

      // 3. Delete feeding history records for all animals of this type
      const FeedingHistory = (await import('../models/feedingHistoryModel.js')).default;
      const feedingResult = await FeedingHistory.deleteMany({ 
        animalId: { $in: animals.map(a => a._id) } 
      }, { session });
      const totalFeedingRecords = feedingResult.deletedCount;
      console.log(`Deleted ${totalFeedingRecords} feeding history records`);

      // 4. Delete harvest history records for all batches of this type
      const HarvestHistory = (await import('../models/HarvestHistory.js')).default;
      const harvestResult = await HarvestHistory.deleteMany({ 
        batchId: { $in: Array.from(batchIds) } 
      }, { session });
      totalHarvestRecords = harvestResult.deletedCount;
      console.log(`Deleted ${totalHarvestRecords} harvest records`);

      // 5. Delete meat productivity records for all batches of this type
      const MeatProductivity = (await import('../models/MeatProductivity.js')).default;
      const meatResult = await MeatProductivity.deleteMany({ 
        batchId: { $in: Array.from(batchIds) } 
      }, { session });
      totalMeatRecords = meatResult.deletedCount;
      console.log(`Deleted ${totalMeatRecords} meat productivity records`);

      // 6. Delete all notifications related to this animal type
      const Notification = (await import('../models/Notification.js')).default;
      const notificationResult = await Notification.deleteMany({
        $or: [
          { 'relatedEntity.id': { $in: animals.map(a => a._id) } },
          { 'relatedEntity.type': 'animal' }
        ]
      }, { session });
      const totalNotifications = notificationResult.deletedCount;
      console.log(`Deleted ${totalNotifications} notifications for animal type ${animalTypeId}`);

      // 5. Update zone occupancy for all affected zones
      const zoneUpdates = {};
      animals.forEach(animal => {
        if (animal.assignedZone) {
          const zoneId = animal.assignedZone.toString();
          zoneUpdates[zoneId] = (zoneUpdates[zoneId] || 0) + (animal.count || 1);
        }
      });

      for (const [zoneId, count] of Object.entries(zoneUpdates)) {
        await updateZoneOccupancy(zoneId, -count);
        console.log(`Updated zone ${zoneId} occupancy by -${count}`);
      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.json({ 
        message: `Successfully deleted all animals of type ${animalTypeId}`,
        details: {
          animalsDeleted: animals.length,
          productivityRecords: totalProductivityRecords,
          feedingRecords: totalFeedingRecords,
          harvestRecords: totalHarvestRecords,
          meatRecords: totalMeatRecords,
          notifications: totalNotifications,
          zoneOccupancyReduced: totalZoneOccupancyReduced,
          affectedZones: Object.keys(zoneUpdates).length
        }
      });

    } catch (transactionError) {
      // Rollback the transaction
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }

  } catch (error) {
    console.error('Delete animals by type error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete entire animal type and ALL related data (PERMANENT DELETION)
export const deleteAnimalTypeCompletely = async (req, res) => {
  try {
    const { animalTypeId } = req.params;
    
    // First, get the animal type to get its name
    const animalType = await AnimalType.findById(animalTypeId);
    if (!animalType) {
      return res.status(404).json({ message: 'Animal type not found' });
    }
    
    // Find all animals of this type
    const animals = await Animal.find({ type: animalTypeId });
    const batchIds = new Set();
    animals.forEach(animal => {
      if (animal.batchId) {
        batchIds.add(animal.batchId);
      }
    });

    // Start a transaction for cascading deletes
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let totalZoneOccupancyReduced = 0;
      let totalProductivityRecords = 0;
      let totalFeedingRecords = 0;
      let totalHarvestRecords = 0;
      let totalMeatRecords = 0;
      let totalNotifications = 0;

      // 1. Delete all animals of this type
      await Animal.deleteMany({ type: animalTypeId }, { session });
      console.log(`Deleted ${animals.length} animals of type ${animalTypeId}`);

      // 2. Delete productivity records for all animals of this type
      const AnimalProductivity = (await import('../models/AnimalProductivity.js')).default;
      const productivityResult = await AnimalProductivity.deleteMany({ 
        animalId: { $in: animals.map(a => a._id) } 
      }, { session });
      totalProductivityRecords = productivityResult.deletedCount;
      console.log(`Deleted ${totalProductivityRecords} productivity records`);

      // 3. Delete feeding history records for all animals of this type
      const FeedingHistory = (await import('../models/feedingHistoryModel.js')).default;
      const feedingResult = await FeedingHistory.deleteMany({ 
        animalId: { $in: animals.map(a => a._id) } 
      }, { session });
      totalFeedingRecords = feedingResult.deletedCount;
      console.log(`Deleted ${totalFeedingRecords} feeding history records`);

      // 4. Delete harvest history records for all batches of this type
      const HarvestHistory = (await import('../models/HarvestHistory.js')).default;
      const harvestResult = await HarvestHistory.deleteMany({ 
        batchId: { $in: Array.from(batchIds) } 
      }, { session });
      totalHarvestRecords = harvestResult.deletedCount;
      console.log(`Deleted ${totalHarvestRecords} harvest records`);

      // 5. Delete meat productivity records for all batches of this type
      const MeatProductivity = (await import('../models/MeatProductivity.js')).default;
      const meatResult = await MeatProductivity.deleteMany({ 
        batchId: { $in: Array.from(batchIds) } 
      }, { session });
      totalMeatRecords = meatResult.deletedCount;
      console.log(`Deleted ${totalMeatRecords} meat productivity records`);

      // 6. Delete all notifications related to this animal type
      const Notification = (await import('../models/Notification.js')).default;
      const notificationResult = await Notification.deleteMany({
        $or: [
          { 'relatedEntity.id': { $in: animals.map(a => a._id) } },
          { 'relatedEntity.type': 'animal' }
        ]
      }, { session });
      totalNotifications = notificationResult.deletedCount;
      console.log(`Deleted ${totalNotifications} notifications for animal type ${animalTypeId}`);

      // 7. Update zone occupancy for all affected zones
      const zoneUpdates = {};
      animals.forEach(animal => {
        if (animal.assignedZone) {
          const zoneId = animal.assignedZone.toString();
          zoneUpdates[zoneId] = (zoneUpdates[zoneId] || 0) + (animal.count || 1);
          totalZoneOccupancyReduced += (animal.count || 1);
        }
      });

      for (const [zoneId, count] of Object.entries(zoneUpdates)) {
        await updateZoneOccupancy(zoneId, -count);
        console.log(`Updated zone ${zoneId} occupancy by -${count}`);
      }

      // 8. Finally, delete the animal type itself
      await AnimalType.findByIdAndDelete(animalTypeId, { session });
      console.log(`Deleted animal type: ${animalType.name}`);

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.json({ 
        message: `PERMANENTLY deleted animal type "${animalType.name}" and ALL related data`,
        details: {
          animalTypeDeleted: animalType.name,
          animalsDeleted: animals.length,
          productivityRecords: totalProductivityRecords,
          feedingRecords: totalFeedingRecords,
          harvestRecords: totalHarvestRecords,
          meatRecords: totalMeatRecords,
          notifications: totalNotifications,
          zoneOccupancyReduced: totalZoneOccupancyReduced,
          affectedZones: Object.keys(zoneUpdates).length,
          warning: "This action is PERMANENT and cannot be undone!"
        }
      });

    } catch (transactionError) {
      // Rollback the transaction
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }

  } catch (error) {
    console.error('Delete animal type completely error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Move animal to different zone
export const moveAnimalToZone = async (req, res) => {
  try {
    const { animalId } = req.params;
    const { zoneId } = req.body;

    if (!zoneId) {
      return res.status(400).json({ message: 'Zone ID is required' });
    }

    const animal = await Animal.findById(animalId);
    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    const oldZoneId = animal.assignedZone;
    const newZone = await Zone.findById(zoneId);
    if (!newZone) return res.status(404).json({ message: 'Zone not found' });

    // Get the count for batch animals or 1 for individual animals
    const animalCount = animal.isBatch ? (animal.count || 1) : 1;

    // Check if new zone can accommodate the animal(s)
    const accommodationCheck = await canZoneAccommodate(zoneId, animalCount);
    if (!accommodationCheck.canAccommodate) {
      return res.status(400).json({ 
        message: 'Cannot move animal to zone', 
        reason: accommodationCheck.reason 
      });
    }

    // Update animal's zone
    animal.assignedZone = zoneId;
    await animal.save();

    // Update occupancy in both zones
    if (oldZoneId) {
      await updateZoneOccupancy(oldZoneId.toString(), -animalCount);
    }
    await updateZoneOccupancy(zoneId, animalCount);

    res.json({ 
      message: animal.isBatch ? 'Batch moved successfully' : 'Animal moved successfully',
      animal: await Animal.findById(animalId).populate('assignedZone')
    });
  } catch (error) {
    console.error('Move animal error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Count animals (overall or by type)
export const getAnimalCount = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};

    if (type) {
      let typeDoc;
      if (mongoose.Types.ObjectId.isValid(type)) {
        typeDoc = await AnimalType.findById(type);
      } else {
        typeDoc = await AnimalType.findOne({ name: { $regex: new RegExp(type, 'i') } });
      }
      
      if (!typeDoc) return res.status(404).json({ message: 'Animal type not found' });
      filter.type = typeDoc._id;
    }

    const count = await Animal.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    console.error('Get animal count error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get health info fields + current data for an animal
export const getAnimalHealth = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id).populate('type');
    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    // Find health category fields
    const healthCategory = animal.type.categories?.find(c =>
      c.name.toLowerCase().includes('health info')
    );

    res.json({
      animalId: animal._id,
      qrCode: animal.qrCode,
      name: animal.data.name,
      healthFields: healthCategory?.fields || [],
      data: animal.data
    });
  } catch (error) {
    console.error('Get animal health error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update only health info fields
export const updateAnimalHealth = async (req, res) => {
  try {
    const { data, generateQR } = req.body; // data contains only health info fields
    const updateFields = { updatedAt: Date.now() };

    if (data) {
      // Merge existing animal data with new health info
      const animal = await Animal.findById(req.params.id);
      if (!animal) return res.status(404).json({ message: 'Animal not found' });

      updateFields.data = { ...animal.data, ...data };
    }

    if (generateQR) updateFields.qrCode = uuidv4();

    const updatedAnimal = await Animal.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).populate('type');

    res.json(updatedAnimal);
  } catch (error) {
    console.error('Update animal health error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get animals by batch ID
export const getAnimalsByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const animals = await Animal.find({ batchId })
      .populate('type')
      .populate('assignedZone');
    
    if (animals.length === 0) {
      return res.status(404).json({ message: 'No animals found for this batch' });
    }

    res.json({
      batchId,
      count: animals.length,
      animals
    });
  } catch (error) {
    console.error('Get animals by batch error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update batch information (update all animals in a batch)
export const updateBatchAnimals = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { data, zoneId } = req.body;

    // Find all animals in the batch
    const batchAnimals = await Animal.find({ batchId });
    if (batchAnimals.length === 0) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // If zone is being updated, handle occupancy changes
    if (zoneId) {
      // Check if new zone can accommodate all animals in the batch
      const accommodationCheck = await canZoneAccommodate(zoneId, batchAnimals.length);
      if (!accommodationCheck.canAccommodate) {
        return res.status(400).json({ 
          message: 'Cannot move batch to zone', 
          reason: accommodationCheck.reason 
        });
      }

      // Update occupancy for both old and new zones
      const oldZones = {};
      batchAnimals.forEach(animal => {
        if (animal.assignedZone) {
          const zoneId = animal.assignedZone.toString();
          oldZones[zoneId] = (oldZones[zoneId] || 0) + 1;
        }
      });

      // Remove animals from old zones
      for (const [zoneId, count] of Object.entries(oldZones)) {
        await updateZoneOccupancy(zoneId, -count);
      }

      // Add animals to new zone
      await updateZoneOccupancy(zoneId, batchAnimals.length);
    }

    // Update all animals in the batch
    const updateFields = {
      data: { ...batchAnimals[0].data, ...data }, // Merge existing data with new data
      updatedAt: Date.now(),
      ...(zoneId && { assignedZone: zoneId })
    };

    await Animal.updateMany(
      { batchId },
      updateFields
    );

    // Get updated animals
    const updatedAnimals = await Animal.find({ batchId })
      .populate('type')
      .populate('assignedZone');

    res.json({
      message: `Updated ${updatedAnimals.length} animals in batch ${batchId}`,
      batchId,
      animals: updatedAnimals
    });
  } catch (error) {
    console.error('Update batch animals error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get animal/batch data by QR code
export const getAnimalByQRCode = async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    console.log('QR Code search request:', qrCode);
    
    if (!qrCode) {
      return res.status(400).json({ message: 'QR code is required' });
    }

    // Search for animal by QR code (could be animalId, batchId, qrCode field, or MongoDB ObjectId)
    const searchConditions = [
      { animalId: qrCode },
      { batchId: qrCode },
      { qrCode: qrCode }
    ];
    
    // If the QR code looks like a MongoDB ObjectId, also search by _id
    if (mongoose.Types.ObjectId.isValid(qrCode)) {
      searchConditions.push({ _id: qrCode });
      console.log('QR code is valid ObjectId, searching by _id as well');
    }
    
    console.log('Search conditions:', searchConditions);
    
    const animal = await Animal.findOne({
      $or: searchConditions
    }).populate('type', 'name typeId managementType')
      .populate('assignedZone', 'name type capacity currentOccupancy');
      
    console.log('Found animal:', animal ? 'Yes' : 'No');

    if (!animal) {
      return res.status(404).json({ 
        message: 'Animal or batch not found with this QR code',
        qrCode: qrCode
      });
    }

    // Format the response data
    const responseData = {
      _id: animal._id,
      animalId: animal.animalId,
      batchId: animal.batchId,
      qrCode: animal.qrCode || animal.animalId || animal.batchId,
      type: animal.type,
      data: animal.data,
      assignedZone: animal.assignedZone,
      count: animal.count || 1,
      isBatch: animal.isBatch || false,
      createdAt: animal.createdAt,
      updatedAt: animal.updatedAt
    };

    res.json(responseData);
  } catch (error) {
    console.error('Get animal by QR code error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};