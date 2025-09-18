import React, { useState, useEffect, useRef, useCallback } from "react";
import { useITheme } from "../Icontexts/IThemeContext";
import {
  Search,
  ShoppingCart,
  Star,
  Truck,
  Plus,
  Minus,
  X,
  CreditCard,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader,
  Clock,
  Eye,
  BadgeCheck,
  RotateCcw,
  Leaf,
  ShieldCheck,
  Share,
  Zap,
  MapPin,
  Calendar,
  MessageCircle,
  Edit,
} from "lucide-react";
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
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showRecentlyViewedDropdown, setShowRecentlyViewedDropdown] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [sortBy, setSortBy] = useState("featured");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [popularSearches] = useState(["Organic Apples", "Fresh Milk", "Farm Eggs", "Seasonal Vegetables"]);
  const [deliveryInfo, setDeliveryInfo] = useState({
    zipcode: "",
    date: "",
    name: "",
    phone: "",
    address: "",
    email: "",
  });
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [userReview, setUserReview] = useState({
    rating: 0,
    comment: "",
    name: "",
    email: "",
  });
  const [reviews, setReviews] = useState({});
  const [editingReview, setEditingReview] = useState(null);
  const categories = [
    "All",
    "Fruits",
    "Vegetables",
    "Eggs",
    "Meat",
    "Honey",
    "Milk Product",
  ];
  const sampleImages = [
    "https://t4.ftcdn.net/jpg/15/45/72/75/240_F_1545727539_4UmNbJiU2YD8KnzBso157al4JqaqvWif.jpg",
    "https://images.unsplash.com/photo-1574856344991-aaa31b6f4ce3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
    "https://t3.ftcdn.net/jpg/13/52/85/66/240_F_1352856606_53sbQC1rsJ2CFbje2rjPtxSEEg9VyEf4.jpg",
    "https://as1.ftcdn.net/v2/jpg/16/11/01/64/1000_F_1611016492_IZiKVQ16kYTUmLf3pl2Sk5ttzskXUk0q.jpg",
  ];
  const splashQuotes = [
    "Life be healthy with vegetables and fruits",
    "Nourish your body with nature's best",
    "Fresh from the farm to your table",
    "Eat well, live well, naturally",
  ];

  useEffect(() => {
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentPage, selectedCategory, selectedMarket]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedMarket, currentPage, sortBy, priceRange]);

  useEffect(() => {
    const savedCart = localStorage.getItem("farmCart");
    if (savedCart) setCartItems(JSON.parse(savedCart));
    const savedViewed = localStorage.getItem("recentlyViewed");
    if (savedViewed) setRecentlyViewed(JSON.parse(savedViewed));
    const savedDeliveryInfo = localStorage.getItem("farmDeliveryInfo");
    if (savedDeliveryInfo) {
      setDeliveryInfo(JSON.parse(savedDeliveryInfo));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("farmCart", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (deliveryInfo.zipcode || deliveryInfo.date || deliveryInfo.email) {
      localStorage.setItem("farmDeliveryInfo", JSON.stringify(deliveryInfo));
    }
  }, [deliveryInfo]);

  useEffect(() => {
    localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % Math.max(seasonalProducts.length, 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [seasonalProducts.length]);

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
        limit: 12,
        sort: sortBy,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
      };
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;
      if (selectedMarket === "Export Market") params.market = "Export";
      const response = await axios.get("http://localhost:5000/api/inventory/products/catalog/products", { params });
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
      const aggregatedReviews = response.data.products.reduce((acc, product) => {
        acc[product._id] = product.reviews || [];
        return acc;
      }, {});
      setReviews(aggregatedReviews);
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
    setShowSearchSuggestions(e.target.value.length > 0);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
    setShowSearchSuggestions(false);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setShowFilterDropdown(false);
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
    showToast(`${product.name} added to cart!`);
  };

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = `fixed top-20 right-4 z-50 px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 ${
      darkMode ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800'
    }`;
    toast.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>${message}</span>
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

  const shareProduct = async (product) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this ${product.name} from our farm!`,
          url: window.location.href,
        });
        showToast('Product shared successfully!');
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!');
    }
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (e, index) => {
    const newRange = [...priceRange];
    newRange[index] = parseInt(e.target.value);
    setPriceRange(newRange);
    setCurrentPage(1);
  };

  const handleDeliveryInfoChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPriceCalculation = (price, quantity, unit) => {
    return `$${price} × ${quantity}${unit} = $${(price * quantity).toFixed(2)}`;
  };

  const openReviewModal = (product) => {
    setReviewProduct(product);
    setUserReview({
      rating: 0,
      comment: "",
      name: deliveryInfo.name || "",
      email: deliveryInfo.email || ""
    });
    setEditingReview(null);
    setShowReviewModal(true);
  };

  const openEditReviewModal = (product, review) => {
    setReviewProduct(product);
    setUserReview({
      rating: review.rating,
      comment: review.comment,
      name: review.name,
      email: review.email
    });
    setEditingReview(review);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userReview.rating || !userReview.comment) {
      alert("Please provide both a rating and a comment");
      return;
    }
    try {
      const reviewData = {
        ...userReview,
        date: editingReview ? editingReview.date : new Date().toISOString().split('T')[0]
      };
      if (editingReview) {
        await axios.put(`http://localhost:5000/api/inventory/products/catalog/products/${reviewProduct._id}/reviews/${editingReview._id}`, reviewData);
        showToast("Review updated successfully!");
      } else {
        await axios.post(`http://localhost:5000/api/inventory/products/catalog/products/${reviewProduct._id}/reviews`, reviewData);
        showToast("Thank you for your review!");
      }
      setShowReviewModal(false);
      setEditingReview(null);
      if (userReview.email) {
        setDeliveryInfo(prev => ({ ...prev, email: userReview.email }));
      }
      fetchProducts();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Error submitting review. Please try again.");
    }
  };

  const getAverageRating = (productId) => {
    if (!reviews[productId] || reviews[productId].length === 0) return 0;
    const total = reviews[productId].reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews[productId].length).toFixed(1);
  };

  const getReviewCount = (productId) => {
    return reviews[productId] ? reviews[productId].length : 0;
  };

  const getRatingDistribution = (productId) => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (!reviews[productId]) return distribution;
    reviews[productId].forEach(review => {
      if (distribution[review.rating] !== undefined) {
        distribution[review.rating]++;
      }
    });
    return distribution;
  };

  const renderStars = (rating, size = 16) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= Math.round(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  const renderInteractiveStars = (rating, setRating, size = 24) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`cursor-pointer transition-transform duration-200 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"} hover:scale-110`}
            onClick={() => setRating(star)}
            id={`star-${star}`}
          />
        ))}
      </div>
    );
  };

  const canEditReview = (review) => {
    const userEmail = deliveryInfo.email || userReview.email;
    return userEmail && review.email === userEmail;
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
        <section className="relative w-full h-[70vh] overflow-hidden">
          {seasonalProducts.map((product, index) => (
            <div
              key={index}
              className={`absolute top-0 left-0 w-full h-full transition-opacity duration-[1500ms] ${
                index === carouselIndex ? "opacity-100 z-20" : "opacity-0 z-0"
              }`}
            >
              <img
                src={product.image}
                alt="Seasonal Highlight"
                className="w-full h-full object-cover object-center brightness-90 contrast-125"
                loading="lazy"
              />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/40 via-black/20 to-black/70"></div>
              <div className="absolute inset-0 flex flex-col justify-center items-start px-8 md:px-16 lg:px-24 text-white">
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm mb-2 flex items-center gap-1">
                  <Zap size={14} /> Seasonal Favorite
                </span>
                <p className="text-2xl md:text-4xl font-bold max-w-lg drop-shadow-md mb-4">
                  {splashQuotes[index % splashQuotes.length]}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => openQuickView(product)}
                    className="bg-green-600/80 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-semibold shadow-lg backdrop-blur-sm flex items-center transition-colors"
                  >
                    <Eye size={20} className="mr-2" /> View Product
                  </button>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-white/20 hover:bg-white/30 text-white py-2 px-6 rounded-lg font-semibold shadow-lg backdrop-blur-sm flex items-center transition-colors border border-white/30"
                  >
                    <ShoppingCart size={20} className="mr-2" /> Add to Cart
                  </button>
                </div>
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
        <section className="container mx-auto px-4 py-8 relative">
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
                onFocus={() => setShowSearchSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
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
              {showSearchSuggestions && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-10 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                  {searchTerm ? (
                    <div className="p-2 text-sm">
                      <p className="p-2">Search for "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      <p className="font-semibold p-2">Popular Searches</p>
                      {popularSearches.map((search, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                          onClick={() => {
                            setSearchTerm(search);
                            setShowSearchSuggestions(false);
                          }}
                        >
                          {search}
                        </div>
                      ))}
                    </div>
                  )}
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
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`p-3 rounded-lg flex items-center gap-2 transition-colors ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-100 border border-gray-300"} focus:ring-2 focus:ring-green-500`}
                >
                  <Filter size={24} />
                  <span className="font-semibold hidden sm:inline">Filters</span>
                </button>
                {showFilterDropdown && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-xl z-20 p-4 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-300"} animate-slideDown`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-lg">Filter Products</h3>
                      <button
                        onClick={() => {
                          setSelectedCategory("All");
                          setPriceRange([0, 100]);
                          setSortBy("featured");
                          setCurrentPage(1);
                          setShowFilterDropdown(false);
                        }}
                        className="text-sm text-green-600 hover:underline"
                      >
                        Clear Filters
                      </button>
                    </div>
                    <div className="mb-6">
                      <h4 className="font-medium mb-3 text-base">Sort By</h4>
                      <div className="space-y-2">
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            name="sort"
                            value="featured"
                            checked={sortBy === "featured"}
                            onChange={handleSortChange}
                            className="mr-2 accent-green-500"
                          />
                          Featured
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            name="sort"
                            value="priceLow"
                            checked={sortBy === "priceLow"}
                            onChange={handleSortChange}
                            className="mr-2 accent-green-500"
                          />
                          Price: Low to High
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            name="sort"
                            value="priceHigh"
                            checked={sortBy === "priceHigh"}
                            onChange={handleSortChange}
                            className="mr-2 accent-green-500"
                          />
                          Price: High to Low
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            name="sort"
                            value="newest"
                            checked={sortBy === "newest"}
                            onChange={handleSortChange}
                            className="mr-2 accent-green-500"
                          />
                          Newest
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            name="sort"
                            value="popular"
                            checked={sortBy === "popular"}
                            onChange={handleSortChange}
                            className="mr-2 accent-green-500"
                          />
                          Most Popular
                        </label>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h4 className="font-medium mb-3 text-base">Price Range</h4>
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="number"
                          value={priceRange[0]}
                          onChange={(e) => handlePriceRangeChange(e, 0)}
                          className={`w-20 p-2 rounded-md border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                          min="0"
                          max={priceRange[1]}
                        />
                        <span>-</span>
                        <input
                          type="number"
                          value={priceRange[1]}
                          onChange={(e) => handlePriceRangeChange(e, 1)}
                          className={`w-20 p-2 rounded-md border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                          min={priceRange[0]}
                          max="100"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={priceRange[0]}
                          onChange={(e) => handlePriceRangeChange(e, 0)}
                          className="w-full accent-green-500"
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={priceRange[1]}
                          onChange={(e) => handlePriceRangeChange(e, 1)}
                          className="w-full accent-green-500"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3 text-base">Availability</h4>
                      <div className="space-y-3">
                        <label className="flex items-center text-sm">
                          <input type="checkbox" className="mr-2 accent-green-500" defaultChecked />
                          In Stock
                        </label>
                        <label className="flex items-center text-sm">
                          <input type="checkbox" className="mr-2 accent-green-500" />
                          Pre-order
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFilterDropdown(false)}
                      className={`w-full mt-4 py-2 rounded-lg font-semibold transition-colors ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-900"}`}
                    >
                      Apply Filters
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowRecentlyViewedDropdown(!showRecentlyViewedDropdown)}
                  className={`p-3 rounded-lg flex items-center gap-2 transition-colors ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-100 border border-gray-300"}`}
                >
                  <Clock size={24} />
                  <span className="font-semibold hidden sm:inline">Viewed</span>
                </button>
                {showRecentlyViewedDropdown && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg z-20 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-300"} max-h-96 overflow-y-auto`}>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">Recently Viewed</h3>
                      {recentlyViewed.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {recentlyViewed.slice(0, 6).map((product) => (
                            <div
                              key={product._id}
                              className={`rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}
                              onClick={() => {
                                openQuickView(product);
                                setShowRecentlyViewedDropdown(false);
                              }}
                            >
                              <div className="h-20 w-full mb-2">
                                <img
                                  src={product.image || sampleImages[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded"
                                />
                              </div>
                              <p className="text-sm font-medium truncate">{product.name}</p>
                              <p className="text-green-600 font-bold text-xs">${product.price}/{product.stock.unit}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No recently viewed items.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
                    setPriceRange([0, 100]);
                    setSortBy("featured");
                  }}
                  className="mt-2 text-sm text-green-600 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
          <section className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Organic Products</h2>
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => {
                    const avgRating = getAverageRating(product._id);
                    const reviewCount = getReviewCount(product._id);
                    return (
                      <div
                        key={product._id}
                        className={`rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1 border-2 group ${
                          darkMode
                            ? `bg-gray-800 ${product.status === 'Low Stock' ? 'border-red-700 bg-red-900/30' : 'border-gray-700'}`
                            : `bg-white ${product.status === 'Low Stock' ? 'border-red-500 bg-red-100' : 'border-gray-200'}`
                        }`}
                      >
                        <div
                          className="h-48 overflow-hidden relative cursor-pointer"
                          onClick={() => openQuickView(product)}
                        >
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
                            onClick={(e) => {
                              e.stopPropagation();
                              openQuickView(product);
                            }}
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
                              <p className="text-2xl font-bold text-green-600">${product.price}/{product.stock.unit}</p>
                              <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                In stock: {product.stock.quantity} {product.stock.unit}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="flex">
                                {renderStars(avgRating)}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReviewModal(product);
                                }}
                                className="text-xs mt-1 flex items-center text-blue-500 hover:underline"
                              >
                                <MessageCircle size={12} className="mr-1" />
                                {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => addToCart(product)}
                              disabled={product.status === 'Out of Stock'}
                              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                                product.status === 'Out of Stock'
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              <ShoppingCart size={18} />
                              {product.status === 'Out of Stock' ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                            <button
                              onClick={() => shareProduct(product)}
                              className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                                darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                              }`}
                            >
                              <Share size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                      setPriceRange([0, 100]);
                      setSortBy("featured");
                    }}
                    className={`mt-4 px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </section>
          <button
            onClick={() => setShowCart(true)}
            className={`fixed bottom-6 right-6 z-30 p-4 rounded-full flex items-center gap-2 transition-all duration-300 shadow-lg ${
              darkMode ? "bg-green-800 hover:bg-green-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"
            } ${showCart ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <ShoppingCart size={28} />
            <span className="font-semibold hidden sm:inline">Cart</span>
            {getTotalItems() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {getTotalItems()}
              </span>
            )}
          </button>
          {quickViewProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fadeIn">
              <div className={`max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl ${darkMode ? "bg-gray-900" : "bg-white"} max-h-[90vh] flex flex-col`}>
                <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-900">
                  <h2 className="text-2xl font-bold">{quickViewProduct.name}</h2>
                  <button 
                    onClick={() => setQuickViewProduct(null)}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="relative rounded-lg overflow-hidden shadow-md">
                        <img
                          src={quickViewProduct.image || 'placeholder.jpg'}
                          alt={quickViewProduct.name}
                          className="w-full h-80 object-cover"
                          loading="lazy"
                        />
                        <span className={`absolute top-2 right-2 px-3 py-1 text-sm rounded-full ${
                          quickViewProduct.status === 'In Stock'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : quickViewProduct.status === 'Low Stock'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {quickViewProduct.status}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => shareProduct(quickViewProduct)}
                          className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium ${
                            darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Share size={18} /> Share
                        </button>
                        <button
                          onClick={() => {
                            setQuickViewProduct(null);
                            openReviewModal(quickViewProduct);
                          }}
                          className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium ${
                            darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <MessageCircle size={18} /> Write Review
                        </button>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <p className="text-3xl font-bold text-green-600 mb-2">${quickViewProduct.price}/{quickViewProduct.stock.unit}</p>
                        <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>
                          {quickViewProduct.description || "Fresh farm product with premium quality."}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {renderStars(getAverageRating(quickViewProduct._id), 20)}
                          <span className="text-lg font-semibold">{getAverageRating(quickViewProduct._id)}/5</span>
                        </div>
                        <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          ({getReviewCount(quickViewProduct._id)} {getReviewCount(quickViewProduct._id) === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {getReviewCount(quickViewProduct._id) > 0 && (
                          [5, 4, 3, 2, 1].map((star) => {
                            const dist = getRatingDistribution(quickViewProduct._id);
                            const count = dist[star];
                            const total = getReviewCount(quickViewProduct._id);
                            const percentage = total > 0 ? (count / total) * 100 : 0;
                            return (
                              <div key={star} className="flex items-center gap-2">
                                <div className="flex">{renderStars(star, 16)}</div>
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-400"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className={`w-8 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{count}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-green-50"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Truck size={20} className="text-green-600" />
                          <span className="font-semibold">Delivery Information</span>
                        </div>
                        <p className="text-sm">Free delivery on orders over $50. Next day delivery available.</p>
                      </div>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Stock: {quickViewProduct.stock.quantity} {quickViewProduct.stock.unit}
                      </p>
                      <button
                        onClick={() => {
                          addToCart(quickViewProduct);
                          setQuickViewProduct(null);
                        }}
                        disabled={quickViewProduct.status === 'Out of Stock'}
                        className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 text-base font-semibold transition-colors ${
                          quickViewProduct.status === 'Out of Stock'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        <ShoppingCart size={20} />
                        {quickViewProduct.status === 'Out of Stock' ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
                    {reviews[quickViewProduct._id]?.length > 0 ? (
                      <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                        {reviews[quickViewProduct._id].map((review, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-base">{review.name}</span>
                                  {canEditReview(review) && (
                                    <button
                                      onClick={() => openEditReviewModal(quickViewProduct, review)}
                                      className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                                        darkMode ? "text-gray-300" : "text-gray-600"
                                      }`}
                                      title="Edit your review"
                                    >
                                      <Edit size={16} />
                                    </button>
                                  )}
                                </div>
                                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                  {new Date(review.date).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex">{renderStars(review.rating, 16)}</div>
                            </div>
                            <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"} whitespace-pre-wrap`}>
                              {review.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`text-center p-6 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mb-3`}>
                          No reviews yet. Be the first to review this product!
                        </p>
                        <button
                          onClick={() => openReviewModal(quickViewProduct)}
                          className="text-sm text-blue-500 hover:underline flex items-center justify-center gap-1"
                        >
                          <MessageCircle size={16} /> Write a Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {showReviewModal && reviewProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fadeIn">
              <div className={`max-w-md w-full m-4 rounded-xl overflow-hidden shadow-2xl ${darkMode ? "bg-gray-900" : "bg-white"}`}>
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-xl font-bold">{editingReview ? "Edit Review" : "Review"} {reviewProduct.name}</h2>
                  <button onClick={() => {
                    setShowReviewModal(false);
                    setEditingReview(null);
                  }}>
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6">
                  <form onSubmit={handleReviewSubmit}>
                    <div className="mb-6">
                      <label className="block mb-2 font-medium">Your Rating</label>
                      <div className="flex justify-center mb-2">
                        {renderInteractiveStars(userReview.rating, (rating) => setUserReview({...userReview, rating}))}
                      </div>
                      <div className="text-center text-sm text-gray-500">
                        {userReview.rating === 0 ? "Select your rating" :
                         userReview.rating === 1 ? "Poor" :
                         userReview.rating === 2 ? "Fair" :
                         userReview.rating === 3 ? "Good" :
                         userReview.rating === 4 ? "Very Good" : "Excellent"}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block mb-2 font-medium">Your Review</label>
                      <textarea
                        value={userReview.comment}
                        onChange={(e) => setUserReview({...userReview, comment: e.target.value})}
                        className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                        rows="4"
                        placeholder="Share your experience with this product..."
                        required
                      ></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block mb-2 font-medium">Your Name</label>
                        <input
                          type="text"
                          value={userReview.name}
                          onChange={(e) => setUserReview({...userReview, name: e.target.value})}
                          className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium">Email</label>
                        <input
                          type="email"
                          value={userReview.email}
                          onChange={(e) => setUserReview({...userReview, email: e.target.value})}
                          className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      {editingReview ? "Update Review" : "Submit Review"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
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
                              {formatPriceCalculation(item.price, item.quantity, item.stock.unit)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => decrementQuantity(item._id)}
                                className={`p-1 rounded ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="px-2 py-1 bg-white border rounded min-w-[2rem] text-center">{item.quantity}{item.stock.unit}</span>
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
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default Catalog;