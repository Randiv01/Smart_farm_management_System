// productRouter.js
import express from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getExpiringProducts,
  updateAllStatuses,
  getCatalogProducts,
  refillProduct,
  addReviewToProduct
} from "../Icontrollers/productController.js";

const router = express.Router();

// Inventory management routes (for admin)
router.get("/", getProducts); // Gets all products with full details
router.get("/low-stock", getLowStockProducts);
router.get("/expiring", getExpiringProducts);
router.get("/:id", getProduct);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.patch("/update-statuses", updateAllStatuses);
router.patch("/refill/:id", refillProduct); // Add refill route

// Catalog routes (for customers)
router.get("/catalog/products", getCatalogProducts); // Gets products for catalog view
router.post("/catalog/products/:id/reviews", addReviewToProduct); // Add review to product

export default router;