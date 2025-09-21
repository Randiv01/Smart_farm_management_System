import React, { useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  User,
  Users,
  Building,
  Leaf,
  Pill,
  Stethoscope,
  CreditCard,
  Factory,
  Boxes,
  FlaskConical,
} from "lucide-react";
import { ThemeContext } from "../H_contexts/H_ThemeContext.js";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const ADMIN_BASE = "/admin";

  const { darkMode, sidebarOpen, toggleSidebar } = useContext(ThemeContext);

  const navItems = [
    { path: `${ADMIN_BASE}/dashboard`, icon: Home, label: "Overview", exact: true },
    { path: `${ADMIN_BASE}/doctor-details`, icon: User, label: "Doctor Details" },
    { path: `${ADMIN_BASE}/specialist-details`, icon: Users, label: "Specialist Details" },
    { path: `${ADMIN_BASE}/medicine-company`, icon: Building, label: "Medicine Company" },
    { path: `${ADMIN_BASE}/plant-pathologist`, icon: Leaf, label: "Plant Pathologist" },

    // New Fertiliser items
    { path: `${ADMIN_BASE}/fertiliser-companies`, icon: Factory, label: "Fertiliser Companies" },
    { path: `${ADMIN_BASE}/fertiliser-stock`, icon: Boxes, label: "Fertiliser Stock" },
    { path: `${ADMIN_BASE}/fertiliser-details`, icon: FlaskConical, label: "Fertiliser Details" },

    { path: `${ADMIN_BASE}/medistore`, icon: Pill, label: "Medicine Store" },
    { path: `${ADMIN_BASE}/treatments-details`, icon: Stethoscope, label: "Treatments Details" },
    { path: `${ADMIN_BASE}/treatments-payments`, icon: CreditCard, label: "Treatments Payments" },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        toggleSidebar(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarOpen, toggleSidebar]);

  const isActive = (itemPath, exact = false) => {
    if (exact) return location.pathname === itemPath;
    return (
      location.pathname.startsWith(itemPath) &&
      location.pathname !== `${ADMIN_BASE}/dashboard`
    );
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => toggleSidebar(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-in-out
          ${darkMode ? "bg-green-900" : "bg-green-700"} text-white flex flex-col shadow-lg overflow-hidden
          ${sidebarOpen ? "w-64" : "w-0"} 
          ${sidebarOpen ? "lg:w-64" : "lg:w-20"}
        `}
      >
        {/* Logo */}
        <div
          className="flex flex-col items-center py-4 px-2 border-b border-white/20 cursor-pointer"
          onClick={() => navigate(`${ADMIN_BASE}/dashboard`)}
        >
          <img
            src="/logo192.png"
            alt="Farm Logo"
            className={`transition-all duration-300 ${sidebarOpen ? "w-14 h-14" : "w-12 h-12"} rounded-lg object-contain`}
          />
          {sidebarOpen && (
            <div className="mt-2 text-center hidden lg:block">
              <h1 className="text-lg font-bold whitespace-nowrap">Mount Olive</h1>
              <p className="text-xs opacity-80 whitespace-nowrap">Farm House</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    if (window.innerWidth < 1024) toggleSidebar(false);
                  }}
                  className={`
                    flex items-center w-full p-3 rounded-lg transition-all
                    hover:bg-green-800 hover:shadow-sm
                    ${isActive(item.path, item.exact) ? "bg-green-800 font-medium" : ""}
                    ${sidebarOpen ? "justify-start px-4" : "justify-center"}
                    focus:outline-none focus:ring-1 focus:ring-white/50
                  `}
                >
                  <item.icon size={20} className={`flex-shrink-0 ${sidebarOpen ? "mr-3" : ""} text-white`} />
                  {sidebarOpen && (
                    <span className="text-sm whitespace-nowrap overflow-hidden overflow-ellipsis">
                      {item.label}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-white/20 flex flex-col items-center justify-center text-center text-white/80 text-xs space-y-1">
            <span className="font-bold text-sm text-white">Mount Olive</span>
            <span className="text-white/70 text-xs">Farm House v1.0</span>
            <span className="text-white/50 text-xs">© 2025 Mount Olive HealthAdmin</span>
          </div>
        )}
      </aside>
    </>
  );
}