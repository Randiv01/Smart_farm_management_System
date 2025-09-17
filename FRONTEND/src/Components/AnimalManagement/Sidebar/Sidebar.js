import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Plus,
  Calendar,
  HeartPulse,
  Activity,
  BarChart2,
  Bell,
  Settings,
  UserCheck,
  MapPin,
} from "lucide-react";

export default function Sidebar({ darkMode, sidebarOpen, toggleSidebar, type }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/AnimalManagement", icon: Home, label: "Overview", exact: true },
    { path: "/AnimalManagement/feed-stock", icon: BarChart2, label: "FeedStock" },
    { path: "/AnimalManagement/feeding-scheduler", icon: Calendar, label: "Feeding Schedule" },
    { path: "/AnimalManagement/animal-health", icon: HeartPulse, label: "Health" },
    { path: "/AnimalManagement/productivity", icon: Activity, label: "Productivity" },
    { path: `/AnimalManagement/design-plan/${type}`, icon: Plus, label: "Design your Plan" },
    { path: "/AnimalManagement/zones", icon: MapPin, label: "Zones / Shelters" },
    { path: "/AnimalManagement/alerts", icon: Bell, label: "Alerts" },
    { path: "/AnimalManagement/settings", icon: Settings, label: "Settings" },
  ];

  // Auto-close sidebar if resized to mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        toggleSidebar && toggleSidebar(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarOpen, toggleSidebar]);

  // Function to check if a nav item is active
  const isActive = (itemPath, exact = false) => {
    if (exact) {
      return location.pathname === itemPath;
    }
    return location.pathname.startsWith(itemPath) && 
           location.pathname !== "/AnimalManagement"; // Exclude overview from partial matches
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => toggleSidebar && toggleSidebar()}
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
          onClick={() => navigate("/AnimalManagement")}
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
                    if (window.innerWidth < 1024) {
                      toggleSidebar && toggleSidebar();
                    }
                  }}
                  className={`
                    flex items-center w-full p-3 rounded-lg transition-all
                    hover:bg-green-800 hover:shadow-sm
                    ${isActive(item.path, item.exact) ? "bg-green-800 font-medium" : ""}
                    ${sidebarOpen ? "justify-start px-4" : "justify-center"}
                    focus:outline-none focus:ring-1 focus:ring-white/50
                  `}
                >
                  <item.icon size={20} className={`flex-shrink-0 ${sidebarOpen ? "mr-3" : ""}`} />
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

        {/* Footer: only show when sidebar is open */}
        {sidebarOpen && (
          <div className="p-4 border-t border-white/20 flex flex-col items-center justify-center text-center text-white/80 text-xs space-y-1">
            <span className="font-bold text-sm text-white">Mount Olive</span>
            <span className="text-white/70 text-xs">Farm House v1.0</span>
            <span className="text-white/50 text-xs">© 2025 Mount Olive Animal Admin</span>
          </div>
        )}
      </aside>
    </>
  );
}