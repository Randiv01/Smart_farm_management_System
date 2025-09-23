// FRONTEND/src/Components/EmployeeManagement/pages/E-Dashboard.js
import React, { useState, useEffect } from "react";
import {
  Users,
  ClipboardCheck,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Settings,
  FileDown,
} from "lucide-react";

// ✅ Use default imports for charts
import { EmployeeChart } from "../charts/E-EmployeeChart.js";
import { AttendanceChart } from "../charts/E-AttendanceChart.js";
import Loader from "../Loader/Loader.js"; // Import the Loader component

export const Dashboard = ({ setActiveModule, darkMode }) => {
  const [showLoader, setShowLoader] = useState(true); // Loader state

  const modules = [
    { id: "staff", name: "Staff Hub", icon: <Users size={24} />, count: 48, change: "+2" },
    { id: "attendance", name: "Attendance Tracker", icon: <ClipboardCheck size={24} />, count: 42, change: "-3" },
    { id: "leave", name: "Leave Planner", icon: <Calendar size={24} />, count: 6, change: "+1" },
    { id: "overtime", name: "Overtime Monitor", icon: <Clock size={24} />, count: 15, change: "+5" },
    { id: "salary", name: "Salary Desk", icon: <DollarSign size={24} />, count: 48, change: "0" },
    { id: "reports", name: "Employee Report Center", icon: <FileText size={24} /> },
    { id: "settings", name: "System Settings", icon: <Settings size={24} /> },
  ];

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1500); // Show loader for 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  // Show loader while loading
  if (showLoader) {
    return <Loader darkMode={darkMode} />;
  }

  return (
    <div className="min-h-screen bg-light-beige p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-dark-green">Employee Management Dashboard</h2>
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-btn transition-colors
            ${darkMode ? "bg-green-600 hover:bg-green-700" : "bg-btn-teal hover:bg-green-600"}`}
        >
          <FileDown size={18} />
          <span>Export Reports</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="p-6 bg-white rounded-2xl shadow-card">
          <h4 className="text-gray-500">Total Employees</h4>
          <p className="text-3xl font-bold mt-2">48</p>
          <span className="text-green-600 text-sm">+4%</span>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-card">
          <h4 className="text-gray-500">Present Today</h4>
          <p className="text-3xl font-bold mt-2">42</p>
          <span className="text-red-500 text-sm">-6%</span>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-card">
          <h4 className="text-gray-500">On Leave</h4>
          <p className="text-3xl font-bold mt-2">6</p>
          <span className="text-orange-500 text-sm">+2</span>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-card">
          <h4 className="text-gray-500">Overtime Hours</h4>
          <p className="text-3xl font-bold mt-2">87</p>
          <span className="text-green-600 text-sm">+12</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="p-6 bg-white rounded-2xl shadow-card">
          <h3 className="text-lg font-semibold mb-4 text-dark-green">Employee Status</h3>
          <EmployeeChart darkMode={darkMode} />
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-card">
          <h3 className="text-lg font-semibold mb-4 text-dark-green">Monthly Attendance</h3>
          <AttendanceChart darkMode={darkMode} />
        </div>
      </div>

      {/* Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => setActiveModule(module.id)}
            className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white shadow-card hover:bg-gray-50 transition-transform transform hover:scale-105"
          >
            <div className="p-4 rounded-full bg-orange-100 text-orange-600 mb-4">
              {module.icon}
            </div>
            <h3 className="text-lg font-medium">{module.name}</h3>
            {module.count !== undefined && (
              <p className="mt-2 text-sm text-gray-400">
                {module.count}{" "}
                {module.change && (
                  <span className={module.change.includes("+") ? "text-green-600" : "text-red-500"}>
                    {module.change}
                  </span>
                )}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};