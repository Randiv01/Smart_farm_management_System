// routes/meatRoutes.js
import express from "express";
import MeatProductivity from "../models/MeatProductivity.js";
import HarvestHistory from "../models/HarvestHistory.js";

const router = express.Router();

// Create a new meat batch
router.post("/", async (req, res) => {
  try {
    // Explicitly exclude batchId from the request body
    const { batchId, ...meatBatchData } = req.body; // Ignore batchId if sent
    const {
      batchName,
      animalType,
      meatType,
      quantity,
      unit,
      productionDate,
      expiryDate,
      status,
      healthCondition,
      notes,
    } = meatBatchData;

    // Validate required fields
    if (!batchName || !animalType || !meatType || !quantity || !productionDate || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: batchName, animalType, meatType, quantity, productionDate, expiryDate",
      });
    }

    // Validate dates
    const prodDate = new Date(productionDate);
    const expDate = new Date(expiryDate);
    
    // Compare using UTC to avoid timezone issues
    const prodUTC = Date.UTC(prodDate.getFullYear(), prodDate.getMonth(), prodDate.getDate());
    const expUTC = Date.UTC(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
    
    if (expUTC <= prodUTC) {
      return res.status(400).json({
        success: false,
        message: "Expiry date must be after production date",
      });
    }

    const meatBatch = new MeatProductivity({
      batchName,
      animalType,
      meatType,
      quantity,
      unit,
      productionDate,
      expiryDate,
      status,
      healthCondition,
      notes,
    });

    await meatBatch.save();

    // Emit socket notification
    req.app.get("io").emit("meatAdded", {
      message: `New meat batch ${meatBatch.batchId} added successfully`,
      batchId: meatBatch.batchId,
      batchName: meatBatch.batchName,
      type: "success"
    });

    res.status(201).json({
      success: true,
      message: `Meat batch ${meatBatch.batchId} created successfully`,
      data: meatBatch,
    });
  } catch (error) {
    console.error('Create meat batch error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Batch ID already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error creating meat batch",
    });
  }
});

// Get all meat batches with filters
router.get("/", async (req, res) => {
  try {
    const { batchId, animalType, status, healthCondition, fromDate, toDate, active } = req.query;
    const query = {};

    if (batchId) query.batchId = { $regex: batchId, $options: "i" };
    if (animalType) query.animalType = { $regex: animalType, $options: "i" };
    if (status) query.status = status;
    if (healthCondition) query.healthCondition = healthCondition;
    
    // Filter by active status if provided
    if (active !== undefined) {
      query.isActive = active === "true";
    }

    if (fromDate || toDate) {
      query.productionDate = {};
      if (fromDate) query.productionDate.$gte = new Date(fromDate);
      if (toDate) query.productionDate.$lte = new Date(toDate);
    }

    const meatBatches = await MeatProductivity.find(query).sort({ createdAt: -1 });
    const now = new Date();

    const batchesWithLifecycle = meatBatches.map((batch) => {
      const daysActive = Math.floor((now - new Date(batch.productionDate)) / (24 * 60 * 60 * 1000));
      const daysUntilExpiry = Math.ceil((new Date(batch.expiryDate) - now) / (24 * 60 * 60 * 1000));

      // Auto-update status if expired
      if (daysUntilExpiry < 0 && batch.status !== "Sold" && batch.status !== "Expired") {
        batch.status = "Expired";
        batch.save();
      }

      return {
        ...batch._doc,
        daysActive: daysActive > 0 ? daysActive : 0,
        daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0,
        isExpired: daysUntilExpiry < 0,
        isNearExpiry: daysUntilExpiry > 0 && daysUntilExpiry <= 3,
      };
    });

    res.status(200).json({ data: batchesWithLifecycle });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Error fetching meat batches",
    });
  }
});

