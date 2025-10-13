import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Search,
  Phone,
  HelpCircle,
  XCircle
} from 'lucide-react';
import { DarkModeToggle } from '../UHDarkModeToggle/UHDarkModeToggle';
import { useAuth } from '../UHContext/UHAuthContext';
import { useCart } from '../UHContext/UHCartContext';
import { isManager, isNormalUser } from '../../../utils/userUtils';

const Navbar = ({ onCartClick }) => {
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { getTotalItems, toggleCart } = useCart();
  
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const userMenuRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);
  const closeUserMenu = () => setIsUserMenuOpen(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearch && searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
        setSearchQuery('');
      }
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearch, isUserMenuOpen]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/catalog', label: 'Shop' },
    { path: '/about', label: 'About Us' },
    { path: '/contact', label: 'Contact' },
    { path: '/news', label: 'News' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const getSuggestions = (query) => {
    if (!query) return [];
    const mockSuggestions = [
      'Organic Apples',
      'Fresh Spinach',
      'Free-Range Eggs',
      'Honey',
      'Olive Oil'
    ];
    return mockSuggestions.filter(item => 
      item.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-green-700 text-white text-sm py-2 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-2 md:mb-0">
            <div className="bg-green-800 px-2 py-1 rounded mr-2 text-xs font-semibold">NEW</div>
            <span>Free shipping on orders over $150</span>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center">
<<<<<<< Updated upstream
              <Phone size={14} className="mr-1" />
=======
              <PhoneIcon className="h-3.5 w-3.5 mr-1" />
>>>>>>> Stashed changes
              <span>Call us: +94 81 249 2134</span>
            </div>
            <span className="hidden sm:inline">|</span>
            <a href="/contact" className="flex items-center hover:text-green-200 transition-colors">
              <HelpCircle size={14} className="mr-1" />
              <span className="hidden sm:inline">Help & Support</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
       <nav
        className={`sticky top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white dark:bg-gray-900 shadow-md py-2'
            : 'bg-white dark:bg-gray-900 py-4 border-b border-gray-200 dark:border-gray-800'
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center z-10 hover:no-underline" 
            style={{ textDecoration: 'none' }}
          >
            <img 
              src="/favicon.ico" 
              alt="Mount Olive Farm House Logo" 
              className="h-12 w-12 mr-3" 
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-green-800 dark:text-green-400">
                Mount Olive Farm House
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Sustainable Farming Since 1995
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md transition-colors font-medium ${
                  isActive(item.path)
                    ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={{ textDecoration: 'none' }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Search */}
            <div className="relative" ref={searchRef}>
              <button
                onClick={toggleSearch}
                className={`p-2 transition-colors rounded-full ${
                  showSearch 
                    ? 'text-green-600 dark:text-green-400 bg-gray-100 dark:bg-gray-800' 
                    : 'text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                aria-label="Toggle search"
                aria-expanded={showSearch}
              >
                <Search size={20} />
              </button>
              
              {showSearch && (
                <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 w-80 z-50 border border-gray-200 dark:border-gray-700 transition-all duration-200 transform origin-top scale-y-100">
                  <form onSubmit={handleSearch} className="flex items-center relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="flex-1 px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white text-sm"
                      aria-label="Search products"
                      autoComplete="off"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-10 p-1 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                        aria-label="Clear search"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md ml-2 transition-colors"
                      aria-label="Submit search"
                    >
                      <Search size={16} />
                    </button>
                  </form>
                  {/* Search Suggestions */}
                  {searchQuery && getSuggestions(searchQuery).length > 0 && (
                    <ul className="mt-2 max-h-48 overflow-y-auto border-t border-gray-200 dark:border-gray-700 pt-2">
                      {getSuggestions(searchQuery).map((suggestion, index) => (
                        <li 
                          key={index}
                          className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
                          onClick={() => {
                            setSearchQuery(suggestion);
                            setShowSearch(false);
                          }}
                          role="option"
                          aria-selected={false}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* Shopping Cart */}
             <button
        onClick={toggleCart} // This will now work globally
        className="p-2 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors relative rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Shopping cart"
      >
        <ShoppingCart size={20} />
        {getTotalItems() > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {getTotalItems()}
          </span>
        )}
      </button>

            {/* User Account */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <User 
                      size={16} 
                      className="text-green-700 dark:text-green-400"
                      style={{ display: user?.profileImage ? "none" : "flex" }}
                    />
                  </div>
                  <span className="hidden lg:inline text-sm font-medium">
                    {user?.firstName || user?.name?.split(' ')[0] || "User"}
                  </span>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50">
                  <div className="px-4 py-2 flex items-center space-x-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <User 
                        size={20} 
                        className="text-green-700 dark:text-green-400"
                        style={{ display: user?.profileImage ? "none" : "flex" }}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name || "User"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  
                  {/* Show profile for normal users */}
                  {isNormalUser(user) && (
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={closeUserMenu}
                      style={{ textDecoration: 'none' }}
                    >
                      My Account
                    </Link>
                  )}
                  
                  
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={closeUserMenu}
                    style={{ textDecoration: 'none' }}
                  >
                    Order History
                  </Link>
                  <button
                    onClick={() => { logout(); closeUserMenu(); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut size={16} className="mr-2" /> Logout
                  </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{ textDecoration: 'none' }}
              >
                <User size={20} className="mr-1" /> 
                <span className="text-sm font-medium">Login</span>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={toggleMenu}
              aria-label="Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 shadow-lg absolute top-full left-0 right-0 border-t border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="flex items-center mb-2 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white text-sm"
                  aria-label="Search products"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-10 p-1 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                    aria-label="Clear search"
                  >
                    <XCircle size={16} />
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md ml-2 transition-colors"
                >
                  <Search size={16} />
                </button>
              </form>
              {searchQuery && getSuggestions(searchQuery).length > 0 && (
                <ul className="mb-2 max-h-48 overflow-y-auto border-t border-gray-200 dark:border-gray-700 pt-2">
                  {getSuggestions(searchQuery).map((suggestion, index) => (
                    <li 
                      key={index}
                      className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSearch(false);
                      }}
                      role="option"
                      aria-selected={false}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
              
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={`py-2 px-3 rounded-md transition-colors font-medium ${
                    isActive(item.path)
                      ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                      : 'text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  style={{ textDecoration: 'none' }}
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                {isAuthenticated ? (
                  <>
                    <div className="px-3 py-2 flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        {user?.profileImage ? (
                          <img
                            src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <User 
                          size={20} 
                          className="text-green-700 dark:text-green-400"
                          style={{ display: user?.profileImage ? "none" : "flex" }}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name || "User"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                    
                    {/* Show profile for normal users */}
                    {isNormalUser(user) && (
                      <Link
                        to="/profile"
                        onClick={closeMenu}
                        className="block py-2 px-3 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        style={{ textDecoration: 'none' }}
                      >
                        My Account
                      </Link>
                    )}
                    
                    <Link
                      to="/orders"
                      onClick={closeMenu}
                      className="block py-2 px-3 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      style={{ textDecoration: 'none' }}
                    >
                      Order History
                    </Link>
                    <button
                      onClick={() => { logout(); closeMenu(); }}
                      className="flex items-center w-full py-2 px-3 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <LogOut size={16} className="mr-2" /> Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="flex items-center py-2 px-3 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    style={{ textDecoration: 'none' }}
                  >
                    <User size={20} className="mr-2" /> Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;