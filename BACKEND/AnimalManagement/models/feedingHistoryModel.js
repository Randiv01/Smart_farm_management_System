import mongoose from "mongoose";

const feedingHistorySchema = new mongoose.Schema({
  animalId: { type: mongoose.Schema.Types.ObjectId, ref: "Animal" }, // Optional for individual animal feeding
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Zone" }, // For zone-based feeding
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: "FeedStock", required: true },
  quantity: { type: Number, required: true }, // grams
  feedingTime: { type: Date, required: true },
  notes: { type: String },
  immediate: { type: Boolean, default: false },
  animalCount: { type: Number, default: 1 } // Number of animals fed in this zone
}, { timestamps: true });

const FeedingHistory = mongoose.model("FeedingHistory", feedingHistorySchema);
export default FeedingHistory;
