import DoctorTreatment from "../Model/DoctorTreatmentModel.js";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to delete file
const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`File deleted: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting file: ${filePath}`, error);
    }
  }
};

// @desc    Get all treatment records
// @route   GET /api/doctor-treatments
// @access  Public
export const getAllTreatments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      animalType,
      doctor,
      status,
      animalCode,
      startDate,
      endDate,
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (animalType) filter.animalType = { $regex: animalType, $options: "i" };
    if (doctor) filter.doctor = doctor;
    if (status) filter.status = status;
    if (animalCode) filter.animalCode = { $regex: animalCode, $options: "i" };
    
    // Date range filter
    if (startDate || endDate) {
      filter.treatmentDate = {};
      if (startDate) filter.treatmentDate.$gte = new Date(startDate);
      if (endDate) filter.treatmentDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const treatments = await DoctorTreatment.find(filter)
      .populate("doctor", "fullName email phoneNumber")
      .populate("specialist", "fullName specialization phoneNumber")
      .populate("medicines", "medicine_name quantity_available price")
      .sort({ treatmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DoctorTreatment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: treatments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get all treatments error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching treatment records",
      error: error.message,
    });
  }
};

// @desc    Get single treatment record
// @route   GET /api/doctor-treatments/:id
// @access  Public
export const getTreatmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid treatment ID",
      });
    }

    const treatment = await DoctorTreatment.findById(id)
      .populate("doctor", "fullName email phoneNumber")
      .populate("specialist", "fullName specialization phoneNumber")
      .populate("medicines", "medicine_name quantity_available price description");

    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: "Treatment record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: treatment,
    });
  } catch (error) {
    console.error("Get treatment by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching treatment record",
      error: error.message,
    });
  }
};

// @desc    Get treatments by animal code
// @route   GET /api/doctor-treatments/animal/:animalCode
// @access  Public
export const getTreatmentsByAnimalCode = async (req, res) => {
  try {
    const { animalCode } = req.params;

    const treatments = await DoctorTreatment.findByAnimalCode(animalCode);

    res.status(200).json({
      success: true,
      data: treatments,
      count: treatments.length,
    });
  } catch (error) {
    console.error("Get treatments by animal code error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching treatments for animal",
      error: error.message,
    });
  }
};

// @desc    Get treatments by doctor
// @route   GET /api/doctor-treatments/doctor/:doctorId
// @access  Public
export const getTreatmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    const treatments = await DoctorTreatment.findByDoctor(doctorId);

    res.status(200).json({
      success: true,
      data: treatments,
      count: treatments.length,
    });
  } catch (error) {
    console.error("Get treatments by doctor error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor treatments",
      error: error.message,
    });
  }
};

// @desc    Create new treatment record
// @route   POST /api/doctor-treatments
// @access  Public
export const createTreatment = async (req, res) => {
  try {
    const { animalType, animalCode, doctor, specialist, medicines, notes } = req.body;

    // Validation
    if (!animalType || !animalCode || !doctor) {
      return res.status(400).json({
        success: false,
        message: "Animal type, animal code, and doctor are required",
        errors: {
          animalType: !animalType ? "Animal type is required" : null,
          animalCode: !animalCode ? "Animal code is required" : null,
          doctor: !doctor ? "Doctor is required" : null,
        },
      });
    }

    // Validate doctor ID
    if (!mongoose.Types.ObjectId.isValid(doctor)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    // Validate specialist ID if provided
    if (specialist && !mongoose.Types.ObjectId.isValid(specialist)) {
      return res.status(400).json({
        success: false,
        message: "Invalid specialist ID",
      });
    }

    // Parse medicines array
    let medicinesArray = [];
    if (medicines) {
      try {
        medicinesArray = typeof medicines === 'string' ? JSON.parse(medicines) : medicines;
        
        // Validate medicine IDs
        for (const medicineId of medicinesArray) {
          if (!mongoose.Types.ObjectId.isValid(medicineId)) {
            return res.status(400).json({
              success: false,
              message: `Invalid medicine ID: ${medicineId}`,
            });
          }
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid medicines format",
        });
      }
    }

    // Prepare treatment data
    const treatmentData = {
      animalType: animalType.trim(),
      animalCode: animalCode.trim(),
      doctor,
      specialist: specialist || null,
      medicines: medicinesArray,
      notes: notes ? notes.trim() : "",
    };

    // Handle file upload
    if (req.file) {
      treatmentData.reports = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      };
    }

    // Create treatment record
    const treatment = new DoctorTreatment(treatmentData);
    const savedTreatment = await treatment.save();

    // Populate the saved treatment
    const populatedTreatment = await DoctorTreatment.findById(savedTreatment._id)
      .populate("doctor", "fullName email phoneNumber")
      .populate("specialist", "fullName specialization phoneNumber")
      .populate("medicines", "medicine_name quantity_available price");

    res.status(201).json({
      success: true,
      message: "Treatment record created successfully",
      data: populatedTreatment,
    });
  } catch (error) {
    console.error("Create treatment error:", error);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      deleteFile(req.file.path);
    }

    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating treatment record",
      error: error.message,
    });
  }
};

