// Expiry.jsx
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
  Filter
} from "lucide-react";
import { useITheme } from "../Icontexts/IThemeContext";
import axios from "axios";

const Expiry = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationChannels, setNotificationChannels] = useState({
    email: true,
    sms: false,
    whatsapp: false
  });

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

  // Filter inventory based on search term
  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate days until expiry
  const calculateDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const differenceMs = expiry - today;
    const days = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
    return days;
  };

  // Get products expiring soon (within 7 days)
  const getExpiringSoon = () => {
    return filteredInventory.filter(item => {
      const daysUntilExpiry = calculateDaysUntilExpiry(item.expiryDate);
      return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    });
  };

  // Get products expiring in 8-30 days
  const getExpiringLater = () => {
    return filteredInventory.filter(item => {
      const daysUntilExpiry = calculateDaysUntilExpiry(item.expiryDate);
      return daysUntilExpiry > 7 && daysUntilExpiry <= 30;
    });
  };

  // Get expired products
  const getExpiredProducts = () => {
    return filteredInventory.filter(item => {
      const daysUntilExpiry = calculateDaysUntilExpiry(item.expiryDate);
      return daysUntilExpiry < 0;
    });
  };

  const handleProductSelect = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const handleSelectAll = (products) => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(product => product._id));
    }
  };

  const handleNotificationSend = async () => {
    if (selectedProducts.length === 0) {
      alert("Please select at least one product to notify about.");
      return;
    }

    try {
      // This would be connected to your notification API
      alert(`Notification would be sent for ${selectedProducts.length} products via selected channels`);
      // Reset after sending
      setSelectedProducts([]);
      setNotificationMessage("");
    } catch (error) {
      console.error("Error sending notification:", error);
      setError("Failed to send notification. Please try again.");
    }
  };

  const formatStock = (stock) => {
    return `${stock.quantity} ${stock.unit}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const getDaysLeftClass = (days) => {
    if (days < 0) return "text-red-600 dark:text-red-400";
    if (days <= 3) return "text-red-600 dark:text-red-400";
    if (days <= 7) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
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

  const expiringSoon = getExpiringSoon();
  const expiringLater = getExpiringLater();
  const expiredProducts = getExpiredProducts();

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Farm Inventory</h1>
        <h2 className="text-xl font-semibold mt-2">Expiry Management</h2>
        <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Track and manage product expiry dates
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${darkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"}`}>
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {/* Search and Actions */}
      <div className={`p-4 rounded-lg shadow-sm mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search
                size={18}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="text"
                placeholder="Search products..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className={`p-2 rounded-lg flex items-center gap-2 ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}>
              <Filter size={18} />
              Filter
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              onClick={() => alert("Export functionality would be implemented here")}
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Panel */}
      {selectedProducts.length > 0 && (
        <div className={`mb-6 p-4 rounded-lg shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className="text-lg font-semibold mb-4">Search Engine Notification</h3>
          
          {selectedProducts.map(productId => {
            const product = inventory.find(p => p._id === productId);
            if (!product) return null;
            
            const daysLeft = calculateDaysUntilExpiry(product.expiryDate);
            
            return (
              <div key={productId} className={`mb-4 p-3 rounded-md ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <h4 className="font-medium">Product Expiry Alert</h4>
                <p>{product.name} ({formatStock(product.stock)}) will expire on {formatDate(product.expiryDate)}.</p>
                <p className={getDaysLeftClass(daysLeft)}>
                  {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` : `Only ${daysLeft} days remaining before expiry.`}
                </p>
              </div>
            );
          })}
          
          <div className="mb-4">
            <h4 className="font-medium mb-2">Notification Channels</h4>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationChannels.email}
                  onChange={() => setNotificationChannels({...notificationChannels, email: !notificationChannels.email})}
                />
                <Mail size={18} />
                Email
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationChannels.sms}
                  onChange={() => setNotificationChannels({...notificationChannels, sms: !notificationChannels.sms})}
                />
                <MessageSquare size={18} />
                SMS
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationChannels.whatsapp}
                  onChange={() => setNotificationChannels({...notificationChannels, whatsapp: !notificationChannels.whatsapp})}
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
              className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
              rows={3}
              placeholder="Customize your notification message..."
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setSelectedProducts([])}
              className={`px-4 py-2 rounded-md ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
            >
              Cancel
            </button>
            <button
              onClick={handleNotificationSend}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <Send size={16} />
              Send Notification
            </button>
          </div>
        </div>
      )}

      {/* Expired Products Section */}
      {expiredProducts.length > 0 && (
        <div className={`mb-6 rounded-lg shadow-sm overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className={`p-4 ${darkMode ? "bg-red-900" : "bg-red-100"} flex items-center gap-2`}>
            <AlertCircle size={20} className={darkMode ? "text-red-200" : "text-red-800"} />
            <h3 className={`text-lg font-semibold ${darkMode ? "text-red-200" : "text-red-800"}`}>
              Expired Products ({expiredProducts.length})
            </h3>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === expiredProducts.length && expiredProducts.length > 0}
                    onChange={() => handleSelectAll(expiredProducts)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  PRODUCT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  CATEGORY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  STOCK
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  EXPIRY DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  DAYS LEFT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
              {expiredProducts.map((item) => {
                const daysLeft = calculateDaysUntilExpiry(item.expiryDate);
                
                return (
                  <tr key={item._id} className={darkMode ? "bg-red-900/20" : "bg-red-50"}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(item._id)}
                        onChange={() => handleProductSelect(item._id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatStock(item.stock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(item.expiryDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${getDaysLeftClass(daysLeft)}`}>
                        {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className={`p-1 rounded-md mr-2 ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"}`}
                        onClick={() => handleProductSelect(item._id)}
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
      )}

      {/* Expiring Soon Section (Within 7 Days) */}
      {expiringSoon.length > 0 && (
        <div className={`mb-6 rounded-lg shadow-sm overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className={`p-4 ${darkMode ? "bg-orange-900" : "bg-orange-100"} flex items-center gap-2`}>
            <AlertCircle size={20} className={darkMode ? "text-orange-200" : "text-orange-800"} />
            <h3 className={`text-lg font-semibold ${darkMode ? "text-orange-200" : "text-orange-800"}`}>
              Expiring Soon (Within 7 Days) ({expiringSoon.length})
            </h3>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === expiringSoon.length && expiringSoon.length > 0}
                    onChange={() => handleSelectAll(expiringSoon)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  PRODUCT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  CATEGORY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  STOCK
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  EXPIRY DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  DAYS LEFT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
              {expiringSoon.map((item) => {
                const daysLeft = calculateDaysUntilExpiry(item.expiryDate);
                
                return (
                  <tr key={item._id} className={darkMode ? "bg-orange-900/20" : "bg-orange-50"}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(item._id)}
                        onChange={() => handleProductSelect(item._id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatStock(item.stock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(item.expiryDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${getDaysLeftClass(daysLeft)}`}>
                        {daysLeft} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className={`p-1 rounded-md mr-2 ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-gray-100"}`}
                        onClick={() => handleProductSelect(item._id)}
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
      )}

      {/* Expiring Later Section (8-30 Days) */}
      {expiringLater.length > 0 && (
        <div className={`mb-6 rounded-lg shadow-sm overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className={`p-4 ${darkMode ? "bg-yellow-900" : "bg-yellow-100"} flex items-center gap-2`}>
            <Calendar size={20} className={darkMode ? "text-yellow-200" : "text-yellow-800"} />
            <h3 className={`text-lg font-semibold ${darkMode ? "text-yellow-200" : "text-yellow-800"}`}>
              Expiring Soon (8-30 Days) ({expiringLater.length})
            </h3>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === expiringLater.length && expiringLater.length > 0}
                    onChange={() => handleSelectAll(expiringLater)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  PRODUCT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  CATEGORY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  STOCK
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  EXPIRY DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  DAYS LEFT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
              {expiringLater.map((item) => {
                const daysLeft = calculateDaysUntilExpiry(item.expiryDate);
                
                return (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(item._id)}
                        onChange={() => handleProductSelect(item._id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatStock(item.stock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(item.expiryDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${getDaysLeftClass(daysLeft)}`}>
                        {daysLeft} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className={`p-1 rounded-md mr-2 ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-gray-100"}`}
                        onClick={() => handleProductSelect(item._id)}
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
      )}

      {/* No Expiring Products Message */}
      {expiredProducts.length === 0 && expiringSoon.length === 0 && expiringLater.length === 0 && (
        <div className={`p-8 text-center rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <Calendar size={48} className={`mx-auto mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
          <h3 className="text-lg font-medium mb-2">No products expiring soon</h3>
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
            All your products have more than 30 days until expiry.
          </p>
        </div>
      )}
    </div>
  );
};

export default Expiry;