// frontend/src/components/H_SpecialistDetails.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import H_SpecialistForm from "./H_SpecialistForm.js";

// React Icons (replacing PNGs)
import { FaWhatsapp } from "react-icons/fa";
import { FiMail, FiEdit2, FiTrash2 } from "react-icons/fi";

// Hero slideshow images (adjust paths if needed)
import sp1 from "../../../UserHome/Images/specilist1.jpg";
import sp2 from "../../../UserHome/Images/specilist2.jpg";
import sp3 from "../../../UserHome/Images/specilist3.jpg";
import sp4 from "../../../UserHome/Images/specilist4.jpg";

const API_BASE = "http://localhost:5000";

const H_SpecialistDetails = () => {
  const [specialists, setSpecialists] = useState([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("darkMode");
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

  // Hero slideshow (same size/style as other pages)
  const slides = [sp1, sp2, sp3, sp4];
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 6000); // 6 seconds
    return () => clearInterval(id);
  }, [slides.length]);

  // Listen for dark mode changes
  useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem("darkMode");
      if (savedTheme) {
        setDarkMode(JSON.parse(savedTheme));
      }
    };

    window.addEventListener("storage", handleThemeChange);
    const interval = setInterval(handleThemeChange, 1000);

    return () => {
      window.removeEventListener("storage", handleThemeChange);
      clearInterval(interval);
    };
  }, []);

  // Apply dark mode class to body for full page styling
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  // Fetch all specialists
  const fetchSpecialists = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/api/specialists`);
      setSpecialists(res.data);
      setFilteredSpecialists(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch specialists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialists();
  }, []);

  useEffect(() => {
    filterSpecialists();
  }, [searchTerm, specialists]);

  const filterSpecialists = () => {
    if (!searchTerm) {
      setFilteredSpecialists(specialists);
      return;
    }
    
    const filtered = specialists.filter((s) => {
      const searchableText = Object.values(s)
        .join(" ")
        .toLowerCase();
      return searchableText.includes(searchTerm.toLowerCase());
    });
    setFilteredSpecialists(filtered);
  };

  // Delete specialist
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this specialist?")) return;
    try {
      await axios.delete(`${API_BASE}/api/specialists/${id}`);
      fetchSpecialists();
    } catch (err) {
      console.error(err);
      alert("Failed to delete specialist");
    }
  };

  // Edit specialist
  const handleEdit = (specialist) => {
    setEditingId(specialist._id);
    setShowForm(true);
  };

  // Add new specialist
  const handleAddNew = () => {
    setEditingId(null);
    setShowForm(true);
  };

  // Professional PDF Report Generation
  const handleDownloadPDF = () => {
    try {
      const dataToExport = filteredSpecialists;
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Specialist Records - Mount Olive Farm House</title>
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
                <div class="report-title">SPECIALIST RECORDS REPORT</div>
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
                        <th>Medical License</th>
                        <th>Specializations</th>
                        <th>Qualifications</th>
                        <th>Experience (Years)</th>
                        <th>Date of Birth</th>
                        <th>Gender</th>
                    </tr>
                </thead>
                <tbody>
                    ${dataToExport.map(specialist => `
                        <tr>
                            <td>${specialist.fullName || 'N/A'}</td>
                            <td>${specialist.email || 'N/A'}</td>
                            <td>${specialist.phoneNo || 'N/A'}</td>
                            <td>${specialist.medicalLicenseNumber || 'N/A'}</td>
                            <td>${Array.isArray(specialist.specializations) ? 
                                 specialist.specializations.join(', ') : 
                                 specialist.specializations || 'N/A'}</td>
                            <td>${specialist.qualifications || 'N/A'}</td>
                            <td>${specialist.yearsOfExperience || '0'}</td>
                            <td>${specialist.dateOfBirth ? 
                                 new Date(specialist.dateOfBirth).toLocaleDateString() : 
                                 'N/A'}</td>
                            <td>${specialist.gender || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">
                Page 1 of 1 • Mount Olive Farm House Specialist Records
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
      const dataToExport = filteredSpecialists;
      
      const headers = [
        'Full Name',
        'Email', 
        'Phone',
        'Medical License Number',
        'Specializations',
        'Qualifications',
        'Experience (Years)',
        'Date of Birth',
        'Gender'
      ];
      
      const csvData = dataToExport.map(specialist => [
        specialist.fullName || 'N/A',
        specialist.email || 'N/A',
        specialist.phoneNo || 'N/A',
        specialist.medicalLicenseNumber || 'N/A',
        Array.isArray(specialist.specializations) ? 
          specialist.specializations.join('; ') : 
          specialist.specializations || 'N/A',
        specialist.qualifications || 'N/A',
        specialist.yearsOfExperience || '0',
        specialist.dateOfBirth ? 
          new Date(specialist.dateOfBirth).toLocaleDateString() : 
          'N/A',
        specialist.gender || 'N/A'
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
      link.setAttribute('download', `specialists_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Error downloading data. Please try again.");
    }
  };

  // Sanitize number for wa.me (digits only)
  const formatWhatsAppNumber = (input) => {
    if (!input) return "";
    const digits = String(input).replace(/[^\d]/g, "");
    return digits;
  };

  return (
    <div
      className={`min-h-screen p-6 font-sans transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto">

        {/* Hero Slideshow */}
        <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
          <img
            src={slides[slideIndex]}
            alt="Specialist details slide"
            className="w-full h-64 md:h-80 lg:h-96 object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow">
              Mount Olive Specialist Details
            </h1>
            <p className="mt-3 text-lg md:text-2xl font-semibold drop-shadow">
              Profiles, contacts and expertise
            </p>
          </div>
          {/* Dots */}
          <div className="absolute bottom-3 right-4 flex space-x-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  i === slideIndex ? "bg-white" : "bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:justify-between items-center mb-6 space-y-3 md:space-y-0">
          <div className="flex flex-wrap gap-2">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center gap-2"
              onClick={handleAddNew}
            >
              <span>➕</span>
              Add New Specialist
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
              placeholder="Search specialists..."
              className={`w-full md:w-80 border px-4 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                darkMode 
                  ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" 
                  : "border-gray-300 text-gray-900"
              }`}
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
          <div className={`mb-4 p-3 rounded-lg border ${
            darkMode ? "bg-green-900 border-green-700" : "bg-green-50 border-green-200"
          }`}>
            <div className={`text-sm ${darkMode ? "text-green-200" : "text-green-800"}`}>
              <strong>Active filters:</strong>
              <span className={`ml-2 px-2 py-1 rounded ${
                darkMode ? "bg-green-800" : "bg-green-100"
              }`}>Search: "{searchTerm}"</span>
              <span className={`ml-2 ${darkMode ? "text-green-300" : "text-green-600"}`}>
                Showing {filteredSpecialists.length} of {specialists.length} records
              </span>
            </div>
          </div>
        )}

        {/* Specialist Form */}
        {showForm && (
          <div className={`mb-6 p-4 rounded-lg shadow border ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <H_SpecialistForm
              specialistId={editingId}
              onSuccess={() => {
                setShowForm(false);
                setEditingId(null);
                fetchSpecialists();
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            />
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className={`mt-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Loading specialists...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className={`text-lg ${darkMode ? "text-red-400" : "text-red-600"}`}>
              {error}
            </p>
          </div>
        ) : filteredSpecialists.length === 0 ? (
          <div className="text-center py-12 rounded-lg shadow">
            <p className={`text-lg mb-4 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
              {specialists.length === 0 ? "No specialist records found." : "No records match your search criteria."}
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
          <div className={`overflow-x-auto rounded-lg shadow-lg transition-colors duration-300 ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <table className="w-full table-auto">
              <thead
                className={`transition-colors duration-300 ${
                  darkMode ? "bg-gray-700 text-gray-100" : "bg-green-600 text-white"
                }`}
              >
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
                  <th className="px-4 py-3 text-left">Direct Contact</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody
                className={`transition-colors duration-300 ${
                  darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
                }`}
              >
                {filteredSpecialists.map((s) => {
                  const waNumber = formatWhatsAppNumber(s.phoneNo);
                  const hasPhoto = s.profilePhoto && s.profilePhoto !== "null";
                  return (
                    <tr
                      key={s._id}
                      className={`border-b transition-colors duration-300 ${
                        darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        {hasPhoto ? (
                          <img
                            src={`${API_BASE}/Health_Uploads/${s.profilePhoto}`}
                            alt={s.fullName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-green-500"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                            darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-600"
                          }`}>
                            {s.fullName ? s.fullName.charAt(0) : "?"}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{s.fullName}</td>
                      <td className="px-4 py-3">{s.email}</td>
                      <td className="px-4 py-3">{s.phoneNo}</td>
                      <td className="px-4 py-3">{s.medicalLicenseNumber}</td>
                      <td className="px-4 py-3">
                        {Array.isArray(s.specializations)
                          ? s.specializations.join(", ")
                          : s.specializations}
                      </td>
                      <td className="px-4 py-3">{s.qualifications}</td>
                      <td className="px-4 py-3">{s.yearsOfExperience}</td>
                      <td className="px-4 py-3">{s.dateOfBirth ? s.dateOfBirth.split("T")[0] : ""}</td>
                      <td className="px-4 py-3">{s.gender}</td>

                      {/* Direct Contact Column with WhatsApp and Email Icons */}
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 items-center">
                          {waNumber ? (
                            <a
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-1 rounded transition-colors ${
                                darkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"
                              }`}
                              title="WhatsApp"
                              aria-label="WhatsApp"
                            >
                              <FaWhatsapp
                                size={28}
                                className="text-green-500 hover:text-green-600 hover:scale-110 transition-transform"
                              />
                            </a>
                          ) : (
                            <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              No WhatsApp
                            </span>
                          )}

                          {s.email ? (
                            <a
                              href={`mailto:${s.email}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-1 rounded transition-colors ${
                                darkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"
                              }`}
                              title="Email"
                              aria-label="Email"
                            >
                              <FiMail
                                size={28}
                                className="text-blue-500 hover:text-blue-600 hover:scale-110 transition-transform"
                              />
                            </a>
                          ) : (
                            <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              No Email
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions Column with Edit and Delete Icons */}
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 items-center">
                          <button
                            onClick={() => handleEdit(s)}
                            className={`p-1 rounded transition-colors ${
                              darkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"
                            }`}
                            title="Edit"
                            aria-label="Edit"
                          >
                            <FiEdit2
                              size={28}
                              className="text-amber-500 hover:text-amber-600 hover:scale-110 transition-transform"
                            />
                          </button>

                          <button
                            onClick={() => handleDelete(s._id)}
                            className={`p-1 rounded transition-colors ${
                              darkMode ? "hover:bg-red-900" : "hover:bg-red-50"
                            }`}
                            title="Delete"
                            aria-label="Delete"
                          >
                            <FiTrash2
                              size={28}
                              className="text-red-500 hover:text-red-600 hover:scale-110 transition-transform"
                            />
                          </button>
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

      {/* Global dark mode styles (if you rely on body.dark-mode) */}
      <style jsx global>{`
        body.dark-mode {
          background-color: #1a202c;
          color: #e2e8f0;
        }
      `}</style>
    </div>
  );
};

export default H_SpecialistDetails;