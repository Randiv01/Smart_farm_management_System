import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const H_FertiliserAdd = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    currentStock: "",
    unit: "",
    supplierName: "",
    supplierContact: "",
    email: "",
    purchasePrice: "",
    purchaseDate: "",
    storageLocation: "",
    storageConditions: "",
    notes: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/fertilisers", formData);
      alert("Fertiliser added successfully!");
      navigate("/fertiliser-details");
    } catch (err) {
      console.error(err);
      alert("Error adding fertiliser!");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-green-700 mb-4">
        ➕ Add New Fertiliser
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-lg shadow"
      >
        <input
          type="text"
          name="name"
          placeholder="Fertiliser Name"
          value={formData.name}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="type"
          placeholder="Fertiliser Type"
          value={formData.type}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="number"
          name="currentStock"
          placeholder="Current Stock"
          value={formData.currentStock}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="unit"
          placeholder="Unit (e.g., kg, bags)"
          value={formData.unit}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="supplierName"
          placeholder="Supplier Name"
          value={formData.supplierName}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="supplierContact"
          placeholder="Supplier Contact (e.g., +94771234567)"
          value={formData.supplierContact}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Supplier Email"
          value={formData.email}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="number"
          name="purchasePrice"
          placeholder="Purchase Price"
          value={formData.purchasePrice}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="date"
          name="purchaseDate"
          value={formData.purchaseDate}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="storageLocation"
          placeholder="Storage Location"
          value={formData.storageLocation}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="storageConditions"
          placeholder="Storage Conditions"
          value={formData.storageConditions}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <textarea
          name="notes"
          placeholder="Additional Notes"
          value={formData.notes}
          onChange={handleChange}
          className="border p-2 rounded col-span-2"
        />

        <div className="flex justify-between col-span-2">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Save Fertiliser
          </button>
          <button
            type="button"
            onClick={() => navigate("/fertiliser-details")}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default H_FertiliserAdd;
