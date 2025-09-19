// BACKEND/EmployeeManager/E-control/leaveController.js
import Leave from "../E-model/Leave.js";
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

// GET /api/leaves/upcoming
export const getUpcoming = async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date();
    const list = await Leave.find({
      from: { $gte: from },
      status: { $in: ["Pending", "Approved"] },
    })
      .sort("from")
      .limit(50)
      .lean();
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
