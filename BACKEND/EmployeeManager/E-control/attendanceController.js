// Backend: attendanceController.js - FINAL FIXED VERSION
import Attendance from "../E-model/Attendance.js";

// Get all attendance records with optional filtering
export const getAttendance = async (req, res) => {
  try {
    const { employeeId, date, search } = req.query;
    const filter = {};

    if (employeeId) filter.employeeId = employeeId;

    if (date) {
      const day = new Date(date);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      filter.date = { $gte: day, $lt: nextDay };
    }

    if (search) {
      filter.$or = [
        { employeeId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } }
      ];
    }

    const records = await Attendance.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance records" });
  }
};

// Get attendance summary for a specific date
export const getSummary = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    const records = await Attendance.find({
      date: { $gte: date, $lt: nextDay }
    });

    const summary = {
      present: records.filter(r => r.status === "Present").length,
      absent: records.filter(r => r.status === "Absent").length,
      onLeave: records.filter(r => r.status === "On Leave").length,
      late: records.filter(r => r.status === "Late").length,
      total: records.length
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: "Error fetching summary data" });
  }
};

// Get recent check-ins
export const getRecentCheckins = async (req, res) => {
  try {
    const records = await Attendance.find({ checkIn: { $ne: "-" } })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Error fetching recent check-ins" });
  }
};

// Get attendance reports for charts
export const getReports = async (req, res) => {
  try {
    const { period = "thisweek" } = req.query;
    console.log("getReports called with period:", period);

    const now = new Date();
    console.log("Current server time:", now.toISOString());
    console.log("Current server date string:", now.toDateString());
    
    // Fix timezone issue - use local date instead of UTC
    const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log("Local date (fixed):", localDate.toISOString());
    
    let startDate, endDate;

    switch (period) {
      case "thisweek":
        // Use local date to avoid timezone issues
        const dayOfWeek = localDate.getDay();
        startDate = new Date(localDate);
        startDate.setDate(localDate.getDate() - dayOfWeek);
        endDate = new Date(localDate);
        endDate.setDate(localDate.getDate() + (6 - dayOfWeek));
        break;
      case "lastweek":
        const lastWeekDayOfWeek = localDate.getDay();
        startDate = new Date(localDate);
        startDate.setDate(localDate.getDate() - lastWeekDayOfWeek - 7);
        endDate = new Date(localDate);
        endDate.setDate(localDate.getDate() - lastWeekDayOfWeek - 1);
        break;
      case "thismonth":
        startDate = new Date(localDate.getFullYear(), localDate.getMonth(), 1);
        endDate = new Date(localDate.getFullYear(), localDate.getMonth() + 1, 0);
        break;
      case "lastmonth":
        startDate = new Date(localDate.getFullYear(), localDate.getMonth() - 1, 1);
        endDate = new Date(localDate.getFullYear(), localDate.getMonth(), 0);
        break;
      default:
        const defaultDayOfWeek = localDate.getDay();
        startDate = new Date(localDate);
        startDate.setDate(localDate.getDate() - defaultDayOfWeek);
        endDate = new Date(localDate);
        endDate.setDate(localDate.getDate() + (6 - defaultDayOfWeek));
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log("Date range for reports:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDateString: startDate.toDateString(),
      endDateString: endDate.toDateString()
    });

    const records = await Attendance.find({ date: { $gte: startDate, $lte: endDate } });
    console.log("Found records count:", records.length);

    const reportsByDate = {};
    records.forEach(record => {
      const dateStr = record.date.toISOString().split("T")[0];
      console.log("Processing record date:", dateStr, "for employee:", record.employeeId);
      if (!reportsByDate[dateStr]) {
        reportsByDate[dateStr] = { period: dateStr, present: 0, absent: 0, leave: 0, late: 0 };
      }
      if (record.status === "Present") reportsByDate[dateStr].present++;
      if (record.status === "Absent") reportsByDate[dateStr].absent++;
      if (record.status === "On Leave") reportsByDate[dateStr].leave++;
      if (record.status === "Late") reportsByDate[dateStr].late++;
    });

    const reports = Object.values(reportsByDate).sort((a, b) =>
      new Date(a.period) - new Date(b.period)
    );

    console.log("Final reports data:", reports);

    const totalRecords = records.length;
    const presentRecords = records.filter(r => r.status === "Present" || r.status === "Late").length;
    const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
    const lateArrivals = records.filter(record => record.status === "Late").length;

    // Calculate employee statistics for Top Performers chart
    const employeeStatsMap = {};
    records.forEach(record => {
      if (!employeeStatsMap[record.employeeId]) {
        employeeStatsMap[record.employeeId] = {
          employeeId: record.employeeId,
          name: record.name,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          total: 0
        };
      }
      employeeStatsMap[record.employeeId].total++;
      if (record.status === "Present") employeeStatsMap[record.employeeId].present++;
      if (record.status === "Absent") employeeStatsMap[record.employeeId].absent++;
      if (record.status === "Late") employeeStatsMap[record.employeeId].late++;
      if (record.status === "On Leave") employeeStatsMap[record.employeeId].leave++;
    });

    // Convert to array and sort by present count (top performers)
    const employeeStats = Object.values(employeeStatsMap)
      .sort((a, b) => b.present - a.present)
      .slice(0, 10); // Top 10 performers

    // If no data, provide empty array with message
    if (employeeStats.length === 0) {
      employeeStats.push({
        employeeId: "no-data",
        name: "No attendance data available",
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        total: 0
      });
    }

    const response = { 
      chartData: reports, 
      attendanceRate, 
      lateArrivals, 
      employeeStats 
    };
    console.log("Sending response:", response);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports data" });
  }
};

