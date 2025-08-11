import React from 'react';
import { SunIcon, MoonIcon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.js';
import { useLanguage } from '../../contexts/LanguageContext.js';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={theme === 'light' ? t('theme.dark') : t('theme.light')}
    >
      {theme === 'light'
        ? <MoonIcon size={20} className="text-gray-600 dark:text-gray-300" />
        : <SunIcon size={20} className="text-gray-300" />}
    </button>
  );
};

export default ThemeToggle;
