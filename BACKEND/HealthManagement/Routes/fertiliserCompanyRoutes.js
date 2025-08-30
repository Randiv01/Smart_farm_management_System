// BACKEND/HealthManagement/Routes/fertiliserCompanyRoutes.js
import express from "express";
import {
  getAllCompanies,
  addCompany,
  updateCompany,
  deleteCompany,
} from "../Controllers/FertiliserCompanyController.js";

const router = express.Router();

router.get("/", getAllCompanies);
router.post("/", addCompany);
router.put("/:id", updateCompany);
router.delete("/:id", deleteCompany);

export default router;
