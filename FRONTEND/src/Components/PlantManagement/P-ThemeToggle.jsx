import React from 'react';
import { useTheme } from './context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import './styles/P-ThemeToggle.css';
const ThemeToggle = () => {
  const {
    theme,
    toggleTheme
  } = useTheme();
  return <button className="theme-toggle" onClick={toggleTheme} aria-label={`Toggle ${theme === 'light' ? 'dark' : 'light'} mode`}>
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>;
};
export default ThemeToggle;