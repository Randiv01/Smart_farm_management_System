import Salary from "../E-model/Salary.js";
import Employee from "../E-model/Employee.js";
import Attendance from "../E-model/Attendance.js";
import Overtime from "../E-model/Overtime.js";

// Get all salary records with filtering and pagination
export const getSalaries = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      status = "", 
      department = "",
      year = new Date().getFullYear(),
      month = new Date().getMonth() + 1,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = {};

    // Add search filter
    if (search) {
      query.$or = [
        { employeeId: { $regex: search, $options: "i" } },
        { employeeName: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } }
      ];
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add department filter
    if (department) {
      query.department = department;
    }

    // Add payroll period filter
    query["payrollPeriod.year"] = parseInt(year);
    query["payrollPeriod.month"] = parseInt(month);

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const salaries = await Salary.find(query)
      .populate('employee', 'id name title photo')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Salary.countDocuments(query);

    res.json({
      salaries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    });
  } catch (error) {
    console.error("Get salaries error:", error);
    res.status(500).json({ message: "Error fetching salary records" });
  }
};

// Get salary summary for dashboard
export const getSalarySummary = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

    const query = {
      "payrollPeriod.year": parseInt(year),
      "payrollPeriod.month": parseInt(month)
    };

    // Calculate totals
    const summary = await Salary.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalPayroll: { $sum: "$totalSalary" },
          totalOvertime: { $sum: "$overtimePay" },
          pendingPayments: {
            $sum: {
              $cond: [
                { $in: ["$status", ["Pending", "Processing"]] },
                "$totalSalary",
                0
              ]
            }
          },
          pendingCount: {
            $sum: {
              $cond: [
                { $in: ["$status", ["Pending", "Processing"]] },
                1,
                0
              ]
            }
          },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Paid"] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get department-wise distribution
    const departmentDistribution = await Salary.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$department",
          totalSalary: { $sum: "$totalSalary" },
          employeeCount: { $sum: 1 }
        }
      },
      { $sort: { totalSalary: -1 } }
    ]);

    // Get monthly trend (last 6 months)
    const monthlyTrend = await Salary.aggregate([
      {
        $match: {
          "payrollPeriod.year": parseInt(year),
          "payrollPeriod.month": { $gte: parseInt(month) - 5, $lte: parseInt(month) }
        }
      },
      {
        $group: {
          _id: {
            year: "$payrollPeriod.year",
            month: "$payrollPeriod.month"
          },
          totalPayroll: { $sum: "$totalSalary" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const result = {
      summary: summary[0] || {
        totalPayroll: 0,
        totalOvertime: 0,
        pendingPayments: 0,
        pendingCount: 0,
        paidCount: 0
      },
      departmentDistribution,
      monthlyTrend
    };

    res.json(result);
  } catch (error) {
    console.error("Get salary summary error:", error);
    res.status(500).json({ message: "Error fetching salary summary" });
  }
};

// Get single salary record
export const getSalaryById = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id)
      .populate('employee', 'id name title contact photo')
      .populate('processedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!salary) {
      return res.status(404).json({ message: "Salary record not found" });
    }

    res.json(salary);
  } catch (error) {
    console.error("Get salary by ID error:", error);
    res.status(500).json({ message: "Error fetching salary record" });
  }
};

