import Fertilizing from "../models/fertilizingModel.js";

// GET all records (with optional date range)
export const getFertilizingRecords = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const records = await Fertilizing.find(query).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ADD new record
export const addFertilizingRecord = async (req, res) => {
  try {
    const newRecord = new Fertilizing(req.body);
    const saved = await newRecord.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE record
export const updateFertilizingRecord = async (req, res) => {
  try {
    const updated = await Fertilizing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE record
export const deleteFertilizingRecord = async (req, res) => {
  try {
    await Fertilizing.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
