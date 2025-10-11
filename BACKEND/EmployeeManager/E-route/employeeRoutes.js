import express from "express";
import multer from "multer";
import path from "path";
import {
  getEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  generatePDF,
  getNextEmployeeId,
} from "../E-control/employeeController.js"; // note `.js` extension

const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Routes - specific routes first, then parameterized routes
router.get("/", getEmployees);
router.get("/get-next-id", getNextEmployeeId);
router.post("/", upload.fields([{ name: "photo" }, { name: "cv" }]), addEmployee);
router.get("/:id/pdf", generatePDF);
router.get("/:id", getEmployeeById);
router.put("/:id", upload.fields([{ name: "photo" }, { name: "cv" }]), updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;   // ✅ default export
