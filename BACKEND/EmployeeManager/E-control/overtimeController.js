import Overtime from "../E-model/Overtime.js";
import Employee from "../E-model/Employee.js";

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
      .populate("employee", "name id")
      .populate("approvedBy", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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
      .populate("employee", "name id contact title")
      .populate("approvedBy", "name")
      .populate("createdBy", "name");

    if (!record) return res.status(404).json({ error: "Overtime record not found" });

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
    if (!record) return res.status(404).json({ error: "Overtime record not found" });

    if (regularHours !== undefined) record.regularHours = parseFloat(regularHours);
    if (overtimeHours !== undefined) record.overtimeHours = parseFloat(overtimeHours);
    if (description !== undefined) record.description = description;

    if (regularHours !== undefined || overtimeHours !== undefined) {
      record.totalHours = record.regularHours + record.overtimeHours;
    }

    // Keep status logic if you still use it elsewhere
    if (status && ["Approved", "Rejected"].includes(status) && record.status === "Pending") {
      record.status = status;
      record.approvedBy = req.user?.id;
      record.approvedAt = new Date();
    }

    await record.save();

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
    if (!record) return res.status(404).json({ error: "Overtime record not found" });

    await Overtime.findByIdAndDelete(req.params.id);
    res.json({ message: "Overtime record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ANALYTICS (UPDATED)
 * - mode=trend&window=30|90|365  -> daily totals for last N days (or month totals if 365)
 * - mode=top&range=thisMonth|lastMonth -> top 5 employees by overtime in that month
 * 
 * NOTE: We DO NOT restrict to status="Approved" here because you requested
 * "from the overtime records table". If you need only approved, add `status:"Approved"` to $match.
 */
export const getOvertimeAnalytics = async (req, res) => {
  try {
    const { mode = 'trend', window = '30', range = 'thisMonth' } = req.query;

    if (mode === 'trend') {
      const now = new Date();
      const days = Number(window) || 30;

      // start date
      let start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (days - 1));

      // group by day for 30/90, by month for 365 (this year)
      const groupStage =
        days >= 365
          ? { _id: { $month: '$date' }, hours: { $sum: '$overtimeHours' } }
          : { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, hours: { $sum: '$overtimeHours' } };

      const data = await Overtime.aggregate([
        {
          $match: {
            date: { $gte: start, $lte: now }
            // if you want only approved: , status: 'Approved'
          }
        },
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
      let month = today.getMonth(); // 0-based
      let year = today.getFullYear();

      if (range === 'lastMonth') {
        if (month === 0) {
          month = 11;
          year -= 1;
        } else {
          month -= 1;
        }
      }

      const startDate = new Date(year, month, 1, 0, 0, 0);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const topEmployees = await Overtime.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
            // if you want only approved: , status: 'Approved'
          }
        },
        { $group: { _id: '$employee', hours: { $sum: '$overtimeHours' } } },
        { $sort: { hours: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'employees',
            localField: '_id',
            foreignField: '_id',
            as: 'emp'
          }
        },
        { $unwind: '$emp' },
        { $project: { name: '$emp.name', hours: { $round: ['$hours', 2] } } }
      ]);

      return res.json({ topEmployees });
    }

    // default fallback
    res.json({ trendData: [], topEmployees: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
