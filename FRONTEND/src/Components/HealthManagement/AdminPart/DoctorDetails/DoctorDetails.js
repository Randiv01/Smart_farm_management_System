import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DoctorForm from "./DoctorForm.js";

// Import button icons
import editIcon from "../../ButtonIcon/editButton.png";
import deleteIcon from "../../ButtonIcon/deleteButton.png";
import emailIcon from "../../ButtonIcon/emailButton.png";
import whatsappIcon from "../../ButtonIcon/whatsappButton.png";

const DoctorDetails = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  // Fetch doctors from backend
  const fetchDoctors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/doctors");
      setDoctors(res.data);
      setFilteredDoctors(res.data); // initialize filtered list
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Delete doctor
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      await axios.delete(`http://localhost:5000/api/doctors/${id}`);
      fetchDoctors();
    }
  };

  // Download doctor details as PDF
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
      body: doctors.map((d) => [
        d.fullName,
        d.email,
        d.phoneNo,
        d.licenseNumber,
        Array.isArray(d.specializations)
          ? d.specializations.join(", ")
          : d.specializations,
        d.qualifications,
        d.yearsOfExperience,
        d.dateOfBirth ? d.dateOfBirth.split("T")[0] : "",
        d.gender,
      ]),
      startY: 30,
    });
    doc.save("Doctors.pdf");
  };

  // Edit doctor
  const handleEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

  // Add new doctor
  const handleAddNew = () => {
    setEditingId(null);
    setShowForm(true);
  };

  // Handle search button click
  const handleSearch = () => {
    const query = searchQuery.toLowerCase();
    const filtered = doctors.filter((d) => {
      return (
        d.fullName?.toLowerCase().includes(query) ||
        d.email?.toLowerCase().includes(query) ||
        d.phoneNo?.toLowerCase().includes(query) ||
        d.licenseNumber?.toLowerCase().includes(query) ||
        (Array.isArray(d.specializations)
          ? d.specializations.join(", ").toLowerCase()
          : d.specializations?.toLowerCase()
        )?.includes(query)
      );
    });
    setFilteredDoctors(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">
          Doctor Details
        </h1>

        {/* Top controls (Add, Download, Search) */}
        <div className="flex flex-col md:flex-row md:justify-between items-center mb-6 space-y-3 md:space-y-0">
          <div className="flex space-x-3">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
              onClick={handleAddNew}
            >
              ➕Add New Doctor
            </button>
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
              onClick={handleDownloadPDF}
            >
              📄Download Doctor Details
            </button>
          </div>

          {/* 🔍 Search bar with button */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 rounded-l-md focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleSearch}
              className="absolute right-0 top-0 h-full bg-green-600 text-white px-4 rounded-r-md hover:bg-green-700 transition flex items-center justify-center"
            >
              🔍 Search
            </button>
          </div>
        </div>

        {/* Doctor form (add/edit) */}
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

        {/* Doctor table */}
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
                {filteredDoctors.map((d) => (
                  <tr key={d._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img
                        src={`http://localhost:5000/Health_Uploads/${d.profilePhoto}`}
                        alt={d.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
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

                    {/* Actions */}
                    <td className="px-4 py-3 flex space-x-3">
                      <button onClick={() => handleEdit(d._id)}>
                        <img
                          src={editIcon}
                          alt="Edit"
                          title="Edit"
                          className="w-8 h-8 cursor-pointer"
                        />
                      </button>
                      <button onClick={() => handleDelete(d._id)}>
                        <img
                          src={deleteIcon}
                          alt="Delete"
                          title="Delete"
                          className="w-8 h-8 cursor-pointer"
                        />
                      </button>
                    </td>

                    {/* Direct Contact */}
                    <td className="px-4 py-3 flex space-x-3">
                      <a
                        href={`https://wa.me/${d.phoneNo}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={whatsappIcon}
                          alt="WhatsApp"
                          title="WhatsApp"
                          className="w-8 h-8 cursor-pointer"
                        />
                      </a>
                      <a href={`mailto:${d.email}`} target="_blank" rel="noreferrer">
                        <img
                          src={emailIcon}
                          alt="Email"
                          title="Email"
                          className="w-8 h-8 cursor-pointer"
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

export default DoctorDetails;
