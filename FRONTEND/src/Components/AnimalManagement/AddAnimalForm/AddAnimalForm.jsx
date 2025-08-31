import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from '../contexts/ThemeContext.js';
import { useLoader } from "../contexts/LoaderContext.js";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";

export default function AddAnimalForm() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading: setGlobalLoading } = useLoader();

  const [animalType, setAnimalType] = useState(null);
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [errorMessages, setErrorMessages] = useState([]);
  const [touchedFields, setTouchedFields] = useState({});
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [animalCount, setAnimalCount] = useState(1);
  const [groupId, setGroupId] = useState("");
  const [groupQRCode, setGroupQRCode] = useState("");

  useEffect(() => {
    document.title = "Add New Animal";
  }, []);

  // Enhanced fetch function with better error handling
  const fetchWithErrorHandling = async (url, options = {}) => {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get("content-type");
      const responseText = await res.text();
      
      // Check if response is HTML instead of JSON
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        throw new Error(`Server returned HTML instead of JSON. Status: ${res.status}`);
      }
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      if (!res.ok) {
        throw new Error(data.message || `Server error: ${res.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      throw error;
    }
  };

  // Fetch available zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const data = await fetchWithErrorHandling("http://localhost:5000/zones");
        setZones(data.zones || []);
      } catch (err) {
        console.error("Failed to fetch zones:", err);
        setErrorMessages([`Failed to load zones: ${err.message}`]);
      }
    };
    fetchZones();
  }, []);

  // Helper for realistic placeholders
  const getPlaceholder = (field) => {
    if (field.example) return field.example;
    switch (field.type) {
      case "text": return "Text";
      case "number": return "3";
      case "email": return "example@email.com";
      case "tel": return "+94771234567";
      case "select": return `Select ${field.label}`;
      default: return field.label;
    }
  };

  // Fetch animal type and initialize form
  useEffect(() => {
    const fetchAnimalType = async () => {
      try {
        setGlobalLoading(true);
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(type);
        const endpoint = isObjectId
          ? `http://localhost:5000/animal-types/${type}`
          : `http://localhost:5000/animal-types/name/${type.toLowerCase()}`;
        
        const data = await fetchWithErrorHandling(endpoint);
        setAnimalType(data);

        // Initialize formData with all fields from all categories
        const initialData = {};
        data.categories.forEach(category => {
          category.fields.forEach(field => {
            initialData[field.name] = field.type === 'checkbox' ? false : "";
          });
        });
        initialData.generateQR = true;
        setFormData(initialData);

        // Generate IDs based on management type
        if (data.managementType === "batch" || data.managementType === "other") {
          const newGroupId = data.managementType === "batch" 
            ? `BATCH-${Date.now()}` 
            : `GROUP-${Date.now()}`;
          setGroupId(newGroupId);
          setGroupQRCode(newGroupId);
        }
      } catch (err) {
        setErrorMessages([err.message]);
      } finally {
        setGlobalLoading(false);
      }
    };
    fetchAnimalType();
  }, [type, setGlobalLoading]);

  // Handle input changes
  const handleChange = e => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: inputType === 'checkbox' ? checked : value }));
    
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Validate only if the field has been touched
    if (touchedFields[name]) {
      validateField(name);
    }
  };

  // Validate individual field
  const validateField = (fieldName) => {
    const fieldMeta = animalType.categories
      .flatMap(c => c.fields)
      .find(f => f.name === fieldName);
    
    if (!fieldMeta) return;

    const value = formData[fieldName];
    let error = "";

    if (fieldMeta.required) {
      if (fieldMeta.type === "checkbox" && !value) {
        error = `${fieldMeta.label} must be checked`;
      } else if (!value?.toString().trim()) {
        error = `${fieldMeta.label} is required`;
      }
    }

    if (value && value.toString().trim()) {
      if (fieldMeta.type === "number" && isNaN(Number(value))) {
        error = `${fieldMeta.label} must be a number`;
      }
      if (fieldMeta.type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) error = "Invalid email format";
      }
      if (fieldMeta.type === "tel") {
        const phoneRegex = /^[0-9+]{7,15}$/;
        if (!phoneRegex.test(value)) error = "Invalid phone number";
      }
    }

    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  // Validate all fields
  const validateAllFields = () => {
    const newErrors = {};
    let isValid = true;

    animalType.categories.forEach(category => {
      category.fields.forEach(field => {
        const value = formData[field.name];
        let error = "";

        if (field.required) {
          if (field.type === "checkbox" && !value) {
            error = `${field.label} must be checked`;
          } else if (!value?.toString().trim()) {
            error = `${field.label} is required`;
          }
        }

        if (value && value.toString().trim()) {
          if (field.type === "number" && isNaN(Number(value))) {
            error = `${field.label} must be a number`;
          }
          if (field.type === "email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) error = "Invalid email format";
          }
          if (field.type === "tel") {
            const phoneRegex = /^[0-9+]{7,15}$/;
            if (!phoneRegex.test(value)) error = "Invalid phone number";
          }
        }

        if (error) {
          newErrors[field.name] = error;
          isValid = false;
        }
      });
    });

    // Validate zone selection
    if (!selectedZone) {
      setErrorMessages(prev => [...prev, "Please select a zone for the animal"]);
      isValid = false;
    } else {
      const selectedZoneData = zones.find(z => z._id === selectedZone);
      if (selectedZoneData) {
        const availableSpace = selectedZoneData.capacity - selectedZoneData.currentOccupancy;
        const animalsToAdd = (animalType?.managementType === "batch" || animalType?.managementType === "other") 
          ? animalCount : 1;
        
        if (availableSpace < animalsToAdd) {
          setErrorMessages(prev => [...prev, `Selected zone can only accommodate ${availableSpace} more animals. You're trying to add ${animalsToAdd}.`]);
          isValid = false;
        }
      }
    }

    // Validate animal count for group types
    if ((animalType?.managementType === "batch" || animalType?.managementType === "other") && animalCount < 1) {
      setErrorMessages(prev => [...prev, "Animal count must be at least 1"]);
      isValid = false;
    }

    setFieldErrors(newErrors);
    setTouchedFields(
      Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );
    return isValid;
  };

  // Handle submit - different endpoints for individual vs group
  const handleSubmit = async e => {
    e.preventDefault();
    setErrorMessages([]); // Clear previous errors

    const isValid = validateAllFields();
    if (!isValid) {
      return;
    }

    try {
      setGlobalLoading(true);
      
      let endpoint, body;
      
      if (animalType.managementType === "batch" || animalType.managementType === "other") {
        endpoint = animalType.managementType === "batch" 
          ? "http://localhost:5000/animals/batch" 
          : "http://localhost:5000/animals/group";
        
        body = JSON.stringify({ 
          type: animalType._id, 
          data: formData, 
          zoneId: selectedZone,
          count: animalCount,
          groupId: groupId,
          generateQR: false
        });
      } else {
        endpoint = "http://localhost:5000/animals";
        body = JSON.stringify({ 
          type: animalType._id, 
          data: formData, 
          generateQR: formData.generateQR,
          zoneId: selectedZone 
        });
      }
      
      const result = await fetchWithErrorHandling(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body
      });
      
      // Show QR for individual animals or group QR for groups
      if (animalType.managementType === "individual" && result.qrCode) {
        setQrData(result.qrCode);
      } else if (animalType.managementType === "batch" || animalType.managementType === "other") {
        setQrData(groupId);
      }
      
      setShowSuccessPopup(true);

      // Reset form but preserve group settings
      const resetData = {};
      Object.keys(formData).forEach(key => resetData[key] = key === 'generateQR' ? true : "");
      setFormData(resetData);
      setFieldErrors({});
      setTouchedFields({});
      setSelectedZone("");
      
      // Reset group count but keep the same group ID for next group
      if (animalType.managementType === "batch" || animalType.managementType === "other") {
        setAnimalCount(1);
      }
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMessages([err.message]);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleAddMore = () => {
    setShowSuccessPopup(false);
    setQrData(null);
    setErrorMessages([]);
    window.scrollTo(0, 0);
  };

  const downloadQRAsPDF = () => {
    if (!qrData) return;
    const pdf = new jsPDF();
    const canvas = document.querySelector("canvas");
    if (canvas) pdf.addImage(canvas.toDataURL("image/png"), 'PNG', 50, 30, 100, 100);
    pdf.setFontSize(20);
    pdf.text(`QR: ${qrData}`, 105, 140, { align: 'center' });
    pdf.text(`Type: ${animalType?.name || ''}`, 105, 150, { align: 'center' });
    if (animalType?.managementType === "batch" || animalType?.managementType === "other") {
      pdf.text(`Group Size: ${animalCount} animals`, 105, 160, { align: 'center' });
      pdf.text(`Group Type: ${animalType.managementType === "batch" ? "Batch" : "Group"}`, 105, 170, { align: 'center' });
    }
    pdf.save(`${animalType?.managementType === "individual" ? 'animal' : 'group'}_${qrData}.pdf`);
  };

  if (!animalType) return <div className="p-4">Loading animal type...</div>;

  return (
    <div className={`max-w-6xl mx-auto p-6 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
      <h2 className="text-2xl font-semibold mb-6">
        Add New {animalType.name} 
        {animalType.managementType !== "individual" && ` ${animalType.managementType === "batch" ? "Batch" : "Group"}`}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Group Information (only show for batch/other types) */}
        {(animalType.managementType === "batch" || animalType.managementType === "other") && (
          <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
            <h3 className="text-xl font-semibold mb-4">
              {animalType.managementType === "batch" ? "Batch" : "Group"} Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className={`font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Number of Animals *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={animalCount}
                  onChange={(e) => setAnimalCount(parseInt(e.target.value) || 1)}
                  className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300"} border`}
                  required
                />
              </div>
              
              <div className="flex flex-col">
                <label className={`font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {animalType.managementType === "batch" ? "Batch ID" : "Group ID"} *
                </label>
                <input
                  type="text"
                  value={groupId}
                  onChange={(e) => {
                    setGroupId(e.target.value);
                    setGroupQRCode(e.target.value);
                  }}
                  className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300"} border`}
                  placeholder={animalType.managementType === "batch" ? "Batch ID" : "Group ID"}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  This ID and QR code will represent the entire {animalType.managementType === "batch" ? "batch" : "group"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {animalType.categories.map(category => (
            <div key={category.name} className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
              <h3 className="text-xl font-semibold mb-4">{category.name}</h3>
              <div className="space-y-4">
                {category.fields.map(field => (
                  <div key={field.name} className="flex flex-col">
                    <label className={`font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {field.type === "checkbox" ? (
                      <input
                        type="checkbox"
                        name={field.name}
                        checked={formData[field.name]}
                        onChange={handleChange}
                        className={`w-5 h-5 rounded border-2 ${darkMode ? "bg-gray-700 border-gray-600" : "border-gray-300"} checked:bg-green-600 transition`}
                      />
                    ) : field.type === "select" ? (
                      <select
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        required={field.required}
                        className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300"} ${fieldErrors[field.name] ? 'border-red-500' : 'border'}`}
                      >
                        <option value="">{getPlaceholder(field)}</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        onBlur={() => validateField(field.name)}
                        placeholder={getPlaceholder(field)}
                        required={field.required}
                        className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300"} ${fieldErrors[field.name] ? 'border-red-500' : 'border'}`}
                      />
                    )}

                    {fieldErrors[field.name] && (
                      <span className="text-red-500 text-sm mt-1">{fieldErrors[field.name]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Zone Selection */}
        <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
          <h3 className="text-xl font-semibold mb-4">Zone Assignment</h3>
          <div className="flex flex-col">
            <label className={`font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Select Zone *
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              required
              className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300"} border`}
            >
              <option value="">Select a zone</option>
              {zones.map(zone => (
                <option 
                  key={zone._id} 
                  value={zone._id}
                  disabled={zone.currentOccupancy >= zone.capacity}
                >
                  {zone.name} ({zone.currentOccupancy}/{zone.capacity})
                  {zone.currentOccupancy >= zone.capacity && " - FULL"}
                </option>
              ))}
            </select>
            {selectedZone && zones.find(z => z._id === selectedZone) && (
              <div className="text-sm mt-1">
                <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                  Available space: {zones.find(z => z._id === selectedZone).capacity - zones.find(z => z._id === selectedZone).currentOccupancy} animals
                </span>
                {(animalType.managementType === "batch" || animalType.managementType === "other") && (
                  <span className="block mt-1">
                    You're adding {animalCount} animal{animalCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* QR Code option (only for individual animals) */}
        {animalType.managementType === "individual" && (
          <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="generateQR"
                checked={formData.generateQR}
                onChange={handleChange}
                className={`w-5 h-5 rounded border-2 ${darkMode ? "bg-gray-700 border-gray-600" : "border-gray-300"} checked:bg-green-600 transition`}
              />
              <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Generate QR Code?</span>
            </label>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            {animalType.managementType === "individual" 
              ? `Add ${animalType.name}`
              : `Add ${animalType.managementType === "batch" ? "Batch" : "Group"} of ${animalCount} ${animalType.name}${animalCount !== 1 ? 's' : ''}`
            }
          </button>
        </div>
      </form>

      {/* Success & QR Popup */}
      {showSuccessPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
          onClick={handleAddMore}
        >
          <div
            className={`rounded-2xl p-8 max-w-md text-center ${
              darkMode ? "bg-gray-800" : "bg-white shadow-xl"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <div className="flex justify-center items-center mb-4">
              <div className="w-24 h-24 bg-green-600 rounded-full flex justify-center items-center">
                <span className="text-white text-4xl">✓</span>
              </div>
            </div>

            {/* Success Message */}
            <p className={`mt-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
              {animalType.managementType === "individual"
                ? `${animalType.name} added successfully`
                : `Successfully added ${animalType.managementType === "batch" ? "batch" : "group"} of ${animalCount} ${animalType.name}${
                    animalCount !== 1 ? "s" : ""
                  }`
              }
            </p>

            {/* QR Code Section */}
            {qrData && (
              <div
                className={`p-4 rounded-xl my-4 ${
                  darkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                {/* Center QR */}
                <div className="flex justify-center">
                  <QRCodeCanvas value={qrData} size={180} level="H" includeMargin />
                </div>

                {/* QR Text */}
                <h4
                  className={`mt-3 text-center ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {animalType.managementType === "individual" ? "QR:" : `${animalType.managementType === "batch" ? "Batch" : "Group"} QR:`}{" "}
                  {qrData}
                </h4>

                {/* Group Info */}
                {animalType.managementType !== "individual" && (
                  <p className="text-sm mt-2 text-center">
                    This QR code represents the entire {animalType.managementType === "batch" ? "batch" : "group"} of {animalCount} animals
                  </p>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {qrData && (
                <button
                  onClick={downloadQRAsPDF}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors min-w-[120px]"
                >
                  Download QR
                </button>
              )}
              <button
                onClick={handleAddMore}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors min-w-[120px]"
              >
                Add Another
              </button>
              <button
                onClick={() => navigate(`/AnimalManagement/${animalType._id}`)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors min-w-[120px]"
              >
                View List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Popup */}
      {errorMessages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className={`rounded-2xl p-6 max-w-md text-center ${darkMode ? "bg-red-900" : "bg-red-100"} shadow-lg animate-popIn`}>
            <h3 className={`font-semibold mb-2 ${darkMode ? "text-red-200" : "text-red-800"}`}>
              Form Errors
            </h3>
            <ul className={`list-disc list-inside ${darkMode ? "text-red-200" : "text-red-700"} text-left pl-4`}>
              {errorMessages.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
            <button
              onClick={() => setErrorMessages([])}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}