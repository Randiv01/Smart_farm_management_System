import React, { useEffect, useState, createContext, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Always start with light for first-ever visit
  const [theme, setTheme] = useState('light');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Check if user has previously switched theme for Animal module
    const savedTheme = localStorage.getItem('animalTheme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;

    // Apply the theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');

    // Save user preference
    localStorage.setItem('animalTheme', theme);
  }, [theme, initialized]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
