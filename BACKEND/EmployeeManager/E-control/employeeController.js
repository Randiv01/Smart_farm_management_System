// BACKEND/EmployeeManager/E-control/employeeController.js
import Employee from "../E-model/Employee.js";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// Validation helper
function validateEmployeeData(data) {
  const requiredFields = ["id", "name", "contact", "title", "joined"];
  const missing = requiredFields.filter(
    (field) => !data[field] || data[field].toString().trim() === ""
  );
  return missing;
}

// Add Employee
export const addEmployee = async (req, res) => {
  try {
    const missing = validateEmployeeData(req.body);
    if (missing.length > 0)
      return res.status(400).json({ error: `Missing: ${missing.join(", ")}` });

    const existing = await Employee.findOne({ id: req.body.id });
    if (existing) return res.status(400).json({ error: "Employee ID must be unique" });

    const photoPath = req.files?.photo?.[0]?.filename
      ? `/uploads/${req.files.photo[0].filename}`
      : null;
    const cvPath = req.files?.cv?.[0]?.filename
      ? `/uploads/${req.files.cv[0].filename}`
      : null;

    const newEmployee = new Employee({
      id: req.body.id,
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
    res.json(employees);
  } catch (err) {
    console.error("Get employees error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get Employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) return res.status(404).json({ error: "Employee not found" });
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

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${employee.id}.pdf`);

    doc.text(`Employee ID: ${employee.id}`);
    doc.text(`Name: ${employee.name}`);
    doc.text(`Contact: ${employee.contact}`);
    doc.text(`Title: ${employee.title}`);
    doc.text(`Type: ${employee.type}`);
    doc.text(`Joined: ${employee.joined}`);
    if (employee.photo) doc.text(`Photo: ${employee.photo}`);
    if (employee.cv) doc.text(`CV: ${employee.cv}`);

    try {
      const qr = await QRCode.toDataURL(`ID: ${employee.id}, Name: ${employee.name}`);
      doc.image(Buffer.from(qr.split(",")[1], "base64"), { width: 100 });
    } catch (qrErr) {
      console.error("QR code error:", qrErr);
    }

    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error("Generate PDF error:", err);
    res.status(500).json({ error: err.message });
  }
};
