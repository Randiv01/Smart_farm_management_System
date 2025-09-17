import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Plant from '../models/plantModel.js'; // Direct import

const router = express.Router();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ----------------- Multer Setup -----------------
const uploadsDir = path.join(__dirname, '../Uploads');
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

// ----------------- Routes -----------------

// GET all plants
router.get('/', async (req, res) => {
  try {
    console.log('🌱 Fetching all plants...');
    const plants = await Plant.find().lean().maxTimeMS(10000);
    console.log(`✅ Successfully fetched ${plants.length} plants`);
    res.json(plants);
  } catch (err) {
    console.error('❌ Error fetching plants:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching plants', error: err.message });
  }
});

// GET single plant
router.get('/:id', async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id).lean().maxTimeMS(10000);
    if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });
    res.json(plant);
  } catch (err) {
    console.error('❌ Error fetching plant:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching plant', error: err.message });
  }
});

// ADD new plant
router.post('/add', upload.single('plantImage'), async (req, res) => {
  try {
    const plantData = {
      ...req.body,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined
    };
    const plant = new Plant(plantData);
    await plant.save();
    res.status(201).json({ success: true, message: 'Plant added successfully', plant });
  } catch (err) {
    console.error('❌ Error saving plant:', err.message);
    res.status(500).json({ success: false, message: 'Error saving plant', error: err.message });
  }
});

// UPDATE plant
router.put('/:id', upload.single('plantImage'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;

    const plant = await Plant.findByIdAndUpdate(req.params.id, updateData, { new: true, maxTimeMS: 10000 });
    if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });

    res.json({ success: true, message: 'Plant updated successfully', plant });
  } catch (err) {
    console.error('❌ Error updating plant:', err.message);
    res.status(500).json({ success: false, message: 'Error updating plant', error: err.message });
  }
});

// DELETE plant
router.delete('/:id', async (req, res) => {
  try {
    const plant = await Plant.findByIdAndDelete(req.params.id, { maxTimeMS: 10000 });
    if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });

    res.json({ success: true, message: 'Plant deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting plant:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting plant', error: err.message });
  }
});

export default router;
