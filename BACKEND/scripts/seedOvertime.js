import mongoose from "mongoose";
import dotenv from "dotenv";
import Employee from "../EmployeeManager/E-model/Employee.js";
import Overtime from "../EmployeeManager/E-model/Overtime.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority";

function toHours(val) {
  if (typeof val === "number") return val;
  if (typeof val === "string" && /^\d{1,2}:\d{2}$/.test(val)) {
    const [h, m] = val.split(":").map(Number);
    return h + m / 60;
  }
  return 0;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const staff = await Employee.find({}, { _id: 1, id: 1, name: 1 }).sort({ id: 1 }).limit(10).lean();
    if (!staff.length) throw new Error("No employees found. Seed employees first.");

    // Clean collection first
    const del = await Overtime.deleteMany({});
    console.log(`🧹 Cleared Overtime collection (deleted ${del.deletedCount})`);

    const base = new Date("2025-10-01T00:00:00.000Z");
    const otVariants = [1, 1.5, 2, "2:30", 0.5];

    const docs = staff.map((emp, i) => {
      const date = addDays(base, i * 2);
      const regularHours = 8;
      const overtimeHours = otVariants[i % otVariants.length];
      const totalHours = regularHours + toHours(overtimeHours);
      return {
        employee: emp._id, // link to Employee by ObjectId; UI can populate name/id
        date,
        regularHours,
        overtimeHours,
        totalHours,
        status: ["Pending", "Approved", "Rejected"][i % 3],
        description: `Overtime for ${emp.id} - ${emp.name}`,
      };
    });

    const inserted = await Overtime.insertMany(docs, { ordered: true });
    console.log(`✅ Inserted ${inserted.length} overtime records`);
  } catch (err) {
    console.error("❌ Overtime seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

run();
