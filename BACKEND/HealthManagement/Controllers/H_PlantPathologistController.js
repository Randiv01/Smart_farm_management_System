import PlantPathologist from "../Model/H_PlantPathologistModel.js";

// Get all entries
export const getAll = async (req, res) => {
  try {
    const data = await PlantPathologist.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new entry
export const create = async (req, res) => {
  try {
    const data = req.body;

    if (req.file) data.profilePhoto = req.file.filename;

    // Convert specializations string to array
    if (data.specializations && typeof data.specializations === "string") {
      data.specializations = data.specializations.split(",").map(s => s.trim());
    }

    const newEntry = await new PlantPathologist(data).save();
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update existing entry
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    if (req.file) data.profilePhoto = req.file.filename;

    if (data.specializations && typeof data.specializations === "string") {
      data.specializations = data.specializations.split(",").map(s => s.trim());
    }

    const updated = await PlantPathologist.findByIdAndUpdate(id, data, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete entry
export const del = async (req, res) => {
  try {
    await PlantPathologist.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
