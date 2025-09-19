import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Settings,
} from "lucide-react";

export const Sidebar = ({ darkMode }) => {
  const modules = [
    { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "" },
    { id: "staff", name: "Staff Hub", icon: <Users size={20} />, path: "staff" },
    { id: "attendance", name: "Attendance Tracker", icon: <ClipboardCheck size={20} />, path: "attendance" },
    { id: "leave", name: "Leave Planner", icon: <Calendar size={20} />, path: "leave" },
    { id: "overtime", name: "Overtime Monitor", icon: <Clock size={20} />, path: "overtime" },
    { id: "salary", name: "Salary Desk", icon: <DollarSign size={20} />, path: "salary" },
    { id: "reports", name: "Employee Report Center", icon: <FileText size={20} />, path: "reports" },
    { id: "settings", name: "System Settings", icon: <Settings size={20} />, path: "settings" },
  ];

  return (
    <aside
      className={`hidden md:block w-64 ${
        darkMode ? "bg-dark-card text-dark-text" : "bg-soft-white border-r border-gray-200 text-black"
      }`}
    >
      {modules.map((module) => (
        <NavLink
          key={module.id}
          to={module.path}
          end={module.id === "dashboard"}
          className={({ isActive }) =>
            `flex items-center gap-3 w-full p-4 transition-colors cursor-pointer font-medium rounded-lg 
            ${
              isActive
                ? darkMode
                  ? "bg-dark-gray text-btn-yellow"
                  : "bg-gray-100 text-btn-red"
                : darkMode
                ? "hover:bg-dark-gray"
                : "hover:bg-gray-100"
            }`
          }
        >
          <span>{module.icon}</span>
          <span>{module.name}</span>
        </NavLink>
      ))}
    </aside>
  );
};