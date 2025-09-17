// BACKEND/HealthManagement/Controllers/FertiliserCompanyController.js
import FertiliserCompany from "../Model/FertiliserCompany.js";

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await FertiliserCompany.find();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addCompany = async (req, res) => {
  try {
    const newCompany = new FertiliserCompany(req.body);
    const saved = await newCompany.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const updated = await FertiliserCompany.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    await FertiliserCompany.findByIdAndDelete(req.params.id);
    res.json({ message: "Company deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
