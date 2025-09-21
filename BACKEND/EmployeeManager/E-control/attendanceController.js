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
      const dateStr = record.date.toISOString().split("T")[0];
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
