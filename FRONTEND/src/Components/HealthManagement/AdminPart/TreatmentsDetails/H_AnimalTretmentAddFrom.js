import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Animal Treatment Form Component
const H_AnimalTretmentAddFrom = () => {
  const [animalTypes, setAnimalTypes] = useState([
    "Cow",
    "Hen",
    "Buffalo",
    "Goat",
    "Pig",
  ]);
  const [newAnimalType, setNewAnimalType] = useState("");

  const [formData, setFormData] = useState({
    animalType: "",
    animalCode: "",
    doctor: "",
    specialist: "",
    reports: null,
    medicines: [],
    notes: "",
    status: "active"
  });

  const [doctors, setDoctors] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const navigate = useNavigate();

  // Status options
  const statusOptions = [
    { value: "diagnosed", label: "Diagnosed" },
    { value: "active", label: "Under Treatment" },
    { value: "recovering", label: "Recovering" },
    { value: "completed", label: "Recovered" },
    { value: "cancelled", label: "Cancelled" }
  ];

  useEffect(() => {
    // Fetch doctors, specialists, and medicines
    const fetchData = async () => {
      try {
        setError("");
        setLoading(true);
        
        // First test if models are registered
        try {
          const modelsTest = await axios.get("http://localhost:5000/api/test-models");
          console.log("Models test:", modelsTest.data);
          setDebugInfo(`Models registered: ${JSON.stringify(modelsTest.data.models)}`);
        } catch (testError) {
          console.error("Models test failed:", testError);
          setDebugInfo("Models test failed - check server");
        }
        
        const [doctorsRes, specialistsRes, medicinesRes] = await Promise.all([
          axios.get("http://localhost:5000/api/doctors", { timeout: 10000 }),
          axios.get("http://localhost:5000/api/specialists", { timeout: 10000 }),
          axios.get("http://localhost:5000/api/medistore", { timeout: 10000 })
        ]);
        
        console.log("Doctors:", doctorsRes.data);
        console.log("Specialists:", specialistsRes.data);
        console.log("Medicines:", medicinesRes.data);
        
        setDoctors(doctorsRes.data);
        setSpecialists(specialistsRes.data);
        setMedicines(medicinesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        let errorMessage = "Failed to load form data. ";
        
        if (error.code === 'ECONNREFUSED') {
          errorMessage += "Cannot connect to server. Please make sure the backend is running on port 5000.";
        } else if (error.response?.data?.error) {
          errorMessage += error.response.data.error;
        } else if (error.response) {
          errorMessage += `Server Error: ${error.response.status}`;
        } else if (error.request) {
          errorMessage += "No response from server. Please check if the backend server is running.";
        } else {
          errorMessage += error.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!allowedTypes.includes(file.type)) {
        setError("Please select a valid file type (JPEG, JPG, PNG, PDF)");
        e.target.value = ""; // Clear the file input
        return;
      }
      
      if (file.size > maxSize) {
        setError("File size too large. Maximum size is 10MB.");
        e.target.value = ""; // Clear the file input
        return;
      }
      
      setFormData((prev) => ({ ...prev, reports: file }));
      setError("");
    }
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
    if (newAnimalType.trim() && !animalTypes.includes(newAnimalType.trim())) {
      const trimmedType = newAnimalType.trim();
      setAnimalTypes([...animalTypes, trimmedType]);
      setFormData((prev) => ({ ...prev, animalType: trimmedType }));
      setNewAnimalType("");
      setSuccess(`New animal type "${trimmedType}" added successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } else if (newAnimalType.trim() === "") {
      setError("Please enter an animal type");
    } else {
      setError("Animal type already exists");
    }
  };

  const validateForm = () => {
    if (!formData.animalType.trim()) {
      setError("Animal type is required");
      return false;
    }
    if (!formData.animalCode.trim()) {
      setError("Animal code is required");
      return false;
    }
    if (!formData.doctor) {
      setError("Veterinary surgeon is required");
      return false;
    }
    if (!formData.status) {
      setError("Treatment status is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate form
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append("animalType", formData.animalType.trim());
      data.append("animalCode", formData.animalCode.trim());
      data.append("doctor", formData.doctor);
      data.append("specialist", formData.specialist || "");
      data.append("status", formData.status);
      data.append("notes", formData.notes.trim());
      data.append("medicines", JSON.stringify(formData.medicines));
      
      if (formData.reports) {
        data.append("reports", formData.reports);
      }

      console.log("Submitting form data:", {
        animalType: formData.animalType,
        animalCode: formData.animalCode,
        doctor: formData.doctor,
        specialist: formData.specialist,
        status: formData.status,
        medicines: formData.medicines,
        notes: formData.notes,
        hasFile: !!formData.reports
      });

      // Log FormData contents for debugging
      for (let [key, value] of data.entries()) {
        console.log(`FormData: ${key} =`, value);
      }

      const response = await axios.post(
        "http://localhost:5000/api/animal-treatments", 
        data, 
        {
          headers: { 
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000
        }
      );

      if (response.data.success) {
        console.log("Record saved successfully:", response.data);
        setSuccess("Animal treatment record saved successfully!");
        
        // Reset form
        setFormData({
          animalType: "",
          animalCode: "",
          doctor: "",
          specialist: "",
          reports: null,
          medicines: [],
          notes: "",
          status: "active"
        });
        
        // Clear file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";

        // Navigate back to treatments page after successful submission
        setTimeout(() => {
          navigate("/admin/treatments-details");
        }, 2000);
      } else {
        throw new Error(response.data.error || "Failed to save record");
      }
    } catch (err) {
      console.error("Error saving record:", err);
      let errorMessage = "Failed to save record. Please try again.";
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.details) {
        errorMessage = err.response.data.details;
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage = "Cannot connect to server. Please make sure the backend is running on port 5000.";
      } else if (err.response) {
        errorMessage = `Server Error: ${err.response.status} - ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage = "No response from server. Please check if the backend server is running.";
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/admin/treatments-details");
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d._id === doctorId);
    return doctor ? doctor.fullName : "Unknown Doctor";
  };

  const getSpecialistName = (specialistId) => {
    const specialist = specialists.find(s => s._id === specialistId);
    return specialist ? specialist.fullName : "Unknown Specialist";
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/test-models");
      console.log("Connection test:", response.data);
      setDebugInfo(JSON.stringify(response.data, null, 2));
      setSuccess("Connection test successful!");
    } catch (error) {
      setError("Connection test failed: " + error.message);
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700">
            Add Animal Health Record
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={testConnection}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition flex items-center gap-2 text-sm"
            >
              Test Connection
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <strong>Error: </strong>
            </div>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <strong>Success: </strong>
            </div>
            <p className="mt-1">{success}</p>
          </div>
        )}

        {loading && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
              <span>Processing your request...</span>
            </div>
          </div>
        )}

        {/* Animal Type */}
        <div>
          <label className="block font-semibold mb-2">Animal Type *</label>
          <div className="flex items-center space-x-2">
            <select
              name="animalType"
              value={formData.animalType}
              onChange={handleChange}
              className="border p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAnimalType();
                }
              }}
              className="border p-2 rounded flex-1 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button
              type="button"
              onClick={handleAddAnimalType}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center gap-1"
            >
              <span>➕</span>
              <span>Add</span>
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
            className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter unique animal code (e.g., COW-001)"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block font-semibold mb-2">Treatment Status *</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Doctor */}
        <div>
          <label className="block font-semibold mb-2">Veterinary Surgeon *</label>
          <select
            name="doctor"
            value={formData.doctor}
            onChange={handleChange}
            className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Doctor</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.fullName} {d.specialization ? `- ${d.specialization}` : ''}
              </option>
            ))}
          </select>
          {formData.doctor && (
            <p className="text-sm text-green-600 mt-1">
              Selected: {getDoctorName(formData.doctor)}
            </p>
          )}
        </div>

        {/* Specialist */}
        <div>
          <label className="block font-semibold mb-2">Specialist Advice</label>
          <select
            name="specialist"
            value={formData.specialist}
            onChange={handleChange}
            className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Specialist</option>
            {specialists.map((s) => (
              <option key={s._id} value={s._id}>
                {s.fullName} {s.specialization ? `- ${s.specialization}` : ''}
              </option>
            ))}
          </select>
          {formData.specialist && (
            <p className="text-sm text-green-600 mt-1">
              Selected: {getSpecialistName(formData.specialist)}
            </p>
          )}
        </div>

        {/* Reports */}
        <div>
          <label className="block font-semibold mb-2">Upload Reports</label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Supported formats: PDF, PNG, JPG, JPEG (Max: 10MB). Files are saved in Health_uploads folder.
          </p>
          {formData.reports && (
            <p className="text-sm text-green-600 mt-1">
              File selected: {formData.reports.name}
            </p>
          )}
        </div>

        {/* Medicines */}
        <div>
          <label className="block font-semibold mb-2">Select Medicines</label>
          {medicines.length === 0 ? (
            <div className="border p-4 rounded text-center text-gray-500">
              No medicines available in inventory
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-3 rounded">
                {medicines.map((med) => (
                  <label
                    key={med._id}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition ${
                      formData.medicines.includes(med._id) 
                        ? 'bg-green-100 border border-green-300' 
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.medicines.includes(med._id)}
                      onChange={() => handleMedicineToggle(med._id)}
                      className="rounded text-green-600 focus:ring-green-500"
                    />
                    <span className="flex-1">
                      <span className="font-medium">{med.medicine_name}</span>
                      {med.quantity_available !== undefined && (
                        <span className={`text-sm ml-2 ${
                          med.quantity_available > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ({med.quantity_available} available)
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
              {formData.medicines.length > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  {formData.medicines.length} medicine(s) selected
                </p>
              )}
            </>
          )}
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block font-semibold mb-2">Additional Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Enter any additional notes or observations about the animal's condition, treatment plan, etc..."
          ></textarea>
          <p className="text-sm text-gray-500 mt-1">
            {formData.notes.length}/1000 characters
          </p>
        </div>

        {/* Submit and Back Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex-1 font-bold transition disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Record
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 flex-1 font-bold transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
        </div>

        <p className="text-sm text-gray-500 text-center border-t pt-4">
          * Required fields. All data will be saved to the database and files will be stored in the Health_uploads folder.
        </p>

        {/* Debug Info */}
        <div className="bg-gray-100 p-3 rounded text-xs">
          <strong>Debug Info:</strong> 
          <div>Doctors: {doctors.length}</div>
          <div>Specialists: {specialists.length}</div>
          <div>Medicines: {medicines.length}</div>
          <div>Selected Medicines: {formData.medicines.length}</div>
          {debugInfo && (
            <div className="mt-2">
              <strong>Models Status:</strong>
              <pre className="text-xs mt-1">{debugInfo}</pre>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default H_AnimalTretmentAddFrom;