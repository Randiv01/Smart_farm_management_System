// frontend/src/components/H_MediStore.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { FiEdit2 } from "react-icons/fi";

// Hero slideshow images (adjust paths if needed)
import slide5 from "../../../UserHome/Images/healthAdmin5.jpg";
import slide6 from "../../../UserHome/Images/medistock6.png";
import slide7 from "../../../UserHome/Images/medistock7.webp";
import slide8 from "../../../UserHome/Images/medistock8.jpeg";

const API_BASE = "http://localhost:5000";

/*
  Row color styling (ported from Fertiliser table):
  - Critical: unit in CRITICAL_UNITS and quantity < 2
  - Red: ≤ 10
  - Yellow: 11 - 50
  - Green: > 50
*/
const normalizeUnit = (unit) => (unit || "").toString().trim().toLowerCase();
const CRITICAL_UNITS = new Set([
  // liquids/volumes
  "l", "liter", "litre", "liters", "litres",
  "ml", "milliliter", "millilitre", "milliliters", "millilitres",
  // discrete items
  "bottle", "bottles", "vial", "vials",
  "ampoule", "ampoules", "tablet", "tablets",
  "capsule", "capsules", "pack", "packs",
  "unit", "units", "dose", "doses",
]);

const isCriticalMedItem = (item) => {
  const unit = normalizeUnit(item.unit);
  const value = Number(item.quantity_available);
  return CRITICAL_UNITS.has(unit) && value < 2;
};

const getRowLevelClass = (item) => {
  const v = Number(item.quantity_available);
  if (isCriticalMedItem(item)) return "bg-red-100 text-red-800";
  if (v <= 10) return "bg-red-100 text-red-800";
  if (v <= 50) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
};

