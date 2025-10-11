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
    type: mongoose.Schema.Types.Mixed, // Allow both Number and String ("2:30" format)
    required: true,
    validate: {
      validator: function(v) {
        // Allow numbers (legacy) or strings in "H:MM" format
        return typeof v === 'number' || /^\d{1,2}:\d{2}$/.test(v);
      },
      message: 'overtimeHours must be a number or string in "H:MM" format'
    }
  },
  totalHours: {
    type: Number,
    required: true,
    min: 0
  },
  // NEW: Human-friendly OVERTIME ID
  overtimeId: {
    type: String,
    unique: true,
    index: true,
    sparse: true, // tolerate old rows until backfilled
    trim: true
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
