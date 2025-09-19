import React, { useState, useEffect, createContext, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('healthDarkMode') === 'true';
  });
  
  // Change the initial state to default to true (expanded)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('healthSidebarOpen');
    // Default to true if no value is saved
    return saved === null ? true : saved === 'true';
  });

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('healthDarkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Add function to toggle sidebar
  const toggleSidebar = () => {
    const newSidebarState = !sidebarOpen;
    setSidebarOpen(newSidebarState);
    localStorage.setItem('healthSidebarOpen', newSidebarState.toString());
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ 
      darkMode, 
      toggleTheme, 
      sidebarOpen, 
      toggleSidebar 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};