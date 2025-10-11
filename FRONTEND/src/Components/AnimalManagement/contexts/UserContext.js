// contexts/UserContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

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
  const [isLoading, setIsLoading] = useState(false);

  // Define refreshUserData function first
  const refreshUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      setIsLoading(true);
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const freshUserData = response.data;
      
      // Update localStorage with fresh data
      if (freshUserData.firstName) localStorage.setItem('firstName', freshUserData.firstName);
      if (freshUserData.lastName) localStorage.setItem('lastName', freshUserData.lastName);
      if (freshUserData.role) localStorage.setItem('role', freshUserData.role);
      if (freshUserData.profileImage) localStorage.setItem('profileImage', freshUserData.profileImage);
      
      // Update state with fresh data
      setUserData({
        firstName: freshUserData.firstName || '',
        lastName: freshUserData.lastName || '',
        name: `${freshUserData.firstName || ''} ${freshUserData.lastName || ''}`.trim(),
        role: freshUserData.role || '',
        profileImage: freshUserData.profileImage || ''
      });
      
      return true;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize user data from localStorage and fetch fresh data from API
  useEffect(() => {
    const initializeUserData = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          setIsInitialized(true);
          return;
        }

        // First, set data from localStorage for immediate display
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

        // Then fetch fresh data from API
        const token = localStorage.getItem('token');
        if (token) {
          setIsLoading(true);
          try {
            const response = await axios.get('http://localhost:5000/api/users/profile', {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const freshUserData = response.data;
            
            // Update localStorage with fresh data
            if (freshUserData.firstName) localStorage.setItem('firstName', freshUserData.firstName);
            if (freshUserData.lastName) localStorage.setItem('lastName', freshUserData.lastName);
            if (freshUserData.role) localStorage.setItem('role', freshUserData.role);
            if (freshUserData.profileImage) localStorage.setItem('profileImage', freshUserData.profileImage);
            
            // Update state with fresh data
            setUserData({
              firstName: freshUserData.firstName || firstName,
              lastName: freshUserData.lastName || lastName,
              name: name || `${freshUserData.firstName || ''} ${freshUserData.lastName || ''}`.trim(),
              role: freshUserData.role || role,
              profileImage: freshUserData.profileImage || profileImage
            });
          } catch (apiError) {
            console.error('Error fetching fresh user data:', apiError);
            // Keep localStorage data if API fails
          } finally {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error initializing user data:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeUserData();
  }, []);

  // Refresh user data when the window regains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      const token = localStorage.getItem('token');
      if (token && isInitialized) {
        refreshUserData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isInitialized, refreshUserData]);

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
    refreshUserData,
    isInitialized,
    isLoading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};