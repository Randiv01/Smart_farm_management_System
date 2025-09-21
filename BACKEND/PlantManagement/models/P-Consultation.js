import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema({
  pestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pest',
    required: [true, 'Pest ID is required']
  },
  specialistName: {
    type: String,
    required: [true, 'Specialist name is required'],
    trim: true,
    minlength: [2, 'Specialist name must be at least 2 characters long']
  },
  dateAssigned: {
    type: Date,
    required: [true, 'Date assigned is required'],
    default: Date.now
  },
  greenhouseNo: {
    type: String,
    required: [true, 'Greenhouse number is required'],
    trim: true
  },
  treatedIssue: {
    type: String,
    required: [true, 'Treated issue description is required'],
    trim: true,
    minlength: [10, 'Treated issue description must be at least 10 characters long']
  },
  specialistNotes: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['Assigned', 'In Progress', 'Resolved'],
      message: 'Status must be one of: Assigned, In Progress, Resolved'
    },
    default: 'Assigned'
  },
  treatmentStartDate: {
    type: Date,
    default: null
  },
  treatmentEndDate: {
    type: Date,
    default: null
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date,
    default: null,
    validate: {
      validator: function(value) {
        if (this.followUpRequired && !value) {
          return false;
        }
        return true;
      },
      message: 'Follow-up date is required when follow-up is marked as required'
    }
  },
  cost: {
    type: Number,
    default: 0,
    min: [0, 'Cost cannot be negative']
  },
  createdBy: {
    type: String,
    default: 'System'
  }
}, {
  timestamps: true,
  collection: 'consultations' // Explicitly set collection name
});

// Add indexes for better performance
consultationSchema.index({ pestId: 1 });
consultationSchema.index({ specialistName: 1 });
consultationSchema.index({ status: 1 });
consultationSchema.index({ dateAssigned: -1 });
consultationSchema.index({ greenhouseNo: 1 });

// Pre-save middleware for validation
consultationSchema.pre('save', function(next) {
  // Validate treatment dates
  if (this.treatmentStartDate && this.treatmentEndDate) {
    if (this.treatmentStartDate > this.treatmentEndDate) {
      return next(new Error('Treatment start date cannot be after end date'));
    }
  }
  
  // Auto-set treatment end date if status is resolved
  if (this.status === 'Resolved' && !this.treatmentEndDate) {
    this.treatmentEndDate = new Date();
  }
  
  next();
});

// Create the model
const Consultation = mongoose.model('Consultation', consultationSchema);

export default Consultation;