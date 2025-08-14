import express from "express";
import { addAnimalType, getAnimalTypes } from "../controllers/animalController.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Routes
router.get("/", getAnimalTypes);
router.post("/", upload.single("bannerImage"), addAnimalType);

export default router;
