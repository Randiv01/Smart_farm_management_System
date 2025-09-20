// BACKEND/EmployeeManager/E-model/Employee.js
import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  contact: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, default: "Full-time" },
  joined: { type: String, required: true },
  photo: { type: String }, // file path
  cv: { type: String },    // file path
});

const Employee = mongoose.model("Employee", EmployeeSchema);
export default Employee; // ✅ ESM default export
