// E-model/Leave.js
import mongoose from "mongoose";

const LeaveSchema = new mongoose.Schema(
  {
    number: { type: Number, index: true }, 
    empId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["Annual", "Sick", "Casual", "Other"],
      required: true,
      index: true,
    },
    from: { type: Date, required: true, index: true },
    to: { type: Date, required: true, index: true },
    days: { type: Number, min: 1 },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    year: { type: Number, index: true }, 
  },
  { timestamps: true }
);

const CounterSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", CounterSchema);

LeaveSchema.pre("save", async function (next) {
  try {
    if (!this.number) {
      const c = await Counter.findOneAndUpdate(
        { key: "leaveNumber" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.number = c.seq;
    }
    if (!this.year && this.from) this.year = new Date(this.from).getFullYear();
    if (!this.days && this.from && this.to) {
      const a = new Date(this.from);
      const b = new Date(this.to);
      const diff = Math.ceil((b - a) / (1000 * 60 * 60 * 24)) + 1;
      this.days = Math.max(diff, 1);
    }
    next();
  } catch (e) {
    next(e);
  }
});

const Leave = mongoose.model("Leave", LeaveSchema);

export default Leave; // ✅ ES Module default export
