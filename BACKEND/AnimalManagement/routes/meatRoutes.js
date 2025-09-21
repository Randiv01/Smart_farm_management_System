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
      message: `New meat batch ${meatBatch.batchId} added`,
      batchId: meatBatch.batchId,
      batchName: meatBatch.batchName,
    });

    res.status(201).json({
      message: "Meat batch created successfully",
      data: meatBatch,
    });
  } catch (error) {
    res.status(400).json({
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

    const meatBatch = await MeatProductivity.findByIdAndUpdate(
      req.params.id,
      { batchName, animalType, meatType, quantity, unit, productionDate, expiryDate, status, healthCondition, notes },
      { new: true, runValidators: true }
    );

    if (!meatBatch) return res.status(404).json({ message: "Meat batch not found" });

    // Emit socket notification
    req.app.get("io").emit("meatUpdated", {
      message: `Meat batch ${meatBatch.batchId} updated`,
      batchId: meatBatch.batchId,
      batchName: meatBatch.batchName,
    });

    res.status(200).json({
      message: "Meat batch updated successfully",
      data: meatBatch,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Error updating meat batch",
    });
  }
});

// Delete a meat batch
router.delete("/:id", async (req, res) => {
  try {
    const meatBatch = await MeatProductivity.findByIdAndDelete(req.params.id);
    if (!meatBatch) return res.status(404).json({ message: "Meat batch not found" });

    // Emit socket notification
    req.app.get("io").emit("meatDeleted", {
      message: `Meat batch ${meatBatch.batchId} deleted`,
      batchId: meatBatch.batchId,
      batchName: meatBatch.batchName,
    });

    res.status(200).json({
      message: "Meat batch deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
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

// Get meat production analytics
router.get("/analytics/production", async (req, res) => {
  try {
    const { period, animalType } = req.query; // period: day, week, month, year
    
    let groupByFormat, dateField;
    
    switch (period) {
      case "day":
        groupByFormat = "%Y-%m-%d";
        dateField = "slaughterDate";
        break;
      case "week":
        groupByFormat = "%Y-%U";
        dateField = "slaughterDate";
        break;
      case "month":
        groupByFormat = "%Y-%m";
        dateField = "slaughterDate";
        break;
      case "year":
        groupByFormat = "%Y";
        dateField = "slaughterDate";
        break;
      default:
        groupByFormat = "%Y-%m";
        dateField = "slaughterDate";
    }

    let matchStage = {};
    if (animalType) {
      matchStage.animalType = animalType;
    }

    const productionData = await HarvestHistory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: groupByFormat, date: `$${dateField}` } },
            animalType: "$animalType"
          },
          totalMeat: { $sum: "$totalMeatProduced" },
          batchCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Get active vs harvested counts
    const activeBatches = await MeatProductivity.countDocuments({ isActive: true });
    const harvestedBatches = await MeatProductivity.countDocuments({ isActive: false });

    // Get animal type distribution
    const animalDistribution = await HarvestHistory.aggregate([
      {
        $group: {
          _id: "$animalType",
          totalMeat: { $sum: "$totalMeatProduced" },
          batchCount: { $sum: 1 }
        }
      }
    ]);

    // Get storage locations
    const storageDistribution = await HarvestHistory.aggregate([
      { $match: { storageLocation: { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: "$storageLocation",
          totalMeat: { $sum: "$totalMeatProduced" },
          batchCount: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      data: {
        productionTrend: productionData,
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
    res.status(400).json({
      message: error.message || "Error fetching production analytics",
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

    res.status(200).json({
      data: {
        totalBatches,
        activeBatches,
        harvestedBatches: totalBatches - activeBatches,
        freshBatches,
        nearExpiryBatches,
        criticalBatches,
        totalMeatProduced
      },
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Error fetching batch statistics",
    });
  }
});

export default router;