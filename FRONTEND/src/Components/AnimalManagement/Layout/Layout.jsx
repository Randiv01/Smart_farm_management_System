import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar";
import Sidebar from "../Sidebar/Sidebar";
import { useTheme } from "../contexts/ThemeContext";
import { NotificationProvider } from "../contexts/NotificationContext";

export default function Layout() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <NotificationProvider>
      <div className={`flex flex-col h-screen ${darkMode ? "bg-gray-900" : "bg-light-beige"}`}>
        <TopNavbar onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
        <div className="flex flex-1 overflow-hidden pt-16">
          <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} type="default" />
          <main className={`flex-1 overflow-y-auto p-4 transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"} ${darkMode ? "bg-gray-900" : "bg-light-beige"}`}>
            <Outlet /> {/* This renders the child route */}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
