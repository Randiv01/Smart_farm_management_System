import FeedingHistory from "../models/feedingHistoryModel.js";
import AnimalFood from "../../InventoryManagement/Imodels/AnimalFood.js";
import Animal from "../models/Animal.js";
import Zone from "../models/Zone.js";

// Get all animals
export const getAnimals = async (req, res) => {
  try {
    const animals = await Animal.find();
    res.json(animals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all feeds
export const getFeeds = async (req, res) => {
  try {
    const feeds = await AnimalFood.find({ isActive: true });
    res.json(feeds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Schedule feeding
export const scheduleFeeding = async (req, res) => {
  try {
    const { zoneId, foodId, quantity, feedingTimes, notes, immediate } = req.body;

    // Validate zone exists
    const zone = await Zone.findById(zoneId);
    if (!zone) return res.status(404).json({ message: "Zone not found" });

    // Validate feed exists and has enough quantity
    const feed = await AnimalFood.findById(foodId);
    if (!feed) return res.status(404).json({ message: "Feed not found" });
    
    // Calculate total quantity needed for all feeding times
    const totalQuantityNeeded = quantity * feedingTimes.length;
    if (feed.remaining < totalQuantityNeeded) {
      return res.status(400).json({ 
        message: `Not enough feed remaining. Required: ${totalQuantityNeeded}g, Available: ${feed.remaining}g` 
      });
    }

    // Get animals in the selected zone
    const animalsInZone = await Animal.find({ assignedZone: zoneId });
    if (animalsInZone.length === 0) {
      return res.status(400).json({ message: "No animals found in the selected zone" });
    }

    // DO NOT reduce stock here - let automated service handle it when feeding is executed

    // Create feeding history entries for each feeding time
    const feedingEntries = [];
    for (const feedingTime of feedingTimes) {
      if (feedingTime) {
        const feeding = new FeedingHistory({
          zoneId,
          foodId,
          quantity,
          feedingTime,
          notes,
          immediate: immediate || false,
          animalCount: animalsInZone.length,
          status: "scheduled" // Explicitly set status to scheduled
        });
        feedingEntries.push(await feeding.save());
      }
    }

    res.status(201).json({
      message: "Feeding scheduled successfully",
      feedings: feedingEntries,
      zone: zone.name,
      animalCount: animalsInZone.length
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get feeding history
export const getFeedingHistory = async (req, res) => {
  try {
    const history = await FeedingHistory.find()
      .populate("animalId", "name breed")
      .populate("zoneId", "name type")
      .populate("foodId", "name unit")
      .sort({ feedingTime: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create feeding history entry
export const createFeedingHistory = async (req, res) => {
  try {
    const { zoneId, foodId, quantity, feedingTime, notes, immediate, status, executedAt } = req.body;

    const feedingHistory = new FeedingHistory({
      zoneId,
      foodId,
      quantity,
      feedingTime,
      notes,
      immediate: immediate || false,
      animalCount: 1, // Default to 1 for immediate feeding
      status: status || "scheduled", // Use provided status or default to scheduled
      executedAt: executedAt || null // Set execution time if provided
    });

    const savedHistory = await feedingHistory.save();
    res.status(201).json(savedHistory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update feeding history (for cancellation, etc.)
export const updateFeedingHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`Updating feeding history ${id}:`, updateData);

    const updatedHistory = await FeedingHistory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate("zoneId", "name type")
    .populate("foodId", "name remaining unit");

    if (!updatedHistory) {
      return res.status(404).json({ message: "Feeding history not found" });
    }

    console.log(`Feeding history updated successfully:`, updatedHistory);
    res.json(updatedHistory);
  } catch (err) {
    console.error("Error updating feeding history:", err);
    res.status(400).json({ message: err.message });
  }
};
