import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000";

const emptyState = {
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
};

const H_PlantPathologistForm = ({ id, initialData, onSuccess, onCancel }) => {
  const [data, setData] = useState(emptyState);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState("");

  // Prefill with initialData immediately to avoid blank UI
  useEffect(() => {
    if (!id && initialData) {
      setData({
        ...emptyState,
        ...initialData,
        specializations: Array.isArray(initialData.specializations)
          ? initialData.specializations.join(", ")
          : initialData.specializations || "",
        yearsOfExperience: initialData.yearsOfExperience ?? "",
        dateOfBirth: initialData.dateOfBirth ? initialData.dateOfBirth.split("T")[0] : "",
        profilePhoto: null,
      });
    }
  }, [id, initialData]);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/plant-pathologists/${id}`);
        const entry = res.data;
        setData({
          fullName: entry.fullName || "",
          email: entry.email || "",
          phoneNo: entry.phoneNo || "",
          licenseNumber: entry.licenseNumber || "",
          specializations: Array.isArray(entry.specializations)
            ? entry.specializations.join(", ")
            : entry.specializations || "",
          qualifications: entry.qualifications || "",
          yearsOfExperience: entry.yearsOfExperience ?? "",
          dateOfBirth: entry.dateOfBirth ? entry.dateOfBirth.split("T")[0] : "",
          gender: entry.gender || "Male",
          profilePhoto: null, // only set when user picks a new file
        });
        setError("");
      } catch (err) {
        console.error("Failed to load entry:", err);
        setError(
          `Failed to load entry details: ${err.response?.status || ""} ${err.response?.data?.error || err.message}`
        );
        // Fallback to initialData if provided
        if (initialData) {
          setData({
            ...emptyState,
            ...initialData,
            specializations: Array.isArray(initialData.specializations)
              ? initialData.specializations.join(", ")
              : initialData.specializations || "",
            yearsOfExperience: initialData.yearsOfExperience ?? "",
            dateOfBirth: initialData.dateOfBirth ? initialData.dateOfBirth.split("T")[0] : "",
            profilePhoto: null,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, initialData]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePhoto") {
      setData((prev) => ({ ...prev, profilePhoto: files?.[0] || null }));
    } else {
      setData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    const specsCsv = data.specializations
      ? data.specializations.split(",").map((s) => s.trim()).filter(Boolean).join(",")
      : "";

    formData.append("fullName", data.fullName);
    formData.append("email", data.email);
    formData.append("phoneNo", data.phoneNo);
    formData.append("licenseNumber", data.licenseNumber);
    formData.append("specializations", specsCsv);
    formData.append("qualifications", data.qualifications);
    formData.append("yearsOfExperience", data.yearsOfExperience);
    formData.append("dateOfBirth", data.dateOfBirth || "");
    formData.append("gender", data.gender);

    if (data.profilePhoto instanceof File) {
      formData.append("profilePhoto", data.profilePhoto);
    }

    try {
      if (id) {
        await axios.put(`${API_BASE}/api/plant-pathologists/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(`${API_BASE}/api/plant-pathologists`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      setError(`Save failed: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{id ? "Edit Plant Pathologist" : "Add New Plant Pathologist"}</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700" aria-label="Close">✖</button>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : (
          <>
            {error && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <input name="fullName" value={data.fullName} onChange={handleChange} placeholder="Full Name" required className="w-full border p-2 rounded"/>
              <input type="email" name="email" value={data.email} onChange={handleChange} placeholder="Email" required className="w-full border p-2 rounded"/>
              <input name="phoneNo" value={data.phoneNo} onChange={handleChange} placeholder="Phone No" required className="w-full border p-2 rounded"/>
              <input name="licenseNumber" value={data.licenseNumber} onChange={handleChange} placeholder="License Number" required className="w-full border p-2 rounded"/>
              <input name="specializations" value={data.specializations} onChange={handleChange} placeholder="Specializations (comma separated)" required className="w-full border p-2 rounded"/>
              <input name="qualifications" value={data.qualifications} onChange={handleChange} placeholder="Qualifications" required className="w-full border p-2 rounded"/>
              <input name="yearsOfExperience" type="number" value={data.yearsOfExperience} onChange={handleChange} placeholder="Years of Experience" required className="w-full border p-2 rounded"/>
              <input name="dateOfBirth" type="date" value={data.dateOfBirth} onChange={handleChange} className="w-full border p-2 rounded"/>
              <select name="gender" value={data.gender} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input type="file" name="profilePhoto" onChange={handleChange} accept="image/*" className="w-full"/>

              <div className="flex justify-end space-x-2 mt-3">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">{id ? "Update" : "Add"}</button>
                <button type="button" onClick={onCancel} className="bg-gray-400 text-black px-4 py-2 rounded">Cancel</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default H_PlantPathologistForm;