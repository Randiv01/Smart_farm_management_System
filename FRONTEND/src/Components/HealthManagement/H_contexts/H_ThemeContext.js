import React, { createContext, useContext, useState, useEffect } from 'react';

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
  
  // Modified to default to true (expanded) when no value is saved
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('healthSidebarOpen');
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

export { ThemeContext };