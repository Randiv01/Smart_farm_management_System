import FeedingHistory from "../models/feedingHistoryModel.js";
import AnimalFood from "../../InventoryManagement/Imodels/AnimalFood.js";
import Zone from "../models/Zone.js";
import fetch from "node-fetch";

class AutomatedFeedingService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
    this.overdueInterval = null;
    this.checkIntervalMs = 30000; // Check every 30 seconds to prevent premature triggers
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
    
    // Set up interval checking - every 30 seconds to prevent premature triggers
    this.checkInterval = setInterval(() => {
      this.checkScheduledFeedings();
    }, this.checkIntervalMs);
    
    // Set up overdue feeding check (every 10 minutes)
    this.overdueInterval = setInterval(() => {
      this.handleOverdueFeedings();
    }, 600000); // 10 minutes

    console.log(`✅ Automated feeding service started (checking every ${this.checkIntervalMs / 1000} seconds)`);
    console.log(`🔄 Feeding scheduler is now active - will trigger feedings at their scheduled time`);
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
      
      // FIRST: Recover any stuck "processing" feedings (processing for more than 5 minutes)
      await this.recoverStuckFeedings();
      
      // Find all scheduled feedings that are due (within 1 minute window to prevent premature triggers)
      // CRITICAL: Only select feedings with status="scheduled" AND immediate=false
      // This ensures no duplicate execution and no manual feeding interference
      const dueFeedings = await FeedingHistory.find({
        feedingTime: {
          $lte: new Date(currentTime + 60000), // Due within next 1 minute
          $gte: new Date(currentTime - 60000) // Or up to 1 minute ago
        },
        status: "scheduled", // ONLY scheduled status (not processing, completed, or failed)
        immediate: false, // ONLY automated feedings (exclude manual "Feed Now")
        attemptCount: { $lt: 3 } // ONLY feedings that haven't exceeded max attempts
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
          
          // Skip if already executed recently (within 2 minutes)
          if (this.executedFeedings.has(feedingKey)) {
            console.log(`⏭️ Skipping already executed feeding: ${feedingKey}`);
            continue;
          }
          
          // Only execute if feeding time has actually arrived (not before)
          const feedingTime = new Date(feeding.feedingTime).getTime();
          if (feedingTime > currentTime + 10000) { // More than 10 seconds in future
            console.log(`⏰ Feeding not yet due: ${feeding.feedingTime.toLocaleString()} (${Math.round((feedingTime - currentTime) / 1000)}s remaining)`);
            continue;
          }
          
          console.log(`🍽️ Processing feeding: Zone ${feeding.zoneId?.name}, Feed ${feeding.foodId?.name}, Time ${feeding.feedingTime.toLocaleString()}`);
          
          // Mark as being executed
          this.executedFeedings.add(feedingKey);
          
          // Remove from executed set after 2 minutes to allow retries
          setTimeout(() => {
            this.executedFeedings.delete(feedingKey);
          }, 120000);
          
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
      console.log(`
========================================`);
      console.log(`🍽️ EXECUTING SCHEDULED FEEDING`);
      console.log(`Feeding ID: ${feeding._id}`);
      console.log(`Zone: ${feeding.zoneId?.name}`);
      console.log(`Feed: ${feeding.foodId?.name}`);
      console.log(`Quantity: ${feeding.quantity}g`);
      console.log(`Attempt: ${attemptCount}`);
      console.log(`Current Status: ${feeding.status}`);
      console.log(`Scheduled Time: ${feeding.feedingTime}`);
      console.log(`========================================\n`);
      
      // SIMPLIFIED: Just update to processing without strict atomic check
      // The executedFeedings Set already prevents duplicates
      await FeedingHistory.findByIdAndUpdate(feeding._id, {
        status: "processing",
        attemptCount: attemptCount,
        lastAttemptAt: startTime
      });
      
      console.log(`🔒 Feeding ${feeding._id} marked as processing`);

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
      console.log(`\n📤 SENDING COMMAND TO ESP32`);
      console.log(`ESP32 IP: ${esp32Ip}`);
      console.log(`URL: http://${esp32Ip}/feed`);
      console.log(`Quantity: ${feeding.quantity}g`);
      console.log(`Attempting to send...\n`);
      
      const feedingResult = await this.sendFeedingCommandToESP32(esp32Ip, feeding.quantity);
      
      console.log(`\n📥 ESP32 RESPONSE RECEIVED`);
      console.log(`Success: ${feedingResult.success}`);
      console.log(`Device Status: ${feedingResult.deviceStatus}`);
      console.log(`Response: ${feedingResult.response || feedingResult.error}`);
      console.log(`Full Result:`, JSON.stringify(feedingResult, null, 2));
      console.log(``);
      
      if (feedingResult.success) {
        // Update feed stock
        await AnimalFood.findByIdAndUpdate(feeding.foodId._id, {
          $inc: { remaining: -feeding.quantity }
        });

        // Mark feeding as completed (final status - no more retries)
        await FeedingHistory.findByIdAndUpdate(feeding._id, {
          status: "completed",
          executedAt: startTime,
          esp32Response: feedingResult.response,
          stockReduced: true,
          deviceStatus: "Connected",
          networkStatus: networkStatus,
          retryCount: 0,
          attemptCount: attemptCount
        });

        console.log(`\n✅✅✅ FEEDING COMPLETED SUCCESSFULLY ✅✅✅`);
        console.log(`Zone: ${feeding.zoneId?.name}`);
        console.log(`Feed: ${feeding.foodId?.name}`);
        console.log(`Quantity: ${feeding.quantity}g`);
        console.log(`Status: completed`);
        console.log(`========================================\n`);
        
        this.sendFeedingNotification(feeding, "completed");
        
      } else {
        console.log(`❌ Feeding command failed: ${feedingResult.error}`);
        console.log(`🔍 Device status: ${feedingResult.deviceStatus}`);
        console.log(`🔍 Network status: ${networkStatus}`);
        
        // Check if we should retry
        const shouldRetry = attemptCount < (feeding.maxRetries || 3);
        
        if (shouldRetry) {
          console.log(`⚠️ Feeding failed (Attempt ${attemptCount}), will retry. Error: ${feedingResult.error}`);
          
          // Reset to scheduled for retry with updated error info
          // Set feedingTime to 1 minute in future for next retry attempt
          const nextRetryTime = new Date(Date.now() + 60000); // Retry in 1 minute
          
          await FeedingHistory.findByIdAndUpdate(feeding._id, {
            status: "scheduled", // Reset to scheduled for retry
            feedingTime: nextRetryTime, // Update feeding time for retry
            retryCount: (feeding.retryCount || 0) + 1,
            failureReason: `Attempt ${attemptCount} failed: ${feedingResult.error}`,
            errorDetails: feedingResult.error,
            deviceStatus: feedingResult.deviceStatus || "Unknown",
            networkStatus: networkStatus,
            attemptCount: attemptCount
          });
          
          console.log(`🔄 Retry scheduled for ${nextRetryTime.toLocaleString()}`);
          
        } else {
          // Max retries reached, mark as failed (final status)
          console.log(`❌ Scheduled feeding failed after ${attemptCount} attempts for Zone: ${feeding.zoneId?.name}. Error: ${feedingResult.error}`);
          
          await FeedingHistory.findByIdAndUpdate(feeding._id, {
            status: "failed",
            failureReason: `Failed after ${attemptCount} attempts: ${feedingResult.error}`,
            errorDetails: feedingResult.error,
            executedAt: startTime,
            deviceStatus: feedingResult.deviceStatus || "Unknown",
            networkStatus: networkStatus,
            attemptCount: attemptCount
          });
          
          this.sendFeedingNotification(feeding, "failed", feedingResult.error);
        }
      }
      
    } catch (error) {
      console.error("❌ Error executing scheduled feeding:", error);
      
      // Mark as failed with detailed error
      const currentFeeding = await FeedingHistory.findById(feeding._id);
      const shouldRetry = attemptCount < 3;
      
      if (shouldRetry && currentFeeding?.status === "processing") {
        // Reset to scheduled for retry
        const nextRetryTime = new Date(Date.now() + 60000); // Retry in 1 minute
        await FeedingHistory.findByIdAndUpdate(feeding._id, {
          status: "scheduled",
          feedingTime: nextRetryTime,
          failureReason: `System error: ${error.message}`,
          errorDetails: error.stack,
          deviceStatus: "Error",
          networkStatus: "Unknown",
          attemptCount: attemptCount
        });
        console.log(`🔄 System error - retry scheduled for ${nextRetryTime.toLocaleString()}`);
      } else {
        // Mark as failed
        await FeedingHistory.findByIdAndUpdate(feeding._id, {
          status: "failed",
          failureReason: `System error: ${error.message}`,
          errorDetails: error.stack,
          executedAt: startTime,
          deviceStatus: "Error",
          networkStatus: "Unknown",
          attemptCount: attemptCount
        });
      }
      
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

      console.log(`🌐 Sending POST request to http://${esp32Ip}/feed with body: ${quantity}`);
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
      );
      
      // Create fetch promise
      const fetchPromise = fetch(`http://${esp32Ip}/feed`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: quantity.toString()
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      console.log(`📡 ESP32 response status: ${response.status}`);

      if (response.ok) {
        const responseText = await response.text();
        console.log(`✅ ESP32 response text: ${responseText}`);
        return {
          success: true,
          response: responseText,
          deviceStatus: "Connected"
        };
      } else {
        const errorText = await response.text().catch(() => 'No error text');
        console.log(`❌ ESP32 error response: ${errorText}`);
        return {
          success: false,
          error: `ESP32 returned status: ${response.status} - ${errorText}`,
          deviceStatus: "Error"
        };
      }
    } catch (error) {
      console.error(`❌ ESP32 communication error:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        deviceStatus: "Disconnected"
      };
    }
  }

  // Check network connectivity
  async checkNetworkConnectivity(esp32Ip) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      // Create fetch promise
      const fetchPromise = fetch(`http://${esp32Ip}/`, {
        method: "GET"
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      return response.ok ? "Connected" : "Poor Connection";
    } catch (error) {
      return "Disconnected";
    }
  }

  // Recover stuck "processing" feedings
  async recoverStuckFeedings() {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 300000); // 5 minutes ago
      
      // Find feedings stuck in "processing" status for more than 5 minutes
      const stuckFeedings = await FeedingHistory.find({
        status: "processing",
        lastAttemptAt: { $lt: fiveMinutesAgo },
        immediate: false
      });
      
      if (stuckFeedings.length > 0) {
        console.log(`🔧 Found ${stuckFeedings.length} stuck feeding(s) in processing status. Recovering...`);
        
        for (const feeding of stuckFeedings) {
          const shouldRetry = (feeding.attemptCount || 0) < 3;
          
          if (shouldRetry) {
            // Reset to scheduled for retry
            const nextRetryTime = new Date(Date.now() + 60000); // Retry in 1 minute
            await FeedingHistory.findByIdAndUpdate(feeding._id, {
              status: "scheduled",
              feedingTime: nextRetryTime,
              failureReason: "Recovered from stuck processing state",
              errorDetails: "Feeding was stuck in processing status for more than 5 minutes"
            });
            console.log(`✅ Recovered feeding ${feeding._id} - retry scheduled for ${nextRetryTime.toLocaleString()}`);
          } else {
            // Max retries reached, mark as failed
            await FeedingHistory.findByIdAndUpdate(feeding._id, {
              status: "failed",
              failureReason: "Failed - stuck in processing state",
              errorDetails: "Feeding was stuck in processing status and exceeded max retries"
            });
            console.log(`❌ Marked stuck feeding ${feeding._id} as failed (max retries exceeded)`);
          }
        }
      }
    } catch (error) {
      console.error("Error recovering stuck feedings:", error);
    }
  }

  // Retry a failed feeding (legacy - now handled by feedingTime update)
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
        status: "scheduled" // Only scheduled feedings
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
      
      // Find feedings that are overdue (more than 10 minutes past their scheduled time)
      const overdueFeedings = await FeedingHistory.find({
        feedingTime: {
          $lt: new Date(currentTime - 600000) // More than 10 minutes ago
        },
        status: "scheduled", // Only scheduled feedings
        immediate: false // Exclude immediate feedings (manually triggered)
      })
      .populate("zoneId", "name type")
      .populate("foodId", "name remaining unit")
      .sort({ feedingTime: 1 });

      if (overdueFeedings.length > 0) {
        console.log(`⚠️ Found ${overdueFeedings.length} overdue feeding(s):`);
        
        for (const feeding of overdueFeedings) {
          console.log(`  - ${feeding.feedingTime.toLocaleString()}: Zone ${feeding.zoneId?.name}, Feed ${feeding.foodId?.name}`);
          
          // Update status to indicate it was missed (only if still scheduled)
          if (feeding.status === "scheduled") {
            feeding.status = "failed";
            feeding.failureReason = "Missed scheduled time - feeding was overdue by more than 10 minutes";
            feeding.lastAttemptAt = new Date();
            await feeding.save();
          }
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
