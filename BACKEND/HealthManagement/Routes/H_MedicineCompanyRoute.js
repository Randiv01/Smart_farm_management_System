// BACKEND/HealthManagement/Routes/H_MedicineCompanyRoute.js
import express from "express";
import {
  addCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "../Controllers/H_MedicineCompanyController.js";

const router = express.Router();

router.get("/", getAllCompanies);
router.get("/:id", getCompanyById);
router.post("/", addCompany);
router.put("/:id", updateCompany);
router.delete("/:id", deleteCompany);

export default router;
