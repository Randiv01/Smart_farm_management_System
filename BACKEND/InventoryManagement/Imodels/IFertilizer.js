import mongoose from "mongoose";

const fertilizerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  remaining: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'lb', 'bag', 'sack', 'liter'],
    default: 'kg'
  },
  fertilizerType: {
    type: String,
    required: true,
    enum: ['Organic', 'Inorganic', 'Liquid', 'Granular', 'Powder'],
    default: 'Organic'
  },
  expiryDate: {
    type: Date,
    required: true
  },
  usageHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    quantityUsed: {
      type: Number,
      required: true
    },
    recordedBy: {
      type: String,
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
fertilizerSchema.index({ name: 1, fertilizerType: 1 });
fertilizerSchema.index({ expiryDate: 1 });

// Method to record usage
fertilizerSchema.methods.recordUsage = function(quantityUsed, recordedBy) {
  this.usageHistory.push({
    quantityUsed,
    recordedBy
  });
  this.remaining -= quantityUsed;
  
  // Ensure remaining doesn't go below 0
  if (this.remaining < 0) {
    this.remaining = 0;
  }
  
  return this.save();
};

// Method to refill stock
fertilizerSchema.methods.refillStock = function(refillQuantity) {
  this.remaining += refillQuantity;
  
  // Ensure remaining doesn't exceed total quantity
  if (this.remaining > this.quantity) {
    this.remaining = this.quantity;
  }
  
  return this.save();
};

// Static method to get monthly usage data
fertilizerSchema.statics.getMonthlyUsage = function(fertilizerId) {
  return this.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(fertilizerId) } },
    { $unwind: "$usageHistory" },
    {
      $group: {
        _id: {
          year: { $year: "$usageHistory.date" },
          month: { $month: "$usageHistory.date" }
        },
        totalUsage: { $sum: "$usageHistory.quantityUsed" }
      }
    },
    {
      $project: {
        _id: 0,
        month: {
          $dateFromParts: {
            year: "$_id.year",
            month: "$_id.month",
            day: 1
          }
        },
        usage: "$totalUsage"
      }
    },
    { $sort: { month: 1 } }
  ]);
};

const IFertilizer = mongoose.model("IFertilizer", fertilizerSchema);
export default IFertilizer;