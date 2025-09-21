import Pest from '../models/Pest.js';
import Consultation from '../models/P-Consultation.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all pests
export const getAllPests = async (req, res) => {
  try {
    console.log('Fetching all pests...');
    const pests = await Pest.find().sort({ createdAt: -1 });
    console.log(`Found ${pests.length} pests`);
    
    res.status(200).json({
      success: true,
      count: pests.length,
      data: pests
    });
  } catch (error) {
    console.error('Error fetching pests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pest data',
      error: error.message
    });
  }
};

// Get pest by ID
export const getPestById = async (req, res) => {
  try {
    console.log(`Fetching pest with ID: ${req.params.id}`);
    const pest = await Pest.findById(req.params.id);
    
    if (!pest) {
      return res.status(404).json({
        success: false,
        message: 'Pest record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: pest
    });
  } catch (error) {
    console.error('Error fetching pest:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pest data',
      error: error.message
    });
  }
};

// Create new pest record
export const createPest = async (req, res) => {
  try {
    console.log('Creating new pest record...');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const { greenhouseNo, date, issueType, description, severity, createdBy } = req.body;
    
    // Validate required fields
    if (!greenhouseNo || !issueType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: greenhouseNo, issueType, and description are required'
      });
    }

    // Handle image upload if present
    const imagePath = req.file ? `/plant-uploads/${req.file.filename}` : null;

    const pestData = {
      greenhouseNo: greenhouseNo.trim(),
      date: date ? new Date(date) : new Date(),
      issueType,
      description: description.trim(),
      image: imagePath,
      severity: severity || 'Medium',
      createdBy: createdBy || 'System'
    };

    console.log('Creating pest with data:', pestData);

    const pest = new Pest(pestData);
    const savedPest = await pest.save();
    
    console.log('Pest created successfully:', savedPest._id);

    // Emit real-time update
    try {
      const io = req.app.get('io');
      if (io) {
        const stats = await getPestStatistics();
        io.emit('pestUpdated', { type: 'create', data: savedPest, stats });
      }
    } catch (ioError) {
      console.error('Socket.io error:', ioError);
    }

    res.status(201).json({
      success: true,
      message: 'Pest record created successfully',
      data: savedPest
    });
  } catch (error) {
    console.error('Error creating pest:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Error creating pest record',
      error: error.message
    });
  }
};

// Update pest record
export const updatePest = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Updating pest with ID: ${id}`);
    console.log('Update data:', req.body);

    const updateData = { ...req.body };

    // Handle image upload if present
    if (req.file) {
      updateData.image = `/plant-uploads/${req.file.filename}`;
    }

    // Clean up data
    if (updateData.greenhouseNo) {
      updateData.greenhouseNo = updateData.greenhouseNo.trim();
    }
    if (updateData.description) {
      updateData.description = updateData.description.trim();
    }
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const pest = await Pest.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!pest) {
      return res.status(404).json({
        success: false,
        message: 'Pest record not found'
      });
    }

    console.log('Pest updated successfully:', pest._id);

    // Emit real-time update
    try {
      const io = req.app.get('io');
      if (io) {
        const stats = await getPestStatistics();
        io.emit('pestUpdated', { type: 'update', data: pest, stats });
      }
    } catch (ioError) {
      console.error('Socket.io error:', ioError);
    }

    res.status(200).json({
      success: true,
      message: 'Pest record updated successfully',
      data: pest
    });
  } catch (error) {
    console.error('Error updating pest:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Error updating pest record',
      error: error.message
    });
  }
};

// Delete pest record
export const deletePest = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting pest with ID: ${id}`);
    
    const pest = await Pest.findById(id);
    if (!pest) {
      return res.status(404).json({
        success: false,
        message: 'Pest record not found'
      });
    }

    // Delete associated consultations
    await Consultation.deleteMany({ pestId: id });

    // Delete image file if exists
    if (pest.image) {
      try {
        const imagePath = path.join(__dirname, '..', 'Uploads', path.basename(pest.image));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('Image file deleted:', imagePath);
        }
      } catch (fileError) {
        console.error('Error deleting image file:', fileError);
      }
    }

    await Pest.findByIdAndDelete(id);
    console.log('Pest deleted successfully:', id);

    // Emit real-time update
    try {
      const io = req.app.get('io');
      if (io) {
        const stats = await getPestStatistics();
        io.emit('pestUpdated', { type: 'delete', id: id, stats });
      }
    } catch (ioError) {
      console.error('Socket.io error:', ioError);
    }

    res.status(200).json({
      success: true,
      message: 'Pest record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pest:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting pest record',
      error: error.message
    });
  }
};

