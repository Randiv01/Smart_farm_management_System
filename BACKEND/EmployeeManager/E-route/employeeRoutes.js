import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  getEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  generatePDF,
  getNextEmployeeId,
  getEmployeesByTitle,
} from "../E-control/employeeController.js"; // note `.js` extension

const router = express.Router();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer storage - use absolute path to EmployeeManager/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsPath = path.join(__dirname, "..", "uploads");
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Routes - specific routes first, then parameterized routes
router.get("/", getEmployees);
router.get("/get-next-id", getNextEmployeeId);
router.get("/by-title/:title", getEmployeesByTitle);
router.post("/", upload.fields([{ name: "photo" }, { name: "cv" }]), addEmployee);
router.get("/:id/pdf", generatePDF);
router.get("/:id", getEmployeeById);
router.put("/:id", upload.fields([{ name: "photo" }, { name: "cv" }]), updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;   // ✅ default export
