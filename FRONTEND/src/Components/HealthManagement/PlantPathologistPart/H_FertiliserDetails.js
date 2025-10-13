// frontend/src/components/H_FertiliserDetails.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

// React Icons (icon-only: WhatsApp + Email + Edit)
import { FaWhatsapp } from "react-icons/fa";
import { FiMail, FiEdit2 } from "react-icons/fi";

// Hero slideshow images (adjust paths if needed)
import hero1 from "../../UserHome/Images/medicineCompany2.avif";
import hero2 from "../../UserHome/Images/medistock3.webp";
import hero3 from "../../UserHome/Images/medistock7.webp";

const API_BASE = "http://localhost:5000";

const H_FertiliserDetails = () => {
  const [fertilisers, setFertilisers] = useState([]);
  const [filteredFertilisers, setFilteredFertilisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    type: "",
    company: "",
    currentStock: "",
    unit: "",
    supplierName: "",
    supplierContact: "",
    email: "",
    purchasePrice: "",
    purchaseDate: "",
    storageLocation: "",
    storageConditions: "",
    notes: "",
  });

  // Hero slideshow (same style/size as other pages)
  const slides = [hero1, hero2, hero3];
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 6000); // 6 seconds
    return () => clearInterval(id);
  }, [slides.length]);

  const fetchFertilisers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/fertilisers`);
      const fertilisersData = res.data || [];
      setFertilisers(fertilisersData);
      setFilteredFertilisers(fertilisersData);
    } catch (err) {
      console.error(err);
      setFertilisers([]);
      setFilteredFertilisers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFertilisers();
  }, []);

  useEffect(() => {
    filterFertilisers();
  }, [searchTerm, selectedDate, fertilisers]);

  const filterFertilisers = () => {
    let filtered = fertilisers;

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(f => 
        f.purchaseDate &&
        new Date(f.purchaseDate).toISOString().split("T")[0] === selectedDate
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((f) => {
        const searchableText = Object.values(f)
          .join(" ")
          .toLowerCase();
        return searchableText.includes(searchTerm.toLowerCase());
      });
    }

    setFilteredFertilisers(filtered);
  };

  // Professional PDF Report Generation
  const handleDownloadPDF = () => {
    try {
      const dataToExport = filteredFertilisers;
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Fertiliser Records - Mount Olive Farm House</title>
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
                
                .critical {
                    background-color: #fee2e2;
                    color: #dc2626;
                    font-weight: bold;
                }
                
                .low {
                    background-color: #fef3c7;
                    color: #d97706;
                }
                
                .healthy {
                    background-color: #dcfce7;
                    color: #16a34a;
                }
                
                .stock-level {
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 7pt;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="farm-name">MOUNT OLIVE FARM HOUSE</div>
                <div class="report-title">FERTILISER RECORDS REPORT</div>
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
                        <th>Fertilizer Name</th>
                        <th>Type</th>
                        <th>Current Stock</th>
                        <th>Unit</th>
                        <th>Supplier Name</th>
                        <th>Supplier Contact</th>
                        <th>Email</th>
                        <th>Purchase Price</th>
                        <th>Purchase Date</th>
                        <th>Storage Location</th>
                        <th>Stock Level</th>
                    </tr>
                </thead>
                <tbody>
                    ${dataToExport.map(fertiliser => {
                      const stockLevel = getStockLevelClass(fertiliser);
                      const levelText = getStockLevelText(fertiliser);
                      return `
                        <tr>
                            <td>${fertiliser.name || 'N/A'}</td>
                            <td>${fertiliser.type || 'N/A'}</td>
                            <td>${fertiliser.currentStock || '0'}</td>
                            <td>${fertiliser.unit || 'N/A'}</td>
                            <td>${fertiliser.supplierName || 'N/A'}</td>
                            <td>${fertiliser.supplierContact || 'N/A'}</td>
                            <td>${fertiliser.email || 'N/A'}</td>
                            <td>${fertiliser.purchasePrice || 'N/A'}</td>
                            <td>${fertiliser.purchaseDate ? 
                                 new Date(fertiliser.purchaseDate).toLocaleDateString() : 
                                 'N/A'}</td>
                            <td>${fertiliser.storageLocation || 'N/A'}</td>
                            <td><span class="stock-level ${stockLevel}">${levelText}</span></td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>

            <div class="footer">
                Page 1 of 1 • Mount Olive Farm House Fertiliser Records
            </div>
        </body>
        </html>
      `;

      // Helper functions for PDF
      function getStockLevelClass(item) {
        const v = Number(item.currentStock);
        if (v <= 10) return "critical";
        if (v <= 50) return "low";
        return "healthy";
      }

      function getStockLevelText(item) {
        const v = Number(item.currentStock);
        if (v <= 10) return "LOW";
        if (v <= 50) return "MEDIUM";
        return "HEALTHY";
      }

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
      const dataToExport = filteredFertilisers;
      
      const headers = [
        'Fertilizer Name',
        'Type', 
        'Current Stock',
        'Unit',
        'Supplier Name',
        'Supplier Contact',
        'Email',
        'Purchase Price',
        'Purchase Date',
        'Storage Location',
        'Storage Conditions',
        'Notes'
      ];
      
      const csvData = dataToExport.map(fertiliser => [
        fertiliser.name || 'N/A',
        fertiliser.type || 'N/A',
        fertiliser.currentStock || '0',
        fertiliser.unit || 'N/A',
        fertiliser.supplierName || 'N/A',
        fertiliser.supplierContact || 'N/A',
        fertiliser.email || 'N/A',
        fertiliser.purchasePrice || 'N/A',
        fertiliser.purchaseDate ? 
          new Date(fertiliser.purchaseDate).toLocaleDateString() : 
          'N/A',
        fertiliser.storageLocation || 'N/A',
        fertiliser.storageConditions || 'N/A',
        fertiliser.notes || 'N/A'
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
      link.setAttribute('download', `fertiliser_details_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Error downloading data. Please try again.");
    }
  };

  const getStockLevelColor = (stockValue) => {
    const v = Number(stockValue);
    if (v <= 10) return "bg-red-100 text-red-800";
    if (v <= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  // Digits-only for wa.me
  const formatWhatsAppNumber = (input) => {
    if (!input) return "";
    return String(input).replace(/[^\d]/g, "");
  };

  // Helpers
  const toYMD = (d) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "";
      return dt.toISOString().slice(0, 10);
    } catch {
      return "";
    }
  };

  // Edit actions
  const openEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      name: item.name || "",
      type: item.type || "",
      company: item.company || "",
      currentStock: item.currentStock ?? "",
      unit: item.unit || "",
      supplierName: item.supplierName || "",
      supplierContact: item.supplierContact || "",
      email: item.email || "",
      purchasePrice: item.purchasePrice ?? "",
      purchaseDate: toYMD(item.purchaseDate) || "",
      storageLocation: item.storageLocation || "",
      storageConditions: item.storageConditions || "",
      notes: item.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditingId(null);
    setSaving(false);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      setSaving(true);

      const payload = {
        ...editForm,
        currentStock:
          editForm.currentStock === "" ? null : Number(editForm.currentStock),
        purchasePrice:
          editForm.purchasePrice === "" ? null : Number(editForm.purchasePrice),
      };

      await axios.put(`${API_BASE}/api/fertilisers/${editingId}`, payload);
      alert("Fertiliser updated successfully!");
      closeEdit();
      fetchFertilisers();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update fertiliser");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Hero Slideshow */}
        <div className="relative rounded-xl overflow-hidden shadow-lg mb-8">
          <img
            src={slides[slideIndex]}
            alt="Fertiliser details slide"
            className="w-full h-64 md:h-80 lg:h-96 object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow">
              Fertiliser Details
            </h1>
            <p className="mt-3 text-lg md:text-2xl font-semibold drop-shadow">
              Stock, suppliers and purchase records
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
              onClick={() => navigate(isAdmin ? "/admin/fertiliser-stock?showForm=1" : "/plant-pathologist/add-fertiliser")}
            >
              <span>➕</span>
              Add New Fertiliser
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
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search fertilisers..."
              className="w-full md:w-80 border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center gap-2"
              onClick={() => setSearchTerm(searchInput)}
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

        {/* Active Filters Info */}
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
                Showing {filteredFertilisers.length} of {fertilisers.length} records
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Loading fertiliser data...</p>
          </div>
        ) : filteredFertilisers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">
              {fertilisers.length === 0 ? "No fertiliser records found." : "No records match your search criteria."}
            </p>
            {(searchTerm || selectedDate) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSearchInput("");
                  setSelectedDate("");
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
                  <th className="px-4 py-3 text-left">Fertiliser ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Current Stock</th>
                  <th className="px-4 py-3 text-left">Unit</th>
                  <th className="px-4 py-3 text-left">Supplier Name</th>
                  <th className="px-4 py-3 text-left">Supplier Contact</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Purchase Price</th>
                  <th className="px-4 py-3 text-left">Purchase Date</th>
                  <th className="px-4 py-3 text-left">Storage Location</th>
                  <th className="px-4 py-3 text-left">Storage Conditions</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-left">Direct Contact</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFertilisers.map((f) => {
                  const waNumber = formatWhatsAppNumber(f.supplierContact);
                  return (
                    <tr
                      key={f._id}
                      className={`border-b hover:bg-gray-50 ${getStockLevelColor(f.currentStock)}`}
                    >
                      <td className="px-4 py-3">{f._id}</td>
                      <td className="px-4 py-3 font-medium">{f.name}</td>
                      <td className="px-4 py-3">{f.type}</td>
                      <td className="px-4 py-3 font-semibold">{f.currentStock}</td>
                      <td className="px-4 py-3">{f.unit}</td>
                      <td className="px-4 py-3">{f.supplierName}</td>
                      <td className="px-4 py-3">{f.supplierContact}</td>
                      <td className="px-4 py-3">{f.email}</td>
                      <td className="px-4 py-3">{f.purchasePrice}</td>
                      <td className="px-4 py-3">
                        {f.purchaseDate ? new Date(f.purchaseDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3">{f.storageLocation}</td>
                      <td className="px-4 py-3">{f.storageConditions}</td>
                      <td className="px-4 py-3">{f.notes}</td>

                      {/* Direct Contact (icon-only) */}
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 items-center">
                          {waNumber ? (
                            <a
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              title="WhatsApp supplier"
                              aria-label="WhatsApp supplier"
                            >
                              <FaWhatsapp
                                size={28}
                                className="text-green-500 hover:text-green-600 hover:scale-110 transition-transform"
                              />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">No WhatsApp</span>
                          )}

                          {f.email ? (
                            <a
                              href={`mailto:${f.email}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              title="Email supplier"
                              aria-label="Email supplier"
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

                      {/* Actions (icon-only) */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEdit(f)}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                          title="Edit fertiliser"
                          aria-label="Edit fertiliser"
                        >
                          <FiEdit2
                            size={28}
                            className="text-amber-500 hover:text-amber-600 hover:scale-110 transition-transform"
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-green-700">Edit Fertiliser</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={closeEdit}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "name", label: "Name", type: "text" },
                  { name: "type", label: "Type", type: "text" },
                  { name: "company", label: "Company", type: "text" },
                  { name: "currentStock", label: "Current Stock", type: "number" },
                  { name: "unit", label: "Unit", type: "text" },
                  { name: "supplierName", label: "Supplier Name", type: "text" },
                  { name: "supplierContact", label: "Supplier Contact", type: "text" },
                  { name: "email", label: "Email", type: "email" },
                  { name: "purchasePrice", label: "Purchase Price", type: "number", step: "0.01" },
                  { name: "purchaseDate", label: "Purchase Date", type: "date" },
                  { name: "storageLocation", label: "Storage Location", type: "text" },
                  { name: "storageConditions", label: "Storage Conditions", type: "text" },
                ].map((field) => (
                  <div key={field.name} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      name={field.name}
                      step={field.step || undefined}
                      value={editForm[field.name] ?? ""}
                      onChange={handleEditChange}
                      className="border p-2 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required={["name", "type", "currentStock", "unit", "purchasePrice", "purchaseDate"].includes(field.name)}
                    />
                  </div>
                ))}

                {/* Notes - full width */}
                <div className="md:col-span-2 flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={editForm.notes ?? ""}
                    onChange={handleEditChange}
                    rows={3}
                    className="border p-2 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default H_FertiliserDetails;