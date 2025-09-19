import mongoose from "mongoose";

const overtimeSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  regularHours: {
    type: Number,
    required: true,
    min: 0
  },
  overtimeHours: {
    type: Number,
    required: true,
    min: 0
  },
  totalHours: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
overtimeSchema.index({ employee: 1, date: 1 });
overtimeSchema.index({ status: 1, date: 1 });

export default mongoose.model("Overtime", overtimeSchema);