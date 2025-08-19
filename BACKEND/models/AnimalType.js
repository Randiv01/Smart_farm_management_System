import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'number', 'date', 'time', 'datetime', 'select', 'checkbox', 'tel'], 
    default: 'text' 
  },
  options: { type: [String], default: [] }, // Only used if type === 'select'
  readOnly: { type: Boolean, default: false }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  fields: [fieldSchema]
});

const caretakerSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String },
  mobile: { type: String }
});

const animalTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  typeId: { type: String, required: true, unique: true },
  managementType: { 
    type: String, 
    enum: ['individual', 'batch', 'other'], 
    default: 'individual' 
  },
  bannerImage: { type: String },
  categories: [categorySchema],
  caretakers: [caretakerSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt on save
animalTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('AnimalType', animalTypeSchema);