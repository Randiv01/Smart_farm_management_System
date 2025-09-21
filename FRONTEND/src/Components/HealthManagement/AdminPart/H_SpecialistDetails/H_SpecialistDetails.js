// frontend/src/components/H_SpecialistDetails.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import H_SpecialistForm from "./H_SpecialistForm.js";

// React Icons (replacing PNGs)
import { FaWhatsapp } from "react-icons/fa";
import { FiMail, FiEdit2, FiTrash2 } from "react-icons/fi";

// Hero slideshow images (adjust paths if needed)
import sp1 from "../../../UserHome/Images/specilist1.jpg";
import sp2 from "../../../UserHome/Images/specilist2.jpg";
import sp3 from "../../../UserHome/Images/specilist3.jpg";
import sp4 from "../../../UserHome/Images/specilist4.jpg";

const H_SpecialistDetails = () => {
  const [specialists, setSpecialists] = useState([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("darkMode");
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

  // Hero slideshow (same size/style as other pages)
  const slides = [sp1, sp2, sp3, sp4];
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 6000); // 6 seconds
    return () => clearInterval(id);
  }, [slides.length]);

  // Listen for dark mode changes
  useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem("darkMode");
      if (savedTheme) {
        setDarkMode(JSON.parse(savedTheme));
      }
    };

    window.addEventListener("storage", handleThemeChange);
    const interval = setInterval(handleThemeChange, 1000);

    return () => {
      window.removeEventListener("storage", handleThemeChange);
      clearInterval(interval);
    };
  }, []);

  // Apply dark mode class to body for full page styling
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  // Fetch all specialists
  const fetchSpecialists = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/specialists")
      .then((res) => {
        setSpecialists(res.data);
        setFilteredSpecialists(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch specialists");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSpecialists();
  }, []);

  // Handle search
  useEffect(() => {
    const filtered = specialists.filter((s) =>
      `${s.fullName} ${s.email} ${Array.isArray(s.specializations) ? s.specializations.join(" ") : s.specializations}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
    setFilteredSpecialists(filtered);
  }, [searchQuery, specialists]);

  // Delete specialist
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this specialist?")) {
      axios
        .delete(`http://localhost:5000/api/specialists/${id}`)
        .then(() => fetchSpecialists())
        .catch((err) => console.error(err));
    }
  };

  // Edit specialist
  const handleEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

  // Add new specialist
  const handleAddNew = () => {
    setEditingId(null);
    setShowForm(true);
  };

  // Download PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Mount Olive Specialist Details", 14, 20);

    const today = new Date().toLocaleDateString();
    doc.setFontSize(11);
    doc.text(`Generated on: ${today}`, 14, 28);

    const tableColumn = [
      "Full Name",
      "Email",
      "Phone",
      "License",
      "Specializations",
      "Qualifications",
      "Experience",
      "DOB",
      "Gender",
    ];

    const tableRows = filteredSpecialists.map((s) => [
      s.fullName,
      s.email,
      s.phoneNo,
      s.medicalLicenseNumber,
      Array.isArray(s.specializations) ? s.specializations.join(", ") : s.specializations,
      s.qualifications,
      s.yearsOfExperience,
      s.dateOfBirth ? s.dateOfBirth.split("T")[0] : "",
      s.gender,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save("Mount_Olive_Specialists.pdf");
  };

  // Sanitize number for wa.me (digits only)
  const formatWhatsAppNumber = (input) => {
    if (!input) return "";
    const digits = String(input).replace(/[^\d]/g, "");
    return digits;
  };

  // Component for the specialist form
  const SpecialistForm = H_SpecialistForm;

  return (
    <div
      className={`min-h-screen p-6 font-sans transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto">

        {/* Hero Slideshow */}
        <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
          <img
            src={slides[slideIndex]}
            alt="Specialist details slide"
            className="w-full h-64 md:h-80 lg:h-96 object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow">
              Mount Olive Specialist Details
            </h1>
            <p className="mt-3 text-lg md:text-2xl font-semibold drop-shadow">
              Profiles, contacts and expertise
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

        {/* Top Buttons and Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search Bar with Search Button */}
          <div className="flex items-center w-full sm:w-auto relative">
            <input
              type="text"
              placeholder="Search by name, email, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full sm:w-80 pl-4 pr-28 py-2 rounded-l-md border focus:outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-sm placeholder-gray-400 ${
                darkMode
                  ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
            <button
              className="absolute right-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-1"
              onClick={() => {}}
            >
              <span>🔍</span>
              <span>Search</span>
            </button>
          </div>

          {/* Add New & Download Buttons */}
          <div className="flex space-x-4">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-md"
              onClick={handleAddNew}
            >
              <i className="fas fa-user-plus"></i>
              <span>➕Add New Specialist</span>
            </button>
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-md"
              onClick={handleDownloadPDF}
            >
              <i className="fas fa-download"></i>
              <span>📄Download PDF</span>
            </button>
          </div>
        </div>

        {/* Specialist Form */}
        {showForm && (
          <SpecialistForm
            specialistId={editingId}
            onSuccess={() => {
              setShowForm(false);
              fetchSpecialists();
            }}
          />
        )}

        {/* Table */}
        {loading ? (
          <p
            className={`text-center text-lg transition-colors duration-300 ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Loading specialists...
          </p>
        ) : error ? (
          <p
            className={`text-center text-lg transition-colors duration-300 ${
              darkMode ? "text-red-400" : "text-red-600"
            }`}
          >
            {error}
          </p>
        ) : filteredSpecialists.length === 0 ? (
          <p
            className={`text-center text-lg transition-colors duration-300 ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            No specialists found.
          </p>
        ) : (
          <div
            className={`overflow-x-auto rounded-lg shadow-lg transition-colors duration-300 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <table className="w-full table-auto">
              <thead
                className={`transition-colors duration-300 ${
                  darkMode ? "bg-gray-700 text-gray-100" : "bg-green-600 text-white"
                }`}
              >
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Photo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Full Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">License</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Specializations</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Qualifications</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Experience</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">DOB</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Gender</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Direct Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody
                className={`transition-colors duration-300 ${
                  darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
                }`}
              >
                {filteredSpecialists.map((s) => {
                  const waNumber = formatWhatsAppNumber(s.phoneNo);
                  return (
                    <tr
                      key={s._id}
                      className={`border-b transition-colors duration-300 ${
                        darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        {s.profilePhoto ? (
                          <img
                            src={`http://localhost:5000/Health_Uploads/${s.profilePhoto}`}
                            alt={s.fullName}
                            className="w-12 h-12 rounded-full object-cover shadow-sm"
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-full transition-colors duration-300 ${
                              darkMode ? "bg-gray-600" : "bg-gray-200"
                            }`}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">{s.fullName}</td>
                      <td className="px-4 py-3">{s.email}</td>
                      <td className="px-4 py-3">{s.phoneNo}</td>
                      <td className="px-4 py-3">{s.medicalLicenseNumber}</td>
                      <td className="px-4 py-3">
                        {Array.isArray(s.specializations)
                          ? s.specializations.join(", ")
                          : s.specializations}
                      </td>
                      <td className="px-4 py-3">{s.qualifications}</td>
                      <td className="px-4 py-3">{s.yearsOfExperience}</td>
                      <td className="px-4 py-3">{s.dateOfBirth ? s.dateOfBirth.split("T")[0] : ""}</td>
                      <td className="px-4 py-3">{s.gender}</td>

                      {/* Direct Contact Column with WhatsApp and Email Icons */}
                      <td className="px-4 py-3">
                        <div className="flex space-x-3 items-center">
                          {waNumber ? (
                            <a
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Contact via WhatsApp"
                              aria-label="WhatsApp"
                              className={`p-1 rounded transition-colors ${
                                darkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"
                              }`}
                            >
                              <FaWhatsapp
                                size={28}
                                className="text-green-500 hover:text-green-600 hover:scale-110 transition-transform"
                              />
                            </a>
                          ) : (
                            <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              No WhatsApp
                            </span>
                          )}

                          {s.email ? (
                            <a
                              href={`mailto:${s.email}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Send Email"
                              aria-label="Email"
                              className={`p-1 rounded transition-colors ${
                                darkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"
                              }`}
                            >
                              <FiMail
                                size={28}
                                className="text-blue-500 hover:text-blue-600 hover:scale-110 transition-transform"
                              />
                            </a>
                          ) : (
                            <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              No Email
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions Column with Edit and Delete Icons */}
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 items-center">
                          <button
                            title="Edit Specialist"
                            aria-label="Edit"
                            onClick={() => handleEdit(s._id)}
                            className={`p-1 rounded transition-colors ${
                              darkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"
                            }`}
                          >
                            <FiEdit2
                              size={28}
                              className="text-amber-500 hover:text-amber-600 hover:scale-110 transition-transform"
                            />
                          </button>

                          <button
                            title="Delete Specialist"
                            aria-label="Delete"
                            onClick={() => handleDelete(s._id)}
                            className={`p-1 rounded transition-colors ${
                              darkMode ? "hover:bg-red-900" : "hover:bg-red-50"
                            }`}
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

      {/* Global dark mode styles (if you rely on body.dark-mode) */}
      <style jsx global>{`
        body.dark-mode {
          background-color: #1a202c;
          color: #e2e8f0;
        }
      `}</style>
    </div>
  );
};

export default H_SpecialistDetails;