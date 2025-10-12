import Consultation from '../models/P-Consultation.js';
import Pest from '../models/Pest.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all consultations
export const getAllConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find()
      .populate('pestId', 'greenhouseNo issueType description image')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: consultations.length,
      data: consultations
    });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching consultation data',
      error: error.message
    });
  }
};

// Get consultation by ID
export const getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('pestId', 'greenhouseNo issueType description image');
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: consultation
    });
  } catch (error) {
    console.error('Error fetching consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching consultation data',
      error: error.message
    });
  }
};

// Create new consultation (Assign specialist)
export const createConsultation = async (req, res) => {
  try {
    const { 
      pestId, 
      specialistName, 
      dateAssigned, 
      greenhouseNo, 
      treatedIssue, 
      specialistNotes,
      status,
      treatmentStartDate,
      followUpRequired,
      followUpDate,
      cost,
      createdBy 
    } = req.body;

    // Verify pest exists
    const pest = await Pest.findById(pestId);
    if (!pest) {
      return res.status(404).json({
        success: false,
        message: 'Pest record not found'
      });
    }

    const consultationData = {
      pestId,
      specialistName,
      dateAssigned,
      greenhouseNo,
      treatedIssue,
      specialistNotes: specialistNotes || '',
      status: status || 'Assigned',
      treatmentStartDate: treatmentStartDate || null,
      followUpRequired: followUpRequired || false,
      followUpDate: followUpDate || null,
      cost: cost || 0,
      createdBy: createdBy || 'System'
    };

    const consultation = new Consultation(consultationData);
    await consultation.save();

    // Update pest status if consultation is created
    if (status === 'In Progress') {
      await Pest.findByIdAndUpdate(pestId, { status: 'Under Treatment' });
    } else if (status === 'Resolved') {
      await Pest.findByIdAndUpdate(pestId, { status: 'Resolved' });
    }

    // Populate pest data before sending response
    await consultation.populate('pestId', 'greenhouseNo issueType description image');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('consultationUpdated', { type: 'create', data: consultation });
    }

    res.status(201).json({
      success: true,
      message: 'Specialist assigned successfully',
      data: consultation
    });
  } catch (error) {
    console.error('Error creating consultation:', error);
    res.status(400).json({
      success: false,
      message: 'Error assigning specialist',
      error: error.message
    });
  }
};

// Update consultation
export const updateConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const consultation = await Consultation.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('pestId', 'greenhouseNo issueType description image');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation record not found'
      });
    }

    // Update pest status based on consultation status
    if (consultation.status === 'In Progress') {
      await Pest.findByIdAndUpdate(consultation.pestId._id, { status: 'Under Treatment' });
    } else if (consultation.status === 'Resolved') {
      await Pest.findByIdAndUpdate(consultation.pestId._id, { status: 'Resolved' });
      // Set treatment end date if not provided
      if (!consultation.treatmentEndDate) {
        consultation.treatmentEndDate = new Date();
        await consultation.save();
      }
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('consultationUpdated', { type: 'update', data: consultation });
    }

    res.status(200).json({
      success: true,
      message: 'Consultation updated successfully',
      data: consultation
    });
  } catch (error) {
    console.error('Error updating consultation:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating consultation',
      error: error.message
    });
  }
};

// Delete consultation
export const deleteConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation record not found'
      });
    }

    // Reset pest status if needed
    await Pest.findByIdAndUpdate(consultation.pestId, { status: 'Active' });

    await Consultation.findByIdAndDelete(req.params.id);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('consultationUpdated', { type: 'delete', id: req.params.id });
    }

    res.status(200).json({
      success: true,
      message: 'Consultation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting consultation',
      error: error.message
    });
  }
};

