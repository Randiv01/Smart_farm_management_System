import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import { useTheme } from "../contexts/ThemeContext.js";
import { useLoader } from "../contexts/LoaderContext.js"; // <-- imported
import axios from "axios";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import "./AnimalHealth.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AnimalHealth() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { setLoading: setGlobalLoading } = useLoader(); // <-- loader context

  const [animalTypes, setAnimalTypes] = useState([]);
  const [healthStats, setHealthStats] = useState({});

  useEffect(() => {
    document.title = "Animal Health Dashboard";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setGlobalLoading(true); // <-- show global loader
      const typesRes = await axios.get("http://localhost:5000/animal-types");
      const types = typesRes.data;

      const typesWithCounts = await Promise.all(
        types.map(async (type) => {
          const countRes = await axios.get(`http://localhost:5000/animals/count?type=${type._id}`);
          return {
            ...type,
            totalCount: countRes.data.count || 0
          };
        })
      );

      const stats = {
        healthy: typesWithCounts.reduce((sum, type) => sum + (type.healthyCount || 0), 0),
        sick: typesWithCounts.reduce((sum, type) => sum + (type.sickCount || 0), 0),
        inTreatment: typesWithCounts.reduce((sum, type) => sum + (type.inTreatmentCount || 0), 0),
        critical: typesWithCounts.reduce((sum, type) => sum + (type.criticalCount || 0), 0),
        total: typesWithCounts.reduce((sum, type) => sum + type.totalCount, 0)
      };

      setAnimalTypes(typesWithCounts);
      setHealthStats(stats);
    } catch (err) {
      console.error("Failed to fetch health data:", err);
    } finally {
      setGlobalLoading(false); // <-- hide global loader
    }
  };

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  const healthChartData = {
    labels: ["Healthy", "Sick", "In Treatment", "Critical"],
    datasets: [{
      label: "Animals",
      data: [
        healthStats.healthy || 0,
        healthStats.sick || 0,
        healthStats.inTreatment || 0,
        healthStats.critical || 0
      ],
      backgroundColor: [
        "rgba(75, 192, 192, 0.6)",
        "rgba(255, 206, 86, 0.6)",
        "rgba(54, 162, 235, 0.6)",
        "rgba(255, 99, 132, 0.6)"
      ],
      borderColor: [
        "rgba(75, 192, 192, 1)",
        "rgba(255, 206, 86, 1)",
        "rgba(54, 162, 235, 1)",
        "rgba(255, 99, 132, 1)"
      ],
      borderWidth: 1
    }]
  };

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} />
      <div className={`main-content-wrapper ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <TopNavbar onMenuClick={handleMenuClick} />
        
        <main className="health-dashboard">
          <section className="health-summary">
            <h2>Animal Health Overview</h2>

            <section className="animal-types-section">
              <h3>Health by Animal Type</h3>
              
              <div className="animal-type-cards">
                {animalTypes.map(type => (
                  <div 
                    key={type._id} 
                    className={`animal-type-card ${darkMode ? "dark" : ""}`}
                    onClick={() => navigate(`/HealthReport/${type.name.toLowerCase()}`)}
                  >
                    <div className="card-header">
                      <h4>{type.name}</h4>
                      <span className="total-count">{type.totalCount || 0} animals</span>
                    </div>
                    
                    <div className="health-stats">
                      <div className="health-stat">
                        <span className="stat-label">Healthy:</span>
                        <span className="stat-value">{type.healthyCount || 0}</span>
                      </div>
                      <div className="health-stat">
                        <span className="stat-label">Sick:</span>
                        <span className="stat-value">{type.sickCount || 0}</span>
                      </div>
                      <div className="health-stat">
                        <span className="stat-label">Critical:</span>
                        <span className="stat-value">{type.criticalCount || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
              
            <div className="summary-cards">
              <div className={`summary-card ${darkMode ? "dark" : ""}`}>
                <h3>Total Animals</h3>
                <p>{healthStats.total || 0}</p>
              </div>
              <div className={`summary-card ${darkMode ? "dark" : ""}`}>
                <h3>Healthy</h3>
                <p>{healthStats.healthy || 0}</p>
              </div>
              <div className={`summary-card ${darkMode ? "dark" : ""}`}>
                <h3>Needs Attention</h3>
                <p>{healthStats.sick || 0}</p>
              </div>
              <div className={`summary-card ${darkMode ? "dark" : ""}`}>
                <h3>Critical</h3>
                <p>{healthStats.critical || 0}</p>
              </div>
            </div>
          </section>

          <section className="health-charts">
            <div className="chart-container">
              <h3>Health Status Distribution</h3>
              <div className="chart-wrapper">
                <Bar 
                  data={healthChartData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false,
                        labels: {
                          color: darkMode ? '#fff' : '#333'
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { color: darkMode ? '#fff' : '#333' },
                        grid: { color: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                      },
                      x: {
                        ticks: { color: darkMode ? '#fff' : '#333' },
                        grid: { display: false }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
