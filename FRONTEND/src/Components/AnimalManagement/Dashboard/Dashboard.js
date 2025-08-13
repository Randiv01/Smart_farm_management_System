import React, { useState } from "react";
import TopNavbar from '../TopNavbar/TopNavbar.js';
import Sidebar from '../Sidebar/Sidebar.js';  // <-- New Sidebar import
import { Line, Bar } from "react-chartjs-2";
import { Link } from "react-router-dom";
import { useTheme } from '../contexts/ThemeContext.js';
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
import {
  Home,
  FileText,
  Settings,
  Activity,
  Calendar,
  HeartPulse,
  BarChart2,
  Plus,
  Bell,
  UserCheck
} from "lucide-react";
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
  const { theme } = useTheme();           // <-- get current theme
  const darkMode = theme === 'dark';       // <-- boolean for convenience
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const productivityData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Milk (L)",
        data: [120, 130, 100, 140, 150, 160, 140],
        borderColor: "#2e7d32",
        backgroundColor: "#2e7d32",
        tension: 0.3
      },
      {
        label: "Eggs (units)",
        data: [250, 240, 270, 280, 290, 340, 320],
        borderColor: "#f57c00",
        backgroundColor: "#f57c00",
        tension: 0.3
      },
      {
        label: "Meat (kg)",
        data: [60, 62, 50, 70, 45, 75, 65],
        borderColor: "#6d4c41",
        backgroundColor: "#6d4c41",
        tension: 0.3
      }
    ]
  };

  const healthData = {
    labels: ["Healthy", "Monitoring", "Treatment", "Recovery"],
    datasets: [
      {
        label: "Number of Animals",
        data: [150, 20, 5, 10],
        backgroundColor: "#2e7d32"
      }
    ]
  };

  const animalTypes = [
    { id: 1, name: "Cows", total: 20, image: "/images/cow.jpg" },
    { id: 2, name: "Goats", total: 12, image: "/images/goat.jpg" },
    { id: 3, name: "Chickens", total: 200, image: "/images/chicken.jpg" },
    { id: 4, name: "Pigs", total: 30, image: "/images/pig.jpg" },
    { id: 5, name: "Buffalo", total: 10, image: "/images/buffalo.jpg" }
  ];

  const totalAnimals = 3;
  const totalAnimalTypes = animalTypes.length;
  const totalCaretakers = 2;

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={null} /> {/* Sidebar here */}

   <TopNavbar onMenuClick={handleMenuClick} /> 

      <main className="main-content">
        <section className={`farm-overview ${darkMode ? "dark" : ""}`}>
          <div className="overview-header">
            <h4>Current Animals in the Farm</h4>
            <hr />
            <br />
            <button
              className="btn-add-animal-type"
              onClick={() => alert("Add New Animal Type clicked!")}
            >
              Add New Animal Type
            </button>
          </div>

          <div className="animal-cards">
            {animalTypes.map((animal) => (
              <div className={`animal-card ${darkMode ? "dark" : ""}`} key={animal.id}>
                <img src={animal.image} alt={animal.name} />
                <div className="animal-info">
                  <h5>{animal.name}</h5>
                  <p>Total Animals: {animal.total}</p>
                </div>
                <div className="animal-card-footer">
                  <Link to={`/AnimalManagement/${animal.name.toLowerCase()}`}>
                    <button className="btn-view-details">View Details</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className={`summary-row ${darkMode ? "dark" : ""}`}>
            <div className="summary-item">
              <strong>Total Animals</strong>
              <span>{totalAnimals}</span>
            </div>
            <div className="summary-item">
              <strong>Animal Types</strong>
              <span>{totalAnimalTypes}</span>
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
            <Line data={productivityData} />
          </div>
          <div className={`chart ${darkMode ? "dark" : ""}`}>
            <h4>Animal Health Status Summary</h4>
            <Bar data={healthData} />
          </div>
        </section>
      </main>
    </div>
  );
}
