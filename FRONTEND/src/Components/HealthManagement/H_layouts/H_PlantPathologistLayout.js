import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import PlantPathologistNavBar from "../PlantPathologistPart/PlantPathologistNavBar.js";
import PlantPathologistTopNavBar from "../PlantPathologistPart/PlantPathologistTopNavBar.js";

const SIDEBAR_COLLAPSED_WIDTH = 80;   // w-20
const SIDEBAR_EXPANDED_WIDTH = 256;   // w-64
const TOPBAR_HEIGHT = 64;             // h-16

const PlantPathologistLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <PlantPathologistNavBar isCollapsed={isCollapsed} />
      <PlantPathologistTopNavBar
        isCollapsed={isCollapsed}
        onMenuClick={() => setIsCollapsed((p) => !p)}
      />
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

export default PlantPathologistLayout;