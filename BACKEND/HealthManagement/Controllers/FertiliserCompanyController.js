// BACKEND/HealthManagement/Controllers/FertiliserCompanyController.js
import FertiliserCompany from "../Model/FertiliserCompany.js";

// Get all fertiliser companies
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await FertiliserCompany.find();
    res.status(200).json(companies);
  } catch (err) {
    console.error("Error fetching companies:", err);
    res.status(500).json({ message: "Failed to fetch companies", error: err.message });
  }
};

// Add a new fertiliser company
export const addCompany = async (req, res) => {
  try {
    const newCompany = new FertiliserCompany(req.body);
    const savedCompany = await newCompany.save();
    res.status(201).json({ message: "Company added successfully", company: savedCompany });
  } catch (err) {
    console.error("Error adding company:", err);
    res.status(400).json({ message: "Failed to add company", error: err.message });
  }
};

// Update an existing fertiliser company by ID
export const updateCompany = async (req, res) => {
  try {
    const updatedCompany = await FertiliserCompany.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ message: "Company updated successfully", company: updatedCompany });
  } catch (err) {
    console.error("Error updating company:", err);
    res.status(400).json({ message: "Failed to update company", error: err.message });
  }
};

// Delete a fertiliser company by ID
export const deleteCompany = async (req, res) => {
  try {
    const deletedCompany = await FertiliserCompany.findByIdAndDelete(req.params.id);

    if (!deletedCompany) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ message: "Company deleted successfully" });
  } catch (err) {
    console.error("Error deleting company:", err);
    res.status(400).json({ message: "Failed to delete company", error: err.message });
  }
};
