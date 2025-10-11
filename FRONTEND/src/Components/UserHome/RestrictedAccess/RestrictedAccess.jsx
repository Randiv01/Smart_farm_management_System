import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

const RestrictedAccess = ({ userRole, allowedRoles = ['customer'], message = "This area is restricted to normal users only." }) => {
  const getRoleDisplayName = (role) => {
    const roleMap = {
      animal: "Animal Manager",
      plant: "Plant Manager", 
      inv: "Inventory Manager",
      emp: "Employee Manager",
      health: "Health Manager",
      owner: "Farm Owner",
      customer: "Customer"
    };
    return roleMap[role] || role;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <ShieldX className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Restricted
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {message}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Your Role:
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {getRoleDisplayName(userRole)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Allowed Roles: {allowedRoles.map(role => getRoleDisplayName(role)).join(', ')}
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/"
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center px-4 py-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          If you believe this is an error, please contact your administrator.
        </div>
      </div>
    </div>
  );
};

export default RestrictedAccess;

