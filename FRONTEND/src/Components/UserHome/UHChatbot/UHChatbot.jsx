import React, { useState, useEffect, useRef } from 'react';
import { 
  XIcon, 
  BotIcon, 
  SendIcon, 
  MinusIcon,
  ShoppingCartIcon,
  PackageIcon,
  HelpCircleIcon,
  MapPinIcon,
  ClockIcon,
  TagIcon
} from 'lucide-react';

const ChatBot = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [conversation, setConversation] = useState([
    {
      id: 1,
      text: "Hello! 👋 I'm Olive, your farm assistant. I can help with products, orders, deliveries, and more! How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
      options: null // For storing numbered options
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [awaitingNumberResponse, setAwaitingNumberResponse] = useState(false);
  const [currentOptions, setCurrentOptions] = useState([]);
  
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  // Enhanced FAQ data with more categories and questions
  const userFaqData = {
    products: {
      title: "Products & Shopping",
      icon: "🛒",
      questions: [
        {
          question: "Show products",
          answer: "We have a wide range of farm-fresh products:\n\n• Vegetables: Tomatoes, carrots, lettuce, cucumbers, bell peppers, potatoes, onions\n• Fruits: Apples, bananas, oranges, strawberries, blueberries, avocados\n• Dairy: Milk, cheese, yogurt, butter, eggs\n• Organic items: All our products are certified organic!\n\nWould you like to know about a specific product?",
        },
        {
          question: "Today's offers",
          answer: "Today's special offers include:\n\n• Buy 1 get 1 free on organic strawberries\n• 20% off on all dairy products\n• Free delivery on orders over $50\n• Seasonal vegetable box at 15% discount\n\nVisit our 'Special Offers' section for more deals!",
        },
      ]
    },
    ordering: {
      title: "Ordering & Payment",
      icon: "📦",
      questions: [
        {
          question: "How do I place an order?",
          answer: "To place an order:\n1. Browse our products in the Shop section\n2. Add items to your cart\n3. Proceed to checkout\n4. Enter your shipping information\n5. Select payment method\n6. Review and confirm your order\n\nYou'll receive an email confirmation once your order is placed successfully.",
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept:\n• Credit/Debit Cards (Visa, MasterCard, American Express)\n• PayPal\n• Apple Pay\n• Google Pay\n• Cash on delivery (for orders under $100)\n\nAll payments are processed securely through encrypted channels.",
        },
      ]
    },
    shipping: {
      title: "Shipping & Delivery",
      icon: "🚚",
      questions: [
        {
          question: "What are your shipping options?",
          answer: "We offer several shipping options:\n• Standard Shipping (3-5 business days) - $5.99\n• Express Shipping (2-3 business days) - $12.99\n• Next Day Delivery - $24.99 (order before 2pm)\n• Free shipping on orders over $150\n\nDelivery times may vary during holidays or peak seasons.",
        },
        {
          question: "Do you ship internationally?",
          answer: "Currently, we only ship within the United States. We're working on expanding our delivery areas in the future. Please check back for updates!",
        },
      ]
    },
    support: {
      title: "Support & Help",
      icon: "🔧",
      questions: [
        {
          question: "How can I contact customer service?",
          answer: "You can reach our customer service team:\n• Phone: (123) 456-7890 (Mon-Fri, 9am-5pm EST)\n• Email: support@mountolivefarm.com\n• Through our Contact page\n• Live chat during business hours\n\nWe typically respond to emails within 24 hours.",
        },
        {
          question: "Talk to a human agent",
          answer: "I can connect you with a human agent during business hours (Mon-Fri, 9am-5pm EST). Would you like me to:\n\n1. Schedule a callback\n2. Provide our direct phone number\n3. Help you send a detailed email\n\nHow would you prefer to connect?",
        },
      ]
    },
    general: {
      title: "General Information",
      icon: "ℹ️",
      questions: [
        {
          question: "Store location & hours",
          answer: "Our farm store is located at:\n123 Farm Road, Countryside, CA 90210\n\nStore hours:\n• Monday-Friday: 9am-6pm\n• Saturday: 10am-4pm\n• Sunday: Closed\n\nWe also offer farm tours on weekends!",
        },
        {
          question: "Available discounts & loyalty program",
          answer: "We offer several ways to save:\n\n• First-time customer: 10% off your first order\n• Loyalty program: Earn 1 point per $1 spent, redeem 100 points for $10 off\n• Newsletter subscribers: Exclusive weekly deals\n• Senior discount: 5% off for customers 65+\n\nCreate an account to start earning rewards today!",
        },
      ]
    }
  };

  // Quick action buttons
  const quickActions = [
    { icon: <ShoppingCartIcon size={14} />, text: "Products", category: "products" },
    { icon: <PackageIcon size={14} />, text: "My Orders", category: "ordering" },
    { icon: <HelpCircleIcon size={14} />, text: "Support", category: "support" },
    { icon: <MapPinIcon size={14} />, text: "Location", category: "general" },
    { icon: <ClockIcon size={14} />, text: "Delivery", category: "shipping" },
    { icon: <TagIcon size={14} />, text: "Offers", category: "products" },
  ];

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Set initial position when chat opens - fixed to avoid navbar overlap
  useEffect(() => {
    if (chatOpen) {
      const navbarHeight = 80; // Approximate navbar height
      const button = document.querySelector('.fixed.bottom-6.right-6 button');
      if (button) {
        const buttonRect = button.getBoundingClientRect();
        const chatWidth = 380;
        const chatHeight = 500;
        
        // Position near the button with a small gap, but below navbar
        const initialX = window.innerWidth - chatWidth - 30;
        const initialY = Math.max(navbarHeight + 10, buttonRect.top - chatHeight - 10);
        
        setPosition({
          x: Math.max(10, initialX),
          y: Math.max(navbarHeight + 10, initialY),
        });
      }
    }
  }, [chatOpen]);

  // Chatbot function with enhanced responses
  async function sendMessage() {
    if (!inputMessage.trim() || loading) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    const userMessageObj = {
      id: Date.now(),
      text: userMessage,
      sender: "user",
      timestamp: new Date(),
      options: null
    };
    
    setConversation(prev => [...prev, userMessageObj]);
    setLoading(true);
    
    try {
      // Check if we're expecting a numbered response
      if (awaitingNumberResponse) {
        const numberMatch = userMessage.match(/^\d+$/);
        if (numberMatch && currentOptions.length > 0) {
          const selectedIndex = parseInt(numberMatch[0]) - 1;
          if (selectedIndex >= 0 && selectedIndex < currentOptions.length) {
            const selectedOption = currentOptions[selectedIndex];
            const response = await generateResponse(selectedOption, true);
            const botMessageObj = {
              id: Date.now() + 1,
              text: response.text,
              sender: "bot",
              timestamp: new Date(),
              options: response.options || null
            };
            setConversation(prev => [...prev, botMessageObj]);
            setAwaitingNumberResponse(false);
            setCurrentOptions([]);
            setLoading(false);
            return;
          }
        }
        // If not a valid number, reset and respond normally
        setAwaitingNumberResponse(false);
        setCurrentOptions([]);
      }
      
      const response = await generateResponse(userMessage, false);
      const botMessageObj = {
        id: Date.now() + 1,
        text: response.text,
        sender: "bot",
        timestamp: new Date(),
        options: response.options || null
      };
      setConversation(prev => [...prev, botMessageObj]);
      
      // If the response includes options, set the state to expect a numbered response
      if (response.options && response.options.length > 0) {
        setAwaitingNumberResponse(true);
        setCurrentOptions(response.options);
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessageObj = {
        id: Date.now() + 1,
        text: "⚠️ Sorry, I'm having trouble connecting right now. Please try again later or contact our support team at support@mountolivefarm.com.",
        sender: "bot",
        timestamp: new Date(),
        options: null
      };
      setConversation(prev => [...prev, errorMessageObj]);
    } finally {
      setLoading(false);
    }
  }

  // Enhanced response generation with numbered options
  const generateResponse = async (message, isOptionSelection = false) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerMessage = message.toLowerCase();
    
    // If this is a selection from numbered options
    if (isOptionSelection) {
      // Handle specific option selections
      if (lowerMessage.includes("how do i place an order")) {
        return { text: userFaqData.ordering.questions[0].answer };
      } else if (lowerMessage.includes("what payment methods do you accept")) {
        return { text: userFaqData.ordering.questions[1].answer };
      }
      // Add more specific handlers as needed
      return { text: "I've noted your selection. How else can I help you today?" };
    }
    
    // Greetings
    if (/(hi|hello|hey|good morning|good afternoon|good evening)/i.test(lowerMessage)) {
      const greetings = ["Hello!", "Hi there!", "Hey! How can I help?", "Greetings!"];
      return { text: `${greetings[Math.floor(Math.random() * greetings.length)]} I'm Olive, your farm assistant. How can I help you today?` };
    }
    
    // How are you
    if (/(how are you|how's it going|how do you do)/i.test(lowerMessage)) {
      return { text: "I'm doing great, thanks for asking! Ready to help you with all your farm-fresh needs. What can I assist you with today?" };
    }
    
    // Products
    if (/(show products|products|vegetables|fruits|organic|milk|tomatoes|bananas|price)/i.test(lowerMessage)) {
      if (/(tomato)/i.test(lowerMessage)) return { text: "Our organic tomatoes are $3.99/lb. They're freshly picked and perfect for salads, sauces, or just eating fresh! Would you like to add them to your cart?" };
      if (/(banana)/i.test(lowerMessage)) return { text: "Bananas are $0.69/lb. We have both regular and organic options available. How many would you like?" };
      if (/(milk)/i.test(lowerMessage)) return { text: "We have fresh organic milk from our dairy cows. It's $4.99 for a half gallon and $8.99 for a full gallon. Would you like to know more?" };
      
      return { text: userFaqData.products.questions[0].answer };
    }
    
    // Orders
    if (/(order|track|status|delivery|payment|cancel)/i.test(lowerMessage)) {
      if (/(track|status|where is)/i.test(lowerMessage)) return { text: "To check your order status, I'll need your order number. You can also visit the 'Order History' section in your account. Can you provide your order number?" };
      if (/(cancel)/i.test(lowerMessage)) return { text: "I can help you cancel an order. Please provide your order number and I'll check if it's still eligible for cancellation. Our policy allows cancellations within 2 hours of ordering." };
      if (/(payment|pay|card|cash)/i.test(lowerMessage)) return { text: userFaqData.ordering.questions[1].answer };
      if (/(delivery|ship)/i.test(lowerMessage)) return { text: userFaqData.shipping.questions[0].answer };
      
      return { text: "I can help with order-related questions. Are you looking to track an order, cancel an order, or something else?" };
    }
    
    // Support
    if (/(help|support|agent|human|refund|return)/i.test(lowerMessage)) {
      if (/(human|agent|representative)/i.test(lowerMessage)) return { text: userFaqData.support.questions[1].answer };
      if (/(refund|return)/i.test(lowerMessage)) return { text: "We have a 30-day return policy for most unopened products. Perishable items may have different return conditions. Please provide your order number and I'll help with your return request." };
      
      return { text: userFaqData.support.questions[0].answer };
    }
    
    // General info
    if (/(location|store|hours|open|discount|membership|loyalty|delivery area)/i.test(lowerMessage)) {
      if (/(location|store|address)/i.test(lowerMessage)) return { text: userFaqData.general.questions[0].answer };
      if (/(hours|open|close)/i.test(lowerMessage)) return { text: userFaqData.general.questions[0].answer };
      if (/(discount|membership|loyalty)/i.test(lowerMessage)) return { text: userFaqData.general.questions[1].answer };
      if (/(delivery area|do you deliver|zip code)/i.test(lowerMessage)) return { text: "We deliver within a 50-mile radius of our farm. Please provide your zip code and I'll check if we deliver to your area." };
      
      return { text: userFaqData.general.questions[0].answer };
    }
    
    // Category questions - return with numbered options
    if (/(ordering|payment|order|pay)/i.test(lowerMessage)) {
      const options = userFaqData.ordering.questions.map(q => q.question);
      return {
        text: "Here's information about ordering & payment:\n\n" + 
              options.map((q, i) => `${i+1}. ${q}`).join('\n') + 
              "\n\nPlease select a number for more details:",
        options: options
      };
    }
    
    if (/(products|shop|buy|purchase|item)/i.test(lowerMessage)) {
      const options = userFaqData.products.questions.map(q => q.question);
      return {
        text: "Here's information about products & shopping:\n\n" + 
              options.map((q, i) => `${i+1}. ${q}`).join('\n') + 
              "\n\nPlease select a number for more details:",
        options: options
      };
    }
    
    if (/(shipping|delivery|ship|deliver)/i.test(lowerMessage)) {
      const options = userFaqData.shipping.questions.map(q => q.question);
      return {
        text: "Here's information about shipping & delivery:\n\n" + 
              options.map((q, i) => `${i+1}. ${q}`).join('\n') + 
              "\n\nPlease select a number for more details:",
        options: options
      };
    }
    
    // Default response
    return { text: "I'm here to help with questions about our farm products, orders, shipping, or any other issues. Could you please provide more details about what you need help with?" };
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear conversation
  const clearConversation = () => {
    setConversation([{
      id: 1,
      text: "Hello! 👋 I'm Olive, your farm assistant. I can help with products, orders, deliveries, and more! How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
      options: null
    }]);
    setAwaitingNumberResponse(false);
    setCurrentOptions([]);
  };

  // Handle quick action click
  const handleQuickAction = (category) => {
    const categoryData = userFaqData[category];
    if (categoryData) {
      const options = categoryData.questions.map(q => q.question);
      const userMessageObj = {
        id: Date.now(),
        text: `Tell me about ${categoryData.title.toLowerCase()}`,
        sender: "user",
        timestamp: new Date(),
        options: null
      };
      
      const botMessageObj = {
        id: Date.now() + 1,
        text: `Here's information about ${categoryData.title.toLowerCase()}:\n\n` + 
              options.map((q, i) => `${i+1}. ${q}`).join('\n') + 
              "\n\nPlease select a number for more details:",
        sender: "bot",
        timestamp: new Date(),
        options: options
      };
      
      setConversation(prev => [...prev, userMessageObj, botMessageObj]);
      setAwaitingNumberResponse(true);
      setCurrentOptions(options);
    }
  };

  // Drag functionality
  const handleMouseDown = (e) => {
    if (e.target.closest('.chat-header')) {
      setIsDragging(true);
      const rect = chatRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && chatRef.current) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const maxX = window.innerWidth - chatRef.current.offsetWidth;
      const maxY = window.innerHeight - chatRef.current.offsetHeight;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Safe text splitting function
  const safeSplitText = (text) => {
    if (typeof text === 'string') {
      return text.split('\n');
    }
    return [String(text)]; // Fallback for non-string values
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
            chatOpen 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          } text-white`}
          aria-label="Chat support"
        >
          {chatOpen ? (
            <XIcon className="h-6 w-6" />
          ) : (
            <BotIcon className="h-6 w-6" />
          )}
        </button>
        
        {!chatOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">1</span>
          </div>
        )}
      </div>

      {/* Chat Window */}
      {chatOpen && (
        <div 
          ref={chatRef}
          className="fixed z-50 bg-white dark:bg-gray-800 shadow-2xl rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: '380px',
            height: isMinimized ? '60px' : '500px',
            transition: isDragging ? 'none' : 'all 0.3s ease',
            cursor: isDragging ? 'grabbing' : 'default'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Chat header */}
          <div className="chat-header flex justify-between items-center p-4 bg-green-600 text-white rounded-t-lg cursor-grab select-none">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <BotIcon size={18} />
              </div>
              <div>
                <span className="font-medium">Olive - Farm Assistant</span>
                <div className="text-xs opacity-90">Online • Usually replies instantly</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="p-1 rounded hover:bg-green-700 transition-colors"
                title={isMinimized ? "Expand chat" : "Minimize chat"}
              >
                <MinusIcon size={16} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  clearConversation();
                }}
                className="p-1 rounded hover:bg-green-700 transition-colors"
                title="Clear conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setChatOpen(false);
                }}
                className="p-1 rounded hover:bg-green-700 transition-colors"
                title="Close chat"
              >
                <XIcon size={16} />
              </button>
            </div>
          </div>
          
          {!isMinimized && (
            <>
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                {conversation.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 flex ${
                      message.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="flex items-start max-w-xs">
                      {message.sender === "bot" && (
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                          <BotIcon size={14} className="text-green-600 dark:text-green-400" />
                        </div>
                      )}
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          message.sender === "user"
                            ? "bg-green-500 text-white"
                            : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        {safeSplitText(message.text).map((line, i) => (
                          <div key={i}>
                            {line}
                            {i < safeSplitText(message.text).length - 1 && <br />}
                          </div>
                        ))}
                        {message.options && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              You can reply with a number:
                            </div>
                            {message.options.map((option, i) => (
                              <div key={i} className="text-sm">
                                {i+1}. {option}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className={`text-xs mt-1 ${
                          message.sender === "user" 
                            ? "text-green-100" 
                            : "text-gray-500 dark:text-gray-400"
                        }`}>
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start mb-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-2">
                        <BotIcon size={14} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Quick action buttons */}
              <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2 mb-3 justify-center">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.category)}
                      className="flex flex-col items-center justify-center w-16 h-16 bg-green-50 dark:bg-green-900 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
                      title={action.text}
                    >
                      <div className="text-green-600 dark:text-green-300 mb-1">
                        {action.icon}
                      </div>
                      <span className="text-xs text-green-700 dark:text-green-200 font-medium">{action.text}</span>
                    </button>
                  ))}
                </div>
                
                {/* Input area */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={awaitingNumberResponse ? "Type a number..." : "Type your message..."}
                    className="flex-1 px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !inputMessage.trim()}
                    className={`p-2 rounded-full transition-colors ${
                      loading || !inputMessage.trim()
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white`}
                  >
                    <SendIcon size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBot;