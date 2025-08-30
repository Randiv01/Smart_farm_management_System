import React, { useState, useEffect } from "react";
import axios from "axios";
import H_MedicineCompanyForm from "./H_MedicineCompanyForm.js";

const H_MedicineCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchCompanies = () => {
    axios
      .get("http://localhost:5000/api/medicine-companies")
      .then((res) => setCompanies(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => fetchCompanies(), []);

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
        .then(fetchCompanies)
        .catch((err) => console.error(err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">Medicine Companies</h1>

        {/* Buttons */}
        <div className="flex justify-start mb-6">
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
            onClick={handleAddNew}
          >
            <i className="fas fa-plus"></i>
            <span>Add New Company</span>
          </button>
        </div>

        {/* Company form (add/edit) */}
        {showForm && (
          <H_MedicineCompanyForm
            companyId={editingId}
            onSuccess={() => {
              setShowForm(false);
              fetchCompanies();
            }}
          />
        )}

        {/* Company table */}
        {companies.length === 0 ? (
          <p className="text-center text-gray-600">No companies found.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full table-auto">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Company Name</th>
                  <th className="px-4 py-3 text-left">Registration #</th>
                  <th className="px-4 py-3 text-left">Address</th>
                  <th className="px-4 py-3 text-left">Contact No</th>
                  <th className="px-4 py-3 text-left">Emergency Contacts</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Website</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                  <th className="px-4 py-3 text-left">Direct Contact</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{c.companyName}</td>
                    <td className="px-4 py-3">{c.registrationNumber}</td>
                    <td className="px-4 py-3">{c.address}</td>
                    <td className="px-4 py-3">{c.contactNo}</td>
                    <td className="px-4 py-3">{c.emergencyContacts.join(", ")}</td>
                    <td className="px-4 py-3">{c.email}</td>
                    <td className="px-4 py-3">
                      <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                        {c.website}
                      </a>
                    </td>
                    <td className="px-4 py-3 flex space-x-2">
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition flex items-center space-x-1"
                        onClick={() => handleEdit(c._id)}
                      >
                        <i className="fas fa-edit"></i>
                        <span>Edit</span>
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition flex items-center space-x-1"
                        onClick={() => handleDelete(c._id)}
                      >
                        <i className="fas fa-trash"></i>
                        <span>Delete</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 flex space-x-2">
                      <a href={`https://wa.me/${c.contactNo}`} target="_blank" rel="noopener noreferrer">
                        <button className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition flex items-center space-x-1">
                          <i className="fab fa-whatsapp"></i>
                          <span>WhatsApp</span>
                        </button>
                      </a>
                      <a href={`mailto:${c.email}`} target="_blank" rel="noopener noreferrer">
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

export default H_MedicineCompany;