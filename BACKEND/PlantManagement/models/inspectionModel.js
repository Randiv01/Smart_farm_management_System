import mongoose from "mongoose";

const inspectionSchema = new mongoose.Schema(
  {
    tunnel: { type: String, required: true },       // Greenhouse ID
    date: { type: Date, required: true },
    inspector: { type: String, required: true },   // Inspector name
    status: { type: String, enum: ["cleared", "issue"], default: "cleared" },
    notes: { type: String, default: "" },
    reportPath: { type: String, default: "" },      // optional PDF
  },
  { timestamps: true }
);

const Inspection = mongoose.model("inspection", inspectionSchema);
export default Inspection;
