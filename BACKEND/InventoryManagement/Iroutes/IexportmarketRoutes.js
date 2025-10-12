import express from 'express';
const router = express.Router();
import {
  getAllExportMarkets,
  getExportMarket,
  createExportMarket,
  updateExportMarket,
  deleteExportMarket
} from '../Icontrollers/IexportmarketController.js';

// Routes for export market operations
router.get('/', getAllExportMarkets);
router.get('/:id', getExportMarket);
router.post('/', createExportMarket);
router.put('/:id', updateExportMarket);
router.delete('/:id', deleteExportMarket);

export default router;