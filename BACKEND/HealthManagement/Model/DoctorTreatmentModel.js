import mongoose from "mongoose";

const doctorTreatmentSchema = new mongoose.Schema(
  {
    animalType: {
      type: String,
      required: [true, "Animal type is required"],
      trim: true,
    },
    animalCode: {
      type: String,
      required: [true, "Animal code is required"],
      trim: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorDetails",
      required: [true, "Doctor is required"],
    },
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HealthSpecialist",
      default: null,
    },
    reports: {
      filename: {
        type: String,
        default: null,
      },
      originalName: {
        type: String,
        default: null,
      },
      mimetype: {
        type: String,
        default: null,
      },
      size: {
        type: Number,
        default: null,
      },
      path: {
        type: String,
        default: null,
      },
    },
    medicines: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediStore",
      },
    ],
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    treatmentDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
doctorTreatmentSchema.index({ animalCode: 1 });
doctorTreatmentSchema.index({ doctor: 1 });
doctorTreatmentSchema.index({ treatmentDate: -1 });
doctorTreatmentSchema.index({ status: 1 });

// Virtual for formatted treatment date
doctorTreatmentSchema.virtual("formattedTreatmentDate").get(function () {
  return this.treatmentDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Virtual for reports URL
doctorTreatmentSchema.virtual("reportsUrl").get(function () {
  if (this.reports && this.reports.filename) {
    return `/Health_uploads/${this.reports.filename}`;
  }
  return null;
});

// Ensure virtuals are included in JSON output
doctorTreatmentSchema.set("toJSON", { virtuals: true });
doctorTreatmentSchema.set("toObject", { virtuals: true });

// Pre-save middleware
doctorTreatmentSchema.pre("save", function (next) {
  // Convert animalCode to uppercase for consistency
  if (this.animalCode) {
    this.animalCode = this.animalCode.toUpperCase();
  }
  next();
});

// Static methods
doctorTreatmentSchema.statics.findByAnimalCode = function (animalCode) {
  return this.find({ animalCode: animalCode.toUpperCase() })
    .populate("doctor", "fullName email")
    .populate("specialist", "fullName specialization")
    .populate("medicines", "medicine_name quantity_available")
    .sort({ treatmentDate: -1 });
};

doctorTreatmentSchema.statics.findByDoctor = function (doctorId) {
  return this.find({ doctor: doctorId })
    .populate("doctor", "fullName email")
    .populate("specialist", "fullName specialization")
    .populate("medicines", "medicine_name quantity_available")
    .sort({ treatmentDate: -1 });
};

// Instance methods
doctorTreatmentSchema.methods.addMedicine = function (medicineId) {
  if (!this.medicines.includes(medicineId)) {
    this.medicines.push(medicineId);
  }
  return this.save();
};

doctorTreatmentSchema.methods.removeMedicine = function (medicineId) {
  this.medicines = this.medicines.filter(
    (med) => med.toString() !== medicineId.toString()
  );
  return this.save();
};

const DoctorTreatment = mongoose.model("DoctorTreatment", doctorTreatmentSchema);

export default DoctorTreatment;