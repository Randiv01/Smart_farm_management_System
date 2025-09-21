import express from 'express';
import {
  getAllConsultations,
  getConsultationById,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  generateConsultationPDF,
  generateCombinedReport,
  getConsultationsBySpecialist
} from '../Controllers/consultationController.js';

const router = express.Router();

// Routes

// GET /api/consultations - Get all consultation records
router.get('/', getAllConsultations);

// GET /api/consultations/specialist/:specialistName - Get consultations by specialist
router.get('/specialist/:specialistName', getConsultationsBySpecialist);

// GET /api/consultations/reports/combined - Generate combined report (pest + consultation)
router.get('/reports/combined', generateCombinedReport);

// GET /api/consultations/:id - Get specific consultation record
router.get('/:id', getConsultationById);

// POST /api/consultations - Create new consultation (assign specialist)
router.post('/', createConsultation);

// PUT /api/consultations/:id - Update consultation record
router.put('/:id', updateConsultation);

// DELETE /api/consultations/:id - Delete consultation record
router.delete('/:id', deleteConsultation);

// GET /api/consultations/:id/pdf - Generate PDF report for specific consultation
router.get('/:id/pdf', generateConsultationPDF);

export default router;