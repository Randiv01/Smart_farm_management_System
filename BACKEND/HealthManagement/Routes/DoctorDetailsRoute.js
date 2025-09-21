import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} from "../Controllers/DoctorDetailsController.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Health uploads directory: backend/HealthManagement/Health_uploads
const uploadDir = path.join(__dirname, "..", "Health_uploads");

// Ensure uploads dir exists
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PNG, JPEG, JPG images are allowed"), false);
};

const upload = multer({ storage, fileFilter });

router.post("/", upload.single("profilePhoto"), createDoctor);
router.get("/", getDoctors);
router.get("/:id", getDoctorById);
router.put("/:id", upload.single("profilePhoto"), updateDoctor);
router.delete("/:id", deleteDoctor);

export default router;