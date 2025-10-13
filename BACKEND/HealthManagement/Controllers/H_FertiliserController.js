import Fertiliser from "../Model/H_Fertiliser.js";

export const getFertilisers = async (req, res) => {
  try {
    const items = await Fertiliser.find().sort({ updatedAt: -1 });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getFertiliserById = async (req, res) => {
  try {
    const item = await Fertiliser.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Fertiliser not found" });
    res.status(200).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createFertiliser = async (req, res) => {
  try {
    const saved = await new Fertiliser(req.body).save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateFertiliser = async (req, res) => {
  try {
    const updated = await Fertiliser.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Fertiliser not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteFertiliser = async (req, res) => {
  try {
    const deleted = await Fertiliser.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Fertiliser not found" });
    res.status(200).json({ message: "Fertiliser deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// New function to decrease fertiliser stock
export const decreaseFertiliserStock = async (req, res) => {
  try {
    const { fertiliserId, amount = 1 } = req.body;
    
    if (!fertiliserId) {
      return res.status(400).json({ message: "Fertiliser ID is required" });
    }

    const fertiliser = await Fertiliser.findById(fertiliserId);
    if (!fertiliser) {
      return res.status(404).json({ message: "Fertiliser not found" });
    }

    // Check if sufficient stock is available
    if (fertiliser.currentStock < amount) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${fertiliser.currentStock} ${fertiliser.unit} available.` 
      });
    }

    // Decrease the stock
    fertiliser.currentStock -= amount;
    const updatedFertiliser = await fertiliser.save();

    res.status(200).json({
      message: `Stock decreased successfully. Remaining: ${updatedFertiliser.currentStock} ${updatedFertiliser.unit}`,
      fertiliser: updatedFertiliser
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};