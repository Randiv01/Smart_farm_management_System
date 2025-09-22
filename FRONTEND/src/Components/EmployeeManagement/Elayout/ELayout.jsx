import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useETheme } from '../Econtexts/EThemeContext.jsx';
import ESidebar from "./ESidebar.jsx";
import ETopNavbar from "./ETopNavbar.jsx";

const ELayout = () => {
  const { theme } = useETheme();
  const darkMode = theme === "dark";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={darkMode ? "bg-dark-bg text-dark-text min-h-screen flex" : "bg-light-beige text-gray-900 min-h-screen flex"}>
      <ESidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
        <ETopNavbar sidebarOpen={sidebarOpen} onMenuClick={toggleSidebar} />
        <main className="flex-1 p-4 mt-16 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ELayout;