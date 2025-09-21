import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import H_PlantPathologistForm from "./H_PlantPathologistForm.js";

import { FaWhatsapp } from "react-icons/fa";
import { FiMail, FiEdit2, FiTrash2 } from "react-icons/fi";

import hp1 from "../../../UserHome/Images/healthPlant1.webp";
import hp4 from "../../../UserHome/Images/healthplanat4.jpg";
import hp3 from "../../../UserHome/Images/healthplanat3.webp";
import hp2 from "../../../UserHome/Images/healthplanat2.jpg";

const API_BASE = "http://localhost:5000";

const H_PlantPathologist = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const slides = [hp1, hp4, hp3, hp2];
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/plant-pathologists`);
      setEntries(res.data);
    } catch (err) {
      console.error("Error fetching plant pathologists:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await axios.delete(`${API_BASE}/api/plant-pathologists/${id}`);
      fetchEntries();
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry._id);
    setInitialData(entry); // fallback data to prefill if GET by id fails
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setInitialData(null);
    setShowForm(true);
  };

  const filteredEntries = entries.filter((e) => {
    if (!searchTerm) return true;
    return Object.values(e).join(" ").toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Plant Pathologist Details", 14, 20);
    autoTable(doc, {
      head: [[
        "Full Name","Email","Phone","License",
        "Specializations","Qualifications","Experience","DOB","Gender",
      ]],
      body: filteredEntries.map((e) => [
        e.fullName || "",
        e.email || "",
        e.phoneNo || "",
        e.licenseNumber || "",
        Array.isArray(e.specializations) ? e.specializations.join(", ") : e.specializations || "",
        e.qualifications || "",
        e.yearsOfExperience ?? "",
        e.dateOfBirth ? e.dateOfBirth.split("T")[0] : "",
        e.gender || "",
      ]),
      startY: 30,
    });
    doc.save("PlantPathologists.pdf");
  };

  const formatWhatsAppNumber = (input) => {
    if (!input) return "";
    const digits = String(input).replace(/[^\d]/g, "");
    return digits;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
          <img
            src={slides[slideIndex]}
            alt="Plant pathologist slide"
            className="w-full h-64 md:h-80 lg:h-96 object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow">
              Plant Pathologist Details
            </h1>
            <p className="mt-3 text-lg md:text-2xl font-semibold drop-shadow">
              Manage and view plant pathologist profiles
            </p>
          </div>
          <div className="absolute bottom-3 right-4 flex space-x-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-all ${i === slideIndex ? "bg-white" : "bg-white/60"}`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between items-center mb-6 space-y-3 md:space-y-0">
          <div className="flex space-x-3">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
              onClick={handleAddNew}
            >
              ➕ Add New Plant Pathologist
            </button>
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
              onClick={handleDownloadPDF}
            >
              📄 Download PDF
            </button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search..."
              className="w-full md:w-80 border border-gray-300 px-4 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
              onClick={() => setSearchTerm(searchInput)}
            >
              🔍 Search
            </button>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
            <H_PlantPathologistForm
              id={editingId}
              initialData={initialData}
              onSuccess={() => {
                setShowForm(false);
                setEditingId(null);
                setInitialData(null);
                fetchEntries();
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingId(null);
                setInitialData(null);
              }}
            />
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : filteredEntries.length === 0 ? (
          <p className="text-center text-gray-600">No entries found.</p>
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
                {filteredEntries.map((d) => {
                  const waNumber = String(d.phoneNo || "").replace(/[^\d]/g, "");
                  const hasPhoto = d.profilePhoto && d.profilePhoto !== "null";
                  return (
                    <tr key={d._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {hasPhoto ? (
                          <img
                            src={`${API_BASE}/Health_Uploads/${d.profilePhoto}`}
                            alt={d.fullName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-green-500"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
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
                        {Array.isArray(d.specializations) ? d.specializations.join(", ") : d.specializations}
                      </td>
                      <td className="px-4 py-3">{d.qualifications}</td>
                      <td className="px-4 py-3">{d.yearsOfExperience}</td>
                      <td className="px-4 py-3">{d.dateOfBirth ? d.dateOfBirth.split("T")[0] : ""}</td>
                      <td className="px-4 py-3">{d.gender}</td>

                      <td className="px-4 py-3">
                        <div className="flex space-x-2 items-center">
                          <button
                            title="Edit"
                            aria-label="Edit"
                            onClick={() => handleEdit(d)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            <FiEdit2 size={28} className="text-amber-500 hover:text-amber-600 hover:scale-110 transition-transform" />
                          </button>
                          <button
                            title="Delete"
                            aria-label="Delete"
                            onClick={() => handleDelete(d._id)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            <FiTrash2 size={28} className="text-red-500 hover:text-red-600 hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>

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
                              <FaWhatsapp size={28} className="text-green-500 hover:text-green-600 hover:scale-110 transition-transform" />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">No WhatsApp</span>
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
                              <FiMail size={28} className="text-blue-500 hover:text-blue-600 hover:scale-110 transition-transform" />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">No Email</span>
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

export default H_PlantPathologist;