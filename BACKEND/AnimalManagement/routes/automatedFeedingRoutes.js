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

// Trigger due feedings manually (for testing)
router.post("/trigger-due", async (req, res) => {
  try {
    await automatedFeedingService.triggerDueFeedings();
    res.json({
      success: true,
      message: "Due feedings triggered successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Handle overdue feedings
router.post("/handle-overdue", async (req, res) => {
  try {
    await automatedFeedingService.handleOverdueFeedings();
    res.json({
      success: true,
      message: "Overdue feedings handled successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Force execute a specific feeding (for testing)
router.post("/force-execute/:feedingId", async (req, res) => {
  try {
    const { feedingId } = req.params;
    await automatedFeedingService.forceExecuteFeeding(feedingId);
    res.json({
      success: true,
      message: `Feeding ${feedingId} force executed successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Set ESP32 IP address
router.post("/esp32-ip", (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({
        success: false,
        message: "IP address is required"
      });
    }
    
    automatedFeedingService.setEsp32Ip(ip);
    res.json({
      success: true,
      message: `ESP32 IP updated to ${ip}`,
      data: { esp32Ip: ip }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get ESP32 IP address
router.get("/esp32-ip", (req, res) => {
  try {
    const esp32Ip = automatedFeedingService.getEsp32Ip();
    res.json({
      success: true,
      data: { esp32Ip }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
