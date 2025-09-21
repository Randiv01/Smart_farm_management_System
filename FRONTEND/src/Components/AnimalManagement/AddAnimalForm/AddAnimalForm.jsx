import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.js";
import { useLoader } from "../contexts/LoaderContext.js";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import { FiPlus, FiMapPin, FiCheckCircle, FiX, FiAlertTriangle, FiUsers, FiTag } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

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
    document.title = `Add New Animal - Animal Manager`;
  }, []);

  // Fetch with error handling
  const fetchWithErrorHandling = async (url, options = {}) => {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get("content-type");
      const responseText = await res.text();
      
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        throw new Error(`Server returned HTML instead of JSON. Status: ${res.status}`);
      }
      
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

  // Fetch zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const data = await fetchWithErrorHandling("http://localhost:5000/zones");
        setZones(data.zones || []);
      } catch (err) {
        setErrorMessages([`Failed to load zones: ${err.message}`]);
      }
    };
    fetchZones();
  }, []);

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

        const initialData = {};
        data.categories.forEach(category => {
          category.fields.forEach(field => {
            initialData[field.name] = field.type === 'checkbox' ? false : "";
          });
        });
        initialData.generateQR = true;
        setFormData(initialData);

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
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    if (touchedFields[name]) {
      validateField(name);
    }
  };

  // Validate individual field
  const validateField = (fieldName) => {
    const fieldMeta = animalType?.categories
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

    animalType?.categories.forEach(category => {
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

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();
    setErrorMessages([]);

    const isValid = validateAllFields();
    if (!isValid) return;

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
      
      if (animalType.managementType === "individual" && result.qrCode) {
        setQrData(result.qrCode);
      } else if (animalType.managementType === "batch" || animalType.managementType === "other") {
        setQrData(groupId);
      }
      
      setShowSuccessPopup(true);

      const resetData = {};
      Object.keys(formData).forEach(key => resetData[key] = key === 'generateQR' ? true : "");
      setFormData(resetData);
      setFieldErrors({});
      setTouchedFields({});
      setSelectedZone("");
      if (animalType.managementType === "batch" || animalType.managementType === "other") {
        setAnimalCount(1);
      }
    } catch (err) {
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

  if (!animalType) {
    return (
      <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"} flex items-center justify-center`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}
        >
          <FiAlertTriangle className="text-4xl text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Loading animal type...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "light-beige"} font-sans`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3 mb-8">
            <FiPlus className="text-green-600 dark:text-green-400" size={32} />
            Add New {animalType.name.charAt(0).toUpperCase() + animalType.name.slice(1)}{" "}
            {animalType.managementType !== "individual" &&
              `(${animalType.managementType === "batch" ? "Batch" : "Group"})`}
          </h2>


          {/* Error Popup */}
          <AnimatePresence>
            {errorMessages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-lg flex items-center justify-between border border-red-400 dark:border-red-700 ${darkMode ? "bg-red-900/30 text-red-200" : "bg-red-100 text-red-700"} shadow-lg`}
              >
                <div className="flex items-center gap-3">
                  <FiAlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                  <div>
                    {errorMessages.map((msg, idx) => (
                      <p key={idx}>{msg}</p>
                    ))}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setErrorMessages([])}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  <FiX size={16} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Information */}
            {(animalType.managementType === "batch" || animalType.managementType === "other") && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-all`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <FiUsers className="text-green-600 dark:text-green-400" size={24} />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {animalType.managementType === "batch" ? "Batch" : "Group"} Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col">
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Number of Animals <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={animalCount}
                      onChange={(e) => setAnimalCount(parseInt(e.target.value) || 1)}
                      className={`px-3 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="1"
                      required
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col">
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {animalType.managementType === "batch" ? "Batch ID" : "Group ID"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={groupId}
                      onChange={(e) => {
                        setGroupId(e.target.value);
                        setGroupQRCode(e.target.value);
                      }}
                      className={`px-3 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder={animalType.managementType === "batch" ? "Batch ID" : "Group ID"}
                      required
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      This ID and QR code will represent the entire {animalType.managementType === "batch" ? "batch" : "group"}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Category Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {animalType.categories.map(category => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-all`}
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{category.name}</h3>
                  <div className="space-y-4">
                    {category.fields.map(field => (
                      <motion.div key={field.name} whileHover={{ scale: 1.02 }} className="flex flex-col">
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === "checkbox" ? (
                          <input
                            type="checkbox"
                            name={field.name}
                            checked={formData[field.name]}
                            onChange={handleChange}
                            className={`w-5 h-5 rounded border focus:ring-2 focus:ring-blue-500 ${
                              darkMode ? "bg-gray-700 border-gray-600" : "border-gray-300"
                            } checked:bg-blue-600 transition`}
                          />
                        ) : field.type === "select" ? (
                          <select
                            name={field.name}
                            value={formData[field.name] || ""}
                            onChange={handleChange}
                            required={field.required}
                            className={`px-3 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              fieldErrors[field.name]
                                ? "border-red-400 dark:border-red-700"
                                : darkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            }`}
                          >
                            <option value="">{field.example || `Select ${field.label}`}</option>
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
                            placeholder={field.example || field.label}
                            required={field.required}
                            className={`px-3 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              fieldErrors[field.name]
                                ? "border-red-400 dark:border-red-700"
                                : darkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            }`}
                          />
                        )}
                        {fieldErrors[field.name] && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-red-700 dark:text-red-200 mt-1"
                          >
                            {fieldErrors[field.name]}
                          </motion.p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Zone Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-all`}
            >
              <div className="flex items-center gap-3 mb-4">
                <FiMapPin className="text-green-600 dark:text-green-400" size={24} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Zone Assignment</h3>
              </div>
              <div className="flex flex-col">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Select Zone <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  required
                  className={`px-3 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
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
                  <div className="text-sm mt-2 text-gray-500 dark:text-gray-400">
                    Available space: {zones.find(z => z._id === selectedZone).capacity - zones.find(z => z._id === selectedZone).currentOccupancy} animals
                    {(animalType.managementType === "batch" || animalType.managementType === "other") && (
                      <span className="block mt-1">
                        You're adding {animalCount} animal{animalCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* QR Code Option */}
            {animalType.managementType === "individual" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-all`}
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="generateQR"
                    checked={formData.generateQR}
                    onChange={handleChange}
                    className={`w-5 h-5 rounded border focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? "bg-gray-700 border-gray-600" : "border-gray-300"
                    } checked:bg-blue-600 transition`}
                  />
                  <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Generate QR Code?</span>
                </label>
              </motion.div>
            )}

            <div className="flex justify-end mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <FiPlus size={18} />
                {animalType.managementType === "individual" 
                  ? `Add ${animalType.name}`
                  : `Add ${animalType.managementType === "batch" ? "Batch" : "Group"} of ${animalCount} ${animalType.name}${animalCount !== 1 ? 's' : ''}`
                }
              </motion.button>
            </div>
          </form>

          {/* Success Popup */}
          <AnimatePresence>
            {showSuccessPopup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
              >
                <div
                  className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="flex justify-center mb-4"
                  >
                    <FiCheckCircle className="text-5xl text-green-600 dark:text-green-400" />
                  </motion.div>
                  <p className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-4 text-center`}>
                    {animalType.managementType === "individual"
                      ? `${animalType.name} added successfully`
                      : `Successfully added ${animalType.managementType === "batch" ? "batch" : "group"} of ${animalCount} ${animalType.name}${animalCount !== 1 ? "s" : ""}`
                    }
                  </p>
                  {qrData && (
                    <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}>
                      <div className="flex justify-center">
                        <QRCodeCanvas value={qrData} size={180} level="H" includeMargin />
                      </div>
                      <h4 className={`mt-3 text-center text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {animalType.managementType === "individual" ? "QR:" : `${animalType.managementType === "batch" ? "Batch" : "Group"} QR:`} {qrData}
                      </h4>
                      {animalType.managementType !== "individual" && (
                        <p className="text-sm mt-2 text-center text-gray-500 dark:text-gray-400">
                          This QR code represents the entire {animalType.managementType === "batch" ? "batch" : "group"} of {animalCount} animals
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap justify-center gap-3">
                    {qrData && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={downloadQRAsPDF}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 min-w-[120px]"
                      >
                        <FiTag size={16} />
                        Download QR
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddMore}
                      className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 min-w-[120px]"
                    >
                      <FiPlus size={16} />
                      Add Another
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(`/AnimalManagement/${animalType._id}`)}
                      className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all flex items-center gap-2 min-w-[120px]"
                    >
                      <FiUsers size={16} />
                      View List
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}