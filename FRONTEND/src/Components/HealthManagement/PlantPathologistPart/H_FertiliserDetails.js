import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ✅ Correct icon import paths
import whatsappIcon from "../ButtonIcon/whatsappButton.png";
import emailIcon from "../ButtonIcon/emailButton.png";

const H_FertiliserDetails = () => {
  const [fertilisers, setFertilisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // 🔍 filter term
  const [searchInput, setSearchInput] = useState(""); // search input value
  const navigate = useNavigate();

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

  // Filter fertilisers by date and search
  const filteredFertilisers = fertilisers.filter((f) => {
    const matchesDate = selectedDate
      ? new Date(f.purchaseDate).toISOString().split("T")[0] === selectedDate
      : true;

    const matchesSearch = searchTerm
      ? Object.values(f)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      : true;

    return matchesDate && matchesSearch;
  });

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 139, 34);
    doc.text("Fertiliser Details - Mount Olive Farm House", 14, 16);

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
      theme: "grid",
      headStyles: { fillColor: [34, 139, 34], textColor: [255, 255, 255], fontSize: 10 },
      styles: { textColor: [51, 51, 51], fontSize: 9, cellPadding: 3 },
    });

    doc.save("fertiliser_details.pdf");
  };

  const getStockLevelColor = (stockValue) => {
    if (stockValue <= 10) return "bg-red-100 text-red-800";
    if (stockValue <= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-extrabold text-green-800 tracking-tight">
            Fertiliser Details
          </h1>

          {/* All controls on same line */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Date filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white shadow-sm"
              placeholder="Select purchase date"
            />

            {/* Search input */}
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search fertilisers..."
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white shadow-sm"
            />

            {/* Search button */}
            <button
              onClick={() => setSearchTerm(searchInput)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
            >
              🔍 Search
            </button>

            {/* Download PDF button */}
            <button
              onClick={downloadPDF}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
            >
              📄Download PDF
            </button>

            {/* Add fertiliser button */}
            <button
              onClick={() => navigate("/plant-pathologist/add-fertiliser")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
            >
              ➕Add New Fertiliser
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-600 text-lg">Loading fertiliser data...</div>
        ) : filteredFertilisers.length === 0 ? (
          <div className="text-center text-gray-600 text-lg">No fertiliser data found.</div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto transform transition-all hover:shadow-xl">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="py-3 px-6 text-left font-semibold">Fertiliser ID</th>
                  <th className="py-3 px-6 text-left font-semibold">Name</th>
                  <th className="py-3 px-6 text-left font-semibold">Type</th>
                  <th className="py-3 px-6 text-left font-semibold">Current Stock</th>
                  <th className="py-3 px-6 text-left font-semibold">Unit</th>
                  <th className="py-3 px-6 text-left font-semibold">Supplier Name</th>
                  <th className="py-3 px-6 text-left font-semibold">Supplier Contact</th>
                  <th className="py-3 px-6 text-left font-semibold">Email</th>
                  <th className="py-3 px-6 text-left font-semibold">Purchase Price</th>
                  <th className="py-3 px-6 text-left font-semibold">Purchase Date</th>
                  <th className="py-3 px-6 text-left font-semibold">Storage Location</th>
                  <th className="py-3 px-6 text-left font-semibold">Storage Conditions</th>
                  <th className="py-3 px-6 text-left font-semibold">Notes</th>
                  <th className="py-3 px-6 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFertilisers.map((f) => (
                  <tr
                    key={f._id}
                    className={`hover:bg-gray-50 transition-colors ${getStockLevelColor(f.currentStock)}`}
                  >
                    <td className="py-3 px-6 border-b">{f._id}</td>
                    <td className="py-3 px-6 border-b">{f.name}</td>
                    <td className="py-3 px-6 border-b">{f.type}</td>
                    <td className="py-3 px-6 border-b font-medium">{f.currentStock}</td>
                    <td className="py-3 px-6 border-b">{f.unit}</td>
                    <td className="py-3 px-6 border-b">{f.supplierName}</td>
                    <td className="py-3 px-6 border-b">{f.supplierContact}</td>
                    <td className="py-3 px-6 border-b">{f.email}</td>
                    <td className="py-3 px-6 border-b">{f.purchasePrice}</td>
                    <td className="py-3 px-6 border-b">{new Date(f.purchaseDate).toLocaleDateString()}</td>
                    <td className="py-3 px-6 border-b">{f.storageLocation}</td>
                    <td className="py-3 px-6 border-b">{f.storageConditions}</td>
                    <td className="py-3 px-6 border-b">{f.notes}</td>
                    <td className="py-3 px-6 border-b space-x-2 flex">
                      <a href={`https://wa.me/${f.supplierContact}`} target="_blank" rel="noreferrer">
                        <img
                          src={whatsappIcon}
                          alt="WhatsApp"
                          className="w-10 h-10 cursor-pointer transform hover:scale-110 transition-transform"
                        />
                      </a>
                      <a href={`mailto:${f.email}`} target="_blank" rel="noreferrer">
                        <img
                          src={emailIcon}
                          alt="Email"
                          className="w-10 h-10 cursor-pointer transform hover:scale-110 transition-transform"
                        />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default H_FertiliserDetails;
