import mongoose from "mongoose";

const FertilizingSchema = new mongoose.Schema(
  {
    greenhouseNo: { type: String, required: true },
    date: { type: Date, required: true },
    fertilizerType: { type: String, required: true },
    quantity: { type: Number, required: true },
    staff: { type: String, required: true },
    status: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("fertilizing", FertilizingSchema);