// Get a single meat batch
router.get("/:id", async (req, res) => {
  try {
    const meatBatch = await MeatProductivity.findById(req.params.id);
    if (!meatBatch) return res.status(404).json({ message: "Meat batch not found" });

    const now = new Date();
    const daysActive = Math.floor((now - new Date(meatBatch.productionDate)) / (24 * 60 * 60 * 1000));
    const daysUntilExpiry = Math.ceil((new Date(meatBatch.expiryDate) - now) / (24 * 60 * 60 * 1000));

    res.status(200).json({
      data: {
        ...meatBatch._doc,
        daysActive: daysActive > 0 ? daysActive : 0,
        daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0,
        isExpired: daysUntilExpiry < 0,
        isNearExpiry: daysUntilExpiry > 0 && daysUntilExpiry <= 3,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Error fetching meat batch",
    });
  }
});

// Update a meat batch
router.put("/:id", async (req, res) => {
  try {
    // Explicitly exclude batchId from the update payload
    const { batchId, ...updateData } = req.body; // Ignore batchId if sent
    const {
      batchName,
      animalType,
      meatType,
      quantity,
      unit,
      productionDate,
      expiryDate,
      status,
      healthCondition,
      notes,
    } = updateData;

    // Validate dates if both are provided
    if (productionDate && expiryDate) {
      const prodDate = new Date(productionDate);
      const expDate = new Date(expiryDate);
      
      // Compare using UTC to avoid timezone issues
      const prodUTC = Date.UTC(prodDate.getFullYear(), prodDate.getMonth(), prodDate.getDate());
      const expUTC = Date.UTC(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
      
      if (expUTC <= prodUTC) {
        return res.status(400).json({
          success: false,
          message: "Expiry date must be after production date",
        });
      }
    }

    const meatBatch = await MeatProductivity.findByIdAndUpdate(
      req.params.id,
      { batchName, animalType, meatType, quantity, unit, productionDate, expiryDate, status, healthCondition, notes },
      { new: true, runValidators: true }
    );

    if (!meatBatch) {
      return res.status(404).json({ 
        success: false,
        message: "Meat batch not found" 
      });
    }

    // Emit socket notification
    req.app.get("io").emit("meatUpdated", {
      message: `Meat batch ${meatBatch.batchId} updated successfully`,
      batchId: meatBatch.batchId,
      batchName: meatBatch.batchName,
      type: "success"
    });

    res.status(200).json({
      success: true,
      message: `Meat batch ${meatBatch.batchId} updated successfully`,
      data: meatBatch,
    });
  } catch (error) {
    console.error('Update meat batch error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error updating meat batch",
    });
  }
});

// Delete a meat batch
router.delete("/:id", async (req, res) => {
  try {
    const meatBatch = await MeatProductivity.findByIdAndDelete(req.params.id);
    if (!meatBatch) {
      return res.status(404).json({ 
        success: false,
        message: "Meat batch not found" 
      });
    }

    // Emit socket notification
    req.app.get("io").emit("meatDeleted", {
      message: `Meat batch ${meatBatch.batchId} deleted successfully`,
      batchId: meatBatch.batchId,
      batchName: meatBatch.batchName,
      type: "success"
    });

    res.status(200).json({
      success: true,
      message: `Meat batch ${meatBatch.batchId} deleted successfully`,
    });
  } catch (error) {
    console.error('Delete meat batch error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting meat batch",
    });
  }
});

// Harvest a meat batch
router.post("/:id/harvest", async (req, res) => {
  try {
    const { slaughterDate, totalMeatProduced, storageLocation, harvestNotes } = req.body;
    
    // Validate required fields
    if (!slaughterDate || !totalMeatProduced) {
      return res.status(400).json({
        message: "Slaughter date and total meat produced are required",
      });
    }

    const meatBatch = await MeatProductivity.findById(req.params.id);
    if (!meatBatch) {
      return res.status(404).json({ message: "Meat batch not found" });
    }

    if (!meatBatch.isActive) {
      return res.status(400).json({ message: "Batch has already been harvested" });
    }

    // Create harvest history record
    const harvestRecord = new HarvestHistory({
      batchId: meatBatch.batchId,
      batchName: meatBatch.batchName,
      animalType: meatBatch.animalType,
      meatType: meatBatch.meatType,
      quantity: meatBatch.quantity,
      unit: meatBatch.unit,
      productionDate: meatBatch.productionDate,
      slaughterDate: new Date(slaughterDate),
      totalMeatProduced: totalMeatProduced,
      storageLocation: storageLocation,
      notes: meatBatch.notes,
      harvestNotes: harvestNotes,
      statusAtHarvest: meatBatch.status,
      healthConditionAtHarvest: meatBatch.healthCondition,
    });

    // Update the original batch
    meatBatch.isActive = false;
    meatBatch.slaughterDate = new Date(slaughterDate);
    meatBatch.totalMeatProduced = totalMeatProduced;
    meatBatch.storageLocation = storageLocation;
    meatBatch.harvestNotes = harvestNotes;

    // Save both records
    await meatBatch.save();
    await harvestRecord.save();

    // Emit socket notification
    req.app.get("io").emit("meatHarvested", {
      message: `Meat batch ${meatBatch.batchId} harvested`,
      batchId: meatBatch.batchId,
      batchName: meatBatch.batchName,
      totalMeatProduced: totalMeatProduced,
    });

    res.status(200).json({
      success: true,
      message: "Batch harvested successfully",
      data: meatBatch,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Error harvesting batch",
    });
  }
});

