import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../UHContext/UHThemeContext";
import { useCart } from '../UHContext/UHCartContext';
import ChatBot from '../UHChatbot/UHChatbot';
import UHGift from '../UHCatalog/UHGift'
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
  Heart,
  User,
  Download,
  Gift,
  ImageIcon
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from '../UHNavbar/UHNavbar';
import Footer from '../UHFooter/UHFooter';
const Catalog = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const catalogRef = useRef(null);
  const searchTimeoutRef = useRef(null);
 
  // Use the cart context instead of local state
  const {
  cartItems,
  addToCart,
  removeFromCart,
  updateQuantity,
  getTotalItems,
  getTotalPrice,
  toggleCart,
  isCartOpen // Add this line
} = useCart();
 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMarket, setSelectedMarket] = useState("Local Market");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
  const [wishlist, setWishlist] = useState([]);
  const [giftBucket, setGiftBucket] = useState([]);
  const [showGiftModal, setShowGiftModal] = useState(false); // Add this line
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
 
  const categories = [
    "All",
    "Fruits",
    "Vegetables",
    "Eggs",
    "Meat",
    "Honey",
    "Milk Product",
  ];
 
  useEffect(() => {
    document.title = "Shop | Mount Olive Farm";
  }, []);
  const sampleImages = [
    "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1574856344991-aaa31b6f4ce3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1566842600175-97dca3dfc3c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  ];
 
  const splashQuotes = [
    "Life be healthy with vegetables and fruits",
    "Nourish your body with nature's best",
    "Fresh from the farm to your table",
    "Eat well, live well, naturally",
  ];
  // Default seasonal products for hero section
  const defaultSeasonalProducts = [
    {
      _id: "default-1",
      name: "Fresh Organic Fruits",
      price: 12.99,
      stock: { unit: "kg", quantity: 50 },
      image: sampleImages[0],
      category: "Fruits"
    },
    {
      _id: "default-2",
      name: "Farm Fresh Vegetables",
      price: 8.99,
      stock: { unit: "kg", quantity: 40 },
      image: sampleImages[1],
      category: "Vegetables"
    },
    {
      _id: "default-3",
      name: "Organic Honey",
      price: 15.99,
      stock: { unit: "jar", quantity: 30 },
      image: sampleImages[2],
      category: "Honey"
    },
    {
      _id: "default-4",
      name: "Farm Eggs",
      price: 6.99,
      stock: { unit: "dozen", quantity: 60 },
      image: sampleImages[3],
      category: "Eggs"
    }
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
    const savedViewed = localStorage.getItem("recentlyViewed");
    if (savedViewed) setRecentlyViewed(JSON.parse(savedViewed));
    const savedDeliveryInfo = localStorage.getItem("farmDeliveryInfo");
    if (savedDeliveryInfo) {
      setDeliveryInfo(JSON.parse(savedDeliveryInfo));
    }
    const savedWishlist = localStorage.getItem("farmWishlist");
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    const savedGiftBucket = localStorage.getItem("farmGiftBucket");
    if (savedGiftBucket) setGiftBucket(JSON.parse(savedGiftBucket));
  }, []);
  useEffect(() => {
    localStorage.setItem("farmWishlist", JSON.stringify(wishlist));
  }, [wishlist]);
  useEffect(() => {
    localStorage.setItem("farmGiftBucket", JSON.stringify(giftBucket));
  }, [giftBucket]);
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
  useEffect(() => {
    const productsToUse = seasonalProducts.length > 0 ? seasonalProducts : defaultSeasonalProducts;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % Math.max(productsToUse.length, 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [seasonalProducts.length]);
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
     
      // Only update seasonal products if we have actual products
      if (response.data.products.length > 0) {
        const seasonal = response.data.products
          .filter(p => p.category === 'Fruits' || p.category === 'Vegetables')
          .slice(0, 4)
          .map((p, index) => ({
            ...p,
            image: p.image || sampleImages[index % sampleImages.length]
          }));
        setSeasonalProducts(seasonal);
      } else {
        // Use default products if no products returned
        setSeasonalProducts(defaultSeasonalProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      // Set default seasonal products if API call fails
      setSeasonalProducts(defaultSeasonalProducts);
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
  const handleAddToCart = (product) => {
    addToCart(product);
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
  const toggleWishlist = (product) => {
    if (wishlist.find(item => item._id === product._id)) {
      setWishlist(wishlist.filter(item => item._id !== product._id));
      showToast(`${product.name} removed from wishlist!`);
    } else {
      setWishlist([...wishlist, product]);
      showToast(`${product.name} added to wishlist!`);
    }
  };
  const toggleGiftBucket = (product) => {
  if (giftBucket.find(item => item._id === product._id)) {
    setGiftBucket(giftBucket.filter(item => item._id !== product._id));
    showToast(`${product.name} removed from gift bucket!`);
  } else {
    setGiftBucket([...giftBucket, {...product, quantity: 1}]);
    showToast(`${product.name} added to gift bucket!`);
  }
};
  const proceedToPayment = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    navigate('/payment');
  };
  const trackViewedProduct = useCallback((product) => {
    setRecentlyViewed(prev => {
      const newViewed = [product, ...prev.filter(p => p._id !== product._id)];
      return newViewed.slice(0, 8);
    });
  }, []);
  const openQuickView = (product) => {
    // Only track real products, not default ones
    if (!product._id.startsWith('default-')) {
      trackViewedProduct(product);
    }
    setQuickViewProduct(product);
  };
  const openImageModal = (imageUrl) => {
    setCurrentImage(imageUrl);
    setShowImageModal(true);
  };
  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = 'product-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <Navbar onCartClick={toggleCart} />
        
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
      <Navbar onCartClick={toggleCart} />
      {/* Gift Bucket Icon - Positioned just above ChatBot */}
      <div className="fixed right-5 bottom-20 z-40">
  <button
    onClick={() => setShowGiftModal(true)} // Change this line
    className="relative p-4 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors"
  >
    <Gift size={24} />
    {giftBucket.length > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
        {giftBucket.length}
      </span>
    )}
  </button>
</div>
      {/* ChatBot - Keep at bottom */}
      <div className="fixed right-6 bottom-6 z-40">
        <ChatBot />
      </div>
      <div ref={catalogRef} className="pt-0"></div>
     
      <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
        {/* Hero Carousel */}
        <section className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
          {(seasonalProducts.length > 0 ? seasonalProducts : defaultSeasonalProducts).map((product, index) => (
            <div
              key={product._id || index}
              className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ${
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
              <div className="absolute inset-0 flex flex-col justify-center items-start px-6 md:px-16 lg:px-24 text-white">
                <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm mb-4 flex items-center gap-2">
                  <Zap size={16} /> Seasonal Favorite
                </span>
                <p className="text-3xl md:text-5xl font-bold max-w-2xl mb-6 leading-tight">
                  {splashQuotes[index % splashQuotes.length]}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => openQuickView(product)}
                    className="bg-white text-green-700 py-3 px-8 rounded-full font-semibold shadow-lg flex items-center transition-all hover:bg-green-50"
                  >
                    <Eye size={20} className="mr-2" /> View Product
                  </button>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="bg-green-600/90 hover:bg-green-700 text-white py-3 px-8 rounded-full font-semibold shadow-lg flex items-center transition-all border border-white/30"
                  >
                    <ShoppingCart size={20} className="mr-2" /> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
            {(seasonalProducts.length > 0 ? seasonalProducts : defaultSeasonalProducts).map((_, idx) => (
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
        {/* Trust Badges */}
        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-green-50"}`}>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-white rounded-full shadow-md">
                <ShieldCheck size={28} className="text-green-600" />
              </div>
              <span className="font-semibold text-sm md:text-base">Secure Payment</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-white rounded-full shadow-md">
                <Truck size={28} className="text-green-600" />
              </div>
              <span className="font-semibold text-sm md:text-base">Fast Delivery</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-white rounded-full shadow-md">
                <RotateCcw size={28} className="text-green-600" />
              </div>
              <span className="font-semibold text-sm md:text-base">Easy Returns</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-white rounded-full shadow-md">
                <BadgeCheck size={28} className="text-green-600" />
              </div>
              <span className="font-semibold text-sm md:text-base">Quality Guaranteed</span>
            </div>
          </div>
        </section>
        {/* Search and Filters */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full md:max-w-2xl">
              <Search
                size={20}
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="text"
                placeholder="Search organic products..."
                className={`w-full pl-12 pr-10 py-3 rounded-xl border-2 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
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
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-lg z-10 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                  {searchTerm ? (
                    <div className="p-3 text-sm">
                      <p className="p-2">Search for "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="p-3">
                      <p className="font-semibold p-2">Popular Searches</p>
                      {popularSearches.map((search, index) => (
                        <div
                          key={index}
                          className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
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
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <select
                value={selectedMarket}
                onChange={handleMarketChange}
                className={`px-4 py-3 rounded-xl border-2 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              >
                <option value="Local Market">Local Market</option>
                <option value="Export Market">Export Market</option>
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`px-4 py-3 rounded-xl border-2 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`p-3 rounded-xl flex items-center gap-2 transition-colors ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-100 border-2 border-gray-200"} focus:ring-2 focus:ring-green-500`}
                >
                  <Filter size={20} />
                  <span className="font-semibold hidden sm:inline">Filters</span>
                </button>
                {showFilterDropdown && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-xl z-20 p-5 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"} animate-slideDown`}>
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
                          className={`w-20 p-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
                          min="0"
                          max={priceRange[1]}
                        />
                        <span>-</span>
                        <input
                          type="number"
                          value={priceRange[1]}
                          onChange={(e) => handlePriceRangeChange(e, 1)}
                          className={`w-20 p-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-green-500`}
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
                      className={`w-full mt-4 py-3 rounded-xl font-semibold transition-colors ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
                    >
                      Apply Filters
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowRecentlyViewedDropdown(!showRecentlyViewedDropdown)}
                  className={`p-3 rounded-xl flex items-center gap-2 transition-colors ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-100 border-2 border-gray-200"}`}
                >
                  <Clock size={20} />
                  <span className="font-semibold hidden sm:inline">Viewed</span>
                </button>
                {showRecentlyViewedDropdown && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-lg z-20 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"} max-h-96 overflow-y-auto`}>
                    <div className="p-4">
                      <h3 className="font-semibold mb-3">Recently Viewed</h3>
                      {recentlyViewed.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {recentlyViewed.slice(0, 6).map((product) => (
                            <div
                              key={product._id}
                              className={`rounded-xl p-3 cursor-pointer transition-all hover:scale-105 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}
                              onClick={() => {
                                openQuickView(product);
                                setShowRecentlyViewedDropdown(false);
                              }}
                            >
                              <div className="h-20 w-full mb-2">
                                <img
                                  src={product.image || sampleImages[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-lg"
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
         
          {/* Filter Summary */}
          {(searchTerm || selectedCategory !== "All" || selectedMarket !== "Local Market") && (
            <div className={`mb-6 p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-green-50"}`}>
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
        </section>
        {/* Products Grid */}
        <section className="container mx-auto px-10 pb-16">
          <h2 className="text-3xl font-bold mb-8 text-center relative">
            <span className="relative inline-block">
              Our Organic Products
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></span>
            </span>
          </h2>
         
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => {
                  const avgRating = getAverageRating(product._id);
                  const reviewCount = getReviewCount(product._id);
                  const isWishlisted = wishlist.find(item => item._id === product._id);
                  const isGiftBucketed = giftBucket.find(item => item._id === product._id);
                  const isNew = product.createdAt && (new Date() - new Date(product.createdAt)) < (7 * 24 * 60 * 60 * 1000);
                 
                  return (
                    <div
                      key={product._id}
                      className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group ${
                        darkMode
                          ? `bg-gray-800 ${product.status === 'Low Stock' ? 'ring-2 ring-red-700' : ''}`
                          : `bg-white shadow-md ${product.status === 'Low Stock' ? 'ring-2 ring-red-300' : ''}`
                      }`}
                    >
                      {/* Product Image Container */}
                      <div
                        className="relative w-full h-64 overflow-hidden cursor-pointer"
                        onClick={() => openQuickView(product)}
                      >
                        {product.image ? (
                          <>
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </>
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                            <div className="text-center">
                              <Truck size={32} className={darkMode ? "text-gray-500" : "text-gray-400"} />
                              <p className={darkMode ? "text-gray-500 text-sm mt-1" : "text-gray-400 text-sm mt-1"}>No Image</p>
                            </div>
                          </div>
                        )}
                       
                        {/* Status Badge */}
                        <span className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full shadow-md ${
                          product.status === 'In Stock'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-200'
                            : product.status === 'Low Stock'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/80 dark:text-red-200'
                        }`}>
                          {product.status}
                        </span>
                       
                        {/* New Badge */}
                        {isNew && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200 text-xs font-semibold rounded-full shadow-md">
                            NEW
                          </span>
                        )}
                       
                        {/* Quick View Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openQuickView(product);
                              }}
                              className="bg-white text-green-700 p-2 rounded-full font-medium flex items-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                              title="Quick View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openImageModal(product.image);
                              }}
                              className="bg-white text-blue-600 p-2 rounded-full font-medium flex items-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                              title="View Image"
                            >
                              <ImageIcon size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGiftBucket(product);
                              }}
                              className={`p-2 rounded-full font-medium flex items-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ${
                                isGiftBucketed
                                  ? 'bg-pink-600 text-white'
                                  : 'bg-white text-pink-600'
                              }`}
                              title="Add to Gift Bucket"
                            >
                              <Gift size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                     
                      {/* Product Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 h-14 leading-tight group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {product.name}
                        </h3>
                       
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex flex-col">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              ${product.price}
                              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/{product.stock.unit}</span>
                            </p>
                            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              In stock: {product.stock.quantity} {product.stock.unit}
                            </p>
                          </div>
                         
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1">
                              {renderStars(avgRating)}
                              <span className="text-sm font-medium ml-1">{avgRating}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openReviewModal(product);
                              }}
                              className="text-xs mt-1 text-blue-500 hover:underline flex items-center"
                            >
                              <MessageCircle size={12} className="mr-1" />
                              {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                            </button>
                          </div>
                        </div>
                       
                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={product.status === 'Out of Stock'}
                            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                              product.status === 'Out of Stock'
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                                : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                            }`}
                          >
                            <ShoppingCart size={18} />
                            <span className="font-medium">{product.status === 'Out of Stock' ? 'Out of Stock' : 'Add to Cart'}</span>
                          </button>
                         
                          <button
                            onClick={() => shareProduct(product)}
                            className={`p-3 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              darkMode
                                ? "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 shadow-md"
                            }`}
                            aria-label="Share product"
                          >
                            <Share size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
             
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-md">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                        currentPage === 1
                          ? 'opacity-50 cursor-not-allowed text-gray-400'
                          : 'text-green-600 hover:bg-green-50 dark:hover:bg-gray-700'
                      }`}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={20} />
                    </button>
                   
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all font-medium ${
                          currentPage === page
                            ? 'bg-green-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-700'
                        }`}
                        aria-label={`Page ${page}`}
                      >
                        {page}
                      </button>
                    ))}
                   
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                        currentPage === totalPages
                          ? 'opacity-50 cursor-not-allowed text-gray-400'
                          : 'text-green-600 hover:bg-green-50 dark:hover:bg-gray-700'
                      }`}
                      aria-label="Next page"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={`text-center py-16 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Search size={40} className="text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className={darkMode ? "text-gray-400 mb-6" : "text-gray-500 mb-6"}>
                  Try adjusting your search or filter criteria to find what you're looking for.
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
                    className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
        {/* Quick View Modal */}
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
                        handleAddToCart(quickViewProduct);
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
       
        {/* Image Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className={`max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl ${darkMode ? "bg-gray-900" : "bg-white"}`}>
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Product Image</h2>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 flex justify-center">
                <img
                  src={currentImage}
                  alt="Product"
                  className="max-w-full max-h-96 object-contain rounded-lg"
                />
              </div>
              <div className="p-4 border-t flex justify-center">
                <button
                  onClick={downloadImage}
                  className={`px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-colors ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  <Download size={20} />
                  Download Image
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Review Modal */}
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
      </div>
      {/* Gift Modal */}
<UHGift
  isOpen={showGiftModal}
  onClose={() => setShowGiftModal(false)}
  giftItems={giftBucket}
  onUpdateGiftItems={setGiftBucket}
/>
     
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