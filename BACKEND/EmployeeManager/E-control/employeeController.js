// BACKEND/EmployeeManager/E-control/employeeController.js
import Employee from "../E-model/Employee.js";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// Validation helper
function validateEmployeeData(data) {
  const requiredFields = ["name", "contact", "title", "joined"];
  const missing = requiredFields.filter(
    (field) => !data[field] || data[field].toString().trim() === ""
  );
  return missing;
}

// Generate next employee ID
async function generateNextEmployeeId() {
  try {
    // Find the highest existing employee ID
    const lastEmployee = await Employee.findOne({}, {}, { sort: { 'id': -1 } });
    
    if (!lastEmployee) {
      // If no employees exist, start with EMP001
      return "EMP001";
    }
    
    // Extract the number from the last employee ID
    const lastId = lastEmployee.id;
    const match = lastId.match(/EMP(\d+)/);
    
    if (match) {
      const lastNumber = parseInt(match[1]);
      const nextNumber = lastNumber + 1;
      return `EMP${nextNumber.toString().padStart(3, '0')}`;
    } else {
      // If format is unexpected, start with EMP001
      return "EMP001";
    }
  } catch (error) {
    console.error("Error generating next employee ID:", error);
    return "EMP001";
  }
}

// Add Employee
export const addEmployee = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Received files:", req.files);
    
    const missing = validateEmployeeData(req.body);
    console.log("Missing fields:", missing);
    
    if (missing.length > 0)
      return res.status(400).json({ error: `Missing: ${missing.join(", ")}` });

    // Generate next employee ID automatically
    const nextId = await generateNextEmployeeId();
    console.log("Generated next ID:", nextId);

    const photoPath = req.files?.photo?.[0]?.filename
      ? `/uploads/${req.files.photo[0].filename}`
      : null;
    const cvPath = req.files?.cv?.[0]?.filename
      ? `/uploads/${req.files.cv[0].filename}`
      : null;

    const newEmployee = new Employee({
      id: nextId, // Use auto-generated ID
      name: req.body.name,
      contact: req.body.contact,
      title: req.body.title,
      type: req.body.type || "Full-time",
      joined: req.body.joined,
      photo: photoPath,
      cv: cvPath,
    });

    const saved = await newEmployee.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Add employee error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update Employee