// Process payroll for a specific month
export const processPayroll = async (req, res) => {
  try {
    const { year, month, employeeIds = [] } = req.body;

    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required" });
    }

    const payrollYear = parseInt(year);
    const payrollMonth = parseInt(month);

    // Get all employees or specific employees
    let employees;
    if (employeeIds.length > 0) {
      employees = await Employee.find({ id: { $in: employeeIds } });
    } else {
      employees = await Employee.find({});
    }

    if (employees.length === 0) {
      return res.status(400).json({ message: "No employees found" });
    }

    const processedSalaries = [];

    for (const employee of employees) {
      // Check if salary already exists for this period
      const existingSalary = await Salary.findOne({
        employee: employee._id,
        "payrollPeriod.year": payrollYear,
        "payrollPeriod.month": payrollMonth
      });

      if (existingSalary) {
        console.log(`Salary already exists for ${employee.id} - ${payrollMonth}/${payrollYear}`);
        continue;
      }

      // Get attendance data for the month
      const startDate = new Date(payrollYear, payrollMonth - 1, 1);
      const endDate = new Date(payrollYear, payrollMonth, 0, 23, 59, 59);

      const attendanceRecords = await Attendance.find({
        employeeId: employee.id,
        date: { $gte: startDate, $lte: endDate }
      });

      // Get overtime data for the month
      const overtimeRecords = await Overtime.find({
        employee: employee._id,
        date: { $gte: startDate, $lte: endDate },
        status: "Approved"
      });

      // Calculate basic salary (assuming fixed monthly salary based on position)
      const basicSalary = getBasicSalaryByPosition(employee.title);

    // Calculate overtime pay with fixed rates
    let overtimePay = 0;
    let totalOvertimeHours = "0:00";
    const overtimeRate = getOvertimeRateByPosition(employee.title);

    for (const overtime of overtimeRecords) {
      if (typeof overtime.overtimeHours === 'string' && overtime.overtimeHours.includes(':')) {
        const [hours, minutes] = overtime.overtimeHours.split(':').map(Number);
        // Fixed overtime rate per hour
        overtimePay += (hours + minutes / 60) * overtimeRate;
        
        // Add to total overtime hours
        const [currentHours, currentMinutes] = totalOvertimeHours.split(':').map(Number);
        const newTotalMinutes = (currentHours * 60 + currentMinutes) + (hours * 60 + minutes);
        const newHours = Math.floor(newTotalMinutes / 60);
        const newMinutes = newTotalMinutes % 60;
        totalOvertimeHours = `${newHours}:${newMinutes.toString().padStart(2, '0')}`;
      }
    }

      // Calculate attendance-based deductions
      let attendanceDeductions = 0;
      const workingDays = new Date(payrollYear, payrollMonth, 0).getDate(); // Days in month
      const presentDays = attendanceRecords.filter(record => 
        record.status === "Present" || record.status === "Late"
      ).length;
      const absentDays = workingDays - presentDays;

      if (absentDays > 0) {
        const dailyRate = basicSalary / workingDays;
        attendanceDeductions = absentDays * dailyRate;
      }

      // Create salary record
      const salaryData = {
        employee: employee._id,
        employeeId: employee.id,
        employeeName: employee.name,
        position: employee.title,
        payrollPeriod: {
          year: payrollYear,
          month: payrollMonth
        },
        basicSalary,
        overtimePay: Math.round(overtimePay),
        overtimeHours: totalOvertimeHours,
        allowances: 0,
        deductions: Math.round(attendanceDeductions),
        totalSalary: basicSalary + Math.round(overtimePay),
        status: "Pending",
        department: getDepartmentByPosition(employee.title),
        taxDeduction: calculateTaxDeduction(basicSalary),
        insuranceDeduction: calculateInsuranceDeduction(basicSalary)
      };

      const salary = new Salary(salaryData);
      await salary.save();
      processedSalaries.push(salary);
    }

    res.json({
      message: `Payroll processed successfully for ${payrollMonth}/${payrollYear}`,
      processedCount: processedSalaries.length,
      salaries: processedSalaries
    });
  } catch (error) {
    console.error("Process payroll error:", error);
    res.status(500).json({ message: "Error processing payroll" });
  }
};

// Update salary record
export const updateSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.employee;
    delete updateData.employeeId;
    delete updateData.employeeName;
    delete updateData.payrollPeriod;

    const salary = await Salary.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('employee', 'id name title');

    if (!salary) {
      return res.status(404).json({ message: "Salary record not found" });
    }

    res.json(salary);
  } catch (error) {
    console.error("Update salary error:", error);
    res.status(500).json({ message: "Error updating salary record" });
  }
};

