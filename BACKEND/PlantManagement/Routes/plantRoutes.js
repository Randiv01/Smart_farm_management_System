import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Plant from '../models/plantModel.js';
import fs from 'fs';

const router = express.Router();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ----------------- Multer Setup -----------------
const uploadsDir = path.join(__dirname, '../uploads'); // lowercase 'uploads'
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error('Only images are allowed'));
};
const upload = multer({ storage, fileFilter });

// Helper to get full URL
const getFullUrl = (req, filePath) => `${req.protocol}://${req.get('host')}${filePath}`;

// ----------------- Routes -----------------

// GET all plants
router.get('/', async (req, res) => {
  try {
    const plants = await Plant.find().lean().maxTimeMS(10000);

    // Add full URL to image if exists
    const plantsWithFullUrl = plants.map(p => ({
      ...p,
      imageUrl: p.imageUrl ? getFullUrl(req, p.imageUrl) : null
    }));

    res.json(plantsWithFullUrl);
  } catch (err) {
    console.error('Error fetching plants:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching plants', error: err.message });
  }
});

// GET single plant
router.get('/:id', async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id).lean().maxTimeMS(10000);
    if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });

    if (plant.imageUrl) plant.imageUrl = getFullUrl(req, plant.imageUrl);
    res.json(plant);
  } catch (err) {
    console.error('Error fetching plant:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching plant', error: err.message });
  }
});

// ADD new plant
router.post('/add', upload.single('plantImage'), async (req, res) => {
  try {
    const plantData = {
      ...req.body,
      imageUrl: req.file ? `/plant-uploads/${req.file.filename}` : undefined
    };

    const plant = new Plant(plantData);
    await plant.save();

    // Return full URL
    const plantResponse = plant.toObject();
    if (plantResponse.imageUrl) plantResponse.imageUrl = getFullUrl(req, plantResponse.imageUrl);

    res.status(201).json({ success: true, message: 'Plant added successfully', plant: plantResponse });
  } catch (err) {
    console.error('Error saving plant:', err.message);
    res.status(500).json({ success: false, message: 'Error saving plant', error: err.message });
  }
});

// UPDATE plant
router.put('/:id', upload.single('plantImage'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    // FIX: Use consistent path format with plant-uploads
    if (req.file) updateData.imageUrl = `/plant-uploads/${req.file.filename}`;

    const plant = await Plant.findByIdAndUpdate(req.params.id, updateData, { new: true, maxTimeMS: 10000 });
    if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });

    const plantResponse = plant.toObject();
    if (plantResponse.imageUrl) plantResponse.imageUrl = getFullUrl(req, plantResponse.imageUrl);

    res.json({ success: true, message: 'Plant updated successfully', plant: plantResponse });
  } catch (err) {
    console.error('Error updating plant:', err.message);
    res.status(500).json({ success: false, message: 'Error updating plant', error: err.message });
  }
});

// DELETE plant - FIXED: Corrected image path deletion
router.delete('/:id', async (req, res) => {
  try {
    const plant = await Plant.findByIdAndDelete(req.params.id);
    if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });

    // Delete image file if it exists - FIXED: Correct path handling
    if (plant.imageUrl) {
      // Remove leading slash if present to create proper path
      const imageFilename = plant.imageUrl.startsWith('/') ? plant.imageUrl.substring(1) : plant.imageUrl;
      const imagePath = path.join(__dirname, '..', imageFilename);
      
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error('❌ Failed to delete image:', err.message);
          // Don't fail the request if image deletion fails
        } else {
          console.log('🗑️ Image deleted:', imagePath);
        }
      });
    }

    res.json({ success: true, message: 'Plant and image deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting plant:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting plant', error: err.message });
  }
});

export default router;