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
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRefillForm, setShowRefillForm] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [editingProduct, setEditingProduct] = useState(null);
  const [refillingProduct, setRefillingProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showQRCode, setShowQRCode] = useState(null);
  const [refillQuantity, setRefillQuantity] = useState("");
  const [showExportView, setShowExportView] = useState(false);
  const [subCategory, setSubCategory] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    category: "Animal Product",
    stock: {
      quantity: "",
      unit: "kg"
    },
    price: "",
    expiryDate: "",
    creationDate: new Date().toISOString().split('T')[0],
    market: "Local",
    image: ""
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, [showExportView]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/inventory/products", {
        params: { market: showExportView ? "Export" : undefined }
      });
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
      case "Animal Product":
        daysToAdd = 7;
        break;
      case "Vegetables":
        daysToAdd = 10;
        break;
      case "Fruits":
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
    if (formData.category === "Plant Product" && !subCategory) {
      errors.subCategory = "Sub category is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Filter inventory based on search term
  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.market.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get export products only
  const exportProducts = inventory.filter(item => item.market === "Export");

  // Helper function to display category in UI
  const displayCategory = (category) => {
    return category === "Vegetables" || category === "Fruits" ? "Plant Product" : category;
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
    } else if (name === "subCategory") {
      setSubCategory(value);
      updatedFormData.expiryDate = calculateExpiryDate(value, formData.creationDate);
    } else if (name === "category" || name === "creationDate") {
      updatedFormData = {
        ...formData,
        [name]: value
      };
      if (name === "category" && value === "Plant Product") {
        if (!subCategory) {
          setSubCategory("Vegetables");
        }
      }
      const effectiveCategory = (name === "category" ? value : formData.category) === "Plant Product" ? subCategory || "Vegetables" : (name === "category" ? value : formData.category);
      updatedFormData.expiryDate = calculateExpiryDate(
        effectiveCategory,
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
    let category = product.category;
    let tempSubCategory = "";
    if (product.category === "Vegetables" || product.category === "Fruits") {
      category = "Plant Product";
      tempSubCategory = product.category;
    }
    setFormData({
      name: product.name,
      category: category,
      stock: {
        quantity: product.stock.quantity,
        unit: product.stock.unit
      },
      price: product.price,
      creationDate: product.creationDate ? product.creationDate.split('T')[0] : new Date().toISOString().split('T')[0],
      expiryDate: product.expiryDate.split('T')[0],
      market: product.market,
      image: product.image
    });
    setSubCategory(tempSubCategory);
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
      const dataToSend = {
        ...formData,
        category: formData.category === "Plant Product" ? subCategory : formData.category
      };
      if (editingProduct) {
        await axios.put(`http://localhost:5000/api/inventory/products/${editingProduct._id}`, dataToSend);
      } else {
        await axios.post("http://localhost:5000/api/inventory/products", dataToSend);
      }
      setShowAddForm(false);
      setEditingProduct(null);
      setSubCategory("");
      setFormData({
        name: "",
        category: "Animal Product",
        stock: {
          quantity: "",
          unit: "kg"
        },
        price: "",
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
        return darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      case 'Low Stock':
        return darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock':
        return darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      case 'Expiring Soon':
        return darkMode ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800';
      default:
        return darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800';
    }
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
    setSearchTerm("");
    fetchProducts();
  };

  const handleBackToMain = () => {
    setShowExportView(false);
    setSearchTerm("");
    fetchProducts();
  };

  const handleNotify = (product) => {
    let email, phone;
    if (product.category === "Animal Product") {
      email = "animal.manager@example.com";
      phone = "1234567890";
    } else {
      email = "plant.manager@example.com";
      phone = "0987654321";
    }
    const subject = `Low Stock Alert: ${product.name}`;
    const body = `Dear Management,\n\nThe product "${product.name}" is running low on stock.\nCurrent stock: ${product.stock.quantity} ${product.stock.unit}\nPlease consider refilling it.\n\nBest regards,\nInventory System`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(body)}`, '_blank');
  };

  if (loading) {
    return (
      <div className={`min-h-full p-6 flex items-center justify-center ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4">Loading products...</p>
        </div>
      </div>
    );
  }

  // Determine which products to display
  const displayProducts = showExportView ? exportProducts : filteredInventory;

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
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
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
      
          <div className="flex items-center gap-3">
            <button
              onClick={fetchProducts}
              className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>
        
            {showExportView ? (
              <button
                onClick={handleBackToMain}
                className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                title="Back to All Products"
              >
                <ShoppingBag size={20} />
              </button>
            ) : (
              <button
                onClick={handleExportClick}
                className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                title="View Export Market Products"
              >
                <Globe size={20} />
              </button>
            )}
        
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                <Grid size={20} />
              </button>
            </div>
        
            <button
              onClick={() => {
                setEditingProduct(null);
                const creationDate = new Date().toISOString().split('T')[0];
                const defaultCategory = "Animal Product";
                const expiryDate = calculateExpiryDate(defaultCategory, creationDate);
            
                setFormData({
                  name: "",
                  category: defaultCategory,
                  stock: {
                    quantity: "",
                    unit: "kg"
                  },
                  price: "",
                  creationDate: creationDate,
                  expiryDate: expiryDate,
                  market: showExportView ? "Export" : "Local",
                  image: ""
                });
                setSubCategory("");
                setImagePreview(null);
                setFormErrors({});
                setShowAddForm(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>
        </div>
      </div>
      {/* Table View */}
      {viewMode === 'table' && (
        <div className={`rounded-lg shadow-sm overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  IMAGE
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
                  PRICE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  EXPIRY DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  MARKET
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
              {displayProducts.length > 0 ? (
                displayProducts.map((item) => (
                  <tr key={item._id} className={item.status === 'Low Stock' ? `${darkMode ? 'bg-red-900/30' : 'bg-red-100'}` : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <ImageIcon size={16} className="text-gray-500" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                        {displayCategory(item.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatStock(item.stock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${item.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(item.expiryDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${darkMode ? "bg-purple-900 text-purple-200" : "bg-purple-100 text-purple-800"}`}>
                        {item.market}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setShowQRCode(item)}
                        className={`p-1 rounded-md mr-2 ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-gray-100"}`}
                        title="View QR Code"
                      >
                        <QrCode size={16} />
                      </button>
                      <button
                        onClick={() => handleRefill(item)}
                        className={`p-1 rounded-md mr-2 ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-600 hover:bg-gray-100"}`}
                        title="Refill Stock"
                      >
                        Refill
                      </button>
                      {item.status === 'Low Stock' && (
                        <button
                          onClick={() => handleNotify(item)}
                          className={`p-1 rounded-md mr-2 ${darkMode ? "text-orange-400 hover:bg-gray-700" : "text-orange-600 hover:bg-gray-100"}`}
                          title="Notify Management"
                        >
                          <AlertCircle size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(item)}
                        className={`p-1 rounded-md mr-2 ${darkMode ? "text-indigo-400 hover:bg-gray-700" : "text-indigo-600 hover:bg-gray-100"}`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className={`p-1 rounded-md ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProducts.length > 0 ? (
            displayProducts.map((item) => (
              <div
                key={item._id}
                className={`p-4 rounded-lg shadow-sm border-2 ${darkMode ? `bg-gray-800 ${item.status === 'Low Stock' ? 'border-red-700 bg-red-900/30' : 'border-gray-700'}` : `bg-white ${item.status === 'Low Stock' ? 'border-red-500 bg-red-100' : 'border-gray-200'}`}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <ImageIcon size={20} className="text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-medium">{item.name}</h3>
                      <span className={`px-2 py-1 mt-1 inline-flex text-xs leading-5 font-semibold rounded-full ${darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                        {displayCategory(item.category)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowQRCode(item)}
                      className={`p-1 rounded-md ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-gray-100"}`}
                      title="View QR Code"
                    >
                      <QrCode size={16} />
                    </button>
                    <button
                      onClick={() => handleRefill(item)}
                      className={`p-1 rounded-md ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-600 hover:bg-gray-100"}`}
                      title="Refill Stock"
                    >
                      Refill
                    </button>
                    {item.status === 'Low Stock' && (
                      <button
                        onClick={() => handleNotify(item)}
                        className={`p-1 rounded-md ${darkMode ? "text-orange-400 hover:bg-gray-700" : "text-orange-600 hover:bg-gray-100"}`}
                        title="Notify Management"
                      >
                        <AlertCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(item)}
                      className={`p-1 rounded-md ${darkMode ? "text-indigo-400 hover:bg-gray-700" : "text-indigo-600 hover:bg-gray-100"}`}
                      title="Edit Product"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className={`p-1 rounded-md ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"}`}
                      title="Delete Product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      Stock:
                    </span>
                    <span>{formatStock(item.stock)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      Price:
                    </span>
                    <span>${item.price}</span>
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
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${darkMode ? "bg-purple-900 text-purple-200" : "bg-purple-100 text-purple-800"}`}>
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
                </div>
              </div>
            ))
          ) : (
            <div className={`col-span-3 p-8 text-center ${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg`}>
              No products found
            </div>
          )}
        </div>
      )}
      {/* Add/Edit Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
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
                  setSubCategory("");
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
                      <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <ImageIcon size={24} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <span className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-colors duration-200">
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
                      className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                      required
                      placeholder="e.g., Organic Honey"
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                    )}
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
                        className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                      >
                        <option value="Animal Product">Animal Product</option>
                        <option value="Plant Product">Plant Product</option>
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
                        className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                      >
                        <option value="Local">Local</option>
                        <option value="Export">Export</option>
                      </select>
                      {formErrors.market && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.market}</p>
                      )}
                    </div>
                  </div>
                  {formData.category === "Plant Product" && (
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"} flex items-center gap-2`}>
                        Sub Category *
                        <span title="Select vegetable or fruit" className="cursor-pointer">
                          <Info size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                        </span>
                      </label>
                      <div className="flex gap-4">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="vegetables"
                            name="subCategory"
                            value="Vegetables"
                            checked={subCategory === "Vegetables"}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <label htmlFor="vegetables" className={darkMode ? "text-gray-300" : "text-gray-700"}>Vegetables</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="fruits"
                            name="subCategory"
                            value="Fruits"
                            checked={subCategory === "Fruits"}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <label htmlFor="fruits" className={darkMode ? "text-gray-300" : "text-gray-700"}>Fruits</label>
                        </div>
                      </div>
                      {formErrors.subCategory && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.subCategory}</p>
                      )}
                    </div>
                  )}
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
                      className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
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
                      className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
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
                    className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
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
                      className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
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
                      className={`w-full px-4 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500 opacity-50 cursor-not-allowed`}
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
                    setSubCategory("");
                  }}
                  className={`px-6 py-2 rounded-md ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"} transition-colors duration-200`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
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
          <div className={`rounded-lg shadow-lg max-w-md w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
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
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
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
                  className={`px-4 py-2 rounded-md ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"} transition-colors duration-200`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
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
          <div className={`rounded-lg shadow-lg max-w-sm w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
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
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors duration-200"
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