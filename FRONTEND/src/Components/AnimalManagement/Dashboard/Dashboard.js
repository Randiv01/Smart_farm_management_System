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
  Sun
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

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">Farm Manager</h2>
        <nav>
          <ul>
            <li className="active"><Home size={18}/> Dashboard</li>
            <li><FileText size={18}/> Animal Records</li>
            <li><Calendar size={18}/> Feeding Schedule</li>
            <li><HeartPulse size={18}/> Health Reports</li>
            <li><Activity size={18}/> Productivity</li>
            <li><BarChart2 size={18}/> Reports</li>
            <li><Settings size={18}/> Settings</li>
          </ul>
        </nav>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Header */}
        <header className="topbar">
          <h3>Farm Dashboard</h3>
          <div className="topbar-right">
            <button
              className="dark-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
            </button>
            <button className="btn-add"><Plus size={16}/> Add Animal</button>
            <button className="btn-report"><Download size={16}/> Download Report (PDF)</button>
            <div className="profile">
              <img src="https://i.pravatar.cc/40" alt="Profile"/>
            </div>
          </div>
        </header>

        {/* Cards */}
        <div className="cards">
          <div className="card green">
            <h4>Total Animals</h4>
            <h2>248</h2>
            <p className="positive">+4.6% from last week</p>
          </div>
          <div className="card yellow">
            <h4>Active Feedings Today</h4>
            <h2>12</h2>
            <p className="positive">+2.1% from last week</p>
          </div>
          <div className="card red">
            <h4>Health Alerts</h4>
            <h2>3</h2>
            <p className="negative">1.5% from last week</p>
          </div>
          <div className="card blue">
            <h4>Production Today</h4>
            <h2>320 L / 540 eggs</h2>
            <p className="positive">+8.2% from last week</p>
          </div>
        </div>

        {/* Charts */}
        <div className="charts">
          <div className="chart">
            <h4>Weekly Productivity</h4>
            <Line data={productivityData} />
          </div>
          <div className="chart">
            <h4>Animal Health Status</h4>
            <Bar data={healthData} />
          </div>
        </div>
      </main>
    </div>
  );
}