// Create individual salary record
export const createSalary = async (req, res) => {
  try {
    console.log('createSalary called with data:', req.body);
    
    const {
      employeeId,
      employeeName,
      position,
      basicSalary,
      overtimePay = 0,
      overtimeHours = "0:00",
      allowances = 0,
      deductions = 0,
      payrollPeriod,
      department,
      performanceBonus = 0,
      commission = 0,
      taxDeduction = 0,
      insuranceDeduction = 0,
      status = "Pending",
      paymentMethod = "Bank Transfer",
      remarks = ""
    } = req.body;
    
    console.log('Parsed data:', {
      employeeId,
      employeeName,
      position,
      basicSalary,
      overtimePay,
      overtimeHours,
      allowances,
      deductions,
      payrollPeriod,
      department
    });

    // Validation
    if (!employeeId || !employeeName || !position || !basicSalary || !payrollPeriod) {
      return res.status(400).json({ 
        message: "Employee ID, Name, Position, Basic Salary, and Payroll Period are required" 
      });
    }

    if (!payrollPeriod.year || !payrollPeriod.month) {
      return res.status(400).json({ 
        message: "Payroll period must include year and month" 
      });
    }

    if (basicSalary < 0 || overtimePay < 0 || allowances < 0 || deductions < 0) {
      return res.status(400).json({ 
        message: "Salary amounts cannot be negative" 
      });
    }

    // Check if salary already exists for this employee and period
    const existingSalary = await Salary.findOne({
      employeeId,
      "payrollPeriod.year": payrollPeriod.year,
      "payrollPeriod.month": payrollPeriod.month
    });

    if (existingSalary) {
      return res.status(400).json({ 
        message: `Salary record already exists for ${employeeId} in ${payrollPeriod.year}/${payrollPeriod.month}` 
      });
    }

    // Verify employee exists and get auto-calculated basic salary
    const Employee = (await import("../E-model/Employee.js")).default;
    const employee = await Employee.findOne({ id: employeeId });
    
    // Auto-calculate basic salary based on position if not provided
    const finalBasicSalary = basicSalary || getBasicSalaryByPosition(position);
    
    // Auto-calculate overtime pay based on overtime hours if not provided
    let finalOvertimePay = parseFloat(overtimePay);
    if (!overtimePay && overtimeHours && overtimeHours !== "0:00") {
      const [hours, minutes] = overtimeHours.split(':').map(Number);
      const overtimeRate = getOvertimeRateByPosition(position);
      finalOvertimePay = (hours + minutes / 60) * overtimeRate;
    }
    
    const salaryData = {
      employee: employee ? employee._id : null,
      employeeId,
      employeeName,
      position,
      payrollPeriod,
      basicSalary: parseFloat(finalBasicSalary),
      overtimePay: finalOvertimePay,
      overtimeHours,
      allowances: parseFloat(allowances),
      deductions: parseFloat(deductions),
      totalSalary: parseFloat(finalBasicSalary) + finalOvertimePay + parseFloat(allowances),
      status,
      paymentMethod,
      department: department || getDepartmentByPosition(position),
      performanceBonus: parseFloat(performanceBonus),
      commission: parseFloat(commission),
      taxDeduction: parseFloat(taxDeduction),
      insuranceDeduction: parseFloat(insuranceDeduction),
      netSalary: parseFloat(finalBasicSalary) + finalOvertimePay + parseFloat(allowances) + parseFloat(performanceBonus) + parseFloat(commission) - parseFloat(deductions) - parseFloat(taxDeduction) - parseFloat(insuranceDeduction),
      remarks
    };

    console.log('Creating salary with data:', salaryData);
    
    const salary = new Salary(salaryData);
    await salary.save();
    
    console.log('Salary created successfully:', salary);

    res.status(201).json({
      message: "Salary record created successfully",
      salary
    });
  } catch (error) {
    console.error("Create salary error:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: errors.join(", ") });
    }
    res.status(500).json({ message: "Error creating salary record" });
  }
};

