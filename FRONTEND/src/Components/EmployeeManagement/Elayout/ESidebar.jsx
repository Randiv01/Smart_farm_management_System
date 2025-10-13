import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, Bell, Calendar, Clock, Plane, CreditCard, BarChart3, Settings } from "lucide-react";

export default function ESidebar({ darkMode, sidebarOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Match your actual route paths from App.js
  const navItems = [
    { path: "/EmployeeManagement", icon: Home, label: "Dashboard" },
    { path: "/EmployeeManagement/staff", icon: Users, label: "Staff Hub" },
    { path: "/EmployeeManagement/attendance", icon: Calendar, label: "Attendance" },
    { path: "/EmployeeManagement/leave", icon: Plane, label: "Leave Planner" },
    { path: "/EmployeeManagement/overtime", icon: Clock, label: "Overtime" },
    { path: "/EmployeeManagement/salary", icon: CreditCard, label: "Salary Desk" },
    { path: "/EmployeeManagement/reports", icon: BarChart3, label: "Reports" },
    { path: "/EmployeeManagement/notifications", icon: Bell, label: "Notifications" },
    { path: "/EmployeeManagement/settings", icon: Settings, label: "Settings" },
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

  const isActivePath = (path) => {
    if (path === "/EmployeeManagement") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

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
          fixed top-0 left-0 h-full z-40 transition-all duration-300
          ${darkMode ? "bg-gray-900" : "bg-green-800"} text-white flex flex-col shadow-lg overflow-hidden
          ${sidebarOpen ? "w-64" : "w-20"} 
          lg:w-${sidebarOpen ? "64" : "20"}
        `}
      >
        {/* Logo */}
        <div
          className="flex flex-col items-center py-4 px-2 border-b border-white/20 cursor-pointer"
          onClick={() => navigate("/EmployeeManagement")}
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
                    hover:bg-green-700 hover:shadow-sm
                    ${isActivePath(item.path) ? "bg-green-700 font-medium" : ""}
                    ${sidebarOpen ? "justify-start px-4" : "justify-center"}
                    focus:outline-none focus:ring-1 focus:ring-white/50
                  `}
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
            <span className="font-bold text-sm text-white">EmpManager</span>
            <span className="text-white/70 text-xs">Employee System v1.0</span>
            <span className="text-white/50 text-xs">© 2025 EmpManage</span>
          </div>
        )}
      </aside>
    </>
  );
}
