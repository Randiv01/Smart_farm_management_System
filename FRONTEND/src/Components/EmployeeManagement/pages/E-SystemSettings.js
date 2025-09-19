import React, { useState } from "react";
import { Moon, Sun, Globe, Info, LogOut, Check } from "lucide-react";

export const SystemSettings = ({ darkMode }) => {
  const [currentTheme, setCurrentTheme] = useState(darkMode ? "dark" : "light");
  const [currentLanguage, setCurrentLanguage] = useState("EN");

  const cardClass = `p-6 rounded-xl shadow-md transition-colors ${
    darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
  }`;

  const buttonClass = (isActive) =>
    `flex items-center justify-between w-full p-4 rounded-lg transition-colors ${
      isActive
        ? darkMode
          ? "bg-orange-600 text-white"
          : "bg-orange-500 text-white"
        : darkMode
        ? "bg-gray-600 hover:bg-gray-500"
        : "hover:bg-gray-200"
    }`;

  const infoBoxClass = `p-4 rounded-lg ${
    darkMode ? "bg-gray-600" : "bg-gray-100"
  }`;

  const iconCircle = (isActive) =>
    `p-2 rounded-full mr-3 ${
      isActive ? "bg-white/20" : darkMode ? "bg-gray-500" : "bg-white"
    }`;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <div className={cardClass}>
          <h3 className="text-lg font-medium mb-6">Theme Settings</h3>
          <div className="space-y-4">
            <button
              onClick={() => setCurrentTheme("light")}
              className={buttonClass(currentTheme === "light")}
            >
              <div className="flex items-center">
                <div className={iconCircle(currentTheme === "light")}>
                  <Sun
                    size={20}
                    className={currentTheme === "light" ? "text-white" : "text-yellow-400"}
                  />
                </div>
                <div className="text-left">
                  <h4 className="font-medium">Light Mode</h4>
                  <p className="text-sm opacity-75">Light background with dark text</p>
                </div>
              </div>
              {currentTheme === "light" && <Check size={20} />}
            </button>

            <button
              onClick={() => setCurrentTheme("dark")}
              className={buttonClass(currentTheme === "dark")}
            >
              <div className="flex items-center">
                <div className={iconCircle(currentTheme === "dark")}>
                  <Moon
                    size={20}
                    className={currentTheme === "dark" ? "text-white" : "text-blue-500"}
                  />
                </div>
                <div className="text-left">
                  <h4 className="font-medium">Dark Mode</h4>
                  <p className="text-sm opacity-75">Dark background with light text</p>
                </div>
              </div>
              {currentTheme === "dark" && <Check size={20} />}
            </button>
          </div>
        </div>

        {/* Language Settings */}
        <div className={cardClass}>
          <h3 className="text-lg font-medium mb-6">Language Settings</h3>
          <div className="space-y-4">
            {[
              { code: "EN", label: "English", note: "Default language", color: "text-blue-500" },
              { code: "SI", label: "සිංහල (Sinhala)", note: "Sri Lankan language", color: "text-green-500" },
              { code: "TA", label: "தமிழ் (Tamil)", note: "Sri Lankan language", color: "text-purple-500" },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => setCurrentLanguage(lang.code)}
                className={buttonClass(currentLanguage === lang.code)}
              >
                <div className="flex items-center">
                  <div className={iconCircle(currentLanguage === lang.code)}>
                    <Globe
                      size={20}
                      className={currentLanguage === lang.code ? "text-white" : lang.color}
                    />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium">{lang.label}</h4>
                    <p className="text-sm opacity-75">{lang.note}</p>
                  </div>
                </div>
                {currentLanguage === lang.code && <Check size={20} />}
              </button>
            ))}
          </div>
        </div>

        {/* System Information */}
        <div className={cardClass}>
          <h3 className="text-lg font-medium mb-6">System Information</h3>
          <div className="space-y-4">
            <div className={infoBoxClass}>
              <div className="flex items-center">
                <div className={`${iconCircle(false)} bg-blue-100`}>
                  <Info size={20} className="text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium">Version</h4>
                  <p className="text-sm opacity-75">Smart Farm Management v2.5.3</p>
                </div>
              </div>
            </div>
            <div className={infoBoxClass}>
              <div className="flex items-center">
                <div className={`${iconCircle(false)} bg-green-100`}>
                  <Info size={20} className="text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium">Last Updated</h4>
                  <p className="text-sm opacity-75">October 5, 2023</p>
                </div>
              </div>
            </div>
            <div className={infoBoxClass}>
              <div className="flex items-center">
                <div className={`${iconCircle(false)} bg-purple-100`}>
                  <Info size={20} className="text-purple-500" />
                </div>
                <div>
                  <h4 className="font-medium">Support</h4>
                  <p className="text-sm opacity-75">support@smartfarm.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className={cardClass}>
          <h3 className="text-lg font-medium mb-6">Account Settings</h3>
          <div className="space-y-6">
            <div className={infoBoxClass}>
              <div className="flex items-center">
                <div className={`${iconCircle(false)} bg-blue-100`}>
                  <Info size={20} className="text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium">Current User</h4>
                  <p className="text-sm opacity-75">admin@smartfarm.com (Administrator)</p>
                </div>
              </div>
            </div>
            <button
              className={`flex items-center w-full p-4 rounded-lg transition-colors ${
                darkMode
                  ? "bg-red-900/30 hover:bg-red-900/50 text-red-400"
                  : "bg-red-100 hover:bg-red-200 text-red-600"
              }`}
            >
              <div
                className={`p-2 rounded-full mr-3 ${
                  darkMode ? "bg-red-900/40" : "bg-white"
                }`}
              >
                <LogOut size={20} className="text-red-500" />
              </div>
              <div className="text-left">
                <h4 className="font-medium">Log Out</h4>
                <p className="text-sm opacity-75">Sign out of your account</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
