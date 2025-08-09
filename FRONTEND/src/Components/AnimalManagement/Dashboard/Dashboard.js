// Dashboard.js
import React, { useState } from "react";
import { Line, Bar } from "react-chartjs-2";
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
  Download,
  Moon,
  Sun,
  Globe,
  Bell,
  UserCheckIcon
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
  const [darkMode, setDarkMode] = useState(false);

  // Sample data for productivity and health charts
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

  // Sample animal types data for cards
  const animalTypes = [
  {
    id: 1,
    name: "Cows",
    total: 1,
    image: "/images/cow.jpg" // assuming cows.jpg is also in public/images
  },
  {
    id: 2,
    name: "Goats",
    total: 1,
    image: "/images/goat.jpg"
  },
  {
    id: 3,
    name: "Chickens",
    total: 1,
    image: "/images/chicken.jpg"
  },
  {
    id: 4,
    name: "Pigs",
    total: 120,
    image: "/images/pig.jpg"
  },
  {
    id: 5,
    name: "Bees",
    total: 1000,
    image: "/images/bees.jpg"  // <-- here!
  }
];

  // Summary data
  const totalAnimals = 3;
  const totalAnimalTypes = animalTypes.length;
  const totalCaretakers = 2;

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">Farm Manager</h2>
        <nav>
          <ul>
            <li className="active"><Home size={30} /> Overview</li>
            <li><Plus size={30} /> Register Animals</li>
            <li><FileText size={30} /> Animal List</li>
            <li><Calendar size={30} /> Feeding Schedule</li>
            <li><HeartPulse size={30} /> Health</li>
            <li><Activity size={30} /> Productivity</li>
            <li><BarChart2 size={30} /> Reports</li>
            <li><Bell size={30} /> Alerts</li>
            <li><UserCheckIcon size={30} /> Caretaker</li>
            <li><Settings size={30} /> Settings</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="topbar">
          <h3>Farm Management Dashboard</h3>
          <div className="topbar-right">
            <button
              className="dark-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <select className="language-select" title="Select Language" defaultValue="English">
              <option>English</option>
              <option>සිංහල</option>
              <option>Tamil</option>
            </select>
            <div className="profile">
              <img src="https://i.pravatar.cc/40" alt="Profile" />
              <div className="profile-info">
                <strong>John Doe</strong>
                <span>Farm Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Farm Overview Section */}
        <section className="farm-overview">
          <div className="overview-header">
            <h4>Farm Overview</h4>
            <button className="btn-add-animal-type">
              <Plus size={16} /> Add New Animal Type
            </button>
          </div>

          {/* Animal Types Cards */}
          <div className="animal-cards">
            {animalTypes.map((animal) => (
              <div className="animal-card" key={animal.id}>
                <img src={animal.image} alt={animal.name} />
                <div className="animal-info">
                  <h5>{animal.name}</h5>
                  <p>Total Animals: {animal.total}</p>
                </div>
                <div className="animal-card-footer">
                  <button className="btn-view-details">View Details</button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary row */}
          <div className="summary-row">
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

        {/* Charts */}
        <section className="charts">
          <div className="chart">
            <h4>Weekly Productivity</h4>
            <Line data={productivityData} />
          </div>
          <div className="chart">
            <h4>Animal Health Status</h4>
            <Bar data={healthData} />
          </div>
        </section>
      </main>
    </div>
  );
}
