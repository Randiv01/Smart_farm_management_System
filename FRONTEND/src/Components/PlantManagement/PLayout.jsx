// PLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import PSidebar from "./P-Sidebar.jsx";
import PTopNavbar from "./PTopNavbar.jsx";

const PLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="bg-white text-black min-h-screen flex dark:bg-gray-900 dark:text-white">
      {/* Sidebar */}
      <P-Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
        {/* Top Navbar */}
        <PTopNavbar sidebarOpen={sidebarOpen} onMenuClick={toggleSidebar} />

        {/* Main outlet */}
        <main className="flex-1 p-4 mt-16 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PLayout;
