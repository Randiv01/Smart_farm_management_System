import React, { useState, useEffect } from "react";
import axios from "axios";

const DoctorRecordForm = () => {
  // Animal types
  const [animalTypes, setAnimalTypes] = useState([
    "Cow",
    "Hen",
    "Buffalo",
    "Goat",
    "Pig",
  ]);
  const [newAnimalType, setNewAnimalType] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    animalType: "",
    animalCode: "",
    doctor: "",
    specialist: "",
    reports: null,
    medicines: [],
    notes: "",
  });

  const [doctors, setDoctors] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [medicines, setMedicines] = useState([]);

  // Fetch data from backend
  useEffect(() => {
    axios.get("http://localhost:5000/api/doctors").then((res) => setDoctors(res.data));
    axios
      .get("http://localhost:5000/api/specialists")
      .then((res) => setSpecialists(res.data));
    axios.get("http://localhost:5000/api/medistore").then((res) => setMedicines(res.data));
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, reports: e.target.files[0] }));
  };

  const handleMedicineToggle = (medicineId) => {
    setFormData((prev) => {
      const isSelected = prev.medicines.includes(medicineId);
      const newSelection = isSelected
        ? prev.medicines.filter((id) => id !== medicineId)
        : [...prev.medicines, medicineId];
      return { ...prev, medicines: newSelection };
    });
  };

  const handleAddAnimalType = () => {
    if (newAnimalType && !animalTypes.includes(newAnimalType)) {
      setAnimalTypes([...animalTypes, newAnimalType]);
      setFormData((prev) => ({ ...prev, animalType: newAnimalType }));
      setNewAnimalType("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("animalType", formData.animalType);
      data.append("animalCode", formData.animalCode);
      data.append("doctor", formData.doctor);
      data.append("specialist", formData.specialist);
      data.append("reports", formData.reports);
      data.append("notes", formData.notes);
      data.append("medicines", JSON.stringify(formData.medicines));

      await axios.post("http://localhost:5000/api/animalrecords", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Record saved successfully!");
      setFormData({
        animalType: "",
        animalCode: "",
        doctor: "",
        specialist: "",
        reports: null,
        medicines: [],
        notes: "",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save record.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl space-y-6"
      >
        <h1 className="text-2xl font-bold text-green-700 text-center">
          Add Animal Health Record
        </h1>

        {/* Animal Type */}
        <div>
          <label className="block font-semibold mb-2">Animal Type</label>
          <div className="flex items-center space-x-2">
            <select
              name="animalType"
              value={formData.animalType}
              onChange={handleChange}
              className="border p-2 rounded flex-1"
              required
            >
              <option value="">Select Animal Type</option>
              {animalTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Add New Animal Type"
              value={newAnimalType}
              onChange={(e) => setNewAnimalType(e.target.value)}
              className="border p-2 rounded flex-1"
            />
            <button
              type="button"
              onClick={handleAddAnimalType}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              ➕
            </button>
          </div>
        </div>

        {/* Animal Code */}
        <div>
          <label className="block font-semibold mb-2">Animal Code</label>
          <input
            type="text"
            name="animalCode"
            value={formData.animalCode}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Doctor */}
        <div>
          <label className="block font-semibold mb-2">Veterinary Surgeon</label>
          <select
            name="doctor"
            value={formData.doctor}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select Doctor</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Specialist */}
        <div>
          <label className="block font-semibold mb-2">Specialist Advice</label>
          <select
            name="specialist"
            value={formData.specialist}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="">Select Specialist</option>
            {specialists.map((s) => (
              <option key={s._id} value={s._id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Reports */}
        <div>
          <label className="block font-semibold mb-2">Upload Reports</label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Medicines */}
        <div>
          <label className="block font-semibold mb-2">Select Medicines</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border p-2 rounded">
            {medicines.map((med) => (
              <label
                key={med._id}
                className="flex items-center space-x-2 border p-1 rounded hover:bg-green-50"
              >
                <input
                  type="checkbox"
                  checked={formData.medicines.includes(med._id)}
                  onChange={() => handleMedicineToggle(med._id)}
                />
                <span>
                  {med.medicine_name} ({med.quantity_available} left)
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block font-semibold mb-2">Additional Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            rows={4}
          ></textarea>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 w-full font-bold transition"
        >
          Save Record
        </button>
      </form>
    </div>
  );
};

export default DoctorRecordForm;
