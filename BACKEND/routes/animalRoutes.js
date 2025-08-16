import express from 'express';
import { 
  createAnimal, 
  getAnimals, 
  getAnimal, 
  updateAnimal, 
  deleteAnimal, 
  getAnimalCount,
  getAnimalHealth,         // ✅ add this
  updateAnimalHealth       // ✅ add this
} from '../controllers/animalController.js';


const router = express.Router();

router.post('/', createAnimal);
router.get('/', getAnimals);
router.get('/count', getAnimalCount);
router.get('/:id', getAnimal);
router.put('/:id', updateAnimal);
router.delete('/:id', deleteAnimal);
// Health Info routes
router.get('/:id/health', getAnimalHealth);       // fetch health info fields + data
router.put('/:id/health', updateAnimalHealth);    // update only health info


export { router as animalRouter };