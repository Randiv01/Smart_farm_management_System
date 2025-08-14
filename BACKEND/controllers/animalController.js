import Animal from '../models/Animal.js';
import AnimalType from '../models/AnimalType.js';

// Create new animal
export const createAnimal = async (req, res) => {
  try {
    const { type, data } = req.body;

    // Find AnimalType by ID or name
    let animalType;
    if (/^[0-9a-fA-F]{24}$/.test(type)) {
      animalType = await AnimalType.findById(type);
    } else {
      animalType = await AnimalType.findOne({ name: type.toLowerCase() });
    }

    if (!animalType) return res.status(400).json({ message: 'Invalid animal type' });

    const animal = new Animal({ type: animalType._id, data });
    await animal.save();
    res.status(201).json(animal);
  } catch (error) {
    console.error("Create animal error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get all animals (optionally filtered by type ID or name)
export const getAnimals = async (req, res) => {
  try {
    let query = {};
    if (req.query.type) {
      const typeParam = req.query.type;
      let typeDoc;

      if (/^[0-9a-fA-F]{24}$/.test(typeParam)) {
        typeDoc = await AnimalType.findById(typeParam);
      } else {
        typeDoc = await AnimalType.findOne({ name: typeParam.toLowerCase() });
      }

      if (!typeDoc) return res.status(404).json({ message: 'Animal type not found' });
      query.type = typeDoc._id;
    }

    const animals = await Animal.find(query).populate('type');
    res.json(animals);
  } catch (error) {
    console.error("Get animals error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get single animal by ID
export const getAnimal = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id).populate('type');
    if (!animal) return res.status(404).json({ message: 'Animal not found' });
    res.json(animal);
  } catch (error) {
    console.error("Get animal error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update animal by ID
export const updateAnimal = async (req, res) => {
  try {
    const { data } = req.body;
    const updatedAnimal = await Animal.findByIdAndUpdate(
      req.params.id,
      { data, updatedAt: Date.now() },
      { new: true }
    ).populate('type');

    if (!updatedAnimal) return res.status(404).json({ message: 'Animal not found' });
    res.json(updatedAnimal);
  } catch (error) {
    console.error("Update animal error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Delete animal by ID
export const deleteAnimal = async (req, res) => {
  try {
    const deletedAnimal = await Animal.findByIdAndDelete(req.params.id);
    if (!deletedAnimal) return res.status(404).json({ message: 'Animal not found' });
    res.json({ message: 'Animal deleted successfully' });
  } catch (error) {
    console.error("Delete animal error:", error);
    res.status(500).json({ message: error.message });
  }
};
