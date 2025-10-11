// E-control/reportController.js - Employee Reports Controller
import Employee from "../E-model/Employee.js";
import Attendance from "../E-model/Attendance.js";
import Salary from "../E-model/Salary.js";
import Overtime from "../E-model/Overtime.js";
import Leave from "../E-model/Leave.js";
import mongoose from "mongoose";
import PDFReportGenerator from "../E-utils/pdfGenerator.js";

// Get all employees with search and filter functionality
export const getEmployeesForReports = async (req, res) => {
  try {
    const { search, department, page = 1, limit = 50 } = req.query;
    
    // Build search query
    let query = {};
    
    // Search by name or ID
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { id: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by department using the actual department field
    if (department && department !== 'all') {
      // Map frontend department values to actual department names
      const departmentMap = {
        'farm': 'Farm Operations',
        'inventory': 'Inventory Management', 
        'health': 'Health Management',
        'admin': 'Administration',
        'employee': 'Employee Management',
        'plant': 'Plant Management',
        'animal': 'Animal Management'
      };
      
      const actualDepartment = departmentMap[department];
      if (actualDepartment) {
        query.department = actualDepartment;
      }
    }
    
    const employees = await Employee.find(query)
      .select('id name title contact joined photo department email')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Employee.countDocuments(query);
    
    res.json({
      success: true,
      data: employees,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
      error: error.message
    });
  }
};

// Get comprehensive employee report data
export const getEmployeeReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    
    // Get employee basic info
    const employee = await Employee.findOne({ id: employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    
    // Get current month attendance summary
    const currentMonth = new Date(year, month - 1);
    const nextMonth = new Date(year, month);
    
    const attendanceData = await Attendance.find({
      employeeId: employeeId,
      date: {
        $gte: currentMonth,
        $lt: nextMonth
      }
    });
    
    const attendanceSummary = {
      total: attendanceData.length,
      present: attendanceData.filter(a => a.status === 'Present').length,
      absent: attendanceData.filter(a => a.status === 'Absent').length,
      late: attendanceData.filter(a => a.status === 'Late').length,
      onLeave: attendanceData.filter(a => a.status === 'On Leave').length
    };
    
    // Get overtime data for current month
    const overtimeData = await Overtime.find({
      employee: employee._id,
      date: {
        $gte: currentMonth,
        $lt: nextMonth
      },
      status: 'Approved'
    });
    
    const totalOvertimeHours = overtimeData.reduce((total, ot) => {
      // Handle both string "2:30" and number formats
      if (typeof ot.overtimeHours === 'string') {
        const [hours, minutes] = ot.overtimeHours.split(':').map(Number);
        return total + hours + (minutes / 60);
      }
      return total + (ot.overtimeHours || 0);
    }, 0);
    
    // Get last month overtime for comparison
    const lastMonth = new Date(year, month - 2);
    const lastMonthStart = new Date(year, month - 2);
    
    const lastMonthOvertime = await Overtime.find({
      employee: employee._id,
      date: {
        $gte: lastMonthStart,
        $lt: currentMonth
      },
      status: 'Approved'
    });
    
    const lastMonthOvertimeHours = lastMonthOvertime.reduce((total, ot) => {
      if (typeof ot.overtimeHours === 'string') {
        const [hours, minutes] = ot.overtimeHours.split(':').map(Number);
        return total + hours + (minutes / 60);
      }
      return total + (ot.overtimeHours || 0);
    }, 0);
    
    // Get current month salary data
    const salaryData = await Salary.findOne({
      employee: employee._id,
      'payrollPeriod.year': parseInt(year),
      'payrollPeriod.month': parseInt(month)
    });
    
    // Get leave summary for current year
    const leaveData = await Leave.find({
      empId: employeeId,
      year: parseInt(year),
      status: 'Approved'
    });
    
    const leaveSummary = {
      annual: { used: 0, total: 21 }, // Default values
      sick: { used: 0, total: 14 },
      casual: { used: 0, total: 7 },
      other: { used: 0, total: 5 }
    };
    
    leaveData.forEach(leave => {
      if (leave.type === 'Annual') leaveSummary.annual.used += leave.days;
      else if (leave.type === 'Sick') leaveSummary.sick.used += leave.days;
      else if (leave.type === 'Casual') leaveSummary.casual.used += leave.days;
      else leaveSummary.other.used += leave.days;
    });
    
    // Compile comprehensive report
    const reportData = {
      employee: {
        id: employee.id,
        name: employee.name,
        title: employee.title,
        contact: employee.contact,
        joined: employee.joined,
        photo: employee.photo,
        department: employee.department,
        email: employee.email,
        address: employee.address,
        status: employee.status
      },
      attendance: attendanceSummary,
      overtime: {
        currentMonth: parseFloat(totalOvertimeHours.toFixed(1)),
        lastMonth: parseFloat(lastMonthOvertimeHours.toFixed(1))
      },
      salary: salaryData ? {
        basic: salaryData.basicSalary,
        overtime: salaryData.overtimePay,
        allowances: salaryData.allowances,
        deductions: salaryData.deductions,
        total: salaryData.totalSalary,
        net: salaryData.netSalary,
        status: salaryData.status
      } : null,
      leave: leaveSummary,
      period: {
        year: parseInt(year),
        month: parseInt(month),
        monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' })
      }
    };
    
    res.json({
      success: true,
      data: reportData
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate employee report",
      error: error.message
    });
  }
};

// Get detailed attendance report for an employee
export const getAttendanceReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const attendanceData = await Attendance.find({
      employeeId: employeeId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });
    
    const summary = {
      totalDays: attendanceData.length,
      present: attendanceData.filter(a => a.status === 'Present').length,
      absent: attendanceData.filter(a => a.status === 'Absent').length,
      late: attendanceData.filter(a => a.status === 'Late').length,
      onLeave: attendanceData.filter(a => a.status === 'On Leave').length,
      attendanceRate: 0
    };
    
    if (summary.totalDays > 0) {
      summary.attendanceRate = ((summary.present + summary.late) / summary.totalDays * 100).toFixed(1);
    }
    
    res.json({
      success: true,
      data: {
        summary,
        details: attendanceData,
        period: {
          year: parseInt(year),
          month: parseInt(month),
          monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' })
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate attendance report",
      error: error.message
    });
  }
};

// Get detailed overtime report for an employee
export const getOvertimeReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    
    const employee = await Employee.findOne({ id: employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const overtimeData = await Overtime.find({
      employee: employee._id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });
    
    let totalHours = 0;
    let approvedHours = 0;
    
    overtimeData.forEach(ot => {
      let hours = 0;
      if (typeof ot.overtimeHours === 'string') {
        const [h, m] = ot.overtimeHours.split(':').map(Number);
        hours = h + (m / 60);
      } else {
        hours = ot.overtimeHours || 0;
      }
      
      totalHours += hours;
      if (ot.status === 'Approved') {
        approvedHours += hours;
      }
    });
    
    const summary = {
      totalEntries: overtimeData.length,
      totalHours: parseFloat(totalHours.toFixed(2)),
      approvedHours: parseFloat(approvedHours.toFixed(2)),
      pendingHours: parseFloat((totalHours - approvedHours).toFixed(2)),
      averageDailyHours: overtimeData.length > 0 ? parseFloat((totalHours / overtimeData.length).toFixed(2)) : 0
    };
    
    res.json({
      success: true,
      data: {
        summary,
        details: overtimeData,
        period: {
          year: parseInt(year),
          month: parseInt(month),
          monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' })
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate overtime report",
      error: error.message
    });
  }
};

// Get detailed salary report for an employee
export const getSalaryReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year = new Date().getFullYear() } = req.query;
    
    const employee = await Employee.findOne({ id: employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    
    const salaryData = await Salary.find({
      employee: employee._id,
      'payrollPeriod.year': parseInt(year)
    }).sort({ 'payrollPeriod.month': 1 });
    
    const summary = {
      totalMonths: salaryData.length,
      totalEarnings: salaryData.reduce((sum, s) => sum + s.totalSalary, 0),
      totalNetSalary: salaryData.reduce((sum, s) => sum + s.netSalary, 0),
      averageSalary: salaryData.length > 0 ? salaryData.reduce((sum, s) => sum + s.totalSalary, 0) / salaryData.length : 0,
      lastPaidMonth: salaryData.length > 0 ? salaryData[salaryData.length - 1].payrollPeriod.month : null
    };
    
    res.json({
      success: true,
      data: {
        summary,
        details: salaryData,
        year: parseInt(year)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate salary report",
      error: error.message
    });
  }
};

// Get detailed leave report for an employee
export const getLeaveReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year = new Date().getFullYear() } = req.query;
    
    const leaveData = await Leave.find({
      empId: employeeId,
      year: parseInt(year)
    }).sort({ from: 1 });
    
    const summary = {
      totalLeaveDays: leaveData.reduce((sum, l) => sum + (l.days || 0), 0),
      approvedDays: leaveData.filter(l => l.status === 'Approved').reduce((sum, l) => sum + (l.days || 0), 0),
      pendingDays: leaveData.filter(l => l.status === 'Pending').reduce((sum, l) => sum + (l.days || 0), 0),
      rejectedDays: leaveData.filter(l => l.status === 'Rejected').reduce((sum, l) => sum + (l.days || 0), 0),
      leaveTypes: {
        annual: leaveData.filter(l => l.type === 'Annual' && l.status === 'Approved').reduce((sum, l) => sum + (l.days || 0), 0),
        sick: leaveData.filter(l => l.type === 'Sick' && l.status === 'Approved').reduce((sum, l) => sum + (l.days || 0), 0),
        casual: leaveData.filter(l => l.type === 'Casual' && l.status === 'Approved').reduce((sum, l) => sum + (l.days || 0), 0),
        other: leaveData.filter(l => l.type === 'Other' && l.status === 'Approved').reduce((sum, l) => sum + (l.days || 0), 0)
      }
    };
    
    res.json({
      success: true,
      data: {
        summary,
        details: leaveData,
        year: parseInt(year)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate leave report",
      error: error.message
    });
  }
};

// Export comprehensive report (PDF/Excel)
export const exportEmployeeReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { format = 'pdf', year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    
    // Get comprehensive report data
    const reportData = await getEmployeeReportData(employeeId, year, month);
    
    if (format === 'pdf') {
      // Generate comprehensive PDF report
      await generateComprehensivePDF(reportData, res);
    } else if (format === 'html') {
      // Generate HTML report
      const result = await PDFReportGenerator.generateEmployeeReport(reportData);
      
      if (result.success) {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${reportData.employee.name}_Report_${reportData.period.monthName}_${reportData.period.year}.html"`);
        res.send(result.html);
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to generate report",
          error: result.error
        });
      }
    } else if (format === 'json') {
      // Return JSON data for frontend processing
      res.json({
        success: true,
        data: reportData,
        message: "Report data exported successfully"
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Unsupported export format. Supported: html, pdf, json"
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to export report",
      error: error.message
    });
  }
};

