// src/Components/UserHome/News/News.jsx
import React, { useState, useEffect } from 'react';
import Header from '../UHNavbar/UHNavbar';
import Footer from '../UHFooter/UHFooter';
import { 
  CalendarIcon, 
  ArrowRightIcon, 
  SearchIcon, 
  FilterIcon,
  BookmarkIcon,
  Share2Icon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react';
import { useTheme } from '../UHContext/UHThemeContext';



const articles = [
  {
    id: 1,
    title: "MountOlive Farm Wins Organic Excellence Award 2025",
    date: "September 5, 2025",
    excerpt: "We are proud to announce that MountOlive Farm has received the Organic Excellence Award for sustainable and eco-friendly farming practices.",
    image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
    category: "Achievements",
    readTime: "4 min read",
    isFeatured: true
  },
  {
    id: 2,
    title: "Community Harvest Festival at MountOlive",
    date: "August 20, 2025",
    excerpt: "Our annual Harvest Festival brought together families, local businesses, and community members to celebrate fresh produce and organic living.",
    image: "https://images.unsplash.com/photo-1600788915908-0d3e42b1bb3a?auto=format&fit=crop&w=1200&q=80",
    category: "Events",
    readTime: "5 min read",
    isFeatured: false
  },
  {
    id: 3,
    title: "New Organic Product Line Launched",
    date: "July 10, 2025",
    excerpt: "We have introduced a new range of organic vegetables and dairy products, expanding our mission to deliver fresh and healthy produce.",
    image: "https://images.unsplash.com/photo-1506801310323-534be5e7c1f8?auto=format&fit=crop&w=1200&q=80",
    category: "Products",
    readTime: "3 min read",
    isFeatured: false
  },
  {
    id: 4,
    title: "Sustainable Water Management Practices",
    date: "June 22, 2025",
    excerpt: "Learn how we're implementing innovative water conservation techniques to reduce our environmental footprint.",
    image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=1200&q=80",
    category: "Sustainability",
    readTime: "6 min read",
    isFeatured: false
  },
  {
    id: 5,
    title: "Partnership with Local Schools for Agricultural Education",
    date: "May 15, 2025",
    excerpt: "We're excited to partner with local schools to educate the next generation about sustainable farming practices.",
    image: "https://images.unsplash.com/photo-1584697964358-3e14ca57658b?auto=format&fit=crop&w=1200&q=80",
    category: "Community",
    readTime: "4 min read",
    isFeatured: false
  },
  {
    id: 6,
    title: "Seasonal Harvest Update: Summer 2025",
    date: "April 30, 2025",
    excerpt: "Get the latest updates on our summer harvest, including what's fresh and available at our farm stands.",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
    category: "Harvest",
    readTime: "3 min read",
    isFeatured: false
  }
];


const categories = ["All", "Achievements", "Events", "Products", "Sustainability", "Community", "Harvest"];

const News = () => {
  const { darkMode } = useTheme();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 6;

  // Filter articles based on category and search query
  const filteredArticles = articles.filter(article => {
    const matchesCategory = activeCategory === "All" || article.category === activeCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination logic
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

   useEffect(() => {
      document.title = "News | Mount Olive Farm";
    }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-dark-bg text-dark-text' : 'bg-gray-50 text-gray-900'}`}>
      <Header />
      
      {/* Hero Section */}
      <section className={`relative py-20 ${darkMode ? 'bg-dark-gray' : 'bg-green-900'} text-white`}>
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80"
            alt="Farm Field"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative z-10 container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Latest News & Updates
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto">
            Stay connected with MountOlive Farm's events, harvest updates, and community stories.
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className={`py-8 ${darkMode ? 'bg-dark-bg' : 'bg-white'} sticky top-16 z-10 shadow-md`}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Search Bar */}
            <div className={`relative w-full md:w-1/3 ${darkMode ? 'text-dark-text' : ''}`}>
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-dark-card border-dark-gray text-dark-text placeholder-gray-400' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-green-600`}
              />
            </div>
            
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
          </div>
        </div>
      </section>

      {/* Featured News */}
      {filteredArticles.some(article => article.isFeatured) && (
        <section className="py-12">
          <div className="container mx-auto px-6">
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-dark-text' : 'text-gray-900'}`}>Featured Story</h2>
            {filteredArticles.filter(article => article.isFeatured).map(article => (
              <div 
                key={article.id} 
                className={`rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${darkMode ? 'bg-dark-card' : 'bg-white'}`}
              >
                <div className="md:flex">
                  <div className="md:flex-shrink-0 md:w-1/2">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  </div>
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm">
                        <span className={`px-3 py-1 rounded-full ${darkMode ? 'bg-dark-green text-soft-white' : 'bg-green-100 text-green-800'}`}>
                          {article.category}
                        </span>
                        <span className={`mx-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>•</span>
                        <div className={`flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <CalendarIcon className="h-4 w-4 mr-1" /> 
                          {article.date}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className={`p-2 rounded-full ${darkMode ? 'hover:bg-dark-gray' : 'hover:bg-gray-100'}`}>
                          <BookmarkIcon size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                        </button>
                        <button className={`p-2 rounded-full ${darkMode ? 'hover:bg-dark-gray' : 'hover:bg-gray-100'}`}>
                          <Share2Icon size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                        </button>
                      </div>
                    </div>
                    <h3 className={`text-2xl font-semibold mb-3 ${darkMode ? 'text-dark-text' : 'text-gray-900'}`}>
                      {article.title}
                    </h3>
                    <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {article.readTime}
                      </span>
                      <button className={`px-5 py-2 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-btn-teal hover:bg-green-700' : 'bg-green-700 hover:bg-green-600'} text-white transition-colors`}>
                        Read More <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* News Grid */}
      <section className="py-12 container mx-auto px-6">
        <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-dark-text' : 'text-gray-900'}`}>
          {activeCategory === "All" ? "All Stories" : activeCategory + " Stories"}
          <span className="text-sm font-normal ml-2 text-gray-500">
            ({filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'})
          </span>
        </h2>
        
        {currentArticles.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentArticles.filter(article => !article.isFeatured).map((article) => (
                <div
                  key={article.id}
                  className={`rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${darkMode ? 'bg-dark-card' : 'bg-white'}`}
                >
                  <div className="relative">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-dark-green text-soft-white' : 'bg-green-100 text-green-800'}`}>
                        {article.category}
                      </span>
                    </div>
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
                    <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-dark-text' : 'text-gray-900'}`}>
                      {article.title}
                    </h3>
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <button className={`px-4 py-2 rounded-lg flex items-center gap-1 ${darkMode ? 'bg-btn-teal hover:bg-green-700' : 'bg-green-700 hover:bg-green-600'} text-white text-sm transition-colors`}>
                        Read More <ArrowRightIcon className="h-4 w-4" />
                      </button>
                      <div className="flex gap-2">
                        <button className={`p-2 rounded-full ${darkMode ? 'hover:bg-dark-gray' : 'hover:bg-gray-100'}`}>
                          <BookmarkIcon size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                        </button>
                        <button className={`p-2 rounded-full ${darkMode ? 'hover:bg-dark-gray' : 'hover:bg-gray-100'}`}>
                          <Share2Icon size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                        </button>
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
            <p>No articles found matching your criteria.</p>
            <button 
              onClick={() => { setActiveCategory("All"); setSearchQuery(""); }}
              className={`mt-4 px-4 py-2 rounded-lg ${darkMode ? 'bg-btn-teal hover:bg-green-700' : 'bg-green-700 hover:bg-green-600'} text-white`}
            >
              Clear Filters
            </button>
          </div>
        )}
      </section>

      {/* Newsletter Section */}
      <section className={`py-16 ${darkMode ? 'bg-dark-card' : 'bg-green-50'}`}>
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-900'}`}>Stay Updated</h2>
          <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Subscribe to get farm stories, seasonal updates, and news directly in your inbox.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className={`w-full md:w-64 px-4 py-3 rounded-lg border ${darkMode ? 'bg-dark-gray border-dark-gray text-dark-text placeholder-gray-400' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-green-600`}
            />
            <button className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-btn-teal hover:bg-green-700' : 'bg-green-700 hover:bg-green-600'} text-white font-medium`}>
              Subscribe
            </button>
          </div>
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