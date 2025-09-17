import express from "express";
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  rateSupplier,
  getSuppliersByType,
  getTopRatedSuppliers,
  searchSuppliers
} from "../Icontrollers/IsupplierController.js";

const router = express.Router();

// Supplier management routes
router.get("/", getSuppliers); // Gets all suppliers with optional filtering
router.get("/top-rated", getTopRatedSuppliers); // Gets top rated suppliers
router.get("/search", searchSuppliers); // Search suppliers
router.get("/type/:type", getSuppliersByType); // Gets suppliers by type
router.get("/:id", getSupplier); // Get single supplier
router.post("/", createSupplier); // Create new supplier
router.put("/:id", updateSupplier); // Update supplier
router.delete("/:id", deleteSupplier); // Delete supplier
router.patch("/rate/:id", rateSupplier); // Rate supplier

export default router;