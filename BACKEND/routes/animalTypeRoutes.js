import express from 'express';
import { 
  createAnimalType, 
  getAllAnimalTypes, 
  getAnimalTypeByIdOrName,
  updateAnimalType, 
  deleteAnimalType 
} from '../controllers/animalTypeController.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/', upload.single('bannerImage'), createAnimalType);
router.get('/', getAllAnimalTypes);
router.get('/:identifier', getAnimalTypeByIdOrName);
router.put('/:id', upload.single('bannerImage'), updateAnimalType);
router.delete('/:id', deleteAnimalType);

export { router as animalTypeRouter };