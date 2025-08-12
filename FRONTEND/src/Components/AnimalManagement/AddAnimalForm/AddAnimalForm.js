import React, { useState } from "react";
import { useParams } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import "./AddAnimalForm.css";

export default function AddAnimalForm() {
  const { type } = useParams();

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
  const [message, setMessage] = useState(null); // For success or error messages
  const [messageType, setMessageType] = useState(null); // "success" or "error"
  const [darkMode, setDarkMode] = useState(false);
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

      setMessage(
        `${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`
      );
      setMessageType("success");

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

  return (
    <div className={`animal-page ${darkMode ? "dark" : ""}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={type} />

      <TopNavbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onMenuClick={handleMenuClick}
      />

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
            {/* form rows as before, see previous code */}
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
              {loading ? "Adding..." : "Add Animal"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
