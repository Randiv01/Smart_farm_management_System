import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: function() {
      return this.isNew;
    },
    trim: true,
    maxLength: 50,
    default: 'User' // Add default value
  },
  lastName: { 
    type: String, 
    required: function() {
      return this.isNew;
    },
    trim: true,
    maxLength: 50,
    default: 'Unknown' // Add default value
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: true,
    minLength: 8
  },
  phone: { 
    type: String, 
    default: null,
     match: [/^0[0-9]{9}$/, 'Phone number must start with 0 and be 10 digits']
  },
  address: {
    type: String,
    trim: true,
    maxLength: 200,
    default: ""
  },
  city: {
    type: String,
    trim: true,
    maxLength: 50,
    default: ""
  },
  country: {
    type: String,
    trim: true,
    maxLength: 50,
    default: ""
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value < new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  bio: {
    type: String,
    trim: true,
    maxLength: 500,
    default: ""
  },
  profileImage: { 
    type: String, 
    default: null 
  },
  role: { 
    type: String, 
    enum: ["animal", "plant", "inv", "emp", "health", "owner", "normal", "admin"], 
    default: "normal" 
  },
  specialization: {
    type: String,
    trim: true,
    maxLength: 100,
    default: ""
  },
  experience: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  education: {
    type: String,
    trim: true,
    maxLength: 200,
    default: ""
  },
  isAdmin: { 
    type: Boolean, 
    default: false 
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Fix pre-save middleware to handle existing users properly
userSchema.pre('save', function(next) {
  // Only validate for new documents
  if (this.isNew) {
    if (!this.firstName || !this.lastName) {
      return next(new Error('First name and last name are required for new users'));
    }
  }
  
  next();
});

// Index for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to check if password matches
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model("User", userSchema);