// models/MeatProductivity.js
import mongoose from "mongoose";

const MeatProductivitySchema = new mongoose.Schema({
  batchId: {
    type: String,
    unique: true,
    required: [true, "Batch ID is required"],
  },
  batchName: {
    type: String,
    required: [true, "Batch name is required"],
    trim: true,
  },
  animalType: {
    type: String,
    required: [true, "Animal type is required"],
    trim: true,
  },
  meatType: {
    type: String,
    required: [true, "Meat type is required"],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0.01, "Quantity must be greater than 0"],
  },
  unit: {
    type: String,
    default: "kg",
    enum: ["kg", "lbs"],
    trim: true,
  },
  productionDate: {
    type: Date,
    required: [true, "Production date is required"],
  },
  expiryDate: {
    type: Date,
    required: [true, "Expiry date is required"],
    validate: {
      validator: function (value) {
        return this.productionDate < value;
      },
      message: "Expiry date must be after production date",
    },
  },
  status: {
    type: String,
    enum: {
      values: ["Fresh", "Stored", "Processed", "Sold", "Expired"],
      message: "{VALUE} is not a valid status",
    },
    default: "Fresh",
    required: [true, "Status is required"],
  },
  healthCondition: {
    type: String,
    enum: {
      values: ["Good", "Moderate", "Critical"],
      message: "{VALUE} is not a valid health condition",
    },
    default: "Good",
    required: [true, "Health condition is required"],
  },
  notes: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  slaughterDate: {
    type: Date,
  },
  totalMeatProduced: {
    type: Number,
    min: [0.01, "Total meat produced must be greater than 0"],
  },
  storageLocation: {
    type: String,
    trim: true,
  },
  harvestNotes: {
    type: String,
    trim: true,
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate batchId before saving
MeatProductivitySchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.batchId = `MOFM-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// Auto-update status to Expired if expiryDate is past
MeatProductivitySchema.pre("save", function (next) {
  if (new Date(this.expiryDate) < new Date() && this.status !== "Sold") {
    this.status = "Expired";
  }
  next();
});

// Virtual for days active
MeatProductivitySchema.virtual('daysActive').get(function() {
  return Math.floor((new Date() - new Date(this.productionDate)) / (24 * 60 * 60 * 1000));
});

// Virtual for days until expiry
MeatProductivitySchema.virtual('daysUntilExpiry').get(function() {
  return Math.ceil((new Date(this.expiryDate) - new Date()) / (24 * 60 * 60 * 1000));
});

// Virtual for isExpired
MeatProductivitySchema.virtual('isExpired').get(function() {
  return new Date(this.expiryDate) < new Date() && this.status !== "Sold";
});

// Virtual for isNearExpiry
MeatProductivitySchema.virtual('isNearExpiry').get(function() {
  const daysUntilExpiry = Math.ceil((new Date(this.expiryDate) - new Date()) / (24 * 60 * 60 * 1000));
  return daysUntilExpiry > 0 && daysUntilExpiry <= 3 && this.status !== "Sold" && this.status !== "Expired";
});

export default mongoose.model("MeatProductivity", MeatProductivitySchema);