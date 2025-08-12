// Sidebar.js
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Plus,
  FileText,
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
      <nav>
        <ul>
          <li onClick={() => navigate("/AnimalManagement")}>
            <Home size={20} className="mr-2" />
            <span>Overview</span>
          </li>
          <li onClick={() => navigate(`/AnimalManagement/design-plan/${type}`)}>
            <Plus size={20} className="icon" />
            <span>Design your Plan</span>
          </li>
          <li onClick={() => navigate(`/animal-list/${type}`)}>
            <FileText size={20} className="icon" />
            <span>Animal List</span>
          </li>
          <li>
            <Calendar size={20} className="icon" />
            <span>Feeding Schedule</span>
          </li>
          <li>
            <HeartPulse size={20} className="icon" />
            <span>Health</span>
          </li>
          <li>
            <Activity size={20} className="icon" />
            <span>Productivity</span>
          </li>
          <li>
            <BarChart2 size={20} className="icon" />
            <span>Reports</span>
          </li>
          <li>
            <Bell size={20} className="icon" />
            <span>Alerts</span>
          </li>
          <li>
            <UserCheck size={20} className="icon" />
            <span>Caretaker</span>
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
