import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./UHContext/UHAuthContext";
import { isManager, isNormalUser } from "../../utils/userUtils";
import RestrictedAccess from "./RestrictedAccess/RestrictedAccess";

// This component wraps protected pages
const ProtectedRoute = ({ children, allowedRoles, customerOnly = false, requireAuth = true }) => {
  const { isAuthenticated, user } = useAuth();

  // If authentication is required and user is not logged in
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, check role restrictions
  if (isAuthenticated) {
    // Check if route is for customers only and user is a manager
    if (customerOnly && isManager(user)) {
      return <RestrictedAccess 
        userRole={user?.role} 
        allowedRoles={['customer']}
        message="This area is restricted to normal users only. Managers should use their respective management systems."
      />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
      // If roles are provided and user role is not in them → show restricted access
      return <RestrictedAccess 
        userRole={user?.role} 
        allowedRoles={allowedRoles}
        message="You don't have permission to access this area."
      />;
    }
  }

  // Render the page (either authenticated with proper role or not requiring auth)
  return children;
};

export default ProtectedRoute;