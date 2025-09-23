import React, { useState, useEffect } from "react";
import {
  Search,
  FileDown,
  ChevronDown,
  DollarSign,
  FileText,
} from "lucide-react";
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
import Loader from "../Loader/Loader.js";
import { useETheme } from '../Econtexts/EThemeContext.jsx';

export const SalaryDesk = () => {
  const { theme } = useETheme();
  const darkMode = theme === 'dark';
  const [activeTab, setActiveTab] = useState("payroll");
  const [showLoader, setShowLoader] = useState(true);

  const salaryRecords = [
    {
      id: "SAL001",
      employee: "John Smith",
      position: "Farm Manager",
      basic: "$2,800",
      overtime: "$320",
      allowances: "$450",
      deductions: "$380",
      total: "$3,190",
      status: "Paid",
    },
    {
      id: "SAL002",
      employee: "Sarah Johnson",
      position: "Crop Specialist",
      basic: "$2,200",
      overtime: "$180",
      allowances: "$320",
      deductions: "$290",
      total: "$2,410",
      status: "Paid",
    },
    {
      id: "SAL003",
      employee: "Michael Brown",
      position: "Equipment Technician",
      basic: "$1,800",
      overtime: "$420",
      allowances: "$250",
      deductions: "$240",
      total: "$2,230",
      status: "Processing",
    },
    {
      id: "SAL004",
      employee: "Emily Davis",
      position: "Livestock Supervisor",
      basic: "$2,100",
      overtime: "$260",
      allowances: "$300",
      deductions: "$270",
      total: "$2,390",
      status: "Paid",
    },
    {
      id: "SAL005",
      employee: "David Wilson",
      position: "Irrigation Specialist",
      basic: "$1,900",
      overtime: "$150",
      allowances: "$280",
      deductions: "$250",
      total: "$2,080",
      status: "Processing",
    },
  ];

  const chartData = [
    { name: "Jan", amount: 8500 },
    { name: "Feb", amount: 9200 },
    { name: "Mar", amount: 9800 },
    { name: "Apr", amount: 10500 },
    { name: "May", amount: 11200 },
    { name: "Jun", amount: 12300 },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (showLoader) {
    return <Loader darkMode={darkMode} />;
  }

  return (
    <div className={`h-full ${darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-800"}`}>
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("payroll")}
            className={`px-4 py-2 text-base font-medium transition-all ${
              activeTab === "payroll"
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : darkMode
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Payroll
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 text-base font-medium transition-all ${
              activeTab === "reports"
                ? "border-b-2 border-blue-600 text-blue-400"
                : darkMode
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Salary Reports
          </button>
        </div>

        <div className={`rounded-2xl shadow-xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          {/* Payroll Tab */}
          {activeTab === "payroll" && (
            <>
              {/* Toolbar */}
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex gap-3">
                  <div className={`flex items-center ${darkMode ? "bg-gray-700" : "bg-gray-100"} px-3 py-2 rounded-xl shadow-sm`}>
                    <Search size={18} className={darkMode ? "text-gray-300" : "text-gray-500"} />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      className={`ml-2 bg-transparent outline-none text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}
                    />
                  </div>
                  <div className={`flex items-center ${darkMode ? "bg-gray-700" : "bg-gray-100"} px-3 py-2 rounded-xl shadow-sm`}>
                    <input
                      type="month"
                      defaultValue="2023-09"
                      className={`bg-transparent outline-none text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-sm transition transform hover:scale-[1.01]">
                    <DollarSign size={18} />
                    <span>Process Payroll</span>
                  </button>
                  <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow-sm transition transform hover:scale-[1.01]">
                    <FileDown size={18} />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`rounded-xl shadow-lg p-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                  <h4 className="text-sm font-medium">Total Payroll</h4>
                  <div className="flex justify-between mt-2">
                    <p className="text-2xl font-bold text-green-500">$12,300</p>
                    <p className="text-sm text-gray-400">This month</p>
                  </div>
                </div>
                <div className={`rounded-xl shadow-lg p-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                  <h4 className="text-sm font-medium">Overtime Pay</h4>
                  <div className="flex justify-between mt-2">
                    <p className="text-2xl font-bold text-orange-500">$1,330</p>
                    <p className="text-sm text-gray-400">This month</p>
                  </div>
                </div>
                <div className={`rounded-xl shadow-lg p-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                  <h4 className="text-sm font-medium">Pending Payments</h4>
                  <div className="flex justify-between mt-2">
                    <p className="text-2xl font-bold text-yellow-500">$4,310</p>
                    <p className="text-sm text-gray-400">2 employees</p>
                  </div>
                </div>
              </div>

              {/* Payroll Table */}
              <div className={`overflow-hidden rounded-xl ${darkMode ? "bg-gray-800" : "bg-gray-50"} shadow-lg`}>
                <table className="w-full text-sm">
                  <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-100"} uppercase text-xs`}>
                    <tr>
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Employee</th>
                      <th className="px-4 py-3 text-left">Position</th>
                      <th className="px-4 py-3 text-left">Basic</th>
                      <th className="px-4 py-3 text-left">Overtime</th>
                      <th className="px-4 py-3 text-left">Total</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryRecords.map((record) => (
                      <tr
                        key={record.id}
                        className={`hover:${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
                      >
                        <td className="px-4 py-3">{record.id}</td>
                        <td className="px-4 py-3">{record.employee}</td>
                        <td className="px-4 py-3">{record.position}</td>
                        <td className="px-4 py-3">{record.basic}</td>
                        <td className="px-4 py-3">{record.overtime}</td>
                        <td className="px-4 py-3 font-semibold">{record.total}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === "Paid"
                                ? darkMode
                                  ? "bg-green-900/30 text-green-400"
                                  : "bg-green-100 text-green-700"
                                : darkMode
                                ? "bg-yellow-900/30 text-yellow-400"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className={`p-1 rounded hover:${darkMode ? "bg-gray-600" : "bg-gray-200"}`}>
                            <FileText size={16} className="text-blue-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Salary Reports</h3>
                <div className="flex gap-3">
                  <select className={`px-3 py-2 rounded-xl ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"} shadow-sm`}>
                    <option>Last 6 Months</option>
                    <option>This Year</option>
                    <option>Last Year</option>
                    <option>Custom Range</option>
                  </select>
                  <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow-sm transition transform hover:scale-[1.01]">
                    <FileDown size={18} />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div className={`rounded-xl p-6 mb-6 ${darkMode ? "bg-gray-800" : "bg-gray-50"} shadow-lg`}>
                <h4 className="font-medium mb-4">Monthly Payroll Trend</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                      <XAxis dataKey="name" stroke={darkMode ? "#9CA3AF" : "#374151"} />
                      <YAxis stroke={darkMode ? "#9CA3AF" : "#374151"} />
                      <Tooltip
                        formatter={(value) => [`$${value}`, "Amount"]}
                        contentStyle={{
                          backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                          border: darkMode ? "1px solid #4B5563" : "1px solid #E5E7EB",
                          color: darkMode ? "#F3F4F6" : "#374151",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="amount" name="Payroll Amount" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Distribution */}
              <div className={`rounded-xl p-6 ${darkMode ? "bg-gray-800" : "bg-gray-50"} shadow-lg`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Salary Distribution by Department</h4>
                  <button className="flex items-center gap-1 text-sm">
                    <span>This Month</span>
                    <ChevronDown size={16} className={darkMode ? "text-gray-300" : "text-gray-500"} />
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Farm Operations</span>
                      <span>$4,800</span>
                    </div>
                    <div className={`w-full ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
                      <div className="bg-green-500 h-2 rounded-full w-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Crop Management</span>
                      <span>$3,200</span>
                    </div>
                    <div className={`w-full ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
                      <div className="bg-green-500 h-2 rounded-full w-2/3"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Livestock</span>
                      <span>$2,500</span>
                    </div>
                    <div className={`w-full ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
                      <div className="bg-green-500 h-2 rounded-full w-1/2"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Administration</span>
                      <span>$1,800</span>
                    </div>
                    <div className={`w-full ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
                      <div className="bg-green-500 h-2 rounded-full w-2/5"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryDesk;