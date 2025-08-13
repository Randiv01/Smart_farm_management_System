import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import { useTheme } from '../contexts/ThemeContext.js';
import "./AddAnimalForm.css";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import { FaCheck, FaDownload, FaList, FaPlus } from "react-icons/fa";

export default function AddAnimalForm() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    age: "",
    dateOfBirth: "",
    gender: "Unknown",
    healthStatus: "Healthy",
    weight: "",
    owner: "",
    location: "",
    lastCheckup: "",
    reproductiveStatus: "",
    milkProduction: "",
    feedType: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "age" || name === "weight" || name === "milkProduction"
          ? Number(value)
          : value,
    }));
  };

  const downloadQRAsPDF = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const pdfWidth = pdf.internal.pageSize.getWidth();
    
    // Add QR code (centered)
    pdf.addImage(imgData, 'PNG', 50, 30, 100, 100);
    
    // Add title
    pdf.setFontSize(20);
    pdf.text(`Animal ID: ${qrData}`, pdfWidth / 2, 140, { align: 'center' });
    
    // Add additional info
    pdf.setFontSize(14);
    pdf.text(`Name: ${formData.name}`, pdfWidth / 2, 150, { align: 'center' });
    pdf.text(`Breed: ${formData.breed}`, pdfWidth / 2, 160, { align: 'center' });
    pdf.text(`Type: ${type}`, pdfWidth / 2, 170, { align: 'center' });
    
    pdf.save(`animal_qr_${qrData}.pdf`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);

    if (!formData.name || !formData.breed || !formData.age) {
      setMessage("Please fill all required fields.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`http://localhost:5000/animals/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dateOfBirth: formData.dateOfBirth || null,
          lastCheckup: formData.lastCheckup || null,
          type,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to add animal");
      }

      const addedAnimal = await response.json();
      setQrData(addedAnimal._id);

      // Show success animation and popup
      setShowAnimation(true);
      setTimeout(() => {
        setShowSuccessPopup(true);
      }, 1000);

      // Reset form
      setFormData({
        name: "",
        breed: "",
        age: "",
        dateOfBirth: "",
        gender: "Unknown",
        healthStatus: "Healthy",
        weight: "",
        owner: "",
        location: "",
        lastCheckup: "",
        reproductiveStatus: "",
        milkProduction: "",
        feedType: "",
        notes: "",
      });
    } catch (err) {
      setMessage(err.message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMore = () => {
    setShowSuccessPopup(false);
    setShowAnimation(false);
    setQrData(null);
    window.scrollTo(0, 0);
  };

  return (
    <div className={`animal-page ${darkMode ? "dark" : ""}`}>
      <Sidebar sidebarOpen={sidebarOpen} type={type} />
      <TopNavbar onMenuClick={handleMenuClick} />

      <main className="main-content">
        <div className={`form-container ${darkMode ? "dark" : ""}`}>
          <h2>Add New {type.charAt(0).toUpperCase() + type.slice(1)}</h2>

          {message && (
            <div
              className={`message ${
                messageType === "success" ? "success-message" : "error-message"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Breed *</label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Age *</label>
                <input
                  type="number"
                  name="age"
                  min="0"
                  value={formData.age}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="Unknown">Unknown</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label>Health Status</label>
                <select
                  name="healthStatus"
                  value={formData.healthStatus}
                  onChange={handleChange}
                >
                  <option value="Healthy">Healthy</option>
                  <option value="Sick">Sick</option>
                  <option value="Recovering">Recovering</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  min="0"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Owner</label>
                <input
                  type="text"
                  name="owner"
                  value={formData.owner}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Last Checkup</label>
                <input
                  type="date"
                  name="lastCheckup"
                  value={formData.lastCheckup}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Reproductive Status</label>
                <input
                  type="text"
                  name="reproductiveStatus"
                  value={formData.reproductiveStatus}
                  onChange={handleChange}
                  placeholder="e.g. Pregnant, In heat"
                />
              </div>

              <div className="form-group">
                <label>Milk Production (liters/day)</label>
                <input
                  type="number"
                  name="milkProduction"
                  min="0"
                  value={formData.milkProduction}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: "1 1 100%" }}>
                <label>Feed Type</label>
                <input
                  type="text"
                  name="feedType"
                  value={formData.feedType}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: "1 1 100%" }}>
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span className="button-loading">
                  <span className="spinner"></span> Adding...
                </span>
              ) : (
                "Add Animal"
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Success Animation */}
      {showAnimation && (
        <div className="success-animation-overlay">
          <div className={`success-animation ${showAnimation ? "animate" : ""}`}>
            <div className="animation-circle">
              <FaCheck className="check-icon" />
            </div>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="popup-overlay">
          <div className={`success-popup ${darkMode ? "dark" : ""}`}>
            <h3>Success!</h3>
            <p>{type.charAt(0).toUpperCase() + type.slice(1)} added successfully.</p>
            <p>QR code has been generated.</p>

            <div className={`popup-qr-container ${darkMode ? "dark" : ""}`}>
              <h4>Animal QR Code</h4>
              <QRCodeCanvas value={qrData} size={150} />
            </div>

            <div className="popup-buttons">
              <button 
                onClick={downloadQRAsPDF}
                className="popup-download-btn"
              >
                <FaDownload className="button-icon" /> Download QR
              </button>

              <button
                onClick={() => navigate(`/AnimalManagement/${type}`)}
                className="popup-close-btn"
              >
                <FaList className="button-icon" /> View List
              </button>

              <button
                onClick={handleAddMore}
                className="popup-addmore-btn"
              >
                <FaPlus className="button-icon" /> Add More
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}