import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import NavBar from "../NavBar/NavBar.js";
import H_TopNavbar from "../H_TopNavbar/H_TopNavbar.js";

const SIDEBAR_COLLAPSED_WIDTH = 80;   // px, matches w-20
const SIDEBAR_EXPANDED_WIDTH = 256;   // px, matches w-64
const TOPBAR_HEIGHT = 64;             // px, matches h-16

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <NavBar isCollapsed={isCollapsed} />

      {/* Fixed Top Navbar */}
      <H_TopNavbar
        isCollapsed={isCollapsed}
        onMenuClick={() => setIsCollapsed((prev) => !prev)}
      />

      {/* Content area offset by sidebar width + topbar height */}
      <main
        className="p-6"
        style={{
          marginLeft: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
          marginTop: TOPBAR_HEIGHT,
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;