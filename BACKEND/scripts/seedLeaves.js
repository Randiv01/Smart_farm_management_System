import mongoose from "mongoose";
import dotenv from "dotenv";
import Leave from "../EmployeeManager/E-model/Leave.js";
import Employee from "../EmployeeManager/E-model/Employee.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority";

const leaveTypes = ["Annual", "Sick", "Casual", "Other"];
const statuses = ["Pending", "Approved", "Rejected"]; // optional; default is Pending

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function makeReason(type) {
  switch (type) {
    case "Annual":
      return "Annual leave";
    case "Sick":
      return "Medical reason";
    case "Casual":
      return "Personal errand";
    default:
      return "Other reason";
  }
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Load up to 10 employees to ensure correct empId/name mapping
    const staff = await Employee.find({}, { id: 1, name: 1, _id: 0 })
      .sort({ id: 1 })
      .limit(10)
      .lean();

    if (!staff.length) {
      throw new Error("No employees found. Seed employees first before seeding leaves.");
    }

    const count = Math.min(10, staff.length);

    // Start dates distributed in October 2025 for planner visibility
    const base = new Date("2025-10-01T00:00:00.000Z");

    const leaves = Array.from({ length: count }, (_, i) => {
      const emp = staff[i];
      const type = leaveTypes[i % leaveTypes.length];
      const start = addDays(base, i * 3); // spaced every 3 days
      const length = (i % 5) + 1; // 1..5 days
      const end = addDays(start, length - 1);
      const status = statuses[i % statuses.length];

      return {
        empId: emp.id,
        name: emp.name,
        type,
        from: start,
        to: end,
        reason: makeReason(type),
        status, // optional; Leave schema defaults to Pending if omitted
        // Explicitly set computed fields because insertMany skips save middleware
        days: Math.max(Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1, 1),
        year: start.getUTCFullYear(),
      };
    });

    // Clean existing Leave collection
    const del = await Leave.deleteMany({});
    console.log(`🧹 Cleared Leave collection (deleted ${del.deletedCount})`);

    // Insert new records
    const inserted = await Leave.insertMany(leaves, { ordered: true });
    console.log(`✅ Inserted ${inserted.length} leave records`);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

run();
