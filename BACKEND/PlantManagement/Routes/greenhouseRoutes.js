import express from 'express';
import { saveGreenhouseData, getAllGreenhouses } from '../Controllers/greenhouseController.js';

const router = express.Router();

router.post('/', saveGreenhouseData);
router.get('/', getAllGreenhouses);

export default router;
