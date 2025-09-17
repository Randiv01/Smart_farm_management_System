import React, { useState, useEffect } from "react";
import { useITheme } from "../Icontexts/IThemeContext";
import { Search, Filter, Calendar, Package, Truck, CheckCircle, XCircle, Clock, DollarSign, Edit, Mail, RefreshCw } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Import the top navigation bar components
import { FiTrendingUp, FiTrendingDown, FiDownload, FiAlertTriangle, FiBox, FiShoppingCart, FiGlobe, FiDollarSign } from "react-icons/fi";

const Orders = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [emailSearch, setEmailSearch] = useState("");

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

  // Fetch orders from API
  useEffect(() => {
    fetchOrders();
    fetchStats();
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
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/orders/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
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
      });
      
      // Refresh orders list
      fetchOrders();
      fetchStats();
      
      // Show success message
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const sendStatusEmail = async (orderId, customerEmail, status) => {
    try {
      // This would call your backend API to send an email
      await axios.post(`http://localhost:5000/api/orders/${orderId}/notify`, {
        email: customerEmail,
        status: status
      });
      
      alert(`Notification email sent to ${customerEmail}`);
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send notification email");
    }
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

  if (loading) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Management</h1>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
            View and manage all customer orders
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-xl p-5 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                <Package size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders || 0}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`rounded-xl p-5 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300">
                <Clock size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingOrders || 0}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={`rounded-xl p-5 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
                <CheckCircle size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold">{stats.completedOrders || 0}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className={`rounded-xl p-5 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                <DollarSign size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue || 0}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="relative w-full md:max-w-md">
              <Search
                size={20}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="text"
                placeholder="Search orders by number, name, or email..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="relative w-full md:max-w-md">
              <Mail
                size={20}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="email"
                placeholder="Filter by customer email..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                value={emailSearch}
                onChange={handleEmailSearch}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={20} className={darkMode ? "text-gray-400" : "text-gray-500"} />
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

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
                              onClick={() => navigate(`/InventoryManagement/orders/${order._id}`)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 text-left"
                            >
                              View Details
                            </button>
                            
                            {/* Status Update Dropdown */}
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
                            
                            {/* Send Notification Button */}
                            <button
                              onClick={() => sendStatusEmail(order._id, order.customer.email, order.status)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-left text-xs flex items-center"
                            >
                              <Mail size={12} className="mr-1" />
                              Notify Customer
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
                    className={`p-2 rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''} ${
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-300'
                    }`}
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
                    className={`p-2 rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''} ${
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-300'
                    }`}
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
    </div>
  );
};

export default Orders;