// Export attendance report as PDF
export const exportAttendanceReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { format = 'pdf', year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    
    if (format === 'pdf') {
      const reportData = await getEmployeeReportData(employeeId, year, month);
      await generateAttendancePDF(reportData, res);
    } else {
      // Return JSON data
      const attendanceData = await getAttendanceReport(req, res);
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to export attendance report",
      error: error.message
    });
  }
};

// Export overtime report as PDF
export const exportOvertimeReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { format = 'pdf', year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    
    if (format === 'pdf') {
      const reportData = await getEmployeeReportData(employeeId, year, month);
      await generateOvertimePDF(reportData, res);
    } else {
      // Return JSON data
      const overtimeData = await getOvertimeReport(req, res);
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to export overtime report",
      error: error.message
    });
  }
};

// Export salary report as PDF
export const exportSalaryReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { format = 'pdf', year = new Date().getFullYear() } = req.query;
    
    if (format === 'pdf') {
      const reportData = await getEmployeeReportData(employeeId, year, new Date().getMonth() + 1);
      await generateSalaryPDF(reportData, res);
    } else {
      // Return JSON data
      const salaryData = await getSalaryReport(req, res);
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to export salary report",
      error: error.message
    });
  }
};

// Export leave report as PDF
export const exportLeaveReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { format = 'pdf', year = new Date().getFullYear() } = req.query;
    
    if (format === 'pdf') {
      const reportData = await getEmployeeReportData(employeeId, year, new Date().getMonth() + 1);
      await generateLeavePDF(reportData, res);
    } else {
      // Return JSON data
      const leaveData = await getLeaveReport(req, res);
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to export leave report",
      error: error.message
    });
  }
};

