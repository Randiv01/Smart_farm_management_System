import Leave from "../E-model/Leave.js";
import ENotification from "../E-model/ENotification.js";
import EventEmitter from "events";

// Simple in-process pub-sub for SSE
class LeaveBus extends EventEmitter {}
const leaveBus = new LeaveBus();

const POLICIES = {
  Annual: 21,
  Sick: 14,
  Casual: 7,
  Other: 0, // not tracked in balance
};

// Build MongoDB filter from query
function buildFilter(q) {
  const filter = {};
  if (q.status && q.status !== "All Status") filter.status = q.status;
  if (q.type && q.type !== "All Types") filter.type = q.type;
  if (q.empId) filter.empId = q.empId;
  if (q.year) filter.year = Number(q.year);
  return filter;
}

// GET /api/leaves
export const getLeaves = async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);
    const sortBy = req.query.sortBy || "-createdAt";
    const leaves = await Leave.find(filter).sort(sortBy).lean();
    res.json(leaves);
  } catch (e) {
    next(e);
  }
};

// POST /api/leaves
export const createLeave = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const leave = await Leave.create({
      empId: payload.empId,
      name: payload.name,
      type: payload.type,
      from: payload.from,
      to: payload.to,
      days: payload.days, // optional; auto when missing
      reason: payload.reason || "",
      status: payload.status || "Pending",
    });
    
    // Create notification for new leave request
    try {
      await ENotification.create({
        title: 'New Leave Request',
        message: `New leave request from ${leave.name} for ${leave.type} leave from ${new Date(leave.from).toLocaleDateString()} to ${new Date(leave.to).toLocaleDateString()}`,
        type: 'warning',
        category: 'leave_management',
        priority: 'high',
        isRead: false,
        scheduledTime: new Date(),
        metadata: {
          actionRequired: true,
          actionType: 'review_leave',
          employeeName: leave.name,
          employeeId: leave.empId,
          department: 'General', // You can enhance this to get actual department
          leaveId: leave._id,
          leaveType: leave.type
        }
      });
    } catch (notificationError) {
      console.error('Failed to create leave notification:', notificationError);
      // Don't fail the leave creation if notification fails
    }
    
    leaveBus.emit("changed", { action: "created", leave });
    res.status(201).json(leave);
  } catch (e) {
    next(e);
  }
};

// PUT /api/leaves/:id
export const updateLeave = async (req, res, next) => {
  try {
    const update = { ...req.body };
    if (update.from || update.to) {
      if (update.from) update.year = new Date(update.from).getFullYear();
      const fromDate = new Date(update.from || undefined);
      const toDate = new Date(update.to || undefined);
      if (update.from && update.to) {
        const diff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
        update.days = Math.max(diff, 1);
      }
    }
    const leave = await Leave.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!leave) return res.status(404).json({ error: "Leave not found" });
    
    // Create notification for leave status change (approval/rejection)
    if (update.status && update.status !== 'Pending') {
      try {
        const notificationType = update.status === 'Approved' ? 'success' : 'error';
        const notificationTitle = update.status === 'Approved' ? 'Leave Request Approved' : 'Leave Request Rejected';
        const notificationMessage = `Your ${leave.type} leave request from ${new Date(leave.from).toLocaleDateString()} to ${new Date(leave.to).toLocaleDateString()} has been ${update.status.toLowerCase()}`;
        
        await ENotification.create({
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
          category: 'leave_management',
          priority: 'medium',
          isRead: false,
          scheduledTime: new Date(),
          metadata: {
            actionRequired: false,
            employeeName: leave.name,
            employeeId: leave.empId,
            department: 'General',
            leaveId: leave._id,
            leaveType: leave.type,
            status: update.status
          }
        });
      } catch (notificationError) {
        console.error('Failed to create leave status notification:', notificationError);
        // Don't fail the leave update if notification fails
      }
    }
    
    leaveBus.emit("changed", { action: "updated", leave });
    res.json(leave);
  } catch (e) {
    next(e);
  }
};

// DELETE /api/leaves/:id
export const deleteLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) return res.status(404).json({ error: "Leave not found" });
    leaveBus.emit("changed", { action: "deleted", leaveId: req.params.id });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};

// GET /api/leaves/balance
export const getBalance = async (req, res, next) => {
  try {
    const { empId, year } = req.query;
    if (!empId || !year)
      return res.status(400).json({ error: "empId and year are required" });

    const approved = await Leave.aggregate([
      { $match: { empId, year: Number(year), status: "Approved" } },
      { $group: { _id: "$type", used: { $sum: "$days" } } },
    ]);

    const usedMap = approved.reduce((a, c) => {
      a[c._id] = c.used;
      return a;
    }, {});

    const balance = {
      Annual: { total: POLICIES.Annual, used: usedMap["Annual"] || 0 },
      Sick: { total: POLICIES.Sick, used: usedMap["Sick"] || 0 },
      Casual: { total: POLICIES.Casual, used: usedMap["Casual"] || 0 },
      Other: { total: POLICIES.Other, used: usedMap["Other"] || 0 },
    };

    Object.keys(balance).forEach((k) => {
      balance[k].remaining = Math.max(balance[k].total - balance[k].used, 0);
    });

    res.json({ empId, year: Number(year), balance });
  } catch (e) {
    next(e);
  }
};

// GET /api/leaves/distribution
export const getDistribution = async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);
    const data = await Leave.aggregate([
      { $match: filter },
      { $group: { _id: "$type", value: { $sum: "$days" } } },
      { $project: { _id: 0, name: "$_id", value: 1 } },
    ]);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

/**
 * ✅ FIXED: real monthly trend by date range, not by stored `year`.
 * GET /api/leaves/trend?year=2025&status=Approved|Pending|Rejected|All%20Status&type=Annual|Sick|Casual|Other|All%20Types&empId=EMPID001
 */
export const getTrend = async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    const match = {
      from: { $gte: start, $lte: end },
    };
    if (req.query.status && req.query.status !== "All Status") match.status = req.query.status;
    if (req.query.type && req.query.type !== "All Types") match.type = req.query.type;
    if (req.query.empId) match.empId = req.query.empId;

    const agg = await Leave.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $month: "$from" },
          leaves: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // always return 12 months
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      leaves: 0,
      approved: 0,
    }));
    agg.forEach((row) => {
      const m = row._id;
      months[m - 1] = { month: m, leaves: row.leaves, approved: row.approved };
    });

    res.json({ year, months });
  } catch (e) {
    next(e);
  }
};

// GET /api/leaves/upcoming
export const getUpcoming = async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date();
    const q = {
      from: { $gte: from },
      status: { $in: ["Pending", "Approved"] },
    };
    if (req.query.empId) q.empId = req.query.empId;

    const list = await Leave.find(q).sort("from").limit(50).lean();
    res.json(list);
  } catch (e) {
    next(e);
  }
};

// SSE: GET /api/leaves/stream
export const stream = async (req, res, next) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const onChange = (payload) => {
    res.write(`event: change\ndata: ${JSON.stringify(payload)}\n\n`);
  };
  leaveBus.on("changed", onChange);

  // Heartbeat
  const hb = setInterval(() => res.write(`:\n\n`), 20000);

  req.on("close", () => {
    clearInterval(hb);
    leaveBus.off("changed", onChange);
  });
};
