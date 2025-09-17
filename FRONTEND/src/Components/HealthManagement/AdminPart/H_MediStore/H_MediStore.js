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
} from "recharts";

function H_MediStore() {
  const [medicines, setMedicines] = useState([]);
  const [downloadDate, setDownloadDate] = useState("");
  const [searchInput, setSearchInput] = useState(""); // live input
  const [searchTerm, setSearchTerm] = useState(""); // applied search
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
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

  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);

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
    const today = new Date().toISOString();
    const dataToSave = { ...newMedicine, updatedAt: today };

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

  const downloadPDF = () => {
    if (!downloadDate) {
      alert("Please select a date for download");
      return;
    }
    const selectedDate = new Date(downloadDate).toDateString();
    const filtered = medicines.filter(
      (med) => new Date(med.updatedAt).toDateString() === selectedDate
    );
    if (filtered.length === 0) {
      alert("No medicines found for selected date");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Medicine Store Report", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Date: ${selectedDate}`, 14, 25);

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

    const tableRows = filtered.map((med) => [
      new Date(med.updatedAt).toLocaleDateString(),
      med.medicine_name,
      med.animal_types,
      med.disease_treated,
      med.pharmacy_name,
      med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : "",
      med.quantity_available,
      med.unit,
      med.price_per_unit,
      med.storage_location,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save(`MediStore_Report_${selectedDate}.pdf`);
  };

  const downloadChart = async (ref, name) => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${name}.png`;
    link.click();
  };

  // Filter medicines based on applied search
  const filteredMedicines = medicines.filter((med) => {
    if (!searchTerm) return true;
    return Object.values(med)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">
          Medicine Store
        </h1>

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
                  type={key === "expiry_date" ? "date" : key.includes("quantity") || key.includes("price") ? "number" : "text"}
                  step={key.includes("price") ? "0.01" : undefined}
                  name={key}
                  value={newMedicine[key]}
                  onChange={handleChange}
                  placeholder={key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
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
              <BarChart data={filteredMedicines}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="medicine_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity_available" fill="#16a34a" />
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
              <LineChart data={filteredMedicines}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="medicine_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="quantity_available" stroke="#16a34a" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <button
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
            onClick={() => downloadChart(lineChartRef, "Medicine_LineChart")}
          >
            <span>Download Line Graph</span>
          </button>
        </div>

        {/* Medicine Table */}
        {filteredMedicines.length === 0 ? (
          <p className="text-center text-gray-600">No medicines found.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full table-auto">
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
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((med) => (
                  <tr key={med._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {new Date(med.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{med.medicine_name}</td>
                    <td className="px-4 py-3">{med.animal_types}</td>
                    <td className="px-4 py-3">{med.disease_treated}</td>
                    <td className="px-4 py-3">{med.pharmacy_name}</td>
                    <td className="px-4 py-3">
                      {med.expiry_date
                        ? new Date(med.expiry_date).toLocaleDateString()
                        : ""}
                    </td>
                    <td className="px-4 py-3">{med.quantity_available}</td>
                    <td className="px-4 py-3">{med.unit}</td>
                    <td className="px-4 py-3">{med.price_per_unit}</td>
                    <td className="px-4 py-3">{med.storage_location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default H_MediStore;
