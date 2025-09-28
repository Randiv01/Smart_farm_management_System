import mongoose from "mongoose";

const feedingHistorySchema = new mongoose.Schema({
  animalId: { type: mongoose.Schema.Types.ObjectId, ref: "Animal" }, // Optional for individual animal feeding
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Zone" }, // For zone-based feeding
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: "AnimalFood", required: true },
  quantity: { type: Number, required: true }, // grams
  feedingTime: { type: Date, required: true },
  notes: { type: String },
  immediate: { type: Boolean, default: false },
  animalCount: { type: Number, default: 1 }, // Number of animals fed in this zone
  status: { 
    type: String, 
    enum: ["scheduled", "completed", "failed", "cancelled", "retrying"], 
    default: "scheduled" 
  },
  executedAt: { type: Date }, // When the feeding was actually executed
  failureReason: { type: String }, // Reason for failure if status is "failed"
  esp32Response: { type: String }, // Response from ESP32 device
  attemptCount: { type: Number, default: 0 }, // Number of execution attempts
  lastAttemptAt: { type: Date }, // When the last attempt was made
  errorDetails: { type: String }, // Detailed error information
  stockReduced: { type: Boolean, default: false }, // Whether stock was actually reduced
  deviceStatus: { type: String }, // ESP32 device status at time of feeding
  networkStatus: { type: String }, // Network connectivity status
  retryCount: { type: Number, default: 0 }, // Number of retry attempts
  maxRetries: { type: Number, default: 3 } // Maximum retry attempts allowed
}, { timestamps: true });

const FeedingHistory = mongoose.model("FeedingHistory", feedingHistorySchema);
export default FeedingHistory;
