import express from "express";
import multer from "multer";
import { getAll, getOne, create, update, del } from "../Controllers/H_PlantPathologistController.js";

const router = express.Router();

// Make sure this folder exists
const upload = multer({ dest: "HealthManagement/Health_uploads/" });

router.get("/", getAll);
router.get("/:id", getOne); // required for edit flow
router.post("/", upload.single("profilePhoto"), create);
router.put("/:id", upload.single("profilePhoto"), update);
router.delete("/:id", del);

export default router;