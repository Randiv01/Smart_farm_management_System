import mongoose from "mongoose";

const animalTreatmentSchema = new mongoose.Schema(
  {
    animalType: {
      type: String,
      required: [true, "Animal type is required"],
      trim: true
    },
    animalCode: {
      type: String,
      required: [true, "Animal code is required"],
      trim: true,
      unique: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorDetails",
      required: [true, "Veterinary surgeon is required"]
    },
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HealthSpecialist",
      default: null
    },
    reports: {
      type: String,
      default: null
    },
    medicines: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "H_MediStore"
    }],
    notes: {
      type: String,
      default: "",
      maxlength: [1000, "Notes cannot exceed 1000 characters"]
    },
    status: {
      type: String,
      enum: {
        values: ["diagnosed", "active", "recovering", "completed", "cancelled"],
        message: "Status must be one of: diagnosed, active, recovering, completed, cancelled"
      },
      default: "active"
    },
    treatmentDate: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for better query performance
animalTreatmentSchema.index({ animalCode: 1 });
animalTreatmentSchema.index({ treatmentDate: -1 });
animalTreatmentSchema.index({ status: 1 });

// Virtual for formatted treatment date
animalTreatmentSchema.virtual('formattedTreatmentDate').get(function() {
  return this.treatmentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Pre-save middleware to validate medicines
animalTreatmentSchema.pre('save', function(next) {
  if (this.medicines && this.medicines.length > 0) {
    // Remove duplicate medicines
    this.medicines = [...new Set(this.medicines.map(med => med.toString()))];
  }
  next();
});

export default mongoose.model("AnimalTreatment", animalTreatmentSchema);