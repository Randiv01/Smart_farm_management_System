import React, { useState, useEffect } from "react";
import axios from "axios";

const H_PlantPathologistForm = ({ id, onSuccess, onCancel }) => {
  const [data, setData] = useState({
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
    if (id) {
      axios.get(`http://localhost:5000/api/plant-pathologists/${id}`)
        .then(res => {
          const entry = res.data;
          if (entry) {
            setData({
              fullName: entry.fullName,
              email: entry.email,
              phoneNo: entry.phoneNo,
              licenseNumber: entry.licenseNumber,
              specializations: Array.isArray(entry.specializations)
                ? entry.specializations.join(", ")
                : entry.specializations,
              qualifications: entry.qualifications,
              yearsOfExperience: entry.yearsOfExperience,
              dateOfBirth: entry.dateOfBirth ? entry.dateOfBirth.split("T")[0] : "",
              gender: entry.gender,
              profilePhoto: null,
            });
          }
        });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePhoto") setData({ ...data, profilePhoto: files[0] });
    else setData({ ...data, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === "specializations") {
        formData.append(key, data[key].split(",").map(s => s.trim()));
      } else {
        formData.append(key, data[key]);
      }
    });

    try {
      if (id) {
        await axios.put(`http://localhost:5000/api/plant-pathologists/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post("http://localhost:5000/api/plant-pathologists", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="text-xl font-bold mb-4">{id ? "Edit Plant Pathologist" : "Add New Plant Pathologist"}</h3>
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
      </div>
    </div>
  );
};

export default H_PlantPathologistForm;