// Get pest statistics for charts
export const getPestStatistics = async () => {
  try {
    console.log('Calculating pest statistics...');
    
    // Issues by type
    const issueTypeStats = await Pest.aggregate([
      {
        $group: {
          _id: '$issueType',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: '$count',
          _id: 0
        }
      }
    ]);

    // Issues by greenhouse
    const greenhouseStats = await Pest.aggregate([
      {
        $group: {
          _id: '$greenhouseNo',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          greenhouseNo: '$_id',
          count: '$count',
          _id: 0
        }
      },
      {
        $sort: { greenhouseNo: 1 }
      }
    ]);

    console.log('Issue type stats:', issueTypeStats);
    console.log('Greenhouse stats:', greenhouseStats);

    return {
      issueTypeData: issueTypeStats,
      issuesByGreenhouseData: greenhouseStats
    };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return {
      issueTypeData: [],
      issuesByGreenhouseData: []
    };
  }
};

// Get pest statistics endpoint
export const getPestStatsEndpoint = async (req, res) => {
  try {
    console.log('Getting pest statistics...');
    const stats = await getPestStatistics();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching pest statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pest statistics',
      error: error.message
    });
  }
};

// Generate PDF report for individual pest
export const generatePestPDF = async (req, res) => {
  try {
    const pest = await Pest.findById(req.params.id);
    if (!pest) {
      return res.status(404).json({
        success: false,
        message: 'Pest record not found'
      });
    }

    // Create PDF document
    const doc = new PDFDocument();
    const filename = `pest-report-${pest.greenhouseNo}-${Date.now()}.pdf`;
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('Pest & Disease Issue Report', 50, 50);
    doc.moveDown();
    
    doc.fontSize(14);
    doc.text(`Greenhouse No: ${pest.greenhouseNo}`, 50);
    doc.text(`Date: ${new Date(pest.date).toLocaleDateString()}`, 50);
    doc.text(`Issue Type: ${pest.issueType}`, 50);
    doc.text(`Status: ${pest.status}`, 50);
    doc.text(`Severity: ${pest.severity}`, 50);
    doc.moveDown();
    
    doc.text('Description:', 50);
    doc.text(pest.description, 50, doc.y, { width: 500 });
    doc.moveDown();

    // Add image if exists
    if (pest.image) {
      try {
        const imagePath = path.join(__dirname, '..', 'Uploads', path.basename(pest.image));
        if (fs.existsSync(imagePath)) {
          doc.text('Issue Image:', 50);
          doc.moveDown();
          doc.image(imagePath, 50, doc.y, { width: 300 });
        }
      } catch (imageError) {
        console.error('Error adding image to PDF:', imageError);
        doc.text('Image could not be loaded', 50);
      }
    }

    doc.moveDown();
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 50);
    
    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF report',
      error: error.message
    });
  }
};

// Get pests by greenhouse
export const getPestsByGreenhouse = async (req, res) => {
  try {
    const { greenhouseNo } = req.params;
    console.log(`Fetching pests for greenhouse: ${greenhouseNo}`);
    
    const pests = await Pest.find({ greenhouseNo }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: pests.length,
      data: pests
    });
  } catch (error) {
    console.error('Error fetching pests by greenhouse:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pest data',
      error: error.message
    });
  }
};