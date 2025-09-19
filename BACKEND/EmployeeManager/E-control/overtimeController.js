import Overtime from "../E-model/Overtime.js";
import Employee from "../E-model/Employee.js";

// Get all overtime records with filtering
export const getOvertimeRecords = async (req, res) => {
  try {
    const { month, year, status, employee, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    
    if (status) filter.status = status;
    if (employee) filter.employee = employee;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get records with population
    const records = await Overtime.find(filter)
      .populate("employee", "name id")
      .populate("approvedBy", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Overtime.countDocuments(filter);
    
    res.json({
      records,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
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
      .populate("employee", "name id contact title")
      .populate("approvedBy", "name")
      .populate("createdBy", "name");
    
    if (!record) {
      return res.status(404).json({ error: "Overtime record not found" });
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
    
    // Validate employee exists
    const employeeExists = await Employee.findById(employee);
    if (!employeeExists) {
      return res.status(404).json({ error: "Employee not found" });
    }
    
    // Calculate total hours
    const totalHours = parseFloat(regularHours) + parseFloat(overtimeHours);
    
    const newRecord = new Overtime({
      employee,
      date,
      regularHours: parseFloat(regularHours),
      overtimeHours: parseFloat(overtimeHours),
      totalHours,
      description,
      createdBy: req.user?.id
    });
    
    await newRecord.save();
    
    // Populate and return the new record
    const populatedRecord = await Overtime.findById(newRecord._id)
      .populate("employee", "name id")
      .populate("createdBy", "name");
    
    res.status(201).json(populatedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update overtime record
export const updateOvertimeRecord = async (req, res) => {
  try {
    const { regularHours, overtimeHours, description, status } = req.body;
    
    const record = await Overtime.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Overtime record not found" });
    }
    
    // Update fields if provided
    if (regularHours !== undefined) record.regularHours = parseFloat(regularHours);
    if (overtimeHours !== undefined) record.overtimeHours = parseFloat(overtimeHours);
    if (description !== undefined) record.description = description;
    
    // Recalculate total hours if regular or overtime hours changed
    if (regularHours !== undefined || overtimeHours !== undefined) {
      record.totalHours = record.regularHours + record.overtimeHours;
    }
    
    // Handle status change (approval/rejection)
    if (status && ["Approved", "Rejected"].includes(status) && record.status === "Pending") {
      record.status = status;
      record.approvedBy = req.user?.id;
      record.approvedAt = new Date();
    }
    
    await record.save();
    
    // Get updated record with population
    const updatedRecord = await Overtime.findById(record._id)
      .populate("employee", "name id")
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
    
    if (!record) {
      return res.status(404).json({ error: "Overtime record not found" });
    }
    
    await Overtime.findByIdAndDelete(req.params.id);
    res.json({ message: "Overtime record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get overtime analytics
export const getOvertimeAnalytics = async (req, res) => {
  try {
    const { period, year } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    let groupBy;
    let dateFormat;
    
    switch (period) {
      case "monthly":
        groupBy = { $month: "$date" };
        dateFormat = { $arrayToObject: [[{ k: "month", v: "$_id" }, { k: "hours", v: "$totalHours" }]] };
        break;
      case "weekly":
        groupBy = { $week: "$date" };
        dateFormat = { $arrayToObject: [[{ k: "week", v: "$_id" }, { k: "hours", v: "$totalHours" }]] };
        break;
      default:
        groupBy = { $month: "$date" };
        dateFormat = { $arrayToObject: [[{ k: "month", v: "$_id" }, { k: "hours", v: "$totalHours" }]] };
    }
    
    // Get overtime trend data
    const trendData = await Overtime.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          },
          status: "Approved"
        }
      },
      {
        $group: {
          _id: groupBy,
          totalHours: { $sum: "$overtimeHours" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get top employees with most overtime
    const topEmployees = await Overtime.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          },
          status: "Approved"
        }
      },
      {
        $group: {
          _id: "$employee",
          totalOvertime: { $sum: "$overtimeHours" }
        }
      },
      {
        $sort: { totalOvertime: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employee"
        }
      },
      {
        $unwind: "$employee"
      },
      {
        $project: {
          name: "$employee.name",
          hours: { $round: ["$totalOvertime", 2] }
        }
      }
    ]);
    
    // Get statistics
    const totalOvertime = await Overtime.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          },
          status: "Approved"
        }
      },
      {
        $group: {
          _id: null,
          totalHours: { $sum: "$overtimeHours" },
          avgPerEmployee: { $avg: "$overtimeHours" },
          recordCount: { $sum: 1 }
        }
      }
    ]);
    
    // Get pending approvals count
    const pendingCount = await Overtime.countDocuments({ status: "Pending" });
    
    res.json({
      trendData,
      topEmployees,
      statistics: {
        totalOvertime: totalOvertime[0]?.totalHours || 0,
        avgPerEmployee: totalOvertime[0]?.avgPerEmployee || 0,
        pendingCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};