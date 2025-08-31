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
  moveAnimalToZone,
  getAnimalsByBatch,
  updateBatchAnimals
} from '../controllers/animalController.js';
import { sendMedicalRequest, testEmail } from '../controllers/medicalRequestController.js';

const router = express.Router();

// Individual animal routes
router.post('/', createAnimal);
router.get('/', getAnimals);
router.get('/count', getAnimalCount);
router.get('/:id', getAnimal);
router.put('/:id', updateAnimal);
router.delete('/:id', deleteAnimal);
router.patch('/:animalId/move-zone', moveAnimalToZone);

// Batch/Group animal routes
router.post('/batch', createBatchAnimals);
router.post('/group', createBatchAnimals);
router.get('/batch/:batchId', getAnimalsByBatch);
router.put('/batch/:batchId', updateBatchAnimals);
router.delete('/batch/:batchId', deleteBatchAnimals);

// Health info routes
router.get('/:id/health', getAnimalHealth);
router.patch('/:id/health', updateAnimalHealth);

// Medical request routes
router.post('/:id/medical-request', sendMedicalRequest);
router.get('/test/email', testEmail); // Add test endpoint

export const animalRouter = router;