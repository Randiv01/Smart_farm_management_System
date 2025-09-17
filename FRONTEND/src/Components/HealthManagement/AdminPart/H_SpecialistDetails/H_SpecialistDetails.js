import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import H_SpecialistForm from "./H_SpecialistForm.js";

// Import button icons
import editIcon from "../../ButtonIcon/editButton.png";
import deleteIcon from "../../ButtonIcon/deleteButton.png";
import emailIcon from "../../ButtonIcon/emailButton.png";
import whatsappIcon from "../../ButtonIcon/whatsappButton.png";

const H_SpecialistDetails = () => {
  const [specialists, setSpecialists] = useState([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Fetch all specialists
  const fetchSpecialists = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/specialists")
      .then((res) => {
        setSpecialists(res.data);
        setFilteredSpecialists(res.data); // Initialize filtered list
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
      `${s.fullName} ${s.email} ${s.specializations.join(" ")}`
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
      Array.isArray(s.specializations)
        ? s.specializations.join(", ")
        : s.specializations,
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

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-green-700 mb-8 text-center tracking-tight">
          Mount Olive Specialist Details
        </h1>

        {/* Top Buttons and Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search Bar with 🔍 Search Button */}
          <div className="flex items-center w-full sm:w-auto relative">
            <input
              type="text"
              placeholder="Search by name, email, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-80 pl-4 pr-28 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow shadow-sm placeholder-gray-400"
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
          <H_SpecialistForm
            specialistId={editingId}
            onSuccess={() => {
              setShowForm(false);
              fetchSpecialists();
            }}
          />
        )}

        {/* Table */}
        {loading ? (
          <p className="text-center text-gray-600 text-lg">Loading specialists...</p>
        ) : error ? (
          <p className="text-center text-red-600 text-lg">{error}</p>
        ) : filteredSpecialists.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">No specialists found.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
            <table className="w-full table-auto">
              <thead className="bg-green-600 text-white">
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
              <tbody>
                {filteredSpecialists.map((s) => (
                  <tr key={s._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {s.profilePhoto ? (
                        <img
                          src={`http://localhost:5000/Health_Uploads/${s.profilePhoto}`}
                          alt={s.fullName}
                          className="w-12 h-12 rounded-full object-cover shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{s.fullName}</td>
                    <td className="px-4 py-3 text-gray-800">{s.email}</td>
                    <td className="px-4 py-3 text-gray-800">{s.phoneNo}</td>
                    <td className="px-4 py-3 text-gray-800">{s.medicalLicenseNumber}</td>
                    <td className="px-4 py-3 text-gray-800">
                      {Array.isArray(s.specializations)
                        ? s.specializations.join(", ")
                        : s.specializations}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{s.qualifications}</td>
                    <td className="px-4 py-3 text-gray-800">{s.yearsOfExperience}</td>
                    <td className="px-4 py-3 text-gray-800">
                      {s.dateOfBirth ? s.dateOfBirth.split("T")[0] : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{s.gender}</td>

                    {/* Direct Contact */}
                    <td className="px-4 py-3 flex space-x-2 items-center">
                      <a
                        href={`https://wa.me/${s.phoneNo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp"
                      >
                        <img
                          src={whatsappIcon}
                          alt="WhatsApp"
                          className="w-7 h-7 object-contain hover:scale-110 transition-transform"
                        />
                      </a>
                      <a
                        href={`mailto:${s.email}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Email"
                      >
                        <img
                          src={emailIcon}
                          alt="Email"
                          className="w-7 h-7 object-contain hover:scale-110 transition-transform"
                        />
                      </a>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 flex space-x-2 items-center">
                      <button
                        title="Edit"
                        onClick={() => handleEdit(s._id)}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        <img
                          src={editIcon}
                          alt="Edit"
                          className="w-7 h-7 object-contain hover:scale-110 transition-transform"
                        />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => handleDelete(s._id)}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        <img
                          src={deleteIcon}
                          alt="Delete"
                          className="w-7 h-7 object-contain hover:scale-110 transition-transform"
                        />
                      </button>
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

export default H_SpecialistDetails;
