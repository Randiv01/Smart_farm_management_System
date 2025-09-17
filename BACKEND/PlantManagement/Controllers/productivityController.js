// BACKEND/PlantManagement/Controllers/productivityController.js
import Productivity from '../models/productivityModel.js';

// GET /api/productivity
export const getAllRecords = async (req, res) => {
  try {
    const { plantType } = req.query;
    let records;
    if (plantType) {
      records = await Productivity.find({ plantType });
    } else {
      records = await Productivity.find();
    }
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/productivity
export const addRecord = async (req, res) => {
  try {
    const newRecord = new Productivity(req.body);
    const saved = await newRecord.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/productivity/:id
export const updateRecord = async (req, res) => {
  try {
    const updated = await Productivity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/productivity/:id
export const deleteRecord = async (req, res) => {
  try {
    await Productivity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
