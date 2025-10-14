import mongoose from "mongoose";
import dotenv from "dotenv";
import Leave from "../EmployeeManager/E-model/Leave.js";

// Recreate Counter model locally (same as in Leave.js)
import mongoosePkg from "mongoose";
const CounterSchema = new mongoosePkg.Schema({
  key: { type: String, unique: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoosePkg.model("Counter", CounterSchema);

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority";

function computeDays(a, b) {
  const start = new Date(a);
  const end = new Date(b);
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diff, 1);
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find current max number
    const maxRow = await Leave.find({ number: { $ne: null } })
      .sort({ number: -1 })
      .limit(1)
      .lean();
    let seq = maxRow.length ? maxRow[0].number : 0;
    console.log(`Current max leave number: ${seq}`);

    // Fill missing computed fields and assign numbers for docs without number
    const needs = await Leave.find({ $or: [ { number: { $exists: false } }, { number: null } ] })
      .sort({ createdAt: 1, from: 1 })
      .lean();

    let updated = 0;
    for (const doc of needs) {
      seq += 1;
      const update = { number: seq };
      if (!doc.year && doc.from) update.year = new Date(doc.from).getFullYear();
      if ((!doc.days || doc.days <= 0) && doc.from && doc.to) update.days = computeDays(doc.from, doc.to);
      await Leave.updateOne({ _id: doc._id }, { $set: update });
      updated += 1;
    }
    console.log(`Backfilled ${updated} leaves with numbers and computed fields`);

    // Sync Counter to max sequence so future saves continue correctly
    const counter = await Counter.findOneAndUpdate(
      { key: "leaveNumber" },
      { $set: { seq } },
      { new: true, upsert: true }
    );
    console.log(`Counter synced to seq=${counter.seq}`);
  } catch (err) {
    console.error("❌ Backfill failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

run();
