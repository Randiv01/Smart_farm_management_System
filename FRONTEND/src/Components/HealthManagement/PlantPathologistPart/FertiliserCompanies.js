// frontend/src/components/FertiliserCompanies.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaWhatsapp } from "react-icons/fa";
import { FiMail, FiEdit2, FiTrash2 } from "react-icons/fi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Hero slideshow images (adjust paths if needed)
import slideA from "../../UserHome/Images/medistock6.png";
import slideB from "../../UserHome/Images/medistock1.jpg";
import slideC from "../../UserHome/Images/medicineCompany4.jpg";
import slideD from "../../UserHome/Images/medicineCompany3.jpg";

const FertiliserCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    contact: "",
    email: "",
    country: "",
  });

  // Hero slideshow (same style/size as other pages)
  const slides = [slideA, slideB, slideC, slideD];
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 6000); // 6 seconds
    return () => clearInterval(id);
  }, [slides.length]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/fertiliser-companies");
      setCompanies(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleChange = (e) => {
    setCompanyForm({ ...companyForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/fertiliser-companies/${editingId}`, companyForm);
        alert("Company updated successfully!");
        setEditingId(null);
      } else {
        await axios.post("http://localhost:5000/api/fertiliser-companies", companyForm);
        alert("Company added successfully!");
      }
      setCompanyForm({ name: "", contact: "", email: "", country: "" });
      fetchCompanies();
    } catch (err) {
      console.error(err);
      alert("Error saving company!");
    }
  };

  const handleEdit = (company) => {
    setEditingId(company._id);
    setCompanyForm({
      name: company.name ? String(company.name) : "",
      contact: company.contact ? String(company.contact) : "",
      email: company.email ? String(company.email) : "",
      country: company.country ? String(company.country) : "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/fertiliser-companies/${id}`);
      alert("Company deleted successfully!");
      fetchCompanies();
    } catch (err) {
      console.error(err);
      alert("Error deleting company!");
    }
  };

  // Sanitize contact number for wa.me (digits only)
  const formatWhatsAppNumber = (input) => {
    if (!input) return "";
    const digits = String(input).replace(/[^\d]/g, "");
    return digits; // wa.me expects digits only, no "+" or spaces
  };

  // Download PDF of all companies
  const handleDownloadPDF = () => {
    if (!companies.length) {
      alert("No companies to download");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Fertiliser Companies", 14, 18);
    doc.setFontSize(11);
    doc.text(`Total: ${companies.length} • Generated: ${new Date().toLocaleString()}`, 14, 26);

    autoTable(doc, {
      head: [["Name", "Contact", "Email", "Country"]],
      body: companies.map((c) => [
        c.name || "",
        c.contact || "",
        c.email || "",
        c.country || "",
      ]),
      startY: 32,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 163, 74] }, // green header
    });

    doc.save("Fertiliser_Companies.pdf");
  };

  // Download CSV of all companies (Excel friendly)
  const handleDownloadCSV = () => {
    if (!companies.length) {
      alert("No companies to download");
      return;
    }
    const headers = ["Name", "Contact", "Email", "Country"];
    const rows = companies.map((c) => [
      c.name || "",
      c.contact || "",
      c.email || "",
      c.country || "",
    ]);

    const escapeCsv = (val) => {
      const v = String(val ?? "");
      if (/[",\n]/.test(v)) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    };

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((r) => r.map(escapeCsv).join(",")),
    ].join("\n");

    // Add BOM for Excel to open UTF-8 correctly
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Fertiliser_Companies.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Hero Slideshow */}
        <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
          <img
            src={slides[slideIndex]}
            alt="Fertiliser companies slide"
            className="w-full h-64 md:h-80 lg:h-96 object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow">
              Fertiliser Companies
            </h1>
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

        {/* Download Buttons */}
        <div className="flex justify-end gap-3 mb-4">
          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            title="Download as PDF"
          >
            📄 Download PDF
          </button>
          <button
            onClick={handleDownloadCSV}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            title="Download as CSV"
          >
            ⬇️ Download CSV
          </button>
        </div>

        {/* Add / Edit Form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded shadow"
        >
          <input
            type="text"
            name="name"
            value={companyForm.name}
            onChange={handleChange}
            placeholder="Company Name"
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            name="contact"
            value={companyForm.contact}
            onChange={handleChange}
            placeholder="Contact Number"
            className="border p-2 rounded"
            required
          />
          <input
            type="email"
            name="email"
            value={companyForm.email}
            onChange={handleChange}
            placeholder="Email"
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            name="country"
            value={companyForm.country}
            onChange={handleChange}
            placeholder="Country"
            className="border p-2 rounded"
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 col-span-1 md:col-span-1"
          >
            {editingId ? "Update Company" : "➕ Add Company"}
          </button>
        </form>

        {/* Companies List */}
        {loading ? (
          <p>Loading companies...</p>
        ) : companies.length === 0 ? (
          <p>No companies found.</p>
        ) : (
          <div className="space-y-2">
            {companies.map((c) => {
              const waNumber = formatWhatsAppNumber(c.contact);
              return (
                <div
                  key={c._id}
                  className="flex justify-between items-center border p-3 rounded shadow hover:bg-gray-50 bg-white"
                >
                  <div>
                    <p className="font-semibold">{c.name ? String(c.name) : "-"}</p>
                    <p>Contact: {c.contact ? String(c.contact) : "-"}</p>
                    <p>Email: {c.email ? String(c.email) : "-"}</p>
                    <p>Country: {c.country ? String(c.country) : "-"}</p>
                  </div>

                  {/* Icon-only buttons: WhatsApp, Email, Edit, Delete */}
                  <div className="flex items-center space-x-2">
                    {waNumber ? (
                      <a
                        href={`https://wa.me/${waNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        title="WhatsApp"
                        aria-label="WhatsApp"
                      >
                        <FaWhatsapp
                          size={28}
                          className="text-green-500 hover:text-green-600 hover:scale-110 transition-transform"
                        />
                      </a>
                    ) : null}

                    {c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        title="Email"
                        aria-label="Email"
                      >
                        <FiMail
                          size={28}
                          className="text-blue-500 hover:text-blue-600 hover:scale-110 transition-transform"
                        />
                      </a>
                    ) : null}

                    <button
                      onClick={() => handleEdit(c)}
                      type="button"
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      title="Edit"
                      aria-label="Edit"
                    >
                      <FiEdit2
                        size={28}
                        className="text-amber-500 hover:text-amber-600 hover:scale-110 transition-transform"
                      />
                    </button>

                    <button
                      onClick={() => handleDelete(c._id)}
                      type="button"
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      title="Delete"
                      aria-label="Delete"
                    >
                      <FiTrash2
                        size={28}
                        className="text-red-500 hover:text-red-600 hover:scale-110 transition-transform"
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FertiliserCompanies;