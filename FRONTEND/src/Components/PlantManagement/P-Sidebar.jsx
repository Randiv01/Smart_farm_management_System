// P-Sidebar.jsx
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Warehouse,
  ClipboardCheck,
  Sprout,
  Bug,
  Gauge,
  TrendingUp,
  Settings,
  Menu,
} from "lucide-react";
import { useTheme } from "./context/ThemeContext";

export default function PSidebar({ sidebarOpen, toggleSidebar }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/PlantManagement", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/PlantManagement/greenhouse", icon: Warehouse, label: "Greenhouse Management" },
    { path: "/PlantManagement/inspection", icon: ClipboardCheck, label: "Inspection Management" },
    { path: "/PlantManagement/fertilizing", icon: Sprout, label: "Fertilizing Management" },
    { path: "/PlantManagement/pest-disease", icon: Bug, label: "Pest & Disease Management" },
    { path: "/PlantManagement/monitor-control", icon: Gauge, label: "Monitor & Control" },
    { path: "/PlantManagement/productivity", icon: TrendingUp, label: "Productivity" },
    { path: "/PlantManagement/settings", icon: Settings, label: "Settings" },
  ];

  // Automatically collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        toggleSidebar(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarOpen, toggleSidebar]);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => toggleSidebar(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-in-out
          ${theme === 'dark' ? "bg-green-900" : "bg-green-700"} text-white flex flex-col shadow-lg overflow-hidden
          ${sidebarOpen ? "w-64" : "w-0"} 
          ${sidebarOpen ? "lg:w-64" : "lg:w-20"}
        `}
      >
        {/* Logo */}
        <div
          className="flex flex-col items-center py-4 px-2 border-b border-white/20 cursor-pointer"
          onClick={() => navigate("/PlantManagement")}
        >
          <img
            src="/logo192.png"
            alt="Farm Logo"
            className={`transition-all duration-300 ${sidebarOpen ? "w-14 h-14" : "w-12 h-12"} rounded-lg object-contain`}
          />
          {sidebarOpen && (
            <div className="mt-2 text-center hidden lg:block">
              <h1 className="text-lg font-bold whitespace-nowrap">Mount Olive</h1>
              <p className="text-xs opacity-80 whitespace-nowrap">Plant Management</p>
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
                    ${theme === 'dark' ? "hover:bg-green-800" : "hover:bg-green-600"}
                    ${location.pathname.startsWith(item.path) ? (theme === 'dark' ? "bg-green-800" : "bg-green-600") : ""}
                    ${sidebarOpen ? "justify-start px-4" : "justify-center"}
                    focus:outline-none focus:ring-1 focus:ring-white/50
                  `}
                  title={item.label}
                >
                  <item.icon size={20} className={sidebarOpen ? "mr-3" : ""} />
                  {sidebarOpen && (
                    <span className="text-sm whitespace-nowrap overflow-hidden overflow-ellipsis hidden lg:inline">
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
            <span className="font-bold text-sm text-white">PlantManage</span>
            <span className="text-white/70 text-xs">Plant System v1.0</span>
            <span className="text-white/50 text-xs">© 2025 Mount Olive</span>
          </div>
        )}
      </aside>
    </>
  );
}