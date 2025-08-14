import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema({
  name: String,
  label: String,
  type: String
});

const animalTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bannerImage: { type: String, required: true },
  fields: [fieldSchema],
  total: { type: Number, default: 0 }
});

export default mongoose.model("AnimalType", animalTypeSchema);
