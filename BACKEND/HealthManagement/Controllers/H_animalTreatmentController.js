import mongoose from "mongoose";
import H_AnimalTreatment from "../Model/H_animalTreatmentModel.js";
import { decreaseMultipleMedicines } from "./H_MediStoreController.js";

export const addAnimalTreatment = async (req, res) => {
  try {
    const {
      animalType,
      animalCode,
      doctor,
      specialist,
      medicines,
      notes,
      status
    } = req.body;

    // Parse medicines from JSON string if needed
    const medicinesArray = typeof medicines === 'string' ? JSON.parse(medicines) : medicines;

    // Create treatment record
    const treatmentData = {
      animalType,
      animalCode,
      doctor,
      specialist: specialist || null,
      medicines: medicinesArray || [],
      notes: notes || "",
      status: status || "active",
      treatmentDate: new Date()
    };

    // Handle file upload
    if (req.file) {
      treatmentData.reports = `/Health_uploads/${req.file.filename}`;
    }

    const newTreatment = new H_AnimalTreatment(treatmentData);
    const savedTreatment = await newTreatment.save();

    // Decrease medicine quantities if medicines are selected
    if (medicinesArray && medicinesArray.length > 0) {
      try {
        const medicineDecreaseData = medicinesArray.map(medicineId => ({
          medicineId,
          decreaseAmount: 1 // Decrease by 1 unit for each selected medicine
        }));

        await decreaseMultipleMedicines(
          { body: { medicines: medicineDecreaseData } },
          { 
            status: () => ({ json: () => {} }),
            json: () => {}
          }
        );

        console.log(`✅ Decreased quantities for ${medicinesArray.length} medicines`);
      } catch (medicineError) {
        console.error("❌ Error decreasing medicine quantities:", medicineError);
        // Continue with treatment creation even if medicine update fails
      }
    }

    // Emit socket event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.emit("treatment-added", savedTreatment);
      io.emit("medicine-stock-updated", { medicines: medicinesArray });
    }

    res.status(201).json({
      success: true,
      message: "Animal treatment record created successfully",
      data: savedTreatment
    });

  } catch (err) {
    console.error("❌ Error creating animal treatment:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      details: "Failed to create animal treatment record"
    });
  }
};

export const getAnimalTreatments = async (req, res) => {
  try {
    const treatments = await H_AnimalTreatment.find()
      .populate('doctor', 'fullName specialization')
      .populate('specialist', 'fullName specialization')
      .populate('medicines', 'medicine_name quantity_available unit')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: treatments
    });
  } catch (err) {
    console.error("❌ Error fetching animal treatments:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const getAnimalTreatmentById = async (req, res) => {
  try {
    const treatment = await H_AnimalTreatment.findById(req.params.id)
      .populate('doctor', 'fullName specialization')
      .populate('specialist', 'fullName specialization')
      .populate('medicines', 'medicine_name quantity_available unit');

    if (!treatment) {
      return res.status(404).json({
        success: false,
        error: "Animal treatment not found"
      });
    }

    res.status(200).json({
      success: true,
      data: treatment
    });
  } catch (err) {
    console.error("❌ Error fetching animal treatment:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const updateAnimalTreatment = async (req, res) => {
  try {
    const {
      animalType,
      animalCode,
      doctor,
      specialist,
      medicines,
      notes,
      status
    } = req.body;

    const updateData = {
      animalType,
      animalCode,
      doctor,
      specialist: specialist || null,
      notes: notes || "",
      status: status || "active"
    };

    // Parse medicines from JSON string if needed
    if (medicines) {
      const medicinesArray = typeof medicines === 'string' ? JSON.parse(medicines) : medicines;
      updateData.medicines = medicinesArray;

      // Get current treatment to compare medicine changes
      const currentTreatment = await H_AnimalTreatment.findById(req.params.id);
      if (currentTreatment) {
        const oldMedicines = currentTreatment.medicines.map(m => m.toString());
        const newMedicines = medicinesArray;

        // Find medicines that were removed (no need to increase stock)
        // Find medicines that were added (need to decrease stock)
        const addedMedicines = newMedicines.filter(med => !oldMedicines.includes(med));
        
        if (addedMedicines.length > 0) {
          try {
            const medicineDecreaseData = addedMedicines.map(medicineId => ({
              medicineId,
              decreaseAmount: 1
            }));

            await decreaseMultipleMedicines(
              { body: { medicines: medicineDecreaseData } },
              { 
                status: () => ({ json: () => {} }),
                json: () => {}
              }
            );

            console.log(`✅ Decreased quantities for ${addedMedicines.length} newly added medicines`);
          } catch (medicineError) {
            console.error("❌ Error decreasing medicine quantities during update:", medicineError);
          }
        }
      }
    }

    // Handle file upload
    if (req.file) {
      updateData.reports = `/Health_uploads/${req.file.filename}`;
    }

    const updatedTreatment = await H_AnimalTreatment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('doctor', 'fullName specialization')
      .populate('specialist', 'fullName specialization')
      .populate('medicines', 'medicine_name quantity_available unit');

    if (!updatedTreatment) {
      return res.status(404).json({
        success: false,
        error: "Animal treatment not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Animal treatment updated successfully",
      data: updatedTreatment
    });

  } catch (err) {
    console.error("❌ Error updating animal treatment:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const deleteAnimalTreatment = async (req, res) => {
  try {
    const deletedTreatment = await H_AnimalTreatment.findByIdAndDelete(req.params.id);

    if (!deletedTreatment) {
      return res.status(404).json({
        success: false,
        error: "Animal treatment not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Animal treatment deleted successfully"
    });
  } catch (err) {
    console.error("❌ Error deleting animal treatment:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const updateTreatmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const updatedTreatment = await H_AnimalTreatment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('doctor', 'fullName specialization')
      .populate('specialist', 'fullName specialization')
      .populate('medicines', 'medicine_name quantity_available unit');

    if (!updatedTreatment) {
      return res.status(404).json({
        success: false,
        error: "Animal treatment not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Treatment status updated successfully",
      data: updatedTreatment
    });
  } catch (err) {
    console.error("❌ Error updating treatment status:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};