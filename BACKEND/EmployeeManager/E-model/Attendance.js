// Backend: Attendance.js (Mongoose Model)
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

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

attendanceSchema.set('toJSON', { virtuals: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;