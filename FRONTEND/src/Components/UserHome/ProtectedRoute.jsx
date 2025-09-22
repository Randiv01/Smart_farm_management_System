import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./UHContext/UHAuthContext";
import { isManager } from "../../utils/userUtils";

// This component wraps protected pages
const ProtectedRoute = ({ children, allowedRoles, customerOnly = false }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    // Redirect to login if user is not logged in
    return <Navigate to="/login" replace />;
  }

  // Check if route is for customers only and user is a manager
  if (customerOnly && isManager(user)) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If roles are provided and user role is not in them → redirect home
    return <Navigate to="/" replace />;
  }

  return children; // Render the protected page if authenticated
};

export default ProtectedRoute;