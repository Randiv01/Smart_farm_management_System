// src/Components/HealthManagement/PlantPathologistPart/FertiliserCompanies.js
import React, { useEffect, useState } from "react";
import axios from "axios";

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

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/fertiliser-companies");
      // Make sure response is an array of objects
      if (Array.isArray(res.data)) {
        setCompanies(res.data);
      } else {
        console.error("API returned invalid data:", res.data);
        setCompanies([]);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleChange = (e) => {
    setCompanyForm({ ...companyForm, [e.target.name]: e.target.value });
  };

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

  const handleEdit = (company) => {
    setEditingId(company._id);
    setCompanyForm({
      name: company.name || "",
      contact: company.contact || "",
      email: company.email || "",
      country: company.country || "",
    });
  };

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
                <p className="font-semibold">{String(c.name)}</p>
                <p>Contact: {String(c.contact)}</p>
                <p>Email: {String(c.email)}</p>
                <p>Country: {String(c.country || "-")}</p>
              </div>
              <div className="flex gap-2">
                {c.contact && (
                  <a href={`https://wa.me/${c.contact}`} target="_blank" rel="noreferrer">
                    <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                      WhatsApp
                    </button>
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} target="_blank" rel="noreferrer">
                    <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                      Email
                    </button>
                  </a>
                )}
                <button
                  onClick={() => handleEdit(c)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
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
