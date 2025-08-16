import React, { useState, useEffect } from "react";
import TopNavbar from '../TopNavbar/TopNavbar.js';
import Sidebar from '../Sidebar/Sidebar.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { useNavigate } from 'react-router-dom';
import { useLoader } from "../contexts/LoaderContext.js";
import "./AddAnimalType.css";

export default function AddAnimalType() {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const { loading, setLoading } = useLoader();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [name, setName] = useState("");
  const [banner, setBanner] = useState(null);
  const [popup, setPopup] = useState({ show: false, success: true, message: "" });
  const navigate = useNavigate();

  // -------------------- DEFAULT CATEGORIES --------------------
  const defaultCategories = [
    {
      name: "Basic Info",
      fields: [
        { name: "name", label: "Name", type: "text" },
        { name: "breed", label: "Breed", type: "text" },
        { name: "age", label: "Age", type: "number" },
        { name: "dob", label: "Date of Birth", type: "date" },
        { name: "gender", label: "Gender", type: "select", options: ["Male","Female"] },
        { name: "owner", label: "Owner", type: "text" },
        { name: "location", label: "Location", type: "text" },
      ]
    },
    {
      name: "Health Info",
      fields: [
        { name: "weight", label: "Weight", type: "number" },
        { name: "temperature", label: "Temperature", type: "number" },
        { name: "healthStatus", label: "Health Status", type: "text" },
        { name: "lastCheckup", label: "Last Checkup", type: "date" },
        { name: "symptoms", label: "Symptoms", type: "text" },
        { name: "vaccinations", label: "Vaccinations", type: "text" },
        { name: "treatments", label: "Treatments", type: "text" },
        { name: "reproductiveStatus", label: "Reproductive Status", type: "text" },
      ]
    },
    {
      name: "Productivity Info",
      fields: [
        { name: "milkProduction", label: "Milk Production", type: "number" },
        { name: "eggProduction", label: "Egg Production", type: "number" },
        { name: "feedType", label: "Feed Type", type: "text" },
        { name: "growthMetrics", label: "Growth Metrics", type: "text" },
      ]
    },
    {
      name: "Caretaker",
      fields: [
        { name: "caretakerName", label: "Caretaker Name", type: "text" },
        { name: "contact", label: "Contact", type: "text" }
      ]
    }
  ];

  const [categories, setCategories] = useState(defaultCategories);

  useEffect(() => { document.title = "Add New Animal Type"; }, []);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  // -------------------- FIELD MANAGEMENT --------------------
  const handleAddField = (categoryIndex) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].fields.push({ name: "", label: "", type: "text", options: [] });
    setCategories(newCategories);
  };

  const handleRemoveField = (catIdx, fieldIdx) => {
    const newCategories = [...categories];
    newCategories[catIdx].fields.splice(fieldIdx, 1);
    setCategories(newCategories);
  };

  const handleFieldChange = (catIdx, fieldIdx, key, value) => {
    const newCategories = [...categories];
    if (key === "label") {
      newCategories[catIdx].fields[fieldIdx].name = value.toLowerCase().replace(/\s+/g, "");
      newCategories[catIdx].fields[fieldIdx].label = value;
    } else if (key === "options") {
      newCategories[catIdx].fields[fieldIdx][key] = value.split(",").map(opt => opt.trim());
    } else {
      newCategories[catIdx].fields[fieldIdx][key] = value;
    }
    setCategories(newCategories);
  };

  // -------------------- SAVE ANIMAL TYPE --------------------
  const handleSave = async () => {
    if (!name) return setPopup({ show: true, success: false, message: "Animal type name is required" });
    if (!banner) return setPopup({ show: true, success: false, message: "Banner image is required" });

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("categories", JSON.stringify(categories));
      formData.append("bannerImage", banner);

      const response = await fetch("http://localhost:5000/animal-types", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setPopup({ show: true, success: true, message: "Animal type saved successfully!" });
        setTimeout(() => navigate("/AnimalManagement"), 2000);
      } else {
        setPopup({ show: true, success: false, message: data.message || "Failed to save animal type" });
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setPopup({ show: true, success: false, message: "Failed to save animal type" });
    } finally { setLoading(false); }
  };

  // -------------------- RENDER --------------------
  return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={null} />
      <div className={`main-content-wrapper ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <TopNavbar onMenuClick={handleMenuClick} />

        <main className="add-animal-type-page">
          <h2>Add New Animal Type</h2>

          <div className="form-header">
            <div className="form-group compact">
              <label>Animal Type Name:</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group compact">
              <label>Banner Image:</label>
              <input type="file" onChange={e => setBanner(e.target.files[0])} />
            </div>
          </div>

          <div className="category-grid">
            {categories.map((cat, catIdx) => (
              <div key={catIdx} className={`category-section ${darkMode ? "dark" : ""}`}>
                <div className="category-header">
                  <h3>{cat.name}</h3>
                  <button className="add-field-btn" onClick={() => handleAddField(catIdx)}>+ Add Field</button>
                </div>

                <div className="fields-container">
                  {cat.fields.map((field, fieldIdx) => (
                    <div key={fieldIdx} className="field-row">
                      <input
                        placeholder="Field Label"
                        value={field.label}
                        onChange={e => handleFieldChange(catIdx, fieldIdx, "label", e.target.value)}
                        className="field-label-input"
                      />

                      <select
                        value={field.type}
                        onChange={e => handleFieldChange(catIdx, fieldIdx, "type", e.target.value)}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                      </select>

                      {field.type === "select" && (
                        <input
                          placeholder="Options (comma separated)"
                          value={field.options?.join(",") || ""}
                          onChange={e => handleFieldChange(catIdx, fieldIdx, "options", e.target.value)}
                        />
                      )}

                      <button className="btn-remove" onClick={() => handleRemoveField(catIdx, fieldIdx)}>✖</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="action-buttons">
            <button onClick={handleSave} className="btn-asave">Save Animal Type</button>
          </div>
        </main>
      </div>

      {/* Popup */}
      {popup.show && (
        <div className="popup-overlay" onClick={() => setPopup({ ...popup, show: false })}>
          <div className={`popup-box ${popup.success ? "success" : "error"}`}>
            <div className="icon-wrapper">{popup.success ? <div className="checkmark"></div> : <div className="crossmark"></div>}</div>
            <p>{popup.message}</p>
          </div>
        </div>
      )}

      {/* Loader */}
      {loading && (
        <div className="loader-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}
