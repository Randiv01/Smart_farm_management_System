// DoctorDetails.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DoctorForm from "./DoctorForm.js";

// React Icons (replacing PNGs)
import { FaWhatsapp } from "react-icons/fa";
import { FiMail, FiEdit2, FiTrash2 } from "react-icons/fi";

// Slideshow images (adjust the paths if needed)
import med1 from "../../../UserHome/Images/medistock1.jpg";
import med2 from "../../../UserHome/Images/medistock2.jpg";
import med3 from "../../../UserHome/Images/medistock3.webp";
import med4 from "../../../UserHome/Images/medistore5.webp";

const API_BASE = "http://localhost:5000";

const DoctorDetails = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [errMsg, setErrMsg] = useState("");

  // Hero slideshow (same size/behavior as Dashboard)
  const slides = [med1, med2, med3, med4];
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  // Build correct image URL regardless of how profilePhoto is stored
  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    let p = String(photo).trim();
    if (!p) return null;

    // If it's already a URL, use it
    if (/^https?:\/\//i.test(p)) return p;

    // Normalize backslashes to forward slashes
    p = p.replace(/\\/g, "/");

    // Get just the filename from any stored path
    const filename = p.split("/").pop();
    const lower = p.toLowerCase();

    // Decide which static path to use based on stored path
    if (lower.includes("health_uploads") || lower.includes("healthmanagement/health_uploads")) {
      return `${API_BASE}/Health_Uploads/${filename}`;
    }
    if (lower.includes("uploads/")) {
      return `${API_BASE}/uploads/${filename}`;
    }
    // Default to Health_Uploads since your Dashboard uses that and it works
    return `${API_BASE}/Health_Uploads/${filename}`;
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setErrMsg("");
      const res = await axios.get(`${API_BASE}/api/doctors`);
      setDoctors(res.data);
      setFilteredDoctors(res.data);
    } catch (err) {
      console.error(err);
      setErrMsg(err?.response?.data?.message || "Failed to fetch doctors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await axios.delete(`${API_BASE}/api/doctors/${id}`);
      fetchDoctors();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete doctor.");
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Doctor Details", 14, 20);
    autoTable(doc, {
      head: [
        [
          "Full Name",
          "Email",
          "Phone",
          "License",
          "Specializations",
          "Qualifications",
          "Experience",
          "DOB",
          "Gender",
        ],
      ],
      body: filteredDoctors.map((d) => [
        d.fullName || "",
        d.email || "",
        d.phoneNo || "",
        d.licenseNumber || "",
        Array.isArray(d.specializations) ? d.specializations.join(", ") : d.specializations || "",
        d.qualifications || "",
        d.yearsOfExperience ?? "",
        d.dateOfBirth ? d.dateOfBirth.split("T")[0] : "",
        d.gender || "",
      ]),
      startY: 30,
    });
    doc.save("Doctors.pdf");
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setShowForm(true);
  };

  const handleSearch = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return setFilteredDoctors(doctors);

    const filtered = doctors.filter((d) => {
      const specStr = Array.isArray(d.specializations)
        ? d.specializations.join(", ").toLowerCase()
        : (d.specializations || "").toLowerCase();

      return (
        (d.fullName || "").toLowerCase().includes(query) ||
        (d.email || "").toLowerCase().includes(query) ||
        (d.phoneNo || "").toLowerCase().includes(query) ||
        (d.licenseNumber || "").toLowerCase().includes(query) ||
        specStr.includes(query)
      );
    });
    setFilteredDoctors(filtered);
  };

  // Sanitize number for wa.me (digits only)
  const formatWhatsAppNumber = (input) => {
    if (!input) return "";
    const digits = String(input).replace(/[^\d]/g, "");
    return digits;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Hero Slideshow */}
        <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
          <img
            src={slides[slideIndex]}
            alt="Doctor details slide"
            className="w-full h-64 md:h-80 lg:h-96 object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow">
              Doctor Details
            </h1>
            <p className="mt-3 text-lg md:text-2xl font-semibold drop-shadow">
              Manage and view doctor profiles
            </p>
          </div>
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
        <div className="flex flex-col md:flex-row md:justify-between items-center mb-6 space-y-3 md:space-y-0">
          <div className="flex space-x-3">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
              onClick={handleAddNew}
            >
              ➕ Add New Doctor
            </button>
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
              onClick={handleDownloadPDF}
            >
              📄 Download Doctor Details
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full border border-gray-300 px-4 py-2 rounded-l-md focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleSearch}
              className="absolute right-0 top-0 h-full bg-green-600 text-white px-4 rounded-r-md hover:bg-green-700 transition flex items-center justify-center"
            >
              🔍
            </button>
          </div>
        </div>

        {/* Form modal */}
        {showForm && (
          <DoctorForm
            doctorId={editingId}
            onSuccess={() => {
              setShowForm(false);
              fetchDoctors();
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Errors */}
        {errMsg && <p className="text-center text-red-600 mb-4">{errMsg}</p>}

        {/* Table */}
        {loading ? (
          <p className="text-center text-gray-600">Loading doctors...</p>
        ) : filteredDoctors.length === 0 ? (
          <p className="text-center text-gray-600">No doctors found.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full table-auto">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Photo</th>
                  <th className="px-4 py-3 text-left">Full Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">License</th>
                  <th className="px-4 py-3 text-left">Specializations</th>
                  <th className="px-4 py-3 text-left">Qualifications</th>
                  <th className="px-4 py-3 text-left">Experience</th>
                  <th className="px-4 py-3 text-left">DOB</th>
                  <th className="px-4 py-3 text-left">Gender</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                  <th className="px-4 py-3 text-left">Direct Contact</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map((d) => {
                  const photoUrl = getPhotoUrl(d.profilePhoto);
                  const waNumber = formatWhatsAppNumber(d.phoneNo);
                  return (
                    <tr key={d._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={d.fullName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-green-500"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                            {d.fullName ? d.fullName.charAt(0) : "?"}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{d.fullName}</td>
                      <td className="px-4 py-3">{d.email}</td>
                      <td className="px-4 py-3">{d.phoneNo}</td>
                      <td className="px-4 py-3">{d.licenseNumber}</td>
                      <td className="px-4 py-3">
                        {Array.isArray(d.specializations)
                          ? d.specializations.join(", ")
                          : d.specializations}
                      </td>
                      <td className="px-4 py-3">{d.qualifications}</td>
                      <td className="px-4 py-3">{d.yearsOfExperience}</td>
                      <td className="px-4 py-3">
                        {d.dateOfBirth ? d.dateOfBirth.split("T")[0] : ""}
                      </td>
                      <td className="px-4 py-3">{d.gender}</td>

                      {/* Actions (icon-only) */}
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 items-center">
                          <button
                            onClick={() => handleEdit(d._id)}
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
                            onClick={() => handleDelete(d._id)}
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

                      {/* Direct contact (icon-only) */}
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 items-center">
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
                          ) : (
                            <span
                              className="p-1 rounded text-gray-300"
                              title="No WhatsApp number"
                            >
                              <FaWhatsapp size={28} />
                            </span>
                          )}

                          {d.email ? (
                            <a
                              href={`mailto:${d.email}`}
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
                          ) : (
                            <span
                              className="p-1 rounded text-gray-300"
                              title="No email"
                            >
                              <FiMail size={28} />
                            </span>
                          )}
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

export default DoctorDetails;