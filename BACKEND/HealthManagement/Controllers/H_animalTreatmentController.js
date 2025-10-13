// H_animalTreatmentController.js
import AnimalTreatment from '../Model/H_AnimalTreatmentModel.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createAnimalTreatment = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const { medicines: medicinesStr, ...otherFields } = req.body;
    const medicines = medicinesStr ? JSON.parse(medicinesStr) : [];
    
    let reports = undefined;
    if (req.file) {
      reports = `/Health_uploads/animal-reports/${req.file.filename}`;
    }

    const treatmentData = {
      ...otherFields,
      medicines,
      ...(reports && { reports })
    };

    console.log('Treatment data to save:', treatmentData);

    const newTreatment = new AnimalTreatment(treatmentData);
    const saved = await newTreatment.save();
    
    // Populate all referenced fields with correct model names
    const populatedTreatment = await AnimalTreatment.findById(saved._id)
      .populate('doctor')
      .populate('specialist')
      .populate({
        path: 'medicines',
        model: 'H_MediStore'
      });

    res.status(201).json({ 
      success: true, 
      data: populatedTreatment,
      message: 'Animal treatment record created successfully'
    });
  } catch (error) {
    console.error('Error creating animal treatment:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file) {
      const filePath = path.join(process.cwd(), 'HealthManagement', 'Health_uploads', 'animal-reports', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(400).json({ 
      success: false, 
      error: error.message,
      details: error.errors || 'Validation error'
    });
  }
};

export const getAllAnimalTreatments = async (req, res) => {
  try {
    const treatments = await AnimalTreatment.find()
      .populate('doctor')
      .populate('specialist')
      .populate({
        path: 'medicines',
        model: 'H_MediStore'
      })
      .sort({ createdAt: -1 });

    console.log(`Found ${treatments.length} animal treatments`);
    
    res.json({ 
      success: true, 
      data: treatments,
      count: treatments.length
    });
  } catch (error) {
    console.error('Error fetching animal treatments:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export const getAnimalTreatmentById = async (req, res) => {
  try {
    const treatment = await AnimalTreatment.findById(req.params.id)
      .populate('doctor')
      .populate('specialist')
      .populate({
        path: 'medicines',
        model: 'H_MediStore'
      });

    if (!treatment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Animal treatment not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: treatment 
    });
  } catch (error) {
    console.error('Error fetching animal treatment:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export const updateAnimalTreatment = async (req, res) => {
  try {
    const treatmentId = req.params.id;
    let updateData = {};
    
    console.log('Update request body:', req.body);
    console.log('Update request file:', req.file);

    // Handle multipart/form-data
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      const { medicines: medicinesStr, ...other } = req.body;
      updateData = { ...other };
      if (medicinesStr) {
        updateData.medicines = JSON.parse(medicinesStr);
      }
    } else {
      updateData = req.body;
    }

    // Handle file upload
    if (req.file) {
      // Delete old file if exists
      const oldTreatment = await AnimalTreatment.findById(treatmentId);
      if (oldTreatment?.reports) {
        const oldFileName = path.basename(oldTreatment.reports);
        const oldFilePath = path.join(process.cwd(), 'HealthManagement', 'Health_uploads', 'animal-reports', oldFileName);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      updateData.reports = `/Health_uploads/animal-reports/${req.file.filename}`;
    }

    const updated = await AnimalTreatment.findByIdAndUpdate(
      treatmentId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('doctor')
    .populate('specialist')
    .populate({
      path: 'medicines',
      model: 'H_MediStore'
    });

    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        error: 'Animal treatment not found' 
      });
    }

    res.json({ 
      success: true, 
      data: updated,
      message: 'Animal treatment updated successfully'
    });
  } catch (error) {
    console.error('Error updating animal treatment:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file) {
      const filePath = path.join(process.cwd(), 'HealthManagement', 'Health_uploads', 'animal-reports', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// NEW: Simple status update endpoint
export const updateAnimalTreatmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Updating status for treatment:', id, 'to:', status);

    const updated = await AnimalTreatment.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
    .populate('doctor')
    .populate('specialist')
    .populate({
      path: 'medicines',
      model: 'H_MediStore'
    });

    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        error: 'Animal treatment not found' 
      });
    }

    res.json({ 
      success: true, 
      data: updated,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export const deleteAnimalTreatment = async (req, res) => {
  try {
    const treatment = await AnimalTreatment.findById(req.params.id);
    
    if (!treatment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Animal treatment not found' 
      });
    }

    // Delete associated report file
    if (treatment.reports) {
      const fileName = path.basename(treatment.reports);
      const filePath = path.join(process.cwd(), 'HealthManagement', 'Health_uploads', 'animal-reports', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await AnimalTreatment.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: 'Animal treatment deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting animal treatment:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};