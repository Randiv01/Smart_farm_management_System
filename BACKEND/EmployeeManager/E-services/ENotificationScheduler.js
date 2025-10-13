import ENotification from '../E-model/ENotification.js';
import Employee from '../E-model/Employee.js';
import Attendance from '../E-model/Attendance.js';
import Leave from '../E-model/Leave.js';
import Overtime from '../E-model/Overtime.js';

class ENotificationScheduler {
  constructor() {
    this.isRunning = false;
    this.intervals = {};
  }

  // Start the notification scheduler
  start() {
    if (this.isRunning) {
      console.log('Notification scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('🔔 Employee Management Notification Scheduler started');

    // Schedule daily morning summary (8:00 AM)
    this.scheduleMorningSummary();
    
    // Schedule end of day summary (6:00 PM)
    this.scheduleEndOfDaySummary();
    
    // Schedule real-time checks every 5 minutes
    this.scheduleRealTimeChecks();
    
    // Schedule weekly cleanup
    this.scheduleWeeklyCleanup();
  }

  // Stop the notification scheduler
  stop() {
    this.isRunning = false;
    
    // Clear all intervals
    Object.values(this.intervals).forEach(interval => {
      clearInterval(interval);
    });
    this.intervals = {};
    
    console.log('🔔 Employee Management Notification Scheduler stopped');
  }

  // Schedule morning summary at 8:00 AM daily
  scheduleMorningSummary() {
    const scheduleNextMorning = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0); // 8:00 AM
      
      const timeUntilMorning = tomorrow.getTime() - now.getTime();
      
      setTimeout(async () => {
        await this.generateMorningSummary();
        
        // Schedule next morning summary
        scheduleNextMorning();
      }, timeUntilMorning);
    };

    scheduleNextMorning();
  }

  // Schedule end of day summary at 6:00 PM daily
  scheduleEndOfDaySummary() {
    const scheduleNextEvening = () => {
      const now = new Date();
      const today = new Date(now);
      today.setHours(18, 0, 0, 0); // 6:00 PM
      
      // If it's already past 6 PM today, schedule for tomorrow
      if (now.getTime() > today.getTime()) {
        today.setDate(today.getDate() + 1);
      }
      
      const timeUntilEvening = today.getTime() - now.getTime();
      
      setTimeout(async () => {
        await this.generateEndOfDaySummary();
        
        // Schedule next evening summary
        scheduleNextEvening();
      }, timeUntilEvening);
    };

    scheduleNextEvening();
  }

