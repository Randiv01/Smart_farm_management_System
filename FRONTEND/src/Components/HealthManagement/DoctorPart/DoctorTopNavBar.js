// Components/HealthManagement/DoctorPart/DoctorTopNavBar.js
import React, { useState } from "react";
import { useLanguage } from "../H_contexts/H_LanguageContext.js";
import { useTheme } from "../H_contexts/H_ThemeContext.js";

const DoctorTopNavBar = ({ onMenuClick, isCollapsed }) => {
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Match Admin widths: collapsed 80px, expanded 256px; topbar height 64px
  const leftOffset = isCollapsed ? 80 : 256;

  return (
    <header
      className={`${darkMode ? "bg-green-900 border-b border-green-700 shadow-md" : "bg-green-800 border-b border-green-600 shadow-sm"}
        fixed top-0 right-0 h-16 flex items-center px-4 z-30 w-auto`}
      style={{ left: leftOffset }}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left: Menu + Title */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 text-white hover:bg-green-700 rounded-md transition"
            title="Toggle menu"
          >
            {/* burger icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <h2 className="ml-3 text-xl font-semibold text-white">Doctor Dashboard</h2>
        </div>

        {/* Right: Language, Theme, User */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleLanguage}
            className="p-2 text-white hover:bg-green-700 rounded-md transition flex items-center space-x-2"
            title="Toggle language"
          >
            {/* globe */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3c3.866 0 7 3.582 7 8s-3.134 8-7 8-7-3.582-7-8 3.134-8 7-8z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.6 9h16.8M3.6 15h16.8M12 3c1.5 2 2.4 5.333 2.4 8s-.9 6-2.4 8c-1.5-2-2.4-5.333-2.4-8s.9-6 2.4-8z"/>
            </svg>
            <span className="text-white">{language === "en" ? "English" : "Spanish"}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-white hover:bg-green-700 rounded-md transition"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              // sun
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm0 13a5 5 0 100-10 5 5 0 000 10zm8-6a1 1 0 100-2h-2a1 1 0 100 2h2zM4 9a1 1 0 100-2H2a1 1 0 100 2h2zm11.657 6.657a1 1 0 10-1.414-1.414l-1.414 1.414a1 1 0 001.414 1.414l1.414-1.414zM6.171 6.171a1 1 0 10-1.414-1.414L3.343 6.171a1 1 0 101.414 1.414l1.414-1.414z"/>
              </svg>
            ) : (
              // moon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707 8.003 8.003 0 1017.293 13.293z"/>
              </svg>
            )}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center space-x-2 p-2 text-white hover:bg-green-700 rounded-md transition"
            >
              {/* user */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z"/>
              </svg>
              <span>Dr. Jane</span>
              {/* chevron */}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transform transition ${userMenuOpen ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 011.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
              </svg>
            </button>
            {userMenuOpen && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 ${
                  darkMode ? "bg-green-800 border border-green-700" : "bg-green-700 border border-green-600"
                }`}
              >
                <button
                  className="block px-4 py-2 text-sm w-full text-left text-white hover:bg-green-600 transition"
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = "/";
                  }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DoctorTopNavBar;