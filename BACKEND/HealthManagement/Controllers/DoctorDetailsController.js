import DoctorDetails from "../Model/DoctorDetailsModel.js";
import bcrypt from "bcrypt";

function parseSpecializations(input) {
  if (Array.isArray(input)) return input;
  if (typeof input === "string") {
    const txt = input.trim();
    if (!txt) return [];
    try {
      const parsed = JSON.parse(txt);
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch (_) {}
    return txt.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

// Create Doctor
export const createDoctor = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "No form data received." });
    }

    const {
      fullName = "",
      email = "",
      phoneNo = "",
      licenseNumber = "",
      specializations = "[]",
      qualifications = "",
      yearsOfExperience = 0,
      dateOfBirth = null,
      gender = "Male",
      password = "",
    } = req.body;

    const specializationsArr = parseSpecializations(specializations);
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
    const profilePhotoFilename = req.file ? req.file.filename : null;

    const newDoctor = new DoctorDetails({
      fullName,
      email,
      phoneNo,
      licenseNumber,
      specializations: specializationsArr,
      qualifications,
      yearsOfExperience: Number(yearsOfExperience) || 0,
      dateOfBirth: dateOfBirth || null,
      gender,
      profilePhoto: profilePhotoFilename,
      password: hashedPassword,
    });

    await newDoctor.save();
    res.status(201).json({ message: "Doctor created successfully", doctor: newDoctor });
  } catch (error) {
    res.status(500).json({ message: "Error creating doctor", error: error.message });
  }
};

// Get All Doctors
export const getDoctors = async (req, res) => {
  try {
    const doctors = await DoctorDetails.find().sort({ createdAt: -1 });
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctors", error: error.message });
  }
};

// Get Doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await DoctorDetails.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctor", error: error.message });
  }
};

// Update Doctor
export const updateDoctor = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "No form data received." });
    }

    const {
      fullName,
      email,
      phoneNo,
      licenseNumber,
      specializations,
      qualifications,
      yearsOfExperience,
      dateOfBirth,
      gender,
      password,
    } = req.body;

    const doctor = await DoctorDetails.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    if (fullName !== undefined) doctor.fullName = fullName;
    if (email !== undefined) doctor.email = email;
    if (phoneNo !== undefined) doctor.phoneNo = phoneNo;
    if (licenseNumber !== undefined) doctor.licenseNumber = licenseNumber;
    if (specializations !== undefined) doctor.specializations = parseSpecializations(specializations);
    if (qualifications !== undefined) doctor.qualifications = qualifications;
    if (yearsOfExperience !== undefined) doctor.yearsOfExperience = Number(yearsOfExperience) || 0;
    if (dateOfBirth !== undefined) doctor.dateOfBirth = dateOfBirth || null;
    if (gender !== undefined) doctor.gender = gender;
    if (password) doctor.password = await bcrypt.hash(password, 10);
    if (req.file) doctor.profilePhoto = req.file.filename;

    await doctor.save();
    res.status(200).json({ message: "Doctor updated successfully", doctor });
  } catch (error) {
    res.status(500).json({ message: "Error updating doctor", error: error.message });
  }
};

// Delete Doctor
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await DoctorDetails.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.status(200).json({ message: "Doctor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting doctor", error: error.message });
  }
};