import express from "express";
import {
  createOrderFromPayment,
  getOrders,
  getCustomerOrders,
  getOrder,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getOrderStats,
  sendOrderNotification,
  deleteOrder,
  processPayment
} from "../Icontrollers/orderController.js";

const router = express.Router();

// Order routes
router.post("/", createOrderFromPayment);
router.post("/payment", processPayment);
router.get("/", getOrders);
router.get("/stats", getOrderStats);
router.get("/customer/:email", getCustomerOrders);
router.get("/:id", getOrder);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/payment-status", updatePaymentStatus);
router.patch("/:id/cancel", cancelOrder);
router.post("/:id/notify", sendOrderNotification);
router.delete("/:id", deleteOrder);

export default router;