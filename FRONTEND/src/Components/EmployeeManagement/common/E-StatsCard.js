import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatsCard = ({
  title,
  value,
  change,
  darkMode,
  color = 'blue',
  isPositive = true
}) => {
  const colorClasses = {
    blue: darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600',
    green: darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-600',
    orange: darkMode ? 'bg-orange-900/20 text-orange-400' : 'bg-orange-100 text-orange-600',
    purple: darkMode ? 'bg-purple-900/20 text-purple-400' : 'bg-purple-100 text-purple-600'
  };

  return (
    <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className="text-lg font-medium text-gray-400">{title}</h3>
      <div className="mt-2 flex justify-between items-end">
        <p className="text-3xl font-bold">{value}</p>
        <div
          className={`flex items-center px-2 py-1 rounded ${
            isPositive
              ? darkMode
                ? 'bg-green-900/20 text-green-400'
                : 'bg-green-100 text-green-600'
              : darkMode
              ? 'bg-red-900/20 text-red-400'
              : 'bg-red-100 text-red-600'
          }`}
        >
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span className="ml-1 text-sm">{change}</span>
        </div>
      </div>
    </div>
  );
};