export const updateEmployee = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.files?.photo?.[0]?.filename)
      updateData.photo = `/uploads/${req.files.photo[0].filename}`;
    if (req.files?.cv?.[0]?.filename)
      updateData.cv = `/uploads/${req.files.cv[0].filename}`;

    const updated = await Employee.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Employee not found" });
    res.json(updated);
  } catch (err) {
    console.error("Update employee error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all Employees
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    console.log('Found employees:', employees.length);
    res.json({ docs: employees });
  } catch (err) {
    console.error("Get employees error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get next employee ID
export const getNextEmployeeId = async (req, res) => {
  try {
    console.log("getNextEmployeeId endpoint called");
    const nextId = await generateNextEmployeeId();
    console.log("Returning next ID:", nextId);
    res.json({ nextId });
  } catch (err) {
    console.error("Get next employee ID error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get Employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    console.log("getEmployeeById called with ID:", req.params.id);
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) {
      console.log("Employee not found for ID:", req.params.id);
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(employee);
  } catch (err) {
    console.error("Get employee error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete Employee
export const deleteEmployee = async (req, res) => {
  try {
    const deleted = await Employee.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Delete employee error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Generate Employee PDF
export const generatePDF = async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const doc = new PDFDocument({ 
      margin: 50,
      autoFirstPage: true,
      size: 'A4'
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Employee_${employee.id}_Report.pdf`);

    // Company header with logo - matching overall report format
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Try to load the company logo
      const logoPaths = [
        path.join(process.cwd(), 'public', 'logo512.png'),
        path.join(process.cwd(), '..', 'FRONTEND', 'public', 'logo512.png'),
        path.join(process.cwd(), 'AnimalManagement', 'logo192.png')
      ];
      
      let logoLoaded = false;
      for (const logoPath of logoPaths) {
        if (fs.existsSync(logoPath)) {
          try {
            // Circular logo like in overall report
            doc.circle(35, 25, 15, 'F').fill('green');
            doc.image(logoPath, 20, 10, { width: 30, height: 30 });
            logoLoaded = true;
            break;
          } catch (logoErr) {
            console.error("Error loading logo:", logoErr);
            continue;
          }
        }
      }
      
      if (!logoLoaded) {
        // Fallback: Draw a simple circular logo placeholder
        doc.circle(35, 25, 15, 'F').fill('green');
        doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
        doc.text('MOF', 35, 25, { align: 'center' });
      }
    } catch (logoErr) {
      console.error("Logo loading error:", logoErr);
      // Fallback: Draw a simple circular logo placeholder
      doc.circle(35, 25, 15, 'F').fill('green');
      doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
      doc.text('MOF', 35, 25, { align: 'center' });
    }
    
    // Company information - matching overall report format with proper spacing
    doc.fontSize(18).font('Helvetica-Bold').fillColor('black');
    doc.text('Mount Olive Farm House', 60, 20);
    doc.fontSize(9).font('Helvetica').fillColor('black');
    doc.text('No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka', 60, 38);
    doc.text('Phone: +94 81 249 2134', 60, 50);
    doc.text('Email: info@mountolivefarm.com', 60, 58);

    // Report title banner - matching overall report format
    doc.rect(50, 70, 500, 15).fill('lightgray');
    doc.fontSize(16).font('Helvetica-Bold').fillColor('green');
    doc.text('EMPLOYEE DETAILED REPORT', 300, 80, { align: 'center' });

    // Report metadata - matching overall report format with proper spacing
    doc.fontSize(10).font('Helvetica').fillColor('black');
    doc.text(`Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 50, 95);
    doc.text(`Total Records: 1`, 50, 107);
    doc.text(`Report ID: MOF-ED-${Date.now().toString().slice(-6)}`, 50, 119);

    // Create employee data table - matching overall report format with proper spacing
    const tableData = [
      ['Emp ID', 'Name', 'Contact No', 'Job Title', 'Type', 'Joined'],
      [employee.id, employee.name, employee.contact, employee.title, employee.type, employee.joined]
    ];

    // Table header with proper spacing
    doc.rect(50, 130, 500, 20).fill('green');
    doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
    const headerPositions = [60, 120, 180, 240, 320, 420]; // Proper column positions
    tableData[0].forEach((header, index) => {
      doc.text(header, headerPositions[index], 142);
    });

    // Table data row with proper spacing
    doc.rect(50, 150, 500, 20).fill('white');
    doc.fontSize(9).font('Helvetica').fillColor('black');
    tableData[1].forEach((data, index) => {
      doc.text(data, headerPositions[index], 162);
    });

    // Employee photo section - clean format with proper spacing
    let currentY = 190;
    doc.fontSize(12).font('Helvetica-Bold').fillColor('green');
    doc.text('Employee Photo:', 50, currentY);
    currentY += 25;
    
    if (employee.photo) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const photoPath = path.join(process.cwd(), employee.photo);
        
        if (fs.existsSync(photoPath)) {
          // Add photo with simple border
          doc.rect(50, currentY, 100, 100).stroke('gray', 1);
          doc.image(photoPath, 50, currentY, { width: 100, height: 100, fit: [100, 100] });
          currentY += 120;
        } else {
          doc.fontSize(10).font('Helvetica').fillColor('black');
          doc.text('Photo: Not available', 50, currentY);
          currentY += 30;
        }
      } catch (photoErr) {
        console.error("Photo error:", photoErr);
        doc.fontSize(10).font('Helvetica').fillColor('black');
        doc.text('Photo: Error loading', 50, currentY);
        currentY += 30;
      }
    } else {
      doc.fontSize(10).font('Helvetica').fillColor('black');
      doc.text('Photo: Not provided', 50, currentY);
      currentY += 30;
    }

    // QR Code section - clean format with proper spacing
    doc.fontSize(12).font('Helvetica-Bold').fillColor('green');
    doc.text('QR Code for Attendance', 50, currentY);
    currentY += 25;

    try {
      const qrData = JSON.stringify({
        id: employee.id,
        name: employee.name,
        type: "employee",
        timestamp: new Date().toISOString()
      });
      const qr = await QRCode.toDataURL(qrData);
      doc.image(Buffer.from(qr.split(",")[1], "base64"), 50, currentY, { width: 100, height: 100 });
      
      // Add instruction text below QR code
      doc.fontSize(9).font('Helvetica').fillColor('black');
      doc.text('Scan this QR code for attendance tracking', 100, currentY + 110, { align: 'center' });
      
      currentY += 140;
    } catch (qrErr) {
      console.error("QR code error:", qrErr);
      doc.fontSize(10).font('Helvetica').fillColor('black');
      doc.text('QR Code: Error generating', 50, currentY);
      currentY += 30;
    }

    // Professional footer - matching overall report format with proper spacing
    doc.moveTo(50, currentY + 30).lineTo(550, currentY + 30).stroke();
    
    doc.fontSize(8).font('Helvetica').fillColor('black');
    doc.text('Page 1 of 1', 50, currentY + 45);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 300, currentY + 45, { align: 'center' });
    doc.text('Mount Olive Farm House', 550, currentY + 45, { align: 'right' });
    
    doc.fontSize(7).font('Helvetica').fillColor('black');
    doc.text('This report is generated by Mount Olive Farm House Management System', 300, currentY + 55, { align: 'center' });

    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error("Generate PDF error:", err);
    res.status(500).json({ error: err.message });
  }
};
