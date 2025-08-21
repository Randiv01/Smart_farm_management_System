// ILayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useITheme } from '../Icontexts/IThemeContext.jsx';
import Sidebar from "./ISidebar.jsx"; 
import TopNavbar from "./ITopNavbar.jsx"; 

const ILayout = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={darkMode ? "bg-gray-900 text-white min-h-screen flex" : "bg-white text-black min-h-screen flex"}>
      {/* Sidebar */}
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content area - adjust padding based on sidebar state */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
        {/* Top Navbar */}
        <TopNavbar sidebarOpen={sidebarOpen} onMenuClick={toggleSidebar} />

        {/* Main content - adjust padding to account for fixed navbar */}
        <main className="flex-1 p-4 mt-16 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ILayout;