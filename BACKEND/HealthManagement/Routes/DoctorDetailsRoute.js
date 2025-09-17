import express from "express";
import multer from "multer";
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} from "../Controllers/DoctorDetailsController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, "uploads/"); },
  filename: (req, file, cb) => { cb(null, Date.now() + "-" + file.originalname); }
});
const upload = multer({ storage });

router.post("/", upload.single("profilePhoto"), createDoctor);
router.get("/", getDoctors);
router.get("/:id", getDoctorById);
router.put("/:id", upload.single("profilePhoto"), updateDoctor);
router.delete("/:id", deleteDoctor);

export default router;
