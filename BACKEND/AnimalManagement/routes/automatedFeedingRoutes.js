import express from "express";
import automatedFeedingService from "../services/automatedFeedingService.js";

const router = express.Router();

// Get automated feeding service status
router.get("/status", (req, res) => {
  try {
    const status = automatedFeedingService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Start automated feeding service
router.post("/start", (req, res) => {
  try {
    automatedFeedingService.start();
    res.json({
      success: true,
      message: "Automated feeding service started successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Stop automated feeding service
router.post("/stop", (req, res) => {
  try {
    automatedFeedingService.stop();
    res.json({
      success: true,
      message: "Automated feeding service stopped successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Manually trigger feeding check
router.post("/check", async (req, res) => {
  try {
    await automatedFeedingService.checkScheduledFeedings();
    res.json({
      success: true,
      message: "Manual feeding check completed"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get next scheduled feeding
router.get("/next-feeding", async (req, res) => {
  try {
    const nextFeeding = await automatedFeedingService.getNextScheduledFeeding();
    res.json({
      success: true,
      data: nextFeeding
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
