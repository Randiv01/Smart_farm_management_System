import mongoose from 'mongoose';

const pestSchema = new mongoose.Schema({
  greenhouseNo: {
    type: String,
    required: [true, 'Greenhouse number is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  issueType: {
    type: String,
    required: [true, 'Issue type is required'],
    enum: {
      values: ['Fungus', 'Insect', 'Virus', 'Other'],
      message: 'Issue type must be one of: Fungus, Insect, Virus, Other'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long']
  },
  image: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Resolved', 'Under Treatment'],
      message: 'Status must be one of: Active, Resolved, Under Treatment'
    },
    default: 'Active'
  },
  severity: {
    type: String,
    enum: {
      values: ['Low', 'Medium', 'High', 'Critical'],
      message: 'Severity must be one of: Low, Medium, High, Critical'
    },
    default: 'Medium'
  },
  createdBy: {
    type: String,
    default: 'System'
  }
}, {
  timestamps: true,
  collection: 'pests' // Explicitly set collection name
});

// Add indexes for better performance
pestSchema.index({ greenhouseNo: 1, date: -1 });
pestSchema.index({ issueType: 1 });
pestSchema.index({ status: 1 });
pestSchema.index({ severity: 1 });

// Add a pre-save middleware to validate data
pestSchema.pre('save', function(next) {
  // Ensure date is not in the future
  if (this.date > new Date()) {
    const error = new Error('Date cannot be in the future');
    return next(error);
  }
  next();
});

// Create the model
const Pest = mongoose.model('Pest', pestSchema);

export default Pest;