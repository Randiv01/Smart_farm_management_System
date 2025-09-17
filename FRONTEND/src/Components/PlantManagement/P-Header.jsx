import React, { useState } from 'react';
import { useTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import ThemeToggle from './P-ThemeToggle';
import LanguageSwitcher from './P-LanguageSwitcher';
import { User, LogOut, ChevronDown } from 'lucide-react';
import './styles/P-Header.css';
const Header = () => {
  const {
    t
  } = useLanguage();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const toggleProfileDropdown = () => {
    setIsProfileOpen(!isProfileOpen);
  };
  return <header className="header">
      <div className="header-controls">
        <LanguageSwitcher />
        <ThemeToggle />
        <div className="profile-dropdown">
          <button className="profile-button" onClick={toggleProfileDropdown}>
            <div className="avatar">
              <User size={18} />
            </div>
            <span className="username">John Doe</span>
            <ChevronDown size={16} />
          </button>
          {isProfileOpen && <div className="dropdown-menu">
              <button className="dropdown-item">
                <User size={16} />
                <span>{t('profile')}</span>
              </button>
              <button className="dropdown-item">
                <LogOut size={16} />
                <span>{t('logout')}</span>
              </button>
            </div>}
        </div>
      </div>
    </header>;
};
export default Header;