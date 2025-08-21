// utils/zoneOccupancy.js
import Zone from '../models/Zone.js';
import Animal from '../models/Animal.js';

// Check if zone can accommodate additional animals
export const canZoneAccommodate = async (zoneId, numberOfAnimals) => {
  try {
    const zone = await Zone.findById(zoneId);
    if (!zone) return { canAccommodate: false, reason: 'Zone not found' };
    
    const availableSpace = zone.capacity - zone.currentOccupancy;
    if (availableSpace >= numberOfAnimals) {
      return { canAccommodate: true, availableSpace };
    } else {
      return { 
        canAccommodate: false, 
        reason: `Zone can only accommodate ${availableSpace} more animals`,
        availableSpace 
      };
    }
  } catch (error) {
    throw new Error(`Error checking zone capacity: ${error.message}`);
  }
};

// Update zone occupancy
export const updateZoneOccupancy = async (zoneId, change) => {
  try {
    const zone = await Zone.findById(zoneId);
    if (!zone) throw new Error('Zone not found');
    
    const newOccupancy = zone.currentOccupancy + change;
    if (newOccupancy < 0) {
      throw new Error('Occupancy cannot be negative');
    }
    
    if (newOccupancy > zone.capacity) {
      throw new Error('Occupancy exceeds zone capacity');
    }
    
    zone.currentOccupancy = newOccupancy;
    await zone.save();
    return zone;
  } catch (error) {
    throw new Error(`Error updating zone occupancy: ${error.message}`);
  }
};

// Get animals count by batch
export const getBatchAnimalCount = async (batchId) => {
  return await Animal.countDocuments({ batchId });
};