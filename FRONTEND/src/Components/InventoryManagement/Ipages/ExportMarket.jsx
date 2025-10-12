import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Info,
  Calendar,
  Package,
  Zap,
  Clock,
  Globe,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  MapPin,
  DollarSign,
  Truck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Eye,
  Target,
  Activity,
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
  LineChart,
  Line,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ExportMarket = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  
  // State management
  const [exportEntries, setExportEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [productFilter, setProductFilter] = useState("All Products");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showChart, setShowChart] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "exportDate", direction: "desc" });
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [countrySuggestions, setCountrySuggestions] = useState([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    productId: "",
    exportCountry: "",
    exportDate: "",
    quantity: "",
    unit: "",
    exportPrice: "",
    status: "Pending",
  });

  // Color palette consistent with other components
  const colors = {
    primary: "#10b981",
    secondary: "#3b82f6",
    accent: "#f59e0b",
    danger: "#ef4444",
    success: "#22c55e",
    warning: "#f59e0b",
    info: "#06b6d4",
    dark: "#1f2937",
    light: "#f8fafc",
  };

  // Chart colors
  const chartColors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];

  // Fetch export entries
  const fetchExportEntries = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/export-market");
      if (response.data.success) {
        setExportEntries(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching export entries:", error);
      setError("Failed to fetch export entries");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products with available stock for export market
  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/inventory/products?market=Export&hasStock=true");
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchExportEntries();
    fetchProducts();
  }, []);

  // Close suggestion dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.relative')) {
        setShowProductSuggestions(false);
        setShowCountrySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that a product is selected
    if (!formData.productId) {
      setError("Please select a valid product from the suggestions");
      return;
    }

    // Validate quantity is positive
    if (formData.quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    // Validate export price is positive
    if (formData.exportPrice <= 0) {
      setError("Export price must be greater than 0");
      return;
    }
    
    try {
      setLoading(true);
      const url = editingEntry 
        ? `http://localhost:5000/api/export-market/${editingEntry._id}`
        : "http://localhost:5000/api/export-market";
      
      const method = editingEntry ? "put" : "post";
      
      const response = await axios[method](url, formData);
      
      if (response.data.success) {
        setSuccess(editingEntry ? "Export entry updated successfully!" : "Export entry created successfully!");
        setShowAddForm(false);
        setShowEditForm(false);
        setEditingEntry(null);
        setFormData({
          productId: "",
          exportCountry: "",
          exportDate: "",
          quantity: "",
          unit: "",
          exportPrice: "",
          status: "Pending",
        });
        setProductSearchTerm("");
        setShowProductSuggestions(false);
        setShowCountrySuggestions(false);
        fetchExportEntries();
        fetchProducts();
      }
    } catch (error) {
      console.error("Error saving export entry:", error);
      setError(error.response?.data?.message || "Failed to save export entry");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setProductSearchTerm(entry.product?.name || "");
    setFormData({
      productId: entry.product._id,
      exportCountry: entry.exportCountry,
      exportDate: new Date(entry.exportDate).toISOString().split('T')[0],
      quantity: entry.quantity,
      unit: entry.unit,
      exportPrice: entry.exportPrice,
      status: entry.status,
    });
    setShowEditForm(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this export entry?")) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/export-market/${id}`);
        if (response.data.success) {
          setSuccess("Export entry deleted successfully!");
          fetchExportEntries();
          fetchProducts();
        }
      } catch (error) {
        console.error("Error deleting export entry:", error);
        setError(error.response?.data?.message || "Failed to delete export entry");
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedEntries.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedEntries.length} export entries?`)) {
      try {
        await Promise.all(
          selectedEntries.map(id => axios.delete(`http://localhost:5000/api/export-market/${id}`))
        );
        setSuccess(`${selectedEntries.length} export entries deleted successfully!`);
        setSelectedEntries([]);
        setShowBulkActions(false);
        fetchExportEntries();
        fetchProducts();
      } catch (error) {
        console.error("Error deleting export entries:", error);
        setError("Failed to delete some export entries");
      }
    }
  };

  // Handle status update
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/export-market/${id}`, {
        status: newStatus,
      });
      if (response.data.success) {
        setSuccess("Status updated successfully!");
        fetchExportEntries();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update status");
    }
  };

  // Handle country input with suggestions
  const handleCountryInput = (value) => {
    setFormData({ ...formData, exportCountry: value });
    
    if (value.length > 0) {
      const suggestions = commonCountries.filter(country =>
        country.toLowerCase().startsWith(value.toLowerCase())
      );
      setCountrySuggestions(suggestions.slice(0, 8)); // Show max 8 suggestions
      setShowCountrySuggestions(suggestions.length > 0);
    } else {
      setCountrySuggestions([]);
      setShowCountrySuggestions(false);
    }
  };

  // Handle product search
  const handleProductSearch = (value) => {
    setProductSearchTerm(value);
    setShowProductSuggestions(value.length > 0);
    
    // If exact match found, set the product
    const exactMatch = uniqueProducts.find(product => 
      product.name.toLowerCase() === value.toLowerCase()
    );
    
    if (exactMatch) {
      setFormData({
        ...formData,
        productId: exactMatch._id,
        unit: exactMatch.stock.unit,
      });
    } else {
      setFormData({ ...formData, productId: "" });
    }
  };

  // Select product from suggestions
  const selectProduct = (product) => {
    setProductSearchTerm(product.name);
    setFormData({
      ...formData,
      productId: product._id,
      unit: product.stock.unit,
    });
    setShowProductSuggestions(false);
  };

  // Select country from suggestions
  const selectCountry = (country) => {
    setFormData({ ...formData, exportCountry: country });
    setShowCountrySuggestions(false);
  };

  // Sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  // Filter and sort data
  const filteredAndSortedEntries = exportEntries
    .filter(entry => {
      const matchesSearch = entry.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.exportCountry.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = countryFilter === "All Countries" || entry.exportCountry === countryFilter;
      const matchesStatus = statusFilter === "All Status" || entry.status === statusFilter;
      const matchesProduct = productFilter === "All Products" || entry.product?._id === productFilter;
      
      return matchesSearch && matchesCountry && matchesStatus && matchesProduct;
    })
    .sort((a, b) => {
      const aValue = sortConfig.key === "product" ? a.product?.name : a[sortConfig.key];
      const bValue = sortConfig.key === "product" ? b.product?.name : b[sortConfig.key];
      
      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get unique countries and products for filters
  const uniqueCountries = [...new Set(exportEntries.map(entry => entry.exportCountry))];
  
  // Only show products with available stock for export market
  const uniqueProducts = products.filter(product => 
    product.market === "Export" && product.stock.quantity > 0
  );

  // Filtered products based on search term
  const filteredProducts = uniqueProducts.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  // Common countries list for suggestions
  const commonCountries = [
    "United States", "Canada", "United Kingdom", "Germany", "France", "Italy", "Spain",
    "Netherlands", "Belgium", "Switzerland", "Austria", "Sweden", "Norway", "Denmark",
    "Finland", "Japan", "South Korea", "China", "India", "Australia", "New Zealand",
    "Singapore", "Malaysia", "Thailand", "Philippines", "Indonesia", "Vietnam",
    "Brazil", "Argentina", "Chile", "Mexico", "Colombia", "Peru", "Uruguay",
    "South Africa", "Nigeria", "Kenya", "Egypt", "Morocco", "Tunisia",
    "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman"
  ];

  // Calculate summary statistics
  const totalExports = exportEntries.length;
  const totalValue = exportEntries.reduce((sum, entry) => sum + (entry.exportPrice * entry.quantity), 0);
  const pendingExports = exportEntries.filter(entry => entry.status === "Pending").length;
  const deliveredExports = exportEntries.filter(entry => entry.status === "Delivered").length;

  // Get top countries by export value
  const countryStats = exportEntries.reduce((acc, entry) => {
    const country = entry.exportCountry;
    if (!acc[country]) {
      acc[country] = { country, value: 0, count: 0 };
    }
    acc[country].value += entry.exportPrice * entry.quantity;
    acc[country].count += 1;
    return acc;
  }, {});

  const topCountries = Object.values(countryStats)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Get monthly export trends
  const monthlyTrends = exportEntries.reduce((acc, entry) => {
    const month = new Date(entry.exportDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = { month, value: 0, count: 0 };
    }
    acc[month].value += entry.exportPrice * entry.quantity;
    acc[month].count += 1;
    return acc;
  }, {});

  const monthlyData = Object.values(monthlyTrends).slice(-6); // Last 6 months

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Export Market Report", 20, 20);
    
    const tableData = filteredAndSortedEntries.map(entry => [
      entry.product?.name || "N/A",
      entry.exportCountry,
      entry.quantity,
      entry.unit,
      `$${entry.exportPrice}`,
      entry.status,
      new Date(entry.exportDate).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [["Product", "Country", "Quantity", "Unit", "Price", "Status", "Date"]],
      body: tableData,
      startY: 30,
    });

    doc.save("export-market-report.pdf");
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      Pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      Shipped: { color: "bg-blue-100 text-blue-800", icon: Truck },
      Delivered: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      Cancelled: { color: "bg-red-100 text-red-800", icon: X },
    };

    const config = statusConfig[status] || statusConfig.Pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  // Loading component
  if (loading && exportEntries.length === 0) {
    return (
      <div className={`min-h-full p-6 ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Globe className="text-green-500" size={32} />
          Export Market Management
        </h1>
        <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Manage international exports, track shipments, and monitor export performance
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${darkMode ? "bg-green-900/30 text-green-200" : "bg-green-100 text-green-800"} shadow-sm`}>
          <Zap size={20} className="mr-3 flex-shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${darkMode ? "bg-red-900/30 text-red-200" : "bg-red-100 text-red-800"} shadow-sm`}>
          <AlertCircle size={20} className="mr-3 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Total Exports</p>
              <p className="text-2xl font-bold text-green-500">{totalExports}</p>
            </div>
            <Globe className="text-green-500" size={24} />
          </div>
        </div>

        <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Total Value</p>
              <p className="text-2xl font-bold text-blue-500">${totalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="text-blue-500" size={24} />
          </div>
        </div>

        <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Pending</p>
              <p className="text-2xl font-bold text-yellow-500">{pendingExports}</p>
            </div>
            <Clock className="text-yellow-500" size={24} />
          </div>
        </div>

        <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Delivered</p>
              <p className="text-2xl font-bold text-green-500">{deliveredExports}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {showChart && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Countries Chart */}
          <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="mr-2 text-green-500" size={20} />
              Top Export Countries
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCountries}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                <XAxis dataKey="country" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                    border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                    borderRadius: "8px",
                    color: darkMode ? "#f9fafb" : "#111827"
                  }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trends Chart */}
          <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="mr-2 text-blue-500" size={20} />
              Monthly Export Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                <XAxis dataKey="month" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                    border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                    borderRadius: "8px",
                    color: darkMode ? "#f9fafb" : "#111827"
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              darkMode
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            <Plus size={20} />
            Add Export Entry
          </button>

          {selectedEntries.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                darkMode
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              <Trash2 size={20} />
              Delete Selected ({selectedEntries.length})
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchExportEntries}
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
            <BarChart3 size={20} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all`}
            title="Toggle Filters"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className={`p-4 rounded-xl mb-6 ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search exports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              >
                <option value="All Countries">All Countries</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              >
                <option value="All Status">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Product
              </label>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              >
                <option value="All Products">All Products</option>
                {uniqueProducts.map(product => (
                  <option key={product._id} value={product._id}>{product.name} ({product.stock.quantity} {product.stock.unit})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Export Entries Table */}
      <div className={`rounded-xl overflow-hidden shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedEntries.length === filteredAndSortedEntries.length && filteredAndSortedEntries.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEntries(filteredAndSortedEntries.map(entry => entry._id));
                      } else {
                        setSelectedEntries([]);
                      }
                    }}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("product")}
                    className="flex items-center gap-1 hover:text-green-500"
                  >
                    Product
                    {sortConfig.key === "product" && (
                      sortConfig.direction === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("exportCountry")}
                    className="flex items-center gap-1 hover:text-green-500"
                  >
                    Country
                    {sortConfig.key === "exportCountry" && (
                      sortConfig.direction === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("quantity")}
                    className="flex items-center gap-1 hover:text-green-500"
                  >
                    Quantity
                    {sortConfig.key === "quantity" && (
                      sortConfig.direction === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("exportPrice")}
                    className="flex items-center gap-1 hover:text-green-500"
                  >
                    Price
                    {sortConfig.key === "exportPrice" && (
                      sortConfig.direction === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center gap-1 hover:text-green-500"
                  >
                    Status
                    {sortConfig.key === "status" && (
                      sortConfig.direction === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("exportDate")}
                    className="flex items-center gap-1 hover:text-green-500"
                  >
                    Export Date
                    {sortConfig.key === "exportDate" && (
                      sortConfig.direction === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {filteredAndSortedEntries.map((entry) => (
                <tr key={entry._id} className={`${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedEntries.includes(entry._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEntries([...selectedEntries, entry._id]);
                        } else {
                          setSelectedEntries(selectedEntries.filter(id => id !== entry._id));
                        }
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="mr-3 text-gray-400" size={16} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{entry.product?.name || "N/A"}</div>
                        <div className="text-sm text-gray-500">{entry.product?.category || "N/A"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="mr-2 text-gray-400" size={16} />
                      <span className="text-sm text-gray-900">{entry.exportCountry}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{entry.quantity} {entry.unit}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-green-600">${entry.exportPrice}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="mr-2 text-gray-400" size={16} />
                      <span className="text-sm text-gray-900">
                        {new Date(entry.exportDate).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={entry.status}
                        onChange={(e) => handleStatusUpdate(entry._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border ${
                          darkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedEntries.length === 0 && (
          <div className="text-center py-12">
            <Globe className="mx-auto text-gray-400" size={48} />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No export entries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new export entry.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || showEditForm) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {showEditForm ? "Edit Export Entry" : "Add New Export Entry"}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setShowEditForm(false);
                  setEditingEntry(null);
                  setFormData({
                    productId: "",
                    exportCountry: "",
                    exportDate: "",
                    quantity: "",
                    unit: "",
                    exportPrice: "",
                    status: "Pending",
                  });
                  setProductSearchTerm("");
                  setShowProductSuggestions(false);
                  setShowCountrySuggestions(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Product *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearchTerm}
                      onChange={(e) => handleProductSearch(e.target.value)}
                      placeholder="Type product name..."
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        formData.productId 
                          ? (darkMode ? "border-green-500 bg-green-900/20" : "border-green-500 bg-green-50")
                          : (darkMode
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500")
                      } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    />
                    {formData.productId && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CheckCircle className="text-green-500" size={20} />
                      </div>
                    )}
                    {showProductSuggestions && filteredProducts.length > 0 && (
                      <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg border ${
                        darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
                      } max-h-48 overflow-y-auto`}>
                        {filteredProducts.map(product => (
                          <div
                            key={product._id}
                            onClick={() => selectProduct(product)}
                            className={`px-3 py-2 cursor-pointer hover:bg-green-500 hover:text-white transition-colors ${
                              darkMode ? "text-gray-200 hover:bg-green-600" : "text-gray-900"
                            }`}
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm opacity-75">
                              {product.stock.quantity} {product.stock.unit} available - ${product.price}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {showProductSuggestions && filteredProducts.length === 0 && (
                      <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg border ${
                        darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
                      }`}>
                        <div className={`px-3 py-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          No products with available stock found
                        </div>
                      </div>
                    )}
                  </div>
                  {formData.productId && (
                    <div className={`mt-2 text-xs ${darkMode ? "text-green-400" : "text-green-600"}`}>
                      ✓ Product selected with available stock
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Export Country *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.exportCountry}
                      onChange={(e) => handleCountryInput(e.target.value)}
                      placeholder="Start typing country name..."
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    />
                    {showCountrySuggestions && countrySuggestions.length > 0 && (
                      <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg border ${
                        darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
                      } max-h-48 overflow-y-auto`}>
                        {countrySuggestions.map((country, index) => (
                          <div
                            key={index}
                            onClick={() => selectCountry(country)}
                            className={`px-3 py-2 cursor-pointer hover:bg-green-500 hover:text-white transition-colors ${
                              darkMode ? "text-gray-200 hover:bg-green-600" : "text-gray-900"
                            }`}
                          >
                            <Globe className="inline w-4 h-4 mr-2" />
                            {country}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Export Date *
                  </label>
                  <input
                    type="date"
                    value={formData.exportDate}
                    onChange={(e) => setFormData({ ...formData, exportDate: e.target.value })}
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Enter quantity"
                    min="1"
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  />
                  {formData.productId && (
                    <div className={`mt-1 text-xs ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                      Available stock: {products.find(p => p._id === formData.productId)?.stock.quantity || 0} {formData.unit}
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  >
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="dozen">dozen</option>
                    <option value="jar">jar</option>
                    <option value="unit">unit</option>
                    <option value="pack">pack</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Export Price *
                  </label>
                  <input
                    type="number"
                    value={formData.exportPrice}
                    onChange={(e) => setFormData({ ...formData, exportPrice: e.target.value })}
                    placeholder="Enter price per unit"
                    min="0"
                    step="0.01"
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setShowEditForm(false);
                    setEditingEntry(null);
                    setFormData({
                      productId: "",
                      exportCountry: "",
                      exportDate: "",
                      quantity: "",
                      unit: "",
                      exportPrice: "",
                      status: "Pending",
                    });
                    setProductSearchTerm("");
                    setShowProductSuggestions(false);
                    setShowCountrySuggestions(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    darkMode
                      ? "bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                      : "bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                  }`}
                >
                  {loading ? "Saving..." : showEditForm ? "Update Entry" : "Create Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMarket;