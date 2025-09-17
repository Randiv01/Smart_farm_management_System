import React, { useState, useEffect } from "react";
import { useITheme } from "../Icontexts/IThemeContext";
import { Search, Package, Truck, CheckCircle, XCircle, Clock, Mail } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Navbar from '../../UserHome/UHNavbar/UHNavbar';
import Footer from '../../UserHome/UHFooter/UHFooter';

const CustomerOrders = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  const fetchOrders = async (customerEmail) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/orders/customer/${customerEmail}`);
      setOrders(response.data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      fetchOrders(email);
    }
  };

  return (
    <>
      <Navbar />
      <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Order History</h1>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
            View your order history by entering your email address
          </p>
        </div>

        {/* Email Search Form */}
        <div className={`max-w-md mx-auto p-6 rounded-lg mb-8 ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={20}
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="Enter your email address"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
            >
              View My Orders
            </button>
          </form>
        </div>

        {/* Orders List */}
        {submitted && (
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4">Loading your orders...</p>
              </div>
            ) : orders.length > 0 ? (
              <div className={`rounded-lg overflow-hidden shadow-md ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Order #</th>
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
                            <button
                              onClick={() => navigate(`/InventoryManagement/orders/${order._id}`)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className={`text-center py-12 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
                <Package size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">No orders found</p>
                <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                  No orders found for {email}. Please check your email address.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default CustomerOrders;