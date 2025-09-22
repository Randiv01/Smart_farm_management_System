import express from 'express';
import { 
  createAnimalType, 
  getAllAnimalTypes, 
  getAnimalTypeByIdOrName,
  updateAnimalType, 
  deleteAnimalType 
} from '../controllers/animalTypeController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../Uploads'); // Points to BACKEND/AnimalManagement/Uploads
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

router.post('/', upload.single('bannerImage'), createAnimalType);
router.get('/', getAllAnimalTypes);
router.get('/:identifier', getAnimalTypeByIdOrName);
router.put('/:id', upload.single('bannerImage'), updateAnimalType);
router.delete('/:id', deleteAnimalType);

export { router as animalTypeRouter };