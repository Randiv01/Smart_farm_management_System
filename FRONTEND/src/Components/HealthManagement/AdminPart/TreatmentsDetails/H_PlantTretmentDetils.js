import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function H_PlantTretmentDetils() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [pathologists, setPathologists] = useState([]);
  const [fertilisers, setFertilisers] = useState([]);
  const [plantTypes, setPlantTypes] = useState([
    "Tomato", "Potato", "Cabbage", "Carrot", "Lettuce", "Spinach"
  ]);
  const [newPlantType, setNewPlantType] = useState("");
  const navigate = useNavigate();

  const API_BASE = "http://localhost:5000";

  useEffect(() => {
    fetchPlantTreatments();
    fetchDropdownData();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm, selectedDate]);

  const fetchPlantTreatments = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await axios.get(`${API_BASE}/api/plant-treatments`, {
        timeout: 15000,
      });
      
      if (response.data.success) {
        setRecords(response.data.data || []);
      } else {
        setError("Failed to fetch plant treatments");
      }
    } catch (err) {
      console.error("❌ Error fetching plant treatments:", err);
      let errorMessage = "Failed to load plant treatment records";
      
      if (err.code === 'ECONNREFUSED') {
        errorMessage = "Cannot connect to server. Please make sure the backend is running.";
      } else if (err.response) {
        errorMessage = `Server Error: ${err.response.data.error || 'Unknown error'}`;
      } else if (err.request) {
        errorMessage = "No response from server. Please check your connection.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [pathologistsRes, fertilisersRes] = await Promise.all([
        axios.get(`${API_BASE}/api/plant-pathologists`),
        axios.get(`${API_BASE}/api/fertilisers`),
      ]);

      setPathologists(pathologistsRes.data?.data || pathologistsRes.data || []);
      setFertilisers(fertilisersRes.data?.data || fertilisersRes.data || []);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.plantType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.plantCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.pathologist?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.pestControl?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDate) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.treatmentDate).toISOString().split('T')[0];
        return recordDate === selectedDate;
      });
    }

    setFilteredRecords(filtered);
  };

  // Professional PDF Report Generation
  const handleDownloadPDF = () => {
    try {
      const dataToExport = filteredRecords;
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Plant Treatment Records - Mount Olive Farm House</title>
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
                    font-size: 8pt;
                }
                
                th, td {
                    border: 1px solid #000;
                    padding: 5px 6px;
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
                    font-size: 9pt;
                }
                
                .status-scheduled { background-color: #fef3c7; color: #d97706; }
                .status-in-progress { background-color: #dbeafe; color: #1d4ed8; }
                .status-completed { background-color: #dcfce7; color: #16a34a; }
                
                .status-badge {
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 7pt;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="farm-name">MOUNT OLIVE FARM HOUSE</div>
                <div class="report-title">PLANT TREATMENT RECORDS REPORT</div>
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
                ${selectedDate ? `Date: ${selectedDate}<br>` : ''}
            </div>
            ` : ''}

            <table>
                <thead>
                    <tr>
                        <th>Plant Type</th>
                        <th>Plant Code</th>
                        <th>Pathologist</th>
                        <th>Fertiliser Used</th>
                        <th>Pest Control</th>
                        <th>Status</th>
                        <th>Effectiveness</th>
                        <th>Treatment Date</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${dataToExport.map(treatment => {
                      const statusClass = `status-${treatment.status?.replace('-', '') || 'scheduled'}`;
                      const statusText = treatment.status ? 
                        treatment.status.charAt(0).toUpperCase() + treatment.status.slice(1).replace('-', ' ') : 
                        'Scheduled';
                      
                      const fertiliserInfo = treatment.fertiliser ? 
                        (typeof treatment.fertiliser === 'object' && treatment.fertiliser.name ? 
                          treatment.fertiliser.name : 
                          'Fertiliser ID: ' + (treatment.fertiliser._id || treatment.fertiliser).substring(0, 8)) : 
                        'Not specified';
                      
                      return `
                        <tr>
                            <td>${treatment.plantType || 'N/A'}</td>
                            <td>${treatment.plantCode || 'N/A'}</td>
                            <td>${treatment.pathologist?.fullName || 'N/A'}</td>
                            <td>${fertiliserInfo}</td>
                            <td>${treatment.pestControl || 'Not specified'}</td>
                            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                            <td>${treatment.effectiveness || '0'}%</td>
                            <td>${treatment.treatmentDate ? 
                                 new Date(treatment.treatmentDate).toLocaleDateString() : 
                                 'N/A'}</td>
                            <td>${treatment.notes || 'No notes'}</td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>

            <div class="footer">
                Page 1 of 1 • Mount Olive Farm House Plant Treatment Records
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

  // Download as CSV
  const downloadCSV = () => {
    try {
      const dataToExport = filteredRecords;
      
      const headers = [
        'Plant Type',
        'Plant Code', 
        'Pathologist',
        'Fertiliser Used',
        'Pest Control',
        'Status',
        'Effectiveness (%)',
        'Treatment Date',
        'Notes'
      ];
      
      const csvData = dataToExport.map(treatment => [
        treatment.plantType || 'N/A',
        treatment.plantCode || 'N/A',
        treatment.pathologist?.fullName || 'N/A',
        treatment.fertiliser ? 
          (typeof treatment.fertiliser === 'object' && treatment.fertiliser.name ? 
            treatment.fertiliser.name : 
            'Fertiliser ID: ' + (treatment.fertiliser._id || treatment.fertiliser).substring(0, 8)) : 
          'Not specified',
        treatment.pestControl || 'Not specified',
        treatment.status ? 
          treatment.status.charAt(0).toUpperCase() + treatment.status.slice(1).replace('-', ' ') : 
          'Scheduled',
        treatment.effectiveness || '0',
        treatment.treatmentDate ? 
          new Date(treatment.treatmentDate).toLocaleDateString() : 
          'N/A',
        treatment.notes || 'No notes'
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(field => 
          `"${String(field).replace(/"/g, '""')}"`
        ).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `plant_treatments_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Error downloading data. Please try again.");
    }
  };

  // Edit Functions
  const handleEdit = (record) => {
    setEditingId(record._id);
    setEditFormData({
      plantType: record.plantType || "",
      plantCode: record.plantCode || "",
      pathologist: record.pathologist?._id || record.pathologist || "",
      fertiliser: record.fertiliser?._id || record.fertiliser || "",
      pestControl: record.pestControl || "",
      treatmentDate: record.treatmentDate ? new Date(record.treatmentDate).toISOString().split('T')[0] : "",
      notes: record.notes || "",
      status: record.status || "scheduled",
      effectiveness: record.effectiveness || 0,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === "effectiveness" ? Number(value) : value
    }));
  };

  const handleAddPlantType = () => {
    const val = newPlantType.trim();
    if (val && !plantTypes.includes(val)) {
      setPlantTypes(prev => [...prev, val]);
      setEditFormData(prev => ({ ...prev, plantType: val }));
      setNewPlantType("");
    }
  };

  const handleUpdate = async (id) => {
    try {
      const response = await axios.put(
        `${API_BASE}/api/plant-treatments/${id}`,
        editFormData
      );

      if (response.data.success) {
        // Update the record in local state
        setRecords(prev => prev.map(record => 
          record._id === id ? response.data.data : record
        ));
        setEditingId(null);
        setEditFormData({});
        alert("✅ Treatment updated successfully!\nFertiliser stock has been automatically adjusted.");
      }
    } catch (error) {
      console.error("Error updating treatment:", error);
      alert(error.response?.data?.error || "Failed to update treatment");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plant treatment record?\n\n⚠️ This will restore the fertiliser stock if one was used.")) return;
    try {
      await axios.delete(`${API_BASE}/api/plant-treatments/${id}`);
      setRecords(prev => prev.filter(rec => rec._id !== id));
      alert("✅ Plant treatment record deleted successfully!\nFertiliser stock has been restored.");
    } catch (err) {
      console.error("Error deleting plant treatment:", err);
      alert("Failed to delete plant treatment record.");
    }
  };

  const handleViewDetails = (record) => {
    let fertiliserInfo = 'No fertiliser selected';
    if (record.fertiliser) {
      if (typeof record.fertiliser === 'string') {
        fertiliserInfo = `Fertiliser ID: ${record.fertiliser} (Data not populated)`;
      } else if (record.fertiliser.name) {
        fertiliserInfo = `${record.fertiliser.name} (Current Stock: ${record.fertiliser.currentStock} ${record.fertiliser.unit}, Type: ${record.fertiliser.type})`;
      } else {
        fertiliserInfo = `Fertiliser ID: ${record.fertiliser._id} (Population failed)`;
      }
    }
    
    alert(`Plant Treatment Details:\n\nPlant: ${record.plantType} (${record.plantCode})\nPathologist: ${record.pathologist?.fullName || 'N/A'}\nFertiliser: ${fertiliserInfo}\nPest Control: ${record.pestControl || 'Not specified'}\nStatus: ${record.status}\nEffectiveness: ${record.effectiveness}%\nDate: ${new Date(record.treatmentDate).toLocaleDateString()}\nNotes: ${record.notes || 'No notes'}`);
  };

  // Helper functions
  const getFertiliserDisplayName = (fertiliser) => {
    if (!fertiliser) return 'No fertiliser selected';
    if (typeof fertiliser === 'string') return `Fertiliser ID: ${fertiliser.substring(0, 8)}...`;
    if (fertiliser && typeof fertiliser === 'object' && fertiliser.name) {
      return fertiliser.name;
    }
    return 'Fertiliser data not available';
  };

  const renderFertiliserInfo = (fertiliser) => {
    if (typeof fertiliser === 'string') {
      return (
        <div className="text-orange-500 italic">
          Fertiliser ID: {fertiliser.substring(0, 8)}...
          <br />
          <span className="text-xs">(Data not populated)</span>
        </div>
      );
    }
    
    if (fertiliser && typeof fertiliser === 'object' && Object.keys(fertiliser).length === 1 && fertiliser._id) {
      return (
        <div className="text-orange-500 italic">
          Fertiliser ID: {fertiliser._id.substring(0, 8)}...
          <br />
          <span className="text-xs">(Population failed - only ID available)</span>
        </div>
      );
    }
    
    if (fertiliser && typeof fertiliser === 'object' && fertiliser.name) {
      return (
        <div className="max-w-xs">
          <div className="font-medium text-green-700">
            {fertiliser.name}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Stock:</span> {fertiliser.currentStock} {fertiliser.unit}
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-medium">Type:</span> {fertiliser.type}
          </div>
          {fertiliser.company && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Company:</span> {fertiliser.company}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="text-gray-500 italic">No fertiliser selected</div>
    );
  };

  // Render editable row
  const renderEditableRow = (record) => {
    const selectedFertiliser = fertilisers.find(f => f._id === editFormData.fertiliser);

    return (
      <tr key={record._id} className="bg-yellow-50">
        <td className="border p-2">
          <div className="flex items-center space-x-2">
            <select
              name="plantType"
              value={editFormData.plantType}
              onChange={handleEditChange}
              className="border p-1 rounded flex-1 text-sm"
              required
            >
              <option value="">Select Plant Type</option>
              {plantTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="New type"
              value={newPlantType}
              onChange={(e) => setNewPlantType(e.target.value)}
              className="border p-1 rounded flex-1 text-sm"
            />
            <button
              type="button"
              onClick={handleAddPlantType}
              className="bg-green-600 text-white px-2 py-1 rounded text-xs"
            >
              +
            </button>
          </div>
        </td>
        
        <td className="border p-2">
          <input
            type="text"
            name="plantCode"
            value={editFormData.plantCode}
            onChange={handleEditChange}
            className="border p-1 rounded w-full text-sm font-mono"
            required
          />
        </td>
        
        <td className="border p-2">
          <select
            name="pathologist"
            value={editFormData.pathologist}
            onChange={handleEditChange}
            className="border p-1 rounded w-full text-sm"
            required
          >
            <option value="">Select Pathologist</option>
            {pathologists.map((p) => (
              <option key={p._id} value={p._id}>
                {p.fullName || p.name}
              </option>
            ))}
          </select>
        </td>
        
        <td className="border p-2">
          <select
            name="fertiliser"
            value={editFormData.fertiliser}
            onChange={handleEditChange}
            className="border p-1 rounded w-full text-sm"
          >
            <option value="">Select Fertiliser</option>
            {fertilisers.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name} - {f.currentStock} {f.unit}
              </option>
            ))}
          </select>
          {selectedFertiliser && (
            <div className="text-xs text-green-600 mt-1">
              Current Stock: {selectedFertiliser.currentStock} {selectedFertiliser.unit}
            </div>
          )}
        </td>
        
        <td className="border p-2">
          <select
            name="pestControl"
            value={editFormData.pestControl}
            onChange={handleEditChange}
            className="border p-1 rounded w-full text-sm"
          >
            <option value="">Select Pest Control</option>
            <option value="Organic Spray">Organic Spray</option>
            <option value="Chemical Pesticide">Chemical Pesticide</option>
            <option value="Biological Control">Biological Control</option>
            <option value="Manual Removal">Manual Removal</option>
            <option value="Preventive Measures">Preventive Measures</option>
          </select>
        </td>
        
        <td className="border p-2">
          <select
            name="status"
            value={editFormData.status}
            onChange={handleEditChange}
            className="border p-1 rounded w-full text-sm"
          >
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </td>
        
        <td className="border p-2">
          <div className="flex items-center space-x-2">
            <input
              type="range"
              name="effectiveness"
              min="0"
              max="100"
              value={editFormData.effectiveness}
              onChange={handleEditChange}
              className="w-16"
            />
            <span className="text-sm">{editFormData.effectiveness}%</span>
          </div>
        </td>
        
        <td className="border p-2">
          <input
            type="date"
            name="treatmentDate"
            value={editFormData.treatmentDate}
            onChange={handleEditChange}
            className="border p-1 rounded w-full text-sm"
            required
          />
        </td>
        
        <td className="border p-2">
          <textarea
            name="notes"
            value={editFormData.notes}
            onChange={handleEditChange}
            className="border p-1 rounded w-full text-sm"
            rows="2"
          />
        </td>
        
        <td className="border p-2">
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => handleUpdate(record._id)}
              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
            >
               Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
            >
               Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // Render normal row
  const renderNormalRow = (record) => (
    <tr key={record._id} className="hover:bg-gray-50 transition-colors">
      <td className="border p-3 font-medium">{record.plantType}</td>
      <td className="border p-3 font-mono bg-gray-50">{record.plantCode}</td>
      <td className="border p-3">{record.pathologist?.fullName || "N/A"}</td>
      <td className="border p-3">{renderFertiliserInfo(record.fertiliser)}</td>
      <td className="border p-3">
        <span className={`px-2 py-1 rounded-full text-xs ${
          record.pestControl === 'Organic Spray' ? 'bg-green-100 text-green-800' :
          record.pestControl === 'Chemical Pesticide' ? 'bg-yellow-100 text-yellow-800' :
          record.pestControl === 'Biological Control' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {record.pestControl || 'Not specified'}
        </span>
      </td>
      <td className="border p-3">
        <span className={`px-2 py-1 rounded-full text-xs ${
          record.status === 'completed' ? 'bg-green-100 text-green-800' :
          record.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
          record.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {record.status}
        </span>
      </td>
      <td className="border p-3">
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${record.effectiveness}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-600">{record.effectiveness}%</span>
        </div>
      </td>
      <td className="border p-3 text-sm">
        {new Date(record.treatmentDate).toLocaleDateString()}
      </td>
      <td className="border p-3 max-w-xs">
        <div className="truncate" title={record.notes}>
          {record.notes || <span className="text-gray-500">No notes</span>}
        </div>
      </td>
      <td className="border p-3">
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => handleEdit(record)}
            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm transition-colors"
          >
             Edit
          </button>
          <button
            onClick={() => handleViewDetails(record)}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm transition-colors"
          >
             View
          </button>
          {record.reports && (
            <button
              onClick={() => window.open(`${API_BASE}${record.reports}`, '_blank')}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm transition-colors"
            >
               Report
            </button>
          )}
          <button
            onClick={() => handleDelete(record._id)}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm transition-colors"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-green-700 mb-4">Loading plant treatment records...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
        </div>
      </div>
    );
  }

  const displayRecords = filteredRecords.length > 0 ? filteredRecords : records;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-green-700">
                Plant Treatment Records
              </h1>
              <p className="text-gray-600 mt-2">View and manage all plant treatment records</p>
              <p className="text-sm text-blue-600 mt-1">
                💡 <strong>Auto Stock Management:</strong> Fertiliser stock decreases by 1 unit when used in treatments
              </p>
            </div>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
              {displayRecords.length} records
            </span>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex flex-col md:flex-row md:justify-between items-center mb-6 space-y-3 md:space-y-0">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate("/admin/H_PlantTretmentAddFrom")}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center gap-2"
                >
                  <span>➕</span>
                  Add New Treatment
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition flex items-center gap-2"
                >
                  <span>📄</span>
                  Print Report
                </button>
                <button
                  onClick={downloadCSV}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <span>📊</span>
                  Download CSV
                </button>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 px-4 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search plant treatments..."
                  className="w-full md:w-80 border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={() => setSearchTerm(searchInput)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center gap-2"
                >
                  <span>🔍</span>
                  Search
                </button>
                {(searchTerm || searchInput || selectedDate) && (
                  <button
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                    onClick={() => {
                      setSearchTerm("");
                      setSearchInput("");
                      setSelectedDate("");
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {(searchTerm || selectedDate) && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-800">
                  <strong>Active filters:</strong>
                  {searchTerm && (
                    <span className="ml-2 bg-green-100 px-2 py-1 rounded">Search: "{searchTerm}"</span>
                  )}
                  {selectedDate && (
                    <span className="ml-2 bg-green-100 px-2 py-1 rounded">Date: {selectedDate}</span>
                  )}
                  <span className="ml-2 text-green-600">
                    Showing {displayRecords.length} of {records.length} records
                  </span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Error:</span>
                <button
                  onClick={fetchPlantTreatments}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                >
                  Retry
                </button>
              </div>
              <p className="mt-2">{error}</p>
            </div>
          )}

          {displayRecords.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                {records.length === 0 ? "No plant treatment records found." : "No records match your search criteria."}
              </div>
              <button
                onClick={() => navigate("/admin/H_PlantTretmentAddFrom")}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-semibold transition-colors"
              >
                Add New Plant Treatment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-3 text-left">Plant Type</th>
                    <th className="border p-3 text-left">Plant Code</th>
                    <th className="border p-3 text-left">Pathologist</th>
                    <th className="border p-3 text-left">Fertiliser Used</th>
                    <th className="border p-3 text-left">Pest Control</th>
                    <th className="border p-3 text-left">Status</th>
                    <th className="border p-3 text-left">Effectiveness</th>
                    <th className="border p-3 text-left">Treatment Date</th>
                    <th className="border p-3 text-left">Notes</th>
                    <th className="border p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRecords.map((record) => 
                    editingId === record._id ? renderEditableRow(record) : renderNormalRow(record)
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-md font-semibold transition-colors flex items-center gap-2"
            >
              ← Back
            </button>
            
            <div className="flex space-x-4">
              <button
                onClick={fetchPlantTreatments}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold transition-colors flex items-center gap-2"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default H_PlantTretmentDetils;