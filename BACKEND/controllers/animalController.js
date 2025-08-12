import Animal from "../models/Animal.js";

// Get all animals of a specific type
export const getAnimalsByType = async (req, res) => {
  try {
    const animals = await Animal.find({ type: req.params.type });
    res.json(animals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new animal
export const addAnimal = async (req, res) => {
  try {
    const animal = new Animal({
      ...req.body,
      type: req.params.type
    });
    await animal.save();
    res.status(201).json(animal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete an animal
export const deleteAnimal = async (req, res) => {
  try {
    await Animal.findByIdAndDelete(req.params.id);
    res.json({ message: "Animal deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};