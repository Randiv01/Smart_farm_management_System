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
  Phone,
  Mail,
  Star,
  MapPin,
  Globe,
  User,
  Building,
  RefreshCw,
  MessageCircle
} from "lucide-react";
import { useITheme } from "../Icontexts/IThemeContext";
import axios from "axios";

const ISupplier = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [hoveredRating, setHoveredRating] = useState({}); // Track hover state for each supplier

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    type: "Fertilizer",
    email: "",
    phone: "",
    website: "",
    address: "",
    products: "",
    rating: 0,
    notes: "",
    image: ""
  });

  // Fetch suppliers from API
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/suppliers");
      setSuppliers(response.data.suppliers);
      setError("");
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setError("Failed to load suppliers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.products.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "image") {
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
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      company: supplier.company,
      type: supplier.type,
      email: supplier.email,
      phone: supplier.phone,
      website: supplier.website,
      address: supplier.address,
      products: supplier.products,
      rating: supplier.rating,
      notes: supplier.notes,
      image: supplier.image
    });
    setImagePreview(supplier.image);
    setShowAddForm(true);
  };

  const handleContact = (supplier) => {
    setSelectedSupplier(supplier);
    setShowContactModal(true);
  };

  const handleRate = async (supplierId, newRating) => {
    try {
      await axios.patch(`http://localhost:5000/api/suppliers/rate/${supplierId}`, {
        rating: newRating
      });
      // Update the local state to reflect the new rating without refetching all suppliers
      setSuppliers(prevSuppliers => 
        prevSuppliers.map(supplier => 
          supplier._id === supplierId 
            ? { ...supplier, rating: newRating } 
            : supplier
        )
      );
    } catch (error) {
      console.error("Error rating supplier:", error);
      setError("Failed to rate supplier. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingSupplier) {
        // Update existing supplier
        await axios.put(`http://localhost:5000/api/suppliers/${editingSupplier._id}`, formData);
      } else {
        // Create new supplier
        await axios.post("http://localhost:5000/api/suppliers", formData);
      }
      
      setShowAddForm(false);
      setEditingSupplier(null);
      setFormData({
        name: "",
        company: "",
        type: "Fertilizer",
        email: "",
        phone: "",
        website: "",
        address: "",
        products: "",
        rating: 0,
        notes: "",
        image: ""
      });
      setImagePreview(null);
      fetchSuppliers(); // Refresh the list
    } catch (error) {
      console.error("Error saving supplier:", error);
      setError("Failed to save supplier. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:5000/api/suppliers/${id}`);
      fetchSuppliers(); // Refresh the list
    } catch (error) {
      console.error("Error deleting supplier:", error);
      setError("Failed to delete supplier. Please try again.");
    }
  };

  const sendEmail = () => {
    if (selectedSupplier) {
      window.location.href = `mailto:${selectedSupplier.email}`;
    }
  };

  const initiateWhatsAppCall = () => {
    if (selectedSupplier) {
      // Remove any non-digit characters from phone number
      const phoneNumber = selectedSupplier.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phoneNumber}`, '_blank');
    }
  };

  const renderStars = (ratingValue, supplierId = null, interactive = false) => {
    const currentHoverRating = supplierId ? hoveredRating[supplierId] || 0 : 0;
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : "div"}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'} ${
              star <= (currentHoverRating || ratingValue)
                ? 'text-yellow-400'
                : darkMode ? 'text-gray-600' : 'text-gray-300'
            }`}
            onClick={interactive ? () => handleRate(supplierId, star) : undefined}
            onMouseEnter={interactive && supplierId ? () => setHoveredRating(prev => ({...prev, [supplierId]: star})) : undefined}
            onMouseLeave={interactive && supplierId ? () => setHoveredRating(prev => ({...prev, [supplierId]: 0})) : undefined}
          >
            <Star 
              size={18} 
              fill={star <= (currentHoverRating || ratingValue) ? "currentColor" : "none"} 
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-full p-6 flex items-center justify-center ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Suppliers Management</h1>
        <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Manage your fertilizer and animal food suppliers
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
                placeholder="Search suppliers..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSuppliers}
              className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>
            <button 
              className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              onClick={() => alert("Export functionality would be implemented here")}
            >
              <Download size={20} />
            </button>
            <button 
              className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              onClick={() => alert("Import functionality would be implemented here")}
            >
              <Upload size={20} />
            </button>
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
                setEditingSupplier(null);
                setFormData({
                  name: "",
                  company: "",
                  type: "Fertilizer",
                  email: "",
                  phone: "",
                  website: "",
                  address: "",
                  products: "",
                  rating: 0,
                  notes: "",
                  image: ""
                });
                setImagePreview(null);
                setShowAddForm(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={16} />
              Add Supplier
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
                  SUPPLIER
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  COMPANY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  TYPE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  PRODUCTS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  CONTACT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  RATING
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {supplier.image ? (
                        <img src={supplier.image} alt={supplier.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <User size={16} className="text-gray-500" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{supplier.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building size={14} className="mr-1" />
                        {supplier.company}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                        {supplier.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {supplier.products}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col text-sm">
                        <div className="flex items-center">
                          <Mail size={12} className="mr-1" />
                          {supplier.email}
                        </div>
                        <div className="flex items-center">
                          <Phone size={12} className="mr-1" />
                          {supplier.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStars(supplier.rating, supplier._id, true)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleContact(supplier)}
                        className={`p-1 rounded-md mr-2 ${darkMode ? "text-green-400 hover:bg-gray-700" : "text-green-600 hover:bg-gray-100"}`}
                        title="Contact Supplier"
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button 
                        onClick={() => handleEdit(supplier)}
                        className={`p-1 rounded-md mr-2 ${darkMode ? "text-indigo-400 hover:bg-gray-700" : "text-indigo-600 hover:bg-gray-100"}`}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(supplier._id)}
                        className={`p-1 rounded-md ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center">
                    No suppliers found
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
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((supplier) => (
              <div
                key={supplier._id}
                className={`p-4 rounded-lg shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {supplier.image ? (
                      <img src={supplier.image} alt={supplier.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User size={20} className="text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-medium">{supplier.name}</h3>
                      <div className="flex items-center text-sm">
                        <Building size={14} className="mr-1" />
                        {supplier.company}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                    {supplier.type}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      Products:
                    </span>
                    <span className="text-sm">{supplier.products}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      Email:
                    </span>
                    <span className="text-sm flex items-center">
                      <Mail size={12} className="mr-1" />
                      {supplier.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      Phone:
                    </span>
                    <span className="text-sm flex items-center">
                      <Phone size={12} className="mr-1" />
                      {supplier.phone}
                    </span>
                  </div>
                  {supplier.website && (
                    <div className="flex justify-between">
                      <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                        Website:
                      </span>
                      <span className="text-sm flex items-center">
                        <Globe size={12} className="mr-1" />
                        <a 
                          href={supplier.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Visit
                        </a>
                      </span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex justify-between">
                      <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                        Address:
                      </span>
                      <span className="text-sm flex items-center">
                        <MapPin size={12} className="mr-1" />
                        {supplier.address}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      Rating:
                    </span>
                    {renderStars(supplier.rating, supplier._id, true)}
                  </div>
                </div>
                
                <div className="flex justify-between pt-2 border-t dark:border-gray-700">
                  <button 
                    onClick={() => handleContact(supplier)}
                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 flex items-center text-sm"
                  >
                    <MessageCircle size={14} className="mr-1" />
                    Contact
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(supplier)}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(supplier._id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={`col-span-3 p-8 text-center ${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg`}>
              No suppliers found
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingSupplier(null);
                  setImagePreview(null);
                }}
                className={darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Supplier Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User size={24} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <span className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm flex items-center gap-2">
                      <Upload size={16} />
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
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                    required
                    placeholder="Supplier name"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Company *
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                    required
                    placeholder="Company name"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Supplier Type *
                  <span className="ml-1 text-xs text-gray-500">(You can add rating after creating the supplier)</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                >
                  <option value="Fertilizer">Fertilizer</option>
                  <option value="Animal Food">Animal Food</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Products/Supplies *
                </label>
                <input
                  type="text"
                  name="products"
                  value={formData.products}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  required
                  placeholder="e.g., Organic fertilizer, Cattle feed"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                    required
                    placeholder="supplier@example.com"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                    required
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="Full address"
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="Additional information about this supplier"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingSupplier(null);
                    setImagePreview(null);
                  }}
                  className={`px-4 py-2 rounded-md ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {editingSupplier ? "Update Supplier" : "Add Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-lg max-w-md w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Contact {selectedSupplier.name}</h2>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setSelectedSupplier(null);
                }}
                className={darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                {selectedSupplier.image ? (
                  <img src={selectedSupplier.image} alt={selectedSupplier.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User size={20} className="text-gray-500" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{selectedSupplier.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedSupplier.company}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail size={16} className="mr-2 text-gray-500" />
                  <span>{selectedSupplier.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone size={16} className="mr-2 text-gray-500" />
                  <span>{selectedSupplier.phone}</span>
                </div>
                {selectedSupplier.website && (
                  <div className="flex items-center">
                    <Globe size={16} className="mr-2 text-gray-500" />
                    <a 
                      href={selectedSupplier.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {selectedSupplier.website}
                    </a>
                  </div>
                )}
                {selectedSupplier.address && (
                  <div className="flex items-start">
                    <MapPin size={16} className="mr-2 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span>{selectedSupplier.address}</span>
                  </div>
                )}
                <div className="flex items-center pt-2">
                  <span className="mr-2 text-gray-500">Rating:</span>
                  {renderStars(selectedSupplier.rating, selectedSupplier._id, true)}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={sendEmail}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Mail size={16} />
                Send Email
              </button>
              <button
                onClick={initiateWhatsAppCall}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <MessageCircle size={16} />
                WhatsApp Message/Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ISupplier;