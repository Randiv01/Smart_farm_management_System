import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  specialization: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;