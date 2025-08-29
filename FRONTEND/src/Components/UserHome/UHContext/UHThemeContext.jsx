import React, { useEffect, useState, createContext, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Start with light mode always for first load
  const [darkMode, setDarkMode] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Check if a previous theme exists in localStorage for User module
    const savedMode = localStorage.getItem('userTheme');
    if (savedMode !== null) {
      setDarkMode(savedMode === 'true');
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;

    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }

    // Save user preference with a unique key
    localStorage.setItem('userTheme', darkMode.toString());
  }, [darkMode, initialized]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
