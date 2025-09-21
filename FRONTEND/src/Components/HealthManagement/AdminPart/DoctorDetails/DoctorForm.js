// frontend/src/components/DoctorForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000";

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
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const loadDoctor = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/doctors/${doctorId}`);
        setDoctorData({
          fullName: data.fullName || "",
          email: data.email || "",
          phoneNo: data.phoneNo || "",
          licenseNumber: data.licenseNumber || "",
          specializations: Array.isArray(data.specializations)
            ? data.specializations.join(", ")
            : data.specializations || "",
          qualifications: data.qualifications || "",
          yearsOfExperience: data.yearsOfExperience ?? "",
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
          gender: data.gender || "Male",
          profilePhoto: null,
        });
      } catch (e) {
        console.error(e);
        setErrMsg("Failed to load doctor.");
      }
    };
    if (doctorId) loadDoctor();
  }, [doctorId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePhoto") {
      setDoctorData((prev) => ({ ...prev, profilePhoto: files?.[0] || null }));
    } else {
      setDoctorData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("fullName", doctorData.fullName);
      formData.append("email", doctorData.email);
      formData.append("phoneNo", doctorData.phoneNo);
      formData.append("licenseNumber", doctorData.licenseNumber);
      formData.append(
        "specializations",
        JSON.stringify(
          doctorData.specializations
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      );
      formData.append("qualifications", doctorData.qualifications);
      formData.append("yearsOfExperience", doctorData.yearsOfExperience);
      formData.append("dateOfBirth", doctorData.dateOfBirth);
      formData.append("gender", doctorData.gender);
      if (doctorData.profilePhoto instanceof File) {
        formData.append("profilePhoto", doctorData.profilePhoto);
      }

      if (doctorId) {
        await axios.put(`${API_BASE}/api/doctors/${doctorId}`, formData);
      } else {
        await axios.post(`${API_BASE}/api/doctors`, formData);
      }

      onSuccess?.();
    } catch (err) {
      console.error(err);
      setErrMsg(err?.response?.data?.message || "Failed to save doctor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center p-4 overflow-auto z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-8">
        <div className="overflow-y-auto max-h-[90vh]">
          <h3 className="text-2xl font-bold text-green-700 mb-6 text-center">
            {doctorId ? "Edit Doctor" : "Add New Doctor"}
          </h3>

          {errMsg && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 p-3 rounded">{errMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="fullName" placeholder="Full Name" value={doctorData.fullName} onChange={handleChange} required className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500" />
            <input type="email" name="email" placeholder="Email" value={doctorData.email} onChange={handleChange} required className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500" />
            <input type="text" name="phoneNo" placeholder="Phone No" value={doctorData.phoneNo} onChange={handleChange} required className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500" />
            <input type="text" name="licenseNumber" placeholder="License Number" value={doctorData.licenseNumber} onChange={handleChange} className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500" />
            <input type="text" name="specializations" placeholder="Specializations (comma separated)" value={doctorData.specializations} onChange={handleChange} className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500" />
            <input type="text" name="qualifications" placeholder="Qualifications" value={doctorData.qualifications} onChange={handleChange} className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500" />
            <input type="number" name="yearsOfExperience" placeholder="Years of Experience" value={doctorData.yearsOfExperience} onChange={handleChange} min="0" className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500" />
            <input type="date" name="dateOfBirth" value={doctorData.dateOfBirth} onChange={handleChange} className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500" />
            <select name="gender" value={doctorData.gender} onChange={handleChange} className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input type="file" name="profilePhoto" accept="image/png,image/jpeg,image/jpg" onChange={handleChange} className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500" />

            <div className="flex justify-end space-x-4 mt-6">
              <button type="submit" disabled={submitting} className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-60">
                {submitting ? "Saving..." : doctorId ? "Update" : "Add"}
              </button>
              <button type="button" onClick={onCancel} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorForm;