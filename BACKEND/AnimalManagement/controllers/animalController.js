import { v4 as uuidv4 } from 'uuid';
import Animal from '../models/Animal.js';
import AnimalType from '../models/AnimalType.js';
import mongoose from 'mongoose';
import { canZoneAccommodate, updateZoneOccupancy } from '../utils/zoneOccupancy.js';

// Create new animal with auto-generated AnimalID
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
        
        return res.status(201).json(animal);
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

// Create batch animals - UPDATED: Don't generate individual QR codes
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

    const animals = [];
    const batchIdentifier = batchId || `BATCH-${Date.now()}`;
    
    // FIXED: Get last animal ID to start numbering from there
    const lastAnimal = await Animal.findOne({ type: animalType._id })
      .sort({ animalId: -1 }) // Sort by animalId instead of createdAt
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

    // Create all animals in the batch - NO individual QR codes for batch animals
    for (let i = 0; i < count; i++) {
      const animalId = `MO-${animalType.typeId}-${String(nextNumber + i).padStart(3, '0')}`;
      
      const animal = new Animal({
        type: animalType._id,
        data: { 
          ...data, 
          batchNumber: i + 1, // Add batch position to data
          batchId: batchIdentifier // Also store batch ID in data for easy filtering
        },
        qrCode: null, // No individual QR codes for batch animals
        animalId,
        assignedZone: zoneId || null,
        batchId: batchIdentifier
      });
      
      animals.push(animal);
    }

    // Save all animals
    await Animal.insertMany(animals);

    // Update zone occupancy if zone is assigned
    if (zoneId) {
      await updateZoneOccupancy(zoneId, count);
    }

    res.status(201).json({
      message: `Created ${count} animals in batch ${batchIdentifier}`,
      batchId: batchIdentifier,
      animalsCount: count,
      batchQRCode: batchIdentifier // Use batch ID as the QR code for the entire batch
    });
  } catch (error) {
    console.error('Create batch animals error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate animal ID in batch. Please try again.',
        error: error.message 
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// Get all animals (optionally filtered by type) - FIXED: Proper population
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
    
    // FIXED: Properly populate assignedZone field
    const animals = await Animal.find(query)
      .populate('type')
      .populate('assignedZone');
    
    res.json(animals);
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

    // Store zone ID before deletion
    const zoneId = animal.assignedZone;

    await Animal.findByIdAndDelete(req.params.id);

    // Update zone occupancy if animal was assigned to a zone
    if (zoneId) {
      await updateZoneOccupancy(zoneId.toString(), -1);
    }

    res.json({ message: 'Animal deleted successfully' });
  } catch (error) {
    console.error('Delete animal error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete batch animals
export const deleteBatchAnimals = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Get all animals in the batch
    const batchAnimals = await Animal.find({ batchId });
    if (batchAnimals.length === 0) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Group animals by zone for efficient occupancy updates
    const zoneCounts = {};
    batchAnimals.forEach(animal => {
      if (animal.assignedZone) {
        const zoneId = animal.assignedZone.toString();
        zoneCounts[zoneId] = (zoneCounts[zoneId] || 0) + 1;
      }
    });

    // Delete all animals in the batch
    await Animal.deleteMany({ batchId });

    // Update occupancy for all affected zones
    for (const [zoneId, count] of Object.entries(zoneCounts)) {
      await updateZoneOccupancy(zoneId, -count);
    }

    res.json({ 
      message: `Deleted ${batchAnimals.length} animals from batch ${batchId}`,
      deletedCount: batchAnimals.length
    });
  } catch (error) {
    console.error('Delete batch animals error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Move animal to different zone
export const moveAnimalToZone = async (req, res) => {
  try {
    const { animalId } = req.params;
    const { zoneId } = req.body;

    const animal = await Animal.findById(animalId);
    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    const oldZoneId = animal.assignedZone;
    const newZone = await Zone.findById(zoneId);
    if (!newZone) return res.status(404).json({ message: 'Zone not found' });

    // Check if new zone can accommodate the animal
    const accommodationCheck = await canZoneAccommodate(zoneId, 1);
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
      await updateZoneOccupancy(oldZoneId.toString(), -1);
    }
    await updateZoneOccupancy(zoneId, 1);

    res.json({ 
      message: 'Animal moved successfully',
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