// frontend/src/components/H_MedicineCompany.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import H_MedicineCompanyForm from "./H_MedicineCompanyForm.js";

// React Icons
import { FaWhatsapp } from "react-icons/fa";
import { FiMail, FiEdit2, FiTrash2 } from "react-icons/fi";

// Hero slideshow images (adjust paths if needed)
import mc1 from "../../../UserHome/Images/medicineCompany1.jpg";
import mc2 from "../../../UserHome/Images/medicineCompany2.avif";
import mc3 from "../../../UserHome/Images/medicineCompany3.jpg";
import mc4 from "../../../UserHome/Images/medicineCompany4.jpg";

const API_BASE = "http://localhost:5000";

const H_MedicineCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Hero slideshow
  const slides = [mc1, mc2, mc3, mc4];
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/medicine-companies`);
      setCompanies(res.data);
      setFilteredCompanies(res.data);
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchTerm, companies]);

  const filterCompanies = () => {
    if (!searchTerm) {
      setFilteredCompanies(companies);
      return;
    }
    
    const filtered = companies.filter((company) => {
      const searchableText = Object.values(company)
        .join(" ")
        .toLowerCase();
      return searchableText.includes(searchTerm.toLowerCase());
    });
    setFilteredCompanies(filtered);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (company) => {
    setEditingId(company._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company?")) return;
    try {
      await axios.delete(`${API_BASE}/api/medicine-companies/${id}`);
      fetchCompanies();
    } catch (err) {
      console.error("Error deleting company:", err);
    }
  };

  // Professional PDF Report Generation
  const handleDownloadPDF = () => {
    try {
      const dataToExport = filteredCompanies;
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Medicine Company Records - Mount Olive Farm House</title>
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
                <div class="report-title">MEDICINE COMPANY RECORDS REPORT</div>
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
                        <th>Company Name</th>
                        <th>Registration Number</th>
                        <th>Address</th>
                        <th>Contact Number</th>
                        <th>Emergency Contacts</th>
                        <th>Email</th>
                        <th>Website</th>
                    </tr>
                </thead>
                <tbody>
                    ${dataToExport.map(company => `
                        <tr>
                            <td>${company.companyName || 'N/A'}</td>
                            <td>${company.registrationNumber || 'N/A'}</td>
                            <td>${company.address || 'N/A'}</td>
                            <td>${company.contactNo || 'N/A'}</td>
                            <td>${Array.isArray(company.emergencyContacts) ? 
                                 company.emergencyContacts.join(', ') : 
                                 company.emergencyContacts || 'N/A'}</td>
                            <td>${company.email || 'N/A'}</td>
                            <td>${company.website || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">
                Page 1 of 1 • Mount Olive Farm House Medicine Company Records
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
      const dataToExport = filteredCompanies;
      
      const headers = [
        'Company Name',
        'Registration Number', 
        'Address',
        'Contact Number',
        'Emergency Contacts',
        'Email',
        'Website'
      ];
      
      const csvData = dataToExport.map(company => [
        company.companyName || 'N/A',
        company.registrationNumber || 'N/A',
        company.address || 'N/A',
        company.contactNo || 'N/A',
        Array.isArray(company.emergencyContacts) ? 
          company.emergencyContacts.join('; ') : 
          company.emergencyContacts || 'N/A',
        company.email || 'N/A',
        company.website || 'N/A'
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
      link.setAttribute('download', `medicine_companies_${new Date().toISOString().split('T')[0]}.csv`);
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Hero Slideshow */}
        <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
          <img
            src={slides[slideIndex]}
            alt="Medicine companies slide"
            className="w-full h-64 md:h-80 lg:h-96 object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow">
              Medicine Companies
            </h1>
            <p className="mt-3 text-lg md:text-2xl font-semibold drop-shadow">
              Suppliers, contacts and registrations
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
              Add New Company
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
              placeholder="Search medicine companies..."
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
                Showing {filteredCompanies.length} of {companies.length} records
              </span>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
            <H_MedicineCompanyForm
              companyId={editingId}
              onSuccess={() => {
                setShowForm(false);
                setEditingId(null);
                fetchCompanies();
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            />
          </div>
        )}

        {/* Company Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Loading medicine companies...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">
              {companies.length === 0 ? "No medicine company records found." : "No records match your search criteria."}
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
                  <th className="px-4 py-3 text-left">Company Name</th>
                  <th className="px-4 py-3 text-left">Registration</th>
                  <th className="px-4 py-3 text-left">Address</th>
                  <th className="px-4 py-3 text-left">Contact No</th>
                  <th className="px-4 py-3 text-left">Emergency Contacts</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Website</th>
                  <th className="px-4 py-3 text-left">Direct Contact</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((c) => {
                  const waNumber = formatWhatsAppNumber(c.contactNo);
                  return (
                    <tr key={c._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{c.companyName}</td>
                      <td className="px-4 py-3">{c.registrationNumber}</td>
                      <td className="px-4 py-3">{c.address}</td>
                      <td className="px-4 py-3">{c.contactNo || "N/A"}</td>
                      <td className="px-4 py-3">{c.emergencyContacts?.join(", ") || "N/A"}</td>
                      <td className="px-4 py-3">{c.email || "N/A"}</td>
                      <td className="px-4 py-3">
                        {c.website ? (
                          <a
                            href={c.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline"
                          >
                            {c.website}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      {/* Direct Contact */}
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 items-center">
                          {waNumber ? (
                            <a
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              title="WhatsApp"
                              aria-label="WhatsApp"
                            >
                              <FaWhatsapp
                                size={28}
                                className="text-green-500 hover:text-green-600 hover:scale-110 transition-transform"
                              />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">No WhatsApp</span>
                          )}
                          {c.email ? (
                            <a
                              href={`mailto:${c.email}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              title="Email"
                              aria-label="Email"
                            >
                              <FiMail
                                size={28}
                                className="text-blue-500 hover:text-blue-600 hover:scale-110 transition-transform"
                              />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">No Email</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 items-center">
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                            title="Edit"
                            aria-label="Edit"
                          >
                            <FiEdit2
                              size={28}
                              className="text-amber-500 hover:text-amber-600 hover:scale-110 transition-transform"
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(c._id)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
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
    </div>
  );
};

export default H_MedicineCompany;