import mongoose from "mongoose";

const feedStockSchema = new mongoose.Schema({
  foodName: { type: String, required: true },   // no unique to allow duplicates
  quantity: { type: Number, required: true },
  remaining: { type: Number, default: 0 },      // for refill
  unit: { type: String, default: "kg" },
  targetAnimal: { type: String },
  notes: { type: String },
  addDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  supId: { type: String }                        // supplier id
}, { timestamps: true });

const FeedStock = mongoose.model("FeedStock", feedStockSchema);
export default FeedStock;