// Helper to determine status from check-in (if not manually set)
const determineStatus = (checkIn, manualStatus = null) => {
  if (manualStatus && manualStatus !== "Present") return manualStatus;
  if (!checkIn || checkIn === "-") return "Absent";
  try {
    const [time, modifier] = checkIn.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    if (hours > 10 || (hours === 10 && minutes > 0)) return "Absent";
    if (hours > 8 || (hours === 8 && minutes > 0)) return "Late";
    return "Present";
  } catch {
    return manualStatus || "Present";
  }
};

// Create new attendance record
export const createAttendance = async (req, res) => {
  try {
    const { employeeId, name, date, checkIn = "-", checkOut = "-", status } = req.body;

    if (!employeeId || !name || !date) {
      return res.status(400).json({ message: "Employee ID, name, and date are required" });
    }

    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0);

    const existingRecord = await Attendance.findOne({
      employeeId,
      date: { $gte: recordDate, $lt: new Date(recordDate.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (existingRecord) {
      return res.status(400).json({ message: "Attendance record already exists for this employee on the selected date" });
    }

    const finalStatus = status || determineStatus(checkIn);

    const highestRecord = await Attendance.findOne().sort({ number: -1 });
    const nextNumber = highestRecord?.number ? highestRecord.number + 1 : 1;

    const savedAttendance = await new Attendance({
      number: nextNumber,
      employeeId: employeeId.trim(),
      name: name.trim(),
      date: recordDate,
      status: finalStatus,
      checkIn,
      checkOut
    }).save();

    res.status(201).json(savedAttendance);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Attendance record already exists for this employee on this date" });
    }
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: errors.join(", ") });
    }
    res.status(500).json({ message: "Error creating attendance record" });
  }
};

// Update attendance record (hardened)
export const updateAttendance = async (req, res) => {
  try {
    const recordId = req.params.id;
    const { employeeId, name, date, checkIn = "-", checkOut = "-", status } = req.body;

    if (!employeeId || !name || !date) {
      return res.status(400).json({ message: "Employee ID, name, and date are required" });
    }

    if (!recordId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid record ID format" });
    }

    const existingRecord = await Attendance.findById(recordId);
    if (!existingRecord) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(recordDate);
    nextDay.setDate(recordDate.getDate() + 1);

    const employeeIdChanged = existingRecord.employeeId !== employeeId.trim();
    const dateChanged = existingRecord.date.getTime() !== recordDate.getTime();

    if (employeeIdChanged || dateChanged) {
      const duplicateRecord = await Attendance.findOne({
        _id: { $ne: recordId },
        employeeId: employeeId.trim(),
        date: { $gte: recordDate, $lt: nextDay }
      });
      if (duplicateRecord) {
        return res.status(400).json({ message: "Another attendance record already exists for this employee on this date" });
      }
    }

    const finalStatus = status || determineStatus(checkIn);

    const updatedRecord = await Attendance.findOneAndUpdate(
      { _id: recordId },
      {
        $set: {
          employeeId: employeeId.trim(),
          name: name.trim(),
          date: recordDate,
          checkIn,
          checkOut,
          status: finalStatus
        }
      },
      { new: true, runValidators: true, upsert: false }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "Failed to update attendance record" });
    }

    res.json(updatedRecord);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Attendance record already exists for this employee on this date" });
    }
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: errors.join(", ") });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid record ID format" });
    }
    res.status(500).json({ message: "Error updating attendance record" });
  }
};

