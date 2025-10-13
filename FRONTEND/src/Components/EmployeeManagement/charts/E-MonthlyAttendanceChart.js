import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useETheme } from '../Econtexts/EThemeContext.jsx';

export const MonthlyAttendanceChart = ({ data: propData }) => {
  const { theme } = useETheme();
  const darkMode = theme === 'dark';
  
  // Use prop data if available, otherwise use default data
  const data = propData && propData.length > 0 ? propData : [
    { month: "Jul 2024", present: 45, absent: 5, attendanceRate: 90 },
    { month: "Aug 2024", present: 48, absent: 2, attendanceRate: 96 },
    { month: "Sep 2024", present: 42, absent: 8, attendanceRate: 84 },
    { month: "Oct 2024", present: 46, absent: 4, attendanceRate: 92 },
    { month: "Nov 2024", present: 44, absent: 6, attendanceRate: 88 },
    { month: "Dec 2024", present: 47, absent: 3, attendanceRate: 94 },
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />
          <XAxis 
            dataKey="month" 
            stroke={darkMode ? "#9ca3af" : "#6b7280"}
            fontSize={12}
          />
          <YAxis 
            stroke={darkMode ? "#9ca3af" : "#6b7280"}
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? "#374151" : "#fff",
              borderColor: darkMode ? "#4b5563" : "#e5e7eb",
              color: darkMode ? "#fff" : "#000",
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="present" 
            stroke="#22c55e" 
            strokeWidth={3}
            name="Present"
            dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="absent" 
            stroke="#ef4444" 
            strokeWidth={3}
            name="Absent"
            dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="attendanceRate" 
            stroke="#3b82f6" 
            strokeWidth={3}
            name="Attendance Rate %"
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
