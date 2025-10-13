// H_animalTreatmentRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createAnimalTreatment,
  getAllAnimalTreatments,
  getAnimalTreatmentById,
  updateAnimalTreatment,
  updateAnimalTreatmentStatus,
  deleteAnimalTreatment
} from '../Controllers/H_animalTreatmentController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload directory exists
const animalReportsDir = path.join(process.cwd(), 'HealthManagement', 'Health_uploads', 'animal-reports');
import fs from 'fs';
if (!fs.existsSync(animalReportsDir)) {
  fs.mkdirSync(animalReportsDir, { recursive: true });
  console.log('Created animal reports directory:', animalReportsDir);
}

// Multer configuration for animal reports
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, animalReportsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, 'animal-report-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const allowedExt = ['.jpeg', '.jpg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG images and PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  next();
};

// Routes
router.get('/', getAllAnimalTreatments);
router.get('/:id', getAnimalTreatmentById);
router.post('/', upload.single('reports'), handleMulterError, createAnimalTreatment);
router.put('/:id', upload.single('reports'), handleMulterError, updateAnimalTreatment);
router.patch('/:id/status', updateAnimalTreatmentStatus); // NEW: Separate status update route
router.delete('/:id', deleteAnimalTreatment);

export default router;