import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.js";
import { useLoader } from "../contexts/LoaderContext.js";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toDataURL } from 'qrcode';

export default function HealthInfoDetails() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading: setGlobalLoading } = useLoader();

  const [animals, setAnimals] = useState([]);
  const [animalType, setAnimalType] = useState(null);
  const [healthFields, setHealthFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [popup, setPopup] = useState({
    show: false,
    success: true,
    message: "",
    type: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    email: "",
    specialization: ""
  });
  const [medicalRequestModal, setMedicalRequestModal] = useState({
    show: false,
    animal: null,
    message: "",
    sending: false,
    error: null
  });

  useEffect(() => {
    document.title = "Health Information";
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const typeRes = await fetch(`http://localhost:5000/animal-types/${type}`);
      if (!typeRes.ok) throw new Error(`Animal type not found`);
      const typeData = await typeRes.json();
      setAnimalType(typeData);

      // Extract Health Info fields
      const healthCategory = typeData.categories.find(
        cat => cat.name === "Health Info" || cat.name === "Health & Care"
      );
      
      if (healthCategory) {
        setHealthFields(healthCategory.fields);
        
        // Initialize editData with health fields
        const initialEditData = {};
        healthCategory.fields.forEach(
          (field) => (initialEditData[field.name] = "")
        );
        setEditData(initialEditData);
      }

      // Fetch animals with health data
      const animalsRes = await fetch(
        `http://localhost:5000/animals?type=${typeData._id}`
      );
      if (!animalsRes.ok) throw new Error("Failed to fetch animals");
      const animalsData = await animalsRes.json();
      
      // For batch/group management, group animals by batchId
      if (typeData.managementType === "batch") {
        const batchGroups = {};
        animalsData.forEach(animal => {
          if (animal.batchId) {
            if (!batchGroups[animal.batchId]) {
              batchGroups[animal.batchId] = {
                ...animal,
                count: 1,
                animals: [animal]
              };
            } else {
              batchGroups[animal.batchId].count += 1;
              batchGroups[animal.batchId].animals.push(animal);
            }
          } else {
            if (!batchGroups[animal._id]) {
              batchGroups[animal._id] = {
                ...animal,
                count: 1,
                animals: [animal]
              };
            }
          }
        });
        
        setAnimals(Object.values(batchGroups));
      } else if (typeData.managementType === "other") {
        const hiveFarmGroups = {};
        const mainField = typeData.categories.find(cat => cat.name === "Hive/Farm Info")?.fields[0]?.name || "name";
        
        animalsData.forEach(animal => {
          const groupKey = animal.batchId || animal.data[mainField] || animal._id;
          
          if (!hiveFarmGroups[groupKey]) {
            hiveFarmGroups[groupKey] = {
              ...animal,
              groupId: groupKey,
              animals: [animal]
            };
          } else {
            hiveFarmGroups[groupKey].animals.push(animal);
          }
        });
        
        setAnimals(Object.values(hiveFarmGroups));
      } else {
        setAnimals(animalsData);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  // Fetch available doctors
  const fetchDoctors = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/doctors');
      if (res.ok) {
        const doctorsData = await res.json();
        setDoctors(doctorsData);
        if (doctorsData.length > 0) {
          setSelectedDoctor(doctorsData[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDoctors();
  }, [type]);

  const showPopup = (message, success = true, type = "save") => {
    setPopup({ show: true, message, success, type });
    if (type === "save")
      setTimeout(() => setPopup({ ...popup, show: false }), 2500);
  };

  const handleEdit = (animal) => {
    setEditId(animal._id);
    const editValues = {};
    healthFields.forEach(
      (field) => (editValues[field.name] = animal.data[field.name] || "")
    );
    setEditData(editValues);
  };

  const handleUpdate = async (id) => {
  try {
    // First get the current animal data
    const currentAnimalRes = await fetch(`http://localhost:5000/animals/${id}`);
    if (!currentAnimalRes.ok) throw new Error("Failed to fetch current animal data");
    const currentAnimal = await currentAnimalRes.json();
    
    // Merge the updated health fields with existing data
    const mergedData = {
      ...currentAnimal.data, // Keep all existing data
      ...editData           // Override with updated health fields
    };

    const res = await fetch(`http://localhost:5000/animals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: mergedData, updatedAt: Date.now() }),
    });
    if (!res.ok) throw new Error("Failed to update animal");
    const updatedAnimal = await res.json();
    setAnimals((prev) => prev.map((a) => (a._id === id ? updatedAnimal : a)));
    setEditId(null);
    showPopup("Health information updated successfully!");
  } catch (err) {
    showPopup(err.message, false, "error");
  }
};

  const downloadHealthReport = (animal) => {
    const doc = new jsPDF();
    
    // Add logo
    const img = new Image();
    img.src = "/logo512.png";
    
    img.onload = () => {
      doc.addImage(img, "PNG", 14, 10, 30, 30);
      
      // Title
      doc.setFontSize(16);
      doc.text("Health Report", 50, 20);
      doc.setFontSize(12);
      doc.text(`${animalType.name}: ${animal.data?.name || animal.animalId || "Unknown"}`, 14, 50);
      
      // Health data table
      const tableData = healthFields.map(field => [
        field.label, 
        animal.data?.[field.name] || "Not recorded"
      ]);
      
      autoTable(doc, {
        startY: 60,
        head: [["Health Parameter", "Value"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [60, 141, 188], textColor: 255 },
      });
      
      // Save the PDF
      const fileName = `Health_Report_${animal.data?.name || animal.animalId || animal._id}.pdf`;
      doc.save(fileName);
    };
  };

  // Handle adding a new doctor
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoctor)
      });
      
      if (res.ok) {
        const savedDoctor = await res.json();
        setDoctors([...doctors, savedDoctor]);
        setSelectedDoctor(savedDoctor._id);
        setShowDoctorModal(false);
        setNewDoctor({ name: "", email: "", specialization: "" });
        showPopup("Doctor added successfully!");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add doctor');
      }
    } catch (err) {
      showPopup(err.message, false, "error");
    }
  };

  // Handle updating a doctor
  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/doctors/${editingDoctor._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoctor)
      });
      
      if (res.ok) {
        const updatedDoctor = await res.json();
        setDoctors(doctors.map(d => d._id === updatedDoctor._id ? updatedDoctor : d));
        setShowDoctorModal(false);
        setEditingDoctor(null);
        setNewDoctor({ name: "", email: "", specialization: "" });
        showPopup("Doctor updated successfully!");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update doctor');
      }
    } catch (err) {
      showPopup(err.message, false, "error");
    }
  };

  // Handle removing a doctor
  const handleRemoveDoctor = async (doctorId) => {
    if (!window.confirm("Are you sure you want to remove this doctor?")) {
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/doctors/${doctorId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setDoctors(doctors.filter(d => d._id !== doctorId));
        if (selectedDoctor === doctorId && doctors.length > 1) {
          setSelectedDoctor(doctors[0]._id);
        } else if (doctors.length === 1) {
          setSelectedDoctor('');
        }
        showPopup("Doctor removed successfully!");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to remove doctor');
      }
    } catch (err) {
      showPopup(err.message, false, "error");
    }
  };

  // Open doctor modal for editing
  const openEditDoctorModal = (doctor) => {
    setEditingDoctor(doctor);
    setNewDoctor({
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization
    });
    setShowDoctorModal(true);
  };

  // Open doctor modal for adding new
  const openAddDoctorModal = () => {
    setEditingDoctor(null);
    setNewDoctor({ name: "", email: "", specialization: "" });
    setShowDoctorModal(true);
  };

  // Open medical request modal
  const openMedicalRequestModal = (animal) => {
    setMedicalRequestModal({
      show: true,
      animal,
      message: `URGENT: ${animal.data?.name || animal.animalId || "Unknown"} requires immediate medical attention.`,
      sending: false,
      error: null
    });
  };

  // Generate QR code data URL for email
  const generateQRCodeDataUrl = async (text) => {
    try {
      const qrCodeDataUrl = await toDataURL(text, {
        width: 200,
        margin: 2,
        color: {
          dark: '#2C5530',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

 // In your frontend handleMedicalRequest function
const handleMedicalRequest = async () => {
  const { animal, message } = medicalRequestModal;
  
  if (!message.trim()) {
    setMedicalRequestModal({
      ...medicalRequestModal,
      error: "Please enter a message for the doctor."
    });
    return;
  }
  
  try {
    setMedicalRequestModal({
      ...medicalRequestModal,
      sending: true,
      error: null
    });
    
    const animalName = animal.data?.name || animal.animalId || "Unknown";
    const animalId = animal._id;
    
    // Generate QR code data for the email
    const qrCodeText = `${window.location.origin}/animal-details/${animalId}`;
    const qrCodeDataUrl = await generateQRCodeDataUrl(qrCodeText);
    
    // Get selected doctor details
    const doctor = doctors.find(d => d._id === selectedDoctor);
    
    // CRITICAL FIX: Ensure we have a doctor selected
    if (!doctor) {
      throw new Error('Please select a doctor first');
    }
    
    // CRITICAL FIX: Ensure the doctor has an email
    if (!doctor.email) {
      throw new Error('Selected doctor does not have an email address');
    }
    
    const response = await fetch(`http://localhost:5000/animals/${animalId}/medical-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        animalId,
        animalName,
        qrCodeData: qrCodeDataUrl || qrCodeText, // Send both data URL and text as fallback
        message,
        doctorEmail: doctor.email // CRITICAL: Pass the actual doctor email
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to send medical request');
    }
    
    showPopup(result.message);
    setMedicalRequestModal({ show: false, animal: null, message: "", sending: false, error: null });
    
  } catch (err) {
    console.error('Medical request error:', err);
    setMedicalRequestModal({
      ...medicalRequestModal,
      sending: false,
      error: err.message
    });
  }
};

  // Search & filter logic
  const handleFilterChange = (field, value) => {
    setFilterValues({ ...filterValues, [field]: value });
  };

  const filteredAnimals = animals.filter((animal) => {
    const matchesSearch = searchQuery
      ? Object.values(animal.data).some((val) =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        ) || 
        (animal.animalId && animal.animalId.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesFilters = Object.keys(filterValues).every((key) => {
      if (!filterValues[key]) return true;
      const val = animal.data[key] || "";
      if (healthFields.find((f) => f.name === key)?.type === "number") {
        return Number(val) === Number(filterValues[key]);
      }
      return String(val)
        .toLowerCase()
        .includes(filterValues[key].toLowerCase());
    });

    return matchesSearch && matchesFilters;
  });

  // Get group identifier for display
  const getGroupIdentifier = (animal) => {
    if (animalType?.managementType === "batch") {
      return animal.batchId;
    } else if (animalType?.managementType === "other") {
      return animal.groupId || animal.batchId || animal._id;
    }
    return animal.animalId;
  };

  // Loading / Error
  if (loading)
    return (
      <div className="flex justify-center items-center h-48 text-dark-gray dark:text-dark-text">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-btn-teal"></div>
        <p className="ml-4">Loading health data...</p>
      </div>
    );

  if (error || !animalType)
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-dark-gray dark:text-dark-text">
          {error ? `Error Loading Health Data` : "Animal Type Not Found"}
        </h2>
        <p className="text-red-500 dark:text-btn-red mb-4">
          {error || `The animal type "${type}" could not be loaded.`}
        </p>
        {error && (
          <button
            className="px-4 py-2 rounded bg-btn-blue text-white hover:bg-blue-800 mr-2"
            onClick={fetchData}
          >
            Retry
          </button>
        )}
        <button
            className="px-4 py-2 rounded bg-btn-gray text-white hover:bg-gray-700"
            onClick={() => navigate("/AnimalManagement")}
          >
            Back
          </button>
      </div>
    );

  return (
    <div className={`${darkMode ? "dark bg-dark-bg" : "bg-light-beige"}`}>
      <main className="p-5">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-5 gap-4">
          <h2
            className={`text-2xl font-semibold ${
              darkMode ? "text-dark-text" : "text-dark-gray"
            }`}
          >
            {animalType.name} Health Information
            {animalType.managementType !== "individual" && 
              ` (${animalType.managementType === "batch" ? "Batch" : "Hive/Farm"} View)`}
          </h2>
          <button
            onClick={() => navigate(`/AnimalManagement/add-animal/${animalType._id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold bg-btn-teal text-white hover:bg-teal-700"
          >
            ➕ Add New {animalType.managementType !== "individual" 
              ? (animalType.managementType === "batch" ? "Batch" : "Hive/Farm") 
              : animalType.name}
          </button>
        </div>

        {/* Doctor Selection */}
        <div className={`mb-4 p-3 rounded-lg ${darkMode ? "bg-dark-card" : "bg-soft-white"} shadow-md`}>
          <div className="flex flex-wrap justify-between items-center gap-4 mb-3">
            <label className="block font-medium">
              Select Doctor for Emergency Requests:
            </label>
            <button
              onClick={openAddDoctorModal}
              className="px-3 py-1 rounded bg-btn-blue text-white hover:bg-blue-700 text-sm"
            >
              + Add New Doctor
            </button>
          </div>
          
          <div className="flex gap-2 items-center">
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className={`flex-1 p-2 rounded border ${
                darkMode
                  ? "bg-dark-card border-gray-600 text-dark-text"
                  : "border-gray-200"
              }`}
            >
              {doctors.length === 0 ? (
                <option value="">No doctors available</option>
              ) : (
                doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name} - {doctor.specialization} ({doctor.email})
                  </option>
                ))
              )}
            </select>
            
            {selectedDoctor && (
              <div className="flex gap-1">
                <button
                  onClick={() => openEditDoctorModal(doctors.find(d => d._id === selectedDoctor))}
                  className="p-2 rounded bg-yellow-600 text-white hover:bg-yellow-700"
                  title="Edit Doctor"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleRemoveDoctor(selectedDoctor)}
                  className="p-2 rounded bg-red-600 text-white hover:bg-red-700"
                  title="Remove Doctor"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modern Search Bar */}
        <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-100 dark:bg-dark-card rounded-lg shadow-inner items-center">
          <input
            type="text"
            placeholder="Search health records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-btn-teal focus:border-btn-teal"
          />
          {healthFields.slice(0, 2).map((field) => (
            <input
              key={field.name}
              type={
                field.type === "number"
                  ? "number"
                  : field.type === "date"
                  ? "date"
                  : "text"
              }
              placeholder={`Filter by ${field.label}`}
              value={filterValues[field.name] || ""}
              onChange={(e) => handleFilterChange(field.name, e.target.value)}
              className="p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-btn-teal focus:border-btn-teal"
            />
          ))}
        </div>

        {/* Health Status Summary */}
        {healthFields.length > 0 && (
          <div className={`mb-6 p-4 rounded-lg ${darkMode ? "bg-dark-card" : "bg-soft-white"} shadow-md`}>
            <h3 className="text-lg font-semibold mb-3">Health Status Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {healthFields.filter(f => f.type === "select" && f.options).map((field, idx) => {
                const values = animals.flatMap(a => 
                  a.data && a.data[field.name] ? [a.data[field.name]] : []
                );
                
                const valueCounts = values.reduce((acc, val) => {
                  acc[val] = (acc[val] || 0) + 1;
                  return acc;
                }, {});
                
                return (
                  <div key={idx} className="p-3 rounded border">
                    <h4 className="font-medium mb-2">{field.label}</h4>
                    {Object.entries(valueCounts).map(([value, count]) => (
                      <div key={value} className="flex justify-between text-sm">
                        <span>{value}:</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Table */}
        <div
          className={`overflow-x-auto rounded-lg shadow-md ${
            darkMode ? "bg-dark-card shadow-cardDark" : "bg-soft-white shadow-card"
          }`}
        >
          <table className="w-full table-auto border-separate border-spacing-0 text-sm">
            <thead
              className={
                darkMode
                  ? "bg-dark-gray text-dark-text sticky top-0"
                  : "bg-gray-200 text-dark-gray font-semibold sticky top-0"
              }
            >
              <tr>
                <th className="p-3 text-center">QR & ID</th>
                {animalType.managementType === "batch" && (
                  <th className="p-3 text-center">Count</th>
                )}
                {healthFields.map((field, idx) => (
                  <th key={idx} className="p-3">
                    {field.label}
                  </th>
                ))}
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnimals.length === 0 ? (
                <tr>
                  <td
                    colSpan={healthFields.length + (animalType.managementType === "batch" ? 2 : 1)}
                    className="p-4 text-center italic text-gray-500 dark:text-gray-400"
                  >
                    No matching health records found.
                  </td>
                </tr>
              ) : (
                filteredAnimals.map((animal) => (
                  <tr
                    key={animal._id}
                    className={`${
                      darkMode ? "bg-dark-card text-dark-text" : "bg-white"
                    } hover:${darkMode ? "bg-dark-gray" : "bg-gray-100"}`}
                  >
                    {/* QR Code + Animal/Batch/Hive ID */}
                    <td className="p-3">
                      <div className="flex flex-col items-center justify-center">
                        {animalType.managementType !== "individual" ? (
                          <div className="text-center">
                            <QRCodeCanvas 
                              value={getGroupIdentifier(animal)} 
                              size={60} 
                              level="H" 
                              className="mx-auto"
                            />
                            <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                              {animalType.managementType === "batch" ? "Batch: " : "ID: "}
                              {getGroupIdentifier(animal)}
                            </div>
                          </div>
                        ) : animal.qrCode ? (
                          <div className="text-center">
                            <QRCodeCanvas 
                              value={animal.qrCode} 
                              size={60} 
                              level="H" 
                              className="mx-auto"
                            />
                            <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                              {animal.animalId}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>

                    {/* Count for batch animals only */}
                    {animalType.managementType === "batch" && (
                      <td className="p-2 text-center font-semibold">
                        {animal.count}
                      </td>
                    )}

                    {/* Health Fields */}
                    {healthFields.map((field, idx) => (
                      <td key={idx} className="p-2 text-center">
                        {editId === animal._id ? (
                          field.type === "select" && field.options ? (
                            <select
                              value={editData[field.name] || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  [field.name]: e.target.value,
                                })
                              }
                              className={`w-full p-1 rounded border ${
                                darkMode
                                  ? "bg-dark-card border-gray-600 text-dark-text"
                                  : "border-gray-200"
                              }`}
                            >
                              <option value="">Select {field.label}</option>
                              {field.options.map((opt, i) => (
                                <option key={i} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={
                                field.type === "number"
                                  ? "number"
                                  : field.type === "date"
                                  ? "date"
                                  : "text"
                              }
                              value={editData[field.name] || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  [field.name]: e.target.value,
                                })
                              }
                              className={`w-full p-1 rounded border ${
                                darkMode
                                  ? "bg-dark-card border-gray-600 text-dark-text"
                                  : "border-gray-200"
                              }`}
                            />
                          )
                        ) : (
                          animal.data?.[field.name] || "-"
                        )}
                      </td>
                    ))}

                    {/* Actions */}
                    <td className="p-2 text-center">
                      <div className="flex justify-center gap-2">
                        {editId === animal._id ? (
                          <>
                            <button
                              onClick={() => handleUpdate(animal._id)}
                              className="px-2 py-1 rounded bg-btn-teal text-white hover:bg-teal-700"
                            >
                              💾 Save
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="px-2 py-1 rounded bg-btn-gray text-white hover:bg-gray-700"
                            >
                              ✖ Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(animal)}
                              className="px-2 py-1 rounded bg-btn-blue text-white hover:bg-blue-800"
                            >
                              ✏ Edit
                            </button>
                            <button
                              onClick={() => downloadHealthReport(animal)}
                              className="px-2 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
                            >
                              📄 Report
                            </button>
                            <button
                              onClick={() => openMedicalRequestModal(animal)}
                              className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                              title="Request Medical Support"
                            >
                              🚑 Support
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Popup */}
      {popup.show && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div
            className={`bg-white dark:bg-dark-card p-5 rounded-2xl w-80 max-w-[90%] text-center shadow-lg animate-popIn border-l-4 ${
              popup.success
                ? "border-btn-teal"
                : "border-btn-red"
            }`}
          >
            <p className="mb-4">{popup.message}</p>
            <button
              onClick={() => setPopup({ ...popup, show: false })}
              className="px-4 py-2 rounded bg-btn-teal text-white hover:bg-teal-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className={`bg-white dark:bg-dark-card p-5 rounded-2xl w-96 max-w-[90%] shadow-lg ${darkMode ? "text-dark-text" : ""}`}>
            <h3 className="text-xl font-semibold mb-4">
              {editingDoctor ? "Edit Doctor" : "Add New Doctor"}
            </h3>
            <form onSubmit={editingDoctor ? handleUpdateDoctor : handleAddDoctor}>
              <div className="mb-4">
                <label className="block mb-1">Name</label>
                <input
                  type="text"
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
                  className={`w-full p-2 rounded border ${
                    darkMode
                      ? "bg-dark-card border-gray-600 text-dark-text"
                      : "border-gray-200"
                  }`}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Email</label>
                <input
                  type="email"
                  value={newDoctor.email}
                  onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
                  className={`w-full p-2 rounded border ${
                    darkMode
                      ? "bg-dark-card border-gray-600 text-dark-text"
                      : "border-gray-200"
                  }`}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Specialization</label>
                <input
                  type="text"
                  value={newDoctor.specialization}
                  onChange={(e) => setNewDoctor({...newDoctor, specialization: e.target.value})}
                  className={`w-full p-2 rounded border ${
                    darkMode
                      ? "bg-dark-card border-gray-600 text-dark-text"
                      : "border-gray-200"
                  }`}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDoctorModal(false);
                    setEditingDoctor(null);
                    setNewDoctor({ name: "", email: "", specialization: "" });
                  }}
                  className="px-4 py-2 rounded bg-btn-gray text-white hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-btn-teal text-white hover:bg-teal-700"
                >
                  {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medical Request Modal */}
      {medicalRequestModal.show && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className={`bg-white dark:bg-dark-card p-5 rounded-2xl w-96 max-w-[90%] shadow-lg ${darkMode ? "text-dark-text" : ""}`}>
            <h3 className="text-xl font-semibold mb-4">Request Medical Support</h3>
            <p className="mb-4">
              Sending to: {doctors.find(d => d._id === selectedDoctor)?.name || "Selected Doctor"}
            </p>
            <div className="mb-4">
              <label className="block mb-1">Message to Doctor</label>
              <textarea
                value={medicalRequestModal.message}
                onChange={(e) => setMedicalRequestModal({
                  ...medicalRequestModal,
                  message: e.target.value,
                  error: null
                })}
                rows="5"
                className={`w-full p-2 rounded border ${
                  darkMode
                    ? "bg-dark-card border-gray-600 text-dark-text"
                    : "border-gray-200"
                }`}
                required
              />
            </div>
            
            {medicalRequestModal.error && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                {medicalRequestModal.error}
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMedicalRequestModal({ show: false, animal: null, message: "", sending: false, error: null })}
                className="px-4 py-2 rounded bg-btn-gray text-white hover:bg-gray-700"
                disabled={medicalRequestModal.sending}
              >
                Cancel
              </button>
              <button
                onClick={handleMedicalRequest}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
                disabled={medicalRequestModal.sending}
              >
                {medicalRequestModal.sending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}