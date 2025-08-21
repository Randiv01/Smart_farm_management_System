import React, { createContext, useContext, useState } from "react";

// Create Context
const IThemeContext = createContext();

// Provider
export const IThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <IThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </IThemeContext.Provider>
  );
};

// Custom hook
export const useITheme = () => useContext(IThemeContext);
