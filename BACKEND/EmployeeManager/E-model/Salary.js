import mongoose from "mongoose";

const salarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    trim: true
  },
  employeeName: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  // Payroll period
  payrollPeriod: {
    year: {
      type: Number,
      required: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    }
  },
  // Salary components
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  overtimePay: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeHours: {
    type: String, // Store as "2:30" format
    default: "0:00"
  },
  allowances: {
    type: Number,
    default: 0,
    min: 0
  },
  deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSalary: {
    type: Number,
    required: true,
    min: 0
  },
  // Payment status
  status: {
    type: String,
    enum: ["Pending", "Processing", "Paid", "Failed", "Cancelled"],
    default: "Pending"
  },
  // Payment details
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ["Bank Transfer", "Cash", "Check"],
    default: "Bank Transfer"
  },
  // Advanced features
  department: {
    type: String,
    trim: true
  },
  performanceBonus: {
    type: Number,
    default: 0,
    min: 0
  },
  commission: {
    type: Number,
    default: 0,
    min: 0
  },
  taxDeduction: {
    type: Number,
    default: 0,
    min: 0
  },
  insuranceDeduction: {
    type: Number,
    default: 0,
    min: 0
  },
  netSalary: {
    type: Number,
    required: true,
    min: 0
  },
  // Audit fields
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  approvedAt: {
    type: Date
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
salarySchema.index({ employee: 1, "payrollPeriod.year": 1, "payrollPeriod.month": 1 });
salarySchema.index({ status: 1, "payrollPeriod.year": 1, "payrollPeriod.month": 1 });
salarySchema.index({ department: 1, "payrollPeriod.year": 1, "payrollPeriod.month": 1 });

// Virtual for formatted payroll period
salarySchema.virtual('formattedPeriod').get(function() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[this.payrollPeriod.month - 1]} ${this.payrollPeriod.year}`;
});

// Pre-save middleware to calculate totals
salarySchema.pre('save', function(next) {
  // Calculate total salary
  this.totalSalary = this.basicSalary + this.overtimePay + this.allowances + this.performanceBonus + this.commission;
  
  // Calculate net salary (after deductions)
  this.netSalary = this.totalSalary - this.deductions - this.taxDeduction - this.insuranceDeduction;
  
  next();
});

export default mongoose.model("Salary", salarySchema);

