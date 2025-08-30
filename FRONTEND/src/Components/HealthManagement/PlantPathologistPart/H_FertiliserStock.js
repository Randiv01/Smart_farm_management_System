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
      fetchStock(); // Refresh data
    } catch (err) {
      console.error(err);
      alert("Error adding fertiliser");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-green-700">
          Fertiliser Stock Dashboard
        </h1>
        <div className="flex space-x-2">
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
            onClick={() => setShowForm(!showForm)}
          >
            Add New Fertiliser
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
            onClick={handleDownloadPDF}
          >
            Download Report PDF
          </button>
        </div>
      </div>

      {/* Add Fertiliser Form */}
      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Fertiliser</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAddFertiliser}>
            {Object.keys(newFertiliser).map((key) => (
              <div key={key} className="flex flex-col">
                <label className="font-medium">{key}</label>
                <input
                  type={key === "purchasePrice" || key === "currentStock" ? "number" : key === "purchaseDate" ? "date" : "text"}
                  name={key}
                  value={newFertiliser[key]}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required={["name", "type", "currentStock", "unit", "supplierName", "supplierContact", "email", "purchasePrice", "purchaseDate"].includes(key)}
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow">
                Save Fertiliser
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading stock...</p>
      ) : stock.length === 0 ? (
        <p>No stock available.</p>
      ) : (
        <>
          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div ref={barRef} className="bg-white p-4 rounded shadow-md flex justify-center">
              <BarChart width={400} height={300} data={stock}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="currentStock" fill="#4ade80" />
              </BarChart>
            </div>

            <div ref={lineRef} className="bg-white p-4 rounded shadow-md flex justify-center">
              <LineChart width={400} height={300} data={stock}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="currentStock" stroke="#60a5fa" />
              </LineChart>
            </div>

            <div ref={pieRef} className="bg-white p-4 rounded shadow-md flex justify-center col-span-1 md:col-span-2">
              <PieChart width={400} height={300}>
                <Pie
                  data={stock}
                  dataKey="currentStock"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#82ca9d"
                  label
                >
                  {stock.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </div>
          </div>

          {/* Table Section */}
          <div ref={tableRef} className="bg-white p-4 rounded shadow-md overflow-x-auto">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Fertiliser Stock Table</h2>
            <table className="min-w-full border border-gray-300">
              <thead className="bg-green-100">
                <tr>
                  <th className="py-2 px-4 border">ID</th>
                  <th className="py-2 px-4 border">Fertilizer Name</th>
                  <th className="py-2 px-4 border">Type</th>
                  <th className="py-2 px-4 border">Current Stock</th>
                  <th className="py-2 px-4 border">Unit</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((f) => (
                  <tr key={f._id}>
                    <td className="py-2 px-4 border">{f._id}</td>
                    <td className="py-2 px-4 border">{f.name}</td>
                    <td className="py-2 px-4 border">{f.type}</td>
                    <td className="py-2 px-4 border">{f.currentStock}</td>
                    <td className="py-2 px-4 border">{f.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default H_FertiliserStock;
