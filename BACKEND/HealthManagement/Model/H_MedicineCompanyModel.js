// BACKEND/HealthManagement/Model/H_MedicineCompanyModel.js
import mongoose from "mongoose";

const medicineCompanySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    address: { type: String },
    contactNo: { type: String },
    emergencyContacts: [{ type: String }], // array of strings
    email: { type: String },
    website: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("H_MedicineCompany", medicineCompanySchema);
