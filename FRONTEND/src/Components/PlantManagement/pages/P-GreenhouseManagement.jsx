import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import "../styles/theme.css";

const API_URL = "http://localhost:5000/api/plants";
const IMG_BASE = "http://localhost:5000"; // backend base URL

const GreenhouseManagement = () => {
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPlant, setExpandedPlant] = useState(null);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlant, setCurrentPlant] = useState(null);
  const [formData, setFormData] = useState({
    plantName: "",
    category: "",
    greenhouseId: "",
    length: "",
    width: "",
    location: "",
    plantedDate: "",
    expectedHarvest: "",
    estimatedYield: "",
    status: "Active",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [deleting, setDeleting] = useState(null); // Track which plant is being deleted

  const fetchPlants = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API_URL);
      setPlants(data);
    } catch (err) {
      console.error("Error fetching plants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, JPG, PNG, or GIF)');
      return;
    }
    
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    // Reset the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const resetForm = () => {
    setFormData({
      plantName: "",
      category: "",
      greenhouseId: "",
      length: "",
      width: "",
      location: "",
      plantedDate: "",
      expectedHarvest: "",
      estimatedYield: "",
      status: "Active",
    });
    setSelectedImage(null);
    setImagePreview(null);
    setSubmitStatus(null);
    setIsEditing(false);
    setCurrentPlant(null);
    // Reset the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setCurrentPlant(null);
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (plant) => {
    setIsEditing(true);
    setCurrentPlant(plant);
    setFormData({
      plantName: plant.plantName || "",
      category: plant.category || "",
      greenhouseId: plant.greenhouseId || "",
      length: plant.length || "",
      width: plant.width || "",
      location: plant.location || "",
      plantedDate: plant.plantedDate
        ? plant.plantedDate.split("T")[0]
        : "",
      expectedHarvest: plant.expectedHarvest
        ? plant.expectedHarvest.split("T")[0]
        : "",
      estimatedYield: plant.estimatedYield || "",
      status: plant.status || "Active",
    });
    setSelectedImage(null);
    setImagePreview(
      plant.imageUrl ? `${IMG_BASE}${plant.imageUrl}` : null
    );
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this plant?")) {
      return;
    }

    try {
      setDeleting(id); // Show loading state for this plant
      await axios.delete(`${API_URL}/${id}`);
      
      // Update plants state immediately without refetching
      setPlants(prevPlants => prevPlants.filter(plant => plant._id !== id));
      
      // Close expanded details if this plant was expanded
      if (expandedPlant === id) {
        setExpandedPlant(null);
      }
      
      console.log("Plant deleted successfully");
    } catch (err) {
      console.error("Error deleting plant:", err);
      alert("Error deleting plant. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus("submitting");
    
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));
    if (selectedImage) data.append("plantImage", selectedImage);

    try {
      let response;
      if (isEditing && currentPlant?._id) {
        response = await axios.put(`${API_URL}/${currentPlant._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        // Update the specific plant in state immediately
        setPlants(prevPlants => 
          prevPlants.map(plant => 
            plant._id === currentPlant._id ? response.data.plant : plant
          )
        );
      } else {
        response = await axios.post(`${API_URL}/add`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        // Add new plant to state immediately
        setPlants(prevPlants => [...prevPlants, response.data.plant]);
      }
      
      setSubmitStatus("success");
      
      setTimeout(() => {
        setShowModal(false);
        resetForm();
      }, 1200);
    } catch (err) {
      console.error("Error saving plant:", err);
      setSubmitStatus("error");
    }
  };

  const togglePlantDetails = (id) =>
    setExpandedPlant((p) => (p === id ? null : id));

  const filteredPlants = plants.filter(
    (p) =>
      (category === "all" ||
        p.category?.toLowerCase() === category.toLowerCase()) &&
      (p.plantName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const vegetables = filteredPlants.filter(
    (p) => (p.category || "").toLowerCase() === "vegetable"
  );
  const fruits = filteredPlants.filter(
    (p) => (p.category || "").toLowerCase() === "fruit"
  );

  const bgCard = theme === "dark" ? "bg-[#2d2d2d]" : "bg-white";
  const textColor = theme === "dark" ? "text-gray-200" : "text-gray-800";
  const borderColor = theme === "dark" ? "border-[#3a3a3b]" : "border-gray-300";
  const buttonBorderColor =
    theme === "dark" ? "border-[#3a3a3b]" : "border-gray-300";

  if (loading) return (
    <div className={`flex justify-center items-center h-64 ${textColor}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
    </div>
  );

  const renderPlantCard = (plant) => (
    <div
      key={plant._id}
      className={`flex flex-col p-3 rounded-xl border ${borderColor} ${bgCard} transition-shadow shadow-sm hover:shadow-md relative`}
    >
      {deleting === plant._id && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
      
      <div className="flex gap-3 mb-3">
        <div className="w-16 h-16 overflow-hidden rounded-lg flex-shrink-0 bg-gray-200">
          <img
            src={
              plant.imageUrl
                ? `${IMG_BASE}${plant.imageUrl}`
                : "https://via.placeholder.com/60"
            }
            alt={plant.plantName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/60";
            }}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{plant.plantName}</h3>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              plant.status === "Active"
                ? "bg-green-100 text-green-700"
                : plant.status === "Inactive"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {plant.status}
          </span>
        </div>
      </div>

      <div className="flex justify-between mb-3 text-sm">
        <span>
          <span className="font-semibold">Greenhouse ID:</span>{" "}
          {plant.greenhouseId}
        </span>
        <span>
          <span className="font-semibold">Expected Harvest:</span>{" "}
          {plant.expectedHarvest
            ? new Date(plant.expectedHarvest).toLocaleDateString()
            : "-"}
        </span>
      </div>

      <button
        className={`w-full flex items-center justify-center gap-1 px-2 py-1 rounded-md border ${buttonBorderColor} ${
          theme === "dark" ? "hover:bg-green-700/20" : "hover:bg-green-100"
        } transition-colors`}
        onClick={() => togglePlantDetails(plant._id)}
      >
        {expandedPlant === plant._id ? (
          <>
            <ChevronUp size={16} /> Hide Details
          </>
        ) : (
          <>
            <ChevronDown size={16} /> Show Details
          </>
        )}
      </button>

      {expandedPlant === plant._id && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-sm">
            <div>
              <span className="text-gray-400">Category:</span> {plant.category}
            </div>
            <div>
              <span className="text-gray-400">Location:</span> {plant.location || "-"}
            </div>
            <div>
              <span className="text-gray-400">Length:</span> {plant.length ? `${plant.length}m` : "-"}
            </div>
            <div>
              <span className="text-gray-400">Width:</span> {plant.width ? `${plant.width}m` : "-"}
            </div>
            <div>
              <span className="text-gray-400">Planted Date:</span>{" "}
              {plant.plantedDate
                ? new Date(plant.plantedDate).toLocaleDateString()
                : "-"}
            </div>
            <div>
              <span className="text-gray-400">Expected Harvest:</span>{" "}
              {plant.expectedHarvest
                ? new Date(plant.expectedHarvest).toLocaleDateString()
                : "-"}
            </div>
            <div className="sm:col-span-2">
              <span className="text-gray-400">Estimated Yield:</span>{" "}
              {plant.estimatedYield ? `${plant.estimatedYield} kg` : "-"}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
              onClick={() => handleEditClick(plant)}
            >
              <Edit size={14} /> Edit
            </button>
            <button
              className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
              onClick={() => handleDeleteClick(plant._id)}
              disabled={deleting === plant._id}
            >
              <Trash size={14} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex flex-col gap-6 p-4 ${textColor}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Greenhouse Management</h1>
        <button
          className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          onClick={handleAddClick}
        >
          <Plus size={16} /> Add Plant
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`px-3 py-2 rounded-md border ${borderColor} ${bgCard} ${textColor}`}
        >
          <option value="all">All Categories</option>
          <option value="vegetable">Vegetables</option>
          <option value="fruit">Fruits</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={18}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search plants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-md border ${borderColor} ${bgCard} ${textColor}`}
          />
        </div>
      </div>

      {/* Plants Grid */}
      {filteredPlants.length === 0 ? (
        <div className={`text-center py-12 ${textColor}`}>
          <p className="text-lg">No plants found matching your criteria.</p>
        </div>
      ) : category === "all" ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-3">Vegetables ({vegetables.length})</h2>
            {vegetables.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {vegetables.map(renderPlantCard)}
              </div>
            ) : (
              <p className="text-gray-500">No vegetables found.</p>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-3">Fruits ({fruits.length})</h2>
            {fruits.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {fruits.map(renderPlantCard)}
              </div>
            ) : (
              <p className="text-gray-500">No fruits found.</p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-3">
            {category === "vegetable" ? "Vegetables" : "Fruits"} ({filteredPlants.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlants.map(renderPlantCard)}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div
            className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl ${bgCard} ${textColor} overflow-hidden`}
          >
            {/* Modal Header - Fixed */}
            <div className="flex justify-between items-center p-4 border-b border-gray-300 flex-shrink-0">
              <h2 className="text-xl font-semibold">
                {isEditing ? "Edit Plant" : "Add New Plant"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              <form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="font-medium">Plant Name *</label>
                    <input
                      type="text"
                      name="plantName"
                      value={formData.plantName}
                      onChange={handleInputChange}
                      required
                      className={`px-3 py-2 rounded-md border ${borderColor} ${bgCard} ${textColor} focus:outline-none focus:ring-2 focus:ring-green-500`}
                      placeholder="Enter plant name"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="font-medium">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className={`px-3 py-2 rounded-md border ${borderColor} ${bgCard} ${textColor} focus:outline-none focus:ring-2 focus:ring-green-500`}
                    >
                      <option value="">Select Category</option>
                      <option value="Vegetable">Vegetable</option>
                      <option value="Fruit">Fruit</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Greenhouse ID"
                    name="greenhouseId"
                    value={formData.greenhouseId}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 rounded-md border ${borderColor} ${bgCard} ${textColor} focus:outline-none focus:ring-2 focus:ring-green-500`}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Length (m)"
                    name="length"
                    value={formData.length}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 rounded-md border ${borderColor} ${bgCard} ${textColor} focus:outline-none focus:ring-2 focus:ring-green-500`}
                    min="0"
                    step="0.1"
                  />
                  <input
                    type="number"
                    placeholder="Width (m)"
                    name="width"
                    value={formData.width}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 rounded-md border ${borderColor} ${bgCard} ${textColor} focus:outline-none focus:ring-2 focus:ring-green-500`}
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <input
                  type="text"
                  placeholder="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`px-3 py-2 rounded-md border ${borderColor} ${bgCard} ${textColor} focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="font-medium">Planted Date</label>
                    <input
                      type="date"
                      name="plantedDate"
                      value={formData.plantedDate}
                      onChange={handleInputChange}
                      className={`px-3 py-2 rounded-md border ${borderColor} ${bgCard} ${textColor} focus:outline-none focus:ring-2 focus:ring-green-500`}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="font-medium">Expected Harvest</label>
                    <input
                      type="date"
                      name="expectedHarvest"
                      value={formData.expectedHarvest}
                      onChange={handleInputChange}
                      className={`px-3 py-2 rounded-md border ${borderColor} ${bgCard} ${textColor} focus:outline-none focus:ring-2 focus:ring-green-500`}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="number"
                    placeholder="Estimated Yield (kg)"
                    name="estimatedYield"
                    value={formData.estimatedYield}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 rounded-md border ${borderColor} ${bgCard} ${textColor} focus:outline-none focus:ring-2 focus:ring-green-500`}
                    min="0"
                    step="0.1"
                  />
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 rounded-md border ${borderColor} ${bgCard} ${textColor} focus:outline-none focus:ring-2 focus:ring-green-500`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                {/* Image Upload */}
                <div className="flex flex-col gap-2">
                  <label className="font-medium">Plant Image</label>
                  <label
                    className={`flex items-center gap-2 px-3 py-2 border-dashed border-2 rounded-md cursor-pointer ${borderColor} hover:border-green-500 transition-colors`}
                  >
                    <Upload size={16} /> Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                        onClick={handleImageRemove}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitStatus === "submitting"}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mt-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitStatus === "submitting" 
                    ? (isEditing ? "Updating..." : "Adding...") 
                    : (isEditing ? "Update Plant" : "Add Plant")}
                </button>

                {/* Status Messages */}
                {submitStatus === "success" && (
                  <div className="flex items-center gap-2 text-green-500 mt-2">
                    <Check size={16} />
                    Plant {isEditing ? "updated" : "added"} successfully!
                  </div>
                )}
                {submitStatus === "error" && (
                  <div className="text-red-500 mt-2">
                    Error {isEditing ? "updating" : "saving"} plant. Please try again.
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GreenhouseManagement;