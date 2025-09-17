import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import H_PlantPathologistForm from "./H_PlantPathologistForm.js";

// Import button icons
import editIcon from "../../ButtonIcon/editButton.png";
import deleteIcon from "../../ButtonIcon/deleteButton.png";
import emailIcon from "../../ButtonIcon/emailButton.png";
import whatsappIcon from "../../ButtonIcon/whatsappButton.png";

const H_PlantPathologist = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [searchInput, setSearchInput] = useState(""); // input value
  const [searchTerm, setSearchTerm] = useState("");   // applied filter

  const fetchEntries = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/plant-pathologists");
      setEntries(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      await axios.delete(`http://localhost:5000/api/plant-pathologists/${id}`);
      fetchEntries();
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Plant Pathologist Details", 14, 20);
    autoTable(doc, {
      head: [["Full Name", "Email", "Phone", "License", "Specializations", "Qualifications", "Experience", "DOB", "Gender"]],
      body: filteredEntries.map(e => [
        e.fullName,
        e.email,
        e.phoneNo,
        e.licenseNumber,
        Array.isArray(e.specializations) ? e.specializations.join(", ") : e.specializations,
        e.qualifications,
        e.yearsOfExperience,
        e.dateOfBirth ? e.dateOfBirth.split("T")[0] : "",
        e.gender
      ]),
      startY: 30
    });
    doc.save("PlantPathologists.pdf");
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setShowForm(true);
  };

  // Filter entries based on search term
  const filteredEntries = entries.filter((e) => {
    if (!searchTerm) return true;
    return Object.values(e)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Plant Pathologist Details</h1>

      {/* Buttons and Search */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <button
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded shadow-md transition-transform transform hover:scale-105"
          onClick={handleAddNew}
        >
          ➕Add New Plant Pathologist
        </button>
        <button
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded shadow-md transition-transform transform hover:scale-105"
          onClick={handleDownloadPDF}
        >
          📄Download PDF
        </button>
        {/* Search Bar */}
        <div className="flex gap-2 ml-auto">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search..."
            className="border border-gray-300 p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded shadow-md transition-transform transform hover:scale-105"
            onClick={() => setSearchTerm(searchInput)}
          >
            🔍 Search
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md border border-gray-200">
          <H_PlantPathologistForm
            id={editingId}
            onSuccess={() => { setShowForm(false); fetchEntries(); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-gray-500 text-center">Loading...</p>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Photo", "Full Name", "Email", "Phone", "License", "Specializations", "Qualifications", "Experience", "DOB", "Gender", "Actions", "Direct Contact"].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.map((d) => (
                <tr key={d._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {d.profilePhoto && (
                      <img
                        src={`http://localhost:5000/Health_Uploads/${d.profilePhoto}`}
                        alt={d.fullName}
                        className="w-12 h-12 object-cover rounded-full mx-auto"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2">{d.fullName}</td>
                  <td className="px-4 py-2">{d.email}</td>
                  <td className="px-4 py-2">{d.phoneNo}</td>
                  <td className="px-4 py-2">{d.licenseNumber}</td>
                  <td className="px-4 py-2">
                    {Array.isArray(d.specializations) ? d.specializations.join(", ") : d.specializations}
                  </td>
                  <td className="px-4 py-2">{d.qualifications}</td>
                  <td className="px-4 py-2">{d.yearsOfExperience}</td>
                  <td className="px-4 py-2">{d.dateOfBirth ? d.dateOfBirth.split("T")[0] : ""}</td>
                  <td className="px-4 py-2">{d.gender}</td>

                  {/* Actions */}
                  <td className="px-4 py-2 flex gap-2 justify-center">
                    <button title="Edit" onClick={() => handleEdit(d._id)} className="p-1 rounded hover:bg-gray-100 transition-colors">
                      <img src={editIcon} alt="Edit" className="w-12 h-12 object-contain hover:scale-110 transition-transform" />
                    </button>
                    <button title="Delete" onClick={() => handleDelete(d._id)} className="p-1 rounded hover:bg-gray-100 transition-colors">
                      <img src={deleteIcon} alt="Delete" className="w-12 h-12 object-contain hover:scale-110 transition-transform" />
                    </button>
                  </td>

                  {/* Direct Contact */}
                  <td className="px-4 py-2 flex gap-2 justify-center">
                    <a href={`https://wa.me/${d.phoneNo}`} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-gray-100 transition-colors">
                      <img src={whatsappIcon} alt="WhatsApp" className="w-12 h-12 object-contain hover:scale-110 transition-transform" />
                    </a>
                    <a href={`mailto:${d.email}`} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-gray-100 transition-colors">
                      <img src={emailIcon} alt="Email" className="w-12 h-12 object-contain hover:scale-110 transition-transform" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default H_PlantPathologist;
