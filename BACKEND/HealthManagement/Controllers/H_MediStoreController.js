import mongoose from "mongoose";
import H_MediStore from "../Model/H_mediStoreModel.js";

export const addMedicine = async (req, res) => {
  try {
    const savedMedicine = await new H_MediStore(req.body).save();
    res.status(201).json(savedMedicine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMedicines = async (req, res) => {
  try {
    const medicines = await H_MediStore.find().sort({ updatedAt: -1 });
    res.status(200).json(medicines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMedicineById = async (req, res) => {
  try {
    const medicine = await H_MediStore.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });
    res.status(200).json(medicine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const updatedMedicine = await H_MediStore.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedMedicine) return res.status(404).json({ message: "Medicine not found" });
    res.status(200).json(updatedMedicine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const deletedMedicine = await H_MediStore.findByIdAndDelete(req.params.id);
    if (!deletedMedicine) return res.status(404).json({ message: "Medicine not found" });
    res.status(200).json({ message: "Medicine deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// New function to decrease medicine quantity
export const decreaseMedicineQuantity = async (req, res) => {
  try {
    const { medicineId, decreaseAmount = 1 } = req.body;
    
    if (!medicineId) {
      return res.status(400).json({ message: "Medicine ID is required" });
    }

    const medicine = await H_MediStore.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    const currentQuantity = Number(medicine.quantity_available) || 0;
    const newQuantity = Math.max(0, currentQuantity - decreaseAmount);

    const updatedMedicine = await H_MediStore.findByIdAndUpdate(
      medicineId,
      { quantity_available: newQuantity },
      { new: true }
    );

    res.status(200).json({
      message: "Medicine quantity updated successfully",
      medicine: updatedMedicine
    });
  } catch (err) {
    console.error("Error decreasing medicine quantity:", err);
    res.status(500).json({ message: err.message });
  }
};

// New function to decrease multiple medicines quantities
export const decreaseMultipleMedicines = async (req, res) => {
  try {
    const { medicines } = req.body; // Array of { medicineId, decreaseAmount }
    
    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: "Medicines array is required" });
    }

    const updateOperations = [];
    const updatedMedicines = [];

    for (const item of medicines) {
      const { medicineId, decreaseAmount = 1 } = item;
      
      if (!medicineId) {
        continue; // Skip invalid entries
      }

      const medicine = await H_MediStore.findById(medicineId);
      if (!medicine) {
        continue; // Skip if medicine not found
      }

      const currentQuantity = Number(medicine.quantity_available) || 0;
      const newQuantity = Math.max(0, currentQuantity - decreaseAmount);

      updateOperations.push(
        H_MediStore.findByIdAndUpdate(
          medicineId,
          { quantity_available: newQuantity },
          { new: true }
        )
      );
    }

    const results = await Promise.all(updateOperations);
    updatedMedicines.push(...results.filter(med => med !== null));

    res.status(200).json({
      message: "Medicines quantities updated successfully",
      updatedMedicines,
      count: updatedMedicines.length
    });
  } catch (err) {
    console.error("Error decreasing multiple medicines quantities:", err);
    res.status(500).json({ message: err.message });
  }
};