import React, { createContext, useContext, useState } from "react";

// Create Context
const EThemeContext = createContext();

// Provider
export const EThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");

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