  // Schedule real-time checks every 5 minutes
  scheduleRealTimeChecks() {
    this.intervals.realTimeChecks = setInterval(async () => {
      await this.generateRealTimeNotifications();
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Schedule weekly cleanup of old notifications
  scheduleWeeklyCleanup() {
    this.intervals.weeklyCleanup = setInterval(async () => {
      await this.cleanupOldNotifications();
    }, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  // Generate morning summary notification
  async generateMorningSummary() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get attendance data
      const todayAttendance = await Attendance.find({
        date: { $gte: today, $lt: tomorrow }
      }).populate('employee', 'name department');

      const onTime = todayAttendance.filter(a => 
        a.status === 'Present' && a.checkInTime && 
        new Date(a.checkInTime).getHours() <= 9
      ).length;

      const late = todayAttendance.filter(a => 
        a.status === 'Present' && a.checkInTime && 
        new Date(a.checkInTime).getHours() > 9
      ).length;

      const absent = todayAttendance.filter(a => a.status === 'Absent').length;
      const onLeave = todayAttendance.filter(a => a.status === 'On Leave').length;

      // Get pending overtime requests
      const pendingOvertime = await Overtime.countDocuments({ status: 'Pending' });

      // Get department status
      const departmentStatus = {};
      todayAttendance.forEach(record => {
        const dept = record.employee?.department || 'Unknown';
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

      console.log('✅ Morning summary notification generated');
    } catch (error) {
      console.error('❌ Error generating morning summary:', error);
    }
  }

  // Generate end of day summary notification
  async generateEndOfDaySummary() {
    try {
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

      console.log('✅ End of day summary notification generated');
    } catch (error) {
      console.error('❌ Error generating end of day summary:', error);
    }
  }

  // Generate real-time notifications
  async generateRealTimeNotifications() {
    try {
      // Check for new leave requests
      await this.checkNewLeaveRequests();
      
      // Check for attendance issues
      await this.checkAttendanceIssues();
      
      // Check for overtime requests
      await this.checkOvertimeRequests();
      
      // Check for employee status changes
      await this.checkEmployeeStatusChanges();
      
      console.log('✅ Real-time notifications checked');
    } catch (error) {
      console.error('❌ Error checking real-time notifications:', error);
    }
  }

  // Check for new leave requests
  async checkNewLeaveRequests() {
    const recentLeaves = await Leave.find({
      status: 'Pending',
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
    }).populate('employee', 'name department');

    for (const leave of recentLeaves) {
      const isUrgent = new Date(leave.startDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await ENotification.create({
        title: `Leave Request Alert${isUrgent ? ' (Urgent)' : ''}`,
        message: `${leave.employee.name} (${leave.employee.department}) requested ${leave.daysRequested} days leave starting ${new Date(leave.startDate).toLocaleDateString()}`,
        type: isUrgent ? 'urgent' : 'warning',
        category: 'leave_management',
        priority: isUrgent ? 'urgent' : 'high',
        metadata: {
          employeeId: leave.employee._id,
          department: leave.employee.department,
          actionRequired: true,
          actionType: 'approve_leave',
          actionData: { leaveId: leave._id }
        }
      });
    }
  }

  // Check for attendance issues
  async checkAttendanceIssues() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Check for late arrivals (after 9:30 AM)
    if (currentHour >= 9 && currentHour < 18) {
      const lateEmployees = await Attendance.find({
        date: { 
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        },
        status: 'Present',
        checkInTime: { $gt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30) },
        notificationSent: { $ne: true } // Only send once per day
      }).populate('employee', 'name department');

      for (const record of lateEmployees) {
        const lateMinutes = Math.floor((new Date(record.checkInTime) - new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0)) / (1000 * 60));
        
        await ENotification.create({
          title: 'Late Arrival Alert',
          message: `${record.employee.name} is ${lateMinutes} minutes late (${record.employee.department})`,
          type: 'warning',
          category: 'attendance',
          priority: 'medium',
          metadata: {
            employeeId: record.employee._id,
            department: record.employee.department
          }
        });

        // Mark as notification sent
        await Attendance.findByIdAndUpdate(record._id, { notificationSent: true });
      }
    }
  }

  // Check for overtime requests
  async checkOvertimeRequests() {
    const recentOvertime = await Overtime.find({
      status: 'Pending',
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
    }).populate('employee', 'name department');

    for (const overtime of recentOvertime) {
      await ENotification.create({
        title: 'New Overtime Request',
        message: `${overtime.employee.name} submitted ${overtime.overtimeHours} hours overtime for ${new Date(overtime.date).toLocaleDateString()}`,
        type: 'info',
        category: 'overtime',
        priority: 'medium',
        metadata: {
          employeeId: overtime.employee._id,
          department: overtime.employee.department,
          actionRequired: true,
          actionType: 'approve_overtime',
          actionData: { overtimeId: overtime._id }
        }
      });
    }
  }

  // Check for employee status changes
  async checkEmployeeStatusChanges() {
    // This would typically be triggered by database triggers or hooks
    // For now, we'll check for incomplete profiles
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
      // Only send this notification once per day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingNotification = await ENotification.findOne({
        title: 'Incomplete Employee Profiles',
        createdAt: { $gte: today }
      });

      if (!existingNotification) {
        await ENotification.create({
          title: 'Incomplete Employee Profiles',
          message: `${incompleteProfiles.length} employees have incomplete profiles (missing documents/photos)`,
          type: 'warning',
          category: 'employee_status',
          priority: 'medium'
        });
      }
    }
  }

  // Cleanup old notifications (older than 30 days)
  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await ENotification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo }
      });
      
      console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
    } catch (error) {
      console.error('❌ Error cleaning up old notifications:', error);
    }
  }
}

// Create singleton instance
const notificationScheduler = new ENotificationScheduler();

export default notificationScheduler;