// Generate consultation PDF report
export const generateConsultationPDF = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('pestId', 'greenhouseNo issueType description image date severity');
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation record not found'
      });
    }

    // Create PDF document
    const doc = new PDFDocument();
    const filename = `consultation-report-${consultation.greenhouseNo}-${Date.now()}.pdf`;
    
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
    doc.fontSize(16).text('SPECIALIST CONSULTATION REPORT', 0, 110, { align: 'center', width: 612 });
    
    // Reset color for content
    doc.fillColor('black');
    
    // Report details section
    doc.fontSize(12).text(`Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 50, 150);
    doc.text(`Specialist: ${consultation.specialistName}`, 50, 165);
    doc.text(`Date Assigned: ${new Date(consultation.dateAssigned).toLocaleDateString()}`, 50, 180);
    doc.text(`Status: ${consultation.status}`, 50, 195);
    doc.text(`Report ID: MOF-SC-${consultation._id.toString().slice(-8).toUpperCase()}`, 50, 210);
    doc.moveDown();

    // Pest Information Section Header
    doc.rect(50, doc.y, 512, 25).fill('#2E7D32');
    doc.fillColor('white');
    doc.fontSize(14).text('PEST/DISEASE ISSUE INFORMATION', 0, doc.y + 8, { align: 'center', width: 612 });
    doc.fillColor('black');
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Greenhouse No: ${consultation.pestId.greenhouseNo}`, 70);
    doc.text(`Issue Date: ${new Date(consultation.pestId.date).toLocaleDateString()}`, 70);
    doc.text(`Issue Type: ${consultation.pestId.issueType}`, 70);
    doc.text(`Severity: ${consultation.pestId.severity}`, 70);
    doc.moveDown();
    
    doc.text('Issue Description:', 70);
    doc.text(consultation.pestId.description, 70, doc.y, { width: 450 });
    doc.moveDown();

    // Consultation Information Section Header
    doc.rect(50, doc.y, 512, 25).fill('#1E88E5'); // Blue header
    doc.fillColor('white');
    doc.fontSize(14).text('SPECIALIST CONSULTATION DETAILS', 0, doc.y + 8, { align: 'center', width: 612 });
    doc.fillColor('black');
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Specialist Name: ${consultation.specialistName}`, 70);
    doc.text(`Date Assigned: ${new Date(consultation.dateAssigned).toLocaleDateString()}`, 70);
    doc.text(`Status: ${consultation.status}`, 70);
    doc.text(`Treated Issue: ${consultation.treatedIssue}`, 70);
    
    if (consultation.treatmentStartDate) {
      doc.text(`Treatment Start Date: ${new Date(consultation.treatmentStartDate).toLocaleDateString()}`, 70);
    }
    
    if (consultation.treatmentEndDate) {
      doc.text(`Treatment End Date: ${new Date(consultation.treatmentEndDate).toLocaleDateString()}`, 70);
    }
    
    if (consultation.cost > 0) {
      doc.text(`Treatment Cost: $${consultation.cost.toFixed(2)}`, 70);
    }
    
    doc.moveDown();

    if (consultation.specialistNotes) {
      doc.text('Specialist Notes:', 70);
      doc.text(consultation.specialistNotes, 70, doc.y, { width: 450 });
      doc.moveDown();
    }

    if (consultation.followUpRequired) {
      doc.text('Follow-up Required: Yes', 70);
      if (consultation.followUpDate) {
        doc.text(`Follow-up Date: ${new Date(consultation.followUpDate).toLocaleDateString()}`, 70);
      }
      doc.moveDown();
    }

    // Add image if exists
    if (consultation.pestId.image) {
      try {
        const imagePath = path.join(__dirname, '..', 'Uploads', path.basename(consultation.pestId.image));
        if (fs.existsSync(imagePath)) {
          doc.addPage();
          doc.fontSize(16).text('Issue Image:', 50, 50);
          doc.moveDown();
          doc.image(imagePath, 50, doc.y, { width: 400 });
        }
      } catch (imageError) {
        console.error('Error adding image to PDF:', imageError);
        doc.text('Image could not be loaded', 70);
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
    console.error('Error generating consultation PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF report',
      error: error.message
    });
  }
};

// Generate combined report (both pest and consultation data)
export const generateCombinedReport = async (req, res) => {
  try {
    const pests = await Pest.find().sort({ createdAt: -1 });
    const consultations = await Consultation.find()
      .populate('pestId', 'greenhouseNo issueType description')
      .sort({ createdAt: -1 });

    // Create PDF document
    const doc = new PDFDocument();
    const filename = `pest-disease-full-report-${Date.now()}.pdf`;
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(24).text('Complete Pest & Disease Management Report', 50, 50);
    doc.moveDown(2);

    // Summary section
    doc.fontSize(18).text('Summary', 50);
    doc.fontSize(12);
    doc.text(`Total Issues Recorded: ${pests.length}`, 70);
    doc.text(`Total Specialist Consultations: ${consultations.length}`, 70);
    doc.moveDown(2);

    // Issues section
    doc.fontSize(18).text('Pest & Disease Issues', 50);
    doc.moveDown();
    
    if (pests.length > 0) {
      pests.forEach((pest, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }
        
        doc.fontSize(14).text(`${index + 1}. ${pest.greenhouseNo} - ${pest.issueType}`, 70);
        doc.fontSize(10);
        doc.text(`Date: ${new Date(pest.date).toLocaleDateString()}`, 90);
        doc.text(`Status: ${pest.status}`, 90);
        doc.text(`Description: ${pest.description}`, 90, doc.y, { width: 400 });
        doc.moveDown();
      });
    } else {
      doc.fontSize(12).text('No pest issues recorded.', 70);
    }

    // Add new page for consultations
    doc.addPage();
    doc.fontSize(18).text('Specialist Consultations', 50, 50);
    doc.moveDown();

    if (consultations.length > 0) {
      consultations.forEach((consultation, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }
        
        doc.fontSize(14).text(`${index + 1}. ${consultation.specialistName}`, 70);
        doc.fontSize(10);
        doc.text(`Greenhouse: ${consultation.greenhouseNo}`, 90);
        doc.text(`Date Assigned: ${new Date(consultation.dateAssigned).toLocaleDateString()}`, 90);
        doc.text(`Status: ${consultation.status}`, 90);
        doc.text(`Issue: ${consultation.treatedIssue}`, 90, doc.y, { width: 400 });
        if (consultation.specialistNotes) {
          doc.text(`Notes: ${consultation.specialistNotes}`, 90, doc.y, { width: 400 });
        }
        doc.moveDown();
      });
    } else {
      doc.fontSize(12).text('No specialist consultations recorded.', 70);
    }

    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, 50);
    
    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating combined report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating combined report',
      error: error.message
    });
  }
};

// Get consultations by specialist
export const getConsultationsBySpecialist = async (req, res) => {
  try {
    const { specialistName } = req.params;
    const consultations = await Consultation.find({ specialistName })
      .populate('pestId', 'greenhouseNo issueType description image')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: consultations.length,
      data: consultations
    });
  } catch (error) {
    console.error('Error fetching consultations by specialist:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching consultation data',
      error: error.message
    });
  }
};