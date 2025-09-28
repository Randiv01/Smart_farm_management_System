import FeedingHistory from "../models/feedingHistoryModel.js";
import FeedStock from "../models/feedStockModel.js";
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
    const feeds = await FeedStock.find();
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
    const feed = await FeedStock.findById(foodId);
    if (!feed) return res.status(404).json({ message: "Feed not found" });
    if (feed.remaining < quantity) return res.status(400).json({ message: "Not enough feed remaining" });

    // Get animals in the selected zone
    const animalsInZone = await Animal.find({ assignedZone: zoneId });
    if (animalsInZone.length === 0) {
      return res.status(400).json({ message: "No animals found in the selected zone" });
    }

    // Update feed stock
    feed.remaining -= quantity;
    await feed.save();

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
          animalCount: animalsInZone.length
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
      .populate("foodId", "foodName")
      .sort({ feedingTime: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
