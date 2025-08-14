import React, { useState, useEffect } from "react";
import TopNavbar from '../TopNavbar/TopNavbar.js';
import Sidebar from '../Sidebar/Sidebar.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { useNavigate } from 'react-router-dom';
import "./AddAnimalType.css";


export default function AddAnimalType() {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [name, setName] = useState("");
  const [banner, setBanner] = useState(null); // File object
  const [fields, setFields] = useState([{ name: "", label: "", type: "text" }]);
  const navigate = useNavigate();

   useEffect(() => {
    document.title = "Add type";
  }, []);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  const handleAddField = () => setFields([...fields, { name: "", label: "", type: "text" }]);
  const handleFieldChange = (index, key, value) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    if (key === "label") newFields[index].name = value.toLowerCase().replace(/\s+/g, "");
    setFields(newFields);
  };

  const handleSave = async () => {
    if (!name) return alert("Animal type name is required");
    if (!banner) return alert("Banner image is required");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("bannerImage", banner); // Important: must be File object
    formData.append("fields", JSON.stringify(fields));

    try {
      const res = await fetch("http://localhost:5000/animals", {
        method: "POST",
        body: formData, // DO NOT set Content-Type manually
      });

      const data = await res.json();
      console.log("Saved:", data);

      if (res.ok) {
        alert("Animal type saved successfully!");
        navigate("/AnimalManagement");
      } else {
        alert(data.message || "Failed to save animal type");
      }

    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to save animal type");
    }
  };

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={null} />
      <TopNavbar onMenuClick={handleMenuClick} />

      <main className="main-content add-animal-type-page">
        <h2>Add New Animal Type</h2>

        <div className="form-group">
          <label>Animal Type Name:</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Banner Image:</label>
          <input type="file" onChange={e => setBanner(e.target.files[0])} />
        </div>

        <h3>Custom Fields</h3>
        {fields.map((f, i) => (
          <div key={i} className="field-row">
            <input
              placeholder="Field Label"
              value={f.label}
              onChange={e => handleFieldChange(i, "label", e.target.value)}
            />
            <select
              value={f.type}
              onChange={e => handleFieldChange(i, "type", e.target.value)}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
            </select>
          </div>
        ))}
        <button onClick={handleAddField}>+ Add Field</button>

        <div className="action-buttons">
          <button onClick={handleSave} className="btn-save">Save Animal Type</button>
        </div>
      </main>
    </div>
  );
}
