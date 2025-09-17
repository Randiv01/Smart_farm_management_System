import mongoose from "mongoose";

const animalFoodSchema = new mongoose.Schema({
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
    enum: ['kg', 'g', 'lb', 'bag', 'sack'],
    default: 'kg'
  },
  targetAnimal: {
    type: String,
    required: true,
    enum: ['All Animals', 'Cow', 'Chickens', 'Goats', 'Pigs', 'Buffaloes'],
    default: 'All Animals'
  },
  expiryDate: {
    type: Date,
    required: true
  },
  consumptionHistory: [{
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
animalFoodSchema.index({ name: 1, targetAnimal: 1 });
animalFoodSchema.index({ expiryDate: 1 });

// Method to record consumption
animalFoodSchema.methods.recordConsumption = function(quantityUsed, recordedBy) {
  this.consumptionHistory.push({
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
animalFoodSchema.methods.refillStock = function(refillQuantity) {
  this.remaining += refillQuantity;
  
  // Ensure remaining doesn't exceed total quantity
  if (this.remaining > this.quantity) {
    this.remaining = this.quantity;
  }
  
  return this.save();
};

// Static method to get monthly consumption data
animalFoodSchema.statics.getMonthlyConsumption = function(foodId) {
  return this.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(foodId) } },
    { $unwind: "$consumptionHistory" },
    {
      $group: {
        _id: {
          year: { $year: "$consumptionHistory.date" },
          month: { $month: "$consumptionHistory.date" }
        },
        totalConsumption: { $sum: "$consumptionHistory.quantityUsed" }
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
        consumption: "$totalConsumption"
      }
    },
    { $sort: { month: 1 } }
  ]);
};

const AnimalFood = mongoose.model("AnimalFood", animalFoodSchema);
export default AnimalFood;