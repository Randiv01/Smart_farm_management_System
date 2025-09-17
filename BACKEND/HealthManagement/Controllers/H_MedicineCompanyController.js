// BACKEND/HealthManagement/Controllers/H_MedicineCompanyController.js
import H_MedicineCompany from "../Model/H_MedicineCompanyModel.js";

export const addCompany = async (req, res) => {
  try {
    const company = await H_MedicineCompany.create(req.body);
    res.status(201).json({ message: "Company added", company });
  } catch (err) {
    console.error("addCompany error:", err);
    res.status(400).json({ error: err.message });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await H_MedicineCompany.find();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const company = await H_MedicineCompany.findById(req.params.id);
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const updated = await H_MedicineCompany.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Company not found" });
    res.json({ message: "Company updated", company: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const deleted = await H_MedicineCompany.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Company not found" });
    res.json({ message: "Company deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
