// HealthManagement/Controllers/H_plantTreatmentController.js
import H_PlantTreatment from "../Model/H_PlantTreatmentModel.js";
import Fertiliser from "../Model/H_Fertiliser.js";
import path from "path";
import fs from "fs";

const absPath = (relPath) => {
  if (!relPath) return "";
  return path.join(process.cwd(), relPath.startsWith("/") ? relPath.slice(1) : relPath);
};

export const createTreatment = async (req, res) => {
  try {
    const {
      plantType, plantCode, pathologist, fertiliser,
      pestControl, treatmentDate, notes, status, effectiveness
    } = req.body;

    const reports = req.file ? `/uploads/${req.file.filename}` : "";

    // Create new treatment document
    const newDoc = new H_PlantTreatment({
      plantType, plantCode, pathologist, fertiliser,
      pestControl, treatmentDate, notes, reports, status, 
      effectiveness: Number(effectiveness || 0)
    });

    // ✅ NEW FEATURE: Decrease fertiliser stock by 1 unit
    if (fertiliser && fertiliser.trim() !== "") {
      const fertiliserDoc = await Fertiliser.findById(fertiliser);
      if (fertiliserDoc) {
        if (fertiliserDoc.currentStock > 0) {
          fertiliserDoc.currentStock -= 1;
          await fertiliserDoc.save();
          console.log(`✅ Fertiliser stock decreased: ${fertiliserDoc.name} - New stock: ${fertiliserDoc.currentStock} ${fertiliserDoc.unit}`);
        } else {
          return res.status(400).json({ 
            success: false, 
            error: `Insufficient stock for ${fertiliserDoc.name}. Current stock: 0 ${fertiliserDoc.unit}` 
          });
        }
      } else {
        return res.status(404).json({ 
          success: false, 
          error: "Selected fertiliser not found" 
        });
      }
    }

    const saved = await newDoc.save();
    const populated = await H_PlantTreatment.findById(saved._id)
      .populate("pathologist", "fullName")
      .populate("fertiliser", "name type company currentStock unit supplierName");

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error("createTreatment error:", err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
};

export const getAllTreatments = async (req, res) => {
  try {
    const records = await H_PlantTreatment.find()
      .sort({ createdAt: -1 })
      .populate("pathologist", "fullName")
      .populate("fertiliser", "name type company currentStock unit supplierName");
    res.json({ success: true, data: records });
  } catch (err) {
    console.error("getAllTreatments error:", err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
};

export const getTreatmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await H_PlantTreatment.findById(id)
      .populate("pathologist", "fullName")
      .populate("fertiliser", "name type company currentStock unit supplierName");
    
    if (!record) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }
    
    res.json({ success: true, data: record });
  } catch (err) {
    console.error("getTreatmentById error:", err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
};

export const updateTreatment = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const existing = await H_PlantTreatment.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }

    // ✅ NEW FEATURE: Handle fertiliser stock when updating treatment
    const oldFertiliserId = existing.fertiliser?.toString();
    const newFertiliserId = payload.fertiliser;

    // If fertiliser is changed, update stock accordingly
    if (newFertiliserId && newFertiliserId !== oldFertiliserId) {
      // Decrease stock for new fertiliser
      const newFertiliser = await Fertiliser.findById(newFertiliserId);
      if (newFertiliser) {
        if (newFertiliser.currentStock > 0) {
          newFertiliser.currentStock -= 1;
          await newFertiliser.save();
          console.log(`✅ New fertiliser stock decreased: ${newFertiliser.name} - New stock: ${newFertiliser.currentStock} ${newFertiliser.unit}`);
        } else {
          return res.status(400).json({ 
            success: false, 
            error: `Insufficient stock for ${newFertiliser.name}. Current stock: 0 ${newFertiliser.unit}` 
          });
        }
      }

      // Increase stock for old fertiliser (if it existed)
      if (oldFertiliserId) {
        const oldFertiliser = await Fertiliser.findById(oldFertiliserId);
        if (oldFertiliser) {
          oldFertiliser.currentStock += 1;
          await oldFertiliser.save();
          console.log(`✅ Old fertiliser stock restored: ${oldFertiliser.name} - New stock: ${oldFertiliser.currentStock} ${oldFertiliser.unit}`);
        }
      }
    }

    // If a new file uploaded, delete old file and save new path
    if (req.file) {
      if (existing.reports) {
        const old = absPath(existing.reports);
        if (fs.existsSync(old)) {
          try { 
            fs.unlinkSync(old); 
          } catch (e) { 
            console.warn("Could not delete old report:", e.message); 
          }
        }
      }
      existing.reports = `/uploads/${req.file.filename}`;
    }

    // Update fields (only if provided)
    const fields = [
      "plantType", "plantCode", "pathologist", "fertiliser", 
      "pestControl", "treatmentDate", "notes", "status"
    ];
    
    fields.forEach(f => {
      if (payload[f] !== undefined && payload[f] !== null) {
        existing[f] = payload[f];
      }
    });

    if (payload.effectiveness !== undefined) {
      existing.effectiveness = Number(payload.effectiveness);
    }

    const saved = await existing.save();

    const populated = await H_PlantTreatment.findById(saved._id)
      .populate("pathologist", "fullName")
      .populate("fertiliser", "name type company currentStock unit supplierName");

    res.json({ success: true, data: populated });
  } catch (err) {
    console.error("updateTreatment error:", err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
};

export const deleteTreatment = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await H_PlantTreatment.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }

    // ✅ NEW FEATURE: Restore fertiliser stock when deleting treatment
    if (existing.fertiliser) {
      const fertiliserDoc = await Fertiliser.findById(existing.fertiliser);
      if (fertiliserDoc) {
        fertiliserDoc.currentStock += 1;
        await fertiliserDoc.save();
        console.log(`✅ Fertiliser stock restored on delete: ${fertiliserDoc.name} - New stock: ${fertiliserDoc.currentStock} ${fertiliserDoc.unit}`);
      }
    }

    if (existing.reports) {
      const filePath = absPath(existing.reports);
      if (fs.existsSync(filePath)) {
        try { 
          fs.unlinkSync(filePath); 
        } catch (e) { 
          console.warn("Failed removing file:", e.message); 
        }
      }
    }

    await H_PlantTreatment.findByIdAndDelete(id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    console.error("deleteTreatment error:", err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
};