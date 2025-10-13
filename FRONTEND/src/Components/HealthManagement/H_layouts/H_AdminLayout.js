import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "../Sidebar/Sidebar.js";
import H_TopNavbar from "../H_TopNavbar/H_TopNavbar.js";
import { useTheme } from '../H_contexts/H_ThemeContext.js';

const SIDEBAR_COLLAPSED_WIDTH = 80;   // px, matches w-20
const SIDEBAR_EXPANDED_WIDTH = 256;   // px, matches w-64
const TOPBAR_HEIGHT = 64;             // px, matches h-16

const AdminLayout = () => {
  // Use the theme context for sidebar and dark mode state
  const { darkMode, toggleTheme, sidebarOpen, toggleSidebar } = useTheme();

  return (
    <div className={`min-h-screen ${darkMode ? "bg-slate-900" : "bg-light-beige"}`}>
      {/* Fixed Sidebar */}
      <NavBar 
        sidebarOpen={sidebarOpen}  // Changed from isCollapsed to sidebarOpen
        darkMode={darkMode}
        toggleSidebar={toggleSidebar}  // Added toggleSidebar prop
      />

      {/* Fixed Top Navbar */}
      <H_TopNavbar
        sidebarOpen={sidebarOpen}  // Changed from isCollapsed to sidebarOpen
        onMenuClick={toggleSidebar}
        darkMode={darkMode}
        toggleTheme={toggleTheme}
      />

      {/* Content area offset by sidebar width + topbar height */}
      <main
        className="p-6 transition-all duration-300"
        style={{
          marginLeft: sidebarOpen ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
          marginTop: TOPBAR_HEIGHT,
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;