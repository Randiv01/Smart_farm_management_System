import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  getAllTreatments,
  getTreatmentById,
  getTreatmentsByAnimalCode,
  getTreatmentsByDoctor,
  createTreatment,
  updateTreatment,
  deleteTreatment,
  bulkDeleteTreatments,
  getTreatmentStats,
} from "../Controllers/DoctorTreatmentControl.js";

const router = express.Router();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure Health_uploads directory exists
const uploadsDir = path.join(__dirname, "../Health_uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 Created directory: ${uploadsDir}`);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, extension);
    cb(null, `treatment-${uniqueSuffix}-${nameWithoutExt}${extension}`);
  },
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/gif",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, PNG, JPG, JPEG, and GIF files are allowed."
      ),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file per request
  },
});

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum size is 5MB.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Only one file is allowed.",
      });
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

// Statistics route (must be before /:id route)
router.get("/stats", getTreatmentStats);

// Get all treatments with filtering, pagination, and sorting
router.get("/", getAllTreatments);

// Get treatments by animal code
router.get("/animal/:animalCode", getTreatmentsByAnimalCode);

// Get treatments by doctor
router.get("/doctor/:doctorId", getTreatmentsByDoctor);

// Get single treatment by ID
router.get("/:id", getTreatmentById);

// Create new treatment record
router.post(
  "/",
  upload.single("reports"),
  handleMulterError,
  createTreatment
);

// Update treatment record
router.put(
  "/:id",
  upload.single("reports"),
  handleMulterError,
  updateTreatment
);

// Delete single treatment record
router.delete("/:id", deleteTreatment);

// Bulk delete treatment records
router.delete("/", bulkDeleteTreatments);

// Error handling middleware specific to this router
router.use((error, req, res, next) => {
  console.error("Treatment routes error:", error);
  
  // Clean up uploaded file if there was an error
  if (req.file) {
    try {
      fs.unlinkSync(req.file.path);
      console.log(`Cleaned up file: ${req.file.path}`);
    } catch (cleanupError) {
      console.error("Error cleaning up file:", cleanupError);
    }
  }

  res.status(500).json({
    success: false,
    message: "An error occurred processing your request",
    error: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
  });
});

export default router;