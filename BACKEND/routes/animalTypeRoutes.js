import express from 'express';
import { 
  createAnimalType, 
  getAllAnimalTypes, 
  getAnimalType, 
  updateAnimalType, 
  deleteAnimalType 
} from '../controllers/animalTypeController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/', upload.single('bannerImage'), createAnimalType);
router.get('/', getAllAnimalTypes);
router.get('/:id', getAnimalType);
router.put('/:id', upload.single('bannerImage'), updateAnimalType);
router.delete('/:id', deleteAnimalType);

export { router as animalTypeRouter };
