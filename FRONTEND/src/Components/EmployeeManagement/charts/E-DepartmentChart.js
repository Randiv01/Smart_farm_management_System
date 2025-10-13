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

export const DepartmentChart = ({ data: propData }) => {
  const { theme } = useETheme();
  const darkMode = theme === 'dark';
  
  // Use prop data if available, otherwise use default data
  const data = propData && propData.length > 0 ? propData : [
    { name: "Farm Operations", value: 15, color: "#22c55e" },
    { name: "Inventory Management", value: 7, color: "#8b5cf6" },
    { name: "Health Management", value: 6, color: "#f59e0b" },
    { name: "Administration", value: 8, color: "#3b82f6" },
    { name: "Employee Management", value: 5, color: "#06b6d4" },
    { name: "Plant Management", value: 12, color: "#ef4444" },
    { name: "Animal Management", value: 10, color: "#84cc16" },
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
