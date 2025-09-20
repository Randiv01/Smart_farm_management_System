import React from "react";
import { Sun, Moon, User } from "lucide-react";

export const Header = ({ darkMode, toggleTheme, language, changeLanguage }) => {
  return (
    <header
      className={`flex justify-between items-center p-4 ${
        darkMode
          ? "bg-dark-card text-dark-text"
          : "bg-soft-white border-b border-gray-200 text-black"
      }`}
    >
      {/* Logo */}
      <div className="logo">
        <h1 className="text-2xl font-bold">
          <span className="text-btn-teal">Smart</span> Farm
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          className={`appearance-none rounded-md px-3 pr-8 py-1.5 cursor-pointer border-0 
            ${darkMode ? "bg-dark-gray text-white" : "bg-gray-200 text-black"}`}
        >
          <option value="EN">EN</option>
          <option value="SI">සිංහල</option>
          <option value="TA">தமிழ்</option>
        </select>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-colors 
            ${
              darkMode
                ? "bg-dark-gray hover:bg-gray-600"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Profile Icon */}
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-full 
            ${darkMode ? "bg-green-600 text-white" : "bg-green-500 text-white"}`}
        >
          <User size={20} />
        </div>
      </div>
    </header>
  );
};