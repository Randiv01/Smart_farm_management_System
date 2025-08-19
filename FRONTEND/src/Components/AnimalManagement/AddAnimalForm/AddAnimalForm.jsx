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

  useEffect(() => {
    document.title = "Add New Animal";
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
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Animal type not found");
        const data = await res.json();
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

    setFieldErrors(newErrors);
    setTouchedFields(
      Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );
    return isValid;
  };

  // Handle submit
  const handleSubmit = async e => {
    e.preventDefault();

    const isValid = validateAllFields();
    if (!isValid) {
      setErrorMessages(["Please fill all required fields correctly"]);
      return;
    }

    try {
      setGlobalLoading(true);
      const res = await fetch("http://localhost:5000/animals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: animalType._id, data: formData, generateQR: formData.generateQR }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add animal");
      }
      const result = await res.json();
      setQrData(result.qrCode);
      setShowSuccessPopup(true);

      const resetData = {};
      Object.keys(formData).forEach(key => resetData[key] = key === 'generateQR' ? true : "");
      setFormData(resetData);
      setFieldErrors({});
      setTouchedFields({});
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
    pdf.save(`animal_${qrData}.pdf`);
  };

  if (!animalType) return <div className="p-4">Loading...</div>;

  return (
    <div className={`max-w-6xl mx-auto p-6 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
      <h2 className="text-2xl font-semibold mb-6">Add New {animalType.name}</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
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

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Add {animalType.name}
          </button>
        </div>
      </form>

      {/* Success & QR Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={handleAddMore}>
          <div className={`rounded-2xl p-8 max-w-md text-center ${darkMode ? "bg-gray-800" : "bg-white shadow-xl"}`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center items-center mb-4">
              <div className="w-24 h-24 bg-green-600 rounded-full flex justify-center items-center">
                <span className="text-white text-4xl">✓</span>
              </div>
            </div>
            <p className={`mt-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
              {animalType.name} added successfully
            </p>
            {qrData && (
              <div className={`p-4 rounded-xl my-4 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <QRCodeCanvas value={qrData} size={180} level="H" includeMargin />
                <h4 className={`mt-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>QR: {qrData}</h4>
              </div>
            )}
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