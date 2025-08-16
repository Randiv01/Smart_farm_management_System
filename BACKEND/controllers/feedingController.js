import FeedingHistory from "../models/feedingHistoryModel.js";
import FeedStock from "../models/feedStockModel.js";
import Animal from "../models/animalModel.js";

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
    const { animalId, foodId, quantity, feedingTime, notes } = req.body;

    const feed = await FeedStock.findById(foodId);
    if (!feed) return res.status(404).json({ message: "Feed not found" });
    if (feed.remaining < quantity) return res.status(400).json({ message: "Not enough feed remaining" });

    feed.remaining -= quantity;
    await feed.save();

    const feeding = new FeedingHistory({
      animalId,
      foodId,
      quantity,
      feedingTime,
      notes
    });

    const saved = await feeding.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get feeding history
export const getFeedingHistory = async (req, res) => {
  try {
    const history = await FeedingHistory.find()
      .populate("animalId", "name breed")
      .populate("foodId", "foodName")
      .sort({ feedingTime: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
