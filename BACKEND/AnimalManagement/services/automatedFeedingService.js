import FeedingHistory from "../models/feedingHistoryModel.js";
import AnimalFood from "../../InventoryManagement/Imodels/AnimalFood.js";
import Zone from "../models/Zone.js";

class AutomatedFeedingService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
    this.checkIntervalMs = 3000; // Check every 3 seconds for immediate response
  }

  // Start the automated feeding service
  start() {
    if (this.isRunning) {
      console.log("Automated feeding service is already running");
      return;
    }

    console.log("🤖 Starting automated feeding service...");
    this.isRunning = true;
    
    // Check immediately on start
    this.checkScheduledFeedings();
    
    // Set up interval checking
    this.checkInterval = setInterval(() => {
      this.checkScheduledFeedings();
    }, this.checkIntervalMs);

    console.log(`✅ Automated feeding service started (checking every ${this.checkIntervalMs / 1000} seconds)`);
  }

  // Stop the automated feeding service
  stop() {
    if (!this.isRunning) {
      console.log("Automated feeding service is not running");
      return;
    }

    console.log("🛑 Stopping automated feeding service...");
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    console.log("✅ Automated feeding service stopped");
  }

  // Check for scheduled feedings that are due
  async checkScheduledFeedings() {
    try {
      const now = new Date();
      const currentTime = now.getTime();
      
      console.log(`🔍 Checking for scheduled feedings at ${now.toLocaleString()}`);
      
      // Find all scheduled feedings that are due (within the next 5 seconds)
      const dueFeedings = await FeedingHistory.find({
        feedingTime: {
          $lte: new Date(currentTime + 5000), // Due within next 5 seconds
          $gte: new Date(currentTime - 300000) // But not more than 5 minutes ago
        },
        immediate: false,
        status: { $in: ["scheduled", null] } // Not completed, failed, or cancelled
      })
      .populate("zoneId", "name type")
      .populate("foodId", "name remaining unit")
      .sort({ feedingTime: 1 });

      console.log(`📋 Found ${dueFeedings.length} scheduled feeding(s) to check`);
      
      if (dueFeedings.length > 0) {
        console.log(`🕐 Found ${dueFeedings.length} scheduled feeding(s) due for execution`);
        
        for (const feeding of dueFeedings) {
          console.log(`🍽️ Processing feeding: Zone ${feeding.zoneId?.name}, Feed ${feeding.foodId?.name}, Time ${feeding.feedingTime.toLocaleString()}`);
          await this.executeScheduledFeeding(feeding);
        }
      } else {
        console.log(`✅ No scheduled feedings due at this time`);
      }
    } catch (error) {
      console.error("❌ Error checking scheduled feedings:", error);
    }
  }

  // Execute a scheduled feeding
  async executeScheduledFeeding(feeding) {
    const startTime = new Date();
    let attemptCount = (feeding.attemptCount || 0) + 1;
    
    try {
      console.log(`🍽️ Executing scheduled feeding (Attempt ${attemptCount}) for Zone: ${feeding.zoneId?.name}, Feed: ${feeding.foodId?.name}, Quantity: ${feeding.quantity}g`);
      
      // Update attempt count and last attempt time
      await FeedingHistory.findByIdAndUpdate(feeding._id, {
        attemptCount: attemptCount,
        lastAttemptAt: startTime,
        status: "retrying"
      });

      // Check if feed is available
      if (!feeding.foodId || feeding.foodId.remaining < feeding.quantity) {
        const errorMsg = `Insufficient feed stock. Required: ${feeding.quantity}g, Available: ${feeding.foodId?.remaining || 0}g`;
        console.log(`⚠️ ${errorMsg}`);
        
        // Mark as failed due to insufficient stock
        await FeedingHistory.findByIdAndUpdate(feeding._id, {
          status: "failed",
          failureReason: "Insufficient feed stock",
          errorDetails: errorMsg,
          executedAt: startTime,
          deviceStatus: "N/A",
          networkStatus: "N/A"
        });
        
        this.sendFeedingNotification(feeding, "failed", errorMsg);
        return;
      }

      // Get ESP32 IP from environment or configuration
      const esp32Ip = process.env.ESP32_IP || "192.168.1.8"; // Default IP
      
      // Check network connectivity first
      const networkStatus = await this.checkNetworkConnectivity(esp32Ip);
      
      // Send feeding command to ESP32
      const feedingResult = await this.sendFeedingCommandToESP32(esp32Ip, feeding.quantity);
      
      if (feedingResult.success) {
        // Update feed stock
        await AnimalFood.findByIdAndUpdate(feeding.foodId._id, {
          $inc: { remaining: -feeding.quantity }
        });

        // Mark feeding as completed
        await FeedingHistory.findByIdAndUpdate(feeding._id, {
          status: "completed",
          executedAt: startTime,
          esp32Response: feedingResult.response,
          stockReduced: true,
          deviceStatus: "Connected",
          networkStatus: networkStatus,
          retryCount: 0
        });

        console.log(`✅ Scheduled feeding completed successfully for Zone: ${feeding.zoneId?.name}`);
        this.sendFeedingNotification(feeding, "completed");
        
      } else {
        // Check if we should retry
        const shouldRetry = attemptCount < (feeding.maxRetries || 3);
        
        if (shouldRetry) {
          console.log(`⚠️ Feeding failed (Attempt ${attemptCount}), will retry. Error: ${feedingResult.error}`);
          
          await FeedingHistory.findByIdAndUpdate(feeding._id, {
            status: "scheduled", // Reset to scheduled for retry
            retryCount: (feeding.retryCount || 0) + 1,
            failureReason: `Attempt ${attemptCount} failed: ${feedingResult.error}`,
            errorDetails: feedingResult.error,
            deviceStatus: feedingResult.deviceStatus || "Unknown",
            networkStatus: networkStatus
          });
          
          // Schedule retry in 2 minutes
          setTimeout(() => {
            this.retryFeeding(feeding._id);
          }, 120000); // 2 minutes
          
        } else {
          // Max retries reached, mark as failed
          console.log(`❌ Scheduled feeding failed after ${attemptCount} attempts for Zone: ${feeding.zoneId?.name}. Error: ${feedingResult.error}`);
          
          await FeedingHistory.findByIdAndUpdate(feeding._id, {
            status: "failed",
            failureReason: `Failed after ${attemptCount} attempts: ${feedingResult.error}`,
            errorDetails: feedingResult.error,
            executedAt: startTime,
            deviceStatus: feedingResult.deviceStatus || "Unknown",
            networkStatus: networkStatus
          });
          
          this.sendFeedingNotification(feeding, "failed", feedingResult.error);
        }
      }
      
    } catch (error) {
      console.error("❌ Error executing scheduled feeding:", error);
      
      // Mark as failed with detailed error
      await FeedingHistory.findByIdAndUpdate(feeding._id, {
        status: "failed",
        failureReason: `System error: ${error.message}`,
        errorDetails: error.stack,
        executedAt: startTime,
        deviceStatus: "Error",
        networkStatus: "Unknown"
      });
      
      this.sendFeedingNotification(feeding, "failed", error.message);
    }
  }

  // Send feeding command to ESP32
  async sendFeedingCommandToESP32(esp32Ip, quantity) {
    try {
      const response = await fetch(`http://${esp32Ip}/feed`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: quantity.toString(),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (response.ok) {
        const responseText = await response.text();
        return {
          success: true,
          response: responseText,
          deviceStatus: "Connected"
        };
      } else {
        return {
          success: false,
          error: `ESP32 returned status: ${response.status}`,
          deviceStatus: "Error"
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        deviceStatus: "Disconnected"
      };
    }
  }

  // Check network connectivity
  async checkNetworkConnectivity(esp32Ip) {
    try {
      const response = await fetch(`http://${esp32Ip}/`, {
        method: "GET",
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok ? "Connected" : "Poor Connection";
    } catch (error) {
      return "Disconnected";
    }
  }

  // Retry a failed feeding
  async retryFeeding(feedingId) {
    try {
      const feeding = await FeedingHistory.findById(feedingId)
        .populate("zoneId", "name type")
        .populate("foodId", "name remaining unit");

      if (feeding && feeding.status === "scheduled") {
        console.log(`🔄 Retrying feeding for Zone: ${feeding.zoneId?.name}`);
        await this.executeScheduledFeeding(feeding);
      }
    } catch (error) {
      console.error("Error retrying feeding:", error);
    }
  }

  // Send feeding notification
  sendFeedingNotification(feeding, status, error = null) {
    const message = status === "completed" 
      ? `✅ Automated feeding completed for Zone: ${feeding.zoneId?.name}, Feed: ${feeding.foodId?.name}, Quantity: ${feeding.quantity}g`
      : `❌ Automated feeding failed for Zone: ${feeding.zoneId?.name}. Error: ${error}`;
    
    console.log(`📢 Notification: ${message}`);
    
    // Here you can integrate with your notification system
    // For example, send to Socket.IO, email, SMS, etc.
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkIntervalMs,
      nextCheck: this.isRunning ? new Date(Date.now() + this.checkIntervalMs) : null
    };
  }

  // Get next scheduled feeding time
  async getNextScheduledFeeding() {
    try {
      const now = new Date();
      const nextFeeding = await FeedingHistory.findOne({
        feedingTime: { $gt: now },
        immediate: false,
        status: { $in: ["scheduled", null] }
      })
      .populate("zoneId", "name type")
      .populate("foodId", "name remaining unit")
      .sort({ feedingTime: 1 });

      return nextFeeding;
    } catch (error) {
      console.error("Error getting next scheduled feeding:", error);
      return null;
    }
  }
}

// Create singleton instance
const automatedFeedingService = new AutomatedFeedingService();

export default automatedFeedingService;
