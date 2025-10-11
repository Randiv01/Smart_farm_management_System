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
  deleteAnimalsByType,
  deleteAnimalTypeCompletely,
  moveAnimalToZone,
  getAnimalsByBatch,
  updateBatchAnimals,
  getAnimalByQRCode
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

// Type-based deletion routes
router.delete('/type/:animalTypeId', deleteAnimalsByType);
router.delete('/type/:animalTypeId/complete', deleteAnimalTypeCompletely);

// Health info routes
router.get('/:id/health', getAnimalHealth);
router.patch('/:id/health', updateAnimalHealth);

// Medical request routes
router.post('/:id/medical-request', sendMedicalRequest);
router.get('/test/email', testEmail); // Add test endpoint

// QR Code routes
router.get('/qr/:qrCode', getAnimalByQRCode);

export const animalRouter = router;