// src/Components/UserHome/UHContext/UHAuthContext.jsx
import React, { useEffect, useState, createContext, useContext, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Define refreshUserData function
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
      if (freshUserData.email) localStorage.setItem('email', freshUserData.email);
      
      // Update state with fresh data
      const updatedUser = {
        token,
        role: freshUserData.role || localStorage.getItem('role'),
        firstName: freshUserData.firstName || localStorage.getItem('firstName'),
        lastName: freshUserData.lastName || localStorage.getItem('lastName'),
        email: freshUserData.email || localStorage.getItem('email'),
        name: localStorage.getItem('name') || `${freshUserData.firstName || ''} ${freshUserData.lastName || ''}`.trim(),
        profileImage: freshUserData.profileImage || localStorage.getItem('profileImage') || '',
      };
      
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user from localStorage on mount and fetch fresh data
  useEffect(() => {
    const initializeUserData = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        // First, set data from localStorage for immediate display
        const userData = {
          token,
          role: localStorage.getItem("role"),
          firstName: localStorage.getItem("firstName"),
          lastName: localStorage.getItem("lastName"),
          email: localStorage.getItem("email"),
          name: localStorage.getItem("name"),
          profileImage: localStorage.getItem("profileImage") || "",
        };
        setUser(userData);
        setIsAuthenticated(true);

        // Then fetch fresh data from API
        try {
          await refreshUserData();
        } catch (error) {
          console.error('Error fetching fresh user data on mount:', error);
        }
      }
    };

    initializeUserData();
  }, [refreshUserData]);

  // Refresh user data when the window regains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      const token = localStorage.getItem('token');
      if (token && isAuthenticated) {
        refreshUserData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, refreshUserData]);

  const login = async (userData) => {
    try {
      if (userData?.email && userData?.token) {
        localStorage.setItem("token", userData.token);
        localStorage.setItem("role", userData.role || "customer");
        localStorage.setItem("firstName", userData.firstName || "");
        localStorage.setItem("lastName", userData.lastName || "");
        localStorage.setItem("email", userData.email);
        localStorage.setItem("name", userData.name || userData.firstName || "");
        localStorage.setItem("profileImage", userData.profileImage || "");

        setUser(userData);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      if (userData?.email && userData?.token) {
        localStorage.setItem("token", userData.token);
        localStorage.setItem("role", userData.role || "customer");
        localStorage.setItem("firstName", userData.firstName || "");
        localStorage.setItem("lastName", userData.lastName || "");
        localStorage.setItem("email", userData.email);
        localStorage.setItem("name", userData.name || userData.firstName || "");
        localStorage.setItem("profileImage", userData.profileImage || "");

        setUser(userData);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const logout = () => {
    // Clear all localStorage items
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    localStorage.removeItem("profileImage");
    
    // Clear any other user-related items
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith("user")) {
        localStorage.removeItem(key);
      }
    });

    setUser(null);
    setIsAuthenticated(false);
    
    // Force a full page reload to ensure complete logout
    window.location.href = '/';
  };

  // Update user info (used for profile changes)
  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);

    // persist updated fields
    Object.keys(updatedData).forEach((key) => {
      localStorage.setItem(key, updatedData[key]);
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, register, logout, updateUser, refreshUserData, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};