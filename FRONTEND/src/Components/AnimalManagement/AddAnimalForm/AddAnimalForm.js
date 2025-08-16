import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import { useTheme } from '../contexts/ThemeContext.js';
import { useLoader } from "../contexts/LoaderContext.js"; // <-- loader context
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import "./AddAnimalForm.css";

export default function AddAnimalForm() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { setLoading: setGlobalLoading } = useLoader(); // <-- loader context

  const [animalType, setAnimalType] = useState(null);
  const [formData, setFormData] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState(null);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

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

        const initialData = {};
        const basicCategory = data.categories.find(cat => cat.name === "Basic Info");
        if (basicCategory) {
          basicCategory.fields.forEach(field => {
            initialData[field.name] = field.type === 'checkbox' ? false : "";
          });
        }
        initialData.generateQR = true;
        setFormData(initialData);
      } catch (err) {
        setError(err.message);
      } finally {
        setGlobalLoading(false);
      }
    };
    fetchAnimalType();
  }, [type, setGlobalLoading]);

  const handleChange = e => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: inputType === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
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

    } catch (err) {
      setError(err.message);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleAddMore = () => {
    setShowSuccessPopup(false);
    setQrData(null);
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

  if (error) return <div className="form-container">{error}</div>;
  if (!animalType) return <div className="form-container">Loading...</div>;

  const basicCategory = animalType.categories.find(cat => cat.name === "Basic Info");

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} />
      <div className={`main-content-wrapper ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <TopNavbar onMenuClick={handleMenuClick} />
        <div className={`form-container ${darkMode ? "dark" : ""}`}>
          <h2>Add New {animalType.name}</h2>
          <form onSubmit={handleSubmit}>
            {basicCategory && (
              <div className="form-row">
                {basicCategory.fields.map(field => (
                  <div className="form-group" key={field.name}>
                    {field.type === "checkbox" ? (
                      <div className="checkbox-group">
                        <input type="checkbox" id={field.name} name={field.name} checked={formData[field.name]} onChange={handleChange} />
                        <label htmlFor={field.name}>{field.label}</label>
                      </div>
                    ) : field.type === "select" ? (
                      <>
                        <label htmlFor={field.name}>{field.label}</label>
                        <select id={field.name} name={field.name} value={formData[field.name] || ""} onChange={handleChange} required={field.required}>
                          <option value="">Select {field.label}</option>
                          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </>
                    ) : (
                      <>
                        <label htmlFor={field.name}>{field.label}</label>
                        <input type={field.type || "text"} id={field.name} name={field.name} value={formData[field.name]} onChange={handleChange} required={field.required} placeholder={field.placeholder || ""} />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="form-group checkbox-group">
              <input 
                type="checkbox" 
                id="generateQR" 
                name="generateQR" 
                checked={formData.generateQR} 
                onChange={handleChange} 
              />
              <label htmlFor="generateQR">Generate QR Code?</label>
            </div>

            <button type="submit" className="submit-btn">Add {animalType.name}</button>
          </form>
        </div>

        {showSuccessPopup && (
          <div className="popup-overlay">
            <div className="success-popup">
              <h3>Success!</h3>
              <div className="success-animation animate">
                <div className="animation-circle"></div>
                <div className="check-icon">✔</div>
              </div>
              <p>{animalType.name} added successfully</p>
              {qrData && (
                <div className={`popup-qr-container ${darkMode ? "dark" : ""}`}>
                  <QRCodeCanvas value={qrData} size={180} level="H" includeMargin />
                  <h4>QR: {qrData}</h4>
                </div>
              )}
              <div className="popup-buttons">
                {qrData && <button className="popup-download-btn" onClick={downloadQRAsPDF}>Download QR</button>}
                <button className="popup-addmore-btn" onClick={handleAddMore}>Add Another</button>
                <button className="popup-close-btn" onClick={() => navigate(`/AnimalManagement/${animalType._id}`)}>View List</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
