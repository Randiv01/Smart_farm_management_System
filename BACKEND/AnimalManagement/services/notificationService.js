import Notification from "../models/Notification.js";
import FeedStock from "../models/feedStockModel.js";
import Animal from "../models/Animal.js";
import MeatProductivity from "../models/MeatProductivity.js";
import HarvestHistory from "../models/HarvestHistory.js";

class NotificationService {
  // Check feed stock levels and create notifications
  static async checkFeedStockLevels() {
    try {
      const lowStockFeeds = await FeedStock.find({
        $expr: {
          $lt: ["$currentStock", { $multiply: ["$minimumStock", 1.2] }] // 20% above minimum
        }
      });

      for (const feed of lowStockFeeds) {
        const priority = feed.currentStock <= feed.minimumStock ? 'critical' : 'high';
        const category = feed.currentStock <= feed.minimumStock ? 'alert' : 'warning';
        
        await Notification.createNotification({
          title: `Low Feed Stock Alert`,
          message: `${feed.feedName} stock is ${feed.currentStock} ${feed.unit}. Minimum required: ${feed.minimumStock} ${feed.unit}`,
          type: 'feed_stock',
          priority,
          category,
          relatedEntity: {
            type: 'feed',
            id: feed._id
          },
          metadata: {
            currentStock: feed.currentStock,
            minimumStock: feed.minimumStock,
            unit: feed.unit
          }
        });
      }
    } catch (error) {
      console.error('Error checking feed stock levels:', error);
    }
  }

  // Check meat batch expiry dates
  static async checkMeatBatchExpiry() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const nearExpiryBatches = await MeatProductivity.find({
        expiryDate: { $lte: threeDaysFromNow },
        status: { $nin: ['Sold', 'Expired'] }
      });

      for (const batch of nearExpiryBatches) {
        const daysUntilExpiry = Math.ceil((new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        const priority = daysUntilExpiry <= 1 ? 'critical' : daysUntilExpiry <= 2 ? 'high' : 'medium';
        const category = daysUntilExpiry <= 1 ? 'alert' : 'warning';

        await Notification.createNotification({
          title: `Meat Batch Expiry Alert`,
          message: `Batch ${batch.batchId} (${batch.batchName}) expires in ${daysUntilExpiry} day(s)`,
          type: 'meat',
          priority,
          category,
          relatedEntity: {
            type: 'batch',
            id: batch._id
          },
          metadata: {
            batchId: batch.batchId,
            batchName: batch.batchName,
            expiryDate: batch.expiryDate,
            daysUntilExpiry
          }
        });
      }
    } catch (error) {
      console.error('Error checking meat batch expiry:', error);
    }
  }

  // Check animal health conditions
  static async checkAnimalHealth() {
    try {
      const criticalHealthAnimals = await Animal.find({
        healthCondition: 'Critical'
      });

      for (const animal of criticalHealthAnimals) {
        await Notification.createNotification({
          title: `Critical Health Alert`,
          message: `Animal ${animal.animalId} (${animal.name}) has critical health condition`,
          type: 'health',
          priority: 'critical',
          category: 'alert',
          relatedEntity: {
            type: 'animal',
            id: animal._id
          },
          metadata: {
            animalId: animal.animalId,
            animalName: animal.name,
            healthCondition: animal.healthCondition,
            lastHealthCheck: animal.lastHealthCheck
          }
        });
      }
    } catch (error) {
      console.error('Error checking animal health:', error);
    }
  }

  // Check zone occupancy
  static async checkZoneOccupancy() {
    try {
      const overOccupiedZones = await Animal.aggregate([
        {
          $group: {
            _id: "$zone",
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: "zones",
            localField: "_id",
            foreignField: "_id",
            as: "zoneInfo"
          }
        },
        {
          $unwind: "$zoneInfo"
        },
        {
          $match: {
            $expr: {
              $gt: ["$count", "$zoneInfo.capacity"]
            }
          }
        }
      ]);

      for (const zone of overOccupiedZones) {
        await Notification.createNotification({
          title: `Zone Overcapacity Alert`,
          message: `Zone ${zone.zoneInfo.zoneName} is over capacity. Current: ${zone.count}, Capacity: ${zone.zoneInfo.capacity}`,
          type: 'zone',
          priority: 'high',
          category: 'warning',
          relatedEntity: {
            type: 'zone',
            id: zone._id
          },
          metadata: {
            zoneName: zone.zoneInfo.zoneName,
            currentCount: zone.count,
            capacity: zone.zoneInfo.capacity
          }
        });
      }
    } catch (error) {
      console.error('Error checking zone occupancy:', error);
    }
  }

  // Check feeding schedule compliance
  static async checkFeedingSchedule() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // This would need to be implemented based on your feeding schedule model
      // For now, we'll create a placeholder
      const missedFeedings = []; // Implement based on your feeding schedule model

      for (const feeding of missedFeedings) {
        await Notification.createNotification({
          title: `Missed Feeding Alert`,
          message: `Feeding missed for ${feeding.animalName} at ${feeding.scheduledTime}`,
          type: 'feeding',
          priority: 'medium',
          category: 'warning',
          relatedEntity: {
            type: 'feeding_schedule',
            id: feeding._id
          },
          metadata: {
            animalName: feeding.animalName,
            scheduledTime: feeding.scheduledTime,
            feedType: feeding.feedType
          }
        });
      }
    } catch (error) {
      console.error('Error checking feeding schedule:', error);
    }
  }

  // Run all checks
  static async runAllChecks() {
    console.log('Running notification checks...');
    
    await Promise.all([
      this.checkFeedStockLevels(),
      this.checkMeatBatchExpiry(),
      this.checkAnimalHealth(),
      this.checkZoneOccupancy(),
      this.checkFeedingSchedule()
    ]);
    
    console.log('Notification checks completed');
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications() {
    try {
      // Clean up expired notifications
      const expiredResult = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      
      if (expiredResult.deletedCount > 0) {
        console.log(`🗑️ Cleaned up ${expiredResult.deletedCount} expired notifications`);
      }
      
      // Clean up old read notifications
      const oldResult = await Notification.cleanupOldNotifications();
      if (oldResult > 0) {
        console.log(`🗑️ Cleaned up ${oldResult} old read notifications`);
      }
      
      return expiredResult.deletedCount + oldResult;
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      return 0;
    }
  }
}

export default NotificationService;
