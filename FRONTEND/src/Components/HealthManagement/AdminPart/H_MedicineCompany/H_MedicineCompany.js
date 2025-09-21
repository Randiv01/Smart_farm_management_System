// frontend/src/components/H_MedicineCompany.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import H_MedicineCompanyForm from "./H_MedicineCompanyForm.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// React Icons
import { FaWhatsapp } from "react-icons/fa";
import { FiMail, FiEdit2, FiTrash2 } from "react-icons/fi";

// Hero slideshow images (adjust paths if needed)
import mc1 from "../../../UserHome/Images/medicineCompany1.jpg";
import mc2 from "../../../UserHome/Images/medicineCompany2.avif";
import mc3 from "../../../UserHome/Images/medicineCompany3.jpg";
import mc4 from "../../../UserHome/Images/medicineCompany4.jpg";

const H_MedicineCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Hero slideshow
  const slides = [mc1, mc2, mc3, mc4];
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  const fetchCompanies = () => {
    axios
      .get("http://localhost:5000/api/medicine-companies")
      .then((res) => {
        setCompanies(res.data);
        setFilteredCompanies(res.data);
      })
      .catch((err) => console.error("Error fetching companies:", err));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Search
  useEffect(() => {
    const q = (searchQuery || "").toLowerCase();
    const filtered = companies.filter((company) =>
      `${company.companyName} ${company.registrationNumber} ${company.address} ${company.contactNo} ${company.email} ${company.website} ${company.emergencyContacts?.join(" ")}`
        .toLowerCase()
        .includes(q)
    );
    setFilteredCompanies(filtered);
  }, [searchQuery, companies]);

  const handleAddNew = () => {
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this company?")) {
      axios
        .delete(`http://localhost:5000/api/medicine-companies/${id}`)
        .then(() => fetchCompanies())
        .catch((err) => console.error("Error deleting company:", err));
    }
  };

  // Sanitize number for wa.me (digits only)
  const formatWhatsAppNumber = (input) => {
    if (!input) return "";
    const digits = String(input).replace(/[^\d]/g, "");
    return digits;
  };

  // Download PDF (respects current search)
  const handleDownloadPDF = () => {
    const data = filteredCompanies.length ? filteredCompanies : companies;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("Medicine Companies", 14, 18);
    doc.setFontSize(11);
    const ts = new Date().toLocaleString();
    const summary = searchQuery
      ? `Filtered (${data.length}/${companies.length}) • Search: "${searchQuery}" • Generated: ${ts}`
      : `Total: ${data.length} • Generated: ${ts}`;
    doc.text(summary, 14, 26);

    // Table
    autoTable(doc, {
      head: [[
        "Company Name",
        "Registration No",
        "Address",
        "Contact No",
        "Emergency Contacts",
        "Email",
        "Website",
      ]],
      body: data.map((c) => [
        c.companyName || "",
        c.registrationNumber || "",
        c.address || "",
        c.contactNo || "",
        Array.isArray(c.emergencyContacts) ? c.emergencyContacts.join(", ") : (c.emergencyContacts || ""),
        c.email || "",
        c.website || "",
      ]),
      startY: 32,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] }, // green header
    });

    // File name
    const name = searchQuery ? `MedicineCompanies_filtered.pdf` : `MedicineCompanies.pdf`;
    doc.save(name);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Hero Slideshow */}
        <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
          <img
            src={slides[slideIndex]}
            alt="Medicine companies slide"
            className="w-full h-64 md:h-80 lg:h-96 object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow">
              Medicine Companies
            </h1>
            <p className="mt-3 text-lg md:text-2xl font-semibold drop-shadow">
              Suppliers, contacts and registrations
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

        {/* Top Section: Add Button, Download PDF, and Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Left: Add + Download */}
          <div className="flex items-center gap-3">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
              onClick={handleAddNew}
            >
              <span>➕ Add New Company</span>
            </button>
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
              onClick={handleDownloadPDF}
              title="Download a PDF of the current list (respects search)"
            >
              <span>📄 Download PDF</span>
            </button>
          </div>

          {/* Right: Search */}
          <div className="flex items-center w-full sm:w-auto relative">
            <input
              type="text"
              placeholder="Search medicine companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              className="w-full sm:w-80 pl-4 pr-28 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow shadow-sm placeholder-gray-400"
            />
            <button
              className="absolute right-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-1"
              onClick={() => { /* search is live as you type */ }}
            >
              <span>🔍</span>
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <H_MedicineCompanyForm
            companyId={editingId}
            onSuccess={() => {
              setShowForm(false);
              fetchCompanies();
            }}
          />
        )}

        {/* Search Results Summary */}
        {searchQuery && (
          <div className="mb-4 text-gray-600">
            Showing {filteredCompanies.length} of {companies.length} companies for "{searchQuery}"
          </div>
        )}

        {/* Company Table */}
        {filteredCompanies.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            {searchQuery ? (
              <div>
                <p className="text-lg mb-2">
                  No companies found matching "{searchQuery}"
                </p>
                <button
                  className="text-green-600 hover:text-green-700 underline"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search to view all companies
                </button>
              </div>
            ) : (
              <p>No companies found.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full table-auto">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Company Name</th>
                  <th className="px-4 py-3 text-left">Registration</th>
                  <th className="px-4 py-3 text-left">Address</th>
                  <th className="px-4 py-3 text-left">Contact No</th>
                  <th className="px-4 py-3 text-left">Emergency Contacts</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Website</th>
                  <th className="px-4 py-3 text-left">Direct Contact</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((c) => {
                  const waNumber = formatWhatsAppNumber(c.contactNo);
                  return (
                    <tr key={c._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{c.companyName}</td>
                      <td className="px-4 py-3">{c.registrationNumber}</td>
                      <td className="px-4 py-3">{c.address}</td>
                      <td className="px-4 py-3">{c.contactNo || "N/A"}</td>
                      <td className="px-4 py-3">{c.emergencyContacts?.join(", ") || "N/A"}</td>
                      <td className="px-4 py-3">{c.email || "N/A"}</td>
                      <td className="px-4 py-3">
                        {c.website ? (
                          <a
                            href={c.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline"
                          >
                            {c.website}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      {/* Direct Contact */}
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 items-center">
                          {waNumber ? (
                            <a
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              title="WhatsApp"
                              aria-label="WhatsApp"
                            >
                              <FaWhatsapp
                                size={28}
                                className="text-green-500 hover:text-green-600 hover:scale-110 transition-transform"
                              />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">No WhatsApp</span>
                          )}
                          {c.email ? (
                            <a
                              href={`mailto:${c.email}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              title="Email"
                              aria-label="Email"
                            >
                              <FiMail
                                size={28}
                                className="text-blue-500 hover:text-blue-600 hover:scale-110 transition-transform"
                              />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">No Email</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 items-center">
                          <button
                            onClick={() => handleEdit(c._id)}
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default H_MedicineCompany;