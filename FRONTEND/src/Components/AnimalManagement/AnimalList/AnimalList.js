import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import "./AnimalList.css";
import { useTheme } from '../contexts/ThemeContext.js';
import { QRCodeCanvas } from "qrcode.react";

export default function AnimalList() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [animals, setAnimals] = useState([]);
  const [animalType, setAnimalType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [popup, setPopup] = useState({ show: false, success: true, message: "", type: "" }); // type: 'delete'|'save'|'error'

  useEffect(() => {
    document.title = "Animal List";
  }, []);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const typeRes = await fetch(`http://localhost:5000/animal-types/${type}`);
      if (!typeRes.ok) throw new Error(`Animal type not found: ${typeRes.status}`);
      const typeData = await typeRes.json();
      setAnimalType(typeData);

      const initialEditData = {};
      const basicInfoCategory = typeData.categories.find(cat => cat.name === "Basic Info");
      if (basicInfoCategory) {
        basicInfoCategory.fields.forEach(field => initialEditData[field.name] = "");
      }
      setEditData(initialEditData);

      const animalsRes = await fetch(`http://localhost:5000/animals?type=${typeData._id}`);
      if (!animalsRes.ok) throw new Error("Failed to fetch animals");
      setAnimals(await animalsRes.json() || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [type]);

  // ------------------- POPUP -------------------
  const showPopup = (message, success = true, type = "save") => {
    setPopup({ show: true, message, success, type });
    if (type === "save") {
      setTimeout(() => setPopup({ ...popup, show: false }), 2500);
    }
  };

  const handleDelete = (id) => {
    setPopup({
      show: true,
      message: "Are you sure you want to delete this animal?",
      success: false,
      type: "delete",
      confirmAction: async () => {
        try {
          const res = await fetch(`http://localhost:5000/animals/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete animal");
          fetchData();
          showPopup("Animal deleted successfully!", true, "save");
        } catch (err) {
          showPopup(err.message, false, "error");
        }
      }
    });
  };

  const handleEdit = (animal) => {
    setEditId(animal._id);
    const editValues = {};
    Object.keys(editData).forEach(key => {
      editValues[key] = animal.data[key] || "";
    });
    setEditData(editValues);
  };

  const handleUpdate = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/animals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: editData, updatedAt: Date.now() }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to update animal");
      }
      const updatedAnimal = await res.json();
      setAnimals(prev => prev.map(a => a._id === id ? updatedAnimal : a));
      setEditId(null);
      showPopup("Animal updated successfully!", true, "save");
    } catch (err) {
      showPopup(err.message, false, "error");
    }
  };

  // ------------------- LOADING -------------------
  if (loading) return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={type} />
      <div className={`main-content-wrapper ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <TopNavbar onMenuClick={handleMenuClick} />
        <div className="loader-overlay">
          <div className="loader-scene">
            <div className="loader"></div>
            <p>Loading {type} data...</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={type} />
      <div className={`main-content-wrapper ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <TopNavbar onMenuClick={handleMenuClick} />
        <div className="error-container">
          <h2>Error Loading {type}</h2>
          <p className="error-message">{error}</p>
          <button className={`btn-retry ${darkMode ? "dark" : ""}`} onClick={fetchData}>Retry</button>
          <button className={`btn-back ${darkMode ? "dark" : ""}`} onClick={() => navigate('/AnimalManagement')}>Back</button>
        </div>
      </div>
    </div>
  );

  if (!animalType) return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={type} />
      <div className={`main-content-wrapper ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <TopNavbar onMenuClick={handleMenuClick} />
        <div className="error-container">
          <h2>Animal Type Not Found</h2>
          <p>The animal type "{type}" could not be loaded.</p>
          <button className={`btn-back ${darkMode ? "dark" : ""}`} onClick={() => navigate('/AnimalManagement')}>Back</button>
        </div>
      </div>
    </div>
  );

  const basicInfoFields = [];
  const basicInfoCategory = animalType.categories?.find(cat => cat.name === "Basic Info");
  if (basicInfoCategory) basicInfoCategory.fields?.forEach(field => basicInfoFields.push({ name: field.name, label: field.label }));

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={type} />
      <div className={`main-content-wrapper ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <TopNavbar onMenuClick={handleMenuClick} />

        <main className="animal-list-page">
          <div className="header">
            <h2>{animalType.name} List</h2>
            <button className={`btn-add ${darkMode ? "dark" : ""}`} onClick={() => navigate(`/add-animal/${animalType._id}`)}>
              ➕ Add New {animalType.name}
            </button>
          </div>

          <div className="table-responsive">
            <table className={`animal-table ${darkMode ? "dark" : ""}`}>
              <thead>
                <tr>
                  <th>QR Code</th>
                  {basicInfoFields.map((field, idx) => <th key={idx}>{field.label}</th>)}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {animals.length === 0 ? (
                  <tr><td colSpan={basicInfoFields.length + 2} className="no-data">No {animalType.name} found.</td></tr>
                ) : (
                  animals.map(animal => (
                    <tr key={animal._id}>
                      <td style={{ textAlign: "center" }}>
                        {animal.qrCode ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <QRCodeCanvas value={animal.qrCode} size={80} level="H" />
                            <span style={{ marginTop: "4px", fontSize: "0.8rem" }}>{animal.animalId || "-"}</span>
                          </div>
                        ) : <span>-</span>}
                      </td>
                      {basicInfoFields.map((field, idx) => (
                        <td key={idx}>
                          {editId === animal._id ? (
                            <input
                              type={field.name.includes('date') ? 'date' : 'text'}
                              value={editData[field.name] || ''}
                              onChange={(e) => setEditData({ ...editData, [field.name]: e.target.value })}
                              className={darkMode ? "dark" : ""}
                            />
                          ) : (animal.data[field.name] || "-")}
                        </td>
                      ))}
                      <td>
                        {editId === animal._id ? (
                          <>
                            <button className={`btn-listsave ${darkMode ? "dark" : ""}`} onClick={() => handleUpdate(animal._id)}>💾 Save</button>
                            <button className={`btn-listcancel ${darkMode ? "dark" : ""}`} onClick={() => setEditId(null)}>✖ Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className={`btn-listedit ${darkMode ? "dark" : ""}`} onClick={() => handleEdit(animal)}>✏ Edit</button>
                            <button className={`btn-listdelete ${darkMode ? "dark" : ""}`} onClick={() => handleDelete(animal._id)}>🗑 Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* ✅ Animated Popup */}
      {popup.show && (
        <div className="popup-overlay">
          <div className={`popup-box ${popup.success ? "success" : "error"} ${popup.type === "delete" ? "delete-popup" : ""}`}>
            <p>{popup.message}</p>
            {popup.type === "delete" && (
              <div className="popup-actions">
                <button className="btn-confirm" onClick={() => {
                  popup.confirmAction?.();
                  setPopup({ ...popup, show: false });
                }}>Yes</button>
                <button className="btn-cancel" onClick={() => setPopup({ ...popup, show: false })}>No</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
