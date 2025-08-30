import React, { useState, useEffect } from "react";
import axios from "axios";

const DoctorForm = ({ doctorId, onSuccess, onCancel }) => {
  const [doctorData, setDoctorData] = useState({
    fullName: "",
    email: "",
    phoneNo: "",
    licenseNumber: "",
    specializations: "",
    qualifications: "",
    yearsOfExperience: "",
    dateOfBirth: "",
    gender: "Male",
    profilePhoto: null,
  });

  useEffect(() => {
    if (doctorId) {
      axios.get(`http://localhost:5000/api/doctors`)
        .then(res => {
          const doc = res.data.find(d => d._id === doctorId);
          if (doc) {
            setDoctorData({
              fullName: doc.fullName,
              email: doc.email,
              phoneNo: doc.phoneNo,
              licenseNumber: doc.licenseNumber,
              specializations: Array.isArray(doc.specializations) ? doc.specializations.join(", ") : doc.specializations,
              qualifications: doc.qualifications,
              yearsOfExperience: doc.yearsOfExperience,
              dateOfBirth: doc.dateOfBirth ? doc.dateOfBirth.split("T")[0] : "",
              gender: doc.gender,
              profilePhoto: null,
            });
          }
        });
    }
  }, [doctorId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePhoto") {
      setDoctorData({ ...doctorData, profilePhoto: files[0] });
    } else {
      setDoctorData({ ...doctorData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(doctorData).forEach(key => {
      if (key === "specializations") {
        formData.append(key, doctorData[key].split(",").map(s => s.trim()));
      } else {
        formData.append(key, doctorData[key]);
      }
    });

    try {
      if (doctorId) {
        await axios.put(`http://localhost:5000/api/doctors/${doctorId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post("http://localhost:5000/api/doctors", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="text-2xl font-bold text-green-700 mb-6 text-center">
          {doctorId ? "Edit Doctor" : "Add New Doctor"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={doctorData.fullName}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={doctorData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              type="text"
              name="phoneNo"
              placeholder="Phone No"
              value={doctorData.phoneNo}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              type="text"
              name="licenseNumber"
              placeholder="License Number"
              value={doctorData.licenseNumber}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              type="text"
              name="specializations"
              placeholder="Specializations (comma separated)"
              value={doctorData.specializations}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              type="text"
              name="qualifications"
              placeholder="Qualifications"
              value={doctorData.qualifications}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              type="number"
              name="yearsOfExperience"
              placeholder="Years of Experience"
              value={doctorData.yearsOfExperience}
              onChange={handleChange}
              required
              min="0"
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              type="date"
              name="dateOfBirth"
              value={doctorData.dateOfBirth}
              onChange={handleChange}
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <select
              name="gender"
              value={doctorData.gender}
              onChange={handleChange}
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            >
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
              <span>{doctorId ? "Update" : "Add"}</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition flex items-center space-x-2"
            >
              <i className="fas fa-times"></i>
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorForm;