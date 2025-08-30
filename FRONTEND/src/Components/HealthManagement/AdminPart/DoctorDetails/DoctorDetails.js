import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DoctorForm from "./DoctorForm.js";

const DoctorDetails = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Fetch doctors from backend
  const fetchDoctors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/doctors");
      setDoctors(res.data);
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
      head: [["Full Name", "Email", "Phone", "License", "Specializations", "Qualifications", "Experience", "DOB", "Gender"]],
      body: doctors.map(d => [
        d.fullName,
        d.email,
        d.phoneNo,
        d.licenseNumber,
        Array.isArray(d.specializations) ? d.specializations.join(", ") : d.specializations,
        d.qualifications,
        d.yearsOfExperience,
        d.dateOfBirth ? d.dateOfBirth.split("T")[0] : "",
        d.gender
      ]),
      startY: 30
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">Doctor Details</h1>

        {/* Buttons */}
        <div className="flex justify-between mb-6">
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
            onClick={handleAddNew}
          >
            <i className="fas fa-user-plus"></i>
            <span>Add New Doctor</span>
          </button>
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
            onClick={handleDownloadPDF}
          >
            <i className="fas fa-download"></i>
            <span>Download Doctor Details</span>
          </button>
        </div>

        {/* Doctor form (add/edit) */}
        {showForm && (
          <DoctorForm
            doctorId={editingId}
            onSuccess={() => { setShowForm(false); fetchDoctors(); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Doctor table */}
        {loading ? (
          <p className="text-center text-gray-600">Loading doctors...</p>
        ) : doctors.length === 0 ? (
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
                </tr>
              </thead>
              <tbody>
                {doctors.map(d => (
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
                    <td className="px-4 py-3">{Array.isArray(d.specializations) ? d.specializations.join(", ") : d.specializations}</td>
                    <td className="px-4 py-3">{d.qualifications}</td>
                    <td className="px-4 py-3">{d.yearsOfExperience}</td>
                    <td className="px-4 py-3">{d.dateOfBirth ? d.dateOfBirth.split("T")[0] : ""}</td>
                    <td className="px-4 py-3">{d.gender}</td>
                    <td className="px-4 py-3 flex space-x-2">
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition flex items-center space-x-1"
                        onClick={() => handleEdit(d._id)}
                      >
                        <i className="fas fa-edit"></i>
                        <span>Edit</span>
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition flex items-center space-x-1"
                        onClick={() => handleDelete(d._id)}
                      >
                        <i className="fas fa-trash"></i>
                        <span>Delete</span>
                      </button>
                      <a href={`https://wa.me/${d.phoneNo}`} target="_blank" rel="noreferrer">
                        <button className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition flex items-center space-x-1">
                          <i className="fab fa-whatsapp"></i>
                          <span>WhatsApp</span>
                        </button>
                      </a>
                      <a href={`mailto:${d.email}`} target="_blank" rel="noreferrer">
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

export default DoctorDetails;