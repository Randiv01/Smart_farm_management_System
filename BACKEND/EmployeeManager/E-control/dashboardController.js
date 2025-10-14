// E-control/dashboardController.js - Real-time Dashboard Data Controller
import Employee from "../E-model/Employee.js";
import Attendance from "../E-model/Attendance.js";
import Overtime from "../E-model/Overtime.js";
import Leave from "../E-model/Leave.js";

// Get real-time dashboard metrics
export const getDashboardMetrics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total employees
    const totalEmployees = await Employee.countDocuments({ status: { $ne: 'Inactive' } });

    // Get today's attendance summary
    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    });

    const presentToday = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const onLeaveToday = todayAttendance.filter(a => a.status === 'On Leave').length;

    // Get current month overtime hours
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthOvertime = await Overtime.find({
      date: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'Approved'
    });

    let totalOvertimeHours = 0;
    currentMonthOvertime.forEach(ot => {
      if (typeof ot.overtimeHours === 'string') {
        const [hours, minutes] = ot.overtimeHours.split(':').map(Number);
        totalOvertimeHours += hours + (minutes / 60);
      } else {
        totalOvertimeHours += ot.overtimeHours || 0;
      }
    });

    // Calculate percentage changes (mock for now - you can implement historical comparison)
    const totalEmployeesChange = "+4%"; // Mock - calculate from previous month
    const presentTodayChange = presentToday < totalEmployees ? "-6%" : "+2%";
    const onLeaveChange = onLeaveToday > 0 ? `+${onLeaveToday}` : "0";
    const overtimeChange = totalOvertimeHours > 0 ? `+${Math.round(totalOvertimeHours * 10) / 10}` : "0";

    res.json({
      success: true,
      data: {
        totalEmployees: {
          value: totalEmployees,
          change: totalEmployeesChange,
          label: "Total Employees"
        },
        presentToday: {
          value: presentToday,
          change: presentTodayChange,
          label: "Present Today"
        },
        onLeave: {
          value: onLeaveToday,
          change: onLeaveChange,
          label: "On Leave"
        },
        overtimeHours: {
          value: Math.round(totalOvertimeHours * 10) / 10,
          change: overtimeChange,
          label: "Overtime Hours"
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard metrics",
      error: error.message
    });
  }
};

