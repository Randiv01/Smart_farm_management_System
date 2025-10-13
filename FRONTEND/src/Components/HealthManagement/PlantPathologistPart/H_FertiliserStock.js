// frontend/src/components/H_FertiliserStock.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Hero slideshow images (adjust paths if needed)
import heroA from "../../UserHome/Images/AboutUs3.jpg";
import heroB from "../../UserHome/Images/ContactUs3.webp";
import heroC from "../../UserHome/Images/ReducesWaste.jpg";
import heroD from "../../UserHome/Images/medistock6.png";

// Pie slice palette
const PIE_COLORS = ["#4ade80", "#60a5fa", "#f472b6", "#facc15", "#fb923c"];

// Bar colors and thresholds
const BAR_COLORS = {
  red: "#ef4444",     // critical or very low
  yellow: "#f59e0b",  // medium
  green: "#22c55e",   // healthy
};

// Units to check for critical threshold (< 2)
const CRITICAL_UNITS = new Set([
  "litters", "liter", "litre", "liters", "litres", "l", "ltr", "ltrs",
  "gal", "gallon", "gallons",
  "bag", "bags",
  "kg", "kilogram", "kilograms",
]);

const normalizeUnit = (unit) => (unit || "").toString().trim().toLowerCase();
const isCriticalItem = (item) => {
  const unit = normalizeUnit(item.unit);
  const value = Number(item.currentStock);
  return CRITICAL_UNITS.has(unit) && value < 2;
};

// Map stock -> bar color (and legend)
const getBarColor = (item) => {
  const v = Number(item.currentStock);
  if (isCriticalItem(item)) return BAR_COLORS.red;          // critical rule
  if (v <= 10) return BAR_COLORS.red;                       // very low
  if (v <= 50) return BAR_COLORS.yellow;                    // medium
  return BAR_COLORS.green;                                  // healthy
};

// Table row color (kept similar to your original logic)
const getRowLevelClass = (item) => {
  const v = Number(item.currentStock);
  if (isCriticalItem(item)) return "bg-red-100 text-red-800";
  if (v <= 10) return "bg-red-100 text-red-800";
  if (v <= 50) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
};

const API_BASE = "http://localhost:5000";

