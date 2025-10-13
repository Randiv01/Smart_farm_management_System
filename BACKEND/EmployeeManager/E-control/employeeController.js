// BACKEND/EmployeeManager/E-control/employeeController.js
import Employee from "../E-model/Employee.js";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// Validation helper
function validateEmployeeData(data) {
  const requiredFields = ["name", "contact", "title", "joined", "email", "department", "address"];
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
      ? `/employee-uploads/${req.files.photo[0].filename}`
      : null;
    const cvPath = req.files?.cv?.[0]?.filename
      ? `/employee-uploads/${req.files.cv[0].filename}`
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
      email: req.body.email,
      department: req.body.department,
      address: req.body.address,
      status: req.body.status || "Active"
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
      updateData.photo = `/employee-uploads/${req.files.photo[0].filename}`;
    if (req.files?.cv?.[0]?.filename)
      updateData.cv = `/employee-uploads/${req.files.cv[0].filename}`;

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

// Get Caretakers (employees with "Care Taker" job title)
export const getCaretakers = async (req, res) => {
  try {
    console.log("getCaretakers endpoint called");
    const caretakers = await Employee.find({ 
      title: { $regex: /care\s*taker/i },
      status: "Active" 
    }).select('id name department title contact');
    
    console.log(`Found ${caretakers.length} active caretakers`);
    res.json({ caretakers });
  } catch (err) {
    console.error("Get caretakers error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Generate Employee PDF
export const generatePDF = async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const doc = new PDFDocument({ 
      margin: 40,
      autoFirstPage: true,
      size: 'A4'
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Employee_${employee.id}_Report.pdf`);

    // Header exactly matching the uploaded image design
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
            // Circular logo with thick green border (exactly like the image)
            doc.circle(50, 35, 25, 'S').stroke('#22c55e', 3);
            doc.image(logoPath, 25, 10, { width: 50, height: 50 });
            logoLoaded = true;
            break;
          } catch (logoErr) {
            console.error("Error loading logo:", logoErr);
            continue;
          }
        }
      }
      
      if (!logoLoaded) {
        // Create the exact logo design from the image
        doc.circle(50, 35, 25, 'S').stroke('#22c55e', 3);
        // Light green background
        doc.circle(50, 35, 24, 'F').fill('#90EE90');
        
        // Curved text "MOUNT OLIVE" at top
        doc.fillColor('#22c55e').fontSize(7).font('Helvetica-Bold');
        doc.text('MOUNT OLIVE', 50, 25, { align: 'center' });
        
        // Curved text "FARM HOUSE" at bottom  
        doc.text('FARM HOUSE', 50, 45, { align: 'center' });
        
        // Add some decorative elements to match the image
        doc.fillColor('#22c55e').fontSize(6);
        doc.text('95', 40, 40);
        doc.text('25', 60, 40);
      }
    } catch (logoErr) {
      console.error("Logo loading error:", logoErr);
      // Create the exact logo design from the image
      doc.circle(50, 35, 25, 'S').stroke('#22c55e', 3);
      doc.circle(50, 35, 24, 'F').fill('#90EE90');
      doc.fillColor('#22c55e').fontSize(7).font('Helvetica-Bold');
      doc.text('MOUNT OLIVE', 50, 25, { align: 'center' });
      doc.text('FARM HOUSE', 50, 45, { align: 'center' });
      doc.fillColor('#22c55e').fontSize(6);
      doc.text('95', 40, 40);
      doc.text('25', 60, 40);
    }
    
    // Company name (exactly matching the image - large, bold, dark blue)
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#1e3a8a');
    doc.text('Mount Olive Farm House', 90, 25);
    
    // Contact information (exactly matching the image styling)
    doc.fontSize(11).font('Helvetica').fillColor('#1e3a8a');
    doc.text('No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka', 90, 45);
    doc.fontSize(10).font('Helvetica').fillColor('#1e3a8a');
    doc.text('Phone: +94 81 249 2134 | Email: info@mountolivefarm.com', 90, 57);

    // Compact employee information section (optimized for single page)
    let currentY = 80;
    
    // Report title
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#22c55e');
    doc.text('EMPLOYEE DETAILED REPORT', 297, currentY, { align: 'center' });
    currentY += 25;
    
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937');
    doc.text(`${employee.name} - ${employee.id}`, 297, currentY, { align: 'center' });
    currentY += 30;
    
    // Compact two-column layout for employee information
    const leftColumnData = [
      ['Employee ID', employee.id],
      ['Full Name', employee.name],
      ['Contact Number', employee.contact],
      ['Email Address', employee.email || 'Not provided'],
      ['Job Title', employee.title]
    ];
    
    const rightColumnData = [
      ['Department', employee.department || 'Not specified'],
      ['Employment Type', employee.type],
      ['Status', employee.status || 'Active'],
      ['Date Joined', employee.joined],
      ['Address', employee.address || 'Not provided']
    ];
    
    // Left column
    leftColumnData.forEach(([label, value], index) => {
      const rowY = currentY + (index * 15);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151');
      doc.text(`${label}:`, 60, rowY);
      doc.fontSize(10).font('Helvetica').fillColor('#1f2937');
      doc.text(value, 140, rowY);
    });
    
    // Right column
    rightColumnData.forEach(([label, value], index) => {
      const rowY = currentY + (index * 15);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151');
      doc.text(`${label}:`, 320, rowY);
      doc.fontSize(10).font('Helvetica').fillColor('#1f2937');
      doc.text(value, 420, rowY);
    });
    
    currentY += (leftColumnData.length * 15) + 20;

    // Compact photo and QR code section (side by side)
    const photoQRY = currentY;
    
    // Employee Photo (left side)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1f2937');
    doc.text('Employee Photo', 60, photoQRY);
    
    if (employee.photo) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const photoPath = path.join(process.cwd(), employee.photo);
        
        if (fs.existsSync(photoPath)) {
          // Compact photo with border
          doc.rect(60, photoQRY + 15, 80, 80).stroke('#22c55e', 2).fill('#f9fafb');
          doc.image(photoPath, 70, photoQRY + 25, { width: 60, height: 60, fit: [60, 60] });
        } else {
          doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
          doc.text('Photo: Not available', 70, photoQRY + 55);
        }
      } catch (photoErr) {
        console.error("Photo error:", photoErr);
        doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
        doc.text('Photo: Error loading', 70, photoQRY + 55);
      }
    } else {
      doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
      doc.text('Photo: Not provided', 70, photoQRY + 55);
    }

    // QR Code (right side)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1f2937');
    doc.text('QR Code for Attendance', 320, photoQRY);

    try {
      const qrData = JSON.stringify({
        id: employee.id,
        name: employee.name,
        type: "employee",
        timestamp: new Date().toISOString()
      });
      const qr = await QRCode.toDataURL(qrData);
      
      // Compact QR code with border
      doc.rect(320, photoQRY + 15, 80, 80).stroke('#22c55e', 2).fill('#f9fafb');
      doc.image(Buffer.from(qr.split(",")[1], "base64"), 330, photoQRY + 25, { width: 60, height: 60 });
      
      // Compact instruction text
      doc.fontSize(8).font('Helvetica').fillColor('#374151');
      doc.text('Scan for attendance', 360, photoQRY + 100, { align: 'center' });
      
    } catch (qrErr) {
      console.error("QR code error:", qrErr);
      doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
      doc.text('QR Code: Error', 330, photoQRY + 55);
    }
    
    currentY = photoQRY + 120;

    // Footer exactly matching the uploaded image design
    currentY += 30;
    
    // Footer separator line (prominent green line spanning nearly full width)
    doc.moveTo(50, currentY).lineTo(545, currentY).stroke('#22c55e', 2);
    currentY += 20;
    
    // Footer content (exactly matching the image layout)
    doc.fontSize(10).font('Helvetica').fillColor('#374151');
    doc.text('Page 1 of 1', 50, currentY);
    doc.text(`Generated on ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()}`, 297, currentY, { align: 'center' });
    doc.text('Mount Olive Farm House', 545, currentY, { align: 'right' });
    
    currentY += 20;
    doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
    doc.text('This report is generated by Mount Olive Farm House Management System', 297, currentY, { align: 'center' });

    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error("Generate PDF error:", err);
    res.status(500).json({ error: err.message });
  }
};
