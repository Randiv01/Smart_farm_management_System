// src/Components/UserHome/UHContext/UHAuthContext.jsx
import React, { useEffect, useState, createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userData = {
        token,
        role: localStorage.getItem('role'),
        firstName: localStorage.getItem('firstName'),
        lastName: localStorage.getItem('lastName'),
        email: localStorage.getItem('email'),
        name: localStorage.getItem('name')
      };
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email, password) => {
    try {
      if (email && password) {
        const userData = {
          token: 'simulated-token',
          role: 'customer',
          firstName: email.split('@')[0],
          lastName: '',
          email,
          name: email.split('@')[0]
        };

        // Save to localStorage
        localStorage.setItem("token", userData.token);
        localStorage.setItem("role", userData.role);
        localStorage.setItem("firstName", userData.firstName);
        localStorage.setItem("lastName", userData.lastName);
        localStorage.setItem("email", userData.email);
        localStorage.setItem("name", userData.name);

        // Update state immediately
        setUser(userData);
        setIsAuthenticated(true);

        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      if (name && email && password) {
        const userData = {
          token: 'simulated-token',
          role: 'customer',
          firstName: name,
          lastName: '',
          email,
          name
        };

        localStorage.setItem("token", userData.token);
        localStorage.setItem("role", userData.role);
        localStorage.setItem("firstName", userData.firstName);
        localStorage.setItem("lastName", userData.lastName);
        localStorage.setItem("email", userData.email);
        localStorage.setItem("name", userData.name);

        setUser(userData);
        setIsAuthenticated(true);

        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("email");
    localStorage.removeItem("name");

    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
