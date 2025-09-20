// routes/orders.js
import express from "express";
import Order from "../models/Order.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @desc Create new order (customer)
router.post("/", protect, async (req, res) => {
  try {
    const order = await Order.create({
      user: req.user._id,
      orderItems: req.body.orderItems,
      totalPrice: req.body.totalPrice,
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc Get logged in customer's orders
router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc Get all orders (manager only)
router.get("/", async (req, res) => {
  const orders = await Order.find({}).populate("user", "firstName email");
  res.json(orders);
});

export default router;
