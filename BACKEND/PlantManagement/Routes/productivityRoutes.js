// BACKEND/PlantManagement/Routes/productivityRoutes.js
import express from 'express';
import {
  getAllRecords,
  addRecord,
  updateRecord,
  deleteRecord
} from '../Controllers/productivityController.js';

const router = express.Router();

router.get('/', getAllRecords);
router.post('/', addRecord);
router.put('/:id', updateRecord);
router.delete('/:id', deleteRecord);

export default router;
