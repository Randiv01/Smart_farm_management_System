import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./UHContext/UHAuthContext";

// This component wraps protected pages
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    // Redirect to login if user is not logged in
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If roles are provided and user role is not in them → redirect home
    return <Navigate to="/" replace />;
  }

  return children; // Render the protected page if authenticated
};

export default ProtectedRoute;
