import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  label: { type: String, required: true }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  fields: [fieldSchema]
});

const animalTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  bannerImage: { type: String },
  categories: [categorySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
animalTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('AnimalType', animalTypeSchema);