import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useETheme } from '../Econtexts/EThemeContext.jsx';

export const LeaveAnalyticsChart = ({ data: propData }) => {
  const { theme } = useETheme();
  const darkMode = theme === 'dark';
  
  // Use prop data if available, otherwise use default data
  const data = propData && propData.length > 0 ? propData : [
    { type: "Annual", approved: 15, pending: 3, rejected: 2 },
    { type: "Sick", approved: 8, pending: 1, rejected: 0 },
    { type: "Casual", approved: 12, pending: 2, rejected: 1 },
    { type: "Other", approved: 5, pending: 1, rejected: 1 },
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />
          <XAxis dataKey="type" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? "#374151" : "#fff",
              borderColor: darkMode ? "#4b5563" : "#e5e7eb",
              color: darkMode ? "#fff" : "#000",
            }}
          />
          <Legend />
          <Bar dataKey="approved" name="Approved" fill="#22c55e" />
          <Bar dataKey="pending" name="Pending" fill="#f59e0b" />
          <Bar dataKey="rejected" name="Rejected" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
