import PlantPathologist from "../Model/H_PlantPathologistModel.js";

// Get all entries
export const getAll = async (_req, res) => {
  try {
    const data = await PlantPathologist.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single entry by ID
export const getOne = async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await PlantPathologist.findById(id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new entry
export const create = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.file) data.profilePhoto = req.file.filename;

    if (typeof data.specializations === "string") {
      data.specializations = data.specializations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (data.yearsOfExperience !== undefined) {
      data.yearsOfExperience = Number(data.yearsOfExperience) || 0;
    }
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);

    if (!data.profilePhoto || data.profilePhoto === "null") delete data.profilePhoto;

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
    const data = { ...req.body };

    if (req.file) {
      data.profilePhoto = req.file.filename;
    } else {
      if (!data.profilePhoto || data.profilePhoto === "null") {
        delete data.profilePhoto;
      }
    }

    if (typeof data.specializations === "string") {
      data.specializations = data.specializations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (data.yearsOfExperience !== undefined) {
      data.yearsOfExperience = Number(data.yearsOfExperience) || 0;
    }
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);

    const updated = await PlantPathologist.findByIdAndUpdate(id, data, { new: true });
    if (!updated) return res.status(404).json({ error: "Not found" });
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