import mongoose from "mongoose";

const H_PlantTreatmentSchema = new mongoose.Schema({
  plantType: { type: String, required: true },
  plantCode: { type: String, required: true },
  pathologist: { type: mongoose.Schema.Types.ObjectId, ref: "PlantPathologist", required: true },
  fertiliser: { type: mongoose.Schema.Types.ObjectId, ref: "Fertiliser" },
  pestControl: { type: String },
  treatmentDate: { type: Date, required: true },
  notes: { type: String },
  reports: { type: String }, // stored path like "/uploads/1234-abc.pdf"
  status: {
    type: String,
    enum: ["scheduled", "in-progress", "completed"],
    default: "scheduled",
  },
  effectiveness: { type: Number, default: 0 },
}, { timestamps: true });

const H_PlantTreatment = mongoose.model("H_PlantTreatment", H_PlantTreatmentSchema);
export default H_PlantTreatment;