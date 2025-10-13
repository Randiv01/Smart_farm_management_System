import React, { useState, useEffect } from "react";
import axios from "axios";
import H_PlantPathologistForm from "./H_PlantPathologistForm.js";

import { FaWhatsapp } from "react-icons/fa";
import { FiMail, FiEdit2, FiTrash2 } from "react-icons/fi";

import hp1 from "../../../UserHome/Images/healthPlant1.webp";
import hp4 from "../../../UserHome/Images/healthplanat4.jpg";
import hp3 from "../../../UserHome/Images/healthplanat3.webp";
import hp2 from "../../../UserHome/Images/healthplanat2.jpg";

const API_BASE = "http://localhost:5000";

const H_PlantPathologist = () => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const slides = [hp1, hp4, hp3, hp2];
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/plant-pathologists`);
      setEntries(res.data);
      setFilteredEntries(res.data);
    } catch (err) {
      console.error("Error fetching plant pathologists:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [searchTerm, entries]);

  const filterEntries = () => {
    if (!searchTerm) {
      setFilteredEntries(entries);
      return;
    }
    
    const filtered = entries.filter((e) => {
      const searchableText = Object.values(e)
        .join(" ")
        .toLowerCase();
      return searchableText.includes(searchTerm.toLowerCase());
    });
    setFilteredEntries(filtered);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await axios.delete(`${API_BASE}/api/plant-pathologists/${id}`);
      fetchEntries();
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry._id);
    setInitialData(entry);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setInitialData(null);
    setShowForm(true);
  };

  const handleDownloadPDF = () => {
    try {
      const dataToExport = filteredEntries;
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Plant Pathologist Records - Mount Olive Farm House</title>
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
                
                .page-break {
                    page-break-after: always;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="farm-name">MOUNT OLIVE FARM HOUSE</div>
                <div class="report-title">PLANT PATHOLOGIST RECORDS REPORT</div>
                <div class="report-info">Generated on: ${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</div>
                <div class="report-info">Total Records: ${dataToExport.length}</div>
            </div>

            ${searchTerm ? `
            <div class="filter-info">
                <strong>Filtered Records:</strong><br>
                Search: "${searchTerm}"<br>
            </div>
            ` : ''}

            <table>
                <thead>
                    <tr>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>License Number</th>
                        <th>Specializations</th>
                        <th>Qualifications</th>
                        <th>Experience (Years)</th>
                        <th>Date of Birth</th>
                        <th>Gender</th>
                    </tr>
                </thead>
                <tbody>
                    ${dataToExport.map(pathologist => `
                        <tr>
                            <td>${pathologist.fullName || 'N/A'}</td>
                            <td>${pathologist.email || 'N/A'}</td>
                            <td>${pathologist.phoneNo || 'N/A'}</td>
                            <td>${pathologist.licenseNumber || 'N/A'}</td>
                            <td>${Array.isArray(pathologist.specializations) ? 
                                 pathologist.specializations.join(', ') : 
                                 pathologist.specializations || 'N/A'}</td>
                            <td>${pathologist.qualifications || 'N/A'}</td>
                            <td>${pathologist.yearsOfExperience || '0'}</td>
                            <td>${pathologist.dateOfBirth ? 
                                 new Date(pathologist.dateOfBirth).toLocaleDateString() : 
                                 'N/A'}</td>
                            <td>${pathologist.gender || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">
                Page 1 of 1 • Mount Olive Farm House Plant Pathologist Records
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
      const dataToExport = filteredEntries;
      
      const headers = [
        'Full Name',
        'Email', 
        'Phone',
        'License Number',
        'Specializations',
        'Qualifications',
        'Experience (Years)',
        'Date of Birth',
        'Gender'
      ];
      
      const csvData = dataToExport.map(pathologist => [
        pathologist.fullName || 'N/A',
        pathologist.email || 'N/A',
        pathologist.phoneNo || 'N/A',
        pathologist.licenseNumber || 'N/A',
        Array.isArray(pathologist.specializations) ? 
          pathologist.specializations.join('; ') : 
          pathologist.specializations || 'N/A',
        pathologist.qualifications || 'N/A',
        pathologist.yearsOfExperience || '0',
        pathologist.dateOfBirth ? 
          new Date(pathologist.dateOfBirth).toLocaleDateString() : 
          'N/A',
        pathologist.gender || 'N/A'
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
      link.setAttribute('download', `plant_pathologists_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Error downloading data. Please try again.");
    }
  };

  const formatWhatsAppNumber = (input) => {
    if (!input) return "";
    const digits = String(input).replace(/[^\d]/g, "");
    return digits;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
          <img
            src={slides[slideIndex]}
            alt="Plant pathologist slide"
            className="w-full h-64 md:h-80 lg:h-96 object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow">
              Plant Pathologist Details
            </h1>
            <p className="mt-3 text-lg md:text-2xl font-semibold drop-shadow">
              Manage and view plant pathologist profiles
            </p>
          </div>
          <div className="absolute bottom-3 right-4 flex space-x-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-all ${i === slideIndex ? "bg-white" : "bg-white/60"}`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between items-center mb-6 space-y-3 md:space-y-0">
          <div className="flex flex-wrap gap-2">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center gap-2"
              onClick={handleAddNew}
            >
              <span>➕</span>
              Add New Plant Pathologist
            </button>
            <button
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition flex items-center gap-2"
              onClick={handleDownloadPDF}
            >
              <span>📄</span>
              Print Report
            </button>
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
              onClick={downloadCSV}
            >
              <span>📊</span>
              Download CSV
            </button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search pathologists..."
              className="w-full md:w-80 border border-gray-300 px-4 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center gap-2"
              onClick={() => setSearchTerm(searchInput)}
            >
              <span>🔍</span>
              Search
            </button>
            {(searchTerm || searchInput) && (
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                onClick={() => {
                  setSearchTerm("");
                  setSearchInput("");
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Info */}
        {searchTerm && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">
              <strong>Active filters:</strong>
              <span className="ml-2 bg-green-100 px-2 py-1 rounded">Search: "{searchTerm}"</span>
              <span className="ml-2 text-green-600">
                Showing {filteredEntries.length} of {entries.length} records
              </span>
            </div>
          </div>
        )}

        {showForm && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
            <H_PlantPathologistForm
              id={editingId}
              initialData={initialData}
              onSuccess={() => {
                setShowForm(false);
                setEditingId(null);
                setInitialData(null);
                fetchEntries();
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingId(null);
                setInitialData(null);
              }}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Loading plant pathologists...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">
              {entries.length === 0 ? "No plant pathologist records found." : "No records match your search criteria."}
            </p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSearchInput("");
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-semibold transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full table-auto">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Photo</th>
                  <th className="px-4 py-3 text-left">Full Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">License</th>
                  <th className="px-4 py-3 text-left">Specializations</th>
                  <th className="px-4 py-3 text-left">Qualifications</th>
                  <th className="px-4 py-3 text-left">Experience</th>
                  <th className="px-4 py-3 text-left">DOB</th>
                  <th className="px-4 py-3 text-left">Gender</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                  <th className="px-4 py-3 text-left">Direct Contact</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((d) => {
                  const waNumber = String(d.phoneNo || "").replace(/[^\d]/g, "");
                  const hasPhoto = d.profilePhoto && d.profilePhoto !== "null";
                  return (
                    <tr key={d._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {hasPhoto ? (
                          <img
                            src={`${API_BASE}/Health_Uploads/${d.profilePhoto}`}
                            alt={d.fullName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-green-500"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                            {d.fullName ? d.fullName.charAt(0) : "?"}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{d.fullName}</td>
                      <td className="px-4 py-3">{d.email}</td>
                      <td className="px-4 py-3">{d.phoneNo}</td>
                      <td className="px-4 py-3">{d.licenseNumber}</td>
                      <td className="px-4 py-3">
                        {Array.isArray(d.specializations) ? d.specializations.join(", ") : d.specializations}
                      </td>
                      <td className="px-4 py-3">{d.qualifications}</td>
                      <td className="px-4 py-3">{d.yearsOfExperience}</td>
                      <td className="px-4 py-3">{d.dateOfBirth ? d.dateOfBirth.split("T")[0] : ""}</td>
                      <td className="px-4 py-3">{d.gender}</td>

                      <td className="px-4 py-3">
                        <div className="flex space-x-2 items-center">
                          <button
                            title="Edit"
                            aria-label="Edit"
                            onClick={() => handleEdit(d)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            <FiEdit2 size={28} className="text-amber-500 hover:text-amber-600 hover:scale-110 transition-transform" />
                          </button>
                          <button
                            title="Delete"
                            aria-label="Delete"
                            onClick={() => handleDelete(d._id)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            <FiTrash2 size={28} className="text-red-500 hover:text-red-600 hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex space-x-2 items-center">
                          {waNumber ? (
                            <a
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              title="WhatsApp"
                              aria-label="WhatsApp"
                            >
                              <FaWhatsapp size={28} className="text-green-500 hover:text-green-600 hover:scale-110 transition-transform" />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">No WhatsApp</span>
                          )}
                          {d.email ? (
                            <a
                              href={`mailto:${d.email}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              title="Email"
                              aria-label="Email"
                            >
                              <FiMail size={28} className="text-blue-500 hover:text-blue-600 hover:scale-110 transition-transform" />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">No Email</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default H_PlantPathologist;