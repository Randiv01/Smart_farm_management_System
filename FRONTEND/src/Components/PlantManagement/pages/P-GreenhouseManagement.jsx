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
import Loader from "../Loader/Loader.js";
import "../styles/theme.css";

const API_URL = "http://localhost:5000/api/plants";
const IMG_BASE = "http://localhost:5000/plant-uploads"; // backend base URL

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
  const [formErrors, setFormErrors] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [deleting, setDeleting] = useState(null); // Track which plant is being deleted
  const [darkMode, setDarkMode] = useState(false);

  // Check theme for loader
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setDarkMode(isDark);
    };

    checkTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['data-theme'] 
    });

    return () => observer.disconnect();
  }, []);

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

  const validateForm = () => {
    const errors = {};
    
    // Plant Name validation
    if (!formData.plantName.trim()) {
      errors.plantName = "Plant name is required";
    }
    
    // Category validation
    if (!formData.category) {
      errors.category = "Category is required";
    }
    
    // Greenhouse ID validation
    if (!formData.greenhouseId.trim()) {
      errors.greenhouseId = "Greenhouse ID is required";
    } else if (!formData.greenhouseId.toUpperCase().startsWith("GH")) {
      errors.greenhouseId = "Greenhouse ID must start with 'GH'";
    } else {
      // Check for duplicate greenhouse ID (excluding current plant if editing)
      const isDuplicate = plants.some(plant => 
        plant.greenhouseId.toUpperCase() === formData.greenhouseId.toUpperCase() && 
        (!isEditing || plant._id !== currentPlant._id)
      );
      
      if (isDuplicate) {
        errors.greenhouseId = "This Greenhouse ID is already in use";
      }
    }
    
    // Date validation
    if (formData.plantedDate && formData.expectedHarvest) {
      const plantedDate = new Date(formData.plantedDate);
      const harvestDate = new Date(formData.expectedHarvest);
      
      if (harvestDate <= plantedDate) {
        errors.expectedHarvest = "Expected harvest date must be after planted date";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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
    setFormErrors({});
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

  // FIXED: Enhanced image preview handling in edit mode
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
    setFormErrors({});
    
    // FIX: Proper image preview handling for existing images
    if (plant.imageUrl) {
      // Check if it's already a full URL or needs base URL
      const isFullUrl = plant.imageUrl.includes('http');
      setImagePreview(isFullUrl ? plant.imageUrl : `${plant.imageUrl}`);
    } else {
      setImagePreview(null);
    }
    
    setShowModal(true);
  };

  // FIXED: Enhanced delete functionality with proper state update
  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plant?")) {
      return;
    }

    try {
      setDeleting(id);
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

  // FIXED: Enhanced image handling and state management
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
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
        
        // Update the specific plant in state immediately with proper image URL
        setPlants(prevPlants => 
          prevPlants.map(plant => 
            plant._id === currentPlant._id ? { 
              ...response.data.plant, 
              imageUrl: response.data.plant.imageUrl 
            } : plant
          )
        );
      } else {
        response = await axios.post(`${API_URL}/add`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        // Add new plant to state immediately with proper image URL
        setPlants(prevPlants => [...prevPlants, { 
          ...response.data.plant, 
          imageUrl: response.data.plant.imageUrl 
        }]);
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

  // Theme-based colors using CSS variables
  const bgCard = theme === "dark" ? "var(--card-bg)" : "var(--card-bg)";
  const textColor = theme === "dark" ? "var(--text)" : "var(--text)";
  const borderColor = theme === "dark" ? "var(--border)" : "var(--border)";
  const buttonBorderColor = theme === "dark" ? "var(--border)" : "var(--border)";

  // Show loader while loading
  if (loading) {
    return <Loader darkMode={darkMode} />;
  }

  const renderPlantCard = (plant) => (
    <div
      key={plant._id}
      style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}}
      className={`flex flex-col p-3 rounded-xl border transition-shadow shadow-sm hover:shadow-md relative`}
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
                ? plant.imageUrl.includes('http') 
                  ? plant.imageUrl 
                  : `${IMG_BASE}${plant.imageUrl}`
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
          <h3 style={{color: 'var(--text)'}} className="text-lg font-semibold">{plant.plantName}</h3>
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

      <div style={{color: 'var(--text)'}} className="flex justify-between mb-3 text-sm">
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
        style={{borderColor: 'var(--border)', color: 'var(--text)'}}
        className={`w-full flex items-center justify-center gap-1 px-2 py-1 rounded-md border ${
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
        <div style={{borderColor: 'var(--border)'}} className="mt-3 pt-3 border-t">
          <div style={{color: 'var(--text)'}} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-sm">
            <div>
              <span style={{color: 'var(--text-light)'}}>Category:</span> {plant.category}
            </div>
            <div>
              <span style={{color: 'var(--text-light)'}}>Location:</span> {plant.location || "-"}
            </div>
            <div>
              <span style={{color: 'var(--text-light)'}}>Length:</span> {plant.length ? `${plant.length}m` : "-"}
            </div>
            <div>
              <span style={{color: 'var(--text-light)'}}>Width:</span> {plant.width ? `${plant.width}m` : "-"}
            </div>
            <div>
              <span style={{color: 'var(--text-light)'}}>Planted Date:</span>{" "}
              {plant.plantedDate
                ? new Date(plant.plantedDate).toLocaleDateString()
                : "-"}
            </div>
            <div>
              <span style={{color: 'var(--text-light)'}}>Expected Harvest:</span>{" "}
              {plant.expectedHarvest
                ? new Date(plant.expectedHarvest).toLocaleDateString()
                : "-"}
            </div>
            <div className="sm:col-span-2">
              <span style={{color: 'var(--text-light)'}}>Estimated Yield:</span>{" "}
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
    <div style={{backgroundColor: 'var(--background)'}} className={`flex flex-col gap-6 p-4 min-h-screen`}>
      <div className="flex justify-between items-center mb-4">
        <h1 style={{color: 'var(--text)'}} className="text-3xl font-bold">Greenhouse Management</h1>
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
          style={{backgroundColor: 'var(--card-bg)', color: 'var(--text)', borderColor: 'var(--border)'}}
          className="px-3 py-2 rounded-md border"
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
            style={{backgroundColor: 'var(--card-bg)', color: 'var(--text)', borderColor: 'var(--border)'}}
            className="w-full pl-9 pr-3 py-2 rounded-md border"
          />
        </div>
      </div>

      {/* Plants Grid */}
      {filteredPlants.length === 0 ? (
        <div style={{color: 'var(--text)'}} className="text-center py-12">
          <p className="text-lg">No plants found matching your criteria.</p>
        </div>
      ) : category === "all" ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 style={{color: 'var(--text)'}} className="text-xl font-semibold mb-3">Vegetables ({vegetables.length})</h2>
            {vegetables.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {vegetables.map(renderPlantCard)}
              </div>
            ) : (
              <p style={{color: 'var(--text-light)'}}>No vegetables found.</p>
            )}
          </div>
          <div>
            <h2 style={{color: 'var(--text)'}} className="text-xl font-semibold mb-3">Fruits ({fruits.length})</h2>
            {fruits.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {fruits.map(renderPlantCard)}
              </div>
            ) : (
              <p style={{color: 'var(--text-light)'}}>No fruits found.</p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h2 style={{color: 'var(--text)'}} className="text-xl font-semibold mb-3">
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
            style={{backgroundColor: 'var(--card-bg)', color: 'var(--text)'}}
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden"
          >
            {/* Modal Header - Fixed */}
            <div style={{borderColor: 'var(--border)'}} className="flex justify-between items-center p-4 border-b flex-shrink-0">
              <h2 className="text-xl font-semibold">
                {isEditing ? "Edit Plant" : "Add New Plant"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                style={{color: 'var(--text)'}}
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
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text)',
                        borderColor: formErrors.plantName ? '#e53e3e' : 'var(--border)'
                      }}
                      className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter plant name"
                    />
                    {formErrors.plantName && (
                      <p className="text-red-500 text-sm">{formErrors.plantName}</p>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="font-medium">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text)',
                        borderColor: formErrors.category ? '#e53e3e' : 'var(--border)'
                      }}
                      className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Category</option>
                      <option value="Vegetable">Vegetable</option>
                      <option value="Fruit">Fruit</option>
                    </select>
                    {formErrors.category && (
                      <p className="text-red-500 text-sm">{formErrors.category}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="font-medium">Greenhouse ID *</label>
                    <input
                      type="text"
                      placeholder="GH01"
                      name="greenhouseId"
                      value={formData.greenhouseId}
                      onChange={handleInputChange}
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text)',
                        borderColor: formErrors.greenhouseId ? '#e53e3e' : 'var(--border)'
                      }}
                      className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    {formErrors.greenhouseId && (
                      <p className="text-red-500 text-sm">{formErrors.greenhouseId}</p>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="font-medium">Length (m)</label>
                    <input
                      type="number"
                      placeholder="Length (m)"
                      name="length"
                      value={formData.length}
                      onChange={handleInputChange}
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text)',
                        borderColor: 'var(--border)'
                      }}
                      className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="font-medium">Width (m)</label>
                    <input
                      type="number"
                      placeholder="Width (m)"
                      name="width"
                      value={formData.width}
                      onChange={handleInputChange}
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text)',
                        borderColor: 'var(--border)'
                      }}
                      className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Location</label>
                  <input
                    type="text"
                    placeholder="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text)',
                      borderColor: 'var(--border)'
                    }}
                    className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="font-medium">Planted Date</label>
                    <input
                      type="date"
                      name="plantedDate"
                      value={formData.plantedDate}
                      onChange={handleInputChange}
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text)',
                        borderColor: 'var(--border)'
                      }}
                      className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="font-medium">Expected Harvest</label>
                    <input
                      type="date"
                      name="expectedHarvest"
                      value={formData.expectedHarvest}
                      onChange={handleInputChange}
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text)',
                        borderColor: formErrors.expectedHarvest ? '#e53e3e' : 'var(--border)'
                      }}
                      className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {formErrors.expectedHarvest && (
                      <p className="text-red-500 text-sm">{formErrors.expectedHarvest}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="font-medium">Estimated Yield (kg)</label>
                    <input
                      type="number"
                      placeholder="Estimated Yield (kg)"
                      name="estimatedYield"
                      value={formData.estimatedYield}
                      onChange={handleInputChange}
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text)',
                        borderColor: 'var(--border)'
                      }}
                      className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="font-medium">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text)',
                        borderColor: 'var(--border)'
                      }}
                      className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="flex flex-col gap-2">
                  <label className="font-medium">Plant Image</label>
                  <label
                    style={{borderColor: 'var(--border)'}}
                    className={`flex items-center gap-2 px-3 py-2 border-dashed border-2 rounded-md cursor-pointer hover:border-green-500 transition-colors`}
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