// Backend: attendanceController.js
import Attendance from "../E-model/Attendance.js";

// Get all attendance records with optional filtering
export const getAttendance = async (req, res) => {
  try {
    const { employeeId, date } = req.query;
    const filter = {};

    if (employeeId) filter.employeeId = employeeId;
    if (date) {
      const day = new Date(date);
      day.setHours(0, 0, 0, 0);
      filter.date = day;
    }

    const records = await Attendance.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error("Error fetching attendance:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get attendance summary for a specific date
export const getSummary = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    const records = await Attendance.find({ date });

    const summary = {
      present: records.filter(r => r.status === "Present").length,
      absent: records.filter(r => r.status === "Absent").length,
      onLeave: records.filter(r => r.status === "On Leave").length,
      late: records.filter(r => r.status === "Late").length,
      total: records.length
    };

    res.json(summary);
  } catch (error) {
    console.error("Error fetching summary:", error.message);
    res.status(500).json({ message: error.message });
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
    console.error("Error fetching recent check-ins:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get attendance reports for charts
export const getReports = async (req, res) => {
  try {
    const { period = "thisweek" } = req.query;

    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case "thisweek":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        endDate = new Date(now);
        endDate.setDate(now.getDate() + (6 - now.getDay()));
        break;
      case "lastweek":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() - 7);
        endDate = new Date(now);
        endDate.setDate(now.getDate() - now.getDay() - 1);
        break;
      case "thismonth":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "lastmonth":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        endDate = new Date(now);
        endDate.setDate(now.getDate() + (6 - now.getDay()));
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const records = await Attendance.find({ date: { $gte: startDate, $lte: endDate } });

    const reportsByDate = {};
    records.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
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

    const totalRecords = records.length;
    const presentRecords = records.filter(r => r.status === "Present" || r.status === "Late").length;
    const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    const lateArrivals = records.filter(record => record.status === "Late").length;

    res.json({ chartData: reports, attendanceRate, lateArrivals });
  } catch (error) {
    console.error("Error fetching reports:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Create new attendance record
export const createAttendance = async (req, res) => {
  try {
    const { employeeId, name, date, checkIn = "-", checkOut = "-" } = req.body;

    if (!employeeId || !name || !date)
      return res.status(400).json({ message: "Missing required fields" });

    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0);

    const existingRecord = await Attendance.findOne({ employeeId, date: recordDate });
    if (existingRecord)
      return res.status(400).json({ message: "Attendance record already exists for this employee on the selected date" });

    // Determine status based on check-in time
    let status = "Present";
    if (checkIn !== "-") {
      const [time, modifier] = checkIn.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      
      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      
      // After 10:00 AM is absent
      if (hours > 10 || (hours === 10 && minutes > 0)) status = "Absent";
      // After 8:00 AM is late
      else if (hours > 8 || (hours === 8 && minutes > 0)) status = "Late";
    } else {
      status = "Absent";
    }

    let nextNumber = 1;
    const highestRecord = await Attendance.findOne().sort({ number: -1 });
    if (highestRecord && highestRecord.number) nextNumber = highestRecord.number + 1;

    const attendance = new Attendance({
      number: nextNumber,
      employeeId,
      name,
      date: recordDate,
      status,
      checkIn,
      checkOut
    });

    const newAttendance = await attendance.save();
    res.status(201).json(newAttendance);
  } catch (error) {
    console.error("Error saving attendance record:", error.message);
    if (error.code === 11000) return res.status(400).json({ message: "Attendance record already exists" });
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    res.status(500).json({ message: error.message });
  }
};
// Update attendance record
export const updateAttendance = async (req, res) => {
  try {
    const { employeeId, name, date, checkIn = "-", checkOut = "-" } = req.body;
    
    // Determine status based on check-in time
    let status = "Present";
    if (checkIn !== "-") {
      const [time, modifier] = checkIn.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      
      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      
      // After 10:00 AM is absent
      if (hours > 10 || (hours === 10 && minutes > 0)) status = "Absent";
      // After 8:00 AM is late
      else if (hours > 8 || (hours === 8 && minutes > 0)) status = "Late";
    } else {
      status = "Absent";
    }

    const updateData = {
      employeeId,
      name,
      date: new Date(date),
      checkIn,
      checkOut,
      status
    };

    const updated = await Attendance.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updated) return res.status(404).json({ message: "Record not found" });
    res.json(updated);
  } catch (error) {
    console.error("Error updating attendance record:", error.message);
    res.status(500).json({ message: error.message });
  }
};
// Delete attendance record
export const deleteAttendance = async (req, res) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Attendance deleted successfully" });
  } catch (error) {
    console.error("Error deleting attendance record:", error.message);
    res.status(500).json({ message: error.message });
  }
};

