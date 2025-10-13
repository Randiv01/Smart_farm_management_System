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
    const stored = localStorage.getItem('healthDarkMode');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
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

  // Sync with system theme only when user has not explicitly chosen a preference
  useEffect(() => {
    const stored = localStorage.getItem('healthDarkMode');
    if (stored === 'true' || stored === 'false') return;
    const mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (!mql) return;
    const handleChange = (e) => setDarkMode(e.matches);
    try {
      mql.addEventListener('change', handleChange);
    } catch (_) {
      // Safari
      mql.addListener(handleChange);
    }
    return () => {
      try {
        mql.removeEventListener('change', handleChange);
      } catch (_) {
        mql.removeListener(handleChange);
      }
    };
  }, []);

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