// Get employee status distribution for pie chart
export const getEmployeeStatusData = async (req, res) => {
  try {
    const employees = await Employee.find({ status: { $ne: 'Inactive' } });
    
    const statusCounts = {
      'Full-time': 0,
      'Part-time': 0,
      'Contract': 0
    };

    employees.forEach(emp => {
      const type = emp.type || 'Full-time';
      if (statusCounts[type] !== undefined) {
        statusCounts[type]++;
      } else {
        statusCounts['Full-time']++; // Default to Full-time
      }
    });

    const total = employees.length;
    const data = Object.entries(statusCounts).map(([name, count]) => ({
      name,
      value: count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: name === 'Full-time' ? '#22c55e' : name === 'Part-time' ? '#3b82f6' : '#f59e0b'
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee status data",
      error: error.message
    });
  }
};

// Get weekly attendance data for bar chart
export const getWeeklyAttendanceData = async (req, res) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Get start of current week (Monday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get end of current week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekAttendance = await Attendance.find({
      date: { $gte: startOfWeek, $lte: endOfWeek }
    });

    // Group by day of week
    const dailyData = {};
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    days.forEach(day => {
      dailyData[day] = { present: 0, absent: 0, leave: 0 };
    });

    weekAttendance.forEach(record => {
      const dayOfWeek = record.date.getDay();
      const dayName = days[dayOfWeek === 0 ? 6 : dayOfWeek - 1]; // Convert Sunday=0 to Sunday=6
      
      if (record.status === 'Present' || record.status === 'Late') {
        dailyData[dayName].present++;
      } else if (record.status === 'Absent') {
        dailyData[dayName].absent++;
      } else if (record.status === 'On Leave') {
        dailyData[dayName].leave++;
      }
    });

    const data = days.map(day => ({
      name: day,
      present: dailyData[day].present,
      absent: dailyData[day].absent,
      leave: dailyData[day].leave
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch weekly attendance data",
      error: error.message
    });
  }
};

// Get dashboard summary with all data
export const getDashboardSummary = async (req, res) => {
  try {
    // Get all metrics in parallel
    const [metrics, employeeStatus, weeklyAttendance, departmentData, monthlyAttendance, leaveAnalytics, overtimeData] = await Promise.all([
      getDashboardMetricsData(),
      getEmployeeStatusDataInternal(),
      getWeeklyAttendanceDataInternal(),
      getDepartmentDataInternal(),
      getMonthlyAttendanceTrendInternal(),
      getLeaveAnalyticsInternal(),
      getOvertimeAnalyticsInternal()
    ]);

    res.json({
      success: true,
      data: {
        metrics,
        employeeStatus,
        weeklyAttendance,
        departmentData,
        monthlyAttendance,
        leaveAnalytics,
        overtimeData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
      error: error.message
    });
  }
};

// Helper functions for internal use
async function getDashboardMetricsData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const totalEmployees = await Employee.countDocuments({ status: { $ne: 'Inactive' } });
  const todayAttendance = await Attendance.find({
    date: { $gte: today, $lt: tomorrow }
  });

  const presentToday = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const onLeaveToday = todayAttendance.filter(a => a.status === 'On Leave').length;

  const currentMonth = new Date();
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

  const currentMonthOvertime = await Overtime.find({
    date: { $gte: startOfMonth, $lte: endOfMonth },
    status: 'Approved'
  });

  let totalOvertimeHours = 0;
  currentMonthOvertime.forEach(ot => {
    if (typeof ot.overtimeHours === 'string') {
      const [hours, minutes] = ot.overtimeHours.split(':').map(Number);
      totalOvertimeHours += hours + (minutes / 60);
    } else {
      totalOvertimeHours += ot.overtimeHours || 0;
    }
  });

  return {
    totalEmployees: {
      value: totalEmployees,
      change: "+4%",
      label: "Total Employees"
    },
    presentToday: {
      value: presentToday,
      change: presentToday < totalEmployees ? "-6%" : "+2%",
      label: "Present Today"
    },
    onLeave: {
      value: onLeaveToday,
      change: onLeaveToday > 0 ? `+${onLeaveToday}` : "0",
      label: "On Leave"
    },
    overtimeHours: {
      value: Math.round(totalOvertimeHours * 10) / 10,
      change: totalOvertimeHours > 0 ? `+${Math.round(totalOvertimeHours * 10) / 10}` : "0",
      label: "Overtime Hours"
    }
  };
}

async function getEmployeeStatusDataInternal() {
  const employees = await Employee.find({ status: { $ne: 'Inactive' } });
  
  const statusCounts = {
    'Full-time': 0,
    'Part-time': 0,
    'Contract': 0
  };

  employees.forEach(emp => {
    const type = emp.type || 'Full-time';
    if (statusCounts[type] !== undefined) {
      statusCounts[type]++;
    } else {
      statusCounts['Full-time']++;
    }
  });

  const total = employees.length;
  return Object.entries(statusCounts).map(([name, count]) => ({
    name,
    value: count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    color: name === 'Full-time' ? '#22c55e' : name === 'Part-time' ? '#3b82f6' : '#f59e0b'
  }));
}

async function getWeeklyAttendanceDataInternal() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Get all attendance records for the week
  const weekAttendance = await Attendance.find({
    date: { $gte: startOfWeek, $lte: endOfWeek }
  });

  // Get total employees for attendance rate calculation
  const totalEmployees = await Employee.countDocuments({ status: { $ne: 'Inactive' } });

  const dailyData = {};
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Initialize daily data
  days.forEach(day => {
    dailyData[day] = { present: 0, absent: 0, leave: 0 };
  });

  // Process attendance data
  weekAttendance.forEach(record => {
    const dayOfWeek = record.date.getDay();
    const dayName = days[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
    
    if (record.status === 'Present' || record.status === 'Late') {
      dailyData[dayName].present++;
    } else if (record.status === 'Absent') {
      dailyData[dayName].absent++;
    } else if (record.status === 'On Leave') {
      dailyData[dayName].leave++;
    }
  });

  // Return enhanced data with attendance rates
  return days.map(day => {
    const dayData = dailyData[day];
    const totalForDay = dayData.present + dayData.absent + dayData.leave;
    const attendanceRate = totalForDay > 0 ? Math.round((dayData.present / totalForDay) * 100) : 0;
    
    return {
      name: day,
      present: dayData.present,
      absent: dayData.absent,
      leave: dayData.leave,
      attendanceRate: attendanceRate,
      total: totalForDay
    };
  });
}

async function getDepartmentDataInternal() {
  // Get all employees
  const employees = await Employee.find({ status: { $ne: 'Inactive' } });
  
  // Define all possible departments to ensure they're all shown
  const allDepartments = [
    'Farm Operations',
    'Inventory Management',
    'Health Management',
    'Administration',
    'Employee Management',
    'Plant Management',
    'Animal Management'
  ];
  
  const departmentCounts = {};
  
  // Initialize all departments with 0 count
  allDepartments.forEach(dept => {
    departmentCounts[dept] = 0;
  });
  
  // Count actual employees by department
  employees.forEach(emp => {
    const dept = emp.department || 'Other';
    if (departmentCounts.hasOwnProperty(dept)) {
      departmentCounts[dept]++;
    } else {
      departmentCounts['Other']++;
    }
  });

  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#10b981'];
  
  // Return all departments, even those with 0 employees
  return allDepartments.map((name, index) => ({
    name,
    value: departmentCounts[name],
    color: colors[index % colors.length]
  }));
}

async function getMonthlyAttendanceTrendInternal() {
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
  
  const attendanceData = await Attendance.find({
    date: { $gte: sixMonthsAgo, $lte: today }
  });

  const monthlyData = {};
  attendanceData.forEach(record => {
    const monthKey = `${record.date.getFullYear()}-${record.date.getMonth() + 1}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { present: 0, absent: 0, total: 0 };
    }
    monthlyData[monthKey].total++;
    if (record.status === 'Present' || record.status === 'Late') {
      monthlyData[monthKey].present++;
    } else if (record.status === 'Absent') {
      monthlyData[monthKey].absent++;
    }
  });

  return Object.entries(monthlyData).map(([month, data]) => {
    const [year, monthNum] = month.split('-');
    const monthName = new Date(year, monthNum - 1).toLocaleString('default', { month: 'short' });
    return {
      month: `${monthName} ${year}`,
      present: data.present,
      absent: data.absent,
      attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
    };
  }).sort((a, b) => new Date(a.month) - new Date(b.month));
}

async function getLeaveAnalyticsInternal() {
  const currentYear = new Date().getFullYear();
  const leaves = await Leave.find({ year: currentYear });

  const leaveTypes = {};
  const monthlyLeaves = {};

  leaves.forEach(leave => {
    // By leave type
    const type = leave.type || 'Other';
    if (!leaveTypes[type]) {
      leaveTypes[type] = { approved: 0, pending: 0, rejected: 0 };
    }
    leaveTypes[type][leave.status.toLowerCase()] = (leaveTypes[type][leave.status.toLowerCase()] || 0) + leave.days;

    // By month
    const month = new Date(leave.from).getMonth() + 1;
    const monthKey = new Date(currentYear, month - 1).toLocaleString('default', { month: 'short' });
    if (!monthlyLeaves[monthKey]) {
      monthlyLeaves[monthKey] = { approved: 0, pending: 0, rejected: 0 };
    }
    monthlyLeaves[monthKey][leave.status.toLowerCase()] = (monthlyLeaves[monthKey][leave.status.toLowerCase()] || 0) + leave.days;
  });

  return {
    byType: Object.entries(leaveTypes).map(([type, data]) => ({
      type,
      approved: data.approved || 0,
      pending: data.pending || 0,
      rejected: data.rejected || 0
    })),
    byMonth: Object.entries(monthlyLeaves).map(([month, data]) => ({
      month,
      approved: data.approved || 0,
      pending: data.pending || 0,
      rejected: data.rejected || 0
    }))
  };
}

async function getOvertimeAnalyticsInternal() {
  const currentMonth = new Date();
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

  const overtimeRecords = await Overtime.find({
    date: { $gte: startOfMonth, $lte: endOfMonth }
  }).populate('employee', 'name department');

  // Define all possible departments to ensure they're all shown
  const allDepartments = [
    'Farm Operations',
    'Inventory Management',
    'Health Management',
    'Administration',
    'Employee Management',
    'Plant Management',
    'Animal Management'
  ];

  const departmentOvertime = {};
  let totalHours = 0;

  // Initialize all departments with 0 hours
  allDepartments.forEach(dept => {
    departmentOvertime[dept] = 0;
  });

  overtimeRecords.forEach(record => {
    // By department
    const dept = record.employee?.department || 'Other';
    if (departmentOvertime.hasOwnProperty(dept)) {
      let hours = 0;
      if (typeof record.overtimeHours === 'string') {
        const [h, m] = record.overtimeHours.split(':').map(Number);
        hours = h + (m / 60);
      } else {
        hours = record.overtimeHours || 0;
      }
      
      departmentOvertime[dept] += hours;
      totalHours += hours;
    }
  });

  return {
    byDepartment: allDepartments.map((department) => ({
      department,
      hours: Math.round(departmentOvertime[department] * 10) / 10
    })),
    totalHours: Math.round(totalHours * 10) / 10
  };
}
