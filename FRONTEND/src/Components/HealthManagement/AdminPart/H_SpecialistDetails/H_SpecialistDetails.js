import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import H_SpecialistForm from "./H_SpecialistForm.js";

const H_SpecialistDetails = () => {
  const [specialists, setSpecialists] = useState([]);
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

  // Delete specialist
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this specialist?")) {
      axios
        .delete(`http://localhost:5000/api/specialists/${id}`)
        .then(() => fetchSpecialists())
        .catch((err) => console.error(err));
    }
  };

  // Open form for edit
  const handleEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

  // Open form for new specialist
  const handleAddNew = () => {
    setEditingId(null);
    setShowForm(true);
  };

  // Generate PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    // Title
    doc.setFontSize(18);
    doc.text("Mount Olive Specialist Details", 14, 20);
    // Date
    const today = new Date().toLocaleDateString();
    doc.setFontSize(11);
    doc.text(`Generated on: ${today}`, 14, 28);
    // Table Columns
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
    // Table Rows
    const tableRows = specialists.map((s) => [
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
    // Use autoTable
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 160, 133] },
    });
    // Save PDF
    doc.save("Mount_Olive_Specialists.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">Mount Olive Specialist Details</h1>

        {/* Buttons */}
        <div className="flex justify-between mb-6">
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
            onClick={handleAddNew}
          >
            <i className="fas fa-user-plus"></i>
            <span>Add New Specialist</span>
          </button>
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
            onClick={handleDownloadPDF}
          >
            <i className="fas fa-download"></i>
            <span>Download PDF</span>
          </button>
        </div>

        {/* Specialist form (add/edit) */}
        {showForm && (
          <H_SpecialistForm
            specialistId={editingId}
            onSuccess={() => {
              setShowForm(false);
              fetchSpecialists();
            }}
          />
        )}

        {/* Specialist table */}
        {loading ? (
          <p className="text-center text-gray-600">Loading specialists...</p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : specialists.length === 0 ? (
          <p className="text-center text-gray-600">No specialists found.</p>
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
                {specialists.map((s) => (
                  <tr key={s._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img
                        src={`http://localhost:5000/Health_Uploads/${s.profilePhoto}`}
                        alt={s.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
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
                    <td className="px-4 py-3 flex space-x-2">
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition flex items-center space-x-1"
                        onClick={() => handleEdit(s._id)}
                      >
                        <i className="fas fa-edit"></i>
                        <span>Edit</span>
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition flex items-center space-x-1"
                        onClick={() => handleDelete(s._id)}
                      >
                        <i className="fas fa-trash"></i>
                        <span>Delete</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 flex space-x-2">
                      <a href={`https://wa.me/${s.phoneNo}`} target="_blank" rel="noopener noreferrer">
                        <button className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition flex items-center space-x-1">
                          <i className="fab fa-whatsapp"></i>
                          <span>WhatsApp</span>
                        </button>
                      </a>
                      <a href={`mailto:${s.email}`} target="_blank" rel="noopener noreferrer">
                        <button className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition flex items-center space-x-1">
                          <i className="fas fa-envelope"></i>
                          <span>Email</span>
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
    </div>
  );
};

export default H_SpecialistDetails;