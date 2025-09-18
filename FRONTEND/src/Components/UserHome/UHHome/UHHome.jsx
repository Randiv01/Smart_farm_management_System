// src/Components/UserHome/UHHome/Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBagIcon, 
  StarIcon, 
  TruckIcon, 
  ShieldCheckIcon, 
  LeafIcon, 
  HeartIcon,
  ArrowRightIcon,
  PlayIcon,
  UsersIcon,
  AwardIcon,
  ClockIcon,
  ArrowRight,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  CheckCircleIcon,
  XIcon,
  CalendarIcon,
  SparklesIcon,
  EyeIcon,
  ScanIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react';
import axios from 'axios';
import Footer from '../UHFooter/UHFooter';
import { FaWhatsapp } from 'react-icons/fa';

// Hero image imports
import Heroimage1 from '../Images/Heroimage1.jpg';
import Heroimage2 from '../Images/Heroimage2.jpg';
import Heroimage3 from '../Images/Heroimage3.jpg';
import Heroimage4 from '../Images/Heroimage4.jpg';
import Heroimage5 from '../Images/Heroimage5.jpg';

const Home = () => {
  // Function to handle email click
  const handleEmailClick = () => {
    window.location.href = 'mailto:info@mountolivefarm.com';
  };

  // Function to handle WhatsApp click
  const handleWhatsAppClick = () => {
    // Open WhatsApp with a pre-filled message
    window.open('https://wa.me/?text=Hello%20Mount%20Olive%20Farm,%20I%20would%20like%20to%20know%20more%20about%20your%20products.', '_blank');
  };
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('featured');
  const [isScrolled, setIsScrolled] = useState(false);
  const featuredProductsRef = useRef(null);
  const whyChooseUsRef = useRef(null);

  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "San Francisco, CA",
      comment: "The quality of produce from Mount Olive Farm is exceptional. I've been a customer for over 2 years and their organic chicken is the best I've ever tasted!",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
    },
    {
      name: "Michael Chen",
      location: "Los Angeles, CA",
      comment: "Their farm-fresh eggs make such a difference in my baking. The yolks are so vibrant and rich. Highly recommend to all home chefs!",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
    },
    {
      name: "Emma Rodriguez",
      location: "San Diego, CA",
      comment: "I love that I can trust the quality and source of my food. The vegetables are always fresh and full of flavor. My weekly grocery delivery is something I always look forward to.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
    }
  ];

  // Hero slider images
  const heroSlides = [
    {
      image: Heroimage1,
      title: "Farm-Fresh Vegetables & Fruits",
      subtitle: "Organic produce harvested at peak ripeness for maximum nutrition and flavor.",
      cta: "Shop Produce",
      offer: "15% OFF on first order"
    },
    {
      image: Heroimage2,
      title: "Ethically Raised Livestock",
      subtitle: "Free-range animals cared with love, ensuring high-quality farm products.",
      cta: "Explore Meat Products",
      offer: "Free delivery this week"
    },
    {
      image: Heroimage3,
      title: "Diverse Crop & Animal Farming",
      subtitle: "A multi-field smart farm combining plants, livestock, and modern sustainable practices.",
      cta: "Learn About Our Farm",
      offer: "Seasonal specials available"
    },
    {
      image: Heroimage4,
      title: "Bulk Orders Made Easy",
      subtitle: "Order fresh farm products in bulk, directly delivered to your home or business.",
      cta: "Bulk Order Info",
      offer: "10% discount on bulk orders"
    },
    {
      image: Heroimage5,
      title: "Smart Farm, Smarter Community",
      subtitle: "Join our farm family and enjoy seasonal bounty, transparency, and eco-friendly living.",
      cta: "Join Our Community",
      offer: "Refer a friend & get $20"
    }
  ];

  // Feature cards
  const features = [
    {
      icon: <TruckIcon className="h-8 w-8 text-dark-green" />,
      title: "Free Delivery",
      description: "Free delivery on orders over $150"
    },
    {
      icon: <ShieldCheckIcon className="h-8 w-8 text-dark-green" />,
      title: "Quality Guarantee",
      description: "100% quality guarantee on all products"
    },
    {
      icon: <LeafIcon className="h-8 w-8 text-dark-green" />,
      title: "100% Organic",
      description: "Certified organic farming practices"
    },
    {
      icon: <HeartIcon className="h-8 w-8 text-dark-green" />,
      title: "Farm Fresh",
      description: "Harvested fresh daily from our farm"
    }
  ];

  // Stats section
  const stats = [
    { value: "15+", label: "Years Experience", icon: <AwardIcon className="h-6 w-6" /> },
    { value: "500+", label: "Happy Customers", icon: <UsersIcon className="h-6 w-6" /> },
    { value: "100%", label: "Organic Certified", icon: <LeafIcon className="h-6 w-6" /> },
    { value: "24/7", label: "Customer Support", icon: <ClockIcon className="h-6 w-6" /> }
  ];

  // Why Choose Us benefits
  const benefits = [
    {
      title: "Farm-to-Table Freshness",
      description: "Our products go directly from our farm to your table within 24 hours of harvest, ensuring maximum freshness and nutrition.",
      icon: <SparklesIcon className="h-6 w-6" />
    },
    {
      title: "Traceability Technology",
      description: "Scan any product with our app to see exactly which field it came from, harvest date, and farming practices used.",
      icon: <ScanIcon className="h-6 w-6" />
    },
    {
      title: "Seasonal Subscription Boxes",
      description: "Get a curated box of seasonal produce delivered weekly or monthly, always at peak freshness and flavor.",
      icon: <CalendarIcon className="h-6 w-6" />
    },
    {
      title: "Virtual Farm Tours",
      description: "Take a virtual tour of our farm anytime to see how your food is grown and meet the farmers who grow it.",
      icon: <EyeIcon className="h-6 w-6" />
    }
  ];

  // Special offers
  const specialOffers = [
    {
      title: "First Order Discount",
      description: "Get 15% off your first order with code WELCOME15",
      validUntil: "2023-12-31",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    },
    {
      title: "Free Delivery Week",
      description: "Enjoy free delivery on all orders this week, no minimum required",
      validUntil: "2023-11-15",
      image: "https://images.unsplash.com/photo-1579112906293-3d5b5d5e3b0a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    },
    {
      title: "Bulk Order Savings",
      description: "Save 10% when you order in bulk for events or businesses",
      validUntil: "Ongoing",
      image: "https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    }
  ];

  // Set browser tab title
  useEffect(() => {
    document.title = "Home | Mount Olive Farm";
    
    // Handle scroll for header
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Rotate hero slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prevIndex) => 
        prevIndex === heroSlides.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/inventory/products/catalog/products", {
          params: { limit: 8 }
        });
        setProducts(response.data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        // Fallback sample products
        setProducts([
          { _id: 1, name: "Organic Tomatoes", price: 4.99, category: "vegetable", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
          { _id: 2, name: "Free-Range Eggs", price: 6.99, category: "dairy", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
          { _id: 3, name: "Grass-Fed Beef", price: 12.99, category: "meat", image: "https://images.unsplash.com/photo-1558036117-15e82a2c9a9a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
          { _id: 4, name: "Fresh Apples", price: 3.99, category: "fruit", image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle newsletter subscription
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      setShowSuccessPopup(true);
      setEmail('');
      
      // Hide success popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
    }
  };

  // Scroll to section
  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Product Card Component
  const ProductCard = ({ product }) => (
    <div className="bg-soft-white dark:bg-dark-card rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-0 left-0 bg-dark-green text-soft-white text-xs font-semibold px-2 py-1 rounded-br-lg">
          {product.category}
        </div>
        <button className="absolute top-2 right-2 p-2 bg-soft-white/80 rounded-full shadow-md hover:bg-soft-white transition-colors">
          <HeartIcon className="h-5 w-5 text-dark-gray hover:text-dark-green" />
        </button>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button className="bg-dark-green text-soft-white py-2 px-4 rounded-full flex items-center font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <ShoppingBagIcon className="h-4 w-4 mr-1" /> Quick View
          </button>
        </div>
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-gray-800 dark:text-dark-text mb-1 line-clamp-1">{product.name}</h4>
        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <StarIcon 
              key={i} 
              className={`h-4 w-4 ${i < 4 ? 'text-btn-yellow fill-current' : 'text-gray-300'}`} 
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">(24)</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-lg font-bold text-dark-green dark:text-green-400">${product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through ml-2">${product.originalPrice}</span>
            )}
          </div>
          <button className="bg-dark-green hover:bg-green-800 text-soft-white p-2 rounded-full transition-colors">
            <ShoppingBagIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Testimonial Card Component
  const TestimonialCard = ({ testimonial }) => (
    <div className="bg-soft-white dark:bg-dark-card p-6 rounded-xl shadow-md h-full">
      <div className="flex items-center mb-4">
        {[...Array(5)].map((_, i) => (
          <StarIcon 
            key={i} 
            className={`h-5 w-5 ${i < testimonial.rating ? 'text-btn-yellow fill-current' : 'text-gray-300'}`} 
          />
        ))}
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-4 italic">"{testimonial.comment}"</p>
      <div className="flex items-center mt-auto">
        <img src={testimonial.image} alt={testimonial.name} className="h-12 w-12 rounded-full object-cover mr-3" />
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-dark-text">{testimonial.name}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.location}</p>
        </div>
      </div>
    </div>
  );

  // Special Offer Card
  const OfferCard = ({ offer }) => (
    <div className="bg-gradient-to-r from-dark-green to-green-800 text-soft-white rounded-xl overflow-hidden shadow-lg">
      <div className="p-6">
        <div className="mb-4">
          <span className="inline-block bg-btn-yellow text-dark-green text-xs font-bold px-2 py-1 rounded uppercase mb-2">
            Limited Time
          </span>
          <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
          <p className="mb-4">{offer.description}</p>
          <div className="flex items-center text-sm opacity-90">
            <ClockIcon className="h-4 w-4 mr-1" />
            Valid until: {offer.validUntil}
          </div>
        </div>
        <button className="bg-soft-white text-dark-green font-semibold py-2 px-4 rounded-lg hover:bg-light-beige transition-colors w-full">
          Claim Offer
        </button>
      </div>
    </div>
  );

  return (
    <>
      <main className="w-full bg-light-beige dark:bg-dark-bg min-h-screen">
        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg flex items-center animate-fadeIn">
            <CheckCircleIcon className="h-6 w-6 mr-2" />
            <span>Thank you for subscribing to our newsletter!</span>
            <button 
              onClick={() => setShowSuccessPopup(false)} 
              className="ml-4 text-green-700 hover:text-green-900"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Floating Action Buttons - UPDATED */}
        <div className="fixed right-6 bottom-6 z-40 flex flex-col gap-3">
          {/* WhatsApp button instead of phone */}
          <button 
            onClick={handleWhatsAppClick}
            className="bg-green-600 text-soft-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors tooltip"
          >
            <FaWhatsapp className="h-6 w-6" />
            <span className="tooltiptext">WhatsApp</span>
          </button>
          
          {/* Email button that opens mail client */}
          <button 
            onClick={handleEmailClick}
            className="bg-btn-yellow text-dark-green p-3 rounded-full shadow-lg hover:bg-yellow-500 transition-colors tooltip"
          >
            <MailIcon className="h-6 w-6" />
            <span className="tooltiptext">Email Us</span>
          </button>
        </div>

        {/* 1. Hero Section */}
        <section className="relative w-full h-screen overflow-hidden">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ${
                index === currentHeroIndex ? "opacity-100 z-20" : "opacity-0 z-0"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover brightness-90 contrast-125"
              />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/40 via-black/20 to-black/70"></div>

              {/* Conditionally render text on right for the third slide (index 2) */}
              <div className={`absolute inset-0 flex flex-col justify-center items-start text-left px-8 md:px-16 text-soft-white ${
                index === 2 ? "md:items-end md:text-right" : ""
              }`}>
                <div className={`max-w-2xl ${index === 2 ? "md:mr-8 lg:mr-16" : ""}`}>
                  <div className="inline-block bg-soft-white/20 backdrop-blur-sm text-soft-white text-sm font-semibold px-4 py-2 rounded-full mb-6">
                    {slide.offer}
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fadeIn">
                    {slide.title}
                  </h1>
                  <p className="text-xl md:text-2xl mb-8 animate-fadeIn">
                    {slide.subtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 animate-fadeIn">
                    <a 
                      href={slide.cta === "Join Our Community" ? "/news" : "/InventoryManagement/catalog"} 
                      className="bg-dark-green hover:bg-green-800 text-soft-white py-3 px-8 rounded-lg font-semibold transition-colors flex items-center"
                    >
                      {slide.cta} <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </a>
                    <button 
                      onClick={() => scrollToSection(whyChooseUsRef)}
                      className="border-2 border-soft-white text-soft-white hover:bg-soft-white hover:text-dark-green py-3 px-8 rounded-lg font-semibold transition-colors"
                    >
                      Why Choose Us
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Navigation Dots */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  idx === currentHeroIndex ? "bg-dark-green scale-125" : "bg-soft-white/40 hover:bg-soft-white/70"
                }`}
                onClick={() => setCurrentHeroIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
            <div className="w-6 h-10 border-2 border-soft-white rounded-full flex justify-center">
              <div className="w-1 h-3 bg-soft-white rounded-full mt-2"></div>
            </div>
          </div>
        </section>

        {/* 2. Special Offers Bar */}
        <section className="bg-btn-yellow text-dark-green py-3">
          <div className="container mx-auto">
            <div className="flex overflow-hidden">
              <div className="animate-marquee whitespace-nowrap flex items-center">
                {[...specialOffers, ...specialOffers].map((offer, index) => (
                  <span key={index} className="mx-4 flex items-center">
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    <span className="font-semibold">{offer.title}:</span>
                    <span className="ml-1">{offer.description}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Introduction Section */}
        <section className="py-16 bg-soft-white dark:bg-dark-card">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Text Content */}
              <div className="flex flex-col justify-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-dark-text mb-8">
                  Welcome to <span className="text-dark-green">MountOlive Farm</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  For over 15 years, MountOlive Farm has been dedicated to sustainable farming practices that prioritize
                  environmental health, animal welfare, and community well-being. Our commitment to organic living means
                  you get the freshest, most nutritious products straight from our farm to your table.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  We believe in transparency, quality, and the power of nature to provide the best nourishment for your family.
                  Every product you buy supports our mission to create a more sustainable food system.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="/about"
                    className="bg-dark-green hover:bg-green-800 text-soft-white py-3 px-6 rounded-lg font-semibold transition-colors text-center flex items-center justify-center"
                  >
                    Our Story <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </a>
                  <button 
                    onClick={() => scrollToSection(featuredProductsRef)}
                    className="border-2 border-dark-green text-dark-green hover:bg-dark-green hover:text-soft-white py-3 px-6 rounded-lg font-semibold transition-colors text-center"
                  >
                    Shop Products
                  </button>
                </div>
              </div>

              {/* Image */}
              <div className="order-first lg:order-last relative">
                <div className="overflow-hidden rounded-xl shadow-lg bg-green-50 dark:bg-dark-card">
                  <img 
                    src={require('../Images/mohomeimage.png')} 
                    alt="MountOlive Farm" 
                    className="w-full h-80 md:h-[400px] lg:h-[500px] object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-soft-white dark:bg-dark-bg p-6 rounded-xl shadow-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-dark-green dark:text-green-400">15+</div>
                    <div className="text-gray-600 dark:text-gray-300">Years of Farming Excellence</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. Highlights Section */}
        <section className="py-16 bg-light-beige dark:bg-dark-bg">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-soft-white dark:bg-dark-card p-6 rounded-xl shadow-sm text-center transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-green-100 dark:bg-dark-bg rounded-full group-hover:bg-dark-green transition-colors">
                    {React.cloneElement(feature.icon, { 
                      className: "h-8 w-8 text-dark-green dark:text-green-400 group-hover:text-soft-white" 
                    })}
                  </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Featured Products Section */}
        <section ref={featuredProductsRef} className="py-16 bg-soft-white dark:bg-dark-card">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-dark-text">Featured Products</h2>
              <div className="flex mt-4 md:mt-0 bg-light-beige dark:bg-dark-bg p-1 rounded-lg">
                <button 
                  className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'featured' ? 'bg-dark-green text-soft-white' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('featured')}
                >
                  Featured
                </button>
                <button 
                  className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'new' ? 'bg-dark-green text-soft-white' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('new')}
                >
                  New Arrivals
                </button>
                <button 
                  className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'bestsellers' ? 'bg-dark-green text-soft-white' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('bestsellers')}
                >
                  Bestsellers
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-green"></div>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
                <div className="text-center">
                  <a href="/InventoryManagement/catalog" className="bg-dark-green hover:bg-green-800 text-soft-white py-3 px-8 rounded-lg font-semibold transition-colors inline-flex items-center">
                    View All Products <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </a>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-300">No products available at the moment.</p>
              </div>
            )}
          </div>
        </section>

        {/* 6. Why Choose Us Section */}
        <section ref={whyChooseUsRef} className="py-16 bg-light-beige dark:bg-dark-bg">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-dark-text mb-4">Why Choose MountOlive Farm?</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                We're not just another farm. Our unique approach combines traditional farming wisdom with modern technology to bring you the best possible products.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-soft-white dark:bg-dark-card p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-start mb-4">
                    <div className="p-3 bg-green-100 dark:bg-dark-bg rounded-full mr-4 text-dark-green">
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text">{benefit.title}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{benefit.description}</p>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="bg-soft-white dark:bg-dark-card p-6 rounded-xl text-center transition-transform duration-300 hover:scale-105">
                  <div className="flex justify-center mb-4 text-dark-green dark:text-green-400">
                    {stat.icon}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-dark-text mb-2">{stat.value}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Special Offers Section */}
        <section className="py-16 bg-dark-green text-soft-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Special Offers</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {specialOffers.map((offer, index) => (
                <OfferCard key={index} offer={offer} />
              ))}
            </div>
          </div>
        </section>

        {/* 8. Testimonials Section */}
        <section className="py-16 bg-soft-white dark:bg-dark-card">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-dark-text mb-12">What Our Customers Say</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>

        {/* 9. Newsletter Section */}
        <section className="py-16 bg-light-beige dark:bg-dark-bg">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-dark-text mb-4">Stay Updated with Our Farm</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Subscribe to our newsletter to receive updates on new products, special offers, and farming tips.
              </p>
              
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-grow px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dark-green focus:border-transparent dark:bg-dark-gray dark:text-dark-text dark:border-dark-gray"
                />
                <button 
                  type="submit" 
                  className="bg-dark-green text-soft-white font-semibold px-6 py-3 rounded-lg hover:bg-green-800 transition-colors"
                >
                  Subscribe
                </button>
              </form>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .tooltip {
          position: relative;
        }
        
        .tooltip .tooltiptext {
          visibility: hidden;
          width: 80px;
          background-color: #555;
          color: #fff;
          text-align: center;
          border-radius: 6px;
          padding: 5px;
          position: absolute;
          z-index: 1;
          bottom: 125%;
          left: 50%;
          margin-left: -40px;
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .tooltip .tooltiptext::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: #555 transparent transparent transparent;
        }
        
        .tooltip:hover .tooltiptext {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
    </>
  );
};

export default Home;