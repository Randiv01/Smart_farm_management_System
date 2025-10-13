import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const H_PlantTretmentAddFrom = () => {
  const [plantTypes, setPlantTypes] = useState([
    "Tomato",
    "Potato",
    "Cabbage",
    "Carrot",
    "Lettuce",
    "Spinach",
  ]);
  const [newPlantType, setNewPlantType] = useState("");

  const [formData, setFormData] = useState({
    plantType: "",
    plantCode: "",
    pathologist: "",
    fertiliser: "",
    pestControl: "",
    treatmentDate: "",
    notes: "",
    reports: null,
    status: "scheduled",
    effectiveness: 0,
  });

  const [pathologists, setPathologists] = useState([]);
  const [fertilisers, setFertilisers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stockUpdateMessage, setStockUpdateMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pathologistsRes, fertilisersRes] = await Promise.all([
          axios.get("http://localhost:5000/api/plant-pathologists"),
          axios.get("http://localhost:5000/api/fertilisers"),
        ]);

        setPathologists(pathologistsRes.data);
        const availableFertilisers = (fertilisersRes.data || []).filter(
          (fertiliser) => fertiliser.currentStock > 0
        );
        setFertilisers(availableFertilisers);
      } catch (error) {
        console.error("Error fetching plant treatment data:", error);
        alert("Failed to load form data");
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Show stock update message when fertiliser is selected
    if (name === "fertiliser" && value) {
      const selectedFert = fertilisers.find(f => f._id === value);
      if (selectedFert) {
        const newStock = selectedFert.currentStock - 1;
        setStockUpdateMessage(
          `After saving, stock will decrease from ${selectedFert.currentStock} ${selectedFert.unit} to ${newStock} ${selectedFert.unit}`
        );
      }
    } else if (name === "fertiliser" && !value) {
      setStockUpdateMessage("");
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: name === "effectiveness" ? Number(value) : value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, reports: e.target.files[0] || null }));
  };

  const handleAddPlantType = () => {
    const val = newPlantType.trim();
    if (val && !plantTypes.includes(val)) {
      setPlantTypes((prev) => [...prev, val]);
      setFormData((prev) => ({ ...prev, plantType: val }));
      setNewPlantType("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStockUpdateMessage("");

    try {
      const data = new FormData();
      data.append("plantType", formData.plantType);
      data.append("plantCode", formData.plantCode);
      data.append("pathologist", formData.pathologist);
      if (formData.fertiliser) data.append("fertiliser", formData.fertiliser);
      if (formData.pestControl) data.append("pestControl", formData.pestControl);
      data.append("treatmentDate", formData.treatmentDate);
      if (formData.notes) data.append("notes", formData.notes);
      data.append("status", formData.status);
      data.append("effectiveness", String(formData.effectiveness));
      if (formData.reports) data.append("reports", formData.reports);

      const response = await axios.post(
        "http://localhost:5000/api/plant-treatments",
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Plant treatment saved successfully:", response.data);
      
      // Show success message with stock update info
      if (formData.fertiliser) {
        const selectedFert = fertilisers.find(f => f._id === formData.fertiliser);
        if (selectedFert) {
          alert(`✅ Plant treatment record saved successfully!\n\nFertiliser stock updated: ${selectedFert.name} stock decreased from ${selectedFert.currentStock} ${selectedFert.unit} to ${selectedFert.currentStock - 1} ${selectedFert.unit}`);
        }
      } else {
        alert("Plant treatment record saved successfully!");
      }
      
      navigate("/admin/treatments-details");
    } catch (err) {
      console.error("Error saving plant treatment:", err);
      const msg =
        err?.response?.data?.error || "Failed to save plant treatment record. Please try again.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/admin/treatments-details");
  };

  const selectedFertiliser = fertilisers.find((f) => f._id === formData.fertiliser);

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl space-y-6"
      >
        <h1 className="text-2xl font-bold text-green-700 text-center">
          Add Plant Health Treatment
        </h1>

        {/* Plant Type */}
        <div>
          <label className="block font-semibold mb-2">Plant Type</label>
          <div className="flex items-center space-x-2">
            <select
              name="plantType"
              value={formData.plantType}
              onChange={handleChange}
              className="border p-2 rounded flex-1"
              required
            >
              <option value="">Select Plant Type</option>
              {plantTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Add New Plant Type"
              value={newPlantType}
              onChange={(e) => setNewPlantType(e.target.value)}
              className="border p-2 rounded flex-1"
            />
            <button
              type="button"
              onClick={handleAddPlantType}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              ➕
            </button>
          </div>
        </div>

        {/* Plant Code */}
        <div>
          <label className="block font-semibold mb-2">Plant Code/ID</label>
          <input
            type="text"
            name="plantCode"
            value={formData.plantCode}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
            placeholder="Enter plant code or ID"
          />
        </div>

        {/* Plant Pathologist */}
        <div>
          <label className="block font-semibold mb-2">Plant Pathologist</label>
          <select
            name="pathologist"
            value={formData.pathologist}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select Pathologist</option>
            {pathologists.map((p) => (
              <option key={p._id} value={p._id}>
                {p.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Fertiliser Used */}
        <div>
          <label className="block font-semibold mb-2">Fertiliser Used</label>
          <select
            name="fertiliser"
            value={formData.fertiliser}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="">Select Fertiliser</option>
            {fertilisers.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name} - {f.currentStock} {f.unit} available
              </option>
            ))}
          </select>

          {/* Stock Update Message */}
          {stockUpdateMessage && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium">
                📢 {stockUpdateMessage}
              </p>
            </div>
          )}

          {selectedFertiliser && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-semibold text-green-800">Selected Fertiliser Details:</h4>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {selectedFertiliser.type}
                </div>
                <div>
                  <span className="font-medium">Company:</span> {selectedFertiliser.company}
                </div>
                <div>
                  <span className="font-medium">Current Stock:</span> {selectedFertiliser.currentStock}{" "}
                  {selectedFertiliser.unit}
                </div>
                <div>
                  <span className="font-medium">After Treatment:</span>{" "}
                  <span className="font-bold text-red-600">
                    {selectedFertiliser.currentStock - 1} {selectedFertiliser.unit}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Supplier:</span> {selectedFertiliser.supplierName}
                </div>
              </div>
            </div>
          )}

          {fertilisers.length === 0 && (
            <p className="text-sm text-red-600 mt-1">
              No fertilisers available in stock. Please add fertilisers first.
            </p>
          )}
        </div>

        {/* Pest Control */}
        <div>
          <label className="block font-semibold mb-2">Pest Control Method</label>
          <select
            name="pestControl"
            value={formData.pestControl}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="">Select Pest Control</option>
            <option value="Organic Spray">Organic Spray</option>
            <option value="Chemical Pesticide">Chemical Pesticide</option>
            <option value="Biological Control">Biological Control</option>
            <option value="Manual Removal">Manual Removal</option>
            <option value="Preventive Measures">Preventive Measures</option>
          </select>
        </div>

        {/* Treatment Date */}
        <div>
          <label className="block font-semibold mb-2">Treatment Date</label>
          <input
            type="date"
            name="treatmentDate"
            value={formData.treatmentDate}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Treatment Status */}
        <div>
          <label className="block font-semibold mb-2">Treatment Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Effectiveness */}
        <div>
          <label className="block font-semibold mb-2">
            Effectiveness (%)
            {formData.effectiveness > 0 && (
              <span className="ml-2 text-sm text-green-600">{formData.effectiveness}%</span>
            )}
          </label>
          <input
            type="range"
            name="effectiveness"
            min="0"
            max="100"
            value={formData.effectiveness}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Reports */}
        <div>
          <label className="block font-semibold mb-2">Upload Reports/Images</label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="border p-2 rounded w-full"
          />
          <p className="text-sm text-gray-500 mt-1">Supported formats: PDF, PNG, JPG, JPEG</p>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold mb-2">Treatment Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            rows={4}
            placeholder="Enter treatment details, observations, and recommendations..."
          ></textarea>
        </div>

        {/* Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading || fertilisers.length === 0}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 flex-1 font-bold transition disabled:bg-green-400 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save Treatment"}
          </button>
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 flex-1 font-bold transition disabled:bg-gray-400"
          >
            Cancel
          </button>
        </div>

        {/* Warning if no fertilisers available */}
        {fertilisers.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">No Fertilizers Available</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You need to add fertilizers to the system before creating plant treatments.
                    <button
                      type="button"
                      onClick={() => navigate("/admin/fertiliser-stock?showForm=1")}
                      className="ml-2 underline font-medium hover:text-yellow-800"
                    >
                      Add Fertilizers Now
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default H_PlantTretmentAddFrom;