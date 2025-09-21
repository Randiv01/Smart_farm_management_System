// frontend/src/components/H_MediStore.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
import { FiEdit2 } from "react-icons/fi"; // Use same edit icon as other pages

// Hero slideshow images (adjust paths if needed)
import slide5 from "../../../UserHome/Images/healthAdmin5.jpg";
import slide6 from "../../../UserHome/Images/medistock6.png";
import slide7 from "../../../UserHome/Images/medistock7.webp";
import slide8 from "../../../UserHome/Images/medistock8.jpeg";

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
  const [downloadDate, setDownloadDate] = useState("");
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

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = () => {
    axios
      .get("http://localhost:5000/api/medistore")
      .then((res) => setMedicines(res.data))
      .catch((err) => {
        console.error("Error fetching medicine data:", err);
        setError("Failed to fetch medicine data");
      });
  };

  const handleChange = (e) => {
    setNewMedicine({ ...newMedicine, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const todayISO = new Date().toISOString();
    const dataToSave = { ...newMedicine, updatedAt: todayISO };

    axios
      .post("http://localhost:5000/api/medistore", dataToSave)
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

  const downloadPDF = () => {
    const dataset = downloadDate
      ? medicines.filter((m) => toYMD(m.updatedAt) === downloadDate)
      : medicines;

    if (dataset.length === 0) {
      alert(downloadDate ? "No medicines found for selected date" : "No medicines to download");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Medicine Store Report", 105, 15, { align: "center" });

    doc.setFontSize(12);
    const now = new Date();
    const headerLine = downloadDate
      ? `Date filter: ${downloadDate}   |   Generated: ${now.toLocaleString()}`
      : `All records   |   Generated: ${now.toLocaleString()}`;
    doc.text(headerLine, 14, 25);

    const tableColumn = [
      "Update Date",
      "Medicine Name",
      "Animal Types",
      "Disease Treated",
      "Pharmacy",
      "Expiry Date",
      "Quantity",
      "Unit",
      "Price",
      "Location",
    ];

    const tableRows = dataset.map((med) => [
      med.updatedAt ? new Date(med.updatedAt).toLocaleDateString() : "",
      med.medicine_name || "",
      med.animal_types || "",
      med.disease_treated || "",
      med.pharmacy_name || "",
      med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : "",
      med.quantity_available ?? "",
      med.unit || "",
      med.price_per_unit ?? "",
      med.storage_location || "",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] },
    });

    const nameSuffix = downloadDate ? `_${downloadDate}` : "_ALL";
    doc.save(`MediStore_Report${nameSuffix}.pdf`);
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
  const filteredMedicines = medicines.filter((med) => {
    if (!searchTerm) return true;
    return Object.values(med).join(" ").toLowerCase().includes(searchTerm.toLowerCase());
  });

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
      .put(`http://localhost:5000/api/medistore/${editingId}`, payload)
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

        {/* Hero Slideshow (same style/size as Dashboard) */}
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

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
            onClick={() => setShowForm(!showForm)}
          >
            <span>{showForm ? "Close Form" : "➕Add Medicine"}</span>
          </button>

          <input
            type="date"
            value={downloadDate}
            onChange={(e) => setDownloadDate(e.target.value)}
            className="p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
            onClick={downloadPDF}
            title="If a date is selected, downloads only that date. If not, downloads all."
          >
            <span>📄Download PDF</span>
          </button>

          <input
            type="text"
            placeholder="Search medicines..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            onClick={() => setSearchTerm(searchInput)}
          >
            🔍 Search
          </button>
        </div>

        {/* Medicine Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-lg rounded-lg p-6 mb-8"
          >
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(newMedicine).map((key) => (
                <input
                  key={key}
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
                  className="border p-2 rounded"
                  required={key === "medicine_name" || key === "expiry_date"}
                />
              ))}
            </div>
            <p className="mt-3 text-gray-600">
              <strong>Update Date:</strong> {new Date().toLocaleDateString()}
            </p>
            <button
              type="submit"
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
            >
              Save Medicine
            </button>
          </form>
        )}

        {/* Charts */}
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
          <button
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
            onClick={() => downloadChart(barChartRef, "Medicine_BarChart")}
          >
            <span>Download Bar Chart</span>
          </button>
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

          <button
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
            onClick={() => downloadChart(lineChartRef, "Medicine_LineChart")}
          >
            <span>Download Line Graph</span>
          </button>
        </div>

        {/* Medicine Table with Fertiliser-style colors + Action icon */}
        {filteredMedicines.length === 0 ? (
          <p className="text-center text-gray-600">No medicines found.</p>
        ) : (
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
                    className={`hover:bg-gray-50 ${getRowLevelClass(med)}`}
                  >
                    <td className="px-4 py-3 border-b">
                      {med.updatedAt ? new Date(med.updatedAt).toLocaleDateString() : ""}
                    </td>
                    <td className="px-4 py-3 border-b">{med.medicine_name}</td>
                    <td className="px-4 py-3 border-b">{med.animal_types}</td>
                    <td className="px-4 py-3 border-b">{med.disease_treated}</td>
                    <td className="px-4 py-3 border-b">{med.pharmacy_name}</td>
                    <td className="px-4 py-3 border-b">
                      {med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : ""}
                    </td>
                    <td className="px-4 py-3 border-b font-semibold">{med.quantity_available}</td>
                    <td className="px-4 py-3 border-b">{med.unit}</td>
                    <td className="px-4 py-3 border-b">{med.price_per_unit}</td>
                    <td className="px-4 py-3 border-b">{med.storage_location}</td>
                    <td className="px-4 py-3 border-b">
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
                  <input
                    key={key}
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
                    className="border p-2 rounded"
                    required={key === "medicine_name" || key === "expiry_date"}
                  />
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