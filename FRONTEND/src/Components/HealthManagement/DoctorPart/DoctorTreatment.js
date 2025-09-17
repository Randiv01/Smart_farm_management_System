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
  const [loading, setLoading] = useState(false);

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
    const fetchData = async () => {
      try {
        const [doctorsRes, specialistsRes, medicinesRes] = await Promise.all([
          axios.get("http://localhost:5000/api/doctors"),
          axios.get("http://localhost:5000/api/specialists"),
          axios.get("http://localhost:5000/api/medistore"),
        ]);

        setDoctors(doctorsRes.data);
        setSpecialists(specialistsRes.data);
        setMedicines(medicinesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load form data. Please refresh the page.");
      }
    };

    fetchData();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        e.target.value = "";
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/png",
        "image/jpg",
        "image/jpeg",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Only PDF, PNG, JPG, and JPEG files are allowed");
        e.target.value = "";
        return;
      }
    }

    setFormData((prev) => ({ ...prev, reports: file }));
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
    const trimmedType = newAnimalType.trim();
    if (trimmedType && !animalTypes.includes(trimmedType)) {
      setAnimalTypes([...animalTypes, trimmedType]);
      setFormData((prev) => ({ ...prev, animalType: trimmedType }));
      setNewAnimalType("");
    } else if (animalTypes.includes(trimmedType)) {
      alert("Animal type already exists");
    }
  };

  const validateForm = () => {
    if (!formData.animalType) {
      alert("Please select an animal type");
      return false;
    }
    if (!formData.animalCode.trim()) {
      alert("Please enter an animal code");
      return false;
    }
    if (!formData.doctor) {
      alert("Please select a veterinary surgeon");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const data = new FormData();
      data.append("animalType", formData.animalType);
      data.append("animalCode", formData.animalCode.trim());
      data.append("doctor", formData.doctor);
      if (formData.specialist) data.append("specialist", formData.specialist);
      if (formData.reports) data.append("reports", formData.reports);
      data.append("notes", formData.notes);

      const medicinesArray = formData.medicines.filter((id) => id && id.trim() !== "");
      data.append("medicines", JSON.stringify(medicinesArray));

      const response = await axios.post(
        "http://localhost:5000/api/animalrecords",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        }
      );

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

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";

    } catch (err) {
      console.error("Submit error:", err);
      if (err.response) {
        alert(`Error: ${err.response.data?.message || "Failed to save record"}`);
      } else if (err.request) {
        alert("Network error. Please check your connection and try again.");
      } else {
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
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
          <label className="block font-semibold mb-2">Animal Type *</label>
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
          <label className="block font-semibold mb-2">Animal Code *</label>
          <input
            type="text"
            name="animalCode"
            value={formData.animalCode}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
            placeholder="Enter unique animal code"
          />
        </div>

        {/* Doctor */}
        <div>
          <label className="block font-semibold mb-2">Veterinary Surgeon *</label>
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
            <option value="">Select Specialist (Optional)</option>
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
          <p className="text-sm text-gray-600 mt-1">
            Accepted formats: PDF, PNG, JPG, JPEG (Max: 5MB)
          </p>
        </div>

        {/* Medicines */}
        <div>
          <label className="block font-semibold mb-2">Select Medicines</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border p-2 rounded">
            {medicines.length > 0 ? (
              medicines.map((med) => (
                <label
                  key={med._id}
                  className="flex items-center space-x-2 border p-1 rounded hover:bg-green-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.medicines.includes(med._id)}
                    onChange={() => handleMedicineToggle(med._id)}
                  />
                  <span className="text-sm">
                    {med.medicine_name} ({med.quantity_available} left)
                  </span>
                </label>
              ))
            ) : (
              <p className="text-gray-500 col-span-full text-center py-4">
                No medicines available
              </p>
            )}
          </div>
          {formData.medicines.length > 0 && (
            <p className="text-sm text-green-600 mt-1">
              {formData.medicines.length} medicine(s) selected
            </p>
          )}
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
            placeholder="Enter any additional notes about the treatment..."
          ></textarea>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full font-bold px-6 py-3 rounded-md transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {loading ? "Saving..." : "Save Record"}
        </button>
      </form>
    </div>
  );
};

export default DoctorRecordForm;
