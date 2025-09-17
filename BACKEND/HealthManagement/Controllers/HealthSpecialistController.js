// BACKEND/HealthManagement/Controllers/HealthSpecialistController.js
import HealthSpecialist from "../Model/HealthSpecialistModel.js";

// Get all specialists
export const getAllSpecialists = async (req, res) => {
  try {
    const specialists = await HealthSpecialist.find();
    res.json(specialists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a specialist by ID
export const getById = async (req, res) => {
  try {
    const specialist = await HealthSpecialist.findById(req.params.id);
    if (!specialist) return res.status(404).json({ error: "Specialist not found" });
    res.json(specialist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new specialist
export const addSpecialist = async (req, res) => {
  try {
    const data = req.body;

    // Handle profile photo
    if (req.file) data.profilePhoto = req.file.filename;

    // Convert specializations to array if sent as string
    if (data.specializations && typeof data.specializations === "string") {
      data.specializations = JSON.parse(data.specializations);
    }

    const newSpecialist = new HealthSpecialist(data);
    await newSpecialist.save();
    res.status(201).json(newSpecialist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update specialist
export const updateSpecialist = async (req, res) => {
  try {
    const data = req.body;
    if (req.file) data.profilePhoto = req.file.filename;

    if (data.specializations && typeof data.specializations === "string") {
      data.specializations = JSON.parse(data.specializations);
    }

    const updatedSpecialist = await HealthSpecialist.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true }
    );

    if (!updatedSpecialist) return res.status(404).json({ error: "Specialist not found" });

    res.json(updatedSpecialist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete specialist
export const deleteSpecialist = async (req, res) => {
  try {
    const deleted = await HealthSpecialist.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Specialist not found" });
    res.json({ message: "Specialist deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
