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
  const [searchInput, setSearchInput] = useState(""); // For live input
  const [searchTerm, setSearchTerm] = useState(""); // Applied search
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

  // Refs for charts
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = () => {
    axios
      .get("http://localhost:5000/api/medistore")
      .then((res) => {
        setMedicines(res.data);
      })
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
      .catch(() => {
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

  // Filter medicines based on search term
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

        {/* Add Medicine Button */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
            onClick={() => setShowForm(!showForm)}
          >
            <span>{showForm ? "Close Form" : "➕Add Medicine"}</span>
          </button>

          {/* Date Picker + PDF Download */}
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

          {/* Search */}
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
              <input
                type="text"
                name="medicine_name"
                value={newMedicine.medicine_name}
                onChange={handleChange}
                placeholder="Medicine Name"
                required
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="animal_types"
                value={newMedicine.animal_types}
                onChange={handleChange}
                placeholder="Animal Types"
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="disease_treated"
                value={newMedicine.disease_treated}
                onChange={handleChange}
                placeholder="Disease Treated"
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="pharmacy_name"
                value={newMedicine.pharmacy_name}
                onChange={handleChange}
                placeholder="Pharmacy Name"
                className="border p-2 rounded"
              />
              <input
                type="date"
                name="expiry_date"
                value={newMedicine.expiry_date}
                onChange={handleChange}
                required
                className="border p-2 rounded"
              />
              <input
                type="number"
                name="quantity_available"
                value={newMedicine.quantity_available}
                onChange={handleChange}
                placeholder="Quantity"
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="unit"
                value={newMedicine.unit}
                onChange={handleChange}
                placeholder="Unit (mg, ml)"
                className="border p-2 rounded"
              />
              <input
                type="number"
                step="0.01"
                name="price_per_unit"
                value={newMedicine.price_per_unit}
                onChange={handleChange}
                placeholder="Price per Unit"
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="storage_location"
                value={newMedicine.storage_location}
                onChange={handleChange}
                placeholder="Location"
                className="border p-2 rounded"
              />
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
