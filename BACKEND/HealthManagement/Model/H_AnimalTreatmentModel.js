// H_AnimalTreatmentModel.js
import mongoose from 'mongoose';

const animalTreatmentSchema = new mongoose.Schema({
  animalType: {
    type: String,
    required: [true, 'Animal type is required'],
    trim: true
  },
  animalCode: {
    type: String,
    required: [true, 'Animal code is required'],
    unique: true,
    trim: true,
    index: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorDetails', // ✅ Fixed: Changed from 'Doctor' to 'DoctorDetails'
    required: [true, 'Doctor is required']
  },
  specialist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthSpecialist'
  },
  reports: {
    type: String,
    trim: true
  },
  medicines: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'H_MediStore'
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['diagnosed', 'active', 'recovering', 'completed', 'cancelled'],
      message: 'Status must be one of: diagnosed, active, recovering, completed, cancelled'
    },
    default: 'active'
  },
  treatmentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
animalTreatmentSchema.index({ animalCode: 1 });
animalTreatmentSchema.index({ status: 1 });
animalTreatmentSchema.index({ treatmentDate: -1 });
animalTreatmentSchema.index({ doctor: 1 });

// Pre-save middleware to ensure treatmentDate is set
animalTreatmentSchema.pre('save', function(next) {
  if (!this.treatmentDate) {
    this.treatmentDate = new Date();
  }
  next();
});

export default mongoose.model('AnimalTreatment', animalTreatmentSchema);