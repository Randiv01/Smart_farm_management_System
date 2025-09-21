import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLoader } from "../contexts/LoaderContext";
import { useNavigate } from "react-router-dom";

function AddAnimalType() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { loading, setLoading } = useLoader();
  const navigate = useNavigate();
  
  // State for the main animal type name and banner
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [banner, setBanner] = useState(null);
  const [bannerError, setBannerError] = useState("");
  
  // State for multiple caretakers
  const [caretakers, setCaretakers] = useState([{ id: "", name: "", mobile: "" }]);
  const [caretakerErrors, setCaretakerErrors] = useState([{}]);
  
  // States for dynamically fetched zone data
  const [zones, setZones] = useState([]);
  const [zoneTypes, setZoneTypes] = useState([]);

  // State to handle the management type switch
  const [managementType, setManagementType] = useState("individual");

  // State for categories, dynamically set based on management type
  const [categories, setCategories] = useState([]);
  
  // State for popup notifications
  const [popup, setPopup] = useState({ show: false, success: true, message: "" });
  
  // NEW: State for productivity fields
  const [productivityFields, setProductivityFields] = useState([
    { name: "", label: "", type: "number", unit: "", required: false }
  ]);

  // Define default categories for different management types
const defaultIndividualCategories = [
  {
    name: "Basic Info",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "breed", label: "Breed", type: "text", required: true },
      { name: "dob", label: "Date of Birth", type: "date", required: true },
      { name: "gender", label: "Gender", type: "select", options: ["Male", "Female"], required: true },
      { name: "owner", label: "Owner", type: "select", options: ["Mount Olive", "Other"], required: true },
    ],
  },
  {
    name: "Health Info",
    fields: [
      { name: "weight", label: "Weight (kg)", type: "number", required: false },
      { name: "temperature", label: "Temperature (°C)", type: "number", required: false },
      {
        name: "healthStatus",
        label: "Health Status",
        type: "select",
        options: ["Healthy", "Sick", "Injured", "In Treatment", "Critical", "Quarantined", "Recovered", "Deceased"],
        required: true, readOnly: true
      },
      { name: "lastCheckup", label: "Last Checkup", type: "date", required: false },
      { name: "symptoms", label: "Symptoms", type: "text", required: false },
      {
        name: "vaccinations",
        label: "Vaccinations",
        type: "select",
        options: ["Not Vaccinated", "Partially Vaccinated", "Fully Vaccinated", "Overdue", "Unknown"],
        required: true,readOnly: true
      },
      {
        name: "reproductiveStatus",
        label: "Reproductive Status",
        type: "select",
        options: ["Not Pregnant", "Pregnant", "Lactating", "Ready for Breeding", "Unknown"],
        required: false,readOnly: true
      },
    ],
  },
];

const defaultGroupCategories = [
  {
    name: "Batch Info",
    fields: [
      { name: "batchName", label: "Batch Name", type: "text", required: true },
      { name: "species", label: "Species", type: "text", required: true },
      { name: "arrivalDate", label: "Arrival Date", type: "date", required: true },
    ],
  },
  {
    name: "Health & Care",
    fields: [
      { name: "batchHealth", label: "Batch Health Status", type: "select", options: ["Healthy", "Sick", "Quarantined"], required: true, readOnly: true },
      { name: "lastTreatment", label: "Last Treatment Date", type: "date", required: false },
      { name: "medication", label: "Medication", type: "text", required: false },
    ],
  },
];

