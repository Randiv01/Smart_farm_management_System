import React, { useState } from 'react';
import { GlobeIcon, ChevronDownIcon } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.js';

const LanguageSelector = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: t('language.en') },
    { code: 'si', name: t('language.si') },
    { code: 'ta', name: t('language.ta') },
  ];

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <GlobeIcon size={20} />
        <span className="hidden md:inline text-sm">
          {languages.find((lang) => lang.code === language)?.name}
        </span>
        <ChevronDownIcon size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                language === lang.code
                  ? 'font-medium text-green-600 dark:text-green-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
