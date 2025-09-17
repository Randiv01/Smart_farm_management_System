// BACKEND/HealthManagement/Controllers/H_FertiliserController.js
import Fertiliser from "../Model/H_Fertiliser.js";

// Get all fertilisers
export const getFertilisers = async (req, res) => {
  try {
    const fertilisers = await Fertiliser.find().sort({ createdAt: -1 });
    res.json(fertilisers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get fertiliser by ID
export const getFertiliserById = async (req, res) => {
  try {
    const fertiliser = await Fertiliser.findById(req.params.id);
    if (!fertiliser) return res.status(404).json({ message: "Fertiliser not found" });
    res.json(fertiliser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create fertiliser
export const createFertiliser = async (req, res) => {
  try {
    const fertiliser = new Fertiliser(req.body);
    const saved = await fertiliser.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update fertiliser
export const updateFertiliser = async (req, res) => {
  try {
    const updated = await Fertiliser.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Fertiliser not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete fertiliser
export const deleteFertiliser = async (req, res) => {
  try {
    const deleted = await Fertiliser.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Fertiliser not found" });
    res.json({ message: "Fertiliser deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