// Get harvest history
router.get("/harvest/history", async (req, res) => {
  try {
    const { animalType, fromDate, toDate, storageLocation } = req.query;
    const query = {};

    if (animalType) query.animalType = { $regex: animalType, $options: "i" };
    if (storageLocation) query.storageLocation = { $regex: storageLocation, $options: "i" };

    if (fromDate || toDate) {
      query.slaughterDate = {};
      if (fromDate) query.slaughterDate.$gte = new Date(fromDate);
      if (toDate) query.slaughterDate.$lte = new Date(toDate);
    }

    const harvestHistory = await HarvestHistory.find(query)
      .sort({ slaughterDate: -1, createdAt: -1 });

    res.status(200).json({ data: harvestHistory });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Error fetching harvest history",
    });
  }
});

// Get comprehensive meat production analytics
router.get("/analytics/production", async (req, res) => {
  try {
    const { period, animalType, startDate, endDate } = req.query;
    
    // Set default date range if not provided
    const now = new Date();
    let defaultStartDate;
    
    switch (period) {
      case "day":
        defaultStartDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        defaultStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case "year":
        defaultStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const queryStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const queryEndDate = endDate ? new Date(endDate) : now;

    let matchStage = {
      slaughterDate: { $gte: queryStartDate, $lte: queryEndDate }
    };
    
    if (animalType) {
      matchStage.animalType = animalType;
    }

    // Get production data by period
    let groupByFormat;
    switch (period) {
      case "day":
        groupByFormat = "%Y-%m-%d";
        break;
      case "week":
        groupByFormat = "%Y-%U";
        break;
      case "month":
        groupByFormat = "%Y-%m";
        break;
      case "year":
        groupByFormat = "%Y";
        break;
      default:
        groupByFormat = "%Y-%m-%d";
    }

    const productionData = await HarvestHistory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: groupByFormat, date: "$slaughterDate" } },
            animalType: "$animalType"
          },
          totalMeat: { $sum: "$totalMeatProduced" },
          batchCount: { $sum: 1 },
          avgMeatPerBatch: { $avg: "$totalMeatProduced" }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Get total statistics
    const totalStats = await HarvestHistory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalMeat: { $sum: "$totalMeatProduced" },
          totalBatches: { $sum: 1 },
          avgMeatPerBatch: { $avg: "$totalMeatProduced" }
        }
      }
    ]);

    // Get animal type distribution
    const animalDistribution = await HarvestHistory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$animalType",
          totalMeat: { $sum: "$totalMeatProduced" },
          batchCount: { $sum: 1 },
          avgMeatPerBatch: { $avg: "$totalMeatProduced" }
        }
      },
      { $sort: { totalMeat: -1 } }
    ]);

    // Get storage locations
    const storageDistribution = await HarvestHistory.aggregate([
      { 
        $match: { 
          ...matchStage,
          storageLocation: { $exists: true, $ne: "" } 
        } 
      },
      {
        $group: {
          _id: "$storageLocation",
          totalMeat: { $sum: "$totalMeatProduced" },
          batchCount: { $sum: 1 }
        }
      },
      { $sort: { totalMeat: -1 } }
    ]);

    // Get active vs harvested counts
    const activeBatches = await MeatProductivity.countDocuments({ isActive: true });
    const harvestedBatches = await MeatProductivity.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      data: {
        period,
        dateRange: {
          start: queryStartDate,
          end: queryEndDate
        },
        productionTrend: productionData,
        totalStats: totalStats[0] || { totalMeat: 0, totalBatches: 0, avgMeatPerBatch: 0 },
        batchStats: {
          active: activeBatches,
          harvested: harvestedBatches,
          total: activeBatches + harvestedBatches
        },
        animalDistribution,
        storageDistribution
      }
    });
  } catch (error) {
    console.error('Production analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching production analytics",
    });
  }
});

