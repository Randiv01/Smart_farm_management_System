import React, { useState, useEffect } from "react";
import { 
  Search, 
  Mail, 
  MessageSquare, 
  Send,
  X,
  AlertCircle,
  Calendar,
  Download,
  Filter,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  BarChart3,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useITheme } from "../Icontexts/IThemeContext";
import axios from "axios";
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
  Cell
} from "recharts";

const Expiry = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationChannels, setNotificationChannels] = useState({
    email: true,
    sms: false,
    whatsapp: false
  });
  const [showChart, setShowChart] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'expiryDate', direction: 'asc' });

  // Improved color palette for consistency and accessibility
  const COLORS = {
    expired: darkMode ? '#fca5a5' : '#ef4444',        // Red shades
    expiringSoon: darkMode ? '#fdba74' : '#f97316',   // Orange shades
    expiringLater: darkMode ? '#fde047' : '#eab308',  // Yellow shades
    safe: darkMode ? '#86efac' : '#22c55e',           // Green shades
    background: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#e5e7eb' : '#374151',
    grid: darkMode ? '#4b5563' : '#e5e7eb'
  };

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/inventory/products");
      setInventory(response.data.products);
      setError("");
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update notification message when selection changes
  useEffect(() => {
    if (selectedProducts.length === 0) {
      setNotificationMessage("");
      return;
    }

    const products = selectedProducts.map(id => inventory.find(p => p._id === id)).filter(Boolean);
    
    const message = `Dear Team,\n\nThe following products require attention regarding their expiry dates:\n\n${products.map(p => {
      const days = calculateDaysUntilExpiry(p.expiryDate);
      return `- ${p.name} (${p.category}): ${days < 0 ? `Expired ${Math.abs(days)} days ago` : `Expires in ${days} days`} on ${formatDate(p.expiryDate)}\n`;
    }).join('')}\nPlease take necessary actions.\n\nBest regards,\nInventory Manager`;
    
    setNotificationMessage(message);
  }, [selectedProducts, inventory]);

  // Get unique categories for filter
  const categories = [...new Set(inventory.map(item => item.category))];

  // Filter and sort inventory
  const filteredAndSortedInventory = () => {
    let filtered = inventory.filter(item => 
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!categoryFilter || item.category === categoryFilter)
    );

    if (statusFilter) {
      const now = new Date();
      filtered = filtered.filter(item => {
        const days = calculateDaysUntilExpiry(item.expiryDate);
        if (statusFilter === 'expired') return days < 0;
        if (statusFilter === 'expiringSoon') return days >= 0 && days <= 7;
        if (statusFilter === 'expiringLater') return days > 7 && days <= 30;
        if (statusFilter === 'safe') return days > 30;
        return true;
      });
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = sortConfig.key === 'expiryDate' ? new Date(a.expiryDate) : a[sortConfig.key];
        let bValue = sortConfig.key === 'expiryDate' ? new Date(b.expiryDate) : b[sortConfig.key];
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  const filteredInventory = filteredAndSortedInventory();

  // Calculate days until expiry
  const calculateDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const differenceMs = expiry - today;
    return Math.floor(differenceMs / (1000 * 60 * 60 * 24)); // Use floor for accurate days
  };

  // Get products by status
  const getExpiredProducts = () => filteredInventory.filter(item => calculateDaysUntilExpiry(item.expiryDate) < 0);
  const getExpiringSoon = () => filteredInventory.filter(item => {
    const days = calculateDaysUntilExpiry(item.expiryDate);
    return days >= 0 && days <= 7;
  });
  const getExpiringLater = () => filteredInventory.filter(item => {
    const days = calculateDaysUntilExpiry(item.expiryDate);
    return days > 7 && days <= 30;
  });

  // Prepare chart data
  const getChartData = () => {
    const expired = getExpiredProducts().length;
    const expiringSoon = getExpiringSoon().length;
    const expiringLater = getExpiringLater().length;
    const safe = filteredInventory.length - expired - expiringSoon - expiringLater;
    
    return [
      { name: 'Expired', value: expired, color: COLORS.expired },
      { name: 'Expiring ≤7 days', value: expiringSoon, color: COLORS.expiringSoon },
      { name: 'Expiring 8-30 days', value: expiringLater, color: COLORS.expiringLater },
      { name: 'Safe (>30 days)', value: safe, color: COLORS.safe }
    ].filter(item => item.value > 0);
  };

  // Prepare category-wise expiry data
  const getCategoryWiseData = () => {
    const uniqueCategories = [...new Set(filteredInventory.map(item => item.category))];
    
    return uniqueCategories.map(category => {
      const categoryItems = filteredInventory.filter(item => item.category === category);
      const expired = categoryItems.filter(item => calculateDaysUntilExpiry(item.expiryDate) < 0).length;
      const expiringSoon = categoryItems.filter(item => {
        const days = calculateDaysUntilExpiry(item.expiryDate);
        return days >= 0 && days <= 7;
      }).length;
      const expiringLater = categoryItems.filter(item => {
        const days = calculateDaysUntilExpiry(item.expiryDate);
        return days > 7 && days <= 30;
      }).length;
      
      return {
        category,
        expired,
        expiringSoon,
        expiringLater,
        total: categoryItems.length
      };
    }).filter(cat => cat.total > 0);
  };

  const handleProductSelect = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = (products) => {
    const productIds = products.map(p => p._id);
    const allSelected = productIds.every(id => selectedProducts.includes(id));
    
    if (allSelected) {
      setSelectedProducts(prev => prev.filter(id => !productIds.includes(id)));
    } else {
      setSelectedProducts(prev => [...new Set([...prev, ...productIds])]);
    }
  };

  const handleClearSelection = () => {
    setSelectedProducts([]);
  };

  const handleNotificationSend = () => {
    if (selectedProducts.length === 0) {
      alert("Please select at least one product to notify about.");
      return;
    }

    if (!notificationMessage.trim()) {
      alert("Please provide a notification message.");
      return;
    }

    const selectedChannels = Object.keys(notificationChannels).filter(channel => notificationChannels[channel]);

    if (selectedChannels.length === 0) {
      alert("Please select at least one notification channel.");
      return;
    }

    // Send notifications
    if (notificationChannels.email) {
      window.open(
        `mailto:inventory.manager@example.com?subject=${encodeURIComponent("Product Expiry Alert")}&body=${encodeURIComponent(notificationMessage)}`,
        '_blank'
      );
    }

    if (notificationChannels.whatsapp) {
      window.open(
        `https://api.whatsapp.com/send?phone=1234567890&text=${encodeURIComponent(notificationMessage)}`,
        '_blank'
      );
    }

    if (notificationChannels.sms) {
      alert("SMS notification would be sent here. (Implement actual SMS API)");
    }

    // Reset after sending
    setSelectedProducts([]);
    setNotificationMessage("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this expired product from inventory?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/inventory/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      setError("Failed to delete product. Please try again.");
    }
  };

  const formatStock = (stock) => {
    return `${stock.quantity} ${stock.unit}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysLeftText = (days) => {
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return 'Expires today';
    return `${days} day${days > 1 ? 's' : ''} left`;
  };

  const getDaysLeftClass = (days) => {
    if (days < 0) return "text-red-600 dark:text-red-400";
    if (days <= 3) return "text-red-600 dark:text-red-400";
    if (days <= 7) return "text-orange-600 dark:text-orange-400";
    if (days <= 30) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const exportToCSV = () => {
    const headers = ['Image URL', 'Product', 'Category', 'Stock', 'Expiry Date', 'Status'];
    const data = filteredInventory.map(item => {
      const days = calculateDaysUntilExpiry(item.expiryDate);
      return [
        item.image || '',
        item.name,
        item.category,
        formatStock(item.stock),
        formatDate(item.expiryDate),
        getDaysLeftText(days)
      ];
    });

    const escapeField = (field) => `"${field.replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeField).join(','),
      ...data.map(row => row.map(escapeField).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventory_expiry.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`min-h-full p-6 flex items-center justify-center ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4">Loading expiry data...</p>
        </div>
      </div>
    );
  }

  const expiredProducts = getExpiredProducts();
  const expiringSoon = getExpiringSoon();
  const expiringLater = getExpiringLater();
  const chartData = getChartData();
  const categoryData = getCategoryWiseData();

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-gray-900 text-white" : "light-beige"}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Farm Inventory</h1>
        <h2 className="text-xl font-semibold mt-2">Expiry Management</h2>
        <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Monitor product expiry dates, send notifications, and maintain optimal stock levels.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${darkMode ? "bg-red-900/50 text-red-200" : "bg-red-100 text-red-800"}`}>
          <AlertCircle size={20} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className={`p-4 rounded-lg shadow-sm mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex flex-wrap justify-between items-end gap-4">
          <div className="flex flex-wrap items-end gap-4 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={18}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="text"
                placeholder="Search by name or category..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="min-w-[150px]">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[150px]">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              >
                <option value="">All Statuses</option>
                <option value="expired">Expired</option>
                <option value="expiringSoon">Expiring ≤7 days</option>
                <option value="expiringLater">Expiring 8-30 days</option>
                <option value="safe">Safe (&gt;30 days)</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowChart(!showChart)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              title={showChart ? "Hide Charts" : "Show Charts"}
            >
              <BarChart3 size={20} />
            </button>
            <button 
              onClick={fetchProducts}
              className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              title="Refresh Data"
            >
              <RefreshCw size={20} />
            </button>
            <button 
              className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              onClick={exportToCSV}
              title="Export Data"
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {showChart && (
        <div className={`mb-6 p-4 rounded-lg shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            Expiry Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className={`${darkMode ? "bg-gray-800/50" : "bg-gray-50"} p-4 rounded-md`}>
              <h4 className="text-md font-medium mb-3 text-center">Products by Expiry Status</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : null}
                    >
                      {chartData.map((entry, index) => (
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
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Bar Chart */}
            <div className={`${darkMode ? "bg-gray-800/50" : "bg-gray-50"} p-4 rounded-md`}>
              <h4 className="text-md font-medium mb-3 text-center">Expiry by Category</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 0,
                      bottom: 25,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                    <XAxis 
                      dataKey="category" 
                      stroke={COLORS.text} 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
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
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="expired" stackId="a" fill={COLORS.expired} name="Expired" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="expiringSoon" stackId="a" fill={COLORS.expiringSoon} name="≤7 days" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="expiringLater" stackId="a" fill={COLORS.expiringLater} name="8-30 days" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Panel */}
      {selectedProducts.length > 0 && (
        <div className={`mb-6 p-4 rounded-lg shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Send Notification for {selectedProducts.length} Selected Products</h3>
            <button 
              onClick={handleClearSelection}
              className={`text-sm ${darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"}`}
            >
              Clear Selection
            </button>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-2">Notification Channels</h4>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={notificationChannels.email}
                  onChange={() => setNotificationChannels(prev => ({...prev, email: !prev.email}))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <Mail size={18} />
                Email
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={notificationChannels.sms}
                  onChange={() => setNotificationChannels(prev => ({...prev, sms: !prev.sms}))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <MessageSquare size={18} />
                SMS
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={notificationChannels.whatsapp}
                  onChange={() => setNotificationChannels(prev => ({...prev, whatsapp: !prev.whatsapp}))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <MessageSquare size={18} />
                WhatsApp
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-2">Notification Message</h4>
            <textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              className={`w-full p-3 rounded-lg border resize-y min-h-[150px] ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              placeholder="Customize your notification message here..."
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClearSelection}
              className={`px-4 py-2 rounded-md transition-colors ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
            >
              Cancel
            </button>
            <button
              onClick={handleNotificationSend}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <Send size={16} />
              Send Notification
            </button>
          </div>
        </div>
      )}

      {/* Products Sections */}
      <div className="space-y-6">
        {/* Expired Products */}
        {expiredProducts.length > 0 && (
          <div className={`rounded-lg shadow-sm overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`p-4 flex items-center justify-between ${darkMode ? "bg-red-900/50" : "bg-red-50"}`}>
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className={darkMode ? "text-red-300" : "text-red-700"} />
                <h3 className={`text-lg font-semibold ${darkMode ? "text-red-200" : "text-red-800"}`}>
                  Expired Products ({expiredProducts.length})
                </h3>
              </div>
              <button 
                onClick={() => handleSelectAll(expiredProducts)}
                className={`text-sm ${darkMode ? "text-red-300 hover:text-red-100" : "text-red-700 hover:text-red-900"}`}
              >
                {selectedProducts.length === expiredProducts.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={expiredProducts.length > 0 && expiredProducts.every(p => selectedProducts.includes(p._id))}
                        onChange={() => handleSelectAll(expiredProducts)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-20">
                      Image
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('name')}
                    >
                      Product {getSortIcon('name')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('category')}
                    >
                      Category {getSortIcon('category')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Stock
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('expiryDate')}
                    >
                      Expiry Date {getSortIcon('expiryDate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
                  {expiredProducts.map((item) => {
                    const daysLeft = calculateDaysUntilExpiry(item.expiryDate);
                    
                    return (
                      <tr key={item._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${darkMode ? "bg-red-900/10" : "bg-red-50/50"}`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(item._id)}
                            onChange={() => handleProductSelect(item._id)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-red-500/50" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <ImageIcon size={16} className="text-gray-500" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium">{item.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${darkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">{formatStock(item.stock)}</td>
                        <td className="px-6 py-4">{formatDate(item.expiryDate)}</td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${getDaysLeftClass(daysLeft)}`}>
                            {getDaysLeftText(daysLeft)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button 
                            className={`p-1 rounded-md mr-2 transition-colors ${darkMode ? "text-blue-400 hover:bg-gray-600" : "text-blue-600 hover:bg-gray-200"}`}
                            onClick={() => handleProductSelect(item._id)}
                            title="Add to Notification"
                          >
                            <Send size={16} />
                          </button>
                          <button 
                            className={`p-1 rounded-md transition-colors ${darkMode ? "text-red-400 hover:bg-gray-600" : "text-red-600 hover:bg-gray-200"}`}
                            onClick={() => handleDelete(item._id)}
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expiring Soon */}
        {expiringSoon.length > 0 && (
          <div className={`rounded-lg shadow-sm overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`p-4 flex items-center justify-between ${darkMode ? "bg-orange-900/50" : "bg-orange-50"}`}>
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className={darkMode ? "text-orange-300" : "text-orange-700"} />
                <h3 className={`text-lg font-semibold ${darkMode ? "text-orange-200" : "text-orange-800"}`}>
                  Expiring Soon (≤7 Days) ({expiringSoon.length})
                </h3>
              </div>
              <button 
                onClick={() => handleSelectAll(expiringSoon)}
                className={`text-sm ${darkMode ? "text-orange-300 hover:text-orange-100" : "text-orange-700 hover:text-orange-900"}`}
              >
                {expiringSoon.every(p => selectedProducts.includes(p._id)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={expiringSoon.length > 0 && expiringSoon.every(p => selectedProducts.includes(p._id))}
                        onChange={() => handleSelectAll(expiringSoon)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-20">
                      Image
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('name')}
                    >
                      Product {getSortIcon('name')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('category')}
                    >
                      Category {getSortIcon('category')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Stock
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('expiryDate')}
                    >
                      Expiry Date {getSortIcon('expiryDate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
                  {expiringSoon.map((item) => {
                    const daysLeft = calculateDaysUntilExpiry(item.expiryDate);
                    
                    return (
                      <tr key={item._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${darkMode ? "bg-orange-900/10" : "bg-orange-50/50"}`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(item._id)}
                            onChange={() => handleProductSelect(item._id)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-orange-500/50" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <ImageIcon size={16} className="text-gray-500" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium">{item.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${darkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">{formatStock(item.stock)}</td>
                        <td className="px-6 py-4">{formatDate(item.expiryDate)}</td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${getDaysLeftClass(daysLeft)}`}>
                            {getDaysLeftText(daysLeft)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button 
                            className={`p-1 rounded-md transition-colors ${darkMode ? "text-blue-400 hover:bg-gray-600" : "text-blue-600 hover:bg-gray-200"}`}
                            onClick={() => handleProductSelect(item._id)}
                            title="Add to Notification"
                          >
                            <Send size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expiring Later */}
        {expiringLater.length > 0 && (
          <div className={`rounded-lg shadow-sm overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`p-4 flex items-center justify-between ${darkMode ? "bg-yellow-900/50" : "bg-yellow-50"}`}>
              <div className="flex items-center gap-2">
                <Calendar size={20} className={darkMode ? "text-yellow-300" : "text-yellow-700"} />
                <h3 className={`text-lg font-semibold ${darkMode ? "text-yellow-200" : "text-yellow-800"}`}>
                  Expiring Later (8-30 Days) ({expiringLater.length})
                </h3>
              </div>
              <button 
                onClick={() => handleSelectAll(expiringLater)}
                className={`text-sm ${darkMode ? "text-yellow-300 hover:text-yellow-100" : "text-yellow-700 hover:text-yellow-900"}`}
              >
                {expiringLater.every(p => selectedProducts.includes(p._id)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={expiringLater.length > 0 && expiringLater.every(p => selectedProducts.includes(p._id))}
                        onChange={() => handleSelectAll(expiringLater)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-20">
                      Image
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('name')}
                    >
                      Product {getSortIcon('name')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('category')}
                    >
                      Category {getSortIcon('category')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Stock
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('expiryDate')}
                    >
                      Expiry Date {getSortIcon('expiryDate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
                  {expiringLater.map((item) => {
                    const daysLeft = calculateDaysUntilExpiry(item.expiryDate);
                    
                    return (
                      <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(item._id)}
                            onChange={() => handleProductSelect(item._id)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-yellow-500/50" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <ImageIcon size={16} className="text-gray-500" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium">{item.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${darkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">{formatStock(item.stock)}</td>
                        <td className="px-6 py-4">{formatDate(item.expiryDate)}</td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${getDaysLeftClass(daysLeft)}`}>
                            {getDaysLeftText(daysLeft)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button 
                            className={`p-1 rounded-md transition-colors ${darkMode ? "text-blue-400 hover:bg-gray-600" : "text-blue-600 hover:bg-gray-200"}`}
                            onClick={() => handleProductSelect(item._id)}
                            title="Add to Notification"
                          >
                            <Send size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* No Results Message */}
      {filteredInventory.length === 0 && (
        <div className={`p-8 text-center rounded-lg mt-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <Search size={48} className={`mx-auto mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
            Try adjusting your search or filters.
          </p>
        </div>
      )}

      {expiredProducts.length === 0 && expiringSoon.length === 0 && expiringLater.length === 0 && filteredInventory.length > 0 && (
        <div className={`p-8 text-center rounded-lg mt-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <Calendar size={48} className={`mx-auto mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
          <h3 className="text-lg font-medium mb-2">No urgent expirations</h3>
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
            All filtered products have more than 30 days until expiry.
          </p>
        </div>
      )}
    </div>
  );
};

export default Expiry;