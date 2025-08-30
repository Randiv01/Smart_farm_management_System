// Components/HealthManagement/DoctorPart/DoctorNavBar.js
import React from "react";
import { Link, useLocation } from "react-router-dom";

// Image imports (DoctorPart/DoctorImages)
import logoFram from "./DoctorImages/logoFram.png";
import iconAnimal from "./DoctorImages/animal.png";
import iconMedicine from "./DoctorImages/medicine.png";
import iconProfile from "./DoctorImages/doctor.png";
import iconMedicineCom from "./DoctorImages/medicineCom.png";
import iconHome from "./DoctorImages/Home.png";
import iconHelp from "./DoctorImages/profile.png";

const DoctorNavBar = ({ isCollapsed = false }) => {
  const location = useLocation();

  const navItems = [
    { label: "Home", to: "/doctor/home", icon: iconHome },
    { label: "Animals", to: "/doctor/animals", icon: iconAnimal },
    { label: "Medicine Stock", to: "/doctor/medicine-stock", icon: iconMedicine },
    { label: "Pharmacy", to: "/doctor/pharmacy", icon: iconMedicineCom },
    { label: "Vet Specialist", to: "/doctor/vet-specialist", icon: iconProfile },
    { label: "Treatment Details", to: "/doctor/treatment-details", icon: iconMedicineCom },
    { label: "Profile", to: "/doctor/help", icon: iconHelp },
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
          <img src={logoFram} alt="Mount Olive Logo" className="w-12 h-12 mb-2" />
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

export default DoctorNavBar;