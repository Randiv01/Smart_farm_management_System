import express from "express";
import multer from "multer";
import { getAll, create, update, del } from "../Controllers/H_PlantPathologistController.js";

const router = express.Router();
const upload = multer({ dest: "HealthManagement/Health_uploads/" });

router.get("/", getAll);
router.post("/", upload.single("profilePhoto"), create);
router.put("/:id", upload.single("profilePhoto"), update);
router.delete("/:id", del);

export default router;
