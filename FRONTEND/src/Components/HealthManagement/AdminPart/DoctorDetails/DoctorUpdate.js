import React, { useEffect, useState } from "react";
import axios from "axios";

function DoctorUpdate({ doctor, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNo: "",
    medicalLicenseNumber: "",
    address: "",
    specializations: "",
    qualifications: "",
    yearsOfExperience: "",
    dateOfBirth: "",
    gender: "",
    profilePhoto: null
  });

  useEffect(() => {
    if (doctor) {
      setFormData({
        fullName: doctor.fullName,
        email: doctor.email,
        phoneNo: doctor.phoneNo,
        medicalLicenseNumber: doctor.medicalLicenseNumber,
        address: doctor.address,
        specializations: Array.isArray(doctor.specializations) ? doctor.specializations.join(", ") : doctor.specializations,
        qualifications: doctor.qualifications,
        yearsOfExperience: doctor.yearsOfExperience,
        dateOfBirth: doctor.dateOfBirth ? doctor.dateOfBirth.split("T")[0] : "",
        gender: doctor.gender,
        profilePhoto: null
      });
    }
  }, [doctor]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePhoto") {
      setFormData({ ...formData, profilePhoto: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "specializations") {
          data.append(key, JSON.stringify(formData.specializations.split(",").map(s => s.trim())));
        } else {
          data.append(key, formData[key]);
        }
      });

      await axios.put(`http://localhost:5000/api/doctors/${doctor._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Doctor updated successfully!");
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Error updating doctor:", err);
      alert("Failed to update doctor");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">Update Doctor Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              type="email"
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              name="phoneNo"
              value={formData.phoneNo}
              onChange={handleChange}
              placeholder="Phone"
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              name="medicalLicenseNumber"
              value={formData.medicalLicenseNumber}
              onChange={handleChange}
              placeholder="License Number"
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              name="specializations"
              value={formData.specializations}
              onChange={handleChange}
              placeholder="Specializations (comma separated)"
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              name="qualifications"
              value={formData.qualifications}
              onChange={handleChange}
              placeholder="Qualifications"
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleChange}
              placeholder="Years of Experience"
              type="number"
              min="0"
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              placeholder="Date of Birth"
              type="date"
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <input
              type="file"
              name="profilePhoto"
              onChange={handleChange}
              accept="image/*"
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
            >
              <i className="fas fa-save"></i>
              <span>Update Doctor</span>
            </button>
            <button
              type="button"
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition flex items-center space-x-2"
              onClick={onClose}
            >
              <i className="fas fa-times"></i>
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DoctorUpdate;