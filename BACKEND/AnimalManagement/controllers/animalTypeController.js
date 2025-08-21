import AnimalType from '../models/AnimalType.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create new animal type with auto-generated TypeID
export const createAnimalType = async (req, res) => {
  try {
    const { name, managementType, caretakers, categories, caretakerName } = req.body;

    if (!name || !categories) {
      return res.status(400).json({ 
        message: "Name and categories are required", 
        received: { name, categories } 
      });
    }

    // Parse categories and caretakers if they're strings
    let parsedCategories;
    let parsedCaretakers = [];

    try {
      parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : categories;
      
      // Validate fields & add default options for select type
      parsedCategories.forEach(category => {
        category.fields.forEach(field => {
          if (!field.name || !field.label) throw new Error("Each field must have a name and label");
          if (field.type === 'select' && (!field.options || !Array.isArray(field.options))) {
            field.options = [];
          }
        });
      });

      // Parse caretakers if provided
      if (caretakers) {
        parsedCaretakers = typeof caretakers === 'string' ? JSON.parse(caretakers) : caretakers;
      }

    } catch (e) {
      return res.status(400).json({ 
        message: "Invalid data format", 
        error: e.message 
      });
    }

    // Handle file upload
    let bannerImage;
    if (req.file) {
      bannerImage = `/uploads/${req.file.filename}`;
    }

    // Auto-generate TypeID
    const lastType = await AnimalType.findOne().sort({ typeId: -1 });
    let nextNumber = 1;
    if (lastType?.typeId) {
      nextNumber = parseInt(lastType.typeId.split('-')[1]) + 1;
    }
    const typeId = `T-${String(nextNumber).padStart(3, '0')}`;

    const animalType = new AnimalType({
      name: name.toLowerCase(),
      typeId,
      managementType: managementType || 'individual',
      bannerImage,
      categories: parsedCategories,
      caretakers: parsedCaretakers,
      caretakerName: caretakerName || ''
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
    const animalTypes = await AnimalType.find().select('-__v');
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

    if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
      animalType = await AnimalType.findById(identifier).select('-__v');
    } else {
      animalType = await AnimalType.findOne({ 
        name: { $regex: new RegExp(`^${identifier}$`, 'i') } 
      }).select('-__v');
    }

    if (!animalType) return res.status(404).json({ message: 'Animal type not found' });
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
    const { name, managementType, caretakers, categories, caretakerName } = req.body;
    
    let parsedCategories;
    let parsedCaretakers;
    
    if (categories && typeof categories === 'string') {
      try {
        parsedCategories = JSON.parse(categories);
        parsedCategories.forEach(category => {
          category.fields.forEach(field => {
            if (!field.name || !field.label) throw new Error("Each field must have a name and label");
            if (field.type === 'select' && (!field.options || !Array.isArray(field.options))) {
              field.options = [];
            }
          });
        });
      } catch (parseError) {
        return res.status(400).json({ 
          message: "Invalid categories format", 
          error: parseError.message 
        });
      }
    }

    if (caretakers && typeof caretakers === 'string') {
      try {
        parsedCaretakers = JSON.parse(caretakers);
      } catch (parseError) {
        return res.status(400).json({ 
          message: "Invalid caretakers format", 
          error: parseError.message 
        });
      }
    }

    const updateData = {
      name: name ? name.toLowerCase() : undefined,
      managementType,
      categories: parsedCategories || categories,
      caretakers: parsedCaretakers || caretakers,
      caretakerName: caretakerName !== undefined ? caretakerName : undefined
    };

    // Update banner image if uploaded
    if (req.file) {
      const animalType = await AnimalType.findById(req.params.id);
      if (animalType?.bannerImage) {
        const oldImagePath = path.join(__dirname, '..', animalType.bannerImage);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      updateData.bannerImage = `/uploads/${req.file.filename}`;
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const updatedType = await AnimalType.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!updatedType) return res.status(404).json({ message: 'Animal type not found' });
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
    if (!animalType) return res.status(404).json({ message: 'Animal type not found' });

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