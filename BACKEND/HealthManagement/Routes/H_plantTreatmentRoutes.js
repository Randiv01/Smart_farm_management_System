import express from "express";
import multer from "multer";
import path from "path";
import {
  createTreatment,
  getAllTreatments,
  getTreatmentById,
  updateTreatment,
  deleteTreatment,
} from "../Controllers/H_plantTreatmentController.js";

const router = express.Router();

// multer storage (uploads folder at project root)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.post("/", upload.single("reports"), createTreatment);
router.get("/", getAllTreatments);
router.get("/:id", getTreatmentById);
router.put("/:id", upload.single("reports"), updateTreatment);
router.delete("/:id", deleteTreatment);

export default router;