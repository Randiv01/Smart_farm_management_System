import React from "react";
import { Link, useLocation } from "react-router-dom";

import Logo from "./logoFram.png";
import HomeIcon from "./Home.png";
import FertiliserIcon from "./stock.png";
import DetailsIcon from "./details.png";
import HelpIcon from "./help.png";
import ProfileIcon from "./profile.png";

const PlantPathologistNavBar = ({ isCollapsed = false }) => {
  const location = useLocation();

  const navItems = [
    { to: "/plant-pathologist/home", label: "Home", icon: HomeIcon },
    { to: "/plant-pathologist/fertiliser-stock", label: "Fertiliser Stock", icon: FertiliserIcon },
    { to: "/plant-pathologist/fertiliser-details", label: "Fertiliser Details", icon: DetailsIcon },
    { to: "/plant-pathologist/help", label: "Additional Help", icon: HelpIcon },
    { to: "/plant-pathologist/profile", label: "Profile", icon: ProfileIcon },
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav
      className={`bg-green-800 min-h-screen flex flex-col justify-between fixed top-0 left-0 transition-all duration-300 shadow-lg z-40
      ${isCollapsed ? "w-20" : "w-64"}`}
    >
      {/* Logo + Title */}
      <div>
        <div className="flex flex-col items-center mt-4 mb-6">
          <img src={Logo} alt="Logo" className="w-12 h-12 mb-2" />
          {!isCollapsed && (
            <>
              <h1 className="text-lg font-bold text-white">Mount Olive</h1>
              <p className="text-xs text-white">Farm House</p>
            </>
          )}
        </div>

        {/* Nav Items */}
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex items-center py-2 px-4 rounded-md transition-colors ${
                  isActive(item.to)
                    ? "bg-green-600 text-white"
                    : "text-white hover:bg-green-700 hover:text-green-100"
                }`}
              >
                <img src={item.icon} alt={item.label} className="w-6 h-6" />
                {!isCollapsed && <span className="ml-3">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[10px] text-green-200 mb-4 px-2">
        {!isCollapsed ? (
          <>
            <p>Mount Olive Farm House v1.0</p>
            <p>© 2025 Mount Olive HealthAdmin</p>
          </>
        ) : (
          <p className="text-[9px]">v1.0</p>
        )}
      </div>
    </nav>
  );
};

export default PlantPathologistNavBar;