// BACKEND/HealthManagement/Controllers/DoctorDetailsController.js
import DoctorDetails from "../Model/DoctorDetailsModel.js";
import bcrypt from "bcrypt";

// Create Doctor
export const createDoctor = async (req, res) => {
  try {
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

    let profilePhotoPath = req.file ? req.file.path : null;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const newDoctor = new DoctorDetails({
      fullName,
      email,
      phoneNo,
      licenseNumber,
      specializations,
      qualifications,
      yearsOfExperience,
      dateOfBirth,
      gender,
      profilePhoto: profilePhotoPath,
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
    const doctors = await DoctorDetails.find();
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

    doctor.fullName = fullName || doctor.fullName;
    doctor.email = email || doctor.email;
    doctor.phoneNo = phoneNo || doctor.phoneNo;
    doctor.licenseNumber = licenseNumber || doctor.licenseNumber;
    doctor.specializations = specializations || doctor.specializations;
    doctor.qualifications = qualifications || doctor.qualifications;
    doctor.yearsOfExperience = yearsOfExperience || doctor.yearsOfExperience;
    doctor.dateOfBirth = dateOfBirth || doctor.dateOfBirth;
    doctor.gender = gender || doctor.gender;
    if (password) doctor.password = await bcrypt.hash(password, 10);
    if (req.file) doctor.profilePhoto = req.file.path;

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
