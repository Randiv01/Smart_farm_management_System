import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { FileDown, Filter, Plus, ChevronDown } from 'lucide-react';

export const OvertimeMonitor = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState('records');

  const overtimeRecords = [
    { id: 'OT001', employee: 'John Smith', date: '2023-09-25', regularHours: '8:00', overtimeHours: '2:30', totalHours: '10:30', status: 'Approved' },
    { id: 'OT002', employee: 'Sarah Johnson', date: '2023-09-26', regularHours: '8:00', overtimeHours: '1:45', totalHours: '9:45', status: 'Approved' },
    { id: 'OT003', employee: 'Michael Brown', date: '2023-09-27', regularHours: '8:00', overtimeHours: '3:00', totalHours: '11:00', status: 'Pending' },
    { id: 'OT004', employee: 'Emily Davis', date: '2023-09-28', regularHours: '8:00', overtimeHours: '2:15', totalHours: '10:15', status: 'Approved' },
    { id: 'OT005', employee: 'David Wilson', date: '2023-09-29', regularHours: '8:00', overtimeHours: '1:30', totalHours: '9:30', status: 'Pending' }
  ];

  const chartData = [
    { name: 'Week 1', hours: 42 },
    { name: 'Week 2', hours: 56 },
    { name: 'Week 3', hours: 48 },
    { name: 'Week 4', hours: 61 },
    { name: 'Week 5', hours: 52 }
  ];

  return (
    <div className={`p-4 space-y-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      
      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('records')}
          className={`pb-2 ${activeTab === 'records' ? 'border-b-2 border-blue-500 text-blue-500 font-semibold' : 'text-gray-500'}`}
        >
          Overtime Records
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-2 ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-500 font-semibold' : 'text-gray-500'}`}
        >
          Analytics
        </button>
      </div>

      {/* Records Tab */}
      {activeTab === 'records' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <input type="month" defaultValue="2023-09" className="border rounded-md px-2 py-1 dark:bg-gray-800 dark:border-gray-700" />
              <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
                <Filter size={18} />
                <span>Filter</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                <Plus size={18} />
                <span>Add Record</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">
                <FileDown size={18} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-xl shadow bg-white dark:bg-gray-800">
              <h4 className="text-sm text-gray-500">Total Overtime Hours</h4>
              <p className="text-2xl font-bold text-orange-500">87</p>
              <p className="text-xs text-gray-400">This month</p>
            </div>
            <div className="p-4 rounded-xl shadow bg-white dark:bg-gray-800">
              <h4 className="text-sm text-gray-500">Average Per Employee</h4>
              <p className="text-2xl font-bold text-blue-500">5.8</p>
              <p className="text-xs text-gray-400">Hours/month</p>
            </div>
            <div className="p-4 rounded-xl shadow bg-white dark:bg-gray-800">
              <h4 className="text-sm text-gray-500">Pending Approval</h4>
              <p className="text-2xl font-bold text-yellow-500">12</p>
              <p className="text-xs text-gray-400">Records</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-6">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  {['ID','Employee','Date','Regular Hours','Overtime Hours','Total Hours','Status'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-sm font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overtimeRecords.map((record) => (
                  <tr key={record.id} className="border-t dark:border-gray-700">
                    <td className="px-4 py-2">{record.id}</td>
                    <td className="px-4 py-2">{record.employee}</td>
                    <td className="px-4 py-2">{record.date}</td>
                    <td className="px-4 py-2">{record.regularHours}</td>
                    <td className="px-4 py-2">{record.overtimeHours}</td>
                    <td className="px-4 py-2">{record.totalHours}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold 
                        ${record.status === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Overtime Analytics</h3>
            <div className="flex items-center gap-3">
              <select className="border rounded-md px-2 py-1 dark:bg-gray-800 dark:border-gray-700">
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>This Year</option>
                <option>Custom Range</option>
              </select>
              <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">
                <FileDown size={18} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="p-4 rounded-xl shadow bg-white dark:bg-gray-800">
            <h4 className="mb-4 font-medium">Monthly Overtime Trend</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hours" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Employees */}
          <div className="p-4 rounded-xl shadow bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Top Overtime Employees</h4>
              <button className="flex items-center gap-1 text-sm">
                <span>This Month</span>
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Michael Brown', hours: '15.5', w: '100%' },
                { name: 'John Smith', hours: '12.75', w: '82%' },
                { name: 'Emily Davis', hours: '10.25', w: '66%' },
                { name: 'Sarah Johnson', hours: '8.5', w: '55%' },
                { name: 'David Wilson', hours: '6.25', w: '40%' }
              ].map((emp, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm">
                    <span>{emp.name}</span>
                    <span>{emp.hours} hours</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: emp.w }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
