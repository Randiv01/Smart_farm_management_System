// frontend/src/components/H_FertiliserStock.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
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

const H_FertiliserStock = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Search state
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
      const res = await axios.get("http://localhost:5000/api/fertilisers");
      setStock(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setStock([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const captureElementAsImage = async (element) => {
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2, // sharper
    });
    return canvas.toDataURL("image/png");
  };

  const downloadElementAsImage = async (ref, fileName) => {
    if (!ref.current) return;
    try {
      const dataUrl = await captureElementAsImage(ref.current);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${fileName}.png`;
      link.click();
    } catch (e) {
      console.error("Failed to download image:", e);
      alert("Failed to download image");
    }
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 139, 34);
    doc.text("Mount Olive Farm House - Fertiliser Stock Report", 14, 20);

    const img = new Image();
    img.src = "/logo192.png";
    doc.addImage(img, "png", 150, 10, 40, 20);

    let yPos = 40;

    if (barRef.current) {
      const barImg = await captureElementAsImage(barRef.current);
      doc.addImage(barImg, "PNG", 14, yPos, 180, 70);
      yPos += 80;
    }
    if (lineRef.current) {
      const lineImg = await captureElementAsImage(lineRef.current);
      doc.addImage(lineImg, "PNG", 14, yPos, 180, 70);
      yPos += 80;
    }
    if (pieRef.current) {
      const pieImg = await captureElementAsImage(pieRef.current);
      doc.addImage(pieImg, "PNG", 14, yPos, 180, 70);
      yPos += 80;
    }

    autoTable(doc, {
      head: [["ID", "Fertilizer Name", "Type", "Current Stock", "Unit"]],
      body: stock.map((f) => [f._id, f.name, f.type, f.currentStock, f.unit]),
      startY: yPos,
      theme: "grid",
      headStyles: { fillColor: [34, 139, 34], textColor: [255, 255, 255] },
      styles: { textColor: [51, 51, 51], fontSize: 10 },
    });

    doc.save("FertiliserStock_Report.pdf");
  };

  const handleChange = (e) => {
    setNewFertiliser({ ...newFertiliser, [e.target.name]: e.target.value });
  };

  const handleAddFertiliser = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/fertilisers", newFertiliser);
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

  // Search filter across most fields
  const filteredStock = stock.filter((f) => {
    const q = (searchTerm || "").trim().toLowerCase();
    if (!q) return true;
    const fields = [
      f._id,
      f.name,
      f.type,
      f.unit,
      f.supplierName,
      f.supplierContact,
      f.email,
      f.storageLocation,
      f.storageConditions,
      f.notes,
      f.purchaseDate,
    ];
    return (
      fields.some((v) => String(v || "").toLowerCase().includes(q)) ||
      String(f.currentStock || "").toLowerCase().includes(q) ||
      String(f.purchasePrice || "").toLowerCase().includes(q)
    );
  });

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
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search fertiliser..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSearchTerm(searchInput)}
              className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md"
              onClick={() => setSearchTerm(searchInput)}
            >
              🔍 Search
            </button>
            {searchTerm && (
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg"
                onClick={() => {
                  setSearchInput("");
                  setSearchTerm("");
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Close Form" : "➕ Add New Fertiliser"}
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
              onClick={handleDownloadPDF}
            >
              📄 Download Report PDF
            </button>
          </div>
        </div>

        {/* Add Fertiliser Form */}
        {showForm && (
          <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
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
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md"
                >
                  Save Fertiliser
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-600 text-lg">Loading stock...</div>
        ) : filteredStock.length === 0 ? (
          <div className="text-center text-gray-600 text-lg">No stock available.</div>
        ) : (
          <>
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Bar Chart - color coded with legend + download */}
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

                <div className="mt-4 flex">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md"
                    onClick={() => downloadElementAsImage(barRef, "Fertiliser_BarChart")}
                  >
                    Download Bar Chart
                  </button>
                </div>
              </div>

              {/* Line Chart + download */}
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
                <div className="mt-4 flex">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md"
                    onClick={() => downloadElementAsImage(lineRef, "Fertiliser_LineGraph")}
                  >
                    Download Line Graph
                  </button>
                </div>
              </div>

              {/* Pie Chart + download */}
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
                <div className="mt-4 flex">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md"
                    onClick={() => downloadElementAsImage(pieRef, "Fertiliser_PieChart")}
                  >
                    Download Pie Chart
                  </button>
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