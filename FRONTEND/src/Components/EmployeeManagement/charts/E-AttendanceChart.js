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

export const AttendanceChart = ({ data: propData }) => {
  const { theme } = useETheme();
  const darkMode = theme === 'dark';
  
  // Use prop data if available, otherwise use default data
  const data = propData && propData.length > 0 ? propData : [
    { name: "Mon", present: 45, absent: 3, leave: 0, attendanceRate: 94 },
    { name: "Tue", present: 42, absent: 4, leave: 2, attendanceRate: 88 },
    { name: "Wed", present: 40, absent: 5, leave: 3, attendanceRate: 83 },
    { name: "Thu", present: 43, absent: 2, leave: 3, attendanceRate: 90 },
    { name: "Fri", present: 38, absent: 6, leave: 4, attendanceRate: 79 },
    { name: "Sat", present: 35, absent: 8, leave: 5, attendanceRate: 73 },
    { name: "Sun", present: 30, absent: 10, leave: 8, attendanceRate: 63 },
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? "#374151" : "#e5e7eb"}
          />
          <XAxis dataKey="name" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? "#374151" : "#fff",
              borderColor: darkMode ? "#4b5563" : "#e5e7eb",
              color: darkMode ? "#fff" : "#000",
            }}
          />
          <Legend />
          <Bar dataKey="present" name="Present" fill="#22c55e" />
          <Bar dataKey="absent" name="Absent" fill="#ef4444" />
          <Bar dataKey="leave" name="Leave" fill="#f59e0b" />
          <Bar dataKey="attendanceRate" name="Attendance Rate %" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
