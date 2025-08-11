import React, { useState } from 'react';
import { MenuIcon, BellIcon, ChevronDownIcon, UserIcon, SunIcon, MoonIcon } from 'lucide-react';
import LanguageSelector from '../UI/UI/LanguageSelector.js';
import { useLanguage } from '../contexts/LanguageContext.js';

const TopNavbar = ({ onMenuClick, darkMode, setDarkMode }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <header className={`${darkMode ? 'bg-gray-850' : 'bg-white'} shadow-sm z-10 fixed top-0 left-60 right-0 h-16 flex items-center px-4 md:px-6 transition-colors duration-200`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-600'} md:hidden`}
          >
            <MenuIcon size={24} />
          </button>
          <h2 className={`ml-2 md:ml-0 text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {t('dashboard.title')}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? (
              <SunIcon size={20} className={darkMode ? 'text-yellow-300' : 'text-gray-600'} />
            ) : (
              <MoonIcon size={20} className={darkMode ? 'text-gray-200' : 'text-gray-600'} />
            )}
          </button>

          <LanguageSelector darkMode={darkMode} />

          <div className="relative">
            <button
              className={`p-2 rounded-full relative ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-600'}`}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <BellIcon size={20} />
              <span className="absolute top-1 right-1 bg-[#E67E22] rounded-full w-2 h-2"></span>
            </button>
            {notificationsOpen && (
              <div className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 z-50 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {t('notifications.title')}
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <a href="#" className={`px-4 py-3 flex ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    <div className="w-full">
                      <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {t('notifications.healthAlert')}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('notifications.temperatureAbove')}
                      </p>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className={`flex items-center space-x-2 p-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className={`rounded-full p-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <UserIcon size={18} className={darkMode ? 'text-gray-200' : 'text-gray-600'} />
              </div>
              <span className={`hidden md:inline text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                John Farmer
              </span>
              <ChevronDownIcon
                size={16}
                className={darkMode ? 'text-white' : 'text-gray-600'}
              />
            </button>
            {userMenuOpen && (
              <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <a
                  href="#"
                  className={`block px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`}
                >
                  {t('user.profile')}
                </a>
                <a
                  href="#"
                  className={`block px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`}
                >
                  {t('user.settings')}
                </a>
                <a
                  href="#"
                  className={`block px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`}
                >
                  {t('user.signOut')}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;