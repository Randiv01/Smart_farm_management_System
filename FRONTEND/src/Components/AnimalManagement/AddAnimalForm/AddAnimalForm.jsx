import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import { useTheme } from '../contexts/ThemeContext.js';
import { useLoader } from "../contexts/LoaderContext.js";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";

export default function AddAnimalForm() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { setLoading: setGlobalLoading } = useLoader();

  const [animalType, setAnimalType] = useState(null);
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [errorMessages, setErrorMessages] = useState([]);

    useEffect(() => {
    document.title = "Add New Animal";
  }, []);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

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
    validateField({ name, type: inputType });
  };

  // Validate individual field
  const validateField = (field) => {
    const value = formData[field.name];
    let error = "";

    const fieldMeta = animalType.categories.flatMap(c => c.fields).find(f => f.name === field.name);
    if (fieldMeta) {
      if (fieldMeta.type === "checkbox" && !value) error = `${fieldMeta.label} must be checked`;
      else if (!value?.toString().trim()) error = `${fieldMeta.label} is required`;

      if (fieldMeta.type === "number" && value !== "" && isNaN(Number(value))) error = `${fieldMeta.label} must be a number`;
      if (fieldMeta.type === "email" && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) error = "Invalid email format";
      }
      if (fieldMeta.type === "tel" && value) {
        const phoneRegex = /^[0-9+]{7,15}$/;
        if (!phoneRegex.test(value)) error = "Invalid phone number";
      }
    }

    setFieldErrors(prev => ({ ...prev, [field.name]: error }));
  };

  // Validate all fields
  const validateAllFields = () => {
    const errors = {};
    animalType.categories.flatMap(c => c.fields).forEach(field => {
      const value = formData[field.name];

      if (field.type === "checkbox" && !value) errors[field.name] = `${field.label} must be checked`;
      else if (!value?.toString().trim()) errors[field.name] = `${field.label} is required`;

      if (field.type === "number" && value !== "" && isNaN(Number(value))) errors[field.name] = `${field.label} must be a number`;
      if (field.type === "email" && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) errors[field.name] = "Invalid email format";
      }
      if (field.type === "tel" && value) {
        const phoneRegex = /^[0-9+]{7,15}$/;
        if (!phoneRegex.test(value)) errors[field.name] = "Invalid phone number";
      }
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submit
  const handleSubmit = async e => {
    e.preventDefault();

    const isValid = validateAllFields();
    if (!isValid) {
      const messages = Object.values(fieldErrors).filter(Boolean);
      setErrorMessages(messages.length ? messages : ["Please fill all required fields correctly"]);
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
    <div className={`flex min-h-screen ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} />
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"} pt-24 px-8`}>
        <TopNavbar onMenuClick={handleMenuClick} />

        <div className={`max-w-4xl mx-auto p-8 rounded-2xl shadow-card ${darkMode ? "bg-dark-card shadow-cardDark" : "bg-soft-white"}`}>
          <h2 className="text-2xl font-semibold mb-6">Add New {animalType.name}</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {animalType.categories.map(category => (
              <div key={category.name} className="mb-8">
                <h3 className="text-xl font-semibold mb-4">{category.name}</h3>
                <div className="flex flex-wrap gap-6">
                  {category.fields.map(field => (
                    <div key={field.name} className="flex flex-col flex-1 min-w-[45%]">
                      <label className="font-semibold mb-1">{field.label}</label>

                      {field.type === "checkbox" ? (
                        <input
                          type="checkbox"
                          name={field.name}
                          checked={formData[field.name]}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-2 checked:bg-dark-green transition"
                        />
                      ) : field.type === "select" ? (
                        <select
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleChange}
                          required
                          className={`p-2 border rounded focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-dark-green bg-soft-white dark:bg-dark-card dark:border-dark-gray dark:text-dark-text ${fieldErrors[field.name] ? 'border-red-600' : ''}`}
                        >
                          <option value="">{getPlaceholder(field)}</option>
                          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type={field.type || "text"}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          placeholder={getPlaceholder(field)}
                          required
                          className={`p-2 border rounded focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-dark-green bg-soft-white dark:bg-dark-card dark:border-dark-gray dark:text-dark-text ${fieldErrors[field.name] ? 'border-red-600' : ''}`}
                        />
                      )}

                      {fieldErrors[field.name] && (
                        <span className="text-red-600 mt-1 text-sm">{fieldErrors[field.name]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="generateQR"
                checked={formData.generateQR}
                onChange={handleChange}
                className="w-5 h-5 rounded border-2 checked:bg-dark-green transition"
              />
              Generate QR Code?
            </label>

            <button type="submit" className="px-6 py-3 bg-dark-green text-soft-white rounded-xl hover:bg-green-700 disabled:bg-green-300 transition">
              Add {animalType.name}
            </button>
          </form>
        </div>

        {/* Success & QR Popup */}
        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={handleAddMore}>
            <div className={`bg-soft-white dark:bg-dark-card rounded-2xl p-8 max-w-md text-center shadow-cardDark`} onClick={e => e.stopPropagation()}>
              <div className="flex justify-center items-center mb-4">
                <div className="w-24 h-24 bg-dark-green rounded-full flex justify-center items-center">
                  <span className="text-soft-white text-4xl">✔</span>
                </div>
              </div>
              <p className="mt-4">{animalType.name} added successfully</p>
              {qrData && (
                <div className="flex flex-col items-center justify-center p-4 rounded-xl shadow-card mb-4 bg-soft-white dark:bg-dark-card">
                  <QRCodeCanvas value={qrData} size={180} level="H" includeMargin />
                  <h4 className="mt-3 text-gray-900 dark:text-dark-text">QR: {qrData}</h4>
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {qrData && <button onClick={downloadQRAsPDF} className="px-4 py-2 bg-btn-blue text-soft-white rounded-xl hover:bg-blue-700 min-w-[120px]">Download QR</button>}
                <button onClick={handleAddMore} className="px-4 py-2 bg-dark-green text-soft-white rounded-xl hover:bg-green-700 min-w-[120px]">Add Another</button>
                <button onClick={() => navigate(`/AnimalManagement/${animalType._id}`)} className="px-4 py-2 bg-gray-600 text-soft-white rounded-xl hover:bg-gray-700 min-w-[120px]">View List</button>
              </div>
            </div>
          </div>
        )}

        {/* Error Popup */}
        {errorMessages.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-red-100 dark:bg-red-700 rounded-2xl p-6 max-w-md text-center shadow-lg animate-popIn">
              <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Form Errors</h3>
              <ul className="list-disc list-inside text-red-700 dark:text-red-200">
                {errorMessages.map((msg, idx) => <li key={idx}>{msg}</li>)}
              </ul>
              <button onClick={() => setErrorMessages([])} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
