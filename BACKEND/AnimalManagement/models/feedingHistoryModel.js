import mongoose from "mongoose";

const feedingHistorySchema = new mongoose.Schema({
  animalId: { type: mongoose.Schema.Types.ObjectId, ref: "Animal", required: true },
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: "FeedStock", required: true },
  quantity: { type: Number, required: true }, // grams
  feedingTime: { type: Date, required: true },
  notes: { type: String }
}, { timestamps: true });

const FeedingHistory = mongoose.model("FeedingHistory", feedingHistorySchema);
export default FeedingHistory;
