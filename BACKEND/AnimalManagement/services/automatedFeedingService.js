import FeedingHistory from "../models/feedingHistoryModel.js";
import AnimalFood from "../../InventoryManagement/Imodels/AnimalFood.js";
import Zone from "../models/Zone.js";

class AutomatedFeedingService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
    this.overdueInterval = null;
    this.checkIntervalMs = 500; // Check every 500ms for more responsive execution
    this.executedFeedings = new Set(); // Track recently executed feedings to prevent duplicates
    this.esp32Ip = process.env.ESP32_IP || "192.168.1.8"; // Default IP
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
    this.handleOverdueFeedings();
    
    // Set up interval checking
    this.checkInterval = setInterval(() => {
      this.checkScheduledFeedings();
    }, this.checkIntervalMs);
    
    // Set up overdue feeding check (every 5 minutes)
    this.overdueInterval = setInterval(() => {
      this.handleOverdueFeedings();
    }, 300000); // 5 minutes

    console.log(`✅ Automated feeding service started (checking every ${this.checkIntervalMs}ms)`);
    console.log(`🔄 Real-time feeding scheduler is now active - will trigger feeding immediately when countdown reaches 0`);
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
    
    if (this.overdueInterval) {
      clearInterval(this.overdueInterval);
      this.overdueInterval = null;
    }

    console.log("✅ Automated feeding service stopped");
  }

  // Check for scheduled feedings that are due
  async checkScheduledFeedings() {
    try {
      const now = new Date();
      const currentTime = now.getTime();
      
      console.log(`🕐 Checking for due feedings at ${now.toLocaleString()}`);
      
      // Find all scheduled feedings that are due (exactly at or past the scheduled time)
      const dueFeedings = await FeedingHistory.find({
        feedingTime: {
          $lte: new Date(currentTime), // Due at or before current time
          $gte: new Date(currentTime - 300000) // But not more than 5 minutes ago (extended window to catch missed feedings)
        },
        status: { $in: ["scheduled", null] } // Not completed, failed, or cancelled (removed immediate filter to handle both types)
      })
      .populate("zoneId", "name type")
      .populate("foodId", "name remaining unit")
      .sort({ feedingTime: 1 });

      if (dueFeedings.length > 0) {
        console.log(`🕐 Found ${dueFeedings.length} scheduled feeding(s) due for execution at ${now.toLocaleString()}`);
        
        for (const feeding of dueFeedings) {
          // Create unique key to prevent duplicate execution
          const feedingKey = `${feeding._id}_${feeding.feedingTime.getTime()}`;
          
          console.log(`📋 Checking feeding: ${feeding._id}, Scheduled: ${feeding.feedingTime.toLocaleString()}, Status: ${feeding.status}`);
          
          // Skip if already executed recently (within 30 seconds)
          if (this.executedFeedings.has(feedingKey)) {
            console.log(`⏭️ Skipping already executed feeding: ${feedingKey}`);
            continue;
          }
          
          console.log(`🍽️ Processing feeding: Zone ${feeding.zoneId?.name}, Feed ${feeding.foodId?.name}, Time ${feeding.feedingTime.toLocaleString()}`);
          
          // Mark as being executed
          this.executedFeedings.add(feedingKey);
          
          // Remove from executed set after 30 seconds to allow retries
          setTimeout(() => {
            this.executedFeedings.delete(feedingKey);
          }, 30000);
          
          await this.executeScheduledFeeding(feeding);
        }
      } else {
        console.log(`✅ No feedings due at ${now.toLocaleString()}`);
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

      // Use configured ESP32 IP
      const esp32Ip = this.esp32Ip;
      
      console.log(`🔗 Attempting to connect to ESP32 at IP: ${esp32Ip}`);
      
      // Check network connectivity first
      const networkStatus = await this.checkNetworkConnectivity(esp32Ip);
      console.log(`📡 Network status: ${networkStatus}`);
      
      // Send feeding command to ESP32
      console.log(`📤 Sending feeding command: ${feeding.quantity}g to ${esp32Ip}`);
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
        console.log(`❌ Feeding command failed: ${feedingResult.error}`);
        console.log(`🔍 Device status: ${feedingResult.deviceStatus}`);
        console.log(`🔍 Network status: ${networkStatus}`);
        
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
      // Check if we're in test mode (ESP32 IP is set to 'test' or 'mock')
      if (esp32Ip === 'test' || esp32Ip === 'mock') {
        console.log(`🧪 Test mode: Simulating feeding of ${quantity}g`);
        // Simulate feeding delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
          success: true,
          response: `Test feeding completed: ${quantity}g dispensed`,
          deviceStatus: "Test Mode"
        };
      }

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

  // Manual trigger for testing - execute all due feedings immediately
  async triggerDueFeedings() {
    console.log("🔧 Manual trigger: Checking for due feedings...");
    await this.checkScheduledFeedings();
  }

  // Handle overdue feedings (feedings that should have been executed but weren't)
  async handleOverdueFeedings() {
    try {
      const now = new Date();
      const currentTime = now.getTime();
      
      console.log(`🔍 Checking for overdue feedings at ${now.toLocaleString()}`);
      
      // Find feedings that are overdue (more than 5 minutes past their scheduled time)
      const overdueFeedings = await FeedingHistory.find({
        feedingTime: {
          $lt: new Date(currentTime - 300000) // More than 5 minutes ago
        },
        status: { $in: ["scheduled", null] }
      })
      .populate("zoneId", "name type")
      .populate("foodId", "name remaining unit")
      .sort({ feedingTime: 1 });

      if (overdueFeedings.length > 0) {
        console.log(`⚠️ Found ${overdueFeedings.length} overdue feeding(s):`);
        
        for (const feeding of overdueFeedings) {
          console.log(`  - ${feeding.feedingTime.toLocaleString()}: Zone ${feeding.zoneId?.name}, Feed ${feeding.foodId?.name}`);
          
          // Update status to indicate it was missed
          feeding.status = "failed";
          feeding.failureReason = "Missed scheduled time - feeding was overdue";
          feeding.lastAttemptAt = new Date();
          await feeding.save();
        }
      } else {
        console.log(`✅ No overdue feedings found`);
      }
    } catch (error) {
      console.error("❌ Error handling overdue feedings:", error);
    }
  }

  // Force execute a specific feeding (for testing)
  async forceExecuteFeeding(feedingId) {
    try {
      const feeding = await FeedingHistory.findById(feedingId)
        .populate("zoneId", "name type")
        .populate("foodId", "name remaining unit");

      if (feeding) {
        console.log(`🔧 Force executing feeding: ${feedingId}`);
        await this.executeScheduledFeeding(feeding);
      } else {
        console.log(`❌ Feeding not found: ${feedingId}`);
      }
    } catch (error) {
      console.error("Error force executing feeding:", error);
    }
  }

  // Set ESP32 IP address
  setEsp32Ip(ip) {
    this.esp32Ip = ip;
    console.log(`🔧 ESP32 IP updated to: ${ip}`);
  }

  // Get ESP32 IP address
  getEsp32Ip() {
    return this.esp32Ip;
  }
}

// Create singleton instance
const automatedFeedingService = new AutomatedFeedingService();

export default automatedFeedingService;
