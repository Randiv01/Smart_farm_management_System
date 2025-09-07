import React, { createContext, useState, useContext, useEffect } from 'react';
const LanguageContext = createContext();
export const useLanguage = () => useContext(LanguageContext);
export const LanguageProvider = ({
  children
}) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en';
  });
  const translations = {
    en: {
      dashboard: 'Dashboard',
      greenhouseManagement: 'Greenhouse Management',
      inspectionManagement: 'Inspection Management',
      fertilizingManagement: 'Fertilizing Management',
      pestDiseaseManagement: 'Pest & Disease Management',
      monitorControl: 'Monitor & Control',
      productivity: 'Productivity',
      settings: 'Settings',
      search: 'Search',
      profile: 'Profile',
      logout: 'Logout'
      // Add more translations as needed
    },
    ta: {
      dashboard: 'டாஷ்போர்டு',
      greenhouseManagement: 'பசுமை இல்ல மேலாண்மை',
      inspectionManagement: 'ஆய்வு மேலாண்மை',
      fertilizingManagement: 'உரமிடுதல் மேலாண்மை',
      pestDiseaseManagement: 'பூச்சி & நோய் மேலாண்மை',
      monitorControl: 'கண்காணிப்பு & கட்டுப்பாடு',
      productivity: 'உற்பத்தித்திறன்',
      settings: 'அமைப்புகள்',
      search: 'தேடல்',
      profile: 'சுயவிவரம்',
      logout: 'வெளியேறு'
      // Add more translations as needed
    },
    si: {
      dashboard: 'උපකරණ පුවරුව',
      greenhouseManagement: 'හරිතාගාර කළමනාකරණය',
      inspectionManagement: 'පරීක්ෂා කළමනාකරණය',
      fertilizingManagement: 'පොහොර යෙදීම් කළමනාකරණය',
      pestDiseaseManagement: 'පළිබෝධ සහ රෝග කළමනාකරණය',
      monitorControl: 'නිරීක්ෂණය සහ පාලනය',
      productivity: 'ඵලදායිතාව',
      settings: 'සැකසුම්',
      search: 'සොයන්න',
      profile: 'පැතිකඩ',
      logout: 'පිටවීම'
      // Add more translations as needed
    }
  };
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);
  const changeLanguage = lang => {
    setLanguage(lang);
  };
  const t = key => {
    return translations[language]?.[key] || key;
  };
  return <LanguageContext.Provider value={{
    language,
    changeLanguage,
    t
  }}>
      {children}
    </LanguageContext.Provider>;
};