const H_FertiliserStock = () => {
  const [stock, setStock] = useState([]);
  const [filteredStock, setFilteredStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [newFertiliser, setNewFertiliser] = useState({
    name: "",
    type: "",
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

  // Refs for capturing charts
  const barRef = useRef();
  const lineRef = useRef();
  const pieRef = useRef();
  const tableRef = useRef();
  const location = useLocation();

  // Hero slideshow
  const slides = [heroA, heroB, heroC, heroD];
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 6000); // 6 seconds
    return () => clearInterval(id);
  }, [slides.length]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("showForm") === "1") setShowForm(true);
  }, [location.search]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/fertilisers`);
      const stockData = res.data || [];
      setStock(stockData);
      setFilteredStock(stockData);
    } catch (err) {
      console.error(err);
      setStock([]);
      setFilteredStock([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  useEffect(() => {
    filterStock();
  }, [searchTerm, stock]);

  const filterStock = () => {
    if (!searchTerm) {
      setFilteredStock(stock);
      return;
    }
    
    const filtered = stock.filter((f) => {
      const searchableText = Object.values(f)
        .join(" ")
        .toLowerCase();
      return searchableText.includes(searchTerm.toLowerCase());
    });
    setFilteredStock(filtered);
  };

  // Professional PDF Report Generation
  const handleDownloadPDF = () => {
    try {
      const dataToExport = filteredStock;
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Fertiliser Stock Records - Mount Olive Farm House</title>
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
                
                .page-break {
                    page-break-after: always;
                }
                
                .stock-level {
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 8pt;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="farm-name">MOUNT OLIVE FARM HOUSE</div>
                <div class="report-title">FERTILISER STOCK RECORDS REPORT</div>
                <div class="report-info">Generated on: ${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</div>
                <div class="report-info">Total Records: ${dataToExport.length}</div>
                <div class="report-info">
                    Stock Levels: 
                    <span class="stock-level critical">Critical</span> 
                    <span class="stock-level low">Low</span> 
                    <span class="stock-level healthy">Healthy</span>
                </div>
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
                        <th>Fertilizer Name</th>
                        <th>Type</th>
                        <th>Current Stock</th>
                        <th>Unit</th>
                        <th>Supplier</th>
                        <th>Storage Location</th>
                        <th>Purchase Date</th>
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
                            <td>${fertiliser.storageLocation || 'N/A'}</td>
                            <td>${fertiliser.purchaseDate ? 
                                 new Date(fertiliser.purchaseDate).toLocaleDateString() : 
                                 'N/A'}</td>
                            <td><span class="stock-level ${stockLevel}">${levelText}</span></td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>

            <div class="footer">
                Page 1 of 1 • Mount Olive Farm House Fertiliser Stock Records
            </div>
        </body>
        </html>
      `;

      // Helper functions for PDF
      function getStockLevelClass(item) {
        const v = Number(item.currentStock);
        if (isCriticalItem(item)) return "critical";
        if (v <= 10) return "critical";
        if (v <= 50) return "low";
        return "healthy";
      }

      function getStockLevelText(item) {
        const v = Number(item.currentStock);
        if (isCriticalItem(item)) return "CRITICAL";
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
      const dataToExport = filteredStock;
      
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
      link.setAttribute('download', `fertiliser_stock_${new Date().toISOString().split('T')[0]}.csv`);
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
    setNewFertiliser({ ...newFertiliser, [e.target.name]: e.target.value });
  };

  const handleAddFertiliser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/fertilisers`, newFertiliser);
      setShowForm(false);
      setNewFertiliser({
        name: "",
        type: "",
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
      fetchStock();
    } catch (err) {
      console.error(err);
      alert("Error adding fertiliser");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Hero Slideshow */}
        <div className="relative rounded-xl overflow-hidden shadow-lg mb-8">
          <img
            src={slides[slideIndex]}
            alt="Fertiliser stock slide"
            className="w-full h-64 md:h-80 lg:h-96 object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow">
              Fertiliser Stock Dashboard
            </h1>
            <p className="mt-3 text-lg md:text-2xl font-semibold drop-shadow">
              Charts, stock and reports
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
        <div className="flex flex-col md:flex-row md:justify-between items-center mb-8 space-y-3 md:space-y-0">
          <div className="flex flex-wrap gap-2">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center gap-2"
              onClick={() => setShowForm(!showForm)}
            >
              <span>➕</span>
              {showForm ? "Close Form" : "Add New Fertiliser"}
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
              placeholder="Search fertiliser stock..."
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
                Showing {filteredStock.length} of {stock.length} records
              </span>
            </div>
          </div>
        )}

        {/* Add Fertiliser Form */}
        {showForm && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
            <h2 className="text-2xl font-semibold text-green-700 mb-6">
              Add New Fertiliser
            </h2>
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              onSubmit={handleAddFertiliser}
            >
              {Object.keys(newFertiliser).map((key) => (
                <div key={key} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 capitalize mb-1">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <input
                    type={
                      key === "purchasePrice" || key === "currentStock"
                        ? "number"
                        : key === "purchaseDate"
                        ? "date"
                        : "text"
                    }
                    name={key}
                    value={newFertiliser[key]}
                    onChange={handleChange}
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required={[
                      "name",
                      "type",
                      "currentStock",
                      "unit",
                      "supplierName",
                      "supplierContact",
                      "email",
                      "purchasePrice",
                      "purchaseDate",
                    ].includes(key)}
                    placeholder={`Enter ${key.replace(/([A-Z])/g, " $1").trim()}`}
                  />
                </div>
              ))}
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition flex items-center gap-2"
                >
                  <span>💾</span>
                  Save Fertiliser
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg shadow-md transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Loading fertiliser stock...</p>
          </div>
        ) : filteredStock.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">
              {stock.length === 0 ? "No fertiliser stock records found." : "No records match your search criteria."}
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
          <>
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Bar Chart - color coded with legend */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div ref={barRef} className="flex justify-center">
                  <BarChart width={500} height={350} data={filteredStock}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#374151" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#374151" }} />
                    <Tooltip />
                    <Bar dataKey="currentStock" radius={[4, 4, 0, 0]}>
                      {filteredStock.map((item, index) => (
                        <Cell
                          key={`cell-bar-${item._id || index}`}
                          fill={getBarColor(item)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </div>

                {/* Color range legend (matches bar colors) */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Color range</h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-5 h-5 rounded"
                        style={{ backgroundColor: BAR_COLORS.red }}
                        title="Red"
                      />
                      <span className="text-sm text-gray-700">
                        Red: Critical (&lt; 2 for L/Litre/Gallon/Bag/Kg) or ≤ 10 units
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-5 h-5 rounded"
                        style={{ backgroundColor: BAR_COLORS.yellow }}
                        title="Yellow"
                      />
                      <span className="text-sm text-gray-700">
                        Yellow: 11 - 50 units
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-5 h-5 rounded"
                        style={{ backgroundColor: BAR_COLORS.green }}
                        title="Green"
                      />
                      <span className="text-sm text-gray-700">
                        Green: &gt; 50 units
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Chart */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div ref={lineRef} className="flex justify-center">
                  <LineChart width={500} height={350} data={filteredStock}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#374151" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#374151" }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="currentStock" stroke="#60a5fa" strokeWidth={2} />
                  </LineChart>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center col-span-1 lg:col-span-2">
                <div ref={pieRef} className="flex justify-center">
                  <PieChart width={500} height={350}>
                    <Pie
                      data={filteredStock}
                      dataKey="currentStock"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {filteredStock.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend align="center" verticalAlign="bottom" />
                    <Tooltip />
                  </PieChart>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div ref={tableRef} className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
              <h2 className="text-2xl font-semibold text-green-700 mb-6">
                Fertiliser Stock Table
              </h2>
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="py-3 px-6 text-left">ID</th>
                    <th className="py-3 px-6 text-left">Fertilizer Name</th>
                    <th className="py-3 px-6 text-left">Type</th>
                    <th className="py-3 px-6 text-left">Current Stock</th>
                    <th className="py-3 px-6 text-left">Unit</th>
                    <th className="py-3 px-6 text-left">Supplier</th>
                    <th className="py-3 px-6 text-left">Storage Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((f) => (
                    <tr
                      key={f._id}
                      className={`hover:bg-gray-50 ${getRowLevelClass(f)}`}
                    >
                      <td className="py-3 px-6 border-b">{f._id}</td>
                      <td className="py-3 px-6 border-b">{f.name}</td>
                      <td className="py-3 px-6 border-b">{f.type}</td>
                      <td className="py-3 px-6 border-b font-semibold">{f.currentStock}</td>
                      <td className="py-3 px-6 border-b">{f.unit}</td>
                      <td className="py-3 px-6 border-b">{f.supplierName || "N/A"}</td>
                      <td className="py-3 px-6 border-b">{f.storageLocation || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default H_FertiliserStock;