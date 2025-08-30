// BACKEND/HealthManagement/Routes/HealthSpecialistRoute.js
import express from "express";
import multer from "multer";
import {
  addSpecialist,
  getAllSpecialists,
  getById,
  updateSpecialist,
  deleteSpecialist,
} from "../Controllers/HealthSpecialistController.js";

const router = express.Router();
const upload = multer({ dest: "HealthManagement/Health_uploads/" });

router.get("/", getAllSpecialists);
router.get("/:id", getById);
router.post("/", upload.single("profilePhoto"), addSpecialist);
router.put("/:id", upload.single("profilePhoto"), updateSpecialist);
router.delete("/:id", deleteSpecialist);

export default router;
