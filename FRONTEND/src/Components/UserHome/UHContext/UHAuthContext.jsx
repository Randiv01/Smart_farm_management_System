// src/Components/UserHome/UHContext/UHAuthContext.jsx
import React, { useEffect, useState, createContext, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
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
    }
  }, []);

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
      value={{ user, isAuthenticated, login, register, logout, updateUser }}
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