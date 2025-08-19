import React from "react";
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
    { path: "/AnimalManagement", icon: Home, label: "Overview" },
    { path: "/feed-stock", icon: BarChart2, label: "FeedStock" },
    { path: "/feeding-scheduler", icon: Calendar, label: "Feeding Schedule" },
    { path: "/animal-health", icon: HeartPulse, label: "Health" },
    { path: "/productivity", icon: Activity, label: "Productivity" },
    { path: `/AnimalManagement/design-plan/${type}`, icon: Plus, label: "Design your Plan" },
    { path: "/zones", icon: MapPin, label: "Zones / Shelters" },
    { path: "/alerts", icon: Bell, label: "Alerts" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

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
          ${sidebarOpen ? "w-64" : "w-0 lg:w-20"} 
          ${darkMode ? "bg-green-900" : "bg-green-700"} 
          text-white flex flex-col shadow-lg overflow-hidden
        `}
      >
        {/* Logo */}
        <div
          className="flex flex-col items-center py-4 px-2 border-b border-white/20 cursor-pointer"
          onClick={() => navigate("/")}
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
                    // Only auto-close sidebar on mobile
                    if (window.innerWidth < 1024) {
                      toggleSidebar && toggleSidebar();
                    }
                  }}
                  className={`
                    flex items-center w-full p-3 rounded-lg transition-all
                    hover:bg-green-800 hover:shadow-sm
                    ${location.pathname.startsWith(item.path) ? "bg-green-800 font-medium" : ""}
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

        {/* User Section */}
        <div className="p-3 border-t border-white/20">
          <div
            className={`flex items-center ${sidebarOpen ? "justify-start" : "justify-center"}`}
            onClick={() => navigate("/profile")}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <UserCheck size={16} />
            </div>
            {sidebarOpen && (
              <div className="ml-3 overflow-hidden hidden lg:block">
                <p className="text-sm font-medium truncate">Admin User</p>
                <p className="text-xs opacity-70 truncate">Farm Manager</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
