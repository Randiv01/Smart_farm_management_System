import { v4 as uuidv4 } from 'uuid';
import Animal from '../models/Animal.js';
import AnimalType from '../models/AnimalType.js';
import mongoose from 'mongoose';

// Create new animal with auto-generated AnimalID
export const createAnimal = async (req, res) => {
  try {
    const { type, data, generateQR } = req.body;

    let animalType;
    if (mongoose.Types.ObjectId.isValid(type)) {
      animalType = await AnimalType.findById(type);
    } else {
      animalType = await AnimalType.findOne({ name: { $regex: new RegExp(type, 'i') } });
    }
    if (!animalType) return res.status(400).json({ message: 'Invalid animal type' });

    const qrCode = generateQR ? uuidv4() : undefined;

    // -------------------
    // Auto-generate AnimalID
    const lastAnimal = await Animal.find({ type: animalType._id })
      .sort({ createdAt: -1 })
      .limit(1);

    let nextNumber = 1;
    if (lastAnimal.length > 0 && lastAnimal[0].animalId) {
      const lastIdParts = lastAnimal[0].animalId.split('-');
      nextNumber = parseInt(lastIdParts[2]) + 1;
    }

    const animalId = `MO-${animalType.typeId}-${String(nextNumber).padStart(3, '0')}`;
    // -------------------

    const animal = new Animal({ type: animalType._id, data, qrCode, animalId });
    await animal.save();

    res.status(201).json(animal);
  } catch (error) {
    console.error('Create animal error:', error);
    res.status(400).json({ message: error.message });
  }
};

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
    
    const animals = await Animal.find(query).populate('type');
    res.json(animals);
  } catch (error) {
    console.error('Get animals error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single animal
export const getAnimal = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id).populate('type');
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
    const { data, generateQR } = req.body;
    const qrCodeUpdate = generateQR ? uuidv4() : undefined;

    const updatedAnimal = await Animal.findByIdAndUpdate(
      req.params.id,
      {
        data,
        ...(qrCodeUpdate && { qrCode: qrCodeUpdate }),
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate('type');

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
    const deletedAnimal = await Animal.findByIdAndDelete(req.params.id);
    if (!deletedAnimal) return res.status(404).json({ message: 'Animal not found' });
    res.json({ message: 'Animal deleted successfully' });
  } catch (error) {
    console.error('Delete animal error:', error);
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
// -------------------------
// Health Info CRUD
// -------------------------

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
