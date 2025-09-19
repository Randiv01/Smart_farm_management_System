// src/Components/UserHome/News/News.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Header from '../UHNavbar/UHNavbar';
import Footer from '../UHFooter/UHFooter';
import ChatBot from '../UHChatbot/UHChatbot';
import { 
  CalendarIcon, 
  ArrowRightIcon, 
  SearchIcon, 
  FilterIcon,
  BookmarkIcon,
  Share2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
  ClockIcon,
  TrendingUpIcon,
  MailIcon,
  MapPinIcon,
  UserIcon
} from 'lucide-react';
import { useTheme } from '../UHContext/UHThemeContext';

//image imports
import OrganicAward from '../Images/Organic Excellence Award.jpg'; 
import WaterManagement from '../Images/Sustainable-Water-Management.jpg';
import votunteer from '../Images/votunteer-programs.jpg';
import HarvestFestival from '../Images/HarvestFestival.png';
import OrganicProduct from '../Images/OrganicProduct.jpg';
import bees from '../Images/bees.jpg';
import ReducesWaste from '../Images/ReducesWaste.jpg';
// Expanded articles data with more content
const articles = [
  {
    id: 1,
    title: "MountOlive Farm Wins Organic Excellence Award 2025",
    date: "September 5, 2025",
    excerpt: "We are proud to announce that MountOlive Farm has received the Organic Excellence Award for sustainable and eco-friendly farming practices.",
    image: OrganicAward,
    category: "Achievements",
    readTime: "4 min read",
    isFeatured: true,
    author: "Sarah Johnson",
    location: "Main Farm Campus",
    tags: ["Award", "Sustainability", "Organic"],
    content: "Full article content would go here...",
    views: 1245,
    likes: 89
  },
  {
    id: 2,
    title: "Community Harvest Festival at MountOlive",
    date: "August 20, 2025",
    excerpt: "Our annual Harvest Festival brought together families, local businesses, and community members to celebrate fresh produce and organic living.",
    image: HarvestFestival,
    category: "Events",
    readTime: "5 min read",
    isFeatured: false,
    author: "Michael Chen",
    location: "Community Field",
    tags: ["Festival", "Community", "Harvest"],
    content: "Full article content would go here...",
    views: 987,
    likes: 76
  },
  {
    id: 3,
    title: "New Organic Product Line Launched",
    date: "July 10, 2025",
    excerpt: "We have introduced a new range of organic vegetables and dairy products, expanding our mission to deliver fresh and healthy produce.",
    image: OrganicProduct,
    category: "Products",
    readTime: "3 min read",
    isFeatured: false,
    author: "Emma Rodriguez",
    location: "Farm Store",
    tags: ["Products", "Launch", "Organic"],
    content: "Full article content would go here...",
    views: 1123,
    likes: 92
  },
  {
    id: 4,
    title: "Sustainable Water Management Practices",
    date: "June 22, 2025",
    excerpt: "Learn how we're implementing innovative water conservation techniques to reduce our environmental footprint.",
    image: WaterManagement,
    category: "Sustainability",
    readTime: "6 min read",
    isFeatured: true,
    author: "David Wilson",
    location: "Irrigation Fields",
    tags: ["Water", "Conservation", "Innovation"],
    content: "Full article content would go here...",
    views: 1567,
    likes: 134
  },
  {
    id: 5,
    title: "Partnership with Local Schools for Agricultural Education",
    date: "May 15, 2025",
    excerpt: "We're excited to partner with local schools to educate the next generation about sustainable farming practices.",
    image: "https://images.unsplash.com/photo-1584697964358-3e14ca57658b?auto=format&fit=crop&w=1200&q=80",
    category: "Community",
    readTime: "4 min read",
    isFeatured: false,
    author: "Lisa Thompson",
    location: "Education Center",
    tags: ["Education", "Partnership", "Schools"],
    content: "Full article content would go here...",
    views: 876,
    likes: 65
  },
  {
    id: 6,
    title: "Seasonal Harvest Update: Summer 2025",
    date: "April 30, 2025",
    excerpt: "Get the latest updates on our summer harvest, including what's fresh and available at our farm stands.",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
    category: "Harvest",
    readTime: "3 min read",
    isFeatured: false,
    author: "James Miller",
    location: "Harvest Fields",
    tags: ["Seasonal", "Produce", "Update"],
    content: "Full article content would go here...",
    views: 1345,
    likes: 121
  },
  {
    id: 7,
    title: "Introducing Our New Bee Conservation Program",
    date: "April 15, 2025",
    excerpt: "We've launched a new initiative to protect local bee populations and promote pollination across our organic fields.",
    image: bees,
    category: "Sustainability",
    readTime: "5 min read",
    isFeatured: false,
    author: "Rachel Green",
    location: "Pollination Gardens",
    tags: ["Bees", "Conservation", "Ecology"],
    content: "Full article content would go here...",
    views: 987,
    likes: 87
  },
  {
    id: 8,
    title: "Farm-to-Table Dinner Series Returns This Fall",
    date: "March 28, 2025",
    excerpt: "Join us for our exclusive farm-to-table dining experiences featuring seasonal ingredients prepared by renowned chefs.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    category: "Events",
    readTime: "4 min read",
    isFeatured: false,
    author: "Thomas Wright",
    location: "Event Barn",
    tags: ["Dining", "Chefs", "Seasonal"],
    content: "Full article content would go here...",
    views: 1234,
    likes: 98
  },
  {
    id: 9,
    title: "Expanding Our Organic Certification to New Crops",
    date: "March 10, 2025",
    excerpt: "We're proud to announce that five additional crops have received official organic certification.",
    image: "https://images.unsplash.com/photo-1471194402529-8e0f5a675de6?auto=format&fit=crop&w=1200&q=80",
    category: "Products",
    readTime: "3 min read",
    isFeatured: false,
    author: "Patricia Lee",
    location: "Certification Office",
    tags: ["Certification", "Expansion", "Quality"],
    content: "Full article content would go here...",
    views: 765,
    likes: 54
  },
  {
    id: 10,
    title: "Volunteer Program: Join Us for Spring Planting",
    date: "February 22, 2025",
    excerpt: "Our community volunteer program returns this spring. Help us plant the season's first crops and learn about sustainable agriculture.",
    image: votunteer,
    category: "Community",
    readTime: "4 min read",
    isFeatured: true,
    author: "Robert Kim",
    location: "Volunteer Fields",
    tags: ["Volunteer", "Planting", "Spring"],
    content: "Full article content would go here...",
    views: 1109,
    likes: 103
  },
  {
    id: 11,
    title: "Innovative Composting System Reduces Waste by 75%",
    date: "February 5, 2025",
    excerpt: "Our new composting initiative has dramatically reduced farm waste while creating nutrient-rich soil for our fields.",
    image: ReducesWaste,
    category: "Sustainability",
    readTime: "6 min read",
    isFeatured: false,
    author: "Jennifer Adams",
    location: "Composting Facility",
    tags: ["Compost", "Innovation", "Waste Reduction"],
    content: "Full article content would go here...",
    views: 1321,
    likes: 115
  },
  {
    id: 12,
    title: "Meet Our New Farm Animals: Heritage Breed Introduction",
    date: "January 18, 2025",
    excerpt: "We've introduced heritage breed chickens and cows to promote genetic diversity and sustainable livestock practices.",
    image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1200&q=80",
    category: "Products",
    readTime: "5 min read",
    isFeatured: false,
    author: "Kevin Martinez",
    location: "Livestock Area",
    tags: ["Animals", "Heritage Breeds", "Livestock"],
    content: "Full article content would go here...",
    views: 1543,
    likes: 142
  }
];

