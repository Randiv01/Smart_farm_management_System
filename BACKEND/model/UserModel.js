const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true, 
  },
  email: {
    type: String,
    required: true,
    unique: true, // ensure email uniqueness
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  mobile: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/, // 10-digit mobile number validation
  },
  address: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  }
});

module.exports = mongoose.model("UserModel", userSchema); //filename,function name
