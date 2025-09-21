// frontend/src/components/H_FertiliserDetails.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// React Icons (icon-only: WhatsApp + Email + Edit)
import { FaWhatsapp } from "react-icons/fa";
import { FiMail, FiEdit2 } from "react-icons/fi";

// Hero slideshow images (adjust paths if needed)
import hero1 from "../../UserHome/Images/medicineCompany2.avif";
import hero2 from "../../UserHome/Images/medistock3.webp";
import hero3 from "../../UserHome/Images/medistock7.webp";

const H_FertiliserDetails = () => {
  const [fertilisers, setFertilisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    type: "",
    company: "",
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

  // Hero slideshow (same style/size as other pages)
  const slides = [hero1, hero2, hero3];
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 6000); // 6 seconds
    return () => clearInterval(id);
  }, [slides.length]);

  const fetchFertilisers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/fertilisers");
      setFertilisers(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setFertilisers([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFertilisers();
  }, []);

  const filteredFertilisers = fertilisers.filter((f) => {
    const matchesDate = selectedDate
      ? f.purchaseDate &&
        new Date(f.purchaseDate).toISOString().split("T")[0] === selectedDate
      : true;

    const matchesSearch = searchTerm
      ? Object.values(f || {})
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
      f._id || "-",
      f.name || "-",
      f.type || "-",
      f.currentStock ?? "-",
      f.unit || "-",
      f.supplierName || "-",
      f.supplierContact || "-",
      f.email || "-",
      f.purchasePrice ?? "-",
      f.purchaseDate ? new Date(f.purchaseDate).toLocaleDateString() : "-",
      f.storageLocation || "-",
      f.storageConditions || "-",
      f.notes || "-",
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
    const v = Number(stockValue);
    if (v <= 10) return "bg-red-100 text-red-800";
    if (v <= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  // Digits-only for wa.me
  const formatWhatsAppNumber = (input) => {
    if (!input) return "";
    return String(input).replace(/[^\d]/g, "");
  };

  // Helpers
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

  // Edit actions
  const openEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      name: item.name || "",
      type: item.type || "",
      company: item.company || "",
      currentStock: item.currentStock ?? "",
      unit: item.unit || "",
      supplierName: item.supplierName || "",
      supplierContact: item.supplierContact || "",
      email: item.email || "",
      purchasePrice: item.purchasePrice ?? "",
      purchaseDate: toYMD(item.purchaseDate) || "",
      storageLocation: item.storageLocation || "",
      storageConditions: item.storageConditions || "",
      notes: item.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditingId(null);
    setSaving(false);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      setSaving(true);

      const payload = {
        ...editForm,
        currentStock:
          editForm.currentStock === "" ? null : Number(editForm.currentStock),
        purchasePrice:
          editForm.purchasePrice === "" ? null : Number(editForm.purchasePrice),
      };

      await axios.put(`http://localhost:5000/api/fertilisers/${editingId}`, payload);
      alert("Fertiliser updated successfully!");
      closeEdit();
      fetchFertilisers();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update fertiliser");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Hero Slideshow */}
        <div className="relative rounded-xl overflow-hidden shadow-lg mb-8">
          <img
            src={slides[slideIndex]}
            alt="Fertiliser details slide"
            className="w-full h-64 md:h-80 lg:h-96 object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow">
              Fertiliser Details
            </h1>
            <p className="mt-3 text-lg md:text-2xl font-semibold drop-shadow">
              Stock, suppliers and purchase records
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
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white shadow-sm"
            />

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search fertilisers..."
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white shadow-sm"
            />

            <button
              onClick={() => setSearchTerm(searchInput)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
            >
              🔍 Search
            </button>

            <button
              onClick={downloadPDF}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
            >
              📄 Download PDF
            </button>

            <button
              onClick={() =>
                navigate(isAdmin ? "/admin/fertiliser-stock?showForm=1" : "/plant-pathologist/add-fertiliser")
              }
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
            >
              ➕ Add New Fertiliser
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
                  <th className="py-3 px-6 text-left font-semibold">Direct Contact</th>
                  <th className="py-3 px-6 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFertilisers.map((f) => {
                  const waNumber = formatWhatsAppNumber(f.supplierContact);
                  return (
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
                      <td className="py-3 px-6 border-b">
                        {f.purchaseDate ? new Date(f.purchaseDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3 px-6 border-b">{f.storageLocation}</td>
                      <td className="py-3 px-6 border-b">{f.storageConditions}</td>
                      <td className="py-3 px-6 border-b">{f.notes}</td>

                      {/* Direct Contact (icon-only) */}
                      <td className="py-3 px-6 border-b">
                        <div className="flex space-x-2 items-center">
                          {waNumber ? (
                            <a
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              title="WhatsApp supplier"
                              aria-label="WhatsApp supplier"
                            >
                              <FaWhatsapp
                                size={28}
                                className="text-green-500 hover:text-green-600 hover:scale-110 transition-transform"
                              />
                            </a>
                          ) : (
                            <FaWhatsapp
                              size={28}
                              className="text-gray-300"
                              title="No WhatsApp"
                              aria-label="No WhatsApp"
                            />
                          )}

                          {f.email ? (
                            <a
                              href={`mailto:${f.email}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              title="Email supplier"
                              aria-label="Email supplier"
                            >
                              <FiMail
                                size={28}
                                className="text-blue-500 hover:text-blue-600 hover:scale-110 transition-transform"
                              />
                            </a>
                          ) : (
                            <FiMail
                              size={28}
                              className="text-gray-300"
                              title="No Email"
                              aria-label="No Email"
                            />
                          )}
                        </div>
                      </td>

                      {/* Actions (icon-only) */}
                      <td className="py-3 px-6 border-b">
                        <button
                          onClick={() => openEdit(f)}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                          title="Edit fertiliser"
                          aria-label="Edit fertiliser"
                        >
                          <FiEdit2
                            size={28}
                            className="text-amber-500 hover:text-amber-600 hover:scale-110 transition-transform"
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-green-700">Edit Fertiliser</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={closeEdit}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "name", label: "Name", type: "text" },
                  { name: "type", label: "Type", type: "text" },
                  { name: "company", label: "Company", type: "text" },
                  { name: "currentStock", label: "Current Stock", type: "number" },
                  { name: "unit", label: "Unit", type: "text" },
                  { name: "supplierName", label: "Supplier Name", type: "text" },
                  { name: "supplierContact", label: "Supplier Contact", type: "text" },
                  { name: "email", label: "Email", type: "email" },
                  { name: "purchasePrice", label: "Purchase Price", type: "number", step: "0.01" },
                  { name: "purchaseDate", label: "Purchase Date", type: "date" },
                  { name: "storageLocation", label: "Storage Location", type: "text" },
                  { name: "storageConditions", label: "Storage Conditions", type: "text" },
                ].map((field) => (
                  <div key={field.name} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      name={field.name}
                      step={field.step || undefined}
                      value={editForm[field.name] ?? ""}
                      onChange={handleEditChange}
                      className="border p-2 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required={["name", "type", "currentStock", "unit", "purchasePrice", "purchaseDate"].includes(field.name)}
                    />
                  </div>
                ))}

                {/* Notes - full width */}
                <div className="md:col-span-2 flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={editForm.notes ?? ""}
                    onChange={handleEditChange}
                    rows={3}
                    className="border p-2 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default H_FertiliserDetails;