import React, { useState } from "react";
import { MenuIcon, BellIcon, ChevronDownIcon, UserIcon, SunIcon, MoonIcon } from "lucide-react";
import LanguageSelector from "../UI/UI/LanguageSelector.js";
import { useLanguage } from "../contexts/LanguageContext.js";
import { useTheme } from "../contexts/ThemeContext.js";

const TopNavbar = ({ onMenuClick, sidebarOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 h-16 flex items-center z-30 transition-all duration-300
        ${darkMode ? "bg-gray-900 border-b border-gray-700 shadow-md" : "bg-white border-b border-gray-200 shadow-sm"}
        ${sidebarOpen ? "lg:pl-64 lg:ml-0" : "lg:pl-20"}   // ✅ responsive
        pl-4 pr-4 md:pr-6
      `}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left Side */}
        <div className="flex items-center">
          {/* Toggle Sidebar */}
          <button
            onClick={onMenuClick}
            className={`p-2 rounded-md mr-2 ${
              darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <MenuIcon size={24} />
          </button>

          <h2 className={`text-lg md:text-xl font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
            {t("dashboard.title", { defaultValue: "Animal Management Dashboard" })}
          </h2>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-md ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            {darkMode ? <SunIcon size={20} className="text-yellow-300" /> : <MoonIcon size={20} className="text-gray-600" />}
          </button>

          <LanguageSelector darkMode={darkMode} />

          {/* Notifications */}
          <div className="relative">
            <button
              className={`p-2 rounded-full relative ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-600"}`}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <BellIcon size={20} />
              <span className="absolute top-1 right-1 bg-[#E67E22] rounded-full w-2 h-2"></span>
            </button>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              className={`flex items-center space-x-2 p-2 rounded-md ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className={`rounded-full p-1 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                <UserIcon size={18} className={darkMode ? "text-gray-200" : "text-gray-600"} />
              </div>
              <span className={`hidden sm:inline text-sm font-medium truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                John Farmer
              </span>
              <ChevronDownIcon size={16} className={darkMode ? "text-white" : "text-gray-600"} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
