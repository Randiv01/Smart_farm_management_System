import React, { useState, useEffect } from "react";
import axios from "axios";

const H_SpecialistForm = ({ specialistId, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNo: "",
    medicalLicenseNumber: "",
    address: "",
    specializations: "",
    qualifications: "",
    yearsOfExperience: "",
    dateOfBirth: "",
    gender: "",
    profilePhoto: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch specialist data if editing
  useEffect(() => {
    if (specialistId) {
      setLoading(true);
      axios
        .get(`http://localhost:5000/api/specialists/${specialistId}`)
        .then((res) => {
          const data = res.data;
          setFormData({
            fullName: data.fullName || "",
            email: data.email || "",
            password: "",
            phoneNo: data.phoneNo || "",
            medicalLicenseNumber: data.medicalLicenseNumber || "",
            address: data.address || "",
            specializations: Array.isArray(data.specializations)
              ? data.specializations.join(", ")
              : data.specializations || "",
            qualifications: data.qualifications || "",
            yearsOfExperience: data.yearsOfExperience || "",
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
            gender: data.gender || "",
            profilePhoto: null,
          });
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("Failed to load specialist data");
          setLoading(false);
        });
    }
  }, [specialistId]);

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
    setLoading(true);
    setError("");

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) {
          if (key === "specializations") {
            data.append(
              key,
              JSON.stringify(formData[key].split(",").map((s) => s.trim()))
            );
          } else {
            data.append(key, formData[key]);
          }
        }
      });

      if (specialistId) {
        // Update
        await axios.put(
          `http://localhost:5000/api/specialists/${specialistId}`,
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        // Create
        await axios.post("http://localhost:5000/api/specialists", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      onSuccess(); // callback to refresh list or close form
    } catch (err) {
      console.error(err.response || err);
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: "",
      email: "",
      password: "",
      phoneNo: "",
      medicalLicenseNumber: "",
      address: "",
      specializations: "",
      qualifications: "",
      yearsOfExperience: "",
      dateOfBirth: "",
      gender: "",
      profilePhoto: null,
    });
    setError("");
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center p-4 overflow-auto z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-8">
        <div className="overflow-y-auto max-h-[90vh]">
          <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">
            {specialistId ? "Edit Specialist" : "Add New Specialist"}
          </h2>
          {error && <p className="text-red-600 text-center mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
            <input
              type="password"
              name="password"
              placeholder={specialistId ? "New Password (optional)" : "Password"}
              value={formData.password}
              onChange={handleChange}
              required={!specialistId}
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
            <input
              type="text"
              name="phoneNo"
              placeholder="Phone Number"
              value={formData.phoneNo}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
            <input
              type="text"
              name="medicalLicenseNumber"
              placeholder="Medical License Number"
              value={formData.medicalLicenseNumber}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
            <input
              type="text"
              name="specializations"
              placeholder="Specializations (comma separated)"
              value={formData.specializations}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
            <input
              type="text"
              name="qualifications"
              placeholder="Qualifications"
              value={formData.qualifications}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
            <input
              type="number"
              name="yearsOfExperience"
              placeholder="Years of Experience"
              value={formData.yearsOfExperience}
              onChange={handleChange}
              min="0"
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
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
            <input
              type="file"
              name="profilePhoto"
              accept=".jpg,.jpeg,.png"
              onChange={handleChange}
              required={!specialistId}
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="submit"
                disabled={loading}
                className={`bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <i className="fas fa-save"></i>
                <span>{specialistId ? "Update Specialist" : "Add Specialist"}</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition flex items-center space-x-2"
              >
                <i className="fas fa-times"></i>
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default H_SpecialistForm;
