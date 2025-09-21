// Backend: E-model/Attendance.js (Mongoose Model)
import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  employeeId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  checkIn: { type: String, default: "-" },
  checkOut: { type: String, default: "-" },
  status: { type: String, enum: ["Present", "Absent", "On Leave", "Late"], required: true }
}, {
  timestamps: true
});

// Unique per (employeeId, date)
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Virtual formatted date
attendanceSchema.virtual("formattedDate").get(function () {
  return this.date.toISOString().split("T")[0];
});
attendanceSchema.set("toJSON", { virtuals: true });

// Normalize date to start of day (save)
attendanceSchema.pre("save", function (next) {
  if (this.date) this.date.setHours(0, 0, 0, 0);
  next();
});

// Normalize date on updates
attendanceSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();
  if (update?.date) {
    const d = new Date(update.date);
    d.setHours(0, 0, 0, 0);
    this.setUpdate({ ...update, date: d });
  }
  next();
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
