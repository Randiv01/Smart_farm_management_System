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
  MessageCircle,
  Filter,
  ChevronDown,
  CheckCircle,
  Info,
  Shield,
  Truck,
  Package
} from "lucide-react";
import { useITheme } from "../Icontexts/IThemeContext";
import axios from "axios";

const ISupplier = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [hoveredRating, setHoveredRating] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    fertilizer: 0,
    animalFood: 0,
    both: 0
  });

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

  // Update stats when suppliers change
  useEffect(() => {
    if (suppliers.length > 0) {
      const fertilizerCount = suppliers.filter(s => s.type === "Fertilizer").length;
      const animalFoodCount = suppliers.filter(s => s.type === "Animal Food").length;
      const bothCount = suppliers.filter(s => s.type === "Both").length;
      
      setStats({
        total: suppliers.length,
        fertilizer: fertilizerCount,
        animalFood: animalFoodCount,
        both: bothCount
      });
    }
  }, [suppliers]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/suppliers");
      setSuppliers(response.data.suppliers);
      setError("");
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      showMessage("Failed to load suppliers. Please check your connection and try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Download function to export suppliers data to CSV
  const handleDownload = () => {
    try {
      // Use filtered suppliers for export, or all suppliers if no filters applied
      const dataToExport = filteredSuppliers.length > 0 ? filteredSuppliers : suppliers;
      
      if (dataToExport.length === 0) {
        showMessage("No suppliers data to export.", "error");
        return;
      }

      // Define CSV headers
      const headers = [
        'Name',
        'Company',
        'Type',
        'Email',
        'Phone',
        'Website',
        'Address',
        'Products',
        'Rating',
        'Notes',
        'Date Added'
      ];

      // Convert suppliers data to CSV rows
      const csvRows = dataToExport.map(supplier => [
        `"${supplier.name || ''}"`,
        `"${supplier.company || ''}"`,
        `"${supplier.type || ''}"`,
        `"${supplier.email || ''}"`,
        `"${supplier.phone || ''}"`,
        `"${supplier.website || ''}"`,
        `"${supplier.address || ''}"`,
        `"${supplier.products || ''}"`,
        `"${supplier.rating || 0}"`,
        `"${supplier.notes || ''}"`,
        `"${supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}"`
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...csvRows]
        .map(row => row.join(','))
        .join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `suppliers_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showMessage(`Exported ${dataToExport.length} suppliers successfully!`);
    } catch (error) {
      console.error("Error exporting suppliers:", error);
      showMessage("Failed to export suppliers data. Please try again.", "error");
    }
  };

  const showMessage = (message, type = "success") => {
    if (type === "error") {
      setError(message);
      setSuccessMessage("");
    } else {
      setSuccessMessage(message);
      setError("");
    }
    
    // Auto-hide messages after 5 seconds
    setTimeout(() => {
      if (type === "error") {
        setError("");
      } else {
        setSuccessMessage("");
      }
    }, 5000);
  };

  // Filter suppliers based on search term and active filter
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.products.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      activeFilter === "all" || 
      supplier.type.toLowerCase() === activeFilter.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "image") {
      const file = e.target.files[0];
      if (file) {
        // Validate file type and size
        if (!file.type.startsWith('image/')) {
          showMessage("Please select a valid image file.", "error");
          return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          showMessage("Image size should be less than 5MB.", "error");
          return;
        }
        
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
      
      setSuppliers(prevSuppliers => 
        prevSuppliers.map(supplier => 
          supplier._id === supplierId 
            ? { ...supplier, rating: newRating } 
            : supplier
        )
      );
      
      showMessage(`Rating updated to ${newRating} stars successfully!`);
    } catch (error) {
      console.error("Error rating supplier:", error);
      showMessage("Failed to update rating. Please try again.", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      showMessage("Please fill in all required fields (Name, Email, Phone).", "error");
      return;
    }
    
    try {
      if (editingSupplier) {
        await axios.put(`http://localhost:5000/api/suppliers/${editingSupplier._id}`, formData);
        showMessage("Supplier updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/suppliers", formData);
        showMessage("Supplier added successfully!");
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
      fetchSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
      showMessage("Failed to save supplier. Please try again.", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/suppliers/${id}`);
      showMessage("Supplier deleted successfully!");
      fetchSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      showMessage("Failed to delete supplier. Please try again.", "error");
    }
  };

  const confirmDelete = (supplier) => {
    if (window.confirm(`Are you sure you want to delete ${supplier.name} from ${supplier.company}? This action cannot be undone.`)) {
      handleDelete(supplier._id);
    }
  };

  const sendEmail = () => {
    if (selectedSupplier) {
      window.location.href = `mailto:${selectedSupplier.email}?subject=Inquiry from Agricultural Management System`;
    }
  };

  const initiateWhatsAppCall = () => {
    if (selectedSupplier) {
      const phoneNumber = selectedSupplier.phone.replace(/\D/g, '');
      const message = "Hello! I would like to inquire about your products and services.";
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const renderStars = (ratingValue, supplierId = null, interactive = false) => {
    const currentHoverRating = supplierId ? hoveredRating[supplierId] || 0 : 0;
    
    return (
      <div className="flex" title={`${ratingValue} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : "div"}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
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
        <span className="ml-2 text-xs text-gray-500">({ratingValue}.0)</span>
      </div>
    );
  };

  const getSupplierIcon = (type) => {
    switch (type) {
      case "Fertilizer": return <Package size={16} className="text-green-500" />;
      case "Animal Food": return <Truck size={16} className="text-blue-500" />;
      case "Both": return <Shield size={16} className="text-purple-500" />;
      default: return <Building size={16} />;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading your suppliers...</p>
          <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>This will just take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-6 ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Suppliers Management
            </h1>
            <p className={`mt-1 text-sm md:text-base ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Manage your agricultural suppliers efficiently
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`p-3 rounded-lg text-center ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
              <div className="text-2xl font-bold text-green-600">{stats.total}</div>
              <div className="text-xs text-gray-500">Total Suppliers</div>
            </div>
            <div className={`p-3 rounded-lg text-center ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
              <div className="text-2xl font-bold text-blue-600">{stats.fertilizer}</div>
              <div className="text-xs text-gray-500">Fertilizer</div>
            </div>
            <div className={`p-3 rounded-lg text-center ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
              <div className="text-2xl font-bold text-orange-600">{stats.animalFood}</div>
              <div className="text-xs text-gray-500">Animal Food</div>
            </div>
            <div className={`p-3 rounded-lg text-center ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
              <div className="text-2xl font-bold text-purple-600">{stats.both}</div>
              <div className="text-xs text-gray-500">Both Types</div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className={`mb-4 p-4 rounded-lg flex items-center justify-between ${darkMode ? "bg-red-900/20 border border-red-800 text-red-200" : "bg-red-50 border border-red-200 text-red-800"}`}>
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="ml-4">
            <X size={16} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className={`mb-4 p-4 rounded-lg flex items-center justify-between ${darkMode ? "bg-green-900/20 border border-green-800 text-green-200" : "bg-green-50 border border-green-200 text-green-800"}`}>
          <div className="flex items-center">
            <CheckCircle size={20} className="mr-3 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage("")} className="ml-4">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search and Actions */}
      <div className={`p-4 rounded-xl shadow-sm mb-6 ${darkMode ? "bg-gray-800" : "bg-white"} border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[250px]">
              <Search
                size={18}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="text"
                placeholder="Search by name, company, or products..."
                className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-green-500 focus:border-transparent ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${darkMode ? "bg-gray-700 border-gray-600 hover:bg-gray-600" : "bg-white border-gray-300 hover:bg-gray-50"}`}
              >
                <Filter size={18} />
                <span>Filter</span>
                <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {showFilters && (
                <div className={`absolute top-full left-0 mt-2 w-48 rounded-lg shadow-lg border z-10 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="p-2">
                    {["all", "Fertilizer", "Animal Food", "Both"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setActiveFilter(filter);
                          setShowFilters(false);
                        }}
                        className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors ${
                          activeFilter === filter
                            ? darkMode ? "bg-green-900 text-green-100" : "bg-green-100 text-green-800"
                            : darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                        }`}
                      >
                        {getSupplierIcon(filter)}
                        <span className="capitalize">{filter === "all" ? "All Suppliers" : filter}</span>
                        {activeFilter === filter && <CheckCircle size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title="Table View"
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title="Grid View"
              >
                <Grid size={20} />
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={fetchSuppliers}
                className={`p-2 rounded-lg transition-all hover:scale-105 ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                title="Refresh Suppliers"
              >
                <RefreshCw size={20} />
              </button>
              
              <button 
                className={`p-2 rounded-lg transition-all hover:scale-105 ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                onClick={handleDownload}
                title="Export Suppliers to CSV"
              >
                <Download size={20} />
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
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={18} />
              Add New Supplier
            </button>
          </div>
        </div>
        
        {/* Active Filter Display */}
        {activeFilter !== "all" && (
          <div className="mt-4 flex items-center gap-2">
            <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Active filter:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"} flex items-center gap-2`}>
              {getSupplierIcon(activeFilter)}
              {activeFilter}
              <button 
                onClick={() => setActiveFilter("all")}
                className="hover:opacity-70"
              >
                <X size={14} />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 flex justify-between items-center">
        <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          {searchTerm && ` for "${searchTerm}"`}
        </div>
        
        {filteredSuppliers.length === 0 && suppliers.length > 0 && (
          <button
            onClick={() => {
              setSearchTerm("");
              setActiveFilter("all");
            }}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Clear filters
          </button>
        )}
      </div>

      {/* Empty State */}
      {filteredSuppliers.length === 0 && (
        <div className={`text-center p-12 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <Package size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No suppliers found</h3>
          <p className={`mb-6 max-w-md mx-auto ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            {suppliers.length === 0 
              ? "Get started by adding your first supplier to manage your agricultural partnerships."
              : "Try adjusting your search or filter to find what you're looking for."
            }
          </p>
          {suppliers.length === 0 && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus size={18} />
              Add Your First Supplier
            </button>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredSuppliers.length > 0 && (
        <div className={`rounded-xl shadow-sm overflow-hidden border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {supplier.image ? (
                          <img src={supplier.image} alt={supplier.name} className="h-12 w-12 rounded-full object-cover border-2 border-green-200 dark:border-green-800" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 flex items-center justify-center border-2 border-green-200 dark:border-green-800">
                            <User size={20} className="text-green-600 dark:text-green-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-lg">{supplier.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Building size={14} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                            <span className="text-sm">{supplier.company}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getSupplierIcon(supplier.type)}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                          {supplier.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm line-clamp-2" title={supplier.products}>
                        {supplier.products}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail size={12} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                          <span className="truncate max-w-[150px]">{supplier.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={12} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                          <span>{supplier.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {renderStars(supplier.rating, supplier._id, true)}
                        <div className="text-xs text-gray-500 mt-1">Click to rate</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleContact(supplier)}
                          className={`p-2 rounded-lg transition-all hover:scale-110 ${darkMode ? "text-green-400 hover:bg-gray-700" : "text-green-600 hover:bg-gray-100"}`}
                          title="Contact Supplier"
                        >
                          <MessageCircle size={18} />
                        </button>
                        <button 
                          onClick={() => handleEdit(supplier)}
                          className={`p-2 rounded-lg transition-all hover:scale-110 ${darkMode ? "text-indigo-400 hover:bg-gray-700" : "text-indigo-600 hover:bg-gray-100"}`}
                          title="Edit Supplier"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(supplier)}
                          className={`p-2 rounded-lg transition-all hover:scale-110 ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"}`}
                          title="Delete Supplier"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredSuppliers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier._id}
              className={`p-6 rounded-xl shadow-sm border transition-all hover:shadow-md ${darkMode ? "bg-gray-800 border-gray-700 hover:border-gray-600" : "bg-white border-gray-200 hover:border-gray-300"}`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {supplier.image ? (
                    <img src={supplier.image} alt={supplier.name} className="h-14 w-14 rounded-full object-cover border-2 border-green-200 dark:border-green-800" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 flex items-center justify-center border-2 border-green-200 dark:border-green-800">
                      <User size={24} className="text-green-600 dark:text-green-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{supplier.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Building size={14} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                      <span className="text-sm">{supplier.company}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getSupplierIcon(supplier.type)}
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                    {supplier.type}
                  </span>
                </div>
              </div>
              
              {/* Products */}
              <div className="mb-4">
                <div className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Products & Services
                </div>
                <p className="text-sm line-clamp-2">{supplier.products}</p>
              </div>
              
              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Email:</span>
                  <span className="text-sm flex items-center gap-1">
                    <Mail size={12} />
                    <span className="truncate max-w-[120px]">{supplier.email}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Phone:</span>
                  <span className="text-sm flex items-center gap-1">
                    <Phone size={12} />
                    {supplier.phone}
                  </span>
                </div>
                {supplier.website && (
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Website:</span>
                    <span className="text-sm flex items-center gap-1">
                      <Globe size={12} />
                      <a 
                        href={supplier.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline truncate max-w-[120px]"
                      >
                        Visit Site
                      </a>
                    </span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Address:</span>
                    <span className="text-sm flex items-center gap-1 text-right">
                      <MapPin size={12} />
                      <span className="truncate max-w-[120px]">{supplier.address}</span>
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Rating:</span>
                  {renderStars(supplier.rating, supplier._id, true)}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                <button 
                  onClick={() => handleContact(supplier)}
                  className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <MessageCircle size={16} />
                  Contact
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(supplier)}
                    className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-lg transition-all hover:scale-110"
                    title="Edit Supplier"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => confirmDelete(supplier)}
                    className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-lg transition-all hover:scale-110"
                    title="Delete Supplier"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="sticky top-0 z-10 p-6 border-b dark:border-gray-700 flex justify-between items-center bg-inherit">
              <h2 className="text-2xl font-bold">
                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingSupplier(null);
                  setImagePreview(null);
                }}
                className={`p-2 rounded-full transition-all hover:scale-110 ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Supplier Image
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-full object-cover border-2 border-green-200 dark:border-green-800" />
                        ) : (
                          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 flex items-center justify-center border-2 border-green-200 dark:border-green-800">
                            <User size={32} className="text-green-600 dark:text-green-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="cursor-pointer">
                          <span className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all hover:scale-105">
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
                        <p className="text-xs text-gray-500 mt-2">JPEG, PNG or GIF (Max 5MB)</p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 pb-2 border-b ${darkMode ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"}`}>
                      Basic Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-green-500 focus:border-transparent ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                          required
                          placeholder="Enter supplier's full name"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Company Name *
                        </label>
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-green-500 focus:border-transparent ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                          required
                          placeholder="Enter company name"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Supplier Type *
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-green-500 focus:border-transparent ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                        >
                          <option value="Fertilizer">Fertilizer Supplier</option>
                          <option value="Animal Food">Animal Food Supplier</option>
                          <option value="Both">Both Fertilizer & Animal Food</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 pb-2 border-b ${darkMode ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"}`}>
                      Contact Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-green-500 focus:border-transparent ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                          required
                          placeholder="supplier@company.com"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-green-500 focus:border-transparent ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                          required
                          placeholder="+94 81 249 2134"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Website
                        </label>
                        <input
                          type="url"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-green-500 focus:border-transparent ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                          placeholder="https://company.com"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Physical Address
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows="2"
                          className={`w-full px-4 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-green-500 focus:border-transparent ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                          placeholder="Enter full business address"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Products & Notes */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 pb-2 border-b ${darkMode ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"}`}>
                      Products & Notes
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Products/Supplies *
                        </label>
                        <input
                          type="text"
                          name="products"
                          value={formData.products}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-green-500 focus:border-transparent ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                          required
                          placeholder="e.g., Organic fertilizer, Cattle feed, Pesticides"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Additional Notes
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows="3"
                          className={`w-full px-4 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-green-500 focus:border-transparent ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                          placeholder="Any additional information about this supplier..."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingSupplier(null);
                    setImagePreview(null);
                  }}
                  className={`px-6 py-3 rounded-lg transition-all hover:scale-105 ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
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
          <div className={`rounded-xl shadow-2xl max-w-md w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">Contact {selectedSupplier.name}</h2>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setSelectedSupplier(null);
                }}
                className={`p-2 rounded-full transition-all hover:scale-110 ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {selectedSupplier.image ? (
                  <img src={selectedSupplier.image} alt={selectedSupplier.name} className="h-16 w-16 rounded-full object-cover border-2 border-green-200 dark:border-green-800" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 flex items-center justify-center border-2 border-green-200 dark:border-green-800">
                    <User size={24} className="text-green-600 dark:text-green-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{selectedSupplier.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedSupplier.company}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getSupplierIcon(selectedSupplier.type)}
                    <span className="text-xs text-gray-500">{selectedSupplier.type} Supplier</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-blue-500" />
                    <span>Email</span>
                  </div>
                  <span className="font-medium">{selectedSupplier.email}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-green-500" />
                    <span>Phone</span>
                  </div>
                  <span className="font-medium">{selectedSupplier.phone}</span>
                </div>
                
                {selectedSupplier.website && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center gap-3">
                      <Globe size={18} className="text-purple-500" />
                      <span>Website</span>
                    </div>
                    <a 
                      href={selectedSupplier.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-500 hover:underline"
                    >
                      Visit Site
                    </a>
                  </div>
                )}
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center gap-3">
                    <Star size={18} className="text-yellow-500" />
                    <span>Rating</span>
                  </div>
                  {renderStars(selectedSupplier.rating)}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={sendEmail}
                  className="flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-105"
                >
                  <Mail size={18} />
                  Send Email
                </button>
                <button
                  onClick={initiateWhatsAppCall}
                  className="flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all hover:scale-105"
                >
                  <MessageCircle size={18} />
                  WhatsApp Message
                </button>
              </div>
              
              <div className={`mt-4 p-3 rounded-lg text-sm ${darkMode ? "bg-gray-900 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
                <Info size={14} className="inline mr-1" />
                Tip: Save time by preparing your inquiry before contacting.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ISupplier;