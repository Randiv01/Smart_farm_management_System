import React, { useState, useEffect, useRef, useCallback } from "react";
import { useITheme } from "../Icontexts/IThemeContext";
import { Search, ShoppingCart, Star, Truck, Plus, Minus, X, CreditCard, Filter, ChevronLeft, ChevronRight, Loader, Clock, Eye, BadgeCheck, RotateCcw, Leaf, ShieldCheck } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from '../../UserHome/UHNavbar/UHNavbar';
import Footer from '../../UserHome/UHFooter/UHFooter';

const Catalog = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  const navigate = useNavigate();
  const catalogRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMarket, setSelectedMarket] = useState("Local Market");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [seasonalProducts, setSeasonalProducts] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const categories = [
    "All", "Fruits", "Vegetables", "Eggs", "Meat", "Honey", "Milk Product"
  ];

  // Image URLs inspired by the DOCUMENT themes
  const sampleImages = [
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80", // Freshly Picked (apples)
    "https://images.unsplash.com/photo-1566772940193-9c3ae2938d78?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80", // Farmhouse Cream (milk)
    "https://images.unsplash.com/photo-1566842600175-97dca3dfc3c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80", // Cottage Garden (lettuce)
    "https://images.unsplash.com/photo-1534772356593-b7b1e43a55c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80"  // Cider Season (apples for cider)
  ];

  // Sample testimonials inspired by the DOCUMENT
  const testimonials = [
    {
      name: "Sarah L.",
      comment: "I’ve been a part of this farm’s CSA for two seasons now, and I can’t imagine going back to grocery store veggies. The quality is unbeatable, and I love supporting a local farm that truly cares about sustainability.",
      rating: 5
    },
    {
      name: "James T.",
      comment: "Every delivery feels like a gift. The flavor, the care, the freshness — it’s unlike anything at the store.",
      rating: 5
    },
    {
      name: "Emily R.",
      comment: "The best farm-fresh produce I’ve ever had! We love visiting the farm and being part of the CSA program.",
      rating: 5
    }
  ];

  // Scroll to top of catalog on page change
  useEffect(() => {
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentPage, selectedCategory, selectedMarket]);

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedMarket, currentPage]);

  // Load cart and recently viewed from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('farmCart');
    if (savedCart) setCartItems(JSON.parse(savedCart));
    const savedViewed = localStorage.getItem('recentlyViewed');
    if (savedViewed) setRecentlyViewed(JSON.parse(savedViewed));
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('farmCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save recently viewed to localStorage
  useEffect(() => {
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Auto-slide for carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % Math.max(seasonalProducts.length, 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [seasonalProducts.length]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchTerm !== "") {
      setSearchLoading(true);
      searchTimeoutRef.current = setTimeout(fetchProducts, 500);
    } else {
      fetchProducts();
    }
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12
      };
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;
      if (selectedMarket === "Export Market") params.market = "Export";
      const response = await axios.get("http://localhost:5000/api/inventory/products/catalog/products", { params });
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
      const seasonal = response.data.products
        .filter(p => p.category === 'Fruits' || p.category === 'Vegetables')
        .slice(0, 4)
        .map((p, index) => ({
          ...p,
          image: sampleImages[index % sampleImages.length]
        }));
      setSeasonalProducts(seasonal);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setShowFilterSidebar(false);
  };

  const handleMarketChange = (e) => {
    setSelectedMarket(e.target.value);
    setCurrentPage(1);
  };

  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item._id === product._id);
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
    const toast = document.createElement('div');
    toast.className = `fixed top-20 right-4 z-50 px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 ${
      darkMode ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800'
    }`;
    toast.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>${product.name} added to cart!</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCartItems(cartItems.map(item =>
      item._id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const incrementQuantity = (productId) => {
    updateQuantity(productId, cartItems.find(item => item._id === productId).quantity + 1);
  };

  const decrementQuantity = (productId) => {
    const item = cartItems.find(item => item._id === productId);
    updateQuantity(productId, item.quantity - 1);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const proceedToPayment = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    localStorage.setItem('farmCart', JSON.stringify(cartItems));
    navigate('/InventoryManagement/payment');
  };

  const trackViewedProduct = useCallback((product) => {
    setRecentlyViewed(prev => {
      const newViewed = [product, ...prev.filter(p => p._id !== product._id)];
      return newViewed.slice(0, 8);
    });
  }, []);

  const openQuickView = (product) => {
    setQuickViewProduct(product);
    trackViewedProduct(product);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={`min-h-screen p-6 flex items-center justify-center ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4">Loading products...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div ref={catalogRef} className="pt-16"></div>
      <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        {/* Cinematic Seasonal Highlights Section */}
        <section className="relative w-full h-[60vh] overflow-hidden">
          {seasonalProducts.map((product, index) => (
            <div
              key={index}
              className={`absolute top-0 left-0 w-full h-full transition-opacity duration-[1500ms] ${
                index === carouselIndex ? "opacity-100 z-20" : "opacity-0 z-0"
              }`}
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover object-center brightness-90 contrast-125"
                loading="lazy"
              />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/40 via-black/20 to-black/70"></div>
              <div className="absolute inset-0 flex flex-col justify-center items-start px-8 md:px-16 lg:px-24 text-white">
                <h2 className="text-3xl md:text-5xl font-extrabold drop-shadow-lg mb-4 flex items-center gap-2">
                  <Leaf size={32} className="text-green-500" />
                  {product.name}
                </h2>
                <p className="text-lg md:text-xl font-light max-w-lg drop-shadow-md mb-4">
                  Freshly harvested, ${product.price.toFixed(2)}
                </p>
                <button
                  onClick={() => openQuickView(product)}
                  className="bg-green-600/80 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-semibold shadow-lg backdrop-blur-sm flex items-center transition-colors"
                >
                  <Eye size={20} className="mr-2" /> View Product
                </button>
              </div>
            </div>
          ))}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
            {seasonalProducts.map((_, idx) => (
              <span
                key={idx}
                className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
                  idx === carouselIndex ? "bg-green-500 scale-125" : "bg-white/40"
                }`}
                onClick={() => setCarouselIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              ></span>
            ))}
          </div>
        </section>

        {/* Search, Market Selection, Filter Button, and Cart Bar */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full md:max-w-2xl">
              <Search
                size={20}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="text"
                placeholder="Search organic products..."
                className={`w-full pl-10 pr-10 py-3 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                value={searchTerm}
                onChange={handleSearch}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                >
                  <X size={16} />
                </button>
              )}
              {searchLoading && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <Loader size={16} className="animate-spin" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedMarket}
                onChange={handleMarketChange}
                className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              >
                <option value="Local Market">Local Market</option>
                <option value="Export Market">Export Market</option>
              </select>
              <button
                onClick={() => setShowFilterSidebar(true)}
                className={`p-3 rounded-lg flex items-center gap-2 transition-colors ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-100 border border-gray-300"}`}
              >
                <Filter size={24} />
                <span className="font-semibold hidden sm:inline">Filters</span>
              </button>
              <button
                onClick={() => setShowCart(true)}
                className={`relative p-3 rounded-lg flex items-center gap-2 transition-colors ${
                  darkMode ? "bg-green-800 hover:bg-green-700" : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                <ShoppingCart size={24} />
                <span className="font-semibold hidden sm:inline">Cart</span>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter Sidebar */}
          {showFilterSidebar && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-start animate-fadeIn">
              <div className={`w-64 h-full overflow-y-auto transform transition-transform duration-300 ${darkMode ? "bg-gray-900" : "bg-white"} shadow-xl`}>
                <div className="p-4 border-b sticky top-0 z-10 bg-inherit">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Filters</h2>
                    <button
                      onClick={() => setShowFilterSidebar(false)}
                      className={`p-1 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`w-full text-left px-4 py-2 rounded-md ${
                          selectedCategory === category
                            ? "bg-green-600 text-white"
                            : darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Results Info */}
          {(searchTerm || selectedCategory !== "All" || selectedMarket !== "Local Market") && (
            <div className={`mb-6 p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <p className="text-sm">
                Showing results for
                {searchTerm && <span className="font-semibold"> "{searchTerm}"</span>}
                {(searchTerm && (selectedCategory !== "All" || selectedMarket !== "Local Market")) && " in "}
                {selectedCategory !== "All" && <span className="font-semibold"> {selectedCategory}</span>}
                {(searchTerm || selectedCategory !== "All") && selectedMarket !== "Local Market" && " in "}
                {selectedMarket !== "Local Market" && <span className="font-semibold"> {selectedMarket}</span>}
                {products.length === 0 && " - No products found"}
              </p>
              {(searchTerm || selectedCategory !== "All" || selectedMarket !== "Local Market") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All");
                    setSelectedMarket("Local Market");
                  }}
                  className="mt-2 text-sm text-green-600 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Product Grid */}
          <section className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Organic Products</h2>
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className={`rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1 border-2 group ${
                        darkMode
                          ? `bg-gray-800 ${product.status === 'Low Stock' ? 'border-red-700 bg-red-900/30' : 'border-gray-700'}`
                          : `bg-white ${product.status === 'Low Stock' ? 'border-red-500 bg-red-100' : 'border-gray-200'}`
                      }`}
                    >
                      <div className="h-48 overflow-hidden relative">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                            <div className="text-center">
                              <Truck size={32} className={darkMode ? "text-gray-500" : "text-gray-400"} />
                              <p className={darkMode ? "text-gray-500 text-sm" : "text-gray-400 text-sm"}>No Image</p>
                            </div>
                          </div>
                        )}
                        <span className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full ${
                          product.status === 'In Stock'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : product.status === 'Low Stock'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {product.status}
                        </span>
                        <button
                          onClick={() => openQuickView(product)}
                          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white text-green-600 px-4 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                        >
                          <Eye size={16} /> Quick View
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-2 line-clamp-1">{product.name}</h3>
                        <p className={`text-sm mb-3 h-10 overflow-hidden ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {product.description || "Fresh farm product with premium quality."}
                        </p>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <p className="text-2xl font-bold text-green-600">${product.price}</p>
                            <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                              In stock: {product.stock.quantity} {product.stock.unit}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={16}
                                  className="text-yellow-400 fill-current"
                                />
                              ))}
                            </div>
                            <span className={`text-xs ml-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>(24)</span>
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.status === 'Out of Stock'}
                          className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                            product.status === 'Out of Stock'
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          <ShoppingCart size={18} />
                          {product.status === 'Out of Stock' ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''} ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-300'
                        }`}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === page
                              ? 'bg-green-600 text-white'
                              : darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''} ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-300'
                        }`}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={`text-center py-12 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className="text-lg mb-2">No products found.</p>
                <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                  Try adjusting your search or filter criteria.
                </p>
                {(searchTerm || selectedCategory !== "All" || selectedMarket !== "Local Market") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("All");
                      setSelectedMarket("Local Market");
                    }}
                    className={`mt-4 px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Testimonials Section */}
          <section className={`py-16 ${darkMode ? "bg-gray-800" : "bg-green-50"}`}>
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">From Our Customers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className={`p-6 rounded-xl shadow-md ${darkMode ? "bg-gray-900" : "bg-white"}`}>
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} size={20} className="text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className={`text-sm italic mb-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>"{testimonial.comment}"</p>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Trust Badges */}
          <section className="container mx-auto px-4 py-12">
            <div className={`flex flex-wrap justify-center gap-8 p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={32} className="text-green-600" />
                <span className="font-semibold">Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={32} className="text-green-600" />
                <span className="font-semibold">Fast Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={32} className="text-green-600" />
                <span className="font-semibold">Easy Returns</span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck size={32} className="text-green-600" />
                <span className="font-semibold">Quality Guaranteed</span>
              </div>
            </div>
          </section>

          {/* Quick View Modal */}
          {quickViewProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fadeIn">
              <div className={`max-w-2xl w-full m-4 rounded-xl overflow-hidden shadow-2xl ${darkMode ? "bg-gray-900" : "bg-white"}`}>
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-xl font-bold">{quickViewProduct.name}</h2>
                  <button onClick={() => setQuickViewProduct(null)}>
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 grid md:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={quickViewProduct.image || 'placeholder.jpg'}
                      alt={quickViewProduct.name}
                      className="w-full h-64 object-cover rounded-lg"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600 mb-4">${quickViewProduct.price}</p>
                    <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {quickViewProduct.description || "Fresh farm product with premium quality."}
                    </p>
                    <div className="flex items-center mb-4">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={20} className="text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className={`ml-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>(24 reviews)</span>
                    </div>
                    <p className={`mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Stock: {quickViewProduct.stock.quantity} {quickViewProduct.stock.unit}
                    </p>
                    <button
                      onClick={() => {
                        addToCart(quickViewProduct);
                        setQuickViewProduct(null);
                      }}
                      disabled={quickViewProduct.status === 'Out of Stock'}
                      className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                        quickViewProduct.status === 'Out of Stock'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <ShoppingCart size={20} />
                      {quickViewProduct.status === 'Out of Stock' ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cart Sidebar */}
          {showCart && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end animate-fadeIn">
              <div className={`w-full max-w-md h-full overflow-y-auto transform transition-transform duration-300 ${darkMode ? "bg-gray-900" : "bg-white"} shadow-xl`}>
                <div className="p-4 border-b sticky top-0 z-10 bg-inherit">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Your Cart</h2>
                    <button
                      onClick={() => setShowCart(false)}
                      className={`p-1 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in cart
                  </p>
                </div>
                <div className="p-4">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className={darkMode ? "text-gray-400" : "text-gray-500"}>No products in the cart.</p>
                      <button
                        onClick={() => setShowCart(false)}
                        className={`mt-4 px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
                      >
                        Continue Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div key={item._id} className={`flex gap-4 p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                          <div className="w-16 h-16 flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover rounded"
                                loading="lazy"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                                <Truck size={20} className={darkMode ? "text-gray-500" : "text-gray-400"} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              ${item.price} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => decrementQuantity(item._id)}
                                className={`p-1 rounded ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="px-2 py-1 bg-white border rounded min-w-[2rem] text-center">{item.quantity}</span>
                              <button
                                onClick={() => incrementQuantity(item._id)}
                                className={`p-1 rounded ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className={`p-1 self-start ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-500 hover:bg-gray-200"} rounded`}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {cartItems.length > 0 && (
                  <div className={`p-4 border-t sticky bottom-0 bg-inherit ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Total:</span>
                      <span className="text-xl font-bold text-green-600">${getTotalPrice()}</span>
                    </div>
                    <button
                      onClick={proceedToPayment}
                      className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                    >
                      <CreditCard size={20} />
                      Proceed to Payment
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
      <Footer />

      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Catalog;
