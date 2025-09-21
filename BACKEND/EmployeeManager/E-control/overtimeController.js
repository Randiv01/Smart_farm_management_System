import Overtime from "../E-model/Overtime.js";
import Employee from "../E-model/Employee.js";

// helpers to build professional codes
const looksLikeObjectId = (s) => typeof s === 'string' && /^[0-9a-f]{24}$/i.test(s);

const getEmployeeCodeFromDoc = (emp) => {
  if (!emp) return "EMP-XXX";
  const candidates = [
    emp.employeeCode,
    emp.code,
    emp.empId,
    emp.staffId,
    emp.employeeId,
    emp.customId,
    emp.hrId,
    emp.id, // sometimes people store custom code here
  ].filter(Boolean);
  const chosen = candidates.find((c) => typeof c === 'string' && !looksLikeObjectId(c));
  if (chosen) return String(chosen).toUpperCase();
  const namePart = (emp.name || 'EMP').replace(/[^A-Za-z]/g, '').slice(0,3).toUpperCase().padEnd(3,'X');
  return `EMP-${namePart}`;
};

const buildOvertimeId = (empDoc, date, objectId) => {
  const code = getEmployeeCodeFromDoc(empDoc);
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  const tail = (objectId?.toString?.() || '').slice(-6).toUpperCase();
  return `OT-${code}-${y}${m}${day}-${tail}`;
};

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
      .populate("employee", "name id employeeCode code empId staffId employeeId customId hrId")
      .populate("approvedBy", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // ensure old rows without overtimeId still deliver a value
    for (const r of records) {
      if (!r.overtimeId) {
        r.overtimeId = buildOvertimeId(r.employee, r.date, r._id);
      }
    }

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
      .populate("employee", "name id contact title employeeCode code empId staffId employeeId customId hrId")
      .populate("approvedBy", "name")
      .populate("createdBy", "name");

    if (!record) return res.status(404).json({ error: "Overtime record not found" });

    if (!record.overtimeId) {
      record.overtimeId = buildOvertimeId(record.employee, record.date, record._id);
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

    const employeeExists = await Employee.findById(employee);
    if (!employeeExists) return res.status(404).json({ error: "Employee not found" });

    const totalHours = parseFloat(regularHours) + parseFloat(overtimeHours);

    // create instance to get _id first
    const newRecord = new Overtime({
      employee,
      date,
      regularHours: parseFloat(regularHours),
      overtimeHours: parseFloat(overtimeHours),
      totalHours,
      description,
      createdBy: req.user?.id
    });

    // generate professional overtimeId
    newRecord.overtimeId = buildOvertimeId(employeeExists, date, newRecord._id);

    await newRecord.save();

    const populatedRecord = await Overtime.findById(newRecord._id)
      .populate("employee", "name id employeeCode code empId staffId employeeId customId hrId")
      .populate("createdBy", "name");

    res.status(201).json(populatedRecord);
  } catch (error) {
    // if duplicate (extremely unlikely), fall back to saving without unique id
    res.status(500).json({ error: error.message });
  }
};

// Update overtime record
export const updateOvertimeRecord = async (req, res) => {
  try {
    const { regularHours, overtimeHours, description, status, date, employee } = req.body;

    const record = await Overtime.findById(req.params.id).populate("employee");
    if (!record) return res.status(404).json({ error: "Overtime record not found" });

    if (regularHours !== undefined) record.regularHours = parseFloat(regularHours);
    if (overtimeHours !== undefined) record.overtimeHours = parseFloat(overtimeHours);
    if (description !== undefined) record.description = description;
    if (date !== undefined) record.date = new Date(date);
    if (employee !== undefined) record.employee = employee;

    if (regularHours !== undefined || overtimeHours !== undefined) {
      record.totalHours = record.regularHours + record.overtimeHours;
    }

    if (status && ["Approved", "Rejected"].includes(status) && record.status === "Pending") {
      record.status = status;
      record.approvedBy = req.user?.id;
      record.approvedAt = new Date();
    }

    // recompute overtimeId if date/employee changed or if missing
    if (!record.overtimeId || date !== undefined || employee !== undefined) {
      const empDoc = employee !== undefined
        ? await Employee.findById(record.employee)
        : record.employee;
      record.overtimeId = buildOvertimeId(empDoc, record.date, record._id);
    }

    await record.save();

    const updatedRecord = await Overtime.findById(record._id)
      .populate("employee", "name id employeeCode code empId staffId employeeId customId hrId")
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
 * Analytics endpoints (unchanged from your working version)
 * mode=trend&window=30|90|365
 * mode=top&range=thisMonth|lastMonth
 */
export const getOvertimeAnalytics = async (req, res) => {
  try {
    const { mode = 'trend', window = '30', range = 'thisMonth' } = req.query;

    if (mode === 'trend') {
      const now = new Date();
      const days = Number(window) || 30;
      let start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (days - 1));

      const groupStage =
        days >= 365
          ? { _id: { $month: '$date' }, hours: { $sum: '$overtimeHours' } }
          : { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, hours: { $sum: '$overtimeHours' } };

      const data = await Overtime.aggregate([
        { $match: { date: { $gte: start, $lte: now } } },
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
      let month = today.getMonth();
      let year = today.getFullYear();
      if (range === 'lastMonth') {
        if (month === 0) { month = 11; year -= 1; } else { month -= 1; }
      }
      const startDate = new Date(year, month, 1, 0, 0, 0);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const topEmployees = await Overtime.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$employee', hours: { $sum: '$overtimeHours' } } },
        { $sort: { hours: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'emp' } },
        { $unwind: '$emp' },
        { $project: { name: '$emp.name', hours: { $round: ['$hours', 2] } } }
      ]);

      return res.json({ topEmployees });
    }

    res.json({ trendData: [], topEmployees: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
