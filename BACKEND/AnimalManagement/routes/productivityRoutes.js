import express from 'express';
import {
  createProductivityRecord,
  getAnimalProductivity,
  getBatchProductivity,
  getProductivitySummary,
  updateProductivityRecord,
  deleteProductivityRecord,
  getProductivityTrends,
  getProductivityAnalytics,
  getAllProductivityRecords,
  getProductivityTotals // Added import
} from '../controllers/productivityController.js';

const router = express.Router();

// Create a new productivity record
router.post('/', createProductivityRecord);

// Get productivity records for a specific animal
router.get('/animal/:animalId', getAnimalProductivity);

// Get productivity records for a batch
router.get('/batch/:batchId', getBatchProductivity);

// Get productivity summary for dashboard
router.get('/summary', getProductivitySummary);

// Get productivity analytics for dashboard
router.get('/analytics', getProductivityAnalytics);

// Get productivity trends over time
router.get('/trends', getProductivityTrends);

// Get productivity totals for different time periods
router.get('/totals', getProductivityTotals);

// Update a productivity record
router.put('/:id', updateProductivityRecord);

// Delete a productivity record
router.delete('/:id', deleteProductivityRecord);

// GET ALL PRODUCTIVITY RECORDS FOR THE MAIN DASHBOARD
router.get('/', getAllProductivityRecords); 

export default router;