// Helper function to get comprehensive report data
async function getEmployeeReportData(employeeId, year, month) {
  const employee = await Employee.findOne({ id: employeeId });
  if (!employee) throw new Error("Employee not found");
  
  // Get all related data (similar to getEmployeeReport but more comprehensive)
  const currentMonth = new Date(year, month - 1);
  const nextMonth = new Date(year, month);
  
  const [attendanceData, overtimeData, salaryData, leaveData] = await Promise.all([
    Attendance.find({
      employeeId: employeeId,
      date: { $gte: currentMonth, $lt: nextMonth }
    }),
    Overtime.find({
      employee: employee._id,
      date: { $gte: currentMonth, $lt: nextMonth }
    }),
    Salary.find({
      employee: employee._id,
      'payrollPeriod.year': parseInt(year)
    }).sort({ 'payrollPeriod.month': 1 }),
    Leave.find({
      empId: employeeId,
      year: parseInt(year)
    })
  ]);
  
  return {
    employee,
    attendance: attendanceData,
    overtime: overtimeData,
    salary: salaryData,
    leave: leaveData,
    period: { year: parseInt(year), month: parseInt(month) }
  };
}

// PDF Generation Functions using jsPDF and autoTable (matching Animal Management professional style)
async function generateComprehensivePDF(reportData, res) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  
  const doc = new jsPDF('p', 'mm', 'a4');
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${reportData.employee.name}_Comprehensive_Report.pdf"`);
  
  // Company information - exactly like Animal Management
  const companyName = "Mount Olive Farm House";
  const companyAddress = "No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka";
  const companyContact = "Phone: +94 81 249 2134 | Email: info@mountolivefarm.com";
  const companyWebsite = "www.mountolivefarm.com";
  const reportDate = new Date().toLocaleDateString();
  const reportTime = new Date().toLocaleTimeString();
  
  // Professional color scheme - exactly like Animal Management
  const primaryColor = [34, 197, 94]; // Green
  const secondaryColor = [16, 185, 129]; // Teal
  const accentColor = [59, 130, 246]; // Blue
  const textColor = [31, 41, 55]; // Dark gray
  const lightGray = [243, 244, 246];

  // Add real company logo - exactly like Animal Management
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Try to load the actual logo from public folder
    const logoPath = path.join(process.cwd(), '..', 'FRONTEND', 'public', 'logo512.png');
    
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 20, 15, 25, 25);
    } else {
      // Fallback to placeholder if logo file doesn't exist
      doc.setFillColor(...primaryColor);
      doc.rect(20, 15, 25, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MOF', 30, 30, { align: 'center' });
    }
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback to placeholder
    doc.setFillColor(...primaryColor);
    doc.rect(20, 15, 25, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MOF', 30, 30, { align: 'center' });
  }

  // Company header - exactly like Animal Management
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 50, 20);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(companyAddress, 50, 26);
  doc.text(companyContact, 50, 31);
  doc.text(companyWebsite, 50, 36);

  // Report title with professional styling - exactly like Animal Management
  doc.setFillColor(...lightGray);
  doc.rect(20, 42, 170, 10, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("COMPREHENSIVE EMPLOYEE REPORT", 105, 49, { align: 'center' });

  // Report metadata - exactly like Animal Management
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Generated: ${reportDate} at ${reportTime}`, 20, 60);
  doc.text(`Employee: ${reportData.employee.name} (${reportData.employee.id})`, 20, 65);
  doc.text(`Report ID: MOF-CER-${Date.now().toString().slice(-6)}`, 20, 70);

  // Employee Information Section - exactly like Animal Management style
  doc.setFillColor(...secondaryColor);
  doc.rect(20, 80, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("EMPLOYEE INFORMATION", 25, 86);

  const employeeInfo = [
    ['Field', 'Value', 'Status'],
    ['Name', reportData.employee.name, 'Active'],
    ['Employee ID', reportData.employee.id, 'Active'],
    ['Department', reportData.employee.department, 'Active'],
    ['Title', reportData.employee.title, 'Active'],
    ['Email', reportData.employee.email || 'Not provided', 'Active'],
    ['Contact', reportData.employee.contact, 'Active'],
    ['Joined Date', reportData.employee.joined, 'Active'],
    ['Address', reportData.employee.address || 'Not provided', 'Active']
  ];

  // Create professional table for employee info - exactly like Animal Management
  autoTable(doc, {
    head: [employeeInfo[0]],
    body: employeeInfo.slice(1),
    startY: 95,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 20, right: 20 }
  });

  // Summary Statistics Section - exactly like Animal Management style
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFillColor(...accentColor);
  doc.rect(20, finalY, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("SUMMARY STATISTICS", 25, finalY + 6);

  const summaryData = [
    ['Metric', 'Value', 'Status'],
    ['Attendance Records', (reportData.attendance?.length || 0).toString(), 'Active'],
    ['Overtime Records', (reportData.overtime?.length || 0).toString(), 'Active'],
    ['Salary Records', (reportData.salary?.length || 0).toString(), 'Active'],
    ['Leave Records', (reportData.leave?.length || 0).toString(), 'Active']
  ];

  autoTable(doc, {
    head: [summaryData[0]],
    body: summaryData.slice(1),
    startY: finalY + 15,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 20, right: 20 }
  });

  // Professional footer - exactly like Animal Management
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer background
    doc.setFillColor(...lightGray);
    doc.rect(0, 280, 210, 15, 'F');
    
    // Footer content
    doc.setTextColor(...textColor);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 20, 288);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 288, { align: 'center' });
    doc.text(companyName, 190, 288, { align: 'right' });
    
    // Footer line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 290, 190, 290);
    
    // Disclaimer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text("This report is generated by Mount Olive Farm House Management System", 105, 293, { align: 'center' });
  }

  // Send the PDF
  const pdfOutput = doc.output('arraybuffer');
  res.send(Buffer.from(pdfOutput));
}

async function generateAttendancePDF(reportData, res) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  
  const doc = new jsPDF('p', 'mm', 'a4');
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${reportData.employee.name}_Attendance_Report.pdf"`);
  
  // Company information - exactly like Animal Management
  const companyName = "Mount Olive Farm House";
  const companyAddress = "No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka";
  const companyContact = "Phone: +94 81 249 2134 | Email: info@mountolivefarm.com";
  const companyWebsite = "www.mountolivefarm.com";
  const reportDate = new Date().toLocaleDateString();
  const reportTime = new Date().toLocaleTimeString();
  
  // Professional color scheme - exactly like Animal Management
  const primaryColor = [34, 197, 94]; // Green
  const secondaryColor = [16, 185, 129]; // Teal
  const accentColor = [59, 130, 246]; // Blue
  const textColor = [31, 41, 55]; // Dark gray
  const lightGray = [243, 244, 246];

  // Add real company logo - exactly like Animal Management
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Try to load the actual logo from public folder
    const logoPath = path.join(process.cwd(), '..', 'FRONTEND', 'public', 'logo512.png');
    
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 20, 15, 25, 25);
    } else {
      // Fallback to placeholder if logo file doesn't exist
      doc.setFillColor(...primaryColor);
      doc.rect(20, 15, 25, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MOF', 30, 30, { align: 'center' });
    }
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback to placeholder
    doc.setFillColor(...primaryColor);
    doc.rect(20, 15, 25, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MOF', 30, 30, { align: 'center' });
  }

  // Company header - exactly like Animal Management
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 50, 20);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(companyAddress, 50, 26);
  doc.text(companyContact, 50, 31);
  doc.text(companyWebsite, 50, 36);

  // Report title with professional styling - exactly like Animal Management
  doc.setFillColor(...lightGray);
  doc.rect(20, 42, 170, 10, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("ATTENDANCE REPORT", 105, 49, { align: 'center' });

  // Report metadata - exactly like Animal Management
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Generated: ${reportDate} at ${reportTime}`, 20, 60);
  doc.text(`Employee: ${reportData.employee.name} (${reportData.employee.id})`, 20, 65);
  doc.text(`Report ID: MOF-AR-${Date.now().toString().slice(-6)}`, 20, 70);

  // Attendance Summary Section - exactly like Animal Management style
  doc.setFillColor(...secondaryColor);
  doc.rect(20, 80, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("ATTENDANCE SUMMARY", 25, 86);

  // Calculate attendance statistics
  const attendanceData = reportData.attendance || [];
  const totalRecords = attendanceData.length;
  const presentCount = attendanceData.filter(a => a.status === 'Present').length;
  const absentCount = attendanceData.filter(a => a.status === 'Absent').length;
  const lateCount = attendanceData.filter(a => a.status === 'Late').length;
  const leaveCount = attendanceData.filter(a => a.status === 'On Leave').length;
  const attendanceRate = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords * 100).toFixed(1) : 0;

  const summaryData = [
    ['Metric', 'Value', 'Status'],
    ['Attendance Rate', `${attendanceRate}%`, 'Active'],
    ['Total Present', presentCount.toString(), 'Active'],
    ['Total Absent', absentCount.toString(), 'Active'],
    ['Late Arrivals', lateCount.toString(), 'Active'],
    ['On Leave', leaveCount.toString(), 'Active']
  ];

  // Create professional table for summary - exactly like Animal Management
  autoTable(doc, {
    head: [summaryData[0]],
    body: summaryData.slice(1),
    startY: 95,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 20, right: 20 }
  });

  // Detailed Attendance Data Section - exactly like Animal Management style
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFillColor(...accentColor);
  doc.rect(20, finalY, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("DETAILED ATTENDANCE DATA", 25, finalY + 6);

  if (attendanceData.length > 0) {
    const tableData = attendanceData.map(record => [
      new Date(record.date).toLocaleDateString(),
      record.status,
      record.checkIn || 'N/A',
      record.checkOut || 'N/A',
      record.notes || 'N/A'
    ]);
    
    autoTable(doc, {
      head: [['Date', 'Status', 'Check In', 'Check Out', 'Notes']],
      body: tableData,
      startY: finalY + 15,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: textColor,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 20, right: 20 }
    });
  } else {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text('No attendance records found for this period', 105, finalY + 20, { align: 'center' });
  }

  // Professional footer - exactly like Animal Management
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer background
    doc.setFillColor(...lightGray);
    doc.rect(0, 280, 210, 15, 'F');
    
    // Footer content
    doc.setTextColor(...textColor);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 20, 288);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 288, { align: 'center' });
    doc.text(companyName, 190, 288, { align: 'right' });
    
    // Footer line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 290, 190, 290);
    
    // Disclaimer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text("This report is generated by Mount Olive Farm House Management System", 105, 293, { align: 'center' });
  }

  // Send the PDF
  const pdfOutput = doc.output('arraybuffer');
  res.send(Buffer.from(pdfOutput));
}

async function generateOvertimePDF(reportData, res) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  
  const doc = new jsPDF('p', 'mm', 'a4');
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${reportData.employee.name}_Overtime_Report.pdf"`);
  
  // Company information - exactly like Animal Management
  const companyName = "Mount Olive Farm House";
  const companyAddress = "No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka";
  const companyContact = "Phone: +94 81 249 2134 | Email: info@mountolivefarm.com";
  const companyWebsite = "www.mountolivefarm.com";
  const reportDate = new Date().toLocaleDateString();
  const reportTime = new Date().toLocaleTimeString();
  
  // Professional color scheme - exactly like Animal Management
  const primaryColor = [34, 197, 94]; // Green
  const secondaryColor = [16, 185, 129]; // Teal
  const accentColor = [59, 130, 246]; // Blue
  const textColor = [31, 41, 55]; // Dark gray
  const lightGray = [243, 244, 246];

  // Add real company logo - exactly like Animal Management
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Try to load the actual logo from public folder
    const logoPath = path.join(process.cwd(), '..', 'FRONTEND', 'public', 'logo512.png');
    
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 20, 15, 25, 25);
    } else {
      // Fallback to placeholder if logo file doesn't exist
      doc.setFillColor(...primaryColor);
      doc.rect(20, 15, 25, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MOF', 30, 30, { align: 'center' });
    }
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback to placeholder
    doc.setFillColor(...primaryColor);
    doc.rect(20, 15, 25, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MOF', 30, 30, { align: 'center' });
  }

  // Company header - exactly like Animal Management
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 50, 20);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(companyAddress, 50, 26);
  doc.text(companyContact, 50, 31);
  doc.text(companyWebsite, 50, 36);

  // Report title with professional styling - exactly like Animal Management
  doc.setFillColor(...lightGray);
  doc.rect(20, 42, 170, 10, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("OVERTIME REPORT", 105, 49, { align: 'center' });

  // Report metadata - exactly like attendance report
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Generated: ${reportDate} at ${reportTime}`, 20, 60);
  doc.text(`Employee: ${reportData.employee.name} (${reportData.employee.id})`, 20, 65);
  doc.text(`Report ID: MOF-OR-${Date.now().toString().slice(-6)}`, 20, 70);

  // Overtime Summary Section - exactly like attendance report style
  doc.setFillColor(...secondaryColor);
  doc.rect(20, 80, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("OVERTIME SUMMARY", 25, 86);

  // Calculate overtime statistics
  const overtimeData = reportData.overtime || [];
  const totalRecords = overtimeData.length;
  const approvedRecords = overtimeData.filter(o => o.status === 'Approved').length;
  const pendingRecords = overtimeData.filter(o => o.status === 'Pending').length;
  
  let totalOvertimeHours = 0;
  overtimeData.forEach(record => {
    if (typeof record.overtimeHours === 'string') {
      const [hours, minutes] = record.overtimeHours.split(':').map(Number);
      totalOvertimeHours += hours + (minutes / 60);
    } else {
      totalOvertimeHours += record.overtimeHours || 0;
    }
  });

  const summaryData = [
    ['Metric', 'Value', 'Status'],
    ['Total Records', totalRecords.toString(), 'Active'],
    ['Approved Records', approvedRecords.toString(), 'Active'],
    ['Pending Records', pendingRecords.toString(), 'Active'],
    ['Total Overtime Hours', `${Math.floor(totalOvertimeHours)}:${String(Math.round((totalOvertimeHours % 1) * 60)).padStart(2, '0')}`, 'Active']
  ];

  // Create professional table for summary - exactly like attendance report
  autoTable(doc, {
    head: [summaryData[0]],
    body: summaryData.slice(1),
    startY: 95,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 20, right: 20 }
  });

  // Detailed Overtime Data Section - exactly like attendance report style
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFillColor(...accentColor);
  doc.rect(20, finalY, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("DETAILED OVERTIME DATA", 25, finalY + 6);

  if (overtimeData.length > 0) {
    const tableData = overtimeData.map(record => [
      new Date(record.date).toLocaleDateString(),
      `${record.regularHours || 8}:00`,
      record.overtimeHours?.toString() || '0',
      record.totalHours?.toString() || `${(record.regularHours || 8) + (record.overtimeHours || 0)}`,
      record.status
    ]);
    
    autoTable(doc, {
      head: [['Date', 'Regular Hours', 'Overtime Hours', 'Total Hours', 'Status']],
      body: tableData,
      startY: finalY + 15,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: textColor,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 20, right: 20 }
    });
  } else {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text('No overtime records found for this period', 105, finalY + 20, { align: 'center' });
  }

  // Professional footer - exactly like Animal Management
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer background
    doc.setFillColor(...lightGray);
    doc.rect(0, 280, 210, 15, 'F');
    
    // Footer content
    doc.setTextColor(...textColor);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 20, 288);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 288, { align: 'center' });
    doc.text(companyName, 190, 288, { align: 'right' });
    
    // Footer line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 290, 190, 290);
    
    // Disclaimer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text("This report is generated by Mount Olive Farm House Management System", 105, 293, { align: 'center' });
  }

  // Send the PDF
  const pdfOutput = doc.output('arraybuffer');
  res.send(Buffer.from(pdfOutput));
}

async function generateSalaryPDF(reportData, res) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  
  const doc = new jsPDF('p', 'mm', 'a4');
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${reportData.employee.name}_Salary_Report.pdf"`);
  
  // Company information - exactly like Animal Management
  const companyName = "Mount Olive Farm House";
  const companyAddress = "No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka";
  const companyContact = "Phone: +94 81 249 2134 | Email: info@mountolivefarm.com";
  const companyWebsite = "www.mountolivefarm.com";
  const reportDate = new Date().toLocaleDateString();
  const reportTime = new Date().toLocaleTimeString();
  
  // Professional color scheme - exactly like Animal Management
  const primaryColor = [34, 197, 94]; // Green
  const secondaryColor = [16, 185, 129]; // Teal
  const accentColor = [59, 130, 246]; // Blue
  const textColor = [31, 41, 55]; // Dark gray
  const lightGray = [243, 244, 246];

  // Add real company logo - exactly like Animal Management
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Try to load the actual logo from public folder
    const logoPath = path.join(process.cwd(), '..', 'FRONTEND', 'public', 'logo512.png');
    
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 20, 15, 25, 25);
    } else {
      // Fallback to placeholder if logo file doesn't exist
      doc.setFillColor(...primaryColor);
      doc.rect(20, 15, 25, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MOF', 30, 30, { align: 'center' });
    }
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback to placeholder
    doc.setFillColor(...primaryColor);
    doc.rect(20, 15, 25, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MOF', 30, 30, { align: 'center' });
  }

  // Company header - exactly like Animal Management
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 50, 20);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(companyAddress, 50, 26);
  doc.text(companyContact, 50, 31);
  doc.text(companyWebsite, 50, 36);

  // Report title with professional styling - exactly like Animal Management
  doc.setFillColor(...lightGray);
  doc.rect(20, 42, 170, 10, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("SALARY REPORT", 105, 49, { align: 'center' });

  // Report metadata - exactly like attendance report
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Generated: ${reportDate} at ${reportTime}`, 20, 60);
  doc.text(`Employee: ${reportData.employee.name} (${reportData.employee.id})`, 20, 65);
  doc.text(`Report ID: MOF-SR-${Date.now().toString().slice(-6)}`, 20, 70);

  // Salary Summary Section - exactly like attendance report style
  doc.setFillColor(...secondaryColor);
  doc.rect(20, 80, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("SALARY SUMMARY", 25, 86);

  // Calculate salary statistics
  const salaryData = reportData.salary || [];
  const totalRecords = salaryData.length;
  const totalEarnings = salaryData.reduce((sum, s) => sum + (s.totalSalary || 0), 0);
  const totalNetSalary = salaryData.reduce((sum, s) => sum + (s.netSalary || 0), 0);
  const averageSalary = totalRecords > 0 ? totalEarnings / totalRecords : 0;

  const summaryData = [
    ['Metric', 'Value', 'Status'],
    ['Total Records', totalRecords.toString(), 'Active'],
    ['Total Earnings', `$${totalEarnings.toFixed(2)}`, 'Active'],
    ['Total Net Salary', `$${totalNetSalary.toFixed(2)}`, 'Active'],
    ['Average Salary', `$${averageSalary.toFixed(2)}`, 'Active']
  ];

  // Create professional table for summary - exactly like attendance report
  autoTable(doc, {
    head: [summaryData[0]],
    body: summaryData.slice(1),
    startY: 95,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 20, right: 20 }
  });

  // Detailed Salary Data Section - exactly like attendance report style
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFillColor(...accentColor);
  doc.rect(20, finalY, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("DETAILED SALARY DATA", 25, finalY + 6);

  if (salaryData.length > 0) {
    const tableData = salaryData.map(record => {
      const period = `${record.payrollPeriod?.month || 'N/A'}/${record.payrollPeriod?.year || 'N/A'}`;
      return [
        period,
        `$${record.basicSalary || 0}`,
        `$${record.allowances || 0}`,
        `$${record.deductions || 0}`,
        `$${record.totalSalary || 0}`,
        `$${record.netSalary || 0}`,
        record.status || 'Active'
      ];
    });
    
    autoTable(doc, {
      head: [['Period', 'Basic Salary', 'Allowances', 'Deductions', 'Total Salary', 'Net Salary', 'Status']],
      body: tableData,
      startY: finalY + 15,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: textColor,
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 20, right: 20 }
    });
  } else {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text('No salary records found for this period', 105, finalY + 20, { align: 'center' });
  }

  // Professional footer - exactly like Animal Management
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer background
    doc.setFillColor(...lightGray);
    doc.rect(0, 280, 210, 15, 'F');
    
    // Footer content
    doc.setTextColor(...textColor);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 20, 288);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 288, { align: 'center' });
    doc.text(companyName, 190, 288, { align: 'right' });
    
    // Footer line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 290, 190, 290);
    
    // Disclaimer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text("This report is generated by Mount Olive Farm House Management System", 105, 293, { align: 'center' });
  }

  // Send the PDF
  const pdfOutput = doc.output('arraybuffer');
  res.send(Buffer.from(pdfOutput));
}

async function generateLeavePDF(reportData, res) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  
  const doc = new jsPDF('p', 'mm', 'a4');
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${reportData.employee.name}_Leave_Report.pdf"`);
  
  // Company information - exactly like Animal Management
  const companyName = "Mount Olive Farm House";
  const companyAddress = "No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka";
  const companyContact = "Phone: +94 81 249 2134 | Email: info@mountolivefarm.com";
  const companyWebsite = "www.mountolivefarm.com";
  const reportDate = new Date().toLocaleDateString();
  const reportTime = new Date().toLocaleTimeString();
  
  // Professional color scheme - exactly like Animal Management
  const primaryColor = [34, 197, 94]; // Green
  const secondaryColor = [16, 185, 129]; // Teal
  const accentColor = [59, 130, 246]; // Blue
  const textColor = [31, 41, 55]; // Dark gray
  const lightGray = [243, 244, 246];

  // Add real company logo - exactly like Animal Management
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Try to load the actual logo from public folder
    const logoPath = path.join(process.cwd(), '..', 'FRONTEND', 'public', 'logo512.png');
    
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 20, 15, 25, 25);
    } else {
      // Fallback to placeholder if logo file doesn't exist
      doc.setFillColor(...primaryColor);
      doc.rect(20, 15, 25, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MOF', 30, 30, { align: 'center' });
    }
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback to placeholder
    doc.setFillColor(...primaryColor);
    doc.rect(20, 15, 25, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MOF', 30, 30, { align: 'center' });
  }

  // Company header - exactly like Animal Management
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 50, 20);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(companyAddress, 50, 26);
  doc.text(companyContact, 50, 31);
  doc.text(companyWebsite, 50, 36);

  // Report title with professional styling - exactly like Animal Management
  doc.setFillColor(...lightGray);
  doc.rect(20, 42, 170, 10, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("LEAVE REPORT", 105, 49, { align: 'center' });

  // Report metadata - exactly like attendance report
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Generated: ${reportDate} at ${reportTime}`, 20, 60);
  doc.text(`Employee: ${reportData.employee.name} (${reportData.employee.id})`, 20, 65);
  doc.text(`Report ID: MOF-LR-${Date.now().toString().slice(-6)}`, 20, 70);

  // Leave Summary Section - exactly like attendance report style
  doc.setFillColor(...secondaryColor);
  doc.rect(20, 80, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("LEAVE SUMMARY", 25, 86);

  // Calculate leave statistics
  const leaveData = reportData.leave || [];
  const totalRecords = leaveData.length;
  const approvedDays = leaveData.filter(l => l.status === 'Approved').reduce((sum, l) => sum + (l.days || 0), 0);
  const pendingDays = leaveData.filter(l => l.status === 'Pending').reduce((sum, l) => sum + (l.days || 0), 0);
  const rejectedDays = leaveData.filter(l => l.status === 'Rejected').reduce((sum, l) => sum + (l.days || 0), 0);
  const totalDays = leaveData.reduce((sum, l) => sum + (l.days || 0), 0);

  const summaryData = [
    ['Metric', 'Value', 'Status'],
    ['Total Records', totalRecords.toString(), 'Active'],
    ['Total Leave Days', totalDays.toString(), 'Active'],
    ['Approved Days', approvedDays.toString(), 'Active'],
    ['Pending Days', pendingDays.toString(), 'Active'],
    ['Rejected Days', rejectedDays.toString(), 'Active']
  ];

  // Create professional table for summary - exactly like attendance report
  autoTable(doc, {
    head: [summaryData[0]],
    body: summaryData.slice(1),
    startY: 95,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 20, right: 20 }
  });

  // Detailed Leave Data Section - exactly like attendance report style
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFillColor(...accentColor);
  doc.rect(20, finalY, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("DETAILED LEAVE DATA", 25, finalY + 6);

  if (leaveData.length > 0) {
    const tableData = leaveData.map(record => [
      new Date(record.from).toLocaleDateString(),
      new Date(record.to).toLocaleDateString(),
      record.type,
      record.days?.toString() || '0',
      record.reason?.substring(0, 20) + (record.reason?.length > 20 ? '...' : '') || 'N/A',
      record.status
    ]);
    
    autoTable(doc, {
      head: [['From Date', 'To Date', 'Type', 'Days', 'Reason', 'Status']],
      body: tableData,
      startY: finalY + 15,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: textColor,
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 20, right: 20 }
    });
  } else {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text('No leave records found for this period', 105, finalY + 20, { align: 'center' });
  }

  // Professional footer - exactly like Animal Management
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer background
    doc.setFillColor(...lightGray);
    doc.rect(0, 280, 210, 15, 'F');
    
    // Footer content
    doc.setTextColor(...textColor);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 20, 288);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 288, { align: 'center' });
    doc.text(companyName, 190, 288, { align: 'right' });
    
    // Footer line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 290, 190, 290);
    
    // Disclaimer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text("This report is generated by Mount Olive Farm House Management System", 105, 293, { align: 'center' });
  }

  // Send the PDF
  const pdfOutput = doc.output('arraybuffer');
  res.send(Buffer.from(pdfOutput));
}
