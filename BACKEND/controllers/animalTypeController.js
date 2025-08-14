import AnimalType from '../models/AnimalType.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create
export const createAnimalType = async (req, res) => {
  try {
    const { name, categories } = req.body;
    if (!name || !categories) return res.status(400).json({ message: "Name and categories are required" });

    let bannerImage;
    if (req.file) bannerImage = `/uploads/${req.file.filename}`;

    const animalType = new AnimalType({ name, bannerImage, categories: JSON.parse(categories) });
    await animalType.save();
    res.status(201).json(animalType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all
export const getAllAnimalTypes = async (req, res) => {
  try {
    const animalTypes = await AnimalType.find();
    res.json(animalTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single
export const getAnimalType = async (req, res) => {
  try {
    const animalType = await AnimalType.findById(req.params.id);
    if (!animalType) return res.status(404).json({ message: 'Not found' });
    res.json(animalType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update (name + banner image)
export const updateAnimalType = async (req, res) => {
  try {
    const { name, categories } = req.body;
    const updateData = { 
      name, 
      categories: categories ? JSON.parse(categories) : [] 
    };

    if (req.file) {
      // Delete old image if exists
      const animalType = await AnimalType.findById(req.params.id);
      if (animalType?.bannerImage) {
        const oldImagePath = path.join(__dirname, '..', animalType.bannerImage);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      updateData.bannerImage = `/uploads/${req.file.filename}`;
    }

    const updatedType = await AnimalType.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedType) return res.status(404).json({ message: 'Not found' });
    res.json(updatedType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete (also delete banner image)
export const deleteAnimalType = async (req, res) => {
  try {
    const animalType = await AnimalType.findById(req.params.id);
    if (!animalType) return res.status(404).json({ message: 'Not found' });

    // Delete banner image if exists
    if (animalType.bannerImage) {
      const filePath = path.join(__dirname, '..', animalType.bannerImage);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await animalType.deleteOne();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