// QR Code scan endpoint
export const scanQRCode = async (req, res) => {
  try {
    console.log("=== QR SCAN REQUEST RECEIVED ===");
    console.log("Request body:", req.body);
    console.log("Request headers:", req.headers);
    
    const { employeeId, name, timestamp } = req.body;
    
    if (!employeeId || !name) {
      console.log("Missing required fields:", { employeeId, name });
      return res.status(400).json({ message: "Employee ID and name are required" });
    }
    
    // Import Employee model to verify employee exists
    const Employee = (await import("../E-model/Employee.js")).default;
    
    // Verify employee exists in the system
    const employee = await Employee.findOne({ id: employeeId });
    if (!employee) {
      return res.status(404).json({ message: `Employee ${employeeId} not found in StaffHub` });
    }
    
    console.log("QR scan for verified employee:", employee);
    
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    // Format time for display
    const timeString = currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log("Date range for search:", { today, tomorrow, employeeId });
    
    // Check if record already exists for today - try multiple approaches
    let existingRecord = await Attendance.findOne({
      employeeId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    // If not found with date range, try finding by employeeId and today's date string
    if (!existingRecord) {
      const todayString = today.toISOString().split('T')[0];
      existingRecord = await Attendance.findOne({
        employeeId,
        date: todayString
      });
    }
    
    // If still not found, try finding any record for this employee today
    if (!existingRecord) {
      existingRecord = await Attendance.findOne({
        employeeId,
        date: { $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) }
      });
    }
    
    console.log("Existing record check:", existingRecord);
    
    if (existingRecord) {
      // Employee already has a record for today
      console.log("Employee has existing record. Check-out status:", existingRecord.checkOut);
      console.log("Check-out comparison:", existingRecord.checkOut === "-", "Value:", `"${existingRecord.checkOut}"`);
      
      // More flexible check-out detection
      const isCheckedOut = existingRecord.checkOut && 
                          existingRecord.checkOut !== "-" && 
                          existingRecord.checkOut !== "" && 
                          existingRecord.checkOut !== null && 
                          existingRecord.checkOut !== undefined;
      
      console.log("Is already checked out:", isCheckedOut);
      
      if (!isCheckedOut) {
        try {
          // Employee is checking out - with overtime calculation
          console.log("Processing check-out for employee:", employeeId);
          existingRecord.checkOut = timeString;
          
          // Update status to Present
          existingRecord.status = "Present";
          
          console.log("Saving updated record...");
          const updatedRecord = await existingRecord.save();
          console.log("Check-out recorded successfully:", updatedRecord);
          
          // Precise overtime calculation - calculate exact time worked beyond 5 PM
          let overtimeHours = 0;
          let overtimeMinutes = 0;
          let regularHours = 8; // Default to 8 hours
          let totalHours = 8;
          let overtimeTimeString = "0:00"; // Format: "2:30"
          
          try {
            // Parse the checkout time to get exact overtime - improved parsing
            console.log("Processing checkout time for overtime:", timeString);
            
            let hour = 0;
            let minute = 0;
            
            if (timeString.includes('PM')) {
              const timePart = timeString.split(' ')[0]; // Get "08:03" from "08:03 PM"
              const [hourStr, minuteStr] = timePart.split(':');
              hour = parseInt(hourStr);
              minute = parseInt(minuteStr);
              
              console.log("PM time parsing:", { timePart, hourStr, minuteStr, hour, minute });
              
              // Convert to 24-hour format for PM times (except 12 PM)
              if (hour !== 12) {
                hour += 12;
              }
              
              console.log("PM time after 24-hour conversion:", { hour, minute });
            } else if (timeString.includes('AM')) {
              const timePart = timeString.split(' ')[0]; // Get "7:30" from "7:30 AM"
              const [hourStr, minuteStr] = timePart.split(':');
              hour = parseInt(hourStr);
              minute = parseInt(minuteStr);
              
              // Convert 12 AM to 0
              if (hour === 12) {
                hour = 0;
              }
            } else {
              // Handle 24-hour format (e.g., "17:30")
              const [hourStr, minuteStr] = timeString.split(':');
              hour = parseInt(hourStr);
              minute = parseInt(minuteStr);
            }
            
            console.log("Parsed checkout time (24-hour):", { hour, minute, originalTime: timeString });
            
            // Calculate overtime beyond 5:00 PM (17:00)
            const checkoutTotalMinutes = (hour * 60) + minute;
            const regularEndTotalMinutes = 17 * 60; // 5:00 PM = 17:00 = 1020 minutes
            
            console.log("Time comparison:", {
              checkoutTotalMinutes,
              regularEndTotalMinutes,
              checkoutTime: `${hour}:${minute.toString().padStart(2, '0')}`,
              regularEndTime: "17:00"
            });
            
            if (checkoutTotalMinutes > regularEndTotalMinutes) {
              const overtimeTotalMinutes = checkoutTotalMinutes - regularEndTotalMinutes;
              overtimeHours = Math.floor(overtimeTotalMinutes / 60);
              overtimeMinutes = overtimeTotalMinutes % 60;
              
              // Format overtime as "H:MM" (e.g., "2:30")
              overtimeTimeString = `${overtimeHours}:${overtimeMinutes.toString().padStart(2, '0')}`;
              
              // Convert overtime to decimal hours for calculations
              const overtimeDecimalHours = overtimeHours + (overtimeMinutes / 60);
              totalHours = regularHours + overtimeDecimalHours;
              
              console.log("Overtime calculation result:", {
                checkoutTotalMinutes,
                regularEndTotalMinutes,
                overtimeTotalMinutes,
                overtimeHours,
                overtimeMinutes,
                overtimeTimeString,
                overtimeDecimalHours,
                totalHours
              });
            } else {
              console.log("No overtime - checkout time is before 5:00 PM");
            }
          } catch (timeError) {
            console.log("Time parsing error, using defaults:", timeError);
          }
          
          // Create overtime record if employee worked overtime
          console.log("Overtime check - overtimeHours:", overtimeHours, "overtimeMinutes:", overtimeMinutes, "overtimeTimeString:", overtimeTimeString);
          if (overtimeHours > 0 || overtimeMinutes > 0) {
            try {
              console.log("Creating overtime record for employee:", employeeId, "with overtime:", overtimeTimeString);
              const Overtime = (await import("../E-model/Overtime.js")).default;
              
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              // Check if overtime record already exists for today
              const existingOvertime = await Overtime.findOne({
                employee: employee._id,
                date: today
              });
              
              if (existingOvertime) {
                // Update existing overtime record
                existingOvertime.overtimeHours = overtimeTimeString;
                existingOvertime.totalHours = totalHours;
                existingOvertime.description = `Automatic overtime from QR check-out at ${timeString} (${overtimeTimeString} overtime)`;
                existingOvertime.status = "Pending";
                
                await existingOvertime.save();
                console.log("Overtime record updated successfully:", existingOvertime);
              } else {
                // Create new overtime record
                const newOvertime = new Overtime({
                  employee: employee._id,
                  date: today,
                  regularHours: regularHours,
                  overtimeHours: overtimeTimeString, // Store as "2:30" format
                  totalHours: totalHours,
                  description: `Automatic overtime from QR check-out at ${timeString} (${overtimeTimeString} overtime)`,
                  status: "Pending"
                });
                
                await newOvertime.save();
                console.log("Overtime record created successfully:", newOvertime);
              }
            } catch (overtimeError) {
              console.error("Error creating/updating overtime record:", overtimeError);
              // Don't fail the checkout if overtime creation fails
            }
          } else {
            console.log("No overtime - employee checked out before 5:00 PM");
          }
          
          res.status(200).json({ 
            message: "Check-out recorded successfully", 
            record: updatedRecord,
            action: "checkout",
            overtimeHours: overtimeTimeString, // Return as "2:30" format
            regularHours: regularHours,
            totalHours: totalHours
          });
        } catch (checkoutError) {
          console.error("Error during check-out process:", checkoutError);
          console.error("Checkout error stack:", checkoutError.stack);
          res.status(500).json({ 
            message: "Error processing check-out", 
            error: checkoutError.message 
          });
        }
      } else {
        // Employee already checked out
        console.log("Employee already checked out, returning info message");
        return res.status(200).json({ 
          message: "Employee has already checked out for today",
          record: existingRecord,
          action: "already_checked_out"
        });
      }
    } else {
      // Employee is checking in for the first time today
      // Determine initial status based on check-in time
      let status = "Present";
      if (currentHour > 10 || (currentHour === 10 && currentMinute > 0)) {
        status = "Late";
      }
      
      const highestRecord = await Attendance.findOne().sort({ number: -1 });
      const nextNumber = highestRecord?.number ? highestRecord.number + 1 : 1;
      
      const newAttendance = new Attendance({
        number: nextNumber,
        employeeId: employeeId.trim(),
        name: employee.name.trim(), // Use the name from the database, not the QR code
        date: today,
        checkIn: timeString,
        checkOut: "-",
        status: status
      });
      
      const savedAttendance = await newAttendance.save();
      console.log("Check-in recorded:", savedAttendance);
      res.status(201).json({ 
        message: "Check-in recorded successfully", 
        record: savedAttendance,
        action: "checkin"
      });
    }
  } catch (error) {
    console.error("QR scan error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Error processing QR scan", 
      error: error.message,
      details: error.stack 
    });
  }
};

// Debug endpoint to check attendance records
export const debugAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const records = await Attendance.find({
      employeeId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    console.log("Debug attendance for", employeeId, ":", records);
    res.json({ employeeId, today, tomorrow, records });
  } catch (err) {
    console.error("Debug attendance error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Debug endpoint to check current date
export const debugDate = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    res.json({
      currentTime: now.toISOString(),
      currentDateString: now.toDateString(),
      currentLocalDate: now.toLocaleDateString(),
      todayStart: today.toISOString(),
      todayStartString: today.toDateString()
    });
  } catch (err) {
    console.error("Debug date error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete attendance record
export const deleteAttendance = async (req, res) => {
  try {
    const recordId = req.params.id;

    const deletedRecord = await Attendance.findByIdAndDelete(recordId);
    if (!deletedRecord) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.json({ message: "Attendance record deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid record ID format" });
    }
    res.status(500).json({ message: "Error deleting attendance record" });
  }
};
