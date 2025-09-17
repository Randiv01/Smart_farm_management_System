// src/Components/HealthManagement/PlantPathologistPart/FertiliserCompanies.js
import React, { useEffect, useState } from "react";
import axios from "axios";

// Import icon images (correct relative paths)
import whatsappIcon from "../ButtonIcon/whatsappButton.png";
import emailIcon from "../ButtonIcon/emailButton.png";
import editIcon from "../ButtonIcon/editButton.png";
import deleteIcon from "../ButtonIcon/deleteButton.png";

const FertiliserCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    contact: "",
    email: "",
    country: "",
  });

  // Fetch all companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/fertiliser-companies");
      setCompanies(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setCompanyForm({ ...companyForm, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/fertiliser-companies/${editingId}`,
          companyForm
        );
        alert("Company updated successfully!");
        setEditingId(null);
      } else {
        await axios.post(
          "http://localhost:5000/api/fertiliser-companies",
          companyForm
        );
        alert("Company added successfully!");
      }
      setCompanyForm({ name: "", contact: "", email: "", country: "" });
      fetchCompanies();
    } catch (err) {
      console.error(err);
      alert("Error saving company!");
    }
  };

  // Handle edit button click
  const handleEdit = (company) => {
    setEditingId(company._id);
    setCompanyForm({
      name: company.name,
      contact: company.contact,
      email: company.email,
      country: company.country || "",
    });
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/fertiliser-companies/${id}`);
      alert("Company deleted successfully!");
      fetchCompanies();
    } catch (err) {
      console.error(err);
      alert("Error deleting company!");
    }
  };

  return (
    <div className="p-6">
      {/* Add / Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded shadow"
      >
        <input
          type="text"
          name="name"
          value={companyForm.name}
          onChange={handleChange}
          placeholder="Company Name"
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="contact"
          value={companyForm.contact}
          onChange={handleChange}
          placeholder="Contact Number"
          className="border p-2 rounded"
          required
        />
        <input
          type="email"
          name="email"
          value={companyForm.email}
          onChange={handleChange}
          placeholder="Email"
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="country"
          value={companyForm.country}
          onChange={handleChange}
          placeholder="Country"
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 col-span-1 md:col-span-1"
        >
          {editingId ? "Update Company" : "➕ Add Company"}
        </button>
      </form>

      {/* Companies List */}
      {loading ? (
        <p>Loading companies...</p>
      ) : companies.length === 0 ? (
        <p>No companies found.</p>
      ) : (
        <div className="space-y-2">
          {companies.map((c) => (
            <div
              key={c._id}
              className="flex justify-between items-center border p-3 rounded shadow hover:bg-gray-50"
            >
              <div>
                <p className="font-semibold">{c.name}</p>
                <p>Contact: {c.contact}</p>
                <p>Email: {c.email}</p>
                <p>Country: {c.country || "-"}</p>
              </div>
              <div className="flex gap-3">
                {c.contact && (
                  <a href={`https://wa.me/${c.contact}`} target="_blank" rel="noreferrer">
                    <img
                      src={whatsappIcon}
                      alt="WhatsApp"
                      className="w-6 h-6 cursor-pointer hover:scale-110 transition"
                    />
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} target="_blank" rel="noreferrer">
                    <img
                      src={emailIcon}
                      alt="Email"
                      className="w-6 h-6 cursor-pointer hover:scale-110 transition"
                    />
                  </a>
                )}
                <button onClick={() => handleEdit(c)}>
                  <img
                    src={editIcon}
                    alt="Edit"
                    className="w-6 h-6 cursor-pointer hover:scale-110 transition"
                  />
                </button>
                <button onClick={() => handleDelete(c._id)}>
                  <img
                    src={deleteIcon}
                    alt="Delete"
                    className="w-6 h-6 cursor-pointer hover:scale-110 transition"
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FertiliserCompanies;
