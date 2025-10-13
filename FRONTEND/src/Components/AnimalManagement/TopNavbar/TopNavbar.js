import React, { useState, useEffect, useRef } from "react";
import {
  MenuIcon,
  BellIcon,
  ChevronDownIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  LogOutIcon,
  XIcon,
  SendIcon,
  BotIcon,
  GripVerticalIcon,
  SearchIcon,
  ChevronRightIcon,
  QrCode
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext.js";
import { useUser } from "../contexts/UserContext.js";
import { useNotifications } from "../contexts/NotificationContext.js";
import { useNavigate } from "react-router-dom";
import QRScanner from "../QRScanner/QRScanner.jsx";

const TopNavbar = ({ onMenuClick, sidebarOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const { userData, isLoading } = useUser();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [conversation, setConversation] = useState([
    {
      id: 1,
      text: "Hello! 👋 I'm your farm assistant. How can I help you with animal management today?",
      sender: "bot",
      timestamp: new Date(),
      type: "greeting"
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // FAQ data structure
  const faqData = {
    health: {
      title: "Health Issues",
      icon: "🩺",
      questions: [
        {
          question: "What are common signs of illness in cows?",
          answer: "Common signs of illness in cows include: \n• Loss of appetite \n• Lethargy or depression \n• Abnormal temperature (normal: 101.5°F) \n• Coughing or nasal discharge \n• Diarrhea or abnormal manure \n• Reduced milk production \n• Lameness or difficulty moving \n• Isolation from the herd\n\nIf you notice these signs, monitor closely and contact your veterinarian if symptoms persist.",
          keywords: ["sick", "illness", "symptoms", "disease", "health"]
        },
        {
          question: "How do I treat diarrhea in calves?",
          answer: "For calf diarrhea: \n🚨 Isolate affected calves immediately \n💧 Provide electrolyte solution (offer separately from milk) \n🌡️ Monitor temperature and hydration status \n🍼 Continue milk feeding but in smaller, more frequent amounts \n🧼 Maintain strict hygiene to prevent spread \n📞 Contact vet if no improvement in 12 hours or if calf becomes depressed\n\nPrevention is key through colostrum management and clean environment.",
          keywords: ["diarrhea", "scours", "calf", "treatment", "hydration"]
        },
        {
          question: "What vaccinations do cattle need?",
          answer: "Basic cattle vaccination schedule: \n• 2-4 months: IBR, BVD, PI3, BRSV \n• 4-6 months: Brucellosis (heifers only) \n• Annual boosters: IBR, BVD, PI3, BRSV, Leptospirosis \n• Pre-breeding: Vibriosis, Trichomoniasis if needed \n• Consult your vet for farm-specific program based on local disease risks",
          keywords: ["vaccine", "vaccination", "shots", "immunization", "prevention"]
        }
      ]
    },
    feeding: {
      title: "Feeding & Nutrition",
      icon: "🌾",
      questions: [
        {
          question: "What should I feed my dairy cows?",
          answer: "Dairy cow nutrition requirements: \n• Dry matter intake: 3-4% of body weight \n• Forage should be 50-60% of diet \n• Protein: 16-18% for lactating cows \n• Energy: Balance with fiber to maintain rumen health \n• Minerals: Provide calcium, phosphorus, magnesium \n• Always provide fresh, clean water (10-20 gallons/day)\n\nWork with a nutritionist to balance rations based on production stage.",
          keywords: ["feed", "nutrition", "diet", "ration", "food", "water"]
        },
        {
          question: "How much should I feed my pigs?",
          answer: "Pig feeding guidelines by stage: \n• Starter pigs (up to 50 lbs): 18-20% protein, free choice \n• Grower pigs (50-125 lbs): 16-18% protein, 4-6 lbs/day \n• Finisher pigs (125-250 lbs): 14-16% protein, 6-8 lbs/day \n• Breeding stock: 4-6 lbs/day of 14-16% protein feed \n• Always provide access to clean, fresh water",
          keywords: ["pig feed", "feeding pigs", "nutrition", "swine diet"]
        }
      ]
    },
    breeding: {
      title: "Breeding & Reproduction",
      icon: "❤️",
      questions: [
        {
          question: "How do I know when my cow is in heat?",
          answer: "Signs of heat in cows: \n• Mounting other animals or standing to be mounted \n• Clear, stringy mucus discharge from vulva \n• Swollen, red vulva \n• Restlessness and increased activity \n• Bellowing more than usual \n• Reduced milk production \n• Chin resting and sniffing other cows\n\nHeat typically lasts 12-18 hours and occurs every 21 days.",
          keywords: ["heat", "breeding", "reproduction", "estrus", "cycle"]
        },
        {
          question: "What is the gestation period for pigs?",
          answer: "Pig gestation period: \n• Average: 114 days (3 months, 3 weeks, 3 days) \n• Range: 112-115 days \n\nPreparation for farrowing: \n• Move sow to farrowing crate 5-7 days before due date \n• Gradually increase feed before farrowing \n• Provide clean, dry bedding \n• Watch for signs of farrowing: restlessness, nest building, milk production\n\nHave farrowing supplies ready including heat lamps for piglets.",
          keywords: ["gestation", "pregnancy", "farrowing", "piglets", "sow"]
        }
      ]
    },
    housing: {
      title: "Housing & Facilities",
      icon: "🏠",
      questions: [
        {
          question: "What space do dairy cows need?",
          answer: "Dairy cattle housing requirements: \n• Stall space: 48-54 inches wide x 6-7 feet long \n• Alley width: 10-12 feet for feed alleys, 8-10 feet for crossovers \n• Free-stall dimensions: based on cow size (generally 7-8 feet long) \n• Headlock space: 24-30 inches per cow \n• Water space: 2-3 inches linear space per cow \n• Ventilation: 1000 cfm/cow in winter, more in summer\n\nProvide comfortable, clean resting areas with adequate bedding.",
          keywords: ["housing", "barn", "shelter", "space", "facilities"]
        },
        {
          question: "How should I set up a chicken coop?",
          answer: "Chicken coop requirements: \n• Space: 2-3 sq ft per bird inside, 8-10 sq ft outside run \n• Roosts: 8-12 inches per bird, 2+ feet off ground \n• Nesting boxes: 1 per 4-5 hens, 12x12x12 inch size \n• Ventilation: adequate without drafts \n• Protection: secure from predators \n• Lighting: 14-16 hours of light for layers \n• Feeders: 2-3 inches per bird \n• Waterers: always available, clean water\n\nKeep bedding dry and clean to prevent disease.",
          keywords: ["coop", "chicken housing", "poultry", "nesting", "roost"]
        }
      ]
    }
  };

  // Draggable state
  const [position, setPosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth - 400 : 0, 
    y: 100 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const chatRef = useRef(null);

  // Filter FAQs based on search query
  const filteredFaqs = () => {
    if (!searchQuery) return faqData;
    
    const result = {};
    Object.keys(faqData).forEach(category => {
      const filteredQuestions = faqData[category].questions.filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      if (filteredQuestions.length > 0) {
        result[category] = {
          ...faqData[category],
          questions: filteredQuestions
        };
      }
    });
    
    return result;
  };

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Handle drag start
  const handleDragStart = (e) => {
    if (!e.target.closest('.chat-header') && e.target.className !== 'drag-handle') return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  // Handle drag movement
  const handleDragMove = (e) => {
    if (!isDragging) return;

    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const chatWidth = chatRef.current?.offsetWidth || 400;
    const chatHeight = chatRef.current?.offsetHeight || 500;

    const margin = 20;
    newX = Math.max(margin, Math.min(newX, windowWidth - chatWidth - margin));
    newY = Math.max(margin, Math.min(newY, windowHeight - chatHeight - margin));

    setPosition({ x: newX, y: newY });
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  // Add and clean up event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, [isDragging, dragStart]);

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("profileImage");
    setUserMenuOpen(false);
    navigate("/login");
  };

  // Format role for display
  const formatRole = (role) => {
    const roleMap = {
      animal: "Animal Manager",
      plant: "Plant Manager",
      inv: "Inventory Manager",
      emp: "Employee Manager",
      health: "Health Manager",
      owner: "Farm Owner",
    };
    return roleMap[role] || role;
  };

  // Helper function to get proper image URL
  const getProfileImageUrl = (path) => {
    if (!path) return null;
    // The path from context will now include the cache-buster, which is fine.
    const baseUrl = "http://localhost:5000";
    return `${baseUrl}${path}`;
  };

  // Handle FAQ question click
  const handleFaqClick = (question, answer) => {
    const userMessageObj = {
      id: Date.now(),
      text: question,
      sender: "user",
      timestamp: new Date(),
      type: "faq_question"
    };
    
    const botMessageObj = {
      id: Date.now() + 1,
      text: answer,
      sender: "bot",
      timestamp: new Date(),
      type: "faq_answer"
    };
    
    setConversation(prev => [...prev, userMessageObj, botMessageObj]);
    setActiveCategory(null);
  };

  // Chatbot function
  async function sendMessage() {
    if (!inputMessage.trim() || loading) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    const userMessageObj = {
      id: Date.now(),
      text: userMessage,
      sender: "user",
      timestamp: new Date(),
      type: "user_message"
    };
    
    setConversation(prev => [...prev, userMessageObj]);
    setLoading(true);
    
    try {
      const response = await fetch("http://localhost:5000/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: userMessage,
          sessionId 
        }),
      });
      const data = await response.json();
      const botMessageObj = {
        id: Date.now() + 1,
        text: data.answer,
        sender: "bot",
        timestamp: new Date(),
        type: "bot_response"
      };
      setConversation(prev => [...prev, botMessageObj]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessageObj = {
        id: Date.now() + 1,
        text: "⚠️ Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
        type: "error"
      };
      setConversation(prev => [...prev, errorMessageObj]);
    } finally {
      setLoading(false);
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear conversation
  const clearConversation = async () => {
    try {
      await fetch("http://localhost:5000/api/chatbot/clear-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      setConversation([{
        id: 1,
        text: "Hello! 👋 I'm your farm assistant. How can I help you with animal management today?",
        sender: "bot",
        timestamp: new Date(),
        type: "greeting"
      }]);
      setActiveCategory(null);
      setSearchQuery("");
    } catch (error) {
      console.error("Error clearing context:", error);
    }
  };

  if (isLoading) {
    return (
      <header
        className={`
          fixed top-0 left-0 right-0 h-16 flex items-center z-30 transition-all duration-300
          ${
            darkMode
              ? "bg-gray-900 border-b border-gray-700 shadow-md"
              : "bg-white border-b border-gray-200 shadow-sm"
          }
          ${sidebarOpen ? "lg:pl-64 lg:ml-0" : "lg:pl-20"}
          pl-4 pr-4 md:pr-6
        `}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className={`p-2 rounded-md mr-2 outline-none ${
                darkMode
                  ? "hover:bg-gray-700 text-gray-200"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <MenuIcon size={24} />
            </button>
            <h2
              className={`text-lg md:text-xl font-semibold truncate ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Loading...
            </h2>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 h-16 flex items-center z-30 transition-all duration-300
        ${
          darkMode
            ? "bg-gray-900 border-b border-gray-700 shadow-md"
            : "bg-white border-b border-gray-200 shadow-sm"
        }
        ${sidebarOpen ? "lg:pl-64 lg:ml-0" : "lg:pl-20"}
        pl-4 pr-4 md:pr-6
      `}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left Side */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className={`p-2 rounded-md mr-2 outline-none ${
              darkMode
                ? "hover:bg-gray-700 text-gray-200"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <MenuIcon size={24} />
          </button>
          <h2
            className={`text-lg md:text-xl font-semibold truncate ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            {formatRole(userData.role)} Dashboard
          </h2>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-md outline-none ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
          >
            {darkMode ? (
              <SunIcon size={20} className="text-yellow-300" />
            ) : (
              <MoonIcon size={20} className="text-gray-600" />
            )}
          </button>

          {/* QR Scanner Button */}
          <button
            onClick={() => setQrScannerOpen(true)}
            className={`p-2 rounded-md outline-none transition-colors ${
              darkMode 
                ? "hover:bg-gray-700 text-gray-200 hover:text-green-400" 
                : "hover:bg-gray-100 text-gray-600 hover:text-green-600"
            }`}
            title="Scan QR Code"
          >
            <QrCode size={20} />
          </button>

          <div className="relative">
            <button
              className={`p-2 rounded-full relative outline-none ${
                darkMode
                  ? "hover:bg-gray-700 text-gray-200"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <BellIcon size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div
                className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 z-50 ${
                  darkMode
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <p
                    className={`text-sm font-medium ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </p>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className={`text-xs ${
                        darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"
                      }`}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-center">
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        No notifications
                      </p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification._id}
                        className={`px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-l-4 ${
                          notification.priority === 'critical' ? 'border-red-500' :
                          notification.priority === 'high' ? 'border-orange-500' :
                          notification.priority === 'medium' ? 'border-yellow-500' :
                          'border-blue-500'
                        } ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification._id);
                          }
                        }}
                      >
                        <p
                          className={`text-sm font-medium ${
                            darkMode ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {notification.timeAgo || notification.formattedTime || 'Unknown time'}
                        </p>
                      </div>
                    ))
                  )}
                  {notifications.length > 5 && (
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">
                      <button
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate('/AnimalManagement/alerts');
                        }}
                        className={`text-sm ${
                          darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"
                        }`}
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chatbot */}
          <div className="relative">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`p-2 rounded-md relative outline-none ${
                darkMode
                  ? "hover:bg-gray-700 text-gray-200"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <BotIcon size={20} />
            </button>

            {chatOpen && (
              <div
                ref={chatRef}
                className={`
                  fixed w-96 h-[500px] rounded-md shadow-lg z-50 flex flex-col
                  ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}
                  ${isDragging ? 'cursor-grabbing shadow-xl' : 'cursor-grab'}
                `}
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                }}
              >
                {/* Chat header with drag handle */}
                <div 
                  className={`
                    flex justify-between items-center p-3 border-b chat-header
                    ${darkMode ? "border-gray-700" : "border-gray-200"}
                  `}
                  onMouseDown={handleDragStart}
                >
                  <div className="flex items-center">
                    <div className="drag-handle mr-2 cursor-move">
                      <GripVerticalIcon 
                        size={16} 
                        className={darkMode ? "text-gray-400" : "text-gray-500"} 
                      />
                    </div>
                    <BotIcon 
                      size={18} 
                      className={`mr-2 ${darkMode ? "text-gray-200" : "text-gray-600"}`} 
                    />
                    <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                      Farm Assistant
                    </span>
                  </div>
                  <div className="flex items-center">
                    <button 
                      onClick={clearConversation}
                      className={`p-1 rounded mr-2 outline-none ${
                        darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-600"
                      }`}
                      title="Clear conversation"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setChatOpen(false)}
                      className={`p-1 rounded outline-none ${
                        darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-600"
                      }`}
                    >
                      <XIcon size={16} className={`${darkMode ? "text-gray-200" : "text-gray-600"}`} />
                    </button>
                  </div>
                </div>
                
                {/* FAQ Navigation or Chat messages */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {!activeCategory && conversation.length <= 1 ? (
                    // Show FAQ categories when no active conversation
                    <div className="flex-1 overflow-hidden flex flex-col">
                      <div className={`p-3 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                        <div className="relative">
                          <SearchIcon 
                            size={18} 
                            className={`absolute left-3 top-2.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`} 
                          />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search FAQs..."
                            className={`w-full pl-10 pr-3 py-2 rounded-md border ${
                              darkMode
                                ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                                : "bg-white text-gray-800 border-gray-300 placeholder-gray-500"
                            }`}
                          />
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-3">
                        <h3 className={`font-medium mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                          How can I help you today?
                        </h3>
                        
                        {Object.keys(filteredFaqs()).length === 0 ? (
                          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            No FAQs found matching your search.
                          </p>
                        ) : (
                          Object.entries(filteredFaqs()).map(([key, category]) => (
                            <div key={key} className="mb-4">
                              <button
                                onClick={() => setActiveCategory(key)}
                                className={`flex items-center justify-between w-full p-3 rounded-md text-left outline-none ${
                                  darkMode 
                                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200" 
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                                }`}
                              >
                                <span>
                                  <span className="mr-2">{category.icon}</span>
                                  {category.title}
                                </span>
                                <ChevronRightIcon size={16} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : activeCategory && conversation.length <= 1 ? (
                    // Show questions for selected category
                    <div className="flex-1 overflow-hidden flex flex-col">
                      <div className={`p-3 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                        <button
                          onClick={() => setActiveCategory(null)}
                          className={`flex items-center text-sm outline-none ${
                            darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          <ChevronRightIcon size={16} className="rotate-180 mr-1" />
                          Back to categories
                        </button>
                        <h3 className={`font-medium mt-2 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                          {faqData[activeCategory].icon} {faqData[activeCategory].title}
                        </h3>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-3">
                        {faqData[activeCategory].questions.map((faq, index) => (
                          <div key={index} className="mb-3">
                            <button
                              onClick={() => handleFaqClick(faq.question, faq.answer)}
                              className={`w-full text-left p-3 rounded-md outline-none ${
                                darkMode 
                                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200" 
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                              }`}
                            >
                              {faq.question}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Show conversation
                    <div className="flex-1 overflow-y-auto p-3">
                      {conversation.map((message) => (
                        <div
                          key={message.id}
                          className={`mb-3 flex ${
                            message.sender === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs rounded-lg px-3 py-2 ${
                              message.sender === "user"
                                ? darkMode
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-100 text-blue-800"
                                : darkMode
                                ? "bg-gray-700 text-white"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {message.text.split('\n').map((line, i) => (
                              <span key={i}>
                                {line}
                                <br />
                              </span>
                            ))}
                            <div
                              className={`text-xs mt-1 ${
                                message.sender === "user"
                                  ? darkMode
                                    ? "text-blue-200"
                                    : "text-blue-600"
                                  : darkMode
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {message.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="flex justify-start mb-3">
                          <div
                            className={`max-w-xs rounded-lg px-3 py-2 ${
                              darkMode
                                ? "bg-gray-700 text-white"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                {/* Input area */}
                <div className={`p-3 border-t ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}>
                  <div className="flex">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className={`flex-1 px-3 py-2 rounded-l-md border ${
                        darkMode
                          ? "bg-gray-700 text-white border-gray-600"
                          : "bg-white text-gray-800 border-gray-300"
                      }`}
                      disabled={loading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={loading || !inputMessage.trim()}
                      className={`px-3 py-2 rounded-r-md outline-none ${
                        loading || !inputMessage.trim()
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white`}
                    >
                      <SendIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              className={`flex items-center space-x-2 p-2 rounded-md outline-none ${
                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div
                className={`rounded-full overflow-hidden w-8 h-8 flex items-center justify-center ${
                  darkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                {userData.profileImage ? (
                 <img
                    src={getProfileImageUrl(userData.profileImage)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // This is a good fallback, keep it
                      e.target.style.display = "none";
                      // You can also show an icon inside the parent div here
                    }}
                  />
                ) : (
                  <UserIcon
                    size={18}
                    className={darkMode ? "text-gray-200" : "text-gray-600"}
                  />
                )}
              </div>
              <div className="hidden sm:block text-right">
                <span
                  className={`block text-sm font-medium truncate ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {userData.firstName && userData.lastName
                    ? `${userData.firstName} ${userData.lastName}`
                    : userData.name || "User"}
                </span>
                <span
                  className={`block text-xs truncate ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {formatRole(userData.role)}
                </span>
              </div>
              <ChevronDownIcon
                size={16}
                className={darkMode ? "text-white" : "text-gray-600"}
              />
            </button>
            {userMenuOpen && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 ${
                  darkMode
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                  <div
                    className={`rounded-full overflow-hidden w-10 h-10 flex items-center justify-center mr-3 ${
                      darkMode ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  >
                    {userData.profileImage ? (
                      <img
                        src={getProfileImageUrl(userData.profileImage)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <UserIcon
                        size={20}
                        className={darkMode ? "text-gray-200" : "text-gray-600"}
                      />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {userData.firstName && userData.lastName
                        ? `${userData.firstName} ${userData.lastName}`
                        : userData.name || "User"}
                    </p>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {formatRole(userData.role)}
                    </p>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className={`flex items-center w-full text-left px-4 py-2 text-sm outline-none ${
                      darkMode
                        ? "text-gray-200 hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <LogOutIcon size={16} className="mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* QR Scanner Modal */}
      <QRScanner 
        isOpen={qrScannerOpen} 
        onClose={() => setQrScannerOpen(false)} 
      />
    </header>
  );
};

export default TopNavbar;