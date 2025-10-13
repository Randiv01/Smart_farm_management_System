// FRONTEND/src/Components/EmployeeManagement/pages/E-Dashboard.js
import React, { useState, useEffect } from "react";
import {
  RefreshCw,
} from "lucide-react";

// ✅ Use default imports for charts
import { EmployeeChart } from "../charts/E-EmployeeChart.js";
import { AttendanceChart } from "../charts/E-AttendanceChart.js";
import { DepartmentChart } from "../charts/E-DepartmentChart.js";
import { MonthlyAttendanceChart } from "../charts/E-MonthlyAttendanceChart.js";
import { LeaveAnalyticsChart } from "../charts/E-LeaveAnalyticsChart.js";
import { OvertimeAnalyticsChart } from "../charts/E-OvertimeAnalyticsChart.js";
import Loader from "../Loader/Loader.js";
import { useETheme } from '../Econtexts/EThemeContext.jsx'; // Import the Loader component

export const Dashboard = () => {
  const { theme } = useETheme();
  const darkMode = theme === 'dark';
  const [showLoader, setShowLoader] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalEmployees: { value: 0, change: "0%", label: "Total Employees" },
      presentToday: { value: 0, change: "0%", label: "Present Today" },
      onLeave: { value: 0, change: "0", label: "On Leave" },
      overtimeHours: { value: 0, change: "0", label: "Overtime Hours" }
    },
    employeeStatus: [],
    weeklyAttendance: [],
    departmentData: [],
    monthlyAttendance: [],
    leaveAnalytics: { byType: [], byMonth: [] },
    overtimeData: { byDepartment: [], totalHours: 0 }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Set browser tab title
  useEffect(() => {
    document.title = "Dashboard - Employee Manager";
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('http://localhost:5000/api/dashboard/summary');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDashboardData(data.data);
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsRefreshing(false);
      setShowLoader(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);


  // Show loader while loading
  if (showLoader) {
    return <Loader darkMode={darkMode} />;
  }

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900' : 'bg-light-beige'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-dark-green'}`}>Employee Management Dashboard</h2>
          {lastUpdated && (
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isRefreshing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-btn transition-colors
            ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"}
            ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{dashboardData.metrics.totalEmployees.label}</h4>
              <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{dashboardData.metrics.totalEmployees.value}</p>
              <span className={`text-sm font-medium ${dashboardData.metrics.totalEmployees.change.includes('+') ? 'text-green-600' : 'text-red-500'}`}>
                {dashboardData.metrics.totalEmployees.change}
              </span>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <RefreshCw className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{dashboardData.metrics.presentToday.label}</h4>
              <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{dashboardData.metrics.presentToday.value}</p>
              <span className={`text-sm font-medium ${dashboardData.metrics.presentToday.change.includes('+') ? 'text-green-600' : 'text-red-500'}`}>
                {dashboardData.metrics.presentToday.change}
              </span>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
              <div className={`w-6 h-6 rounded-full ${darkMode ? 'bg-green-400' : 'bg-green-600'}`}></div>
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{dashboardData.metrics.onLeave.label}</h4>
              <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{dashboardData.metrics.onLeave.value}</p>
              <span className={`text-sm font-medium ${dashboardData.metrics.onLeave.change.includes('+') ? 'text-orange-500' : 'text-gray-500'}`}>
                {dashboardData.metrics.onLeave.change}
              </span>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
              <div className={`w-6 h-6 rounded-full ${darkMode ? 'bg-orange-400' : 'bg-orange-600'}`}></div>
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{dashboardData.metrics.overtimeHours.label}</h4>
              <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{dashboardData.metrics.overtimeHours.value}</p>
              <span className={`text-sm font-medium ${dashboardData.metrics.overtimeHours.change.includes('+') ? 'text-green-600' : 'text-gray-500'}`}>
                {dashboardData.metrics.overtimeHours.change}
              </span>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
              <div className={`w-6 h-6 rounded-full ${darkMode ? 'bg-purple-400' : 'bg-purple-600'}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-dark-green'}`}>
            <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-green-400' : 'bg-green-600'}`}></div>
            Employee Status Distribution
          </h3>
          <EmployeeChart data={dashboardData.employeeStatus} />
        </div>
        
        <div className={`p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-dark-green'}`}>
            <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-blue-600'}`}></div>
            Weekly Attendance Overview
          </h3>
          <AttendanceChart data={dashboardData.weeklyAttendance} />
        </div>
      </div>

      {/* Department & Monthly Attendance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-dark-green'}`}>
            <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-purple-400' : 'bg-purple-600'}`}></div>
            Department Distribution
          </h3>
          <DepartmentChart data={dashboardData.departmentData} />
        </div>
        
        <div className={`p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-dark-green'}`}>
            <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-orange-400' : 'bg-orange-600'}`}></div>
            Monthly Attendance Trend
          </h3>
          <MonthlyAttendanceChart data={dashboardData.monthlyAttendance} />
        </div>
      </div>

      {/* Leave & Overtime Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-dark-green'}`}>
            <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-red-400' : 'bg-red-600'}`}></div>
            Leave Analytics
          </h3>
          <LeaveAnalyticsChart data={dashboardData.leaveAnalytics.byType} />
        </div>
        
        <div className={`p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-dark-green'}`}>
            <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-cyan-400' : 'bg-cyan-600'}`}></div>
            Overtime Analytics
          </h3>
          <OvertimeAnalyticsChart data={dashboardData.overtimeData} />
        </div>
      </div>

    </div>
  );
};