const defaultOtherCategories = [
  {
    name: "Hive/Farm Info",
    fields: [
      { name: "hiveName", label: "Hive Name", type: "text", required: true },
      { name: "hiveHealth", label: "Hive Health", type: "select", options: ["Healthy", "Pest Infestation", "Weak Colony"], required: true },
    ],
  },
];

  // Effect to update document title and categories on component mount or management type change
  useEffect(() => {
    document.title = "Add New Animal Type";

    // Fetch zones and zone types from the backend
    const fetchZoneData = async () => {
      try {
        setLoading(true);
        
        // Fetch zones
        const zonesResponse = await fetch('http://localhost:5000/zones');
        if (!zonesResponse.ok) throw new Error('Failed to fetch zones');
        const zonesData = await zonesResponse.json();
        setZones(zonesData.zones || []);
        
        // Fetch zone types - fixed endpoint
       const zoneTypesResponse = await fetch('http://localhost:5000/zones/type-counts');
        if (!zoneTypesResponse.ok) throw new Error('Failed to fetch zone types');
        const zoneTypesData = await zoneTypesResponse.json();
        setZoneTypes(Object.keys(zoneTypesData) || []);

      } catch (err) {
        console.error("Failed to fetch zone data:", err);
        setPopup({ show: true, success: false, message: "Failed to load zone data. Please try again." });
      } finally {
        setLoading(false);
      }
    };
    
    fetchZoneData();
  }, []);

  // Use a second useEffect to update categories based on the fetched data
  useEffect(() => {
    let updatedCategories;
    
    switch (managementType) {
      case "individual":
        updatedCategories = JSON.parse(JSON.stringify(defaultIndividualCategories));
        break;
      case "batch":
        updatedCategories = JSON.parse(JSON.stringify(defaultGroupCategories));
        break;
      case "other":
        updatedCategories = JSON.parse(JSON.stringify(defaultOtherCategories));
        break;
      default:
        updatedCategories = JSON.parse(JSON.stringify(defaultIndividualCategories));
    }
    
    // Update zone and zoneType options in all categories
    updatedCategories.forEach(category => {
      category.fields.forEach(field => {
        if (field.name === "zone") {
          field.options = zones.map(zone => zone.name);
        } else if (field.name === "zoneType") {
          field.options = zoneTypes;
        }
      });
    });
    
    setCategories(updatedCategories);
  }, [managementType, zones, zoneTypes]);

  // Handler for adding a new dynamic field
  const handleAddField = (categoryIndex) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].fields.push({ 
      name: "", 
      label: "", 
      type: "text", 
      options: [],
      required: false 
    });
    setCategories(newCategories);
  };

  // Handler for removing a dynamic field
  const handleRemoveField = (catIdx, fieldIdx) => {
    const newCategories = [...categories];
    newCategories[catIdx].fields.splice(fieldIdx, 1);
    setCategories(newCategories);
  };

  // Handler for changing a field's properties
  const handleFieldChange = (catIdx, fieldIdx, key, value) => {
    const newCategories = [...categories];
    if (key === "label") {
      newCategories[catIdx].fields[fieldIdx].name = value.toLowerCase().replace(/\s+/g, "");
      newCategories[catIdx].fields[fieldIdx].label = value;
    } else if (key === "options") {
      newCategories[catIdx].fields[fieldIdx][key] = value.split(",").map((opt) => opt.trim());
    } else {
      newCategories[catIdx].fields[fieldIdx][key] = value;
    }
    setCategories(newCategories);
  };

  // Handler for adding a new caretaker to the list
  const handleAddCaretaker = () => {
    setCaretakers([...caretakers, { id: "", name: "", mobile: "" }]);
    setCaretakerErrors([...caretakerErrors, {}]);
  };

  // Handler for removing a caretaker
  const handleRemoveCaretaker = (index) => {
    const newCaretakers = caretakers.filter((_, i) => i !== index);
    const newCaretakerErrors = caretakerErrors.filter((_, i) => i !== index);
    setCaretakers(newCaretakers);
    setCaretakerErrors(newCaretakerErrors);
  };

  // NEW: Productivity field handlers
  const handleProductivityFieldChange = (index, key, value) => {
    const newFields = [...productivityFields];
    
    if (key === "label") {
      // Auto-generate name from label
      newFields[index].label = value;
      newFields[index].name = value.toLowerCase().replace(/\s+/g, '_');
    } else {
      newFields[index][key] = value;
    }
    
    setProductivityFields(newFields);
  };

  const handleAddProductivityField = () => {
    setProductivityFields([...productivityFields, 
      { name: "", label: "", type: "number", unit: "", required: false }
    ]);
  };

  const handleRemoveProductivityField = (index) => {
    const newFields = [...productivityFields];
    newFields.splice(index, 1);
    setProductivityFields(newFields);
  };

  // Validate caretaker data
  const validateCaretaker = (caretaker, index) => {
    const errors = {};
    
    // Validate ID
    if (!caretaker.id.trim()) {
      errors.id = "Caretaker ID is required";
    }
    
    // Validate Name
    if (!caretaker.name.trim()) {
      errors.name = "Caretaker name is required";
    } else if (caretaker.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    
    // Validate Mobile
    if (!caretaker.mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(caretaker.mobile.trim())) {
      errors.mobile = "Mobile number must be exactly 10 digits";
    }
    
    return errors;
  };

  // Handler for changing caretaker fields
  const handleCaretakerChange = (index, key, value) => {
    const newCaretakers = [...caretakers];
    newCaretakers[index][key] = value;
    setCaretakers(newCaretakers);
    
    // Validate on change
    const errors = validateCaretaker(newCaretakers[index], index);
    const newCaretakerErrors = [...caretakerErrors];
    newCaretakerErrors[index] = errors;
    setCaretakerErrors(newCaretakerErrors);
  };

  // Validate all form data
  const validateForm = () => {
    let isValid = true;
    const errors = {};
    
    // Validate animal type name
    if (!name.trim()) {
      setNameError("Animal type name is required");
      isValid = false;
    } else {
      setNameError("");
    }
    
    // Validate banner image
    if (banner) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(banner.type)) {
        setBannerError("Please upload a valid image (JPEG, PNG, GIF)");
        isValid = false;
      } else if (banner.size > 5 * 1024 * 1024) { // 5MB limit
        setBannerError("Image size should be less than 5MB");
        isValid = false;
      } else {
        setBannerError("");
      }
    }
    
    // Validate caretakers
    const newCaretakerErrors = [];
    caretakers.forEach((caretaker, index) => {
      const errors = validateCaretaker(caretaker, index);
      if (Object.keys(errors).length > 0) {
        isValid = false;
      }
      newCaretakerErrors.push(errors);
    });
    setCaretakerErrors(newCaretakerErrors);
    
    return isValid;
  };

  // Handler for saving the animal type
  const handleSave = async () => {
    if (!validateForm()) {
      setPopup({ 
        show: true, 
        success: false, 
        message: "Please fix the validation errors before submitting" 
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('name', name);
      formData.append('managementType', managementType);
      formData.append('caretakers', JSON.stringify(caretakers));
      formData.append('categories', JSON.stringify(categories));
      formData.append('productivityFields', JSON.stringify(productivityFields)); // NEW
      
      if (banner) {
        formData.append('bannerImage', banner);
      }

      const response = await fetch('http://localhost:5000/animal-types', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save animal type');
      }

      const result = await response.json();
      setPopup({ 
        show: true, 
        success: true, 
        message: "Animal type saved successfully!" 
      });
      
      // Reset form after successful save
      setName("");
      setBanner(null);
      setCaretakers([{ id: "", name: "", mobile: "" }]);
      setCaretakerErrors([{}]);
      setProductivityFields([{ name: "", label: "", type: "number", unit: "", required: false }]); // Reset productivity fields

    } catch (error) {
      console.error("Save error:", error);
      setPopup({ 
        show: true, 
        success: false, 
        message: error.message || "Failed to save animal type" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${darkMode ? "dark bg-gray-900 text-gray-100" : "light-beige"} min-h-screen transition-colors duration-300 p-4`}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
          Add New Animal Type
        </h2>

        {/* Management Type Switch */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md">
          <label className="text-lg font-semibold whitespace-nowrap dark:text-gray-200">Management Type:</label>
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-full p-1">
            <button
              onClick={() => setManagementType("individual")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                managementType === "individual" 
                  ? "bg-green-600 text-white shadow-md" 
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setManagementType("batch")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                managementType === "batch" 
                  ? "bg-green-600 text-white shadow-md" 
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Group / Batch
            </button>
            <button
              onClick={() => setManagementType("other")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                managementType === "other" 
                  ? "bg-green-600 text-white shadow-md" 
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Other
            </button>
          </div>
        </div>

        {/* Animal Type Name and Banner */}
        <div className="flex flex-wrap gap-6 mb-6 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md">
          <div className="flex flex-col flex-1 min-w-[200px]">
            <label className="mb-1 font-semibold dark:text-gray-200">Animal Type Name: *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError("");
              }}
              className={`px-3 py-2 border rounded focus:outline-none focus:ring-2 transition-colors ${
                nameError 
                  ? "border-red-500 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              }`}
              placeholder="e.g., Dairy Cattle"
            />
            {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
          </div>

          <div className="flex flex-col flex-1 min-w-[200px]">
            <label className="mb-1 font-semibold dark:text-gray-200">Banner Image:</label>
            <div className="relative">
              <input
                type="file"
                onChange={(e) => {
                  setBanner(e.target.files[0]);
                  setBannerError("");
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 dark:file:bg-green-900 dark:file:text-green-100 dark:bg-gray-700 dark:text-gray-200"
                accept="image/*"
              />
            </div>
            {bannerError && <p className="text-red-500 text-xs mt-1">{bannerError}</p>}
            {banner && (
              <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                Selected: {banner.name}
              </p>
            )}
          </div>
        </div>

        {/* Caretaker fields for all management types */}
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h3 className="font-semibold text-lg dark:text-gray-200">Assigned Caretakers: *</h3>
            <button
              onClick={handleAddCaretaker}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-1 transition-colors"
            >
              <span>+</span> Add Caretaker
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {caretakers.map((caretaker, index) => (
              <div key={index} className="flex flex-wrap gap-4 items-start p-4 rounded-xl bg-gray-100 dark:bg-gray-700 relative">
                <div className="flex-1 min-w-[120px]">
                  <label className="mb-1 text-sm font-medium dark:text-gray-200">ID: *</label>
                  <input
                    type="text"
                    value={caretaker.id}
                    onChange={(e) => handleCaretakerChange(index, "id", e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 transition-colors ${
                      caretakerErrors[index]?.id 
                        ? "border-red-500 focus:ring-red-500 dark:bg-gray-600 dark:text-gray-200" 
                        : "border-gray-300 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200"
                    }`}
                    placeholder="CT-001"
                  />
                  {caretakerErrors[index]?.id && (
                    <p className="text-red-500 text-xs mt-1">{caretakerErrors[index].id}</p>
                  )}
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="mb-1 text-sm font-medium dark:text-gray-200">Name: *</label>
                  <input
                    type="text"
                    value={caretaker.name}
                    onChange={(e) => handleCaretakerChange(index, "name", e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 transition-colors ${
                      caretakerErrors[index]?.name 
                        ? "border-red-500 focus:ring-red-500 dark:bg-gray-600 dark:text-gray-200" 
                        : "border-gray-300 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200"
                    }`}
                    placeholder="John Doe"
                  />
                  {caretakerErrors[index]?.name && (
                    <p className="text-red-500 text-xs mt-1">{caretakerErrors[index].name}</p>
                  )}
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="mb-1 text-sm font-medium dark:text-gray-200">Mobile: *</label>
                  <input
                    type="tel"
                    inputMode="numeric"   // mobile shows numeric keyboard
                    pattern="[0-9]*"      // only allows digits in some browsers
                    value={caretaker.mobile}
                    onChange={(e) => {
                      // Only allow digits in the state
                      const value = e.target.value.replace(/\D/g, "");
                      handleCaretakerChange(index, "mobile", value);
                    }}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 transition-colors ${
                      caretakerErrors[index]?.mobile 
                        ? "border-red-500 focus:ring-red-500 dark:bg-gray-600 dark:text-gray-200" 
                        : "border-gray-300 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200"
                    }`}
                    placeholder="0765432140"
                    maxLength={10}
                  />

                  {caretakerErrors[index]?.mobile && (
                    <p className="text-red-500 text-xs mt-1">{caretakerErrors[index].mobile}</p>
                  )}
                </div>
                {caretakers.length > 1 && (
                  <button
                    onClick={() => handleRemoveCaretaker(index)}
                    className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm hover:bg-red-700 transition-colors mt-6"
                    aria-label="Remove caretaker"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* NEW: Productivity Fields Section */}
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h3 className="font-semibold text-lg dark:text-gray-200">Productivity Tracking Fields</h3>
            <button
              onClick={handleAddProductivityField}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-1 transition-colors"
            >
              <span>+</span> Add Productivity Field
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Define what productivity metrics you want to track for this animal type
          </p>
          
          <div className="flex flex-col gap-4">
            {productivityFields.map((field, index) => (
              <div key={index} className="flex flex-wrap gap-4 items-start p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1 text-sm font-medium dark:text-gray-200">Field Label *</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => handleProductivityFieldChange(index, "label", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200"
                    placeholder="e.g., Milk Production"
                  />
                </div>
                
                <div className="flex-1 min-w-[120px]">
                  <label className="mb-1 text-sm font-medium dark:text-gray-200">Data Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => handleProductivityFieldChange(index, "type", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200"
                  >
                    <option value="number">Number</option>
                    <option value="text">Text</option>
                  </select>
                </div>
                
                <div className="flex-1 min-w-[100px]">
                <label className="mb-1 text-sm font-medium dark:text-gray-200">Unit</label>
                <select
                  value={field.unit}
                  onChange={(e) => handleProductivityFieldChange(index, "unit", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200"
                >
                  <option value="">Select Unit</option>
                  <option value="kg">kg</option>
                  <option value="L">L</option>
                  <option value="units">units</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="dozen">dozen</option>
                </select>
              </div>

                
                <div className="flex items-center gap-4 mt-6">
                  <label className="text-sm flex items-center gap-2 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={field.required || false}
                      onChange={(e) => handleProductivityFieldChange(index, "required", e.target.checked)}
                      className="rounded"
                    />
                    Required
                  </label>
                  
                  {productivityFields.length > 1 && (
                    <button
                      onClick={() => handleRemoveProductivityField(index)}
                      className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-700 transition-colors"
                      aria-label="Remove field"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Category and Field Section */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 mb-6">
          {categories.map((cat, catIdx) => (
            <div
              key={catIdx}
              className={`flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 h-full transition-transform hover:scale-[1.01]`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg mb-2 sm:mb-0 dark:text-gray-200">{cat.name}</h3>
                <button
                  onClick={() => handleAddField(catIdx)}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm flex items-center gap-1 transition-colors"
                >
                  <span>+</span> Add Field
                </button>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                {cat.fields.map((field, fieldIdx) => (
                  <div key={fieldIdx} className="flex flex-wrap items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex-1 min-w-[120px]">
                      <input
                        placeholder="Field Label"
                        value={field.label}
                        onChange={(e) => handleFieldChange(catIdx, fieldIdx, "label", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-600 dark:text-gray-200"
                        disabled={field.readOnly}
                      />
                    </div>
                    <select
                      value={field.type}
                      onChange={(e) => handleFieldChange(catIdx, fieldIdx, "type", e.target.value)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-600 dark:text-gray-200"
                      disabled={field.readOnly}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="time">Time</option>
                      <option value="datetime">Datetime</option>
                      <option value="select">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="tel">Tel</option>
                    </select>
                    {field.type === "select" && (
                      <input
                        placeholder="Options (comma separated)"
                        value={field.options?.join(",") || ""}
                        onChange={(e) => handleFieldChange(catIdx, fieldIdx, "options", e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-600 dark:text-gray-200"
                        disabled={field.readOnly}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <label className="text-xs flex items-center gap-1 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={field.required || false}
                          onChange={(e) => handleFieldChange(catIdx, fieldIdx, "required", e.target.checked)}
                          className="rounded"
                          disabled={field.readOnly}
                        />
                        Required
                      </label>
                      {!field.readOnly && (
                        <button
                          onClick={() => handleRemoveField(catIdx, fieldIdx)}
                          className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-700 transition-colors"
                          aria-label="Remove field"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save Animal Type"}
          </button>
        </div>
      </div>

      {/* Popup */}
{popup.show && (
  <div
    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onClick={() => setPopup({ ...popup, show: false })}
  >
    <div
      className={`bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-xs text-center shadow-xl border-t-4 ${
        popup.success ? "border-green-500" : "border-red-500"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Icon */}
      <div className="mb-4">
        {popup.success ? (
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto relative flex items-center justify-center">
            <div className="w-10 h-5 border-l-2 border-b-2 border-green-500 rotate-[-45deg] translate-y-[-2px]"></div>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto relative flex items-center justify-center">
            <span className="w-8 h-1 bg-red-500 rotate-45 absolute"></span>
            <span className="w-8 h-1 bg-red-500 -rotate-45 absolute"></span>
          </div>
        )}
      </div>

      {/* Message */}
      <p className="text-sm font-medium dark:text-gray-200 mb-2">{popup.message}</p>

      {/* Button */}
      <button
        onClick={() => {
          setPopup({ ...popup, show: false });

          if (popup.success) {
            // Success → redirect to /AnimalManagement
            navigate("/AnimalManagement");
          }
          // Error → stay on the same page (no navigation needed)
        }}
        className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
          popup.success
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        } transition-colors`}
      >
        OK
      </button>
    </div>
  </div>
)}


      {/* Loader */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-green-500 border-gray-300 rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium dark:text-gray-200">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddAnimalType;