import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const H_FertiliserDetails = () => {
  const [fertilisers, setFertilisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const navigate = useNavigate();

  // Fetch fertiliser data from backend
  const fetchFertilisers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/fertilisers");
      setFertilisers(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFertilisers();
  }, []);

  // Filter fertilisers by selected date
  const filteredFertilisers = selectedDate
    ? fertilisers.filter(
        (f) =>
          new Date(f.purchaseDate).toISOString().split("T")[0] === selectedDate
      )
    : fertilisers;

  // Download PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Fertiliser Details", 14, 16);

    const tableColumn = [
      "ID",
      "Name",
      "Type",
      "Stock",
      "Unit",
      "Supplier",
      "Contact",
      "Email",
      "Price",
      "Purchase Date",
      "Storage",
      "Conditions",
      "Notes",
    ];

    const tableRows = filteredFertilisers.map((f) => [
      f._id,
      f.name,
      f.type,
      f.currentStock,
      f.unit,
      f.supplierName,
      f.supplierContact,
      f.email,
      f.purchasePrice,
      new Date(f.purchaseDate).toLocaleDateString(),
      f.storageLocation,
      f.storageConditions,
      f.notes,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("fertiliser_details.pdf");
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-semibold text-green-700">
          Fertiliser Details
        </h1>
        <div className="flex flex-wrap gap-2">
          {/* Date filter */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border p-2 rounded"
          />

          {/* Download PDF */}
          <button
            onClick={downloadPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            📄 Download PDF
          </button>

          {/* Add new fertiliser */}
          <button
            onClick={() => navigate("/plant-pathologist/add-fertiliser")}
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          >
            ➕ Add New Fertiliser
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading fertiliser data...</p>
      ) : filteredFertilisers.length === 0 ? (
        <p>No fertiliser data found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-green-200">
              <tr>
                <th className="border px-4 py-2">Fertiliser ID</th>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Type</th>
                <th className="border px-4 py-2">Current Stock</th>
                <th className="border px-4 py-2">Unit</th>
                <th className="border px-4 py-2">Supplier Name</th>
                <th className="border px-4 py-2">Supplier Contact</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Purchase Price</th>
                <th className="border px-4 py-2">Purchase Date</th>
                <th className="border px-4 py-2">Storage Location</th>
                <th className="border px-4 py-2">Storage Conditions</th>
                <th className="border px-4 py-2">Notes</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFertilisers.map((f) => (
                <tr key={f._id} className="text-center">
                  <td className="border px-4 py-2">{f._id}</td>
                  <td className="border px-4 py-2">{f.name}</td>
                  <td className="border px-4 py-2">{f.type}</td>
                  <td className="border px-4 py-2">{f.currentStock}</td>
                  <td className="border px-4 py-2">{f.unit}</td>
                  <td className="border px-4 py-2">{f.supplierName}</td>
                  <td className="border px-4 py-2">{f.supplierContact}</td>
                  <td className="border px-4 py-2">{f.email}</td>
                  <td className="border px-4 py-2">{f.purchasePrice}</td>
                  <td className="border px-4 py-2">
                    {new Date(f.purchaseDate).toLocaleDateString()}
                  </td>
                  <td className="border px-4 py-2">{f.storageLocation}</td>
                  <td className="border px-4 py-2">{f.storageConditions}</td>
                  <td className="border px-4 py-2">{f.notes}</td>
                  <td className="border px-4 py-2 space-x-1">
                    <a
                      href={`https://wa.me/${f.supplierContact}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <button className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                        WhatsApp
                      </button>
                    </a>
                    <a href={`mailto:${f.email}`} target="_blank" rel="noreferrer">
                      <button className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                        Email
                      </button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default H_FertiliserDetails;