const categories = ["All", "Achievements", "Events", "Products", "Sustainability", "Community", "Harvest"];
const tags = ["Award", "Festival", "Launch", "Conservation", "Education", "Seasonal", "Bees", "Dining", "Certification", "Volunteer", "Compost", "Animals"];

const News = () => {
  const { darkMode } = useTheme();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [bookmarkedArticles, setBookmarkedArticles] = useState(new Set());
  const [email, setEmail] = useState("");
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const articlesPerPage = 9;

  // Toggle bookmark
  const toggleBookmark = (articleId) => {
    const newBookmarks = new Set(bookmarkedArticles);
    if (newBookmarks.has(articleId)) {
      newBookmarks.delete(articleId);
    } else {
      newBookmarks.add(articleId);
    }
    setBookmarkedArticles(newBookmarks);
  };

  // Toggle tag filter
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Filter articles based on category, search query, and tags
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesCategory = activeCategory === "All" || article.category === activeCategory;
      const matchesSearch = searchQuery === "" || 
                           article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           article.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.some(tag => article.tags.includes(tag));
      
      return matchesCategory && matchesSearch && matchesTags;
    }).sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === "popular") {
        return b.views - a.views;
      } else if (sortBy === "likes") {
        return b.likes - a.likes;
      }
      return 0;
    });
  }, [activeCategory, searchQuery, selectedTags, sortBy]);

  // Pagination logic
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery, selectedTags, sortBy]);

  useEffect(() => {
    document.title = "News | Mount Olive Farm";
  }, []);

  // Handle newsletter subscription
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      // In a real app, you would send this to your backend
      console.log("Subscribed email:", email);
      setEmailSubscribed(true);
      setEmail("");
      
      // Reset after 3 seconds
      setTimeout(() => {
        setEmailSubscribed(false);
      }, 3000);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveCategory("All");
    setSearchQuery("");
    setSelectedTags([]);
    setSortBy("newest");
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-dark-bg text-dark-text' : 'bg-gray-50 text-gray-900'}`}>
      <Header />
      <ChatBot/>
      
      {/* Hero Section with Parallax Effect */}
      <section className={`relative py-24 ${darkMode ? 'bg-dark-gray' : 'bg-green-900'} text-white overflow-hidden`}>
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80"
            alt="Farm Field"
            className="w-full h-full object-cover opacity-40 transform scale-105"
            style={{ transform: 'translateZ(0)' }}
          />
          <div className={`absolute inset-0 ${darkMode ? 'bg-dark-overlay' : 'bg-green-overlay'}`}></div>
        </div>
        <div className="relative z-10 container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Farm News & Stories
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8">
            Discover the latest updates, events, and stories from MountOlive Farm's sustainable journey
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {categories.filter(cat => cat !== "All").map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className="px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full hover:bg-opacity-30 transition-all"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className={`py-6 ${darkMode ? 'bg-dark-bg' : 'bg-white'} sticky top-16 z-20 shadow-md`}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Search Bar */}
            <div className={`relative w-full lg:w-2/5 ${darkMode ? 'text-dark-text' : ''}`}>
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search news, stories, events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${darkMode ? 'bg-dark-card border-dark-gray text-dark-text placeholder-gray-400' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-green-600`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XIcon size={18} />
                </button>
              )}
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-3/5">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <FilterIcon size={20} className={darkMode ? 'text-dark-text' : 'text-gray-600'} />
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${activeCategory === category 
                        ? darkMode 
                          ? 'bg-dark-green text-soft-white' 
                          : 'bg-green-700 text-white'
                        : darkMode 
                          ? 'bg-dark-card text-dark-text hover:bg-dark-gray' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className={`relative ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`pl-3 pr-8 py-1 rounded-lg border ${darkMode ? 'bg-dark-card border-dark-gray' : 'bg-white border-gray-300'} focus:outline-none focus:ring-1 focus:ring-green-600 appearance-none`}
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="likes">Most Likes</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Tag Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Filter by tags:</span>
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${selectedTags.includes(tag) 
                  ? darkMode 
                    ? 'bg-btn-teal text-white' 
                    : 'bg-green-600 text-white'
                  : darkMode 
                    ? 'bg-dark-card text-dark-text hover:bg-dark-gray' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
            {(searchQuery || activeCategory !== "All" || selectedTags.length > 0) && (
              <button
                onClick={clearFilters}
                className={`ml-2 px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className={`py-3 ${darkMode ? 'bg-dark-card' : 'bg-green-50'} border-b ${darkMode ? 'border-dark-gray' : 'border-green-100'}`}>
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-between items-center text-sm">
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Showing <strong>{filteredArticles.length}</strong> of {articles.length} articles
            </span>
            {selectedTags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Active tags:</span>
                {selectedTags.map(tag => (
                  <span 
                    key={tag} 
                    className={`px-2 py-1 rounded-full ${darkMode ? 'bg-dark-green text-soft-white' : 'bg-green-200 text-green-800'} text-xs`}
                  >
                    {tag}
                    <button 
                      onClick={() => toggleTag(tag)}
                      className="ml-1 focus:outline-none"
                    >
                      <XIcon size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured News Carousel */}
      {filteredArticles.some(article => article.isFeatured) && (
        <section className="py-12">
          <div className="container mx-auto px-6">
            <h2 className={`text-2xl font-bold mb-6 flex items-center ${darkMode ? 'text-dark-text' : 'text-gray-900'}`}>
              <TrendingUpIcon className="mr-2" size={24} /> Featured Stories
            </h2>
            <div className="grid lg:grid-cols-2 gap-8">
              {filteredArticles.filter(article => article.isFeatured).map(article => (
                <div 
                  key={article.id} 
                  className={`rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${darkMode ? 'bg-dark-card' : 'bg-white'} group`}
                >
                  <div className="relative">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-dark-green text-soft-white' : 'bg-green-100 text-green-800'}`}>
                        {article.category}
                      </span>
                      <button 
                        onClick={() => toggleBookmark(article.id)}
                        className={`p-2 rounded-full backdrop-blur-sm ${darkMode ? 'bg-dark-overlay text-soft-white' : 'bg-white bg-opacity-90 text-gray-700'} ${bookmarkedArticles.has(article.id) ? 'text-yellow-400' : ''}`}
                      >
                        <BookmarkIcon size={16} fill={bookmarkedArticles.has(article.id) ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm flex-wrap gap-2">
                        <div className={`flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <CalendarIcon className="h-4 w-4 mr-1" /> 
                          {article.date}
                        </div>
                        <span className={darkMode ? 'text-gray-600' : 'text-gray-300'}>•</span>
                        <div className={`flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {article.readTime}
                        </div>
                        <span className={darkMode ? 'text-gray-600' : 'text-gray-300'}>•</span>
                        <div className={`flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <UserIcon className="h-4 w-4 mr-1" />
                          {article.author}
                        </div>
                      </div>
                    </div>
                    <h3 className={`text-xl font-semibold mb-3 group-hover:text-green-700 transition-colors ${darkMode ? 'text-dark-text group-hover:text-btn-teal' : 'text-gray-900'}`}>
                      {article.title}
                    </h3>
                    <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-sm">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{article.views} views</span>
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{article.likes} likes</span>
                      </div>
                      <button className={`px-5 py-2 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-btn-teal hover:bg-green-700' : 'bg-green-700 hover:bg-green-600'} text-white transition-colors group/btn`}>
                        Read More <ArrowRightIcon className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* News Grid */}
      <section className="py-12 container mx-auto px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-dark-text' : 'text-gray-900'}`}>
            {activeCategory === "All" ? "All Stories" : activeCategory + " Stories"}
            <span className="text-sm font-normal ml-2 text-gray-500">
              ({filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'})
            </span>
          </h2>
        </div>
        
        {currentArticles.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentArticles.filter(article => !article.isFeatured).map((article) => (
                <div
                  key={article.id}
                  className={`rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${darkMode ? 'bg-dark-card' : 'bg-white'} group`}
                >
                  <div className="relative">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-dark-green text-soft-white' : 'bg-green-100 text-green-800'}`}>
                        {article.category}
                      </span>
                    </div>
                    <button 
                      onClick={() => toggleBookmark(article.id)}
                      className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm ${darkMode ? 'bg-dark-overlay text-soft-white' : 'bg-white bg-opacity-90 text-gray-700'} ${bookmarkedArticles.has(article.id) ? 'text-yellow-400' : ''}`}
                    >
                      <BookmarkIcon size={16} fill={bookmarkedArticles.has(article.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`flex items-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <CalendarIcon className="h-4 w-4 mr-1" /> 
                        {article.date}
                      </div>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {article.readTime}
                      </span>
                    </div>
                    <h3 className={`text-lg font-semibold mb-3 group-hover:text-green-700 transition-colors ${darkMode ? 'text-dark-text group-hover:text-btn-teal' : 'text-gray-900'}`}>
                      {article.title}
                    </h3>
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {article.excerpt}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.tags.map(tag => (
                        <span 
                          key={tag} 
                          className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-dark-gray text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <button className={`px-4 py-2 rounded-lg flex items-center gap-1 ${darkMode ? 'bg-btn-teal hover:bg-green-700' : 'bg-green-700 hover:bg-green-600'} text-white text-sm transition-colors group/btn`}>
                        Read More <ArrowRightIcon className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                      <div className="flex gap-2">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {article.views} views
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-full ${darkMode ? 'text-dark-text hover:bg-dark-gray' : 'text-gray-700 hover:bg-gray-100'} disabled:opacity-50`}
                  >
                    <ChevronLeftIcon size={20} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-full ${currentPage === page 
                        ? darkMode 
                          ? 'bg-dark-green text-soft-white' 
                          : 'bg-green-700 text-white'
                        : darkMode 
                          ? 'text-dark-text hover:bg-dark-gray' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-full ${darkMode ? 'text-dark-text hover:bg-dark-gray' : 'text-gray-700 hover:bg-gray-100'} disabled:opacity-50`}
                  >
                    <ChevronRightIcon size={20} />
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="mx-auto w-24 h-24 mb-4">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p className="text-lg mb-2">No articles found matching your criteria.</p>
            <p className="mb-4">Try adjusting your filters or search terms.</p>
            <button 
              onClick={clearFilters}
              className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-btn-teal hover:bg-green-700' : 'bg-green-700 hover:bg-green-600'} text-white`}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </section>

      {/* Newsletter Section */}
      <section className={`py-16 ${darkMode ? 'bg-dark-card' : 'bg-green-50'}`}>
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
            <MailIcon size={28} />
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-900'}`}>Stay Updated with Our Farm</h2>
          <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Subscribe to get farm stories, seasonal updates, and exclusive content directly in your inbox.
          </p>
          
          {emailSubscribed ? (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-green text-soft-white' : 'bg-green-100 text-green-800'}`}>
              <p>Thank you for subscribing! You'll hear from us soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row justify-center items-center gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full md:w-64 px-4 py-3 rounded-lg border ${darkMode ? 'bg-dark-gray border-dark-gray text-dark-text placeholder-gray-400' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-green-600`}
              />
              <button type="submit" className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-btn-teal hover:bg-green-700' : 'bg-green-700 hover:bg-green-600'} text-white font-medium whitespace-nowrap`}>
                Subscribe
              </button>
            </form>
          )}
          
          <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default News;