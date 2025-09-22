// P-Layout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import PSidebar from "./P-Sidebar";
import PTopNavbar from "./PTopNavbar";
import { ThemeProvider } from "./context/ThemeContext";

const PLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <ThemeProvider>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <PSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Main content */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
          {/* Top Navbar */}
          <PTopNavbar sidebarOpen={sidebarOpen} onMenuClick={toggleSidebar} />

          {/* Page Content */}
          <main className="flex-1 p-4 mt-16 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default PLayout;