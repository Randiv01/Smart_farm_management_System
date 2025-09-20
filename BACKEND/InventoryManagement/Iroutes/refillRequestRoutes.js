import express from "express";
import RefillRequest from "../Imodels/refillRequestModel.js";
import AnimalFood from "../Imodels/AnimalFood.js";

const router = express.Router();

// Get all refill requests
router.get("/", async (req, res) => {
  try {
    const requests = await RefillRequest.find()
      .populate('foodId')
      .sort({ timestamp: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new refill request
router.post("/", async (req, res) => {
  try {
    const { foodId, foodName, quantity, requestedBy, mobileNumber } = req.body;
    
    // Check if the food exists
    const food = await AnimalFood.findById(foodId);
    if (!food) {
      return res.status(404).json({ message: "Food item not found" });
    }
    
    const refillRequest = new RefillRequest({
      foodId,
      foodName,
      quantity,
      requestedBy,
      mobileNumber: mobileNumber || ""
    });
    
    const newRequest = await refillRequest.save();
    
    // Emit real-time notification (you'll need to set up Socket.io)
    if (req.app.get('io')) {
      req.app.get('io').emit('refillRequest', {
        type: 'refillRequest',
        id: newRequest._id,
        title: 'New Refill Request',
        message: `${requestedBy} requested ${quantity} ${food.unit} of ${foodName}`,
        timestamp: new Date(),
        priority: 'high'
      });
    }
    
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get notifications for navbar
router.get("/notifications", async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get refill requests
    const refillRequests = await RefillRequest.find({ status: 'pending' })
      .populate('foodId')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    // Get low stock alerts
    const lowStockFoods = await AnimalFood.find({
      $expr: {
        $lte: [
          { $multiply: [{ $divide: ["$remaining", "$quantity"] }, 100] },
          30
        ]
      }
    }).limit(parseInt(limit));
    
    // Format notifications
    const notifications = [
      ...refillRequests.map(request => ({
        id: request._id,
        type: "refillRequest",
        title: "Refill Request",
        message: `${request.requestedBy} requested ${request.quantity} ${request.foodId?.unit || 'units'} of ${request.foodName}`,
        timestamp: request.timestamp,
        read: false,
        priority: 'high',
        data: request
      })),
      ...lowStockFoods.map(food => ({
        id: food._id,
        type: "lowStock",
        title: "Low Stock Alert",
        message: `${food.name} is ${(food.remaining / food.quantity * 100) <= 10 ? 'critically low' : 'low'} in stock (${food.remaining} ${food.unit} remaining)`,
        timestamp: new Date(),
        read: false,
        priority: (food.remaining / food.quantity * 100) <= 10 ? 'high' : 'medium',
        data: food
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, parseInt(limit));
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.patch("/notifications/:id/read", async (req, res) => {
  try {
    // For refill requests, we might want to update their status
    // For now, we'll just track read status in the frontend
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a refill request status
router.patch("/:id", async (req, res) => {
  try {
    const { status, processedBy, notes } = req.body;
    const request = await RefillRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: "Refill request not found" });
    }
    
    request.status = status || request.status;
    request.processedBy = processedBy || request.processedBy;
    request.notes = notes || request.notes;
    
    if (status === 'approved' || status === 'rejected' || status === 'completed') {
      request.processedAt = new Date();
      
      // Emit status update notification
      if (req.app.get('io')) {
        req.app.get('io').emit('refillRequestUpdate', {
          type: 'refillRequestUpdate',
          id: request._id,
          title: 'Refill Request Updated',
          message: `Your refill request for ${request.foodName} has been ${status}`,
          timestamp: new Date(),
          priority: 'medium',
          data: request
        });
      }
    }
    
    const updatedRequest = await request.save();
    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get refill requests by status
router.get("/status/:status", async (req, res) => {
  try {
    const requests = await RefillRequest.find({ status: req.params.status })
      .populate('foodId')
      .sort({ timestamp: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;