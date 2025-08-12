import express from 'express';
import upload from '../config/upload.js';
import { uploadImage } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/', upload, uploadImage);

export default router;