// Delete salary record
export const deleteSalary = async (req, res) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);

    if (!salary) {
      return res.status(404).json({ message: "Salary record not found" });
    }

    res.json({ message: "Salary record deleted successfully" });
  } catch (error) {
    console.error("Delete salary error:", error);
    res.status(500).json({ message: "Error deleting salary record" });
  }
};

// Export salary data to Excel
export const exportSalaryExcel = async (req, res) => {
  try {
    const { year, month, format = 'excel' } = req.query;

    const query = {};
    if (year && month) {
      query["payrollPeriod.year"] = parseInt(year);
      query["payrollPeriod.month"] = parseInt(month);
    }

    const salaries = await Salary.find(query)
      .populate('employee', 'id name title contact')
      .sort({ employeeName: 1 });

    // Create Excel data
    const excelData = salaries.map(salary => ({
      'Employee ID': salary.employeeId,
      'Employee Name': salary.employeeName,
      'Position': salary.position,
      'Department': salary.department,
      'Basic Salary': salary.basicSalary,
      'Overtime Pay': salary.overtimePay,
      'Overtime Hours': salary.overtimeHours,
      'Allowances': salary.allowances,
      'Deductions': salary.deductions,
      'Tax Deduction': salary.taxDeduction,
      'Insurance Deduction': salary.insuranceDeduction,
      'Total Salary': salary.totalSalary,
      'Net Salary': salary.netSalary,
      'Status': salary.status,
      'Payment Method': salary.paymentMethod,
      'Payment Date': salary.paymentDate ? salary.paymentDate.toLocaleDateString() : '',
      'Processed Date': salary.createdAt.toLocaleDateString(),
      'Remarks': salary.remarks || ''
    }));

    // For now, return JSON data (frontend can handle Excel conversion)
    res.json({
      data: excelData,
      filename: `Salary_Report_${year || 'All'}_${month || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`
    });
  } catch (error) {
    console.error("Export salary Excel error:", error);
    res.status(500).json({ message: "Error exporting salary data" });
  }
};

