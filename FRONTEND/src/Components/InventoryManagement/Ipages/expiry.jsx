import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  RefreshCw,
  AlertCircle,
  Minus,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Info,
  Calendar,
  Package,
  Zap,
  Clock,
  Mail,
  MessageSquare,
  PieChart as PieChartIcon,
  Send,
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
  Cell,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { exportToPDF, exportToExcel, getExportModalConfig, EXPORT_CONFIGS } from "../utils/exportUtils";
import { FileText, FileSpreadsheet } from "lucide-react";

const Expiry = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("");
  const [showChart, setShowChart] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "expiryDate", direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [exportModal, setExportModal] = useState(getExportModalConfig('expiryReport'));

  // Color palette consistent with other components
  const COLORS = {
    expired: darkMode ? "#fca5a5" : "#ef4444",
    expiringSoon: darkMode ? "#fdba74" : "#f97316",
    expiringLater: darkMode ? "#fde047" : "#eab308",
    safe: darkMode ? "#86efac" : "#22c55e",
    background: darkMode ? "#1f2937" : "#ffffff",
    text: darkMode ? "#e5e7eb" : "#374151",
    grid: darkMode ? "#4b5563" : "#e5e7eb",
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

  // Calculate days until expiry
  const calculateDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const differenceMs = expiry - today;
    return Math.floor(differenceMs / (1000 * 60 * 60 * 24));
  };

  // Get days left text and class
  const getDaysLeftText = (days) => {
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return "Expires today";
    return `${days} day${days > 1 ? "s" : ""} left`;
  };

  const getDaysLeftClass = (days) => {
    if (days < 0) return "text-red-600 dark:text-red-400";
    if (days <= 7) return "text-orange-600 dark:text-orange-400";
    if (days <= 30) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  // Get status badge
  const getStatusBadge = (days) => {
    if (days < 0) return { text: "Expired", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" };
    if (days <= 7) return { text: "Expiring Soon", class: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" };
    if (days <= 30) return { text: "Expiring Later", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" };
    return { text: "Safe", class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
  };

  // Prepare chart data for expiry distribution (Pie Chart)
  const getExpiryChartData = () => {
    const expired = filteredProducts.filter(product => calculateDaysUntilExpiry(product.expiryDate) < 0).length;
    const expiringSoon = filteredProducts.filter(product => {
      const days = calculateDaysUntilExpiry(product.expiryDate);
      return days >= 0 && days <= 7;
    }).length;
    const expiringLater = filteredProducts.filter(product => {
      const days = calculateDaysUntilExpiry(product.expiryDate);
      return days > 7 && days <= 30;
    }).length;
    const safe = filteredProducts.filter(product => calculateDaysUntilExpiry(product.expiryDate) > 30).length;

    return [
      { name: "Expired", value: expired, color: COLORS.expired },
      { name: "Expiring Soon (≤7 days)", value: expiringSoon, color: COLORS.expiringSoon },
      { name: "Expiring Later (8-30 days)", value: expiringLater, color: COLORS.expiringLater },
      { name: "Safe (>30 days)", value: safe, color: COLORS.safe },
    ].filter((item) => item.value > 0);
  };

  // Prepare category-wise expiry data (Bar Chart)
  const getCategoryWiseExpiryData = () => {
    const uniqueCategories = [...new Set(filteredProducts.map((product) => product.category))];

    return uniqueCategories.map((category) => {
      const categoryProducts = filteredProducts.filter((product) => product.category === category);
      const expired = categoryProducts.filter(product => calculateDaysUntilExpiry(product.expiryDate) < 0).length;
      const expiringSoon = categoryProducts.filter(product => {
        const days = calculateDaysUntilExpiry(product.expiryDate);
        return days >= 0 && days <= 7;
      }).length;
      const expiringLater = categoryProducts.filter(product => {
        const days = calculateDaysUntilExpiry(product.expiryDate);
        return days > 7 && days <= 30;
      }).length;
      const safe = categoryProducts.filter(product => calculateDaysUntilExpiry(product.expiryDate) > 30).length;

      return {
        category,
        expired,
        expiringSoon,
        expiringLater,
        safe,
        total: categoryProducts.length,
      };
    }).filter((category) => category.total > 0);
  };

  // Filter and sort products
  const filteredAndSortedProducts = () => {
    let filtered = inventory.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (categoryFilter !== "All Categories") {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    if (activeTab !== "all") {
      filtered = filtered.filter((product) => {
        const days = calculateDaysUntilExpiry(product.expiryDate);
        if (activeTab === "expired") return days < 0;
        if (activeTab === "expiringSoon") return days >= 0 && days <= 7;
        if (activeTab === "expiringLater") return days > 7 && days <= 30;
        if (activeTab === "safe") return days > 30;
        return true;
      });
    }

    if (statusFilter) {
      filtered = filtered.filter((product) => {
        const days = calculateDaysUntilExpiry(product.expiryDate);
        if (statusFilter === "expired") return days < 0;
        if (statusFilter === "expiringSoon") return days >= 0 && days <= 7;
        if (statusFilter === "expiringLater") return days > 7 && days <= 30;
        if (statusFilter === "safe") return days > 30;
        return true;
      });
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue =
          sortConfig.key === "expiryDate"
            ? new Date(a.expiryDate)
            : sortConfig.key === "stock"
            ? a.stock.quantity
            : sortConfig.key === "price"
            ? parseFloat(a.price)
            : a[sortConfig.key];
        let bValue =
          sortConfig.key === "expiryDate"
            ? new Date(b.expiryDate)
            : sortConfig.key === "stock"
            ? b.stock.quantity
            : sortConfig.key === "price"
            ? parseFloat(b.price)
            : b[sortConfig.key];

        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  };

  const filteredProducts = filteredAndSortedProducts();

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/inventory/products/${id}`);
      setSuccess("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      setError("Failed to delete product. Please try again.");
    }
  };

  const handleProductSelect = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(product => product._id));
    }
  };

  const handleClearSelection = () => {
    setSelectedProducts([]);
    setShowNotificationPanel(false);
  };

  const handleSendNotification = () => {
    if (selectedProducts.length === 0) {
      setError("Please select at least one product to notify about.");
      return;
    }

    const selectedProductsData = filteredProducts.filter(product =>
      selectedProducts.includes(product._id)
    );

    const email = "manager@example.com";
    const subject = `Expiry Alert: ${selectedProductsData.length} Products Require Attention`;
    const body = `Dear Team,\n\nThe following products require attention regarding their expiry dates:\n\n${selectedProductsData.map(product => {
      const days = calculateDaysUntilExpiry(product.expiryDate);
      return `• ${product.name} (${product.category}): ${getDaysLeftText(days)} - Stock: ${product.stock.quantity} ${product.stock.unit}`;
    }).join('\n')}\n\nPlease take necessary actions.\n\nBest regards,\nInventory Management System`;

    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    
    // WhatsApp notification
    const phone = "1234567890";
    const whatsappMessage = `Expiry Alert: ${selectedProductsData.length} products require attention. Check email for details.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');

    setSuccess(`Notifications sent for ${selectedProducts.length} products!`);
    setSelectedProducts([]);
    setShowNotificationPanel(false);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <ChevronUp size={16} className="inline ml-1" /> : <ChevronDown size={16} className="inline ml-1" />;
  };

  const exportToPDF = () => {
    try {
      if (filteredProducts.length === 0) {
        setError("No data available to export to PDF.");
        return;
      }

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Cover Page
      doc.setFillColor(34, 197, 94);
      doc.rect(0, 0, 210, 297, 'F');
      
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("PRODUCT EXPIRY REPORT", 105, 120, { align: "center" });
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 140, { align: "center" });
      doc.text(`Total Products: ${filteredProducts.length}`, 105, 150, { align: "center" });
      
      const summary = getSummary();
      doc.text(`Expired: ${summary.expired}`, 105, 160, { align: "center" });
      doc.text(`Expiring Soon: ${summary.expiringSoon}`, 105, 170, { align: "center" });
      
      doc.setFontSize(12);
      doc.text("Inventory Management System", 105, 250, { align: "center" });

      // Summary Page
      doc.addPage();
      
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94);
      doc.text("EXPIRY SUMMARY", 105, 20, { align: "center" });
      
      const chartData = getExpiryChartData();
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      
      let yPos = 40;
      chartData.forEach((item, index) => {
        doc.text(`${item.name}: ${item.value} products`, 20, yPos);
        yPos += 10;
      });

      // Detailed Table Page
      doc.addPage();
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94);
      doc.text("DETAILED EXPIRY LIST", 105, 20, { align: "center" });

      const headers = [["Product", "Category", "Stock", "Price", "Expiry Date", "Status", "Days Left"]];
      const data = filteredProducts.map(product => {
        const days = calculateDaysUntilExpiry(product.expiryDate);
        const status = getStatusBadge(days);
        return [
          product.name,
          product.category,
          `${product.stock.quantity} ${product.stock.unit}`,
          `$${product.price}`,
          new Date(product.expiryDate).toLocaleDateString(),
          status.text,
          getDaysLeftText(days)
        ];
      });

      autoTable(doc, {
        head: headers,
        body: data,
        startY: 30,
        theme: "grid",
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 10,
          halign: "center"
        },
        bodyStyles: {
          fontSize: 9,
          halign: "center"
        },
        margin: { top: 30 },
        styles: {
          overflow: "linebreak",
          cellPadding: 3
        }
      });

      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Page ${i} of ${totalPages}`, 200, 285, { align: "right" });
      }

      const fileName = `product_expiry_report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      setSuccess(`PDF report generated successfully! (${filteredProducts.length} products)`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF report. Please try again.");
    }
  };

  // Calculate summary stats
  const getSummary = () => {
    const totalProducts = inventory.length;
    const expired = inventory.filter(product => calculateDaysUntilExpiry(product.expiryDate) < 0).length;
    const expiringSoon = inventory.filter(product => {
      const days = calculateDaysUntilExpiry(product.expiryDate);
      return days >= 0 && days <= 7;
    }).length;
    const expiringLater = inventory.filter(product => {
      const days = calculateDaysUntilExpiry(product.expiryDate);
      return days > 7 && days <= 30;
    }).length;
    const safe = inventory.filter(product => calculateDaysUntilExpiry(product.expiryDate) > 30).length;

    return { totalProducts, expired, expiringSoon, expiringLater, safe };
  };

  const summary = getSummary();

  if (loading) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading expiry data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Calendar className="text-green-500" size={32} />
          Expiry Management
        </h1>
        <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Monitor product expiry dates, send notifications, and maintain optimal stock levels
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
            <Package className="text-blue-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Total Products</h3>
            <p className="text-2xl font-bold">{summary.totalProducts}</p>
          </div>
        </div>
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-red-900/30" : "bg-red-100"}`}>
            <AlertCircle className="text-red-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Expired</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.expired}</p>
          </div>
        </div>
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-orange-900/30" : "bg-orange-100"}`}>
            <AlertCircle className="text-orange-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Expiring Soon</h3>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.expiringSoon}</p>
          </div>
        </div>
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-yellow-900/30" : "bg-yellow-100"}`}>
            <Clock className="text-yellow-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Expiring Later</h3>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.expiringLater}</p>
          </div>
        </div>
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}>
            <Calendar className="text-green-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Safe</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.safe}</p>
          </div>
        </div>
      </div>

      {/* Quick Action Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === "all" ? "bg-green-600 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Items
        </button>
        <button
          onClick={() => setActiveTab("expired")}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === "expired" ? "bg-red-600 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Expired
        </button>
        <button
          onClick={() => setActiveTab("expiringSoon")}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === "expiringSoon" ? "bg-orange-600 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Expiring Soon (≤7 days)
        </button>
        <button
          onClick={() => setActiveTab("expiringLater")}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === "expiringLater" ? "bg-yellow-600 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Expiring Later (8-30 days)
        </button>
        <button
          onClick={() => setActiveTab("safe")}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === "safe" ? "bg-green-600 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
        Safe (&gt;30 days)
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
                placeholder="Search by name or category..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`mt-3 flex items-center gap-2 text-sm ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"} transition-colors`}
            >
              <Filter size={16} />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  >
                    <option value="All Categories">All Categories</option>
                    <option value="Milk Product">Milk Product</option>
                    <option value="Meat">Meat</option>
                    <option value="Eggs">Eggs</option>
                    <option value="Honey">Honey</option>
                    <option value="Material">Material</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  >
                    <option value="">All Statuses</option>
                    <option value="expired">Expired</option>
                    <option value="expiringSoon">Expiring Soon (≤7 days)</option>
                    <option value="expiringLater">Expiring Later (8-30 days)</option>
                    <option value="safe">Safe (&gt;30 days)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchProducts}
              className={`p-2.5 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all`}
              title="Refresh Data"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={exportToPDF}
              className={`p-2.5 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all`}
              title="Export to PDF"
            >
              <Download size={20} />
            </button>
            <button
              onClick={() => setShowChart(!showChart)}
              className={`p-2.5 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all`}
              title={showChart ? "Hide Charts" : "Show Charts"}
            >
              <PieChartIcon size={20} />
            </button>
            {selectedProducts.length > 0 && (
              <button
                onClick={() => setShowNotificationPanel(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                <Send size={16} />
                Notify ({selectedProducts.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {showChart && (
        <div className={`mb-6 p-4 rounded-lg shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChartIcon size={20} />
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
                      data={getExpiryChartData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => (value > 0 ? `${name}: ${value}` : null)}
                    >
                      {getExpiryChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: COLORS.background,
                        border: `1px solid ${COLORS.grid}`,
                        borderRadius: "4px",
                        padding: "8px",
                        color: COLORS.text,
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px" }} />
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
                    data={getCategoryWiseExpiryData()}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 0,
                      bottom: 25,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                    <XAxis dataKey="category" stroke={COLORS.text} angle={-45} textAnchor="end" height={60} />
                    <YAxis stroke={COLORS.text} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: COLORS.background,
                        border: `1px solid ${COLORS.grid}`,
                        borderRadius: "4px",
                        padding: "8px",
                        color: COLORS.text,
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px" }} />
                    <Bar dataKey="expired" stackId="a" fill={COLORS.expired} name="Expired" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="expiringSoon" stackId="a" fill={COLORS.expiringSoon} name="Expiring Soon" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="expiringLater" stackId="a" fill={COLORS.expiringLater} name="Expiring Later" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="safe" stackId="a" fill={COLORS.safe} name="Safe" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Panel */}
      {showNotificationPanel && (
        <div className={`mb-6 p-6 rounded-xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Send Expiry Notifications</h3>
            <button
              onClick={handleClearSelection}
              className={`p-2 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition-all`}
            >
              <X size={20} />
            </button>
          </div>
          <div className="mb-4">
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Sending notifications for {selectedProducts.length} selected products
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClearSelection}
              className={`px-4 py-2.5 rounded-lg ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"} transition-all`}
            >
              Cancel
            </button>
            <button
              onClick={handleSendNotification}
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
            >
              <Send size={16} />
              Send Notifications
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className={`mb-4 flex justify-between items-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        <p className="text-sm">
          Showing {filteredProducts.length} of {inventory.length} products
          {selectedProducts.length > 0 && ` • ${selectedProducts.length} selected`}
        </p>
        {filteredProducts.length === 0 && (
          <button
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("All Categories");
              setStatusFilter("");
              setActiveTab("all");
            }}
            className="text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Table View */}
      <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("name")}
                >
                  <div className="flex items-center">
                    Product Name {getSortIcon("name")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Category
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("stock")}
                >
                  <div className="flex items-center">
                    Stock {getSortIcon("stock")}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("price")}
                >
                  <div className="flex items-center">
                    Price {getSortIcon("price")}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("expiryDate")}
                >
                  <div className="flex items-center">
                    Expiry Date {getSortIcon("expiryDate")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const daysLeft = calculateDaysUntilExpiry(product.expiryDate);
                  const statusBadge = getStatusBadge(daysLeft);
                  const rowBg =
                    daysLeft < 0
                      ? darkMode
                        ? "bg-red-900/10"
                        : "bg-red-50/50"
                      : daysLeft <= 7
                      ? darkMode
                        ? "bg-orange-900/10"
                        : "bg-orange-50/50"
                      : daysLeft <= 30
                      ? darkMode
                        ? "bg-yellow-900/10"
                        : "bg-yellow-50/50"
                      : "";

                  return (
                    <tr key={product._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-all ${rowBg}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => handleProductSelect(product._id)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center">
                          <Package size={16} className="mr-2 text-gray-400" />
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${darkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.stock.quantity} {product.stock.unit}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-green-600 dark:text-green-400">${product.price}</span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(product.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusBadge.class}`}>
                          {statusBadge.text}
                        </span>
                        <div className="text-xs mt-1">
                          <span className={getDaysLeftClass(daysLeft)}>{getDaysLeftText(daysLeft)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button
                            onClick={() => handleProductSelect(product._id)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-gray-100"}`}
                            title="Select for Notification"
                          >
                            <Send size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"}`}
                            title="Delete Product"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Calendar size={48} className="text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No products found</h3>
                      <p className={`text-sm max-w-md mx-auto ${darkMode ? "text-gray-400" : "text-gray-500"} mb-4`}>
                        Try adjusting your search or filter criteria.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setCategoryFilter("All Categories");
                          setStatusFilter("");
                          setActiveTab("all");
                        }}
                        className="text-green-600 dark:text-green-400 hover:underline text-sm"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expiry;