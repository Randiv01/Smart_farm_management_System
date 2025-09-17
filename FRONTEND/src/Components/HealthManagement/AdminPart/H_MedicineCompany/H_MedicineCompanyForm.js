import React, { useState, useEffect } from "react";
import axios from "axios";

const H_MedicineCompanyForm = ({ companyId, onSuccess }) => {
  const [form, setForm] = useState({
    companyName: "",
    registrationNumber: "",
    address: "",
    contactNo: "",
    emergencyContacts: "",
    email: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (companyId) {
      setLoading(true);
      axios
        .get(`http://localhost:5000/api/medicine-companies/${companyId}`)
        .then((res) => {
          const data = res.data;
          setForm({
            companyName: data.companyName || "",
            registrationNumber: data.registrationNumber || "",
            address: data.address || "",
            contactNo: data.contactNo || "",
            emergencyContacts: Array.isArray(data.emergencyContacts) ? data.emergencyContacts.join(", ") : "",
            email: data.email || "",
            website: data.website || "",
          });
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("Failed to load company data");
          setLoading(false);
        });
    }
  }, [companyId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        emergencyContacts: form.emergencyContacts.split(",").map((s) => s.trim()).filter(Boolean),
      };

      if (companyId) {
        await axios.put(`http://localhost:5000/api/medicine-companies/${companyId}`, payload);
      } else {
        await axios.post("http://localhost:5000/api/medicine-companies", payload);
      }
      onSuccess();
    } catch (err) {
      console.error(err.response || err);
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      companyName: "",
      registrationNumber: "",
      address: "",
      contactNo: "",
      emergencyContacts: "",
      email: "",
      website: "",
    });
    setError("");
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">
          {companyId ? "Edit Company" : "Add New Company"}
        </h2>
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="companyName"
              placeholder="Company Name"
              value={form.companyName}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              type="text"
              name="registrationNumber"
              placeholder="Registration / License"
              value={form.registrationNumber}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              type="text"
              name="contactNo"
              placeholder="Contact No"
              value={form.contactNo}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              type="text"
              name="emergencyContacts"
              placeholder="Emergency Contacts (comma separated)"
              value={form.emergencyContacts}
              onChange={handleChange}
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <input
              type="text"
              name="website"
              placeholder="Website"
              value={form.website}
              onChange={handleChange}
              className="w-full p-3 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <i className="fas fa-save"></i>
              <span>{companyId ? "Update Company" : "Add Company"}</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition flex items-center space-x-2"
            >
              <i className="fas fa-times"></i>
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default H_MedicineCompanyForm;