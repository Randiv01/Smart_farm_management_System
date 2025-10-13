import express from "express";
import multer from "multer";
import path from "path";
import {
  addAnimalTreatment,
  getAnimalTreatments,
  getAnimalTreatmentById,
  updateAnimalTreatment,
  deleteAnimalTreatment,
  updateTreatmentStatus
} from "../Controllers/H_animalTreatmentController.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "HealthManagement", "Health_uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "treatment-report-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only images (JPEG, JPG, PNG) and PDF files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Routes
router.get("/", getAnimalTreatments);
router.get("/:id", getAnimalTreatmentById);
router.post("/", upload.single("reports"), addAnimalTreatment);
router.put("/:id", upload.single("reports"), updateAnimalTreatment);
router.delete("/:id", deleteAnimalTreatment);
router.patch("/:id/status", updateTreatmentStatus);

export default router;