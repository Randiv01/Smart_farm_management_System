import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getAllPests,
  getPestById,
  createPest,
  updatePest,
  deletePest,
  getPestStatsEndpoint,
  generatePestPDF,
  getPestsByGreenhouse
} from '../Controllers/pestController.js';

const router = express.Router();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'Uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 Created directory: ${uploadsDir}`);
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `pest-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Routes

// GET /api/pests - Get all pest records
router.get('/', getAllPests);

// GET /api/pests/stats - Get pest statistics for charts
router.get('/stats', getPestStatsEndpoint);

// GET /api/pests/greenhouse/:greenhouseNo - Get pests by greenhouse
router.get('/greenhouse/:greenhouseNo', getPestsByGreenhouse);

// GET /api/pests/:id - Get specific pest record
router.get('/:id', getPestById);

// POST /api/pests - Create new pest record
router.post('/', upload.single('image'), createPest);

// PUT /api/pests/:id - Update pest record
router.put('/:id', upload.single('image'), updatePest);

// DELETE /api/pests/:id - Delete pest record
router.delete('/:id', deletePest);

// GET /api/pests/:id/pdf - Generate PDF report for specific pest
router.get('/:id/pdf', generatePestPDF);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed (jpeg, jpg, png, gif, webp)') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
});

export default router;