import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import { useTheme } from '../contexts/ThemeContext.js';
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import "./AddAnimalForm.css";

export default function AddAnimalForm() {
  const { typeId } = useParams(); // URL parameter
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const [animalType, setAnimalType] = useState(null);
  const [formData, setFormData] = useState({});
  const [qrData, setQrData] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const fetchAnimalType = async () => {
      try {
        const res = await fetch(`http://localhost:5000/animal-types/${typeId}`);
        if (!res.ok) throw new Error("Animal type not found");
        const data = await res.json();
        setAnimalType(data);

        const initialData = {};
        data.categories?.forEach(cat =>
          cat.fields?.forEach(field => {
            initialData[field.name] = "";
          })
        );
        setFormData(initialData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAnimalType();
  }, [typeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/animals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: typeId, data: formData }),
      });
      const added = await res.json();
      if (!res.ok) throw new Error(added.message || "Failed to add animal");

      setQrData(added._id);
      setShowSuccessPopup(true);
      setFormData(Object.keys(formData).reduce((a, k) => ({ ...a, [k]: "" }), {}));
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMore = () => {
    setShowSuccessPopup(false);
    setQrData(null);
    window.scrollTo(0, 0);
  };

  const downloadQRAsPDF = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const pdfWidth = pdf.internal.pageSize.getWidth();
    pdf.addImage(imgData, 'PNG', 50, 30, 100, 100);
    pdf.setFontSize(20);
    pdf.text(`Animal ID: ${qrData}`, pdfWidth / 2, 140, { align: 'center' });
    pdf.save(`animal_qr_${qrData}.pdf`);
  };

  if (!animalType) return <p>Loading animal type...</p>;

  return (
    <div className={`animal-page ${darkMode ? "dark" : ""}`}>
      <Sidebar sidebarOpen={sidebarOpen} />
      <TopNavbar onMenuClick={handleMenuClick} />

      <main className="main-content">
        <h2>Add {animalType.name}</h2>

        <form onSubmit={handleSubmit}>
          {animalType.categories?.map((cat, i) => (
            <div key={i} className="category-section">
              <h3>{cat.name}</h3>
              {cat.fields?.map((field, idx) => (
                <div key={idx} className="form-group">
                  <label>{field.label}</label>
                  <input
                    type="text"
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              ))}
            </div>
          ))}

          <button type="submit" disabled={loading}>
            {loading ? "Adding..." : `Add ${animalType.name}`}
          </button>
        </form>

        {showSuccessPopup && (
          <div className="popup-overlay">
            <div className={`success-popup ${darkMode ? "dark" : ""}`}>
              <h3>Success!</h3>
              <p>{animalType.name} added successfully.</p>
              <QRCodeCanvas value={qrData} size={150} />
              <div className="popup-buttons">
                <button onClick={downloadQRAsPDF}>Download QR</button>
                <button onClick={handleAddMore}>Add More</button>
                <button onClick={() => navigate(`/AnimalManagement/${typeId}`)}>View List</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
