import express from 'express';
import { 
  createAnimal, 
  getAnimals, 
  getAnimal, 
  updateAnimal, 
  deleteAnimal, 
  getAnimalCount 
} from '../controllers/animalController.js';

const router = express.Router();

router.post('/', createAnimal);
router.get('/', getAnimals);
router.get('/count', getAnimalCount);
router.get('/:id', getAnimal);
router.put('/:id', updateAnimal);
router.delete('/:id', deleteAnimal);

export { router as animalRouter };