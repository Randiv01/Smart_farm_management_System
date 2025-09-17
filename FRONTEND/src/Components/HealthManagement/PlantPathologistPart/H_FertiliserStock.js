import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
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
import logo from "../logo.jpg";

const COLORS = ["#4ade80", "#60a5fa", "#f472b6", "#facc15", "#fb923c"];

const H_FertiliserStock = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // 🔍 new search state
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

  const barRef = useRef();
  const lineRef = useRef();
  const pieRef = useRef();
  const tableRef = useRef();

  // Fetch Fertiliser stock data from backend
  const fetchStock = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/fertilisers");
      setStock(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const captureElementAsImage = async (element) => {
    const canvas = await html2canvas(element);
    return canvas.toDataURL("image/png");
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 139, 34);
    doc.text("Mount Olive Farm House - Fertiliser Stock Report", 14, 20);

    const img = new Image();
    img.src = logo;
    doc.addImage(img, "jpg", 150, 10, 40, 20);

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

  const getStockLevelColor = (stockValue) => {
    if (stockValue <= 10) return "bg-red-100 text-red-800";
    if (stockValue <= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  // 🔍 Filter stock by search term
  const filteredStock = stock.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-green-800 tracking-tight">
            Fertiliser Stock Dashboard
          </h1>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search fertiliser..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Close Form" : "➕Add New Fertiliser"}
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
              onClick={handleDownloadPDF}
            >
              📄Download Report PDF
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
          <div className="text-center text-gray-600 text-lg">
            No stock available.
          </div>
        ) : (
          <>
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Bar Chart */}
              <div ref={barRef} className="bg-white p-6 rounded-xl shadow-lg flex justify-center">
                <BarChart width={500} height={350} data={filteredStock}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#374151" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#374151" }} />
                  <Tooltip />
                  <Bar dataKey="currentStock" fill="#4ade80" radius={[4, 4, 0, 0]} />
                </BarChart>
              </div>

              {/* Line Chart */}
              <div ref={lineRef} className="bg-white p-6 rounded-xl shadow-lg flex justify-center">
                <LineChart width={500} height={350} data={filteredStock}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#374151" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#374151" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="currentStock" stroke="#60a5fa" strokeWidth={2} />
                </LineChart>
              </div>

              {/* Pie Chart */}
              <div ref={pieRef} className="bg-white p-6 rounded-xl shadow-lg flex justify-center col-span-1 lg:col-span-2">
                <PieChart width={500} height={350}>
                  <Pie
                    data={filteredStock}
                    dataKey="currentStock"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {filteredStock.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend align="center" verticalAlign="bottom" />
                  <Tooltip />
                </PieChart>
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
                    <tr key={f._id} className={`hover:bg-gray-50 ${getStockLevelColor(f.currentStock)}`}>
                      <td className="py-3 px-6 border-b">{f._id}</td>
                      <td className="py-3 px-6 border-b">{f.name}</td>
                      <td className="py-3 px-6 border-b">{f.type}</td>
                      <td className="py-3 px-6 border-b">{f.currentStock}</td>
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
