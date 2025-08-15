import AnimalType from '../models/AnimalType.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create new animal type
export const createAnimalType = async (req, res) => {
  try {
    console.log('Request received:', {
      body: req.body,
      file: req.file,
      headers: req.headers
    });

    // Handle form-data
    const { name, categories } = req.body;
    
    // Validate required fields
    if (!name || !categories) {
      return res.status(400).json({
        message: "Name and categories are required",
        received: { name, categories }
      });
    }

    // Parse categories
    let parsedCategories;
    try {
      parsedCategories = JSON.parse(categories);
    } catch (e) {
      return res.status(400).json({
        message: "Invalid categories format",
        error: e.message,
        receivedCategories: categories
      });
    }

    // Handle file upload
    let bannerImage;
    if (req.file) {
      bannerImage = `/uploads/${req.file.filename}`;
    }

    const animalType = new AnimalType({
      name: name.toLowerCase(),
      bannerImage,
      categories: parsedCategories
    });

    await animalType.save();
    res.status(201).json(animalType);
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all animal types
export const getAllAnimalTypes = async (req, res) => {
  try {
    const animalTypes = await AnimalType.find();
    res.json(animalTypes);
  } catch (error) {
    console.error("Error fetching animal types:", error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get animal type by ID or name
export const getAnimalTypeByIdOrName = async (req, res) => {
  try {
    const { identifier } = req.params;
    let animalType;

    // Check if identifier is a valid MongoDB ID
    if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
      animalType = await AnimalType.findById(identifier);
    } else {
      // Search by name (case insensitive)
      animalType = await AnimalType.findOne({ 
        name: { $regex: new RegExp(`^${identifier}$`, 'i') } 
      });
    }

    if (!animalType) {
      return res.status(404).json({ message: 'Animal type not found' });
    }

    res.json(animalType);
  } catch (error) {
    console.error("Error fetching animal type:", error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update animal type
export const updateAnimalType = async (req, res) => {
  try {
    const { name, categories } = req.body;
    
    // Parse categories if it's a string
    let parsedCategories;
    if (categories && typeof categories === 'string') {
      try {
        parsedCategories = JSON.parse(categories);
      } catch (parseError) {
        return res.status(400).json({ 
          message: "Invalid categories format",
          error: parseError.message
        });
      }
    }

    const updateData = { 
      name: name ? name.toLowerCase() : undefined,
      categories: parsedCategories || categories
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

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedType = await AnimalType.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    
    if (!updatedType) {
      return res.status(404).json({ message: 'Animal type not found' });
    }
    
    res.json(updatedType);
  } catch (error) {
    console.error("Error updating animal type:", error);
    res.status(400).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete animal type
export const deleteAnimalType = async (req, res) => {
  try {
    const animalType = await AnimalType.findById(req.params.id);
    if (!animalType) {
      return res.status(404).json({ message: 'Animal type not found' });
    }

    // Delete banner image if exists
    if (animalType.bannerImage) {
      const filePath = path.join(__dirname, '..', animalType.bannerImage);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await animalType.deleteOne();
    res.json({ message: 'Animal type deleted successfully' });
  } catch (error) {
    console.error("Error deleting animal type:", error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};