function H_MediStore() {
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Add/Edit form states
  const [newMedicine, setNewMedicine] = useState({
    medicine_name: "",
    animal_types: "",
    disease_treated: "",
    pharmacy_name: "",
    expiry_date: "",
    quantity_available: "",
    unit: "",
    price_per_unit: "",
    storage_location: "",
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    medicine_name: "",
    animal_types: "",
    disease_treated: "",
    pharmacy_name: "",
    expiry_date: "",
    quantity_available: "",
    unit: "",
    price_per_unit: "",
    storage_location: "",
  });

  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);

  // Hero slideshow (same style/size as Dashboard)
  const slides = [slide5, slide6, slide7, slide8];
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 6000); // 6 seconds
    return () => clearInterval(id);
  }, [slides.length]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/api/medistore`);
      const medicinesData = res.data || [];
      setMedicines(medicinesData);
      setFilteredMedicines(medicinesData);
    } catch (err) {
      console.error("Error fetching medicine data:", err);
      setError("Failed to fetch medicine data");
      setMedicines([]);
      setFilteredMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    filterMedicines();
  }, [searchTerm, selectedDate, medicines]);

  const filterMedicines = () => {
    let filtered = medicines;

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(med => 
        med.updatedAt &&
        new Date(med.updatedAt).toISOString().split("T")[0] === selectedDate
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((med) => {
        const searchableText = Object.values(med)
          .join(" ")
          .toLowerCase();
        return searchableText.includes(searchTerm.toLowerCase());
      });
    }

    setFilteredMedicines(filtered);
  };

  // Professional PDF Report Generation
  const handleDownloadPDF = () => {
    try {
      const dataToExport = filteredMedicines;
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Medicine Store Records - Mount Olive Farm House</title>
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
                <div class="report-title">MEDICINE STORE RECORDS REPORT</div>
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
                        <th>Medicine Name</th>
                        <th>Animal Types</th>
                        <th>Disease Treated</th>
                        <th>Pharmacy</th>
                        <th>Expiry Date</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Price Per Unit</th>
                        <th>Storage Location</th>
                        <th>Stock Level</th>
                    </tr>
                </thead>
                <tbody>
                    ${dataToExport.map(medicine => {
                      const stockLevel = getStockLevelClass(medicine);
                      const levelText = getStockLevelText(medicine);
                      return `
                        <tr>
                            <td>${medicine.medicine_name || 'N/A'}</td>
                            <td>${medicine.animal_types || 'N/A'}</td>
                            <td>${medicine.disease_treated || 'N/A'}</td>
                            <td>${medicine.pharmacy_name || 'N/A'}</td>
                            <td>${medicine.expiry_date ? 
                                 new Date(medicine.expiry_date).toLocaleDateString() : 
                                 'N/A'}</td>
                            <td>${medicine.quantity_available || '0'}</td>
                            <td>${medicine.unit || 'N/A'}</td>
                            <td>${medicine.price_per_unit || 'N/A'}</td>
                            <td>${medicine.storage_location || 'N/A'}</td>
                            <td><span class="stock-level ${stockLevel}">${levelText}</span></td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>

            <div class="footer">
                Page 1 of 1 • Mount Olive Farm House Medicine Store Records
            </div>
        </body>
        </html>
      `;

      // Helper functions for PDF
      function getStockLevelClass(item) {
        const v = Number(item.quantity_available);
        if (isCriticalMedItem(item)) return "critical";
        if (v <= 10) return "critical";
        if (v <= 50) return "low";
        return "healthy";
      }

      function getStockLevelText(item) {
        const v = Number(item.quantity_available);
        if (isCriticalMedItem(item)) return "CRITICAL";
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
      const dataToExport = filteredMedicines;
      
      const headers = [
        'Medicine Name',
        'Animal Types', 
        'Disease Treated',
        'Pharmacy Name',
        'Expiry Date',
        'Quantity Available',
        'Unit',
        'Price Per Unit',
        'Storage Location',
        'Update Date'
      ];
      
      const csvData = dataToExport.map(medicine => [
        medicine.medicine_name || 'N/A',
        medicine.animal_types || 'N/A',
        medicine.disease_treated || 'N/A',
        medicine.pharmacy_name || 'N/A',
        medicine.expiry_date ? 
          new Date(medicine.expiry_date).toLocaleDateString() : 
          'N/A',
        medicine.quantity_available || '0',
        medicine.unit || 'N/A',
        medicine.price_per_unit || 'N/A',
        medicine.storage_location || 'N/A',
        medicine.updatedAt ? 
          new Date(medicine.updatedAt).toLocaleDateString() : 
          'N/A'
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
      link.setAttribute('download', `medicine_store_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Error downloading data. Please try again.");
    }
  };

  const handleChange = (e) => {
    setNewMedicine({ ...newMedicine, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const todayISO = new Date().toISOString();
    const dataToSave = { ...newMedicine, updatedAt: todayISO };

    axios
      .post(`${API_BASE}/api/medistore`, dataToSave)
      .then(() => {
        alert("Medicine added successfully!");
        setShowForm(false);
        setNewMedicine({
          medicine_name: "",
          animal_types: "",
          disease_treated: "",
          pharmacy_name: "",
          expiry_date: "",
          quantity_available: "",
          unit: "",
          price_per_unit: "",
          storage_location: "",
        });
        fetchMedicines();
      })
      .catch((err) => {
        console.error("Error adding medicine:", err);
        alert("Failed to add medicine");
      });
  };

  // Normalize date to YYYY-MM-DD
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

  const downloadChart = async (ref, name) => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${name}.png`;
    link.click();
  };

  // Color mapping for charts (unchanged)
  const colors = {
    red: "#ef4444",
    // Greens (mg)
    greenLight: "#86efac",
    greenMid: "#22c55e",
    greenDark: "#166534",
    // Blues (ml)
    blueLight: "#93c5fd",
    blueMid: "#3b82f6",
    blueDark: "#1d4ed8",
    // Oranges (g)
    orangeLight: "#fdba74",
    orangeMid: "#f97316",
    orangeDark: "#7c2d12",
    // Pinks (l)
    pinkLight: "#f9a8d4",
    pinkMid: "#ec4899",
    pinkDark: "#831843",
    // Fallback
    slate: "#94a3b8",
  };

  const getColorForItem = (item) => {
    const unit = String(item.unit || "").trim().toLowerCase();
    const q = parseFloat(item.quantity_available);
    if (isNaN(q)) return colors.slate;

    switch (unit) {
      case "mg":
        if (q < 100) return colors.red;
        if (q >= 500) return colors.greenDark;
        if (q > 200) return colors.greenMid;
        return colors.greenLight;
      case "ml":
        if (q < 200) return colors.red;
        if (q >= 500) return colors.blueDark;
        if (q > 400) return colors.blueMid;
        return colors.blueLight;
      case "g":
        if (q < 500) return colors.red;
        if (q >= 900) return colors.orangeDark;
        if (q > 600) return colors.orangeMid;
        return colors.orangeLight;
      case "l":
        if (q < 1.5) return colors.red;
        if (q >= 6.5) return colors.pinkDark;
        if (q > 3.5) return colors.pinkMid;
        return colors.pinkLight;
      default:
        return colors.slate;
    }
  };

  // Legend config (matches getColorForItem thresholds)
  const quantityLegendByUnit = {
    mg: [
      { label: "< 100", color: colors.red },
      { label: "100 - 200", color: colors.greenLight },
      { label: "201 - 499", color: colors.greenMid },
      { label: ">= 500", color: colors.greenDark },
    ],
    ml: [
      { label: "< 200", color: colors.red },
      { label: "200 - 400", color: colors.blueLight },
      { label: "401 - 499", color: colors.blueMid },
      { label: ">= 500", color: colors.blueDark },
    ],
    g: [
      { label: "< 500", color: colors.red },
      { label: "500 - 600", color: colors.orangeLight },
      { label: "601 - 899", color: colors.orangeMid },
      { label: ">= 900", color: colors.orangeDark },
    ],
    l: [
      { label: "< 1.5", color: colors.red },
      { label: "1.5 - 3.5", color: colors.pinkLight },
      { label: "3.51 - 6.49", color: colors.pinkMid },
      { label: ">= 6.5", color: colors.pinkDark },
    ],
  };

  // Filter + chart data
  const chartData = filteredMedicines.map((m) => {
    const quantityNum = parseFloat(m.quantity_available) || 0;
    const fill = getColorForItem(m);
    return { ...m, quantityNum, fill };
  });

  const pieData = chartData
    .filter((d) => d.quantityNum > 0 && d.medicine_name)
    .map((d) => ({
      name: d.medicine_name,
      value: d.quantityNum,
      fill: d.fill,
    }));

  const renderColoredDot = (props) => {
    const color = getColorForItem(props.payload || {});
    return <circle cx={props.cx} cy={props.cy} r={4} stroke={color} fill={color} />;
  };

  // Edit actions
  const handleEditClick = (med) => {
    setEditingId(med._id);
    setEditForm({
      medicine_name: med.medicine_name || "",
      animal_types: med.animal_types || "",
      disease_treated: med.disease_treated || "",
      pharmacy_name: med.pharmacy_name || "",
      expiry_date: toYMD(med.expiry_date) || "",
      quantity_available: med.quantity_available ?? "",
      unit: med.unit || "",
      price_per_unit: med.price_per_unit ?? "",
      storage_location: med.storage_location || "",
    });
    setIsEditOpen(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (!editingId) return;

    const payload = {
      ...editForm,
      updatedAt: new Date().toISOString(),
      quantity_available:
        editForm.quantity_available === "" ? null : Number(editForm.quantity_available),
      price_per_unit:
        editForm.price_per_unit === "" ? null : Number(editForm.price_per_unit),
    };

    axios
      .put(`${API_BASE}/api/medistore/${editingId}`, payload)
      .then(() => {
        alert("Medicine updated successfully!");
        setIsEditOpen(false);
        setEditingId(null);
        fetchMedicines();
      })
      .catch((err) => {
        console.error("Error updating medicine:", err);
        alert("Failed to update medicine");
      });
  };

  const handleCancelEdit = () => {
    setIsEditOpen(false);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Hero Slideshow */}
        <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
          <img
            src={slides[slideIndex]}
            alt="Medicine store slide"
            className="w-full h-64 md:h-80 lg:h-96 object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow">
              Medicine Store
            </h1>
            <p className="mt-3 text-lg md:text-2xl font-semibold drop-shadow">
              Stock overview, charts & records
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
              onClick={() => setShowForm(!showForm)}
            >
              <span>➕</span>
              {showForm ? "Close Form" : "Add Medicine"}
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
              placeholder="Search medicines..."
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
                Showing {filteredMedicines.length} of {medicines.length} records
              </span>
            </div>
          </div>
        )}

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        {/* Medicine Form */}
        {showForm && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
            <h2 className="text-2xl font-semibold text-green-700 mb-6">Add New Medicine</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(newMedicine).map((key) => (
                <div key={key} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 capitalize mb-1">
                    {key.replace(/_/g, " ")}
                  </label>
                  <input
                    type={
                      key === "expiry_date"
                        ? "date"
                        : key.includes("quantity") || key.includes("price")
                        ? "number"
                        : "text"
                    }
                    step={key.includes("price") ? "0.01" : undefined}
                    name={key}
                    value={newMedicine[key]}
                    onChange={handleChange}
                    placeholder={key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required={key === "medicine_name" || key === "expiry_date"}
                  />
                </div>
              ))}
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg shadow-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition flex items-center gap-2"
                >
                  <span>💾</span>
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Loading medicine data...</p>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">
              {medicines.length === 0 ? "No medicine records found." : "No records match your search criteria."}
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
          <>
            {/* Charts Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-green-700 mb-2">
                Medicine Stock (Bar Chart)
              </h2>
              <div ref={barChartRef} className="bg-white shadow-lg rounded-lg p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="medicine_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantityNum" name="Quantity">
                      {chartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-green-700 mb-2">
                Medicine Stock (Line Graph)
              </h2>
              <div ref={lineChartRef} className="bg-white shadow-lg rounded-lg p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="medicine_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="quantityNum"
                      name="Quantity"
                      stroke="#94a3b8"
                      dot={renderColoredDot}
                      activeDot={renderColoredDot}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Color range legend + Pie chart (side-by-side) */}
              <div className="mt-4 bg-white shadow-lg rounded-lg p-4">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Color Range Legend */}
                  <div className="lg:w-1/2">
                    <h3 className="text-lg font-semibold text-green-700 mb-2">Quantity Color Range</h3>
                    <div className="space-y-4">
                      {Object.entries(quantityLegendByUnit).map(([unit, items]) => (
                        <div key={unit}>
                          <div className="font-medium mb-1 uppercase text-gray-700">{unit}</div>
                          <div className="flex flex-wrap items-center gap-3">
                            {items.map((it, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span
                                  className="inline-block w-6 h-3 rounded"
                                  style={{ backgroundColor: it.color }}
                                />
                                <span className="text-sm text-gray-800">{it.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-gray-500">Note: Red indicates low quantity for all units.</p>
                    </div>
                  </div>

                  {/* Pie Chart */}
                  <div className="lg:w-1/2">
                    <h3 className="text-lg font-semibold text-green-700 mb-2">Quantities by Medicine (Pie)</h3>
                    <div className="w-full h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip />
                          <Legend />
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ value }) => value}
                            labelLine={false}
                            isAnimationActive={false}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medicine Table */}
            <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
              <h2 className="text-2xl font-semibold text-green-700 mb-6">
                Medicine Stock Table
              </h2>
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Update Date</th>
                    <th className="px-4 py-3 text-left">Medicine Name</th>
                    <th className="px-4 py-3 text-left">Animal Types</th>
                    <th className="px-4 py-3 text-left">Disease Treated</th>
                    <th className="px-4 py-3 text-left">Pharmacy</th>
                    <th className="px-4 py-3 text-left">Expiry Date</th>
                    <th className="px-4 py-3 text-left">Quantity</th>
                    <th className="px-4 py-3 text-left">Unit</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.map((med) => (
                    <tr
                      key={med._id}
                      className={`border-b hover:bg-gray-50 ${getRowLevelClass(med)}`}
                    >
                      <td className="px-4 py-3">
                        {med.updatedAt ? new Date(med.updatedAt).toLocaleDateString() : ""}
                      </td>
                      <td className="px-4 py-3 font-medium">{med.medicine_name}</td>
                      <td className="px-4 py-3">{med.animal_types}</td>
                      <td className="px-4 py-3">{med.disease_treated}</td>
                      <td className="px-4 py-3">{med.pharmacy_name}</td>
                      <td className="px-4 py-3">
                        {med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : ""}
                      </td>
                      <td className="px-4 py-3 font-semibold">{med.quantity_available}</td>
                      <td className="px-4 py-3">{med.unit}</td>
                      <td className="px-4 py-3">{med.price_per_unit}</td>
                      <td className="px-4 py-3">{med.storage_location}</td>
                      <td className="px-4 py-3">
                        <button
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                          onClick={() => handleEditClick(med)}
                          title="Edit medicine"
                          aria-label="Edit medicine"
                        >
                          <FiEdit2
                            size={28}
                            className="text-amber-500 hover:text-amber-600 hover:scale-110 transition-transform"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Edit Modal */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-green-700">Edit Medicine</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={handleCancelEdit}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(editForm).map((key) => (
                  <div key={key} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 capitalize mb-1">
                      {key.replace(/_/g, " ")}
                    </label>
                    <input
                      type={
                        key === "expiry_date"
                          ? "date"
                          : key.includes("quantity") || key.includes("price")
                          ? "number"
                          : "text"
                      }
                      step={key.includes("price") ? "0.01" : undefined}
                      name={key}
                      value={editForm[key] ?? ""}
                      onChange={handleEditChange}
                      placeholder={key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required={key === "medicine_name" || key === "expiry_date"}
                    />
                  </div>
                ))}

                <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default H_MediStore;