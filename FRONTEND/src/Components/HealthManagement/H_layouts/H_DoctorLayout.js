// Components/HealthManagement/H_layouts/H_DoctorLayout.js
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import DoctorNavBar from "../DoctorPart/DoctorNavBar.js";
import DoctorTopNavBar from "../DoctorPart/DoctorTopNavBar.js";

const SIDEBAR_COLLAPSED_WIDTH = 80;   // px, w-20
const SIDEBAR_EXPANDED_WIDTH = 256;   // px, w-64
const TOPBAR_HEIGHT = 64;             // px, h-16

const DoctorLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <DoctorNavBar isCollapsed={isCollapsed} />

      {/* Fixed Top Navbar */}
      <DoctorTopNavBar
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

export default DoctorLayout;