// Export salary data to PDF
export const exportSalaryPDF = async (req, res) => {
  try {
    const { year, month, employeeId } = req.query;
    const PDFDocument = (await import('pdfkit')).default;

    const doc = new PDFDocument({ 
      margin: 50,
      autoFirstPage: true,
      size: 'A4'
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Salary_Report_${year || 'All'}_${month || 'All'}.pdf`);

    // Company header
    doc.fontSize(18).font('Helvetica-Bold').fillColor('green');
    doc.text('Mount Olive Farm House', 50, 50);
    doc.fontSize(12).font('Helvetica').fillColor('black');
    doc.text('Salary Report', 50, 75);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 50, 90);

    let query = {};
    if (year && month) {
      query["payrollPeriod.year"] = parseInt(year);
      query["payrollPeriod.month"] = parseInt(month);
    }
    if (employeeId) {
      query.employeeId = employeeId;
    }

    const salaries = await Salary.find(query)
      .populate('employee', 'id name title')
      .sort({ employeeName: 1 });

    let currentY = 120;

    // Table header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Employee ID', 50, currentY);
    doc.text('Name', 120, currentY);
    doc.text('Position', 200, currentY);
    doc.text('Basic', 280, currentY);
    doc.text('Overtime', 340, currentY);
    doc.text('Total', 400, currentY);
    doc.text('Status', 460, currentY);
    currentY += 20;

    // Table data
    doc.fontSize(9).font('Helvetica');
    for (const salary of salaries) {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      doc.text(salary.employeeId, 50, currentY);
      doc.text(salary.employeeName, 120, currentY);
      doc.text(salary.position, 200, currentY);
      doc.text(`$${salary.basicSalary}`, 280, currentY);
      doc.text(`$${salary.overtimePay}`, 340, currentY);
      doc.text(`$${salary.totalSalary}`, 400, currentY);
      doc.text(salary.status, 460, currentY);
      currentY += 15;
    }

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Export salary PDF error:", error);
    res.status(500).json({ message: "Error exporting salary PDF" });
  }
};

// Get employees for salary form dropdown
export const getEmployeesForSalary = async (req, res) => {
  try {
    const Employee = (await import("../E-model/Employee.js")).default;
    const employees = await Employee.find({})
      .select('id name title')
      .sort({ name: 1 });

    res.json(employees);
  } catch (error) {
    console.error("Get employees for salary error:", error);
    res.status(500).json({ message: "Error fetching employees" });
  }
};

// Debug endpoint to check overtime data for an employee
export const debugOvertimeData = async (req, res) => {
  try {
    const { employeeId, year, month } = req.query;
    
    console.log('Debug overtime data called with:', { employeeId, year, month });
    
    if (!employeeId || !year || !month) {
      return res.status(400).json({ message: "employeeId, year, and month are required" });
    }

    // Find employee by string ID
    const Employee = (await import("../E-model/Employee.js")).default;
    const employee = await Employee.findOne({ id: employeeId });
    
    console.log('Found employee:', employee ? { id: employee.id, name: employee.name, _id: employee._id } : 'Not found');
    
    if (!employee) {
      // Let's also check all employees to see what's available
      const allEmployees = await Employee.find({}, { id: 1, name: 1, _id: 1 });
      console.log('All employees in database:', allEmployees);
      return res.status(404).json({ 
        message: "Employee not found",
        availableEmployees: allEmployees.map(emp => ({ id: emp.id, name: emp.name }))
      });
    }

    // Find overtime records for this employee and period
    const Overtime = (await import("../E-model/Overtime.js")).default;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    console.log('Searching overtime records for:', {
      employee: employee._id,
      dateRange: { $gte: startDate, $lte: endDate }
    });
    
    // First, let's check all overtime records for this employee
    const allOvertimeRecords = await Overtime.find({ employee: employee._id });
    console.log('All overtime records for employee:', allOvertimeRecords);
    
    const overtimeRecords = await Overtime.find({
      employee: employee._id,
      date: { $gte: startDate, $lte: endDate }
    });
    
    console.log('Overtime records found for period:', overtimeRecords);

    // Calculate total overtime hours and pay for debugging
    let totalMinutes = 0;
    let calculatedPay = 0;
    
    for (const record of overtimeRecords) {
      console.log('Overtime record:', record);
      if (typeof record.overtimeHours === 'string' && record.overtimeHours.includes(':')) {
        const [hours, minutes] = record.overtimeHours.split(':').map(Number);
        totalMinutes += (hours * 60) + minutes;
      } else if (typeof record.overtimeHours === 'number') {
        totalMinutes += record.overtimeHours * 60;
      }
    }
    
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const totalOvertimeHours = `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`;
    
    // Calculate pay using fixed overtime rates
    const basicSalary = getBasicSalaryByPosition(employee.title);
    const overtimeRate = getOvertimeRateByPosition(employee.title);
    calculatedPay = (totalMinutes / 60) * overtimeRate;

    res.json({
      employee: {
        id: employee.id,
        name: employee.name,
        title: employee.title,
        _id: employee._id
      },
      period: { year: parseInt(year), month: parseInt(month) },
      searchCriteria: {
        employee: employee._id,
        dateRange: { start: startDate, end: endDate }
      },
      allOvertimeRecords: allOvertimeRecords,
      overtimeRecords: overtimeRecords,
      totalRecords: overtimeRecords.length,
      calculatedOvertime: {
        totalMinutes: totalMinutes,
        totalOvertimeHours: totalOvertimeHours,
        calculatedPay: Math.round(calculatedPay),
        basicSalary: basicSalary,
        overtimeRate: overtimeRate,
        position: employee.title
      }
    });
  } catch (error) {
    console.error("Debug overtime data error:", error);
    res.status(500).json({ message: "Error debugging overtime data" });
  }
};

// Get salary analytics for charts
export const getSalaryAnalytics = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), months = 6 } = req.query;

    // Monthly payroll trend
    const monthlyTrend = await Salary.aggregate([
      {
        $match: {
          "payrollPeriod.year": parseInt(year)
        }
      },
      {
        $group: {
          _id: {
            year: "$payrollPeriod.year",
            month: "$payrollPeriod.month"
          },
          totalPayroll: { $sum: "$totalSalary" },
          totalOvertime: { $sum: "$overtimePay" },
          employeeCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1 } },
      { $limit: parseInt(months) }
    ]);

    // Department distribution
    const departmentDistribution = await Salary.aggregate([
      {
        $match: {
          "payrollPeriod.year": parseInt(year),
          "payrollPeriod.month": new Date().getMonth() + 1
        }
      },
      {
        $group: {
          _id: "$department",
          totalSalary: { $sum: "$totalSalary" },
          employeeCount: { $sum: 1 },
          avgSalary: { $avg: "$totalSalary" }
        }
      },
      { $sort: { totalSalary: -1 } }
    ]);

    // Status distribution
    const statusDistribution = await Salary.aggregate([
      {
        $match: {
          "payrollPeriod.year": parseInt(year),
          "payrollPeriod.month": new Date().getMonth() + 1
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalSalary" }
        }
      }
    ]);

    res.json({
      monthlyTrend,
      departmentDistribution,
      statusDistribution
    });
  } catch (error) {
    console.error("Get salary analytics error:", error);
    res.status(500).json({ message: "Error fetching salary analytics" });
  }
};

// Helper functions
function getBasicSalaryByPosition(position) {
  // Sri Lankan Rupees (LKR) - Monthly salaries
  const salaryRanges = {
    'Employee Manager': 150000,
    'Animal Manager': 120000,
    'Plant Manager': 120000,
    'Inventory Manager': 100000,
    'Animal Health Manager': 110000,
    'Plant Health Manager': 110000,
    'Worker': 45000,
    'Care Taker': 55000,
    'Cleaner': 35000,
    'Driver': 65000,
    'Other': 50000
  };
  return salaryRanges[position] || 50000;
}

function getOvertimeRateByPosition(position) {
  // Fixed overtime rates per hour in LKR
  const managerPositions = [
    'Employee Manager',
    'Animal Manager', 
    'Plant Manager',
    'Inventory Manager',
    'Animal Health Manager',
    'Plant Health Manager'
  ];
  
  if (managerPositions.includes(position)) {
    return 200; // LKR 200 per hour for managers
  } else {
    return 100; // LKR 100 per hour for others (Worker, Care Taker, Cleaner, Driver, Other)
  }
}

function getDepartmentByPosition(position) {
  const departments = {
    'Employee Manager': 'Management',
    'Animal Manager': 'Animal Operations',
    'Plant Manager': 'Plant Operations',
    'Inventory Manager': 'Inventory',
    'Animal Health Manager': 'Animal Health',
    'Plant Health Manager': 'Plant Health',
    'Worker': 'Operations',
    'Care Taker': 'Animal Care',
    'Cleaner': 'Maintenance',
    'Driver': 'Logistics',
    'Other': 'General'
  };
  return departments[position] || 'General';
}

function calculateTaxDeduction(basicSalary) {
  // Simple tax calculation (adjust based on your tax rules)
  if (basicSalary > 3000) {
    return Math.round(basicSalary * 0.15); // 15% tax
  } else if (basicSalary > 2000) {
    return Math.round(basicSalary * 0.10); // 10% tax
  }
  return Math.round(basicSalary * 0.05); // 5% tax
}

function calculateInsuranceDeduction(basicSalary) {
  return Math.round(basicSalary * 0.05); // 5% insurance
}
