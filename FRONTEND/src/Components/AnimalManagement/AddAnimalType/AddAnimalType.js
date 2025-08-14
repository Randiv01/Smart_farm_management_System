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
  const [banner, setBanner] = useState(null);
  const navigate = useNavigate();

  const defaultCategories = [
    {
      name: "Basic Info",
      fields: [
        { name: "name", label: "Name" },
        { name: "breed", label: "Breed" },
        { name: "age", label: "Age" },
        { name: "dob", label: "Date of Birth" },
        { name: "gender", label: "Gender" },
        { name: "owner", label: "Owner" },
        { name: "location", label: "Location" },
      ]
    },
    {
      name: "Health Info",
      fields: [
        { name: "weight", label: "Weight" },
        { name: "temperature", label: "Temperature" },
        { name: "healthStatus", label: "Health Status" },
        { name: "lastCheckup", label: "Last Checkup" },
        { name: "symptoms", label: "Symptoms" },
        { name: "vaccinations", label: "Vaccinations" },
        { name: "treatments", label: "Treatments" },
        { name: "reproductiveStatus", label: "Reproductive Status" },
      ]
    },
    {
      name: "Productivity Info",
      fields: [
        { name: "milkProduction", label: "Milk Production" },
        { name: "eggProduction", label: "Egg Production" },
        { name: "feedType", label: "Feed Type" },
        { name: "growthMetrics", label: "Growth Metrics" },
      ]
    },
    {
      name: "Caretaker",
      fields: [
        { name: "caretakerName", label: "Caretaker Name" },
        { name: "contact", label: "Contact" }
      ]
    }
  ];

  const [categories, setCategories] = useState(defaultCategories);

  useEffect(() => {
    document.title = "Add New Animal Type";
  }, []);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  const handleAddField = (categoryIndex) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].fields.push({ name: "", label: "" });
    setCategories(newCategories);
  };

  const handleRemoveField = (catIdx, fieldIdx) => {
    const newCategories = [...categories];
    newCategories[catIdx].fields.splice(fieldIdx, 1);
    setCategories(newCategories);
  };

  const handleFieldChange = (catIdx, fieldIdx, key, value) => {
    const newCategories = [...categories];
    newCategories[catIdx].fields[fieldIdx][key] = value;
    if (key === "label") {
      newCategories[catIdx].fields[fieldIdx].name = value.toLowerCase().replace(/\s+/g, "");
    }
    setCategories(newCategories);
  };

  const handleSave = async () => {
  if (!name) return alert("Animal type name is required");
  if (!banner) return alert("Banner image is required");

  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("categories", JSON.stringify(categories)); // stringify!
    formData.append("bannerImage", banner);

    const response = await fetch("http://localhost:5000/animal-types", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
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
                  <button 
                    className="add-field-btn"
                    onClick={() => handleAddField(catIdx)}
                  >
                    + Add Field
                  </button>
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
                      <button 
                        className="btn-remove"
                        onClick={() => handleRemoveField(catIdx, fieldIdx)}
                        title="Remove field"
                      >
                        ✖
                      </button>
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
    </div>
  );
}