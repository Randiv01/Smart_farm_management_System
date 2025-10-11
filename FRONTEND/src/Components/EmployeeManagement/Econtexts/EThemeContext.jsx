import React, { createContext, useContext, useState, useEffect } from "react";

// Create Context
const EThemeContext = createContext();

// Provider
export const EThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to "light"
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('employeeTheme');
    return savedTheme || "light";
  });

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('employeeTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <EThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </EThemeContext.Provider>
  );
};

// Custom hook
export const useETheme = () => useContext(EThemeContext);