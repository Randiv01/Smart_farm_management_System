import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useETheme } from '../Econtexts/EThemeContext.jsx';

export const EmployeeChart = ({ data: propData }) => {
  const { theme } = useETheme();
  const darkMode = theme === 'dark';
  
  // Use prop data if available, otherwise use default data
  const data = propData && propData.length > 0 ? propData : [
    { name: "Full-time", value: 35, color: "#22c55e" },
    { name: "Part-time", value: 8, color: "#3b82f6" },
    { name: "Contract", value: 5, color: "#f59e0b" },
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? "#374151" : "#fff",
              borderColor: darkMode ? "#4b5563" : "#e5e7eb",
              color: darkMode ? "#fff" : "#000",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
