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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useETheme } from '../Econtexts/EThemeContext.jsx';

export const OvertimeAnalyticsChart = ({ data: propData }) => {
  const { theme } = useETheme();
  const darkMode = theme === 'dark';
  
  // Use prop data if available, otherwise use default data
  const departmentData = propData?.byDepartment || [
    { department: "Farm Operations", hours: 25.5 },
    { department: "Inventory Management", hours: 15.0 },
    { department: "Health Management", hours: 8.5 },
    { department: "Administration", hours: 12.0 },
    { department: "Employee Management", hours: 5.5 },
    { department: "Plant Management", hours: 18.0 },
    { department: "Animal Management", hours: 22.0 },
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={departmentData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />
          <XAxis 
            dataKey="department" 
            stroke={darkMode ? "#9ca3af" : "#6b7280"}
            fontSize={10}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? "#374151" : "#fff",
              borderColor: darkMode ? "#4b5563" : "#e5e7eb",
              color: darkMode ? "#fff" : "#000",
            }}
          />
          <Legend 
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ paddingTop: '20px', color: darkMode ? '#E5E7EB' : '#374151' }}
          />
          <Bar dataKey="hours" name="Overtime Hours" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
