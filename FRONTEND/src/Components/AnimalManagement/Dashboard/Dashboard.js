import React, { useState, useEffect } from "react";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import { Link, useNavigate } from "react-router-dom";
import { Line, Bar } from "react-chartjs-2";
import { useTheme } from "../contexts/ThemeContext.js";
import axios from "axios";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

import "./Dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [animalTypes, setAnimalTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [imageInput, setImageInput] = useState({});

  const [totalAnimals, setTotalAnimals] = useState(0);
  const [totalCaretakers, setTotalCaretakers] = useState(2);

  useEffect(() => {
    document.title = "Animal Dashboard";
    fetchAnimalTypes();
  }, []);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  const fetchAnimalTypes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/animal-types");
      setAnimalTypes(res.data);
      const total = res.data.reduce((sum, type) => sum + (type.total || 0), 0);
      setTotalAnimals(total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (animal) => {
    if (!nameInput || nameInput.trim() === "") return;
    try {
      const res = await axios.put(`http://localhost:5000/animal-types/${animal._id}`, { 
        name: nameInput, 
        categories: JSON.stringify(animal.categories || []) 
      });
      setAnimalTypes(animalTypes.map((a) => (a._id === animal._id ? res.data : a)));
      setEditingId(null);
      setNameInput("");
    } catch (err) {
      console.error(err);
      alert("Rename failed");
    }
  };

  const handleImageChange = (e, animal) => {
    setImageInput({ ...imageInput, [animal._id]: e.target.files[0] });
  };

  const handleImageSubmit = async (animal) => {
    if (!imageInput[animal._id]) return;
    const formData = new FormData();
    formData.append("bannerImage", imageInput[animal._id]);
    try {
      const res = await axios.put(`http://localhost:5000/animal-types/${animal._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setAnimalTypes(animalTypes.map((a) => (a._id === animal._id ? res.data : a)));
      setImageInput({ ...imageInput, [animal._id]: null });
    } catch (err) {
      console.error(err);
      alert("Failed to update image");
    }
  };

  const handleDelete = async (animal) => {
    if (!window.confirm("Are you sure you want to delete this animal type?")) return;
    try {
      await axios.delete(`http://localhost:5000/animal-types/${animal._id}`);
      setAnimalTypes(animalTypes.filter(a => a._id !== animal._id));
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const productivityData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      { 
        label: "Milk (L)", 
        data: [120, 130, 100, 140, 150, 160, 140], 
        borderColor: "#2e7d32", 
        backgroundColor: "rgba(46, 125, 50, 0.1)", 
        tension: 0.3,
        borderWidth: 2
      },
      { 
        label: "Eggs (units)", 
        data: [250, 240, 270, 280, 290, 340, 320], 
        borderColor: "#f57c00", 
        backgroundColor: "rgba(245, 124, 0, 0.1)", 
        tension: 0.3,
        borderWidth: 2
      },
      { 
        label: "Meat (kg)", 
        data: [60, 62, 50, 70, 45, 75, 65], 
        borderColor: "#6d4c41", 
        backgroundColor: "rgba(109, 76, 65, 0.1)", 
        tension: 0.3,
        borderWidth: 2
      }
    ]
  };

  const healthData = {
    labels: ["Healthy", "Monitoring", "Treatment", "Recovery"],
    datasets: [{
      label: "Number of Animals", 
      data: [150, 20, 5, 10], 
      backgroundColor: [
        "rgba(46, 125, 50, 0.8)",
        "rgba(255, 193, 7, 0.8)",
        "rgba(244, 67, 54, 0.8)",
        "rgba(33, 150, 243, 0.8)"
      ],
      borderColor: [
        "rgba(46, 125, 50, 1)",
        "rgba(255, 193, 7, 1)",
        "rgba(244, 67, 54, 1)",
        "rgba(33, 150, 243, 1)"
      ],
      borderWidth: 1
    }]
  };

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={null} />
      <TopNavbar onMenuClick={handleMenuClick} />

      <main className="main-content">
        <section className={`farm-overview ${darkMode ? "dark" : ""}`}>
          <div className="overview-header">
            <h4>Current Animals in the Farm</h4>
            <hr />
            <button className="btn-add-animal-type" onClick={() => navigate("/AnimalManagement/add-animal-type")}>
              <span className="btn-icon">+</span> Add New Animal Type
            </button>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading animal types...</p>
            </div>
          ) : (
            <div className="animal-cards">
              {animalTypes.map((animal) => (
                <div className={`animal-card ${darkMode ? "dark" : ""}`} key={animal._id}>
                  <div className="image-wrapper">
                    <img
                      src={animal.bannerImage ? `http://localhost:5000${animal.bannerImage}` : "/images/default.jpg"}
                      alt={animal.name}
                      onClick={() => document.getElementById(`file-${animal._id}`).click()}
                    />
                    <input
                      type="file"
                      id={`file-${animal._id}`}
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, animal)}
                    />
                    {imageInput[animal._id] && (
                      <button className="btn-upload" onClick={() => handleImageSubmit(animal)}>
                        <span className="btn-icon">↑</span> Upload
                      </button>
                    )}
                  </div>

                  <div className="animal-info">
                    {editingId === animal._id ? (
                      <div className="edit-container">
                        <input 
                          value={nameInput} 
                          onChange={(e) => setNameInput(e.target.value)} 
                          className="inline-input" 
                          autoFocus
                        />
                        <div className="edit-buttons">
                          <button className="btn-save" onClick={() => handleRename(animal)}>
                            <span className="btn-icon">✓</span>
                          </button>
                          <button className="btn-cancel" onClick={() => setEditingId(null)}>
                            <span className="btn-icon">×</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="name-container">
                        <h5>{animal.name}</h5>
                        <button 
                          className="btn-edit" 
                          onClick={() => { 
                            setEditingId(animal._id); 
                            setNameInput(animal.name); 
                          }}
                        >
                          <span className="btn-icon">✎</span>
                        </button>
                      </div>
                    )}
                    <p>Total Animals: {animal.total}</p>
                  </div>

                  <div className="animal-card-footer">
                    <Link to={`/AnimalManagement/${animal.name.toLowerCase()}`}>
                      <button className="btn-view-details">
                        <span className="btn-icon">→</span> View Details
                      </button>
                    </Link>
                    <button className="btn-delete" onClick={() => handleDelete(animal)}>
                      <span className="btn-icon">🗑</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={`summary-row ${darkMode ? "dark" : ""}`}>
            <div className="summary-item">
              <strong>Total Animals</strong>
              <span>{totalAnimals}</span>
            </div>
            <div className="summary-item">
              <strong>Animal Types</strong>
              <span>{animalTypes.length}</span>
            </div>
            <div className="summary-item">
              <strong>Caretakers</strong>
              <span>{totalCaretakers}</span>
            </div>
          </div>
        </section>

        <section className="charts">
          <div className={`chart ${darkMode ? "dark" : ""}`}>
            <h4>Weekly Productivity Overview</h4>
            <div className="chart-container">
              <Line 
                data={productivityData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        color: darkMode ? '#f9fafb' : '#1f2937',
                        font: {
                          size: 12
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      },
                      ticks: {
                        color: darkMode ? '#f9fafb' : '#1f2937'
                      }
                    },
                    y: {
                      grid: {
                        color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      },
                      ticks: {
                        color: darkMode ? '#f9fafb' : '#1f2937'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className={`chart ${darkMode ? "dark" : ""}`}>
            <h4>Animal Health Status Summary</h4>
            <div className="chart-container">
              <Bar 
                data={healthData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                      labels: {
                        color: darkMode ? '#f9fafb' : '#1f2937'
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      },
                      ticks: {
                        color: darkMode ? '#f9fafb' : '#1f2937'
                      }
                    },
                    y: {
                      grid: {
                        color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      },
                      ticks: {
                        color: darkMode ? '#f9fafb' : '#1f2937'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}