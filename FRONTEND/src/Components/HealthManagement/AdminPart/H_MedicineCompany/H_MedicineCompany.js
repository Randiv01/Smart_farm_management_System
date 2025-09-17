import React, { useState, useEffect } from "react";
import axios from "axios";
import H_MedicineCompanyForm from "./H_MedicineCompanyForm.js";

// Import button icons
import editIcon from "../../ButtonIcon/editButton.png";
import deleteIcon from "../../ButtonIcon/deleteButton.png";
import emailIcon from "../../ButtonIcon/emailButton.png";
import whatsappIcon from "../../ButtonIcon/whatsappButton.png";

const H_MedicineCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchCompanies = () => {
    axios
      .get("http://localhost:5000/api/medicine-companies")
      .then((res) => {
        setCompanies(res.data);
        setFilteredCompanies(res.data); // Initialize filtered list
      })
      .catch((err) => console.error("Error fetching companies:", err));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Handle search functionality
  useEffect(() => {
    const filtered = companies.filter((company) =>
      `${company.companyName} ${company.registrationNumber} ${company.address} ${company.contactNo} ${company.email} ${company.website} ${company.emergencyContacts?.join(" ")}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">
          Medicine Companies
        </h1>

        {/* Top Section: Add Button and Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Add New Company Button */}
          <div className="flex justify-start">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
              onClick={handleAddNew}
            >
              <i className="fas fa-plus"></i>
              <span>➕Add New Company</span>
            </button>
          </div>

          {/* Search Bar with 🔍 Search Button */}
          <div className="flex items-center w-full sm:w-auto relative">
            <input
              type="text"
              placeholder="Search medicine companies..."
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
            Showing {filteredCompanies.length} of {companies.length} companies
            {searchQuery && ` for "${searchQuery}"`}
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
                {filteredCompanies.map((c) => (
                  <tr key={c._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{c.companyName}</td>
                    <td className="px-4 py-3">{c.registrationNumber}</td>
                    <td className="px-4 py-3">{c.address}</td>
                    <td className="px-4 py-3">{c.contactNo || "N/A"}</td>
                    <td className="px-4 py-3">
                      {c.emergencyContacts?.join(", ") || "N/A"}
                    </td>
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

                    {/* Direct Contact Column */}
                    <td className="px-4 py-3">
                      <div className="flex space-x-2 items-center">
                        {c.contactNo ? (
                          <a
                            href={`https://wa.me/${c.contactNo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                            title="WhatsApp"
                          >
                            <img
                              src={whatsappIcon}
                              alt="WhatsApp"
                              className="w-7 h-7 object-contain hover:scale-110 transition-transform"
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
                          >
                            <img
                              src={emailIcon}
                              alt="Email"
                              className="w-7 h-7 object-contain hover:scale-110 transition-transform"
                            />
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">No Email</span>
                        )}
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="px-4 py-3">
                      <div className="flex space-x-2 items-center">
                        <button
                          onClick={() => handleEdit(c._id)}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <img
                            src={editIcon}
                            alt="Edit"
                            className="w-7 h-7 object-contain hover:scale-110 transition-transform"
                          />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                          title="Delete"
                        >
                          <img
                            src={deleteIcon}
                            alt="Delete"
                            className="w-7 h-7 object-contain hover:scale-110 transition-transform"
                          />
                        </button>
                      </div>
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
