import Overtime from "../E-model/Overtime.js";
import Employee from "../E-model/Employee.js";

// helpers to build professional codes
const looksLikeObjectId = (s) => typeof s === 'string' && /^[0-9a-f]{24}$/i.test(s);

const getEmployeeCodeFromDoc = (emp) => {
  if (!emp) return "EMP-XXX";
  const candidates = [
    emp.employeeCode,
    emp.code,
    emp.empId,
    emp.staffId,
    emp.employeeId,
    emp.customId,
    emp.hrId,
    emp.id, // sometimes people store custom code here
  ].filter(Boolean);
  const chosen = candidates.find((c) => typeof c === 'string' && !looksLikeObjectId(c));
  if (chosen) return String(chosen).toUpperCase();
  const namePart = (emp.name || 'EMP').replace(/[^A-Za-z]/g, '').slice(0,3).toUpperCase().padEnd(3,'X');
  return `EMP-${namePart}`;
};

const buildOvertimeId = (empDoc, date, objectId) => {
  const code = getEmployeeCodeFromDoc(empDoc);
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  const tail = (objectId?.toString?.() || '').slice(-6).toUpperCase();
  return `OT-${code}-${y}${m}${day}-${tail}`;
};

// Get all overtime records with filtering
export const getOvertimeRecords = async (req, res) => {
  try {
    const { month, year, status, employee, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    if (status) filter.status = status;
    if (employee) filter.employee = employee;

    const skip = (Number(page) - 1) * Number(limit);

    const records = await Overtime.find(filter)
      .populate("employee", "name id employeeCode code empId staffId employeeId customId hrId")
      .populate("approvedBy", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // ensure old rows without overtimeId still deliver a value
    for (const r of records) {
      if (!r.overtimeId) {
        r.overtimeId = buildOvertimeId(r.employee, r.date, r._id);
      }
    }

    const total = await Overtime.countDocuments(filter);

    res.json({
      records,
      totalPages: Math.ceil(total / Number(limit) || 1),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single overtime record
export const getOvertimeRecord = async (req, res) => {
  try {
    const record = await Overtime.findById(req.params.id)
      .populate("employee", "name id contact title employeeCode code empId staffId employeeId customId hrId")
      .populate("approvedBy", "name")
      .populate("createdBy", "name");

    if (!record) return res.status(404).json({ error: "Overtime record not found" });

    if (!record.overtimeId) {
      record.overtimeId = buildOvertimeId(record.employee, record.date, record._id);
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new overtime record
export const createOvertimeRecord = async (req, res) => {
  try {
    const { employee, date, regularHours, overtimeHours, description } = req.body;

    const employeeExists = await Employee.findById(employee);
    if (!employeeExists) return res.status(404).json({ error: "Employee not found" });

    const totalHours = parseFloat(regularHours) + parseFloat(overtimeHours);

    // create instance to get _id first
    const newRecord = new Overtime({
      employee,
      date,
      regularHours: parseFloat(regularHours),
      overtimeHours: parseFloat(overtimeHours),
      totalHours,
      description,
      createdBy: req.user?.id
    });

    // generate professional overtimeId
    newRecord.overtimeId = buildOvertimeId(employeeExists, date, newRecord._id);

    await newRecord.save();

    const populatedRecord = await Overtime.findById(newRecord._id)
      .populate("employee", "name id employeeCode code empId staffId employeeId customId hrId")
      .populate("createdBy", "name");

    res.status(201).json(populatedRecord);
  } catch (error) {
    // if duplicate (extremely unlikely), fall back to saving without unique id
    res.status(500).json({ error: error.message });
  }
};

// Update overtime record
export const updateOvertimeRecord = async (req, res) => {
  try {
    const { regularHours, overtimeHours, description, status, date, employee } = req.body;

    const record = await Overtime.findById(req.params.id).populate("employee");
    if (!record) return res.status(404).json({ error: "Overtime record not found" });

    if (regularHours !== undefined) record.regularHours = parseFloat(regularHours);
    if (overtimeHours !== undefined) record.overtimeHours = parseFloat(overtimeHours);
    if (description !== undefined) record.description = description;
    if (date !== undefined) record.date = new Date(date);
    if (employee !== undefined) record.employee = employee;

    if (regularHours !== undefined || overtimeHours !== undefined) {
      record.totalHours = record.regularHours + record.overtimeHours;
    }

    if (status && ["Approved", "Rejected"].includes(status) && record.status === "Pending") {
      record.status = status;
      record.approvedBy = req.user?.id;
      record.approvedAt = new Date();
    }

    // recompute overtimeId if date/employee changed or if missing
    if (!record.overtimeId || date !== undefined || employee !== undefined) {
      const empDoc = employee !== undefined
        ? await Employee.findById(record.employee)
        : record.employee;
      record.overtimeId = buildOvertimeId(empDoc, record.date, record._id);
    }

    await record.save();

    const updatedRecord = await Overtime.findById(record._id)
      .populate("employee", "name id employeeCode code empId staffId employeeId customId hrId")
      .populate("approvedBy", "name")
      .populate("createdBy", "name");

    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete overtime record
export const deleteOvertimeRecord = async (req, res) => {
  try {
    const record = await Overtime.findById(req.params.id);
    if (!record) return res.status(404).json({ error: "Overtime record not found" });

    await Overtime.findByIdAndDelete(req.params.id);
    res.json({ message: "Overtime record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Analytics endpoints (unchanged from your working version)
 * mode=trend&window=30|90|365
 * mode=top&range=thisMonth|lastMonth
 */
export const getOvertimeAnalytics = async (req, res) => {
  try {
    const { mode = 'trend', window = '30', range = 'thisMonth' } = req.query;

    if (mode === 'trend') {
      const now = new Date();
      const days = Number(window) || 30;
      let start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (days - 1));

      const groupStage =
        days >= 365
          ? { _id: { $month: '$date' }, hours: { $sum: '$overtimeHours' } }
          : { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, hours: { $sum: '$overtimeHours' } };

      const data = await Overtime.aggregate([
        { $match: { date: { $gte: start, $lte: now } } },
        { $group: groupStage },
        { $sort: { _id: 1 } },
      ]);

      const trendData =
        days >= 365
          ? data.map((d) => ({ label: `Month ${d._id}`, hours: d.hours }))
          : data.map((d) => ({ date: d._id, hours: d.hours }));

      return res.json({ trendData });
    }

    if (mode === 'top') {
      const today = new Date();
      let month = today.getMonth();
      let year = today.getFullYear();
      if (range === 'lastMonth') {
        if (month === 0) { month = 11; year -= 1; } else { month -= 1; }
      }
      const startDate = new Date(year, month, 1, 0, 0, 0);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const topEmployees = await Overtime.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$employee', hours: { $sum: '$overtimeHours' } } },
        { $sort: { hours: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'emp' } },
        { $unwind: '$emp' },
        { $project: { name: '$emp.name', hours: { $round: ['$hours', 2] } } }
      ]);

      return res.json({ topEmployees });
    }

    res.json({ trendData: [], topEmployees: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export overtime records to PDF
export const exportOvertimePDF = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    
    console.log("Starting PDF generation with params:", { month, year, employeeId });
    
    // Use PDFDocument from pdfkit (same as employee controller)
    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ 
      margin: 40,
      autoFirstPage: true,
      size: 'A4'
    });
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Overtime_Records_${year || 'All'}_${month || 'All'}.pdf`);
    console.log("PDFDocument created and headers set");

    // Pipe PDF to response
    doc.pipe(res);
    
    // Company information
    const companyName = "Mount Olive Farm House";
    const companyAddress = "No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka";
    const companyContact = "Phone: +94 81 249 2134 | Email: info@mountolivefarm.com";
    const reportDate = new Date().toLocaleDateString();
    const reportTime = new Date().toLocaleTimeString();
    
    // Header section with light green background
    doc.rect(40, 40, 515, 80).fill('#90EE90'); // Light green background
    
    // Company name - large, bold, dark blue
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#1e3a8a') // Dark blue
       .text(companyName, 297, 60, { align: 'center' });
    
    // Report title
    doc.fontSize(18)
       .fillColor('#1e3a8a') // Dark blue
       .text('OVERTIME REPORT', 297, 85, { align: 'center' });
    
    // Company details
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#374151') // Gray
       .text(companyAddress, 297, 105, { align: 'center' })
       .text(companyContact, 297, 115, { align: 'center' });
    
    // Report metadata
    doc.fontSize(10)
       .fillColor('#374151')
       .text(`Report Generated: ${reportDate} at ${reportTime}`, 60, 140);
    
    const monthName = month ? new Date(year, month - 1).toLocaleString('default', { month: 'long' }) : 'All Months';
    const periodText = month && year ? `${monthName} ${year}` : 'All Time';
    doc.text(`Period: ${periodText}`, 60, 155);
    
    const reportId = `MOF-OT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    doc.text(`Report ID: ${reportId}`, 60, 170);

    // Build query for overtime records
    let query = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }
    if (employeeId) {
      query.employee = employeeId;
    }

    console.log("Querying overtime records with query:", query);
    const overtimeRecords = await Overtime.find(query)
      .populate("employee", "name id")
      .sort({ date: -1 });
    console.log(`Found ${overtimeRecords.length} overtime records`);

    // Calculate summary statistics
    let totalOvertimeHours = 0;
    let totalRecords = overtimeRecords.length;
    let approvedRecords = 0;
    let pendingRecords = 0;

    overtimeRecords.forEach(record => {
      if (typeof record.overtimeHours === 'string') {
        const [hours, minutes] = record.overtimeHours.split(':').map(Number);
        totalOvertimeHours += hours + (minutes / 60);
      } else {
        totalOvertimeHours += record.overtimeHours || 0;
      }
      
      if (record.status === 'Approved') approvedRecords++;
      if (record.status === 'Pending') pendingRecords++;
    });

    // Overtime Summary Section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#22c55e') // Green
       .text("OVERTIME SUMMARY", 60, 200);

    // Summary table using simple text formatting
    const summaryData = [
      ['Total Records', totalRecords.toString()],
      ['Approved Records', approvedRecords.toString()],
      ['Pending Records', pendingRecords.toString()],
      ['Total Overtime Hours', `${Math.floor(totalOvertimeHours)}:${String(Math.round((totalOvertimeHours % 1) * 60)).padStart(2, '0')}`]
    ];

    let currentY = 230;
    summaryData.forEach(([label, value]) => {
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text(label + ':', 60, currentY);
      
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#22c55e')
         .text(value, 200, currentY);
      
      currentY += 20;
    });

    // Detailed Overtime Data Section
    currentY += 20;
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#1e3a8a') // Blue
       .text("DETAILED OVERTIME DATA", 60, currentY);

    if (overtimeRecords.length > 0) {
      currentY += 30;
      
      // Table headers
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1e3a8a')
         .text('Date', 60, currentY)
         .text('Employee', 150, currentY)
         .text('Regular', 280, currentY)
         .text('Overtime', 350, currentY)
         .text('Total', 420, currentY);
      
      currentY += 20;
      
      // Table data
      overtimeRecords.forEach(record => {
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#374151')
           .text(new Date(record.date).toLocaleDateString(), 60, currentY)
           .text(record.employee?.name || 'Unknown', 150, currentY)
           .text(`${record.regularHours || 8}:00`, 280, currentY)
           .text(record.overtimeHours?.toString() || '0', 350, currentY)
           .text(record.totalHours?.toString() || `${(record.regularHours || 8) + (record.overtimeHours || 0)}`, 420, currentY);
        
        currentY += 15;
        
        // Add page break if needed
        if (currentY > 700) {
          doc.addPage();
          currentY = 60;
        }
      });
    } else {
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#374151')
         .text('No overtime records found for the selected period', 297, currentY + 30, { align: 'center' });
    }

    // Footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Footer background
      doc.rect(40, 750, 515, 30).fill('#f9fafb'); // Light gray
      
      // Footer content
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#374151')
         .text(`Page ${i + 1} of ${pageCount}`, 60, 760)
         .text(`Generated on ${new Date().toLocaleString()}`, 297, 760, { align: 'center' })
         .text(companyName, 555, 760, { align: 'right' });
      
      // Footer line
      doc.strokeColor('#22c55e')
         .lineWidth(2)
         .moveTo(60, 755)
         .lineTo(555, 755)
         .stroke();
    }

    // Finalize PDF
    console.log("Finalizing PDF...");
    doc.end();
    console.log("PDF generation completed successfully");
  } catch (error) {
    console.error("Export overtime PDF error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Error exporting overtime PDF",
      error: error.message,
      stack: error.stack 
    });
  }
};