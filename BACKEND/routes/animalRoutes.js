import express from 'express';
import {
  createAnimal,
  getAnimals,
  getAnimal,
  updateAnimal,
  deleteAnimal,
  getAnimalCount,
  getAnimalHealth,
  updateAnimalHealth,
  createBatchAnimals,
  deleteBatchAnimals,
  moveAnimalToZone
} from '../controllers/animalController.js';

const router = express.Router();

router.post('/', createAnimal);
router.post('/batch', createBatchAnimals); // New route for batch creation
router.get('/', getAnimals);
router.get('/count', getAnimalCount);
router.get('/:id', getAnimal);
router.put('/:id', updateAnimal);
router.delete('/:id', deleteAnimal);
router.delete('/batch/:batchId', deleteBatchAnimals); // New route for batch deletion
router.patch('/:animalId/move-zone', moveAnimalToZone); // New route for moving animals

// Health info routes
router.get('/:id/health', getAnimalHealth);
router.patch('/:id/health', updateAnimalHealth);

export const animalRouter = router;
