import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function H_AnimalTretmentDetils() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const navigate = useNavigate();

  // Status options with labels
  const statusOptions = [
    { value: "diagnosed", label: "Diagnosed", color: "bg-blue-100 text-blue-800" },
    { value: "active", label: "Under Treatment", color: "bg-yellow-100 text-yellow-800" },
    { value: "recovering", label: "Recovering", color: "bg-orange-100 text-orange-800" },
    { value: "completed", label: "Recovered", color: "bg-green-100 text-green-800" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" }
  ];

  useEffect(() => {
    fetchAnimalTreatments();
    fetchDropdownData();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm, selectedDate]);

  const fetchDropdownData = async () => {
    try {
      const [doctorsRes, specialistsRes, medicinesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/doctors"),
        axios.get("http://localhost:5000/api/specialists"),
        axios.get("http://localhost:5000/api/medistore")
      ]);
      setDoctors(doctorsRes.data);
      setSpecialists(specialistsRes.data);
      setMedicines(medicinesRes.data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const fetchAnimalTreatments = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await axios.get("http://localhost:5000/api/animal-treatments", {
        timeout: 15000,
      });
      
      console.log("✅ Animal treatments fetched:", response.data);
      if (response.data.success) {
        setRecords(response.data.data);
      } else {
        setError(response.data.error || "Failed to fetch animal treatments");
      }
    } catch (err) {
      console.error("❌ Error fetching animal treatments:", err);
      let errorMessage = "Failed to load animal treatment records";
      
      if (err.code === 'ECONNREFUSED') {
        errorMessage = "Cannot connect to server. Please make sure the backend is running on port 5000.";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
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

  const filterRecords = () => {
    let filtered = records;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.animalType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.animalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDoctorName(record.doctor).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getSpecialistName(record.specialist).toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter - show records for selected date only
    if (selectedDate) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.treatmentDate).toISOString().split('T')[0];
        return recordDate === selectedDate;
      });
    }

    setFilteredRecords(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDate("");
  };

  const generatePDF = () => {
    try {
      const dataToExport = filteredRecords.length > 0 ? filteredRecords : records;
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Animal Treatment Records - Mount Olive Farm House</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
                
                body {
                    font-family: 'Times New Roman', serif;
                    font-size: 11pt;
                    line-height: 1.2;
                    margin: 2cm;
                    color: #000;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 20px;
                }
                
                .farm-name {
                    font-size: 16pt;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                
                .report-title {
                    font-size: 14pt;
                    font-weight: bold;
                    margin-bottom: 15px;
                }
                
                .report-info {
                    font-size: 10pt;
                    margin-bottom: 5px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    font-size: 9pt;
                }
                
                th, td {
                    border: 1px solid #000;
                    padding: 6px 8px;
                    text-align: left;
                }
                
                th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 8pt;
                    color: #666;
                }
                
                .filter-info {
                    background-color: #f8f8f8;
                    padding: 10px;
                    margin: 15px 0;
                    border-left: 4px solid #007bff;
                    font-size: 10pt;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="farm-name">MOUNT OLIVE FARM HOUSE</div>
                <div class="report-title">ANIMAL TREATMENT RECORDS REPORT</div>
                <div class="report-info">Generated on: ${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</div>
                <div class="report-info">Total Records: ${dataToExport.length}</div>
            </div>

            ${(searchTerm || selectedDate) ? `
            <div class="filter-info">
                <strong>Filtered Records:</strong><br>
                ${searchTerm ? `Search: "${searchTerm}"<br>` : ''}
                ${selectedDate ? `Date: ${new Date(selectedDate).toLocaleDateString()}<br>` : ''}
            </div>
            ` : ''}

            <table>
                <thead>
                    <tr>
                        <th>Animal Type</th>
                        <th>Animal Code</th>
                        <th>Veterinary Surgeon</th>
                        <th>Specialist</th>
                        <th>Medicines</th>
                        <th>Status</th>
                        <th>Notes</th>
                        <th>Treatment Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${dataToExport.map(record => `
                        <tr>
                            <td>${record.animalType}</td>
                            <td>${record.animalCode}</td>
                            <td>${getDoctorName(record.doctor)}</td>
                            <td>${getSpecialistName(record.specialist)}</td>
                            <td>${record.medicines?.map(m => getMedicineName(m)).join(', ') || 'None'}</td>
                            <td>${statusOptions.find(s => s.value === record.status)?.label || record.status}</td>
                            <td>${record.notes || 'No notes'}</td>
                            <td>${new Date(record.treatmentDate).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">
                Page 1 of 1 • Mount Olive Farm House Animal Treatment Records
            </div>
        </body>
        </html>
      `;

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = function() {
        printWindow.print();
      };

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try printing the page instead.");
    }
  };

  // Alternative simple download as CSV
  const downloadCSV = () => {
    try {
      const dataToExport = filteredRecords.length > 0 ? filteredRecords : records;
      
      const headers = [
        'Animal Type',
        'Animal Code', 
        'Veterinary Surgeon',
        'Specialist',
        'Medicines',
        'Status',
        'Notes',
        'Treatment Date'
      ];
      
      const csvData = dataToExport.map(record => [
        record.animalType,
        record.animalCode,
        getDoctorName(record.doctor),
        getSpecialistName(record.specialist),
        record.medicines?.map(m => getMedicineName(m)).join(', ') || 'None',
        statusOptions.find(s => s.value === record.status)?.label || record.status,
        `"${(record.notes || 'No notes').replace(/"/g, '""')}"`,
        new Date(record.treatmentDate).toLocaleDateString()
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `animal_treatment_records_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Error downloading data. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this animal treatment record?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/animal-treatments/${id}`);
      setRecords(prev => prev.filter(rec => rec._id !== id));
      alert("Animal treatment record deleted successfully!");
    } catch (err) {
      console.error("Error deleting animal treatment:", err);
      alert("Failed to delete animal treatment record.");
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record._id);
    setEditFormData({
      animalType: record.animalType,
      animalCode: record.animalCode,
      doctor: record.doctor?._id || record.doctor,
      specialist: record.specialist?._id || record.specialist,
      status: record.status,
      notes: record.notes || "",
      medicines: record.medicines?.map(med => med._id || med) || []
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMedicineToggle = (medicineId) => {
    setEditFormData(prev => {
      const isSelected = prev.medicines.includes(medicineId);
      const newSelection = isSelected
        ? prev.medicines.filter(id => id !== medicineId)
        : [...prev.medicines, medicineId];
      return { ...prev, medicines: newSelection };
    });
  };

  const handleUpdate = async (id) => {
    try {
      const data = new FormData();
      data.append("animalType", editFormData.animalType);
      data.append("animalCode", editFormData.animalCode);
      data.append("doctor", editFormData.doctor);
      data.append("specialist", editFormData.specialist || "");
      data.append("status", editFormData.status);
      data.append("notes", editFormData.notes);
      data.append("medicines", JSON.stringify(editFormData.medicines));

      console.log("Updating record:", {
        animalType: editFormData.animalType,
        animalCode: editFormData.animalCode,
        doctor: editFormData.doctor,
        specialist: editFormData.specialist,
        status: editFormData.status,
        medicines: editFormData.medicines
      });

      const response = await axios.put(`http://localhost:5000/api/animal-treatments/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setRecords(prev => prev.map(rec => 
          rec._id === id ? response.data.data : rec
        ));
        setEditingRecord(null);
        alert("Animal treatment record updated successfully!");
      }
    } catch (err) {
      console.error("Error updating record:", err);
      alert("Failed to update record: " + (err.response?.data?.error || err.message));
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditFormData({});
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      console.log("Updating status for:", id, "to:", newStatus);
      
      const response = await axios.patch(`http://localhost:5000/api/animal-treatments/${id}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        setRecords(prev => prev.map(rec => 
          rec._id === id ? { ...rec, status: newStatus } : rec
        ));
        alert("Status updated successfully!");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status: " + (err.response?.data?.error || err.message));
    }
  };

  const handleViewDetails = (record) => {
    const statusInfo = statusOptions.find(s => s.value === record.status) || { label: record.status };
    
    const details = `
Animal Treatment Details:

Animal: ${record.animalType} (${record.animalCode})
Status: ${statusInfo.label}
Doctor: ${record.doctor?.fullName || 'N/A'}
Specialist: ${record.specialist?.fullName || 'N/A'}
Medicines: ${record.medicines?.map(m => getMedicineName(m)).join(', ') || 'None'}
Notes: ${record.notes || 'No notes'}
Treatment Date: ${new Date(record.treatmentDate).toLocaleDateString()}
Created: ${new Date(record.createdAt).toLocaleDateString()}
Last Updated: ${new Date(record.updatedAt).toLocaleDateString()}
    `.trim();
    
    alert(details);
  };

  const handleViewReport = (record) => {
    if (record.reports) {
      const reportUrl = `http://localhost:5000${record.reports}`;
      console.log("Opening report:", reportUrl);
      window.open(reportUrl, '_blank');
    } else {
      alert("No report available for this treatment.");
    }
  };

  const handleBackToTreatments = () => {
    navigate("/admin/treatments-details");
  };

  const handleAddNewTreatment = () => {
    navigate("/admin/H_AnimalTretmentAddFrom");
  };

  const handleRefresh = () => {
    fetchAnimalTreatments();
  };

  // Helper function to get medicine name safely
  const getMedicineName = (medicine) => {
    if (!medicine) return 'Unknown Medicine';
    if (typeof medicine === 'string') return medicine;
    return medicine.medicine_name || 'Medicine Name Not Available';
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || { label: status, color: "bg-gray-100 text-gray-800" };
  };

  // Helper to get doctor name safely
  const getDoctorName = (doctor) => {
    if (!doctor) return 'N/A';
    if (typeof doctor === 'string') {
      const foundDoctor = doctors.find(d => d._id === doctor);
      return foundDoctor ? foundDoctor.fullName : 'Unknown Doctor';
    }
    return doctor.fullName || 'N/A';
  };

  // Helper to get specialist name safely
  const getSpecialistName = (specialist) => {
    if (!specialist) return 'N/A';
    if (typeof specialist === 'string') {
      const foundSpecialist = specialists.find(s => s._id === specialist);
      return foundSpecialist ? foundSpecialist.fullName : 'Unknown Specialist';
    }
    return specialist.fullName || 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-beige dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-blue-700 mb-4">Loading animal treatment records...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        </div>
      </div>
    );
  }

  const displayRecords = filteredRecords.length > 0 ? filteredRecords : records;

  return (
    <div className="min-h-screen bg-light-beige dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg rounded-lg p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-700">
                Animal Treatment Records
              </h1>
              <p className="text-gray-600 mt-2">View and manage all animal treatment records from database</p>
            </div>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              {displayRecords.length} records
            </span>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Single Date Filter */}
              <div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Filter by date"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <span>🗑️</span>
                  Clear
                </button>
                <button
                  onClick={generatePDF}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <span>📄</span>
                  Print Report
                </button>
                <button
                  onClick={downloadCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <span>📊</span>
                  Download CSV
                </button>
              </div>
            </div>

            {/* Active Filters Info */}
            {(searchTerm || selectedDate) && (
              <div className="mt-3 text-sm text-gray-600">
                <strong>Active filters:</strong>
                {searchTerm && <span className="ml-2 bg-blue-100 px-2 py-1 rounded">Search: "{searchTerm}"</span>}
                {selectedDate && <span className="ml-2 bg-green-100 px-2 py-1 rounded">Date: {selectedDate}</span>}
                <span className="ml-2 text-blue-600">
                  Showing {displayRecords.length} of {records.length} records
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Error:</span>
                <button
                  onClick={handleRefresh}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  Retry
                </button>
              </div>
              <p className="mt-2">{error}</p>
              <p className="text-sm mt-2">
                💡 Make sure your backend server is running on http://localhost:5000
              </p>
            </div>
          )}

          {displayRecords.length === 0 && !error ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                {records.length === 0 ? "No animal treatment records found." : "No records match your search criteria."}
              </div>
              {(searchTerm || selectedDate) && (
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold transition-colors mb-4"
                >
                  Clear Filters
                </button>
              )}
              <br />
              <button
                onClick={handleAddNewTreatment}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-semibold transition-colors"
              >
                Add New Animal Treatment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-3 text-left">Animal Type</th>
                    <th className="border p-3 text-left">Animal Code</th>
                    <th className="border p-3 text-left">Veterinary Surgeon</th>
                    <th className="border p-3 text-left">Specialist</th>
                    <th className="border p-3 text-left">Medicines</th>
                    <th className="border p-3 text-left">Status</th>
                    <th className="border p-3 text-left">Notes</th>
                    <th className="border p-3 text-left">Treatment Date</th>
                    <th className="border p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRecords.map((rec) => (
                    <tr key={rec._id} className="hover:bg-gray-50 transition-colors">
                      <td className="border p-3 font-medium">
                        {editingRecord === rec._id ? (
                          <input
                            type="text"
                            name="animalType"
                            value={editFormData.animalType}
                            onChange={handleEditChange}
                            className="border p-1 rounded w-full"
                          />
                        ) : (
                          rec.animalType
                        )}
                      </td>
                      <td className="border p-3 font-mono bg-gray-50">
                        {editingRecord === rec._id ? (
                          <input
                            type="text"
                            name="animalCode"
                            value={editFormData.animalCode}
                            onChange={handleEditChange}
                            className="border p-1 rounded w-full"
                          />
                        ) : (
                          rec.animalCode
                        )}
                      </td>
                      <td className="border p-3">
                        {editingRecord === rec._id ? (
                          <select
                            name="doctor"
                            value={editFormData.doctor}
                            onChange={handleEditChange}
                            className="border p-1 rounded w-full"
                          >
                            <option value="">Select Doctor</option>
                            {doctors.map((d) => (
                              <option key={d._id} value={d._id}>
                                {d.fullName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          getDoctorName(rec.doctor)
                        )}
                      </td>
                      <td className="border p-3">
                        {editingRecord === rec._id ? (
                          <select
                            name="specialist"
                            value={editFormData.specialist}
                            onChange={handleEditChange}
                            className="border p-1 rounded w-full"
                          >
                            <option value="">Select Specialist</option>
                            {specialists.map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.fullName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          getSpecialistName(rec.specialist)
                        )}
                      </td>
                      <td className="border p-3">
                        {editingRecord === rec._id ? (
                          <div className="max-h-32 overflow-y-auto border p-2 rounded">
                            {medicines.map((med) => (
                              <label key={med._id} className="flex items-center space-x-2 text-sm mb-1">
                                <input
                                  type="checkbox"
                                  checked={editFormData.medicines.includes(med._id)}
                                  onChange={() => handleMedicineToggle(med._id)}
                                />
                                <span>
                                  {med.medicine_name} 
                                  <span className={`text-xs ml-2 ${
                                    med.quantity_available > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    ({med.quantity_available} {med.unit} available)
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="max-w-xs">
                            {rec.medicines && rec.medicines.length > 0 ? (
                              rec.medicines.map((med, index) => (
                                <div key={index} className="text-sm mb-1">
                                  • {getMedicineName(med)} 
                                  {med.quantity_available !== undefined && (
                                    <span className={`text-xs ml-2 ${
                                      med.quantity_available > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      ({med.quantity_available} {med.unit || 'units'})
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-500">No medicines</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="border p-3">
                        {editingRecord === rec._id ? (
                          <select
                            name="status"
                            value={editFormData.status}
                            onChange={handleEditChange}
                            className="border p-1 rounded w-full"
                          >
                            {statusOptions.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={rec.status}
                            onChange={(e) => handleStatusChange(rec._id, e.target.value)}
                            className={`px-2 py-1 rounded-full text-xs border-none ${getStatusInfo(rec.status).color}`}
                          >
                            {statusOptions.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="border p-3 max-w-xs">
                        {editingRecord === rec._id ? (
                          <textarea
                            name="notes"
                            value={editFormData.notes}
                            onChange={handleEditChange}
                            className="border p-1 rounded w-full"
                            rows="3"
                          />
                        ) : (
                          <div className="truncate" title={rec.notes}>
                            {rec.notes || <span className="text-gray-500">No notes</span>}
                          </div>
                        )}
                      </td>
                      <td className="border p-3 text-sm text-gray-600">
                        {new Date(rec.treatmentDate).toLocaleDateString()}
                      </td>
                      <td className="border p-3">
                        <div className="flex flex-col space-y-2">
                          {editingRecord === rec._id ? (
                            <>
                              <button
                                onClick={() => handleUpdate(rec._id)}
                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(rec)}
                                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleViewDetails(rec)}
                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm transition-colors"
                              >
                                View Details
                              </button>
                              {rec.reports && (
                                <button
                                  onClick={() => handleViewReport(rec)}
                                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm transition-colors"
                                >
                                  View Report
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(rec._id)}
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm transition-colors"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBackToTreatments}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-md font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Treatments
            </button>
            
            <div className="flex space-x-4">
              <button
                onClick={handleRefresh}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-semibold transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              
              <button
                onClick={handleAddNewTreatment}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Treatment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default H_AnimalTretmentDetils;