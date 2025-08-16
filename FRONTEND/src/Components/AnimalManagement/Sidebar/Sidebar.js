import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Plus,
  Calendar,
  HeartPulse,
  Activity,
  BarChart2,
  Bell,
  Settings,
  UserCheck
} from "lucide-react";

import "./Sidebar.css";

export default function Sidebar({ darkMode, sidebarOpen, type }) {
  const navigate = useNavigate();

  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : "closed"} ${darkMode ? "dark" : ""}`}>
      
      {/* Farm Logo & Name */}
      <div className="sidebar-brand">
        <img
          src="/logo192.png"
          alt="Farm Logo"
          className="sidebar-logo"
        />
        <div className="sidebar-title-container">
          <span className="sidebar-title">Mount Olive Farm House</span>
          <hr className="sidebar-title-underline" />
        </div>
      </div>

      <nav>
        <ul>
          <li onClick={() => navigate("/AnimalManagement")}>
            <Home size={20} className="mr-2" />
            <span>Overview</span>
          </li>
          <li onClick={() => navigate("/feed-stock")}>
            <BarChart2 size={20} className="icon" />
            <span>FeedStock</span>
          </li>
          <li onClick={() => navigate(`/feeding-scheduler`)}>
            <Calendar size={20} className="icon" />
            <span>Feeding Schedule</span>
          </li>
          <li onClick={() => navigate('/animal-health')}>
            <HeartPulse size={20} className="icon" />
            <span>Health</span>
          </li>
          <li>
            <Activity size={20} className="icon" />
            <span>Productivity</span>
          </li>
          <li onClick={() => navigate(`/AnimalManagement/design-plan/${type}`)}>
            <Plus size={20} className="icon" />
            <span>Design your Plan</span>
          </li>
          <li>
            <UserCheck size={20} className="icon" />
            <span>Caretaker</span>
          </li>
          <li>
            <Bell size={20} className="icon" />
            <span>Alerts</span>
          </li>
          <li>
            <Settings size={20} className="icon" />
            <span>Settings</span>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
