import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Grid,
  List,
  Edit,
  Trash2,
  X,
  Download,
  Upload,
  AlertCircle,
  Image as ImageIcon,
  QrCode,
  RefreshCw,
  Globe,
  ShoppingBag,
  Info
} from "lucide-react";
import { useITheme } from "../Icontexts/IThemeContext";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";

const Stock = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRefillForm, setShowRefillForm] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [editingProduct, setEditingProduct] = useState(null);
  const [refillingProduct, setRefillingProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showQRCode, setShowQRCode] = useState(null);
  const [refillQuantity, setRefillQuantity] = useState("");
  const [showExportView, setShowExportView] = useState(false);
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
  const [formErrors, setFormErrors] = useState({});

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, statusFilter, searchTerm, currentPage, showExportView]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        category: categoryFilter !== "All" ? categoryFilter : undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit,
        market: showExportView ? "Export" : undefined
      };
      const response = await axios.get("http://localhost:5000/api/inventory/products", { params });
      setInventory(response.data.products);
      setTotalPages(response.data.totalPages);
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

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Product name is required";
    }
    if (!formData.stock.quantity || formData.stock.quantity < 0) {
      errors.quantity = "Valid stock quantity is required";
    }
    if (!formData.price || formData.price < 0) {
      errors.price = "Valid price is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
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
      fetchProducts();
    } catch (error) {
      console.error("Error refilling product:", error);
      setError("Failed to refill product. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      const dataToSend = { ...formData };
      if (editingProduct) {
        await axios.put(`http://localhost:5000/api/inventory/products/${editingProduct._id}`, dataToSend);
      } else {
        await axios.post("http://localhost:5000/api/inventory/products", dataToSend);
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
      setFormErrors({});
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      setError(error.response?.data?.message || "Failed to save product. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
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
    return new Date(dateString).toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'In Stock':
        return darkMode ? 'bg-status-green-dark text-status-green-textDark' : 'bg-status-green-light text-status-green-textLight';
      case 'Low Stock':
        return darkMode ? 'bg-yellow-700 text-yellow-100' : 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock':
        return darkMode ? 'bg-status-red-dark text-status-red-textDark' : 'bg-status-red-light text-status-red-textLight';
      case 'Expiring Soon':
        return darkMode ? 'bg-yellow-700 text-yellow-100' : 'bg-yellow-100 text-yellow-800';
      case 'Expired':
        return darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800';
      default:
        return darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800';
    }
  };

  const getRowBackground = (status) => {
    if (status === 'Low Stock' || status === 'Expiring Soon') {
      return darkMode ? 'bg-yellow-900/50' : 'bg-yellow-50';
    }
    if (status === 'Expired') {
      return darkMode ? 'bg-red-900/50' : 'bg-red-50';
    }
    return darkMode ? 'hover:bg-dark-gray/80' : 'hover:bg-gray-50';
  };

  const getGridBorder = (status) => {
    if (status === 'Low Stock' || status === 'Expiring Soon') {
      return darkMode ? 'border-yellow-700' : 'border-yellow-200';
    }
    if (status === 'Expired') {
      return darkMode ? 'border-red-700' : 'border-red-200';
    }
    return darkMode ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300';
  };

  const generateProductInfo = (product) => {
    return `Product: ${product.name}
Category: ${product.category}
Stock: ${formatStock(product.stock)}
Price: $${product.price}
Created: ${product.creationDate ? formatDate(product.creationDate) : 'N/A'}
Expires: ${formatDate(product.expiryDate)}
Market: ${product.market}`;
  };

  const handleExportClick = () => {
    setShowExportView(true);
    setCurrentPage(1);
    fetchProducts();
  };

  const handleBackToMain = () => {
    setShowExportView(false);
    setCurrentPage(1);
    fetchProducts();
  };

  const handleNotify = (product) => {
    let email, phone;
    if (['Milk Product', 'Meat', 'Eggs', 'Honey', 'Material'].includes(product.category)) {
      email = "animal.manager@example.com";
      phone = "1234567890";
    } else {
      email = "plant.manager@example.com";
      phone = "0987654321";
    }
    let subject = `Low Stock Alert: ${product.name}`;
    let body = `Dear Management,\n\nThe product "${product.name}" is running low on stock.\nCurrent stock: ${product.stock.quantity} ${product.stock.unit}\nPlease consider refilling it.\n\nBest regards,\nInventory System`;
    if (product.status === 'Expiring Soon') {
      subject = `Expiring Soon Alert: ${product.name}`;
      body = `Dear Management,\n\nThe product "${product.name}" is expiring soon.\nExpiry date: ${formatDate(product.expiryDate)}\nPlease consider selling or using it soon.\n\nBest regards,\nInventory System`;
    } else if (product.status === 'Expired') {
      subject = `Expired Product Alert: ${product.name}`;
      body = `Dear Management,\n\nThe product "${product.name}" has expired.\nExpiry date: ${formatDate(product.expiryDate)}\nPlease consider removal or disposal.\n\nBest regards,\nInventory System`;
    }
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(body)}`, '_blank');
  };

  if (loading) {
    return (
      <div className={`min-h-full p-6 flex items-center justify-center ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {showExportView ? "Export Market Products" : "Farm Inventory"}
        </h1>
        <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          {showExportView ? "Viewing products marked for export market" : "Manage your farm products inventory"}
        </p>
      </div>
      {/* Error Message */}
      {error && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${darkMode ? "bg-status-red-dark text-status-red-textDark" : "bg-status-red-light text-status-red-textLight"}`}>
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}
      {/* Search and Actions */}
      <div className={`p-4 rounded-lg shadow-sm mb-6 ${darkMode ? "bg-dark-card" : "bg-white"}`}>
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
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? "bg-dark-gray border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg border ${darkMode ? "bg-dark-gray border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
            >
              <option value="All">All Categories</option>
              <option value="Animal Product">Animal Products</option>
              <option value="Plant Product">Plant Products</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg border ${darkMode ? "bg-dark-gray border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
            >
              <option value="All">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchProducts}
              className={`p-2 rounded-lg ${darkMode ? "hover:bg-dark-gray" : "hover:bg-gray-100"}`}
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>
            {showExportView ? (
              <button
                onClick={handleBackToMain}
                className={`p-2 rounded-lg ${darkMode ? "hover:bg-dark-gray" : "hover:bg-gray-100"}`}
                title="Back to All Products"
              >
                <ShoppingBag size={20} />
              </button>
            ) : (
              <button
                onClick={handleExportClick}
                className={`p-2 rounded-lg ${darkMode ? "hover:bg-dark-gray" : "hover:bg-gray-100"}`}
                title="View Export Market Products"
              >
                <Globe size={20} />
              </button>
            )}
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-status-green-light text-status-green-textLight dark:bg-status-green-dark dark:text-status-green-textDark' : 'bg-gray-100 text-gray-600 dark:bg-dark-gray dark:text-gray-300'}`}
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-status-green-light text-status-green-textLight dark:bg-status-green-dark dark:text-status-green-textDark' : 'bg-gray-100 text-gray-600 dark:bg-dark-gray dark:text-gray-300'}`}
              >
                <Grid size={20} />
              </button>
            </div>
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
                setFormErrors({});
                setShowAddForm(true);
              }}
              className="bg-btn-teal hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>
        </div>
      </div>
      {/* Table View */}
      {viewMode === 'table' && (
        <div className={`rounded-xl shadow-sm overflow-hidden border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <table className="min-w-full">
            <thead className={darkMode ? "bg-dark-gray" : "bg-gray-50"}>
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  IMAGE
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  PRODUCT
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  CATEGORY
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  STOCK
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  PRICE
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  EXPIRY DATE
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  MARKET
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {inventory.length > 0 ? (
                inventory.map((item) => (
                  <tr key={item._id} className={`${getRowBackground(item.status)} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-12 w-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-dark-gray flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                          <ImageIcon size={20} className="text-gray-500" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {item.description.length > 30 ? `${item.description.substring(0, 30)}...` : item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${darkMode ? "bg-status-blue-dark text-status-blue-textDark" : "bg-status-blue-light text-status-blue-textLight"}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold">{formatStock(item.stock)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-green-600 dark:text-green-400">${item.price}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(item.expiryDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${darkMode ? "bg-status-purple-dark text-status-purple-textDark" : "bg-status-purple-light text-status-purple-textLight"}`}>
                        {item.market}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => setShowQRCode(item)}
                          className={`p-2 rounded-md ${darkMode ? "text-btn-blue hover:bg-dark-gray" : "text-btn-blue hover:bg-gray-100"}`}
                          title="View QR Code"
                        >
                          <QrCode size={18} />
                        </button>
                        <button
                          onClick={() => handleRefill(item)}
                          className={`p-2 rounded-md ${darkMode ? "text-btn-yellow hover:bg-dark-gray" : "text-btn-yellow hover:bg-gray-100"}`}
                          title="Refill Stock"
                        >
                          Refill
                        </button>
                        {(item.status === 'Low Stock' || item.status === 'Expiring Soon' || item.status === 'Expired') && (
                          <button
                            onClick={() => handleNotify(item)}
                            className={`p-2 rounded-md ${item.status === 'Expired' ? (darkMode ? "text-btn-red hover:bg-dark-gray" : "text-btn-red hover:bg-gray-100") : (darkMode ? "text-btn-yellow hover:bg-dark-gray" : "text-btn-yellow hover:bg-gray-100")}`}
                            title={item.status === 'Expired' ? "Notify Management for Expired Product" : item.status === 'Expiring Soon' ? "Notify Management for Expiring Product" : "Notify Management for Low Stock"}
                          >
                            <AlertCircle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(item)}
                          className={`p-2 rounded-md ${darkMode ? "text-indigo-400 hover:bg-dark-gray" : "text-indigo-600 hover:bg-gray-100"}`}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className={`p-2 rounded-md ${darkMode ? "text-btn-red hover:bg-dark-gray" : "text-btn-red hover:bg-gray-100"}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingBag size={48} className="text-gray-400 mb-2" />
                      <p className="text-lg font-medium">No products found</p>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {inventory.length > 0 ? (
            inventory.map((item) => (
              <div
                key={item._id}
                className={`p-5 rounded-lg shadow-sm border flex flex-col h-full ${darkMode ? `bg-dark-card ${getGridBorder(item.status)}` : `bg-white ${getGridBorder(item.status)}`} transition-all duration-200 hover:shadow-md relative`}
              >
                {/* Low Stock or Expired Alert Banner */}
                {(item.status === 'Low Stock' || item.status === 'Expiring Soon' || item.status === 'Expired') && (
                  <div className={`absolute top-0 left-0 right-0 py-1 text-center text-xs font-bold rounded-t-lg ${item.status === 'Expired' ? (darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800') : (darkMode ? 'bg-yellow-700 text-yellow-100' : 'bg-yellow-100 text-yellow-800')}`}>
                    {item.status === 'Expired' ? 'EXPIRED' : 'LOW STOCK / EXPIRING SOON'}
                  </div>
                )}
                <div className={`flex justify-between items-start mb-4 ${(item.status === 'Low Stock' || item.status === 'Expiring Soon' || item.status === 'Expired') ? 'mt-4' : ''}`}>
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-14 w-14 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-dark-gray flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                        <ImageIcon size={24} className="text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <span className={`px-2 py-1 mt-1 inline-flex text-xs leading-5 font-semibold rounded-full ${darkMode ? "bg-status-blue-dark text-status-blue-textDark" : "bg-status-blue-light text-status-blue-textLight"}`}>
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowQRCode(item)}
                      className={`p-1.5 rounded-md ${darkMode ? "text-btn-blue hover:bg-dark-gray" : "text-btn-blue hover:bg-gray-100"}`}
                      title="View QR Code"
                    >
                      <QrCode size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      Stock:
                    </span>
                    <span className="font-medium">{formatStock(item.stock)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      Price:
                    </span>
                    <span className="font-bold text-green-600 dark:text-green-400">${item.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      Expires:
                    </span>
                    <span>{formatDate(item.expiryDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      Market:
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${darkMode ? "bg-status-purple-dark text-status-purple-textDark" : "bg-status-purple-light text-status-purple-textLight"}`}>
                      {item.market}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      Status:
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  {item.description && (
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                      {item.description}
                    </div>
                  )}
                </div>
                <div className="flex justify-between pt-3 mt-auto border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleRefill(item)}
                    className={`px-3 py-1.5 text-sm rounded-md ${darkMode ? "text-btn-yellow hover:bg-dark-gray" : "text-btn-yellow hover:bg-gray-100"}`}
                  >
                    Refill
                  </button>
                  <div className="flex gap-2">
                    {(item.status === 'Low Stock' || item.status === 'Expiring Soon' || item.status === 'Expired') && (
                      <button
                        onClick={() => handleNotify(item)}
                        className={`p-1.5 rounded-md ${item.status === 'Expired' ? (darkMode ? "text-btn-red hover:bg-dark-gray" : "text-btn-red hover:bg-gray-100") : (darkMode ? "text-btn-yellow hover:bg-dark-gray" : "text-btn-yellow hover:bg-gray-100")}`}
                        title={item.status === 'Expired' ? "Notify Management for Expired Product" : item.status === 'Expiring Soon' ? "Notify Management for Expiring Product" : "Notify Management for Low Stock"}
                      >
                        <AlertCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(item)}
                      className={`p-1.5 rounded-md ${darkMode ? "text-indigo-400 hover:bg-dark-gray" : "text-indigo-600 hover:bg-gray-100"}`}
                      title="Edit Product"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className={`p-1.5 rounded-md ${darkMode ? "text-btn-red hover:bg-dark-gray" : "text-btn-red hover:bg-gray-100"}`}
                      title="Delete Product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={`col-span-full p-8 text-center ${darkMode ? "bg-dark-card" : "bg-white"} rounded-lg border border-dashed ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
              <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      )}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 1 ? 'bg-gray-300 dark:bg-dark-gray text-gray-500' : 'bg-btn-teal text-white hover:bg-green-700'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === totalPages ? 'bg-gray-300 dark:bg-dark-gray text-gray-500' : 'bg-btn-teal text-white hover:bg-green-700'}`}
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
      {/* Add/Edit Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 ${darkMode ? "bg-dark-card" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingProduct ? (formData.market === "Export" ? "Edit Export Product" : "Edit Product") : (formData.market === "Export" ? "Add Export Product" : "Add New Product")}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingProduct(null);
                  setImagePreview(null);
                  setFormErrors({});
                }}
                className={darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"} flex items-center gap-2`}>
                  Product Image
                  <span title="Upload a high-quality image of the product (optional)" className="cursor-pointer">
                    <Info size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-full object-cover border-2 border-green-500" />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-dark-gray flex items-center justify-center">
                        <ImageIcon size={24} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <span className="bg-btn-teal hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-colors duration-200">
                      <Upload size={16} />
                      {imagePreview ? "Change Image" : "Upload Image"}
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
              {/* Product Details */}
              <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Product Details</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"} flex items-center gap-2`}>
                      Product Name *
                      <span title="Enter the name of the product" className="cursor-pointer">
                        <Info size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                      </span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-dark-gray border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                      required
                      placeholder="e.g., Organic Honey"
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"} flex items-center gap-2`}>
                      Description
                      <span title="Enter a description of the product (optional)" className="cursor-pointer">
                        <Info size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                      </span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-dark-gray border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                      placeholder="e.g., Fresh organic honey from local bees"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"} flex items-center gap-2`}>
                        Category *
                        <span title="Select the product category" className="cursor-pointer">
                          <Info size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                        </span>
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-dark-gray border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                      >
                        <optgroup label="Animal Products">
                          <option value="Milk Product">Milk Product</option>
                          <option value="Meat">Meat</option>
                          <option value="Eggs">Eggs</option>
                          <option value="Honey">Honey</option>
                          <option value="Material">Material</option>
                        </optgroup>
                        <optgroup label="Plant Products">
                          <option value="Vegetables">Vegetables</option>
                          <option value="Fruits">Fruits</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"} flex items-center gap-2`}>
                        Market *
                        <span title="Select Local for domestic sales or Export for international markets" className="cursor-pointer">
                          <Info size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                        </span>
                      </label>
                      <select
                        name="market"
                        value={formData.market}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-dark-gray border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                      >
                        <option value="Local">Local</option>
                        <option value="Export">Export</option>
                      </select>
                      {formErrors.market && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.market}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Stock and Pricing */}
              <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Stock & Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"} flex items-center gap-2`}>
                      Stock Quantity *
                      <span title="Enter the quantity available" className="cursor-pointer">
                        <Info size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                      </span>
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.stock.quantity}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-dark-gray border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                      required
                      min="0"
                      placeholder="e.g., 100"
                    />
                    {formErrors.quantity && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>
                    )}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"} flex items-center gap-2`}>
                      Unit *
                      <span title="Select the unit of measurement" className="cursor-pointer">
                        <Info size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                      </span>
                    </label>
                    <select
                      name="unit"
                      value={formData.stock.unit}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-dark-gray border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                    >
                      <option value="kg">kg</option>
                      <option value="liter">liter</option>
                      <option value="dozen">dozen</option>
                      <option value="jar">jar</option>
                      <option value="unit">unit</option>
                      <option value="pack">pack</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"} flex items-center gap-2`}>
                    Price ($) *
                    <span title="Enter the price per unit" className="cursor-pointer">
                      <Info size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                    </span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-dark-gray border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g., 5.99"
                  />
                  {formErrors.price && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>
                  )}
                </div>
              </div>
              {/* Dates */}
              <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"} flex items-center gap-2`}>
                      Creation Date *
                      <span title="Select the date the product was added" className="cursor-pointer">
                        <Info size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                      </span>
                    </label>
                    <input
                      type="date"
                      name="creationDate"
                      value={formData.creationDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-dark-gray border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"} flex items-center gap-2`}>
                      Expiry Date *
                      <span title="Auto-calculated based on category" className="cursor-pointer">
                        <Info size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                      </span>
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-dark-gray border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500 opacity-50 cursor-not-allowed`}
                      required
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-calculated based on category
                    </p>
                  </div>
                </div>
              </div>
              {/* Form Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProduct(null);
                    setImagePreview(null);
                    setFormErrors({});
                  }}
                  className={`px-6 py-2 rounded-md ${darkMode ? "bg-dark-gray text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"} transition-colors duration-200`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-btn-teal text-white rounded-md hover:bg-green-700 transition-colors duration-200"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-lg max-w-md w-full p-6 ${darkMode ? "bg-dark-card" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Refill {refillingProduct.name}</h2>
              <button
                onClick={() => {
                  setShowRefillForm(false);
                  setRefillingProduct(null);
                }}
                className={darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRefillSubmit}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Current Stock: {refillingProduct.stock.quantity} {refillingProduct.stock.unit}
                </label>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Current Expiry: {formatDate(refillingProduct.expiryDate)}
                </label>
              </div>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Refill Quantity *
                </label>
                <input
                  type="number"
                  value={refillQuantity}
                  onChange={(e) => setRefillQuantity(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-dark-gray border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                  required
                  min="1"
                  placeholder="Enter quantity to add"
                />
              </div>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Note: Refilling will update the creation date and recalculate the expiry date based on the current date.
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefillForm(false);
                    setRefillingProduct(null);
                  }}
                  className={`px-4 py-2 rounded-md ${darkMode ? "bg-dark-gray text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"} transition-colors duration-200`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-btn-teal text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                >
                  Refill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-lg max-w-sm w-full p-6 ${darkMode ? "bg-dark-card" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Product QR Code</h2>
              <button
                onClick={() => setShowQRCode(null)}
                className={darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg mb-4" id="qrcode-container">
                <QRCodeSVG
                  value={generateProductInfo(showQRCode)}
                  size={200}
                  level="H"
                  includeMargin={true}
                  id="product-qrcode"
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">{showQRCode.name}</h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Scan this code to view product details
                </p>
              </div>
              <button
                onClick={() => {
                  const svgElement = document.getElementById('product-qrcode');
                  if (!svgElement) return;
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const size = 200;
                  canvas.width = size;
                  canvas.height = size;
                  const svgData = new XMLSerializer().serializeToString(svgElement);
                  const img = new Image();
                  const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
                  const url = URL.createObjectURL(svgBlob);
                  img.onload = function() {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, size, size);
                    const pngUrl = canvas.toDataURL('image/png');
                    const downloadLink = document.createElement('a');
                    downloadLink.href = pngUrl;
                    downloadLink.download = `${showQRCode.name.replace(/\s+/g, '-').toLowerCase()}-qrcode.png`;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                    URL.revokeObjectURL(url);
                  };
                  img.src = url;
                }}
                className="mt-4 px-4 py-2 bg-btn-blue text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors duration-200"
              >
                <Download size={16} />
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;