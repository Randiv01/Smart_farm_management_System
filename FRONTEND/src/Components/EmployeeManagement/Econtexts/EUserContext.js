// contexts/EUserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    name: '',
    role: '',
    profileImage: ''
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize user data from localStorage
  useEffect(() => {
    const initializeUserData = () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          setIsInitialized(true);
          return;
        }

        const firstName = localStorage.getItem('firstName') || '';
        const lastName = localStorage.getItem('lastName') || '';
        const name = localStorage.getItem('name') || '';
        const role = localStorage.getItem('role') || '';
        const profileImage = localStorage.getItem('profileImage') || '';

        setUserData({
          firstName,
          lastName,
          name,
          role,
          profileImage
        });
      } catch (error) {
        console.error('Error initializing user data:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeUserData();
  }, []);

  const updateUserData = (newData) => {
    try {
      // Update localStorage
      Object.keys(newData).forEach(key => {
        if (newData[key] !== null && newData[key] !== undefined) {
          localStorage.setItem(key, newData[key]);
        }
      });
      
      // Update state
      setUserData(prev => ({ ...prev, ...newData }));
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const value = {
    userData,
    updateUserData,
    isInitialized
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};