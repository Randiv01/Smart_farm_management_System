import React, { useState, useEffect } from "react";
import { useITheme } from "../Icontexts/IThemeContext";
import { Search, Filter, Calendar, Package, Truck, CheckCircle, XCircle, Clock, DollarSign, Edit, Mail, RefreshCw, X, User, MapPin, Phone, CreditCard, Trash2, TrendingUp, BarChart3, PieChart as PieChartIcon, Zap, AlertCircle, Send, Download } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const Orders = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
 
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [emailSearch, setEmailSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [chartData, setChartData] = useState({});
  const [activeChartTab, setActiveChartTab] = useState("profit");
  const [showChart, setShowChart] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" }
  ];

  const statusTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: []
  };

  // Chart color schemes for dark/light mode
  const COLORS = {
    delivered: darkMode ? '#86efac' : '#22c55e',
    processing: darkMode ? '#fde047' : '#eab308',
    pending: darkMode ? '#fdba74' : '#f97316',
    shipped: darkMode ? '#a5b4fc' : '#6366f1',
    cancelled: darkMode ? '#fca5a5' : '#ef4444',
    primary: darkMode ? '#86efac' : '#22c55e',
    secondary: darkMode ? '#107703ff' : '#02751eff',
    accent: darkMode ? '#1ef81eff' : '#4bf916ff',
    background: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#e5e7eb' : '#374151',
    grid: darkMode ? '#4b5563' : '#e5e7eb'
  };

  // Clear success messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch orders from API
  useEffect(() => {
    fetchOrders();
    fetchStats();
    fetchChartData();
  }, [selectedStatus, searchTerm, currentPage, emailSearch]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10
      };
     
      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }
     
      if (searchTerm) {
        params.search = searchTerm;
      }
     
      if (emailSearch) {
        params.email = emailSearch;
      }
     
      const response = await axios.get("http://localhost:5000/api/orders", {
        params,
        withCredentials: true
      });
     
      setOrders(response.data.orders);
      setTotalPages(response.data.totalPages);
      setError("");
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/orders/stats", {
        withCredentials: true
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchChartData = async () => {
    try {
      const monthlyData = [
        { month: 'Jan', revenue: 4500, profit: 3200, orders: 45 },
        { month: 'Feb', revenue: 5200, profit: 3800, orders: 52 },
        { month: 'Mar', revenue: 4800, profit: 3500, orders: 48 },
        { month: 'Apr', revenue: 6100, profit: 4500, orders: 61 },
        { month: 'May', revenue: 5800, profit: 4200, orders: 58 },
        { month: 'Jun', revenue: 7200, profit: 5300, orders: 72 },
        { month: 'Jul', revenue: 6900, profit: 5100, orders: 69 },
        { month: 'Aug', revenue: 7800, profit: 5800, orders: 78 },
        { month: 'Sep', revenue: 8200, profit: 6200, orders: 82 },
        { month: 'Oct', revenue: 7500, profit: 5600, orders: 75 },
        { month: 'Nov', revenue: 8900, profit: 6700, orders: 89 },
        { month: 'Dec', revenue: 9500, profit: 7200, orders: 95 }
      ];

      const statusDistribution = [
        { name: 'Delivered', value: 65, color: COLORS.delivered },
        { name: 'Processing', value: 15, color: COLORS.processing },
        { name: 'Pending', value: 10, color: COLORS.pending },
        { name: 'Shipped', value: 8, color: COLORS.shipped },
        { name: 'Cancelled', value: 2, color: COLORS.cancelled }
      ];

      const weeklyTrend = [
        { day: 'Mon', profit: 1200, revenue: 1500 },
        { day: 'Tue', profit: 1800, revenue: 2200 },
        { day: 'Wed', profit: 1500, revenue: 1900 },
        { day: 'Thu', profit: 2200, revenue: 2800 },
        { day: 'Fri', profit: 2500, revenue: 3200 },
        { day: 'Sat', profit: 3000, revenue: 3800 },
        { day: 'Sun', profit: 2800, revenue: 3500 }
      ];

      setChartData({
        monthly: monthlyData,
        statusDistribution,
        weeklyTrend
      });
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleEmailSearch = (e) => {
    setEmailSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(orderId);
      await axios.patch(`http://localhost:5000/api/orders/${orderId}/status`, {
        status: newStatus
      }, {
        withCredentials: true
      });
     
      fetchOrders();
      fetchStats();
      setSuccess(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      setError("Failed to update order status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      setUpdatingStatus(orderId);
      await axios.delete(`http://localhost:5000/api/orders/${orderId}`, {
        withCredentials: true
      });
     
      fetchOrders();
      fetchStats();
      setSuccess("Order deleted successfully");
    } catch (error) {
      console.error("Error deleting order:", error);
      setError("Failed to delete order");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const sendStatusEmail = async (orderId, customerEmail, status) => {
    try {
      await axios.post(`http://localhost:5000/api/orders/${orderId}/notify`, {
        email: customerEmail,
        status: status
      }, {
        withCredentials: true
      });
     
      setSuccess(`Notification email sent to ${customerEmail}`);
    } catch (error) {
      console.error("Error sending email:", error);
      setError("Failed to send notification email");
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-yellow-500" />;
      case 'confirmed': return <CheckCircle size={16} className="text-blue-500" />;
      case 'processing': return <Package size={16} className="text-indigo-500" />;
      case 'shipped': return <Truck size={16} className="text-orange-500" />;
      case 'delivered': return <CheckCircle size={16} className="text-green-500" />;
      case 'cancelled': return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'processing': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'shipped': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Chart components
  const renderProfitChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData.monthly}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
        <XAxis dataKey="month" stroke={COLORS.text} />
        <YAxis stroke={COLORS.text} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: COLORS.background,
            border: `1px solid ${COLORS.grid}`,
            borderRadius: '4px',
            padding: '8px',
            color: COLORS.text
          }}
        />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="profit" 
          stroke={COLORS.primary} 
          fill={COLORS.primary}
          fillOpacity={0.3}
          name="Profit"
        />
        <Area 
          type="monotone" 
          dataKey="revenue" 
          stroke={COLORS.secondary} 
          fill={COLORS.secondary}
          fillOpacity={0.3}
          name="Revenue"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderOrderTrendsChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData.monthly}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
        <XAxis dataKey="month" stroke={COLORS.text} />
        <YAxis stroke={COLORS.text} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: COLORS.background,
            border: `1px solid ${COLORS.grid}`,
            borderRadius: '4px',
            padding: '8px',
            color: COLORS.text
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="orders" 
          stroke={COLORS.accent} 
          strokeWidth={3}
          dot={{ fill: COLORS.accent, strokeWidth: 2, r: 4 }}
          name="Orders"
        />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke={COLORS.secondary} 
          strokeWidth={2}
          dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 4 }}
          name="Revenue"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderWeeklyPerformanceChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData.weeklyTrend}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
        <XAxis dataKey="day" stroke={COLORS.text} />
        <YAxis stroke={COLORS.text} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: COLORS.background,
            border: `1px solid ${COLORS.grid}`,
            borderRadius: '4px',
            padding: '8px',
            color: COLORS.text
          }}
        />
        <Legend />
        <Bar dataKey="profit" fill={COLORS.primary} name="Profit" radius={[4, 4, 0, 0]} />
        <Bar dataKey="revenue" fill={COLORS.secondary} name="Revenue" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderStatusDistributionChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={chartData.statusDistribution}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          label={({ name, value }) => value > 0 ? `${name}: ${value}` : null}
        >
          {chartData.statusDistribution.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: COLORS.background,
            border: `1px solid ${COLORS.grid}`,
            borderRadius: '4px',
            padding: '8px',
            color: COLORS.text
          }}
        />
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
      </RechartsPieChart>
    </ResponsiveContainer>
  );

  if (loading) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Package className="text-green-500" size={32} />
            Order Management
          </h1>
          <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            View and manage all customer orders with detailed analytics
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${darkMode ? "bg-green-900/30 text-green-200" : "bg-green-100 text-green-800"} shadow-sm`}>
            <Zap size={20} className="mr-3 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${darkMode ? "bg-red-900/30 text-red-200" : "bg-red-100 text-red-800"} shadow-sm`}>
            <AlertCircle size={20} className="mr-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
            <div className={`p-3 rounded-full ${darkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
              <Package className="text-blue-500" size={24} />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Total Orders</h3>
              <p className="text-2xl font-bold">{stats.totalOrders || 0}</p>
            </div>
          </div>
          
          <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
            <div className={`p-3 rounded-full ${darkMode ? "bg-yellow-900/30" : "bg-yellow-100"}`}>
              <Clock className="text-yellow-500" size={24} />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Pending</h3>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingOrders || 0}</p>
            </div>
          </div>
          
          <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
            <div className={`p-3 rounded-full ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}>
              <CheckCircle className="text-green-500" size={24} />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Completed</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.deliveredOrders || 0}</p>
            </div>
          </div>
          
          <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
            <div className={`p-3 rounded-full ${darkMode ? "bg-purple-900/30" : "bg-purple-100"}`}>
              <DollarSign className="text-purple-500" size={24} />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Total Revenue</h3>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">${(stats.totalRevenue || (stats.totalOrders * 50)).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Quick Action Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => handleStatusChange("all")}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedStatus === "all" ? "bg-green-600 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => handleStatusChange("pending")}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedStatus === "pending" ? "bg-yellow-600 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => handleStatusChange("processing")}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedStatus === "processing" ? "bg-blue-600 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Processing
          </button>
          <button
            onClick={() => handleStatusChange("shipped")}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedStatus === "shipped" ? "bg-orange-600 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Shipped
          </button>
          <button
            onClick={() => handleStatusChange("delivered")}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedStatus === "delivered" ? "bg-green-600 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Delivered
          </button>
        </div>

        {/* Search and Filters */}
        <div className={`p-6 rounded-xl shadow-lg mb-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  size={20}
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                />
                <input
                  type="text"
                  placeholder="Search by order number, customer name, or email..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchOrders}
                className={`p-2.5 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all`}
                title="Refresh Data"
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={() => setShowChart(!showChart)}
                className={`p-2.5 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all`}
                title={showChart ? "Hide Charts" : "Show Charts"}
              >
                <PieChartIcon size={20} />
              </button>
              <Filter size={20} className={darkMode ? "text-gray-400" : "text-gray-500"} />
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`px-3 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {showChart && (
          <div className={`mb-8 rounded-xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center">
                  <BarChart3 className="mr-2" size={24} />
                  Order Analytics
                </h2>
                <div className="flex space-x-2">
                  {['profit', 'trends', 'weekly', 'status'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveChartTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeChartTab === tab
                          ? 'bg-green-600 text-white'
                          : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tab === 'profit' && 'Profit vs Revenue'}
                      {tab === 'trends' && 'Order Trends'}
                      {tab === 'weekly' && 'Weekly Performance'}
                      {tab === 'status' && 'Status Distribution'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {activeChartTab === 'profit' && renderProfitChart()}
              {activeChartTab === 'trends' && renderOrderTrendsChart()}
              {activeChartTab === 'weekly' && renderWeeklyPerformanceChart()}
              {activeChartTab === 'status' && renderStatusDistributionChart()}
            </div>
          </div>
        )}

        {/* Orders Table */}
        {orders.length > 0 ? (
          <>
            <div className={`rounded-lg overflow-hidden shadow-md ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Order #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.map((order) => (
                      <tr key={order._id} className={darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{order.orderNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium">{order.customer.name}</div>
                            <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {order.customer.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{formatDate(order.orderDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{order.items.length} items</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">${order.totalAmount.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => viewOrderDetails(order)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 text-left flex items-center"
                            >
                              <Edit size={12} className="mr-1" />
                              View Details
                            </button>
                           
                            {statusTransitions[order.status] && statusTransitions[order.status].length > 0 && (
                              <div className="relative inline-block text-left">
                                <select
                                  onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                  disabled={updatingStatus === order._id}
                                  className={`text-xs p-1 rounded border ${
                                    darkMode
                                      ? 'bg-gray-700 text-white border-gray-600'
                                      : 'bg-white text-gray-900 border-gray-300'
                                  }`}
                                >
                                  <option value="">Update Status</option>
                                  {statusTransitions[order.status].map(status => (
                                    <option key={status} value={status}>
                                      Mark as {status}
                                    </option>
                                  ))}
                                </select>
                                {updatingStatus === order._id && (
                                  <RefreshCw size={12} className="animate-spin ml-1 inline" />
                                )}
                              </div>
                            )}
                           
                            <button
                              onClick={() => sendStatusEmail(order._id, order.customer.email, order.status)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-left text-xs flex items-center"
                            >
                              <Mail size={12} className="mr-1" />
                              Notify Customer
                            </button>
                           
                            <button
                              onClick={() => deleteOrder(order._id)}
                              disabled={updatingStatus === order._id}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-left text-xs flex items-center"
                            >
                              <Trash2 size={12} className="mr-1" />
                              Delete Order
                              {updatingStatus === order._id && (
                                <RefreshCw size={12} className="animate-spin ml-1 inline" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''} ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-300'}`}
                  >
                    Previous
                  </button>
                 
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === page
                          ? 'bg-green-600 text-white'
                          : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                 
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''} ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-300'}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={`text-center py-12 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">No orders found</p>
            <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
              {searchTerm || selectedStatus !== "all" || emailSearch
                ? "Try adjusting your search or filter criteria."
                : "No orders have been placed yet."}
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={closeOrderModal}
              />
             
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative z-50 w-full max-w-4xl p-6 rounded-lg shadow-xl ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
              >
                <button
                  onClick={closeOrderModal}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X size={24} />
                </button>
               
                <h2 className="text-2xl font-bold mb-6">Order Details - #{selectedOrder.orderNumber}</h2>
               
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Customer Information */}
                  <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <User size={20} className="mr-2" />
                      Customer Information
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedOrder.customer.name}</p>
                      <p><span className="font-medium">Email:</span> {selectedOrder.customer.email}</p>
                      <p><span className="font-medium">Phone:</span> {selectedOrder.customer.phone || "Not provided"}</p>
                    </div>
                  </div>
                 
                  {/* Shipping Information */}
                  <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <MapPin size={20} className="mr-2" />
                      Shipping Address
                    </h3>
                    <div className="space-y-2">
                      <p>{selectedOrder.customer.address || "Not provided"}</p>
                      <p>{selectedOrder.customer.city}</p>
                    </div>
                  </div>
                </div>
               
                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                  <div className={`rounded-lg overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <table className="w-full">
                      <thead className={darkMode ? "bg-gray-600" : "bg-gray-200"}>
                        <tr>
                          <th className="px-4 py-2 text-left">Product</th>
                          <th className="px-4 py-2 text-left">Quantity</th>
                          <th className="px-4 py-2 text-left">Price</th>
                          <th className="px-4 py-2 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index} className={darkMode ? "border-b border-gray-600" : "border-b border-gray-200"}>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="ml-3">
                                  <p className="font-medium">{item.name}</p>
                                  {item.sku && <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {item.sku}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3">${item.price?.toFixed(2)}</td>
                            <td className="px-4 py-3">${(item.quantity * item.price)?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
               
                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <CreditCard size={20} className="mr-2" />
                      Payment Information
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Payment Method:</span> {selectedOrder.paymentMethod || "Not specified"}</p>
                      <p><span className="font-medium">Payment Status:</span> {selectedOrder.paymentStatus || "Not specified"}</p>
                      <p><span className="font-medium">Transaction ID:</span> {selectedOrder.transactionId || "Not available"}</p>
                    </div>
                  </div>
                 
                  <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>${selectedOrder.shipping?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${selectedOrder.tax?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t dark:border-gray-600 border-gray-200">
                        <span>Total:</span>
                        <span>${selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>
               
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeOrderModal}
                    className={`px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;