// Get detailed meat counts by time period
router.get("/analytics/counts", async (req, res) => {
  try {
    const { period = "month", animalType, startDate, endDate } = req.query;
    
    const now = new Date();
    let defaultStartDate;
    
    switch (period) {
      case "day":
        defaultStartDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        defaultStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case "year":
        defaultStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const queryStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const queryEndDate = endDate ? new Date(endDate) : now;

    let matchStage = {
      slaughterDate: { $gte: queryStartDate, $lte: queryEndDate }
    };
    
    if (animalType) {
      matchStage.animalType = animalType;
    }

    // Get counts by period
    let groupByFormat;
    switch (period) {
      case "day":
        groupByFormat = "%Y-%m-%d";
        break;
      case "week":
        groupByFormat = "%Y-%U";
        break;
      case "month":
        groupByFormat = "%Y-%m";
        break;
      case "year":
        groupByFormat = "%Y";
        break;
      default:
        groupByFormat = "%Y-%m-%d";
    }

    const countsData = await HarvestHistory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: groupByFormat, date: "$slaughterDate" } }
          },
          totalMeat: { $sum: "$totalMeatProduced" },
          batchCount: { $sum: 1 },
          animalTypes: { $addToSet: "$animalType" }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Get summary statistics
    const summaryStats = await HarvestHistory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalMeat: { $sum: "$totalMeatProduced" },
          totalBatches: { $sum: 1 },
          avgMeatPerBatch: { $avg: "$totalMeatProduced" },
          minMeat: { $min: "$totalMeatProduced" },
          maxMeat: { $max: "$totalMeatProduced" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        dateRange: {
          start: queryStartDate,
          end: queryEndDate
        },
        countsData,
        summaryStats: summaryStats[0] || {
          totalMeat: 0,
          totalBatches: 0,
          avgMeatPerBatch: 0,
          minMeat: 0,
          maxMeat: 0
        }
      }
    });
  } catch (error) {
    console.error('Meat counts analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching meat counts",
    });
  }
});

// Get batch statistics
router.get("/dashboard/stats", async (req, res) => {
  try {
    const totalBatches = await MeatProductivity.countDocuments();
    const activeBatches = await MeatProductivity.countDocuments({ isActive: true });
    const freshBatches = await MeatProductivity.countDocuments({ status: "Fresh", isActive: true });
    const nearExpiryBatches = await MeatProductivity.countDocuments({
      expiryDate: {
        $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        $gte: new Date(),
      },
      status: { $nin: ["Sold", "Expired"] },
      isActive: true,
    });
    const criticalBatches = await MeatProductivity.countDocuments({ 
      healthCondition: "Critical",
      isActive: true 
    });

    // Get total meat produced from harvest history
    const totalMeatResult = await HarvestHistory.aggregate([
      {
        $group: {
          _id: null,
          totalMeat: { $sum: "$totalMeatProduced" }
        }
      }
    ]);
    
    const totalMeatProduced = totalMeatResult.length > 0 ? totalMeatResult[0].totalMeat : 0;

    // Get meat type counts for active batches
    const meatTypeCounts = await MeatProductivity.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$meatType",
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get harvested meat types with total quantities from HarvestHistory
    const harvestedMeatTypes = await HarvestHistory.aggregate([
      {
        $group: {
          _id: "$meatType",
          count: { $sum: 1 },
          totalMeatProduced: { $sum: "$totalMeatProduced" }
        }
      },
      { $sort: { totalMeatProduced: -1 } }
    ]);

    res.status(200).json({
      data: {
        totalBatches,
        activeBatches,
        harvestedBatches: totalBatches - activeBatches,
        freshBatches,
        nearExpiryBatches,
        criticalBatches,
        totalMeatProduced,
        meatTypeCounts,
        harvestedMeatTypes
      },
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Error fetching batch statistics",
    });
  }
});

export default router;