// @desc    Update treatment record
// @route   PUT /api/doctor-treatments/:id
// @access  Public
export const updateTreatment = async (req, res) => {
  try {
    const { id } = req.params;
    const { animalType, animalCode, doctor, specialist, medicines, notes, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid treatment ID",
      });
    }

    // Find existing treatment
    const existingTreatment = await DoctorTreatment.findById(id);
    if (!existingTreatment) {
      return res.status(404).json({
        success: false,
        message: "Treatment record not found",
      });
    }

    // Prepare update data
    const updateData = {};
    
    if (animalType) updateData.animalType = animalType.trim();
    if (animalCode) updateData.animalCode = animalCode.trim();
    if (doctor) {
      if (!mongoose.Types.ObjectId.isValid(doctor)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor ID",
        });
      }
      updateData.doctor = doctor;
    }
    
    if (specialist !== undefined) {
      if (specialist && !mongoose.Types.ObjectId.isValid(specialist)) {
        return res.status(400).json({
          success: false,
          message: "Invalid specialist ID",
        });
      }
      updateData.specialist = specialist || null;
    }
    
    if (medicines !== undefined) {
      try {
        const medicinesArray = typeof medicines === 'string' ? JSON.parse(medicines) : medicines;
        
        // Validate medicine IDs
        for (const medicineId of medicinesArray) {
          if (!mongoose.Types.ObjectId.isValid(medicineId)) {
            return res.status(400).json({
              success: false,
              message: `Invalid medicine ID: ${medicineId}`,
            });
          }
        }
        
        updateData.medicines = medicinesArray;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid medicines format",
        });
      }
    }
    
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : "";
    if (status) updateData.status = status;

    // Handle file upload
    if (req.file) {
      // Delete old file if exists
      if (existingTreatment.reports && existingTreatment.reports.path) {
        deleteFile(existingTreatment.reports.path);
      }

      updateData.reports = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      };
    }

    // Update treatment
    const updatedTreatment = await DoctorTreatment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("doctor", "fullName email phoneNumber")
      .populate("specialist", "fullName specialization phoneNumber")
      .populate("medicines", "medicine_name quantity_available price");

    res.status(200).json({
      success: true,
      message: "Treatment record updated successfully",
      data: updatedTreatment,
    });
  } catch (error) {
    console.error("Update treatment error:", error);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      deleteFile(req.file.path);
    }

    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating treatment record",
      error: error.message,
    });
  }
};

// @desc    Delete treatment record
// @route   DELETE /api/doctor-treatments/:id
// @access  Public
export const deleteTreatment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid treatment ID",
      });
    }

    const treatment = await DoctorTreatment.findById(id);
    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: "Treatment record not found",
      });
    }

    // Delete associated file
    if (treatment.reports && treatment.reports.path) {
      deleteFile(treatment.reports.path);
    }

    await DoctorTreatment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Treatment record deleted successfully",
    });
  } catch (error) {
    console.error("Delete treatment error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting treatment record",
      error: error.message,
    });
  }
};

// @desc    Bulk delete treatment records
// @route   DELETE /api/doctor-treatments/bulk
// @access  Public
export const bulkDeleteTreatments = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of treatment IDs",
      });
    }

    // Validate all IDs
    for (const id of ids) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid treatment ID: ${id}`,
        });
      }
    }

    // Get treatments to delete associated files
    const treatments = await DoctorTreatment.find({ _id: { $in: ids } });

    // Delete associated files
    treatments.forEach((treatment) => {
      if (treatment.reports && treatment.reports.path) {
        deleteFile(treatment.reports.path);
      }
    });

    // Delete treatments
    const result = await DoctorTreatment.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} treatment records deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk delete treatments error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting treatment records",
      error: error.message,
    });
  }
};

// @desc    Get treatment statistics
// @route   GET /api/doctor-treatments/stats
// @access  Public
export const getTreatmentStats = async (req, res) => {
  try {
    const totalTreatments = await DoctorTreatment.countDocuments();
    const activeTreatments = await DoctorTreatment.countDocuments({ status: "active" });
    const completedTreatments = await DoctorTreatment.countDocuments({ status: "completed" });

    // Get treatments by animal type
    const treatmentsByAnimalType = await DoctorTreatment.aggregate([
      {
        $group: {
          _id: "$animalType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get recent treatments
    const recentTreatments = await DoctorTreatment.find()
      .populate("doctor", "fullName")
      .sort({ treatmentDate: -1 })
      .limit(5)
      .select("animalType animalCode treatmentDate status");

    res.status(200).json({
      success: true,
      data: {
        totalTreatments,
        activeTreatments,
        completedTreatments,
        treatmentsByAnimalType,
        recentTreatments,
      },
    });
  } catch (error) {
    console.error("Get treatment stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching treatment statistics",
      error: error.message,
    });
  }
};