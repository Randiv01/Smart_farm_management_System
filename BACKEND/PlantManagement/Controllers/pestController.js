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

    // Add company header with logo area
    doc.rect(0, 0, 612, 100).fill('#2E7D32'); // Green header background
    doc.fillColor('white');
    
    // Company logo area (circular)
    doc.circle(60, 50, 30).fill('#ffffff');
    doc.fillColor('#2E7D32');
    doc.fontSize(8).text('MOUNT OLIVE', 35, 40, { align: 'center', width: 50 });
    doc.text('FARM HOUSE', 35, 50, { align: 'center', width: 50 });
    doc.text('🌱', 55, 55, { align: 'center' });
    
    // Company information
    doc.fillColor('white');
    doc.fontSize(20).text('Mount Olive Farm House', 120, 20);
    doc.fontSize(10).text('No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka', 120, 40);
    doc.text('+94 81 249 2134', 120, 55);
    doc.text('info@mountolivefarm.com', 120, 70);
    doc.text('www.mountolivefarm.com', 120, 85);
    
    // Report title bar
    doc.rect(0, 100, 612, 30).fill('#E8F5E8'); // Light green background
    doc.fillColor('#2E7D32');
    doc.fontSize(16).text('PEST & DISEASE MANAGEMENT REPORT', 0, 110, { align: 'center', width: 612 });
    
    // Reset color for content
    doc.fillColor('black');
    
    // Report details section
    doc.fontSize(12).text(`Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 50, 150);
    doc.text(`Greenhouse: ${pest.greenhouseNo}`, 50, 165);
    doc.text(`Issue Date: ${new Date(pest.date).toLocaleDateString()}`, 50, 180);
    doc.text(`Issue Type: ${pest.issueType}`, 50, 195);
    doc.text(`Status: ${pest.status}`, 50, 210);
    doc.text(`Severity: ${pest.severity}`, 50, 225);
    doc.text(`Report ID: MOF-PD-${pest._id.toString().slice(-8).toUpperCase()}`, 50, 240);
    doc.moveDown();
    
    // Issue Details Table Header
    doc.rect(50, doc.y, 512, 25).fill('#2E7D32');
    doc.fillColor('white');
    doc.fontSize(14).text('ISSUE DETAILS', 0, doc.y + 8, { align: 'center', width: 612 });
    doc.fillColor('black');
    doc.moveDown();
    
    // Add description section
    doc.fontSize(12).text('Issue Description:', 70);
    doc.fontSize(11);
    doc.text(pest.description, 70, doc.y, { width: 450 });
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
    
    // Add professional footer
    const footerY = 750;
    doc.rect(0, footerY, 612, 30).fill('#E8F5E8'); // Light green background
    doc.fillColor('#2E7D32');
    doc.fontSize(10).text('Page 1 of 1', 50, footerY + 10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()}`, 0, footerY + 10, { align: 'center', width: 612 });
    doc.text('Mount Olive Farm House', 0, footerY + 10, { align: 'right', width: 612 });
    
    // Footer text
    doc.fillColor('#666666');
    doc.fontSize(8).text('This report is generated by Mount Olive Farm House Management System', 0, footerY + 35, { align: 'center', width: 612 });
    
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