import React, { useState } from 'react';
import { useLanguage } from './context/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';
import './styles/P-LanguageSwitcher.css';
const LanguageSwitcher = () => {
  const {
    language,
    changeLanguage
  } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const languages = [{
    code: 'en',
    label: 'EN'
  }, {
    code: 'ta',
    label: 'TA'
  }, {
    code: 'si',
    label: 'SI'
  }];
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  const handleLanguageChange = langCode => {
    changeLanguage(langCode);
    setIsOpen(false);
  };
  return <div className="language-switcher">
      <button className="language-button" onClick={toggleDropdown}>
        <Globe size={18} />
        <span>{languages.find(lang => lang.code === language)?.label}</span>
        <ChevronDown size={14} />
      </button>
      {isOpen && <div className="language-dropdown">
          {languages.map(lang => <button key={lang.code} className={`language-option ${language === lang.code ? 'active' : ''}`} onClick={() => handleLanguageChange(lang.code)}>
              {lang.label}
            </button>)}
        </div>}
    </div>;
};
export default LanguageSwitcher;