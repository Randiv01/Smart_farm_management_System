// IDashboard.jsx
import React, { useState, useEffect } from "react";
import { useITheme } from "../Icontexts/IThemeContext";
import { FiTrendingUp, FiTrendingDown, FiDownload, FiAlertTriangle, FiBox, FiShoppingCart, FiGlobe, FiDollarSign } from "react-icons/fi";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { motion } from "framer-motion";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const IDashboard = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  
  // Set browser tab title
  useEffect(() => {
    document.title = "Farm Manager - Inventory Dashboard";
  }, []);

  // State for dashboard data
  const [dashboardData] = useState({
    totalStock: 695,
    exportStock: 275,
    localSales: 420,
    totalValue: 3290.05,
    stockByCategory: {
      vegetables: { weekly: 150, monthly: 100, yearly: 200, export: 50 },
      eggs: { weekly: 120, monthly: 80, yearly: 150, export: 40 },
      meat: { weekly: 90, monthly: 70, yearly: 120, export: 60 },
      milk: { weekly: 110, monthly: 90, yearly: 130, export: 70 },
      finals: { weekly: 80, monthly: 60, yearly: 100, export: 30 }
    },
    trends: {
      totalStock: 12,
      exportStock: 18,
      localSales: -3,
      totalValue: 7
    }
  });

  // Data for charts
  const stockByCategoryData = {
    labels: ['Vegetables', 'Eggs', 'Meat', 'Milk', 'Finals'],
    datasets: [
      {
        label: 'Weekly Stock',
        data: [
          dashboardData.stockByCategory.vegetables.weekly,
          dashboardData.stockByCategory.eggs.weekly,
          dashboardData.stockByCategory.meat.weekly,
          dashboardData.stockByCategory.milk.weekly,
          dashboardData.stockByCategory.finals.weekly
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      },
      {
        label: 'Monthly Stock',
        data: [
          dashboardData.stockByCategory.vegetables.monthly,
          dashboardData.stockByCategory.eggs.monthly,
          dashboardData.stockByCategory.meat.monthly,
          dashboardData.stockByCategory.milk.monthly,
          dashboardData.stockByCategory.finals.monthly
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
      {
        label: 'Yearly Stock',
        data: [
          dashboardData.stockByCategory.vegetables.yearly,
          dashboardData.stockByCategory.eggs.yearly,
          dashboardData.stockByCategory.meat.yearly,
          dashboardData.stockByCategory.milk.yearly,
          dashboardData.stockByCategory.finals.yearly
        ],
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
      },
      {
        label: 'Export Stock',
        data: [
          dashboardData.stockByCategory.vegetables.export,
          dashboardData.stockByCategory.eggs.export,
          dashboardData.stockByCategory.meat.export,
          dashboardData.stockByCategory.milk.export,
          dashboardData.stockByCategory.finals.export
        ],
        backgroundColor: 'rgba(255, 159, 64, 0.7)',
      },
    ],
  };

  const stockDistributionData = {
    labels: ['Vegetables', 'Eggs', 'Meat', 'Milk', 'Finals'],
    datasets: [
      {
        label: 'Stock Distribution',
        data: [150, 120, 90, 110, 80],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
        }
      },
      title: {
        display: true,
        color: darkMode ? '#e5e7eb' : '#374151',
      },
    },
    scales: {
      x: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#e5e7eb' : '#374151',
        }
      },
      y: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#e5e7eb' : '#374151',
        }
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
        }
      },
    },
  };

  // Function to generate report (placeholder)
  const generateReport = () => {
    // In a real application, this would generate and download a report
    alert("Report generation functionality would be implemented here");
  };

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Farm Overview</h1>
          <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Inventory summary and analytics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          {/* Total Stock Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-xl p-5 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Stock</h3>
                <p className="text-2xl font-bold mt-1">{dashboardData.totalStock}</p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? "bg-blue-900/20" : "bg-blue-100"}`}>
                <FiBox className={`text-xl ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
              </div>
            </div>
            <div className={`flex items-center mt-4 text-sm ${dashboardData.trends.totalStock > 0 ? "text-green-500" : "text-red-500"}`}>
              {dashboardData.trends.totalStock > 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
              <span>{Math.abs(dashboardData.trends.totalStock)}% {dashboardData.trends.totalStock > 0 ? "increase" : "decrease"} from last month</span>
            </div>
          </motion.div>

          {/* Export Stock Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`rounded-xl p-5 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Export Stock</h3>
                <p className="text-2xl font-bold mt-1">{dashboardData.exportStock}</p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? "bg-green-900/20" : "bg-green-100"}`}>
                <FiGlobe className={`text-xl ${darkMode ? "text-green-400" : "text-green-600"}`} />
              </div>
            </div>
            <div className={`flex items-center mt-4 text-sm ${dashboardData.trends.exportStock > 0 ? "text-green-500" : "text-red-500"}`}>
              {dashboardData.trends.exportStock > 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
              <span>{Math.abs(dashboardData.trends.exportStock)}% {dashboardData.trends.exportStock > 0 ? "increase" : "decrease"} from last month</span>
            </div>
          </motion.div>

          {/* Local Sales Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={`rounded-xl p-5 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Local Sales</h3>
                <p className="text-2xl font-bold mt-1">{dashboardData.localSales}</p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? "bg-purple-900/20" : "bg-purple-100"}`}>
                <FiShoppingCart className={`text-xl ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
              </div>
            </div>
            <div className={`flex items-center mt-4 text-sm ${dashboardData.trends.localSales > 0 ? "text-green-500" : "text-red-500"}`}>
              {dashboardData.trends.localSales > 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
              <span>{Math.abs(dashboardData.trends.localSales)}% {dashboardData.trends.localSales > 0 ? "increase" : "decrease"} from last month</span>
            </div>
          </motion.div>

          {/* Total Value Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className={`rounded-xl p-5 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Value</h3>
                <p className="text-2xl font-bold mt-1">${dashboardData.totalValue.toLocaleString()}</p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? "bg-amber-900/20" : "bg-amber-100"}`}>
                <FiDollarSign className={`text-xl ${darkMode ? "text-amber-400" : "text-amber-600"}`} />
              </div>
            </div>
            <div className={`flex items-center mt-4 text-sm ${dashboardData.trends.totalValue > 0 ? "text-green-500" : "text-red-500"}`}>
              {dashboardData.trends.totalValue > 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
              <span>{Math.abs(dashboardData.trends.totalValue)}% {dashboardData.trends.totalValue > 0 ? "increase" : "decrease"} from last month</span>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Stock by Category Chart */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className={`rounded-xl p-4 md:p-6 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"} h-80`}
          >
            <h3 className="text-lg font-semibold mb-4">Stock by Category</h3>
            <Bar data={stockByCategoryData} options={chartOptions} />
          </motion.div>

          {/* Stock Distribution Chart */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className={`rounded-xl p-4 md:p-6 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"} h-80`}
          >
            <h3 className="text-lg font-semibold mb-4">Stock Distribution</h3>
            <Doughnut data={stockDistributionData} options={doughnutOptions} />
          </motion.div>
        </div>

        {/* Additional Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Generate Report Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-xl p-6 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"} flex flex-col justify-between`}
          >
            <div>
              <h3 className="text-lg font-semibold mb-2">Generate Report</h3>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mb-4`}>
                Download a detailed inventory report for analysis and record keeping.
              </p>
            </div>
            <button
              onClick={generateReport}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              <FiDownload className="text-lg" />
              <span>Download Report</span>
            </button>
          </motion.div>

          {/* Low Stock Alerts */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`rounded-xl p-6 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="flex items-center mb-4">
              <div className={`p-2 rounded-lg mr-3 ${darkMode ? "bg-red-900/20" : "bg-red-100"}`}>
                <FiAlertTriangle className={`text-xl ${darkMode ? "text-red-400" : "text-red-600"}`} />
              </div>
              <h3 className="text-lg font-semibold">Low Stock Alerts</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex justify-between items-center">
                <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Organic Eggs</span>
                <span className="text-sm font-medium text-red-500">12 units left</span>
              </li>
              <li className="flex justify-between items-center">
                <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Fresh Milk</span>
                <span className="text-sm font-medium text-red-500">18 units left</span>
              </li>
              <li className="flex justify-between items-center">
                <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Tomatoes</span>
                <span className="text-sm font-medium text-amber-500">22 units left</span>
              </li>
            </ul>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`rounded-xl p-6 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <ul className="space-y-4">
              <li>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <span className="font-medium">200kg</span> of vegetables added to inventory
                </p>
                <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>2 hours ago</p>
              </li>
              <li>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <span className="font-medium">50 units</span> of eggs sold to local market
                </p>
                <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>5 hours ago</p>
              </li>
              <li>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <span className="font-medium">30 units</span> of meat exported to Germany
                </p>
                <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Yesterday</p>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default IDashboard;