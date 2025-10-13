import ENotification from '../E-model/ENotification.js';
import Employee from '../E-model/Employee.js';
import Attendance from '../E-model/Attendance.js';
import Leave from '../E-model/Leave.js';
import Overtime from '../E-model/Overtime.js';

// Create new notification
export const createNotification = async (req, res) => {
  try {
    const notification = new ENotification(req.body);
    const savedNotification = await notification.save();
    
    res.status(201).json({
      success: true,
      data: savedNotification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

// Get all notifications for the employee manager
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, priority, unreadOnly = false } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (unreadOnly) query.isRead = false;
    
    const notifications = await ENotification.find(query)
      .sort({ scheduledTime: -1, priority: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ENotification.countDocuments(query);
    const unreadCount = await ENotification.countDocuments({ isRead: false });

    res.json({
      success: true,
      data: {
        notifications,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
        unreadCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await ENotification.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await ENotification.updateMany(
      { isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await ENotification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Generate daily operations notifications
export const generateDailyNotifications = async (req, res) => {
  try {
    await generateMorningSummary();
    await generateEndOfDaySummary();
    
    res.json({
      success: true,
      message: 'Daily notifications generated successfully'
    });
  } catch (error) {
    console.error('Error in generateDailyNotifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily notifications',
      error: error.message
    });
  }
};

// Generate morning summary notification
async function generateMorningSummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get attendance data
  const todayAttendance = await Attendance.find({
    date: { $gte: today, $lt: tomorrow }
    });

  const onTime = todayAttendance.filter(a => 
    a.status === 'Present' && a.checkIn && a.checkIn !== "-" && 
    new Date(`${a.date.toISOString().split('T')[0]} ${a.checkIn}`).getHours() <= 9
  ).length;

  const late = todayAttendance.filter(a => 
    a.status === 'Present' && a.checkIn && a.checkIn !== "-" && 
    new Date(`${a.date.toISOString().split('T')[0]} ${a.checkIn}`).getHours() > 9
  ).length;

  const absent = todayAttendance.filter(a => a.status === 'Absent').length;
  const onLeave = todayAttendance.filter(a => a.status === 'On Leave').length;

  // Get pending overtime requests
  const pendingOvertime = await Overtime.countDocuments({ status: 'Pending' });

  // Get department status (simplified since we don't have employee reference)
  const departmentStatus = {};
  todayAttendance.forEach(record => {
    const dept = 'General'; // Default department since we don't have employee reference
    if (!departmentStatus[dept]) {
      departmentStatus[dept] = { present: 0, absent: 0 };
    }
    if (record.status === 'Present') {
      departmentStatus[dept].present++;
    } else if (record.status === 'Absent') {
      departmentStatus[dept].absent++;
    }
  });

  const deptStatusText = Object.entries(departmentStatus)
    .map(([dept, status]) => `${dept}: ${status.present} present, ${status.absent} absent`)
    .join(', ');

      // Create morning summary notification
      await ENotification.create({
    title: 'Good Morning! Daily Operations Summary',
    message: `Attendance Check: ${onTime}/${onTime + late + absent} employees checked in on time, ${late} running late, ${absent} absent. Today's Schedule: ${onLeave} employees on leave today, ${pendingOvertime} overtime requests pending approval. Department Status: ${deptStatusText}`,
    type: 'info',
    category: 'daily_operations',
    priority: 'medium',
    scheduledTime: new Date()
  });
}

// Generate end of day summary notification
async function generateEndOfDaySummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get final attendance
  const todayAttendance = await Attendance.find({
    date: { $gte: today, $lt: tomorrow }
  });

  const present = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const absent = todayAttendance.filter(a => a.status === 'Absent').length;

  // Get total overtime hours
  const todayOvertime = await Overtime.find({
    date: { $gte: today, $lt: tomorrow },
    status: 'Approved'
  });

  let totalOvertime = 0;
  todayOvertime.forEach(ot => {
    if (typeof ot.overtimeHours === 'string') {
      const [hours, minutes] = ot.overtimeHours.split(':').map(Number);
      totalOvertime += hours + (minutes / 60);
    } else {
      totalOvertime += ot.overtimeHours || 0;
    }
  });

  // Get tomorrow's preview
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  tomorrowDate.setHours(0, 0, 0, 0);
  const dayAfterTomorrow = new Date(tomorrowDate);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const returningFromLeave = await Leave.countDocuments({
    endDate: { $gte: tomorrowDate, $lt: dayAfterTomorrow },
    status: 'Approved'
  });

  const newOvertimeRequests = await Overtime.countDocuments({
    createdAt: { $gte: today }
  });

      // Create end of day notification
      await ENotification.create({
    title: 'End of Day Summary',
    message: `Daily Attendance Report: Final attendance: ${present} present, ${absent} absent, total overtime: ${Math.round(totalOvertime)} hours. Tomorrow's Preview: ${returningFromLeave} employees returning from leave tomorrow, ${newOvertimeRequests} new overtime requests.`,
    type: 'info',
    category: 'daily_operations',
    priority: 'medium',
    scheduledTime: new Date()
  });
}

// Generate leave management notifications
export const generateLeaveNotifications = async () => {
  // Check for new leave requests
  const pendingLeaves = await Leave.find({ status: 'Pending' });

  for (const leave of pendingLeaves) {
    const isUrgent = new Date(leave.startDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await ENotification.create({
      title: `Leave Request Alert${isUrgent ? ' (Urgent)' : ''}`,
      message: `${leave.employeeName || 'Employee'} requested ${leave.daysRequested} days leave starting ${new Date(leave.startDate).toLocaleDateString()}`,
      type: isUrgent ? 'urgent' : 'warning',
      category: 'leave_management',
      priority: isUrgent ? 'urgent' : 'high',
      metadata: {
        employeeId: leave.employeeId,
        department: leave.department || 'General',
        actionRequired: true,
        actionType: 'approve_leave',
        actionData: { leaveId: leave._id }
      }
    });
  }

  // Check for leave conflicts
  const leaveConflicts = await Leave.aggregate([
    { $match: { status: 'Pending' } },
    { $group: {
        _id: { department: '$employee', startDate: '$startDate', endDate: '$endDate' },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gte: 3 } } }
  ]);

  for (const conflict of leaveConflicts) {
    await ENotification.create({
      title: 'Leave Conflict Warning',
      message: `Warning: ${conflict.count} employees requesting leave for same dates`,
      type: 'warning',
      category: 'leave_management',
      priority: 'high'
    });
  }
};

// Generate attendance notifications
export const generateAttendanceNotifications = async () => {
  const today = new Date();
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  
  // Check for late arrivals (after 9:30 AM)
  if (currentHour >= 9 && currentMinute >= 30) {
    const lateEmployees = await Attendance.find({
      date: { 
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      },
      status: 'Present',
      checkIn: { $ne: "-" }
    });

    for (const record of lateEmployees) {
      // Simple late detection based on check-in time
      const checkInTime = new Date(`${record.date.toISOString().split('T')[0]} ${record.checkIn}`);
      const expectedTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0);
      const lateMinutes = Math.floor((checkInTime - expectedTime) / (1000 * 60));
      
      if (lateMinutes > 30) {
        await ENotification.create({
          title: 'Late Arrival Alert',
          message: `${record.name} is ${lateMinutes} minutes late`,
          type: 'warning',
          category: 'attendance',
          priority: 'medium',
          metadata: {
            employeeId: record.employeeId,
            department: 'General'
          }
        });
      }
    }
  }

  // Check for missing check-ins (after 11:00 AM)
  if (currentHour >= 11) {
    const allEmployees = await Employee.find({ status: 'Active' });
    const checkedInToday = await Attendance.find({
      date: { 
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      },
      status: { $in: ['Present', 'Late'] }
    });

    const checkedInEmployeeIds = checkedInToday.map(a => a.employeeId);
    const missingCheckIns = allEmployees.filter(emp => !checkedInEmployeeIds.includes(emp.id));

    for (const employee of missingCheckIns) {
      const hoursOverdue = currentHour - 9;
      
      await ENotification.create({
        title: 'Missing Check-in Alert',
        message: `${employee.name} hasn't checked in yet - ${hoursOverdue} hours overdue`,
        type: 'warning',
        category: 'attendance',
        priority: 'high',
        metadata: {
          employeeId: employee.id,
          department: employee.department || 'General'
        }
      });
    }
  }
};

// Generate overtime notifications
export const generateOvertimeNotifications = async () => {
  // Check for new overtime requests
  const pendingOvertime = await Overtime.find({ status: 'Pending' });

  for (const overtime of pendingOvertime) {
    await ENotification.create({
      title: 'New Overtime Request',
      message: `${overtime.employee?.name || 'Employee'} submitted ${overtime.overtimeHours} hours overtime for ${new Date(overtime.date).toLocaleDateString()}`,
      type: 'info',
      category: 'overtime',
      priority: 'medium',
      metadata: {
        employeeId: overtime.employee?._id,
        department: overtime.employee?.department || 'General',
        actionRequired: true,
        actionType: 'approve_overtime',
        actionData: { overtimeId: overtime._id }
      }
    });
  }

  // Check overtime budget limits (example: 80% of monthly budget)
  const currentMonth = new Date();
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

  const monthlyOvertime = await Overtime.find({
    date: { $gte: startOfMonth, $lte: endOfMonth },
    status: 'Approved'
  });

  let totalOvertimeHours = 0;
  monthlyOvertime.forEach(ot => {
    if (typeof ot.overtimeHours === 'string') {
      const [hours, minutes] = ot.overtimeHours.split(':').map(Number);
      totalOvertimeHours += hours + (minutes / 60);
    } else {
      totalOvertimeHours += ot.overtimeHours || 0;
    }
  });

  // Assuming monthly budget is 200 hours (you can adjust this)
  const monthlyBudget = 200;
  const budgetPercentage = (totalOvertimeHours / monthlyBudget) * 100;

  if (budgetPercentage >= 90) {
    await ENotification.create({
      title: 'Overtime Budget Alert',
      message: `Department overtime budget at ${Math.round(budgetPercentage)}% for this month`,
      type: 'warning',
      category: 'overtime',
      priority: 'high'
    });
  }
};

// Generate employee status notifications
export const generateEmployeeStatusNotifications = async () => {
  // Check for incomplete profiles
  const incompleteProfiles = await Employee.find({
    $or: [
      { profileImage: { $exists: false } },
      { profileImage: '' },
      { address: { $exists: false } },
      { address: '' },
      { email: { $exists: false } },
      { email: '' }
    ]
  });

  if (incompleteProfiles.length > 0) {
    await ENotification.create({
      title: 'Incomplete Employee Profiles',
      message: `${incompleteProfiles.length} employees have incomplete profiles (missing documents/photos)`,
      type: 'warning',
      category: 'employee_status',
      priority: 'medium'
    });
  }

  // Check for document expiry (example: licenses, certifications)
  const employeesWithExpiry = await Employee.find({
    licenseExpiry: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // 30 days from now
  });

  for (const employee of employeesWithExpiry) {
    const daysUntilExpiry = Math.ceil((new Date(employee.licenseExpiry) - new Date()) / (1000 * 60 * 60 * 24));
    
    await ENotification.create({
      title: 'Document Expiry Alert',
      message: `${employee.name}'s license expires in ${daysUntilExpiry} days`,
      type: 'warning',
      category: 'employee_status',
      priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
      metadata: {
        employeeId: employee._id,
        department: employee.department || 'General'
      }
    });
  }
};

// Trigger all notification generation
export const generateAllNotifications = async (req, res) => {
  try {
    await generateDailyNotifications(req, res);
    await generateLeaveNotifications();
    await generateAttendanceNotifications();
    await generateOvertimeNotifications();
    await generateEmployeeStatusNotifications();
    
    res.json({
      success: true,
      message: 'All notifications generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate notifications',
      error: error.message
    });
  }
};
