import express from 'express';
import {
  createProductivityRecord,
  getAnimalProductivity,
  getBatchProductivity,
  getProductivitySummary,
  updateProductivityRecord,
  deleteProductivityRecord,
  getProductivityTrends
} from '../controllers/productivityController.js';

const router = express.Router();

// Create productivity record
router.post('/', createProductivityRecord);

// Get animal productivity records
router.get('/animal/:animalId', getAnimalProductivity);

// Get batch productivity records
router.get('/batch/:batchId', getBatchProductivity);

// Get productivity summary
router.get('/summary', getProductivitySummary);

// Get productivity trends
router.get('/trends', getProductivityTrends);

// Update productivity record
router.put('/:id', updateProductivityRecord);

// Delete productivity record
router.delete('/:id', deleteProductivityRecord);

export default router;