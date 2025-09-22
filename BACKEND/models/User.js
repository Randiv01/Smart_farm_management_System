// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: true,
    trim: true,
    maxLength: 50
  },
  lastName: { 
    type: String, 
    required: true,
    trim: true,
    maxLength: 50
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
    default: null
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
    default: "normal" // default for customers
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
  },
  // ---------------- Customer specific fields ----------------
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  membershipLevel: {
    type: String,
    enum: ["bronze", "silver", "gold", "platinum"],
    default: "bronze"
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
  orderHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  }],
  notifications: [{
    type: String
  }],
  lastPurchaseDate: {
    type: Date,
    default: null
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

// Method to add loyalty points
userSchema.methods.addLoyaltyPoints = function(points) {
  this.loyaltyPoints += points;
  if (this.loyaltyPoints >= 1000) this.membershipLevel = "gold";
  else if (this.loyaltyPoints >= 500) this.membershipLevel = "silver";
  else this.membershipLevel = "bronze";
  return this.save();
};

// Method to add notification
userSchema.methods.addNotification = function(message) {
  this.notifications.push(message);
  return this.save();
};

// Method to add order to history
userSchema.methods.addOrder = function(orderId) {
  this.orderHistory.push(orderId);
  this.lastPurchaseDate = new Date();
  return this.save();
};

export default mongoose.model("User", userSchema);