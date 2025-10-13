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
  ShoppingBag,
  Globe,
  Image as ImageIcon,
  QrCode,
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
import { QRCodeSVG } from "qrcode.react";
import { exportToPDF, exportToExcel, getExportModalConfig, EXPORT_CONFIGS } from "../utils/exportUtils";
import { FileText, FileSpreadsheet } from "lucide-react";

const Stock = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRefillForm, setShowRefillForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [refillingProduct, setRefillingProduct] = useState(null);
  const [showChart, setShowChart] = useState(true);
  const [refillQuantity, setRefillQuantity] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showQRCode, setShowQRCode] = useState(null);
  const [showExportView, setShowExportView] = useState(false);
  const [exportModal, setExportModal] = useState(getExportModalConfig('inventoryStock'));
  const [formData, setFormData] = useState({
    name: "",
    category: "Milk Product",
    stock: {
      quantity: "",
      unit: "kg"
    },
    price: "",
    description: "",
    expiryDate: "",
    creationDate: new Date().toISOString().split('T')[0],
    market: "Local",
    image: ""
  });
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Color palette consistent with AnimalFoodStock
  const COLORS = {
    critical: darkMode ? "#fca5a5" : "#ef4444",
    low: darkMode ? "#fdba74" : "#f97316",
    good: darkMode ? "#86efac" : "#22c55e",
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
  }, [categoryFilter, statusFilter, searchTerm, showExportView, activeTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        category: categoryFilter !== "All Categories" ? categoryFilter : undefined,
        status: statusFilter !== "All Statuses" ? statusFilter : undefined,
        search: searchTerm || undefined,
        market: showExportView ? "Export" : undefined
      };
      
      const response = await axios.get("http://localhost:5000/api/inventory/products", { params });
      setInventory(response.data.products);
      setError("");
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate expiry date based on category
  const calculateExpiryDate = (category, creationDate) => {
    const creation = new Date(creationDate);
    let daysToAdd = 0;
    switch(category) {
      case 'Milk Product':
      case 'Meat':
        daysToAdd = 7;
        break;
      case 'Eggs':
        daysToAdd = 30;
        break;
      case 'Honey':
      case 'Material':
        daysToAdd = 365;
        break;
      case 'Vegetables':
      case 'Fruits':
        daysToAdd = 10;
        break;
      default:
        daysToAdd = 7;
    }
    creation.setDate(creation.getDate() + daysToAdd);
    return creation.toISOString().split('T')[0];
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

  // Get stock level class
  const getStockLevelClass = (quantity, total) => {
    const percentage = (quantity / total) * 100;
    if (percentage <= 10) return "text-red-600 dark:text-red-400";
    if (percentage <= 30) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
  };

  // Get stock level badge
  const getStockLevelBadge = (quantity, total) => {
    const percentage = (quantity / total) * 100;
    if (percentage <= 10) return { text: "Critical", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" };
    if (percentage <= 30) return { text: "Low", class: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" };
    return { text: "Good", class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
  };

  // Get status based on stock and expiry
  const getProductStatus = (product) => {
    // Safety check: ensure product has required properties
    if (!product || !product.expiryDate || !product.stock || typeof product.stock.quantity !== 'number') {
      return "Unknown";
    }
    
    const days = calculateDaysUntilExpiry(product.expiryDate);
    const percentage = (product.stock.quantity / (product.stock.quantity + 10)) * 100; // Simplified for demo
    
    if (days < 0) return "Expired";
    if (days <= 7) return "Expiring Soon";
    if (percentage <= 10) return "Critical Stock";
    if (percentage <= 30) return "Low Stock";
    return "In Stock";
  };

  // Prepare chart data for stock distribution (Pie Chart)
  const getStockChartData = () => {
    // Safety check: ensure filteredProducts is an array
    if (!filteredProducts || !Array.isArray(filteredProducts)) {
      return [];
    }
    
    const critical = filteredProducts.filter(product => {
      const status = getProductStatus(product);
      return status === "Critical Stock" || status === "Expired";
    }).length;
    
    const low = filteredProducts.filter(product => {
      const status = getProductStatus(product);
      return status === "Low Stock" || status === "Expiring Soon";
    }).length;
    
    const good = filteredProducts.filter(product => {
      const status = getProductStatus(product);
      return status === "In Stock";
    }).length;

    return [
      { name: "Critical/Expired", value: critical, color: COLORS.critical },
      { name: "Low/Expiring Soon", value: low, color: COLORS.low },
      { name: "Good", value: good, color: COLORS.good },
    ].filter((item) => item.value > 0);
  };

  // Prepare category-wise stock data (Bar Chart)
  const getCategoryWiseData = () => {
    // Safety check: ensure filteredProducts is an array
    if (!filteredProducts || !Array.isArray(filteredProducts)) {
      return [];
    }
    
    const uniqueCategories = [...new Set(filteredProducts.map(product => product.category))];

    return uniqueCategories.map(category => {
      const categoryProducts = filteredProducts.filter(product => product.category === category);
      const critical = categoryProducts.filter(product => {
        const status = getProductStatus(product);
        return status === "Critical Stock" || status === "Expired";
      }).length;
      
      const low = categoryProducts.filter(product => {
        const status = getProductStatus(product);
        return status === "Low Stock" || status === "Expiring Soon";
      }).length;
      
      const good = categoryProducts.filter(product => {
        const status = getProductStatus(product);
        return status === "In Stock";
      }).length;

      return {
        category,
        critical,
        low,
        good,
        total: categoryProducts.length,
      };
    }).filter(category => category.total > 0);
  };

  // Filter and sort products
  const filteredAndSortedProducts = () => {
    // Safety check: ensure inventory is an array
    if (!inventory || !Array.isArray(inventory)) {
      return [];
    }
    
    let filtered = inventory.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (categoryFilter !== "All Categories") {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    if (activeTab !== "all") {
      filtered = filtered.filter(product => {
        const status = getProductStatus(product);
        if (activeTab === "lowStock") return status === "Low Stock";
        if (activeTab === "criticalStock") return status === "Critical Stock";
        if (activeTab === "expiringSoon") return status === "Expiring Soon";
        if (activeTab === "expired") return status === "Expired";
        return true;
      });
    }

    if (statusFilter && statusFilter !== "All Statuses") {
      filtered = filtered.filter(product => getProductStatus(product) === statusFilter);
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "stock") {
          aValue = a.stock.quantity;
          bValue = b.stock.quantity;
        } else if (sortConfig.key === "expiryDate") {
          aValue = new Date(a.expiryDate);
          bValue = new Date(b.expiryDate);
        } else if (sortConfig.key === "price") {
          aValue = parseFloat(a.price);
          bValue = parseFloat(b.price);
        }

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = {...formData};
    
    if (name === "quantity") {
      updatedFormData = {
        ...formData,
        stock: {
          ...formData.stock,
          quantity: value
        }
      };
    } else if (name === "unit") {
      updatedFormData = {
        ...formData,
        stock: {
          ...formData.stock,
          unit: value
        }
      };
    } else if (name === "image") {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            image: reader.result
          }));
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
      return;
    } else if (name === "category" || name === "creationDate") {
      updatedFormData = {
        ...formData,
        [name]: value
      };
      updatedFormData.expiryDate = calculateExpiryDate(
        name === "category" ? value : formData.category,
        name === "creationDate" ? value : formData.creationDate
      );
    } else {
      updatedFormData = {
        ...formData,
        [name]: value
      };
    }
    
    setFormData(updatedFormData);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      stock: {
        quantity: product.stock.quantity,
        unit: product.stock.unit
      },
      price: product.price,
      description: product.description || "",
      creationDate: product.creationDate ? product.creationDate.split('T')[0] : new Date().toISOString().split('T')[0],
      expiryDate: product.expiryDate.split('T')[0],
      market: product.market,
      image: product.image
    });
    setImagePreview(product.image);
    setShowAddForm(true);
  };

  const handleRefill = (product) => {
    setRefillingProduct(product);
    setRefillQuantity("");
    setShowRefillForm(true);
  };

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`http://localhost:5000/api/inventory/products/refill/${refillingProduct._id}`, {
        refillQuantity: parseInt(refillQuantity)
      });
      setShowRefillForm(false);
      setRefillingProduct(null);
      setRefillQuantity("");
      setSuccess("Stock refilled successfully!");
      fetchProducts();
    } catch (error) {
      console.error("Error refilling product:", error);
      setError("Failed to refill product. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData };
      if (editingProduct) {
        await axios.put(`http://localhost:5000/api/inventory/products/${editingProduct._id}`, dataToSend);
        setSuccess("Product updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/inventory/products", dataToSend);
        setSuccess("Product added successfully!");
      }
      setShowAddForm(false);
      setEditingProduct(null);
      setFormData({
        name: "",
        category: "Milk Product",
        stock: {
          quantity: "",
          unit: "kg"
        },
        price: "",
        description: "",
        creationDate: new Date().toISOString().split('T')[0],
        expiryDate: "",
        market: showExportView ? "Export" : "Local",
        image: ""
      });
      setImagePreview(null);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      setError(error.response?.data?.message || "Failed to save product. Please try again.");
    }
  };

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

  const handleSendEmail = (product) => {
    try {
      const email = "manager@example.com";
      const subject = `Stock Alert: ${product.name}`;
      const body = `The product "${product.name}" requires attention. Current status: ${getProductStatus(product)}. Please check inventory.`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setSuccess(`Opening email client for ${product.name}...`);
    } catch (error) {
      console.error("Error opening email:", error);
      setError("Failed to open email client. Please try again.");
    }
  };

  const handleSendWhatsApp = (product) => {
    try {
      const phone = "1234567890";
      const message = `Stock Alert: ${product.name} requires attention. Status: ${getProductStatus(product)}. Please check inventory.`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
      setSuccess(`Opening WhatsApp for ${product.name}...`);
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      setError("Failed to open WhatsApp. Please try again.");
    }
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

  // Export data function
  const handleExport = () => {
    const dataToExport = exportModal.selection === 'current' ? filteredProducts : inventory;
    
    
    if (dataToExport.length === 0) {
      setError("No data available to export");
        return;
      }

    const config = {
      ...EXPORT_CONFIGS.inventoryStock,
      dataFormatter: (product) => {
        const status = getProductStatus(product);
        const days = calculateDaysUntilExpiry(product.expiryDate);
        return {
          'Product Name': product.name || 'N/A',
          'Category': product.category || 'N/A',
          'Stock Quantity': product.stock?.quantity || 0,
          'Unit': product.stock?.unit || 'N/A',
          'Price': `$${product.price || 0}`,
          'Market': product.market || 'N/A',
          'Expiry Date': product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : 'N/A',
          'Status': `${status} (${getDaysLeftText(days)})`
        };
      }
    };

    try {
      if (exportModal.format === 'excel') {
        exportToExcel(dataToExport, config);
        setSuccess("Excel file downloaded successfully!");
      } else {
        exportToPDF(dataToExport, config);
        setSuccess("PDF report downloaded successfully!");
      }
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to export data. Please try again.");
    }
    
    setExportModal({ ...exportModal, open: false });
  };

  // Calculate summary stats
  const getSummary = () => {
    // Safety check: ensure inventory is an array
    if (!inventory || !Array.isArray(inventory)) {
      return { totalProducts: 0, lowStock: 0, criticalStock: 0, expiringSoon: 0, expired: 0 };
    }
    
    const totalProducts = inventory.length;
    const lowStock = inventory.filter(product => {
      const status = getProductStatus(product);
      return status === "Low Stock" || status === "Expiring Soon";
    }).length;
    const criticalStock = inventory.filter(product => {
      const status = getProductStatus(product);
      return status === "Critical Stock" || status === "Expired";
    }).length;
    const expiringSoon = inventory.filter(product => getProductStatus(product) === "Expiring Soon").length;
    const expired = inventory.filter(product => getProductStatus(product) === "Expired").length;

    return { totalProducts, lowStock, criticalStock, expiringSoon, expired };
  };

  const summary = getSummary();

  const generateProductInfo = (product) => {
    return `Product: ${product.name}
Category: ${product.category}
Stock: ${product.stock.quantity} ${product.stock.unit}
Price: $${product.price}
Market: ${product.market}
Expiry: ${new Date(product.expiryDate).toLocaleDateString()}
Status: ${getProductStatus(product)}`;
  };

  const handleExportClick = () => {
    setShowExportView(true);
    fetchProducts();
  };

  const handleBackToMain = () => {
    setShowExportView(false);
    fetchProducts();
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShoppingBag className="text-green-500" size={32} />
          {showExportView ? "Export Market Products" : "Farm Inventory"}
        </h1>
        <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          {showExportView ? "Manage products for export market" : "Efficiently manage farm product inventory and monitor stock levels"}
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
            <ShoppingBag className="text-blue-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Total Products</h3>
            <p className="text-2xl font-bold">{summary.totalProducts}</p>
          </div>
        </div>
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-orange-900/30" : "bg-orange-100"}`}>
            <AlertCircle className="text-orange-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Low Stock</h3>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.lowStock}</p>
          </div>
        </div>
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-red-900/30" : "bg-red-100"}`}>
            <AlertCircle className="text-red-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Critical Stock</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.criticalStock}</p>
          </div>
        </div>
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-yellow-900/30" : "bg-yellow-100"}`}>
            <Clock className="text-yellow-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Expiring Soon</h3>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.expiringSoon}</p>
          </div>
        </div>
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-red-900/30" : "bg-red-100"}`}>
            <Calendar className="text-red-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Expired</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.expired}</p>
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
          onClick={() => setActiveTab("lowStock")}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === "lowStock" ? "bg-orange-600 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Low Stock
        </button>
        <button
          onClick={() => setActiveTab("criticalStock")}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === "criticalStock" ? "bg-red-600 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Critical Stock
        </button>
        <button
          onClick={() => setActiveTab("expiringSoon")}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === "expiringSoon" ? "bg-yellow-600 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Expiring Soon
        </button>
        <button
          onClick={() => setActiveTab("expired")}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === "expired" ? "bg-red-600 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Expired
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
                    <option value="All Statuses">All Statuses</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Critical Stock">Critical Stock</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Expired">Expired</option>
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
              onClick={() => setExportModal({ ...exportModal, open: true })}
              className={`p-2.5 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all`}
              title="Export Data"
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
            {showExportView ? (
              <button
                onClick={handleBackToMain}
                className={`p-2.5 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all`}
                title="Back to All Products"
              >
                <ShoppingBag size={20} />
              </button>
            ) : (
              <button
                onClick={handleExportClick}
                className={`p-2.5 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all`}
                title="View Export Market Products"
              >
                <Globe size={20} />
              </button>
            )}
            <button
              onClick={() => {
                setEditingProduct(null);
                const creationDate = new Date().toISOString().split('T')[0];
                const defaultCategory = "Milk Product";
                const expiryDate = calculateExpiryDate(defaultCategory, creationDate);
                setFormData({
                  name: "",
                  category: defaultCategory,
                  stock: {
                    quantity: "",
                    unit: "kg"
                  },
                  price: "",
                  description: "",
                  creationDate: creationDate,
                  expiryDate: expiryDate,
                  market: showExportView ? "Export" : "Local",
                  image: ""
                });
                setImagePreview(null);
                setShowAddForm(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {showChart && (
        <div className={`mb-6 p-4 rounded-lg shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChartIcon size={20} />
            Stock Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className={`${darkMode ? "bg-gray-800/50" : "bg-gray-50"} p-4 rounded-md`}>
              <h4 className="text-md font-medium mb-3 text-center">Stock by Status</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getStockChartData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => (value > 0 ? `${name}: ${value}` : null)}
                    >
                      {getStockChartData().map((entry, index) => (
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
              <h4 className="text-md font-medium mb-3 text-center">Stock by Category</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getCategoryWiseData()}
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
                    <Bar dataKey="critical" stackId="a" fill={COLORS.critical} name="Critical/Expired" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="low" stackId="a" fill={COLORS.low} name="Low/Expiring Soon" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="good" stackId="a" fill={COLORS.good} name="Good" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className={`mb-4 flex justify-between items-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        <p className="text-sm">
          Showing {filteredProducts.length} of {inventory.length} items
        </p>
        {filteredProducts.length === 0 && (
          <button
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("All Categories");
              setStatusFilter("All Statuses");
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
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  IMAGE
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("name")}
                >
                  <div className="flex items-center">
                    PRODUCT NAME {getSortIcon("name")}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("stock")}
                >
                  <div className="flex items-center">
                    STOCK {getSortIcon("stock")}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("price")}
                >
                  <div className="flex items-center">
                    PRICE {getSortIcon("price")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  CATEGORY
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("expiryDate")}
                >
                  <div className="flex items-center">
                    EXPIRY DATE {getSortIcon("expiryDate")}
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const daysLeft = calculateDaysUntilExpiry(product.expiryDate);
                  const status = getProductStatus(product);
                  const stockLevelBadge = getStockLevelBadge(product.stock.quantity, product.stock.quantity + 10);
                  const rowBg =
                    status === "Critical Stock" || status === "Expired"
                      ? darkMode
                        ? "bg-red-900/10"
                        : "bg-red-50/50"
                      : status === "Low Stock" || status === "Expiring Soon"
                      ? darkMode
                        ? "bg-orange-900/10"
                        : "bg-orange-50/50"
                      : "";

                  return (
                    <tr key={product._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-all ${rowBg}`}>
                      <td className="px-6 py-4">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="h-12 w-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                            <ImageIcon size={20} className="text-gray-500" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center">
                          <ShoppingBag size={16} className="mr-2 text-gray-400" />
                          {product.name}
                        </div>
                        {product.description && (
                          <div className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {product.description.length > 30 ? `${product.description.substring(0, 30)}...` : product.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span>{product.stock.quantity} {product.stock.unit}</span>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${
                                status === "Critical Stock" || status === "Expired" ? "bg-red-500" : 
                                status === "Low Stock" || status === "Expiring Soon" ? "bg-orange-500" : "bg-green-500"
                              }`}
                              style={{ width: `${(product.stock.quantity / (product.stock.quantity + 10)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-green-600 dark:text-green-400">${product.price}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${stockLevelBadge.class}`}>
                          {status}
                        </span>
                        <div className="text-xs mt-1">
                          <span className={getDaysLeftClass(daysLeft)}>{getDaysLeftText(daysLeft)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${darkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                          {product.category}
                        </span>
                        <div className="text-xs mt-1">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${darkMode ? "bg-purple-900/50 text-purple-200" : "bg-purple-100 text-purple-800"}`}>
                            {product.market}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{new Date(product.expiryDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button
                            onClick={() => setShowQRCode(product)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-gray-100"}`}
                            title="View QR Code"
                          >
                            <QrCode size={18} />
                          </button>
                          <button
                            onClick={() => handleRefill(product)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-600 hover:bg-gray-100"}`}
                            title="Refill Stock"
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-indigo-400 hover:bg-gray-700" : "text-indigo-600 hover:bg-gray-100"}`}
                            title="Edit Product"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"}`}
                            title="Delete Product"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button
                            onClick={() => handleSendEmail(product)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-gray-100"}`}
                            title="Send Email Notification"
                          >
                            <Mail size={18} />
                          </button>
                          <button
                            onClick={() => handleSendWhatsApp(product)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-green-400 hover:bg-gray-700" : "text-green-600 hover:bg-gray-100"}`}
                            title="Send WhatsApp Notification"
                          >
                            <MessageSquare size={18} />
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
                      <ShoppingBag size={48} className="text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No products found</h3>
                      <p className={`text-sm max-w-md mx-auto ${darkMode ? "text-gray-400" : "text-gray-500"} mb-4`}>
                        Try adjusting your search or filter criteria, or add a new product.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setCategoryFilter("All Categories");
                          setStatusFilter("All Statuses");
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

      {/* Add/Edit Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {editingProduct ? <Edit size={24} /> : <Plus size={24} />}
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingProduct(null);
                  setImagePreview(null);
                }}
                className={`p-2 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition-all`}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Product Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-full object-cover border-2 border-green-500" />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <ImageIcon size={24} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <span className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all">
                      Upload Image
                    </span>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="mb-5">
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  required
                  placeholder="Enter product name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  >
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
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Market *
                  </label>
                  <select
                    name="market"
                    value={formData.market}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  >
                    <option value="Local">Local</option>
                    <option value="Export">Export</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.stock.quantity}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                    required
                    min="0"
                    placeholder="Quantity"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Unit *
                  </label>
                  <select
                    name="unit"
                    value={formData.stock.unit}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="liter">liter</option>
                    <option value="dozen">dozen</option>
                    <option value="jar">jar</option>
                    <option value="unit">unit</option>
                    <option value="pack">pack</option>
                  </select>
                </div>
              </div>

              <div className="mb-5">
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Price ($) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="mb-5">
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  rows={3}
                  placeholder="Product description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Creation Date *
                  </label>
                  <input
                    type="date"
                    name="creationDate"
                    value={formData.creationDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all opacity-50 cursor-not-allowed`}
                    required
                    readOnly
                  />
                  <p className={`text-xs mt-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Auto-calculated based on category
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProduct(null);
                    setImagePreview(null);
                  }}
                  className={`px-4 py-2.5 rounded-lg ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"} transition-all`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  {editingProduct ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refill Modal */}
      {showRefillForm && refillingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-lg w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Plus size={24} />
                Refill {refillingProduct.name}
              </h2>
              <button
                onClick={() => {
                  setShowRefillForm(false);
                  setRefillingProduct(null);
                }}
                className={`p-2 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition-all`}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRefillSubmit}>
              <div className="mb-5">
                <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} mb-4`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Current Stock</p>
                      <p className="font-semibold">{refillingProduct.stock.quantity} {refillingProduct.stock.unit}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Market</p>
                      <p className="font-semibold">{refillingProduct.market}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-5">
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Refill Quantity *
                </label>
                <input
                  type="number"
                  value={refillQuantity}
                  onChange={(e) => setRefillQuantity(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  required
                  min="1"
                  placeholder="Enter quantity to add"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefillForm(false);
                    setRefillingProduct(null);
                  }}
                  className={`px-4 py-2.5 rounded-lg ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"} transition-all`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                >
                  Refill Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-sm w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Product QR Code</h2>
              <button
                onClick={() => setShowQRCode(null)}
                className={`p-2 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition-all`}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg mb-4">
                <QRCodeSVG
                  value={generateProductInfo(showQRCode)}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">{showQRCode.name}</h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Scan this code to view product details
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-md w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Download size={24} />
                Export Data
              </h2>
              <button
                onClick={() => setExportModal({ ...exportModal, open: false })}
                className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportModal({...exportModal, format: 'excel'})}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center ${
                      exportModal.format === 'excel' 
                        ? 'border-green-500 bg-green-50 text-green-600' 
                        : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <FileSpreadsheet size={24} />
                    <span className="mt-1 text-sm">Excel</span>
                  </button>
                  <button
                    onClick={() => setExportModal({...exportModal, format: 'pdf'})}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center ${
                      exportModal.format === 'pdf' 
                        ? 'border-green-500 bg-green-50 text-green-600' 
                        : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <FileText size={24} />
                    <span className="mt-1 text-sm">PDF</span>
                  </button>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Data Selection
                </label>
                <div className="space-y-2">
                  <label className={`flex items-center ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <input
                      type="radio"
                      name="selection"
                      value="current"
                      checked={exportModal.selection === 'current'}
                      onChange={(e) => setExportModal({...exportModal, selection: e.target.value})}
                      className="mr-2"
                    />
                    Current View ({filteredProducts.length} items)
                  </label>
                  <label className={`flex items-center ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <input
                      type="radio"
                      name="selection"
                      value="all"
                      checked={exportModal.selection === 'all'}
                      onChange={(e) => setExportModal({...exportModal, selection: e.target.value})}
                      className="mr-2"
                    />
                    All Data ({inventory.length} items)
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setExportModal({ ...exportModal, open: false })}
                className={`flex-1 px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} transition-all`}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className={`flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all`}
              >
                Export {exportModal.format.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;