import express from "express";
import {
  createOrder,
  getOrders,
  getCustomerOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  sendOrderNotification,
  deleteOrder
} from "../Icontrollers/orderController.js";

const router = express.Router();

// Order routes
router.post("/", createOrder);
router.get("/", getOrders);
router.get("/stats", getOrderStats);
router.get("/customer/:email", getCustomerOrders);
router.get("/:id", getOrder);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/cancel", cancelOrder);
router.post("/:id/notify", sendOrderNotification);
router.delete("/:id", deleteOrder);

export default router;