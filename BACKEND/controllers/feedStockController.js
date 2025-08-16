import FeedStock from "../models/feedStockModel.js";

// Get all feed stocks
export const getFeedStocks = async (req, res) => {
  try {
    const feeds = await FeedStock.find().sort({ createdAt: -1 });
    res.json(feeds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create feed stock
export const createFeedStock = async (req, res) => {
  try {
    const { foodName, quantity, unit, targetAnimal, notes, addDate, expiryDate, supId } = req.body;

    const feed = new FeedStock({
      foodName,
      quantity,
      remaining: quantity,   // initialize remaining to quantity
      unit,
      targetAnimal,
      notes,
      addDate,
      expiryDate,
      supId
    });

    const savedFeed = await feed.save();
    res.status(201).json(savedFeed);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update feed stock
export const updateFeedStock = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFeed = await FeedStock.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedFeed) {
      return res.status(404).json({ message: "Feed stock not found" });
    }

    res.json(updatedFeed);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete feed stock
export const deleteFeedStock = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await FeedStock.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Feed stock not found" });
    }

    res.json({ message: "Feed stock deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
