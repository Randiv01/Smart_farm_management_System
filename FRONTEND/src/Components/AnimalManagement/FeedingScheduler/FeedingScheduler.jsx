import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Clock,
  History,
  Settings,
  Wifi,
  WifiOff,
  Save,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Zap,
  Activity,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter,
  MapPin,
  Package,
  Search,
  Scale,
  FileText,
  Download,
  BarChart3
} from "lucide-react";

export default function FeedingScheduler() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  // State management
  const [zones, setZones] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [feedingHistory, setFeedingHistory] = useState([]);
  const [formData, setFormData] = useState({
    zoneId: "",
    foodId: "",
    quantity: 0,
    feedingTimes: [""],
    notes: "",
  });
  const [selectedFeedRemaining, setSelectedFeedRemaining] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [esp32Ip, setEsp32Ip] = useState(localStorage.getItem("esp32Ip") || "");
  const [esp32Connected, setEsp32Connected] = useState(false);
  const [showEsp32Config, setShowEsp32Config] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [esp32Status, setEsp32Status] = useState("disconnected");
  const [immediateFeeding, setImmediateFeeding] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [systemChecking, setSystemChecking] = useState(false);
  const [feedNowLoading, setFeedNowLoading] = useState(false);
  const [scheduledFeedings, setScheduledFeedings] = useState([]);
  const [showScheduledFeedings, setShowScheduledFeedings] = useState(false);
  const [systemCheckResults, setSystemCheckResults] = useState(null);
  const [showSystemCheckResults, setShowSystemCheckResults] = useState(false);
  const [popup, setPopup] = useState({ show: false, type: "success", message: "" });
  const [automatedFeedingStatus, setAutomatedFeedingStatus] = useState(null);
  const [nextScheduledFeeding, setNextScheduledFeeding] = useState(null);
  const [countdownTime, setCountdownTime] = useState(null);
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyZoneFilter, setHistoryZoneFilter] = useState("all");
  const [historyFeedFilter, setHistoryFeedFilter] = useState("all");
  const [historySortBy, setHistorySortBy] = useState("feedingTime");
  const [historySortOrder, setHistorySortOrder] = useState("desc");


   useEffect(() => {
          document.title = "FeedingScheduler - Animal Manager";
      }, []);

  // Fetch zones, feeds, and history
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setApiError(false);
        
        // Fetch zones, feeds, and feeding history
        const [zonesRes, feedsRes, historyRes] = await Promise.all([
          fetch("http://localhost:5000/zones"),
          fetch("http://localhost:5000/api/animalfood"),
          fetch("http://localhost:5000/api/feeding/history")
        ]);

        if (!zonesRes.ok || !feedsRes.ok || !historyRes.ok) {
          throw new Error("Failed to fetch data from server");
        }

        const zonesData = await zonesRes.json();
        const feedsData = await feedsRes.json();
        const historyData = await historyRes.json();

        setZones(zonesData.zones || []);
        setFeeds(feedsData || []);
        setFeedingHistory(historyData || []);
        
        // Filter scheduled feedings (future feedings)
        const now = new Date();
        const scheduled = historyData.filter(h => 
          h.feedingTime && new Date(h.feedingTime) > now && !h.immediate
        );
        setScheduledFeedings(scheduled);
        
        // Fetch automated feeding status
        await fetchAutomatedFeedingStatus();
        
        // Fetch next scheduled feeding
        await fetchNextScheduledFeeding();
        
      } catch (err) {
        console.error("Fetch error:", err);
        setApiError(true);
        showPopup("error", "Failed to load data from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Check if we have a saved ESP32 IP and test connection
    if (esp32Ip) {
      testEsp32Connection();
    }
  }, []);

  // Set up countdown timer
  useEffect(() => {
    calculateCountdown();
    
    const countdownInterval = setInterval(() => {
      calculateCountdown();
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [nextScheduledFeeding]);

  // Set up real-time updates for automated feeding status
  useEffect(() => {
    const statusInterval = setInterval(() => {
      fetchAutomatedFeedingStatus();
      fetchNextScheduledFeeding();
      refreshFeedingData(); // Also refresh history data
    }, 5000); // Update every 5 seconds for immediate updates

    return () => clearInterval(statusInterval);
  }, []);

  // Update max quantity when feed changes
  useEffect(() => {
    const selectedFeed = feeds.find((f) => f._id === formData.foodId);
    if (selectedFeed) {
      const remaining = Number(selectedFeed.remaining || selectedFeed.quantity);
      setSelectedFeedRemaining(remaining);
      
      // Update quantity if it exceeds the new maximum
      if (formData.quantity > remaining) {
        setFormData(prev => ({ ...prev, quantity: remaining }));
      }
    } else {
      setSelectedFeedRemaining(0);
    }
  }, [formData.foodId, feeds]);

  // Derived state
  const selectedZone = zones.find((z) => z._id === formData.zoneId);
  const selectedFeed = feeds.find((f) => f._id === formData.foodId);
  const feedUnit = selectedFeed?.unit || "kg";

  // Test ESP32 connection
  const testEsp32Connection = async () => {
    if (!esp32Ip) return;
    
    setTestingConnection(true);
    try {
      console.log(`Attempting to connect to ESP32 at: http://${esp32Ip}/`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`http://${esp32Ip}/`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log(`ESP32 response status: ${response.status}`);
      
      if (response.ok) {
        setEsp32Connected(true);
        setEsp32Status("connected");
        showPopup("success", "ESP32 connected successfully!");
        console.log("ESP32 connection successful");
      } else {
        setEsp32Connected(false);
        setEsp32Status("error");
        showPopup("error", `ESP32 connection failed (Status: ${response.status})`);
        console.error(`ESP32 returned status: ${response.status}`);
      }
    } catch (error) {
      console.error("ESP32 connection error:", error);
      setEsp32Connected(false);
      setEsp32Status("error");
      
      if (error.name === 'AbortError') {
        showPopup("error", "ESP32 connection timeout - check IP address and network");
      } else if (error.message.includes('CORS')) {
        showPopup("error", "CORS error - ESP32 may not be configured for web requests");
      } else if (error.message.includes('Failed to fetch')) {
        showPopup("error", "Network error - check if ESP32 is on the same network");
      } else {
        showPopup("error", `Cannot connect to ESP32: ${error.message}`);
      }
    } finally {
      setTestingConnection(false);
    }
  };

  // Save ESP32 IP configuration
  const saveEsp32Config = () => {
    localStorage.setItem("esp32Ip", esp32Ip);
    testEsp32Connection();
    setShowEsp32Config(false);
  };

  // Event handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFeedingTimeChange = (index, value) => {
    const updatedTimes = [...formData.feedingTimes];
    updatedTimes[index] = value;
    setFormData(prev => ({ ...prev, feedingTimes: updatedTimes }));
  };

  const addFeedingTime = () => {
    setFormData(prev => ({ 
      ...prev, 
      feedingTimes: [...prev.feedingTimes, ""] 
    }));
  };

  const removeFeedingTime = (index) => {
    if (formData.feedingTimes.length <= 1) return;
    const updatedTimes = [...formData.feedingTimes];
    updatedTimes.splice(index, 1);
    setFormData(prev => ({ ...prev, feedingTimes: updatedTimes }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate form
    if (!formData.zoneId || !formData.foodId || !formData.quantity || 
        formData.feedingTimes.some(time => !time)) {
      showPopup("error", "Please fill all required fields");
      setLoading(false);
      return;
    }

    try {
      // Prepare data for submission
      const submissionData = {
        zoneId: formData.zoneId,
        foodId: formData.foodId,
        quantity: formData.quantity,
        feedingTimes: formData.feedingTimes,
        notes: formData.notes,
        immediate: immediateFeeding
      };

      // Use the correct endpoint for scheduling feeding
      const res = await fetch("http://localhost:5000/api/feeding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save schedule");
      }

      const responseData = await res.json();
      const zoneName = zones.find(z => z._id === formData.zoneId)?.name || "Unknown Zone";
      const feedName = getFoodName(feeds.find(f => f._id === formData.foodId));
      
      showPopup("success", `Feeding scheduled successfully! Zone: ${zoneName}, Feed: ${feedName}, Quantity: ${formData.quantity}g, Times: ${formData.feedingTimes.length} scheduled`);
      
      // Refresh all automated feeding data
      await refreshAutomatedFeedingData();
      
      // If ESP32 is connected and immediate feeding is requested, trigger feeding
      if (esp32Connected && immediateFeeding) {
        try {
          const feedRes = await fetch(`http://${esp32Ip}/feed`, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: formData.quantity.toString(),
          });
          
          if (feedRes.ok) {
            showPopup("success", `Immediate feeding completed successfully! Zone: ${zoneName}, Feed: ${feedName}, Quantity: ${formData.quantity}g dispensed`);
            
            // Update feeding history and reduce feed stock
            await updateFeedingHistoryAndStock();
          } else {
            showPopup("error", `Schedule saved but immediate feeding failed. Please check ESP32 connection and try "Feed Now" button`);
          }
        } catch (err) {
          console.error("ESP32 feeding error:", err);
          showPopup("error", "Schedule saved but couldn't communicate with ESP32");
        }
      }
      
      // Reset form
      setFormData({
        zoneId: "",
        foodId: "",
        quantity: 0,
        feedingTimes: [""],
        notes: "",
      });
      setImmediateFeeding(false);

    } catch (err) {
      console.error("Submit error:", err);
      showPopup("error", err.message || "Failed to save schedule");
    } finally {
      setLoading(false);
    }
  };

  // Update feeding history and reduce feed stock for immediate feeding
  const updateFeedingHistoryAndStock = async () => {
    try {
      // Create feeding history entry
      const historyData = {
        zoneId: formData.zoneId,
        foodId: formData.foodId,
        quantity: formData.quantity,
        feedingTime: new Date().toISOString(),
        notes: formData.notes + " (Immediate feeding)",
        immediate: true
      };

      await fetch("http://localhost:5000/api/feeding/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(historyData),
      });

      // Reduce feed stock
      await fetch(`http://localhost:5000/api/animalfood/${formData.foodId}/reduce`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantityUsed: formData.quantity, recordedBy: "FeedingScheduler" }),
      });

      // Refresh all automated feeding data
      await refreshAutomatedFeedingData();

    } catch (error) {
      console.error("Error updating feeding history and stock:", error);
    }
  };

  // Handle immediate feeding without scheduling
  const handleFeedNow = async () => {
    // Validate form
    if (!formData.zoneId || !formData.foodId || !formData.quantity) {
      showPopup("error", "Please select zone, food, and quantity before feeding");
      return;
    }

    if (!esp32Connected) {
      showPopup("error", "ESP32 device not connected. Please check connection.");
      return;
    }

    setFeedNowLoading(true);

    try {
      // Send feed command to ESP32
      const quantityString = formData.quantity.toString();
      console.log(`Sending feed request to ESP32: ${quantityString}g`);
      console.log(`ESP32 IP: ${esp32Ip}`);
      console.log(`Request URL: http://${esp32Ip}/feed`);
      
      const feedRes = await fetch(`http://${esp32Ip}/feed`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: quantityString,
      });
      
      console.log(`ESP32 response status: ${feedRes.status}`);
      
      if (feedRes.ok) {
        const responseText = await feedRes.text();
        console.log(`ESP32 response: ${responseText}`);
        
        const zoneName = zones.find(z => z._id === formData.zoneId)?.name || "Unknown Zone";
        const feedName = getFoodName(feeds.find(f => f._id === formData.foodId));
        
        showPopup("success", `Feeding completed successfully! Zone: ${zoneName}, Feed: ${feedName}, Quantity: ${formData.quantity}g dispensed, Status: ${responseText}`);
        
        // Update feeding history and reduce feed stock
        await updateFeedingHistoryAndStock();
        
        // Refresh feed stock data
        const feedsRes = await fetch("http://localhost:5000/api/animalfood");
        if (feedsRes.ok) {
          const feedsData = await feedsRes.json();
          setFeeds(feedsData || []);
        }
      } else {
        const errorText = await feedRes.text();
        console.error(`ESP32 error response: ${errorText}`);
        showPopup("error", `Feeding failed: ${errorText}`);
      }
    } catch (err) {
      console.error("Feed now error:", err);
      showPopup("error", "Failed to communicate with ESP32 device");
    } finally {
      setFeedNowLoading(false);
    }
  };

  // Handle comprehensive system check
  const handleSystemCheck = async () => {
    setSystemChecking(true);
    setSystemCheckResults(null);
    
    try {
      const results = {
        esp32Connection: false,
        servoMotor: false,
        buzzer: false,
        wifiConnection: false,
        webServer: false,
        overallStatus: "checking"
      };

      // Test ESP32 connection
      try {
        const response = await fetch(`http://${esp32Ip}/`, {
          method: "GET",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          results.esp32Connection = true;
          results.webServer = true;
        }
      } catch (error) {
        console.error("ESP32 connection test failed:", error);
      }

      // Test servo motor
      try {
        const servoResponse = await fetch(`http://${esp32Ip}/test`, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "text/plain" },
          body: "1", // Test with 1g
          signal: AbortSignal.timeout(10000)
        });
        
        if (servoResponse.ok) {
          results.servoMotor = true;
        }
      } catch (error) {
        console.error("Servo motor test failed:", error);
      }

      // Test buzzer (ESP32 should beep during servo test)
      results.buzzer = results.servoMotor; // Buzzer activates with servo

      // Test WiFi connection (if ESP32 responds, WiFi is working)
      results.wifiConnection = results.esp32Connection;

      // Determine overall status
      const allTestsPassed = Object.values(results).filter(v => typeof v === 'boolean').every(v => v);
      results.overallStatus = allTestsPassed ? "success" : "warning";

      setSystemCheckResults(results);
      setShowSystemCheckResults(true);

      // Show appropriate popup message
      if (allTestsPassed) {
        showPopup("success", "All systems operational! All sensors and devices are working correctly.");
      } else {
        showPopup("error", "Some systems need attention. Check the detailed results below.");
      }

    } catch (error) {
      console.error("System check failed:", error);
      showPopup("error", "System check failed. Please try again.");
    } finally {
      setSystemChecking(false);
    }
  };

  // Test basic connectivity
  const testBasicConnectivity = async () => {
    if (!esp32Ip) {
      showPopup("error", "Please enter ESP32 IP address first");
      return;
    }

    try {
      console.log(`Testing basic connectivity to ${esp32Ip}...`);
      
      // Try a simple fetch without CORS mode first
      const response = await fetch(`http://${esp32Ip}/`, {
        method: 'GET',
        mode: 'no-cors', // This bypasses CORS but we can't read the response
      });
      
      console.log("Basic connectivity test completed");
      showPopup("success", "Basic connectivity test passed - ESP32 is reachable");
      
    } catch (error) {
      console.error("Basic connectivity test failed:", error);
      showPopup("error", "Basic connectivity test failed - ESP32 may not be reachable");
    }
  };

  const fetchFeedingHistory = async () => {
    try {
      setLoading(true);
      const historyRes = await fetch("http://localhost:5000/api/feeding/history");
      
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setFeedingHistory(historyData || []);
      }
    } catch (err) {
      console.error("History fetch error:", err);
      showPopup("error", "Failed to load feeding history");
    } finally {
      setLoading(false);
    }
  };

  // Get food name safely - handles both name and foodName properties
  const getFoodName = (foodItem) => {
    if (!foodItem) return "Unknown";
    return foodItem.name || foodItem.foodName || "Unknown";
  };

  // Show popup message
  const showPopup = (type, message) => {
    setPopup({ show: true, type, message });
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setPopup({ show: false, type: "success", message: "" });
    }, 4000);
  };

  // Refresh feeding history and scheduled feedings
  const refreshFeedingData = async () => {
    try {
      const historyRes = await fetch("http://localhost:5000/api/feeding/history");
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setFeedingHistory(historyData || []);
        
        // Filter scheduled feedings (future feedings)
        const now = new Date();
        const scheduled = historyData.filter(h => 
          h.feedingTime && new Date(h.feedingTime) > now && !h.immediate
        );
        setScheduledFeedings(scheduled);
      }
    } catch (error) {
      console.error("Error refreshing feeding data:", error);
    }
  };

  // Refresh all automated feeding data
  const refreshAutomatedFeedingData = async () => {
    try {
      await Promise.all([
        refreshFeedingData(),
        fetchAutomatedFeedingStatus(),
        fetchNextScheduledFeeding()
      ]);
    } catch (error) {
      console.error("Error refreshing automated feeding data:", error);
    }
  };

  // Fetch automated feeding service status
  const fetchAutomatedFeedingStatus = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/automated-feeding/status");
      if (response.ok) {
        const data = await response.json();
        setAutomatedFeedingStatus(data.data);
      }
    } catch (error) {
      console.error("Error fetching automated feeding status:", error);
    }
  };

  // Fetch next scheduled feeding
  const fetchNextScheduledFeeding = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/automated-feeding/next-feeding");
      if (response.ok) {
        const data = await response.json();
        setNextScheduledFeeding(data.data);
      }
    } catch (error) {
      console.error("Error fetching next scheduled feeding:", error);
    }
  };

  // Calculate countdown time
  const calculateCountdown = () => {
    if (!nextScheduledFeeding || !nextScheduledFeeding.feedingTime) {
      setCountdownTime(null);
      return;
    }

    const now = new Date().getTime();
    const feedingTime = new Date(nextScheduledFeeding.feedingTime).getTime();
    const timeDiff = feedingTime - now;

    // If time has passed or is within 3 seconds, show as "due"
    if (timeDiff <= 3000) {
      setCountdownTime({ days: 0, hours: 0, minutes: 0, seconds: 0, isDue: true });
      return;
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    setCountdownTime({ days, hours, minutes, seconds, isDue: false });
  };

  // Filter and sort feeding history
  const getFilteredAndSortedHistory = () => {
    let filtered = feedingHistory.filter((h) => {
      // Search filter
      const searchMatch = historySearchTerm === "" || 
        (h.zoneId?.name || h.animalId?.name || "").toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        getFoodName(h.foodId).toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        (h.notes || "").toLowerCase().includes(historySearchTerm.toLowerCase());

      // Status filter
      const statusMatch = historyStatusFilter === "all" || h.status === historyStatusFilter;

      // Zone filter
      const zoneMatch = historyZoneFilter === "all" || h.zoneId?._id === historyZoneFilter;

      // Feed filter
      const feedMatch = historyFeedFilter === "all" || h.foodId?._id === historyFeedFilter;

      return searchMatch && statusMatch && zoneMatch && feedMatch;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (historySortBy) {
        case "feedingTime":
          aValue = new Date(a.feedingTime).getTime();
          bValue = new Date(b.feedingTime).getTime();
          break;
        case "zone":
          aValue = (a.zoneId?.name || a.animalId?.name || "").toLowerCase();
          bValue = (b.zoneId?.name || b.animalId?.name || "").toLowerCase();
          break;
        case "feed":
          aValue = getFoodName(a.foodId).toLowerCase();
          bValue = getFoodName(b.foodId).toLowerCase();
          break;
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case "status":
          aValue = a.status || "scheduled";
          bValue = b.status || "scheduled";
          break;
        default:
          aValue = new Date(a.feedingTime).getTime();
          bValue = new Date(b.feedingTime).getTime();
      }

      if (historySortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  // Handle sort
  const handleSort = (column) => {
    if (historySortBy === column) {
      setHistorySortOrder(historySortOrder === "asc" ? "desc" : "asc");
    } else {
      setHistorySortBy(column);
      setHistorySortOrder("asc");
    }
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${darkMode ? "bg-gray-900 text-white" : "light-beige"}`}>
      
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
          <Calendar className="text-blue-500" size={24} />
          Feeding Scheduler
        </h1>
        <p className={`mt-2 text-xs sm:text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Schedule and manage animal feeding times with automated feeding system
        </p>
      </div>

      {/* ESP32 Connection Panel */}
      <div className={`p-4 sm:p-5 rounded-xl shadow-sm mb-4 sm:mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              esp32Connected 
                ? (darkMode ? "bg-green-900/30" : "bg-green-100") 
                : (darkMode ? "bg-red-900/30" : "bg-red-100")
            }`}>
              {esp32Connected ? <Wifi className="text-green-500" size={20} /> : <WifiOff className="text-red-500" size={20} />}
            </div>
            <div>
              <h3 className="font-semibold">Feeding Device</h3>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {esp32Connected ? "Connected to ESP32 device" : "No device connected"}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <button
              onClick={handleSystemCheck}
              disabled={systemChecking || !esp32Ip}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
                systemChecking || !esp32Ip
                  ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-cyan-500/25"
              } text-white disabled:opacity-50 disabled:transform-none disabled:hover:scale-100`}
            >
              {systemChecking ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              <span className="text-xs sm:text-sm">{systemChecking ? "Checking..." : "System Check"}</span>
            </button>
            
            <button
              onClick={testEsp32Connection}
              disabled={testingConnection || !esp32Ip}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
                testingConnection || !esp32Ip
                  ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-500/25"
              } text-white disabled:opacity-50 disabled:transform-none disabled:hover:scale-100`}
            >
              {testingConnection ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Wifi size={16} />
              )}
              <span className="text-xs sm:text-sm">{testingConnection ? "Testing..." : "Test WiFi"}</span>
            </button>
            
            <button
              onClick={testBasicConnectivity}
              disabled={!esp32Ip}
              className={`px-4 sm:px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
                !esp32Ip
                  ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-yellow-500/25"
              } text-white disabled:opacity-50 disabled:transform-none disabled:hover:scale-100`}
            >
              <Activity size={16} />
              <span className="text-xs sm:text-sm">Ping Test</span>
            </button>
            
            <button
              onClick={() => setShowEsp32Config(true)}
              className={`px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
                darkMode ? "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800" : "bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400"
              } text-gray-800 dark:text-white`}
            >
              <Settings size={16} />
              <span className="text-xs sm:text-sm">Config</span>
            </button>
          </div>
        </div>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className={`p-4 mb-6 rounded-xl ${darkMode ? "bg-yellow-900/30 border-yellow-700" : "bg-yellow-50 border-yellow-200"} border-l-4 flex items-center gap-3`}>
          <AlertCircle className="text-yellow-500" size={24} />
          <div>
            <p className="font-medium">Connection Issue</p>
            <p className="text-sm">Could not connect to server. Please check your backend.</p>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Zones Card */}
        <div className={`p-4 sm:p-5 rounded-xl shadow-sm transition-all hover:shadow-md ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`p-2 sm:p-3 rounded-full ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}>
              <span className="text-lg sm:text-2xl">🏠</span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Zones</h3>
              <p className="text-xl sm:text-2xl font-bold">{zones.length}</p>
            </div>
          </div>
        </div>

        {/* Feed Stock Card */}
        <div className={`p-4 sm:p-5 rounded-xl shadow-sm transition-all hover:shadow-md ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`p-2 sm:p-3 rounded-full ${darkMode ? "bg-amber-900/30" : "bg-amber-100"}`}>
              <span className="text-lg sm:text-2xl">🌾</span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Feed Types</h3>
              <p className="text-xl sm:text-2xl font-bold">{feeds.length}</p>
            </div>
          </div>
        </div>
        
        {/* ESP32 Status Card */}
        <div className={`p-4 sm:p-5 rounded-xl shadow-sm transition-all hover:shadow-md ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`p-2 sm:p-3 rounded-full ${
              esp32Connected 
                ? (darkMode ? "bg-blue-900/30" : "bg-blue-100") 
                : (darkMode ? "bg-red-900/30" : "bg-red-100")
            }`}>
              {esp32Connected ? <Wifi className="text-blue-500" size={18} /> : <WifiOff className="text-red-500" size={18} />}
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Device Status</h3>
              <p className="text-sm sm:text-lg font-bold">
                {esp32Connected ? "Connected" : "Disconnected"}
              </p>
            </div>
          </div>
        </div>
        
            </div>

      {/* Automated Feeding Status Section */}
      <div className={`p-4 sm:p-6 rounded-xl shadow-sm mb-4 sm:mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="text-blue-500" size={20} />
            Automated Feeding System
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={async () => {
                try {
                  await fetchAutomatedFeedingStatus();
                  await fetchNextScheduledFeeding();
                  showPopup("success", "Automated feeding status refreshed!");
                } catch (error) {
                  showPopup("error", "Failed to refresh status");
                }
              }}
              className={`p-2 rounded-lg transition ${
                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
              title="Refresh Status"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch("http://localhost:5000/api/automated-feeding/check", {
                    method: "POST"
                  });
                  if (response.ok) {
                    showPopup("success", "Manual feeding check completed successfully!");
                    await fetchAutomatedFeedingStatus();
                    await fetchNextScheduledFeeding();
                  } else {
                    showPopup("error", "Failed to trigger manual feeding check");
                  }
                } catch (error) {
                  showPopup("error", "Error triggering manual feeding check");
                }
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                darkMode 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              title="Trigger Manual Check"
            >
              Check Now
            </button>
          </div>
        </div>
        
        {automatedFeedingStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border ${
              automatedFeedingStatus.isRunning 
                ? (darkMode ? "bg-green-900/20 border-green-500/30" : "bg-green-50 border-green-200")
                : (darkMode ? "bg-red-900/20 border-red-500/30" : "bg-red-50 border-red-200")
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {automatedFeedingStatus.isRunning ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <X className="text-red-500" size={20} />
                )}
                <span className="font-medium">Service Status</span>
            </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {automatedFeedingStatus.isRunning ? "Running" : "Stopped"}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-blue-500" size={20} />
                <span className="font-medium">Check Interval</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Every {automatedFeedingStatus.checkInterval / 1000} seconds
              </p>
            </div>
            
            <div className={`p-4 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-purple-500" size={20} />
                <span className="font-medium">Next Check</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {automatedFeedingStatus.nextCheck 
                  ? new Date(automatedFeedingStatus.nextCheck).toLocaleTimeString()
                  : "N/A"
                }
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${
              nextScheduledFeeding 
                ? (darkMode ? "bg-orange-900/20 border-orange-500/30" : "bg-orange-50 border-orange-200")
                : (darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-orange-500" size={20} />
                <span className="font-medium">Next Feeding</span>
              </div>
              {nextScheduledFeeding ? (
            <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {nextScheduledFeeding.zoneId?.name || "Unknown Zone"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {getFoodName(nextScheduledFeeding.foodId)} - {nextScheduledFeeding.quantity}g
                  </p>
                  {countdownTime ? (
                    <div className={`text-xs font-mono ${
                      countdownTime.isDue 
                        ? "text-red-600 dark:text-red-400 font-bold" 
                        : "text-orange-600 dark:text-orange-400"
                    }`}>
                      {countdownTime.isDue ? (
                        "DUE NOW!"
                      ) : (
                        <>
                          {countdownTime.days > 0 && `${countdownTime.days}d `}
                          {countdownTime.hours > 0 && `${countdownTime.hours}h `}
                          {countdownTime.minutes > 0 && `${countdownTime.minutes}m `}
                          {countdownTime.seconds}s
                        </>
                      )}
            </div>
                  ) : (
                    <p className="text-xs text-gray-500">No scheduled feedings</p>
                  )}
          </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">No scheduled feedings</p>
              )}
        </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Loading automated feeding status...
          </div>
        )}
      </div>

      {/* Scheduled Feedings Section */}
      <div className={`p-5 rounded-xl shadow-sm mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="text-green-500" size={20} />
            Scheduled Feedings
          </h3>
          <button
            onClick={() => setShowScheduledFeedings(!showScheduledFeedings)}
            className={`p-2 rounded-lg transition ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
          >
            {showScheduledFeedings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        
        {showScheduledFeedings && (
          <div className="space-y-3">
            {scheduledFeedings.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No scheduled feedings found
              </div>
            ) : (
              scheduledFeedings.map((feeding) => (
                <div key={feeding._id} className={`p-4 rounded-lg border ${
                  feeding.status === "completed" 
                    ? (darkMode ? "bg-green-900/20 border-green-500/30" : "bg-green-50 border-green-200")
                    : feeding.status === "failed"
                    ? (darkMode ? "bg-red-900/20 border-red-500/30" : "bg-red-50 border-red-200")
                    : (darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {feeding.zoneId?.name || "Unknown Zone"}
                        {feeding.status === "completed" && (
                          <CheckCircle className="text-green-500" size={16} />
                        )}
                        {feeding.status === "failed" && (
                          <X className="text-red-500" size={16} />
                        )}
                        {feeding.status === "scheduled" && (
                          <Clock className="text-blue-500" size={16} />
                        )}
                        {feeding.status === "retrying" && (
                          <RefreshCw className="text-yellow-500 animate-spin" size={16} />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getFoodName(feeding.foodId)} - {feeding.quantity}g
                      </div>
                      <div className="text-sm text-gray-500">
                        {feeding.notes || "No notes"}
                      </div>
                      {feeding.status === "failed" && feeding.failureReason && (
                        <div className="text-sm text-red-500 mt-1">
                          <div className="font-medium">Error: {feeding.failureReason}</div>
                          {feeding.errorDetails && (
                            <div className="text-xs text-red-400 mt-1">
                              Details: {feeding.errorDetails}
                            </div>
                          )}
                          {feeding.attemptCount > 1 && (
                            <div className="text-xs text-red-400 mt-1">
                              Attempts: {feeding.attemptCount}/{feeding.maxRetries || 3}
                            </div>
                          )}
                        </div>
                      )}
                      {feeding.status === "completed" && feeding.executedAt && (
                        <div className="text-sm text-green-500 mt-1">
                          <div>Executed: {new Date(feeding.executedAt).toLocaleString()}</div>
                          {feeding.stockReduced && (
                            <div className="text-xs text-green-400 mt-1">
                              ✓ Stock reduced successfully
                            </div>
                          )}
                          {feeding.esp32Response && (
                            <div className="text-xs text-green-400 mt-1">
                              Device: {feeding.esp32Response}
                            </div>
                          )}
                        </div>
                      )}
                      {feeding.status === "retrying" && (
                        <div className="text-sm text-yellow-500 mt-1">
                          <div>Retrying... (Attempt {feeding.attemptCount || 1})</div>
                          {feeding.lastAttemptAt && (
                            <div className="text-xs text-yellow-400 mt-1">
                              Last attempt: {new Date(feeding.lastAttemptAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}
                      {feeding.deviceStatus && (
                        <div className="text-xs text-gray-500 mt-1">
                          Device: {feeding.deviceStatus} | Network: {feeding.networkStatus || "Unknown"}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-blue-500">
                        {new Date(feeding.feedingTime).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(feeding.feedingTime).toLocaleTimeString()}
                      </div>
                      <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                        feeding.status === "completed" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : feeding.status === "failed"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : feeding.status === "retrying"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }`}>
                        {feeding.status || "scheduled"}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* System Check Results Section */}
      {showSystemCheckResults && systemCheckResults && (
        <div className={`p-5 rounded-xl shadow-sm mb-6 ${
          systemCheckResults.overallStatus === "success" 
            ? (darkMode ? "bg-green-900/20 border border-green-500/30" : "bg-green-50 border border-green-200")
            : (darkMode ? "bg-yellow-900/20 border border-yellow-500/30" : "bg-yellow-50 border border-yellow-200")
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {systemCheckResults.overallStatus === "success" ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : (
                <AlertCircle className="text-yellow-500" size={20} />
              )}
              System Check Results
            </h3>
            <button
              onClick={() => setShowSystemCheckResults(false)}
              className={`p-2 rounded-lg transition ${
                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg ${
              systemCheckResults.esp32Connection 
                ? (darkMode ? "bg-green-900/30" : "bg-green-100") 
                : (darkMode ? "bg-red-900/30" : "bg-red-100")
            }`}>
              <div className="flex items-center gap-2">
                {systemCheckResults.esp32Connection ? (
                  <CheckCircle className="text-green-500" size={16} />
                ) : (
                  <X className="text-red-500" size={16} />
                )}
                <span className="font-medium">ESP32 Connection</span>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${
              systemCheckResults.servoMotor 
                ? (darkMode ? "bg-green-900/30" : "bg-green-100") 
                : (darkMode ? "bg-red-900/30" : "bg-red-100")
            }`}>
              <div className="flex items-center gap-2">
                {systemCheckResults.servoMotor ? (
                  <CheckCircle className="text-green-500" size={16} />
                ) : (
                  <X className="text-red-500" size={16} />
                )}
                <span className="font-medium">Servo Motor</span>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${
              systemCheckResults.buzzer 
                ? (darkMode ? "bg-green-900/30" : "bg-green-100") 
                : (darkMode ? "bg-red-900/30" : "bg-red-100")
            }`}>
              <div className="flex items-center gap-2">
                {systemCheckResults.buzzer ? (
                  <CheckCircle className="text-green-500" size={16} />
                ) : (
                  <X className="text-red-500" size={16} />
                )}
                <span className="font-medium">Buzzer</span>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${
              systemCheckResults.wifiConnection 
                ? (darkMode ? "bg-green-900/30" : "bg-green-100") 
                : (darkMode ? "bg-red-900/30" : "bg-red-100")
            }`}>
              <div className="flex items-center gap-2">
                {systemCheckResults.wifiConnection ? (
                  <CheckCircle className="text-green-500" size={16} />
                ) : (
                  <X className="text-red-500" size={16} />
                )}
                <span className="font-medium">WiFi Connection</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className={`p-4 sm:p-6 rounded-xl shadow-sm mb-4 sm:mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="text-blue-500" size={20} />
          Schedule Feeding
        </h3>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Zone Selection */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold flex gap-1 items-center">
              Zone <span className="text-red-500">*</span>
            </label>
            <select
              name="zoneId"
              value={formData.zoneId}
              onChange={handleChange}
              className={`p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
              }`}
              required
              disabled={loading}
            >
              <option value="">-- Select Zone --</option>
              {loading ? (
                <option value="" disabled>Loading zones...</option>
              ) : zones.length === 0 ? (
                <option value="" disabled>No zones found</option>
              ) : (
                zones.map((zone) => (
                  <option key={zone._id} value={zone._id}>
                    {zone.name} ({zone.type}) - {zone.currentOccupancy}/{zone.capacity} animals
                  </option>
                ))
              )}
            </select>
            {selectedZone && (
              <div className={`text-sm ${darkMode ? "text-blue-300" : "text-blue-600"}`}>
                <p>Zone Type: {selectedZone.type}</p>
                <p>Capacity: {selectedZone.currentOccupancy}/{selectedZone.capacity} animals</p>
                {selectedZone.assignedAnimalTypes && selectedZone.assignedAnimalTypes.length > 0 && (
                  <p>Animal Types: {selectedZone.assignedAnimalTypes.join(", ")}</p>
                )}
              </div>
            )}
          </div>

          {/* Food Selection */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold flex gap-1 items-center">
              Food Type <span className="text-red-500">*</span>
            </label>
            <select
              name="foodId"
              value={formData.foodId}
              onChange={handleChange}
              className={`p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
              }`}
              required
              disabled={loading}
            >
              <option value="">-- Select Feed --</option>
              {loading ? (
                <option value="" disabled>Loading feeds...</option>
              ) : feeds.length === 0 ? (
                <option value="" disabled>No feeds found</option>
              ) : (
                feeds.map((f) => (
                  <option key={f._id} value={f._id} disabled={f.remaining <= 0}>
                    {getFoodName(f)} ({f.remaining} {f.unit || feedUnit} remaining)
                    {f.remaining <= 0 && " - OUT OF STOCK"}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Quantity Input with Slider */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-semibold flex gap-1 items-center justify-between">
              <div className="flex items-center gap-1">
                Quantity ({feedUnit}) <span className="text-red-500">*</span>
              </div>
              <span className="text-lg font-bold">{formData.quantity} {feedUnit}</span>
            </label>
            
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="0"
                max={selectedFeedRemaining}
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={loading || selectedFeedRemaining <= 0}
              />
              
              <div className="w-20">
                <input
                  type="number"
                  min="0"
                  max={selectedFeedRemaining}
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    quantity: Math.min(selectedFeedRemaining, Math.max(0, parseFloat(e.target.value) || 0))
                  }))}
                  className={`w-full p-2 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                  }`}
                  disabled={loading || selectedFeedRemaining <= 0}
                />
              </div>
            </div>
            
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>0 {feedUnit}</span>
              <span>Max: {selectedFeedRemaining} {feedUnit}</span>
            </div>
          </div>

          {/* Feeding Times */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-semibold flex gap-1 items-center">
              Feeding Times <span className="text-red-500">*</span>
            </label>
            
            <div className="space-y-3">
              {formData.feedingTimes.map((time, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="datetime-local"
                    value={time}
                    onChange={(e) => handleFeedingTimeChange(index, e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className={`flex-1 p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                    required
                    disabled={loading}
                  />
                  
                  {formData.feedingTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeedingTime(index)}
                      className={`p-3 rounded-lg ${
                        darkMode ? "bg-red-800 hover:bg-red-700" : "bg-red-500 hover:bg-red-400"
                      } text-white`}
                      disabled={loading}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={addFeedingTime}
              className={`self-start px-4 py-2 rounded-lg flex items-center gap-2 ${
                darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
              }`}
              disabled={loading}
            >
              <Plus size={16} />
              Add Another Time
            </button>
          </div>

          {/* Immediate Feeding Toggle */}
          {esp32Connected && (
            <div className="flex items-center gap-3 md:col-span-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={immediateFeeding}
                  onChange={() => setImmediateFeeding(!immediateFeeding)}
                  className="sr-only peer"
                  disabled={loading}
                />
                <div className={`w-11 h-6 rounded-full peer ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-200'
                } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                  immediateFeeding ? (darkMode ? 'bg-blue-600' : 'bg-blue-500') : ''
                }`}></div>
              </label>
              <span className="font-medium">Feed immediately after saving</span>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-semibold flex gap-1 items-center">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className={`p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
              }`}
              placeholder="Any special instructions..."
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 lg:col-span-2">
            <button
              type="submit"
              disabled={loading || !esp32Connected && immediateFeeding}
              className={`px-8 py-4 rounded-xl font-bold flex-1 flex items-center justify-center gap-3 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
                loading 
                  ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed" 
                  : (esp32Connected || !immediateFeeding 
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25" 
                    : "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed")
              } text-white disabled:opacity-50 disabled:transform-none disabled:hover:scale-100`}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span className="text-sm">Processing...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span className="text-sm">{immediateFeeding ? "Save & Feed Now" : "Save Schedule"}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleFeedNow}
              disabled={feedNowLoading || !esp32Connected || !formData.zoneId || !formData.foodId || !formData.quantity}
              className={`px-8 py-4 rounded-xl font-bold flex-1 flex items-center justify-center gap-3 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
                feedNowLoading || !esp32Connected || !formData.zoneId || !formData.foodId || !formData.quantity
                  ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25"
              } text-white disabled:opacity-50 disabled:transform-none disabled:hover:scale-100`}
            >
              {feedNowLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span className="text-sm">Feeding...</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span className="text-sm">Feed Now</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowHistory(true);
                fetchFeedingHistory();
              }}
              disabled={loading}
              className={`px-8 py-4 rounded-xl font-bold flex-1 flex items-center justify-center gap-3 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
                loading 
                  ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-500/25"
              } text-white disabled:opacity-50 disabled:transform-none disabled:hover:scale-100`}
            >
              <History size={18} />
              <span className="text-sm">View History</span>
            </button>
          </div>
        </form>
      </div>

      {/* ESP32 Configuration Modal */}
      {showEsp32Config && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-lg p-6 ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Settings className="text-blue-500" size={24} />
                ESP32 Configuration
              </h3>
              <button 
                onClick={() => setShowEsp32Config(false)} 
                className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="font-medium">ESP32 IP Address</label>
                <input
                  type="text"
                  value={esp32Ip}
                  onChange={(e) => setEsp32Ip(e.target.value)}
                  placeholder="192.168.1.100"
                  className={`p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                  }`}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter the IP address of your ESP32 device
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <button
                  onClick={testEsp32Connection}
                  disabled={testingConnection || !esp32Ip}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    darkMode 
                      ? (esp32Connected ? "bg-green-700 hover:bg-green-600" : "bg-blue-700 hover:bg-blue-600")
                      : (esp32Connected ? "bg-green-600 hover:bg-green-500" : "bg-blue-600 hover:bg-blue-500")
                  } text-white disabled:opacity-50`}
                >
                  {testingConnection ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Wifi size={16} />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={saveEsp32Config}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                >
                  Save
                </button>
              </div>
              
              {esp32Status === "connected" && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}>
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="text-green-600 dark:text-green-400">Successfully connected to ESP32 device</span>
                </div>
              )}
              
              {esp32Status === "error" && (
                <div className={`p-3 rounded-lg ${darkMode ? "bg-red-900/30" : "bg-red-100"}`}>
                  <p className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle size={20} />
                    <span>Failed to connect to ESP32 device</span>
                  </p>
                  <p className="text-sm mt-2 text-red-500 dark:text-red-400">
                    Make sure the IP address is correct and the device is connected to the same network.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className={`w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] rounded-xl shadow-lg flex flex-col ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
          }`}>
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <History className="text-blue-500" size={20} />
                  Feeding History
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await refreshFeedingData();
                        showPopup("success", "Feeding history refreshed!");
                      } catch (error) {
                        showPopup("error", "Failed to refresh history");
                      }
                    }}
                    className={`p-2 rounded-lg transition ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                    title="Refresh History"
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button
                    onClick={() => setShowHistory(false)}
                    className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden p-4 sm:p-6">
            
            {/* Search and Filter Bar */}
            <div className="mb-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search feeding history..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors ${
                    darkMode 
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500" 
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={historyStatusFilter}
                    onChange={(e) => setHistoryStatusFilter(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500" 
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  >
                    <option value="all">All Status</option>
                    <option value="completed">✅ Completed</option>
                    <option value="failed">❌ Failed</option>
                    <option value="retrying">🔄 Retrying</option>
                    <option value="scheduled">⏰ Scheduled</option>
                  </select>
                </div>

                {/* Zone Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zone
                  </label>
                  <select
                    value={historyZoneFilter}
                    onChange={(e) => setHistoryZoneFilter(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500" 
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  >
                    <option value="all">All Zones</option>
                    {zones.map((zone) => (
                      <option key={zone._id} value={zone._id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Feed Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Feed Type
                  </label>
                  <select
                    value={historyFeedFilter}
                    onChange={(e) => setHistoryFeedFilter(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500" 
                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  >
                    <option value="all">All Feed Types</option>
                    {feeds.map((feed) => (
                      <option key={feed._id} value={feed._id}>
                        {feed.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {getFilteredAndSortedHistory().length} of {feedingHistory.length} feeding records
              </p>
            </div>

            {/* Table Container with Fixed Height */}
            <div className="border rounded-xl overflow-hidden">
              {getFilteredAndSortedHistory().length === 0 ? (
                <div className="text-center py-12">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                    darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}>
                    <Search className="text-gray-400" size={32} />
                  </div>
                  <h4 className="text-lg font-medium text-gray-500 mb-2">No Results Found</h4>
                  <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-96">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className={`${darkMode ? "bg-gray-800" : "bg-gray-50"} border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                        <th 
                          className="p-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[140px]"
                          onClick={() => handleSort("feedingTime")}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span className="font-semibold text-sm">Date & Time</span>
                            {historySortBy === "feedingTime" && (
                              <span className="text-xs">
                                {historySortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="p-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[120px]"
                          onClick={() => handleSort("zone")}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin size={14} />
                            <span className="font-semibold text-sm">Zone</span>
                            {historySortBy === "zone" && (
                              <span className="text-xs">
                                {historySortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="p-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[120px]"
                          onClick={() => handleSort("feed")}
                        >
                          <div className="flex items-center gap-2">
                            <Package size={14} />
                            <span className="font-semibold text-sm">Feed</span>
                            {historySortBy === "feed" && (
                              <span className="text-xs">
                                {historySortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="p-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[100px]"
                          onClick={() => handleSort("quantity")}
                        >
                          <div className="flex items-center gap-2">
                            <Scale size={14} />
                            <span className="font-semibold text-sm">Quantity</span>
                            {historySortBy === "quantity" && (
                              <span className="text-xs">
                                {historySortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="p-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[120px]"
                          onClick={() => handleSort("status")}
                        >
                          <div className="flex items-center gap-2">
                            <Activity size={14} />
                            <span className="font-semibold text-sm">Status</span>
                            {historySortBy === "status" && (
                              <span className="text-xs">
                                {historySortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="p-3 text-left min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <FileText size={14} />
                            <span className="font-semibold text-sm">Notes</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredAndSortedHistory().map((h) => (
                        <tr key={h._id} className={`border-b ${darkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50"} transition-colors`}>
                          <td className="p-3">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white text-sm">
                                {h.feedingTime ? new Date(h.feedingTime).toLocaleDateString() : "-"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {h.feedingTime ? new Date(h.feedingTime).toLocaleTimeString() : "-"}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {h.zoneId?.name || h.animalId?.name || "Unknown"}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {getFoodName(h.foodId)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {h.quantity} {h.foodId?.unit || feedUnit}
                            </div>
                          </td>
                          <td className="p-3">
                            {h.status === "completed" ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-200 dark:border-green-700">
                                ✅ Completed
                              </span>
                            ) : h.status === "failed" ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-700">
                                ❌ Failed
                              </span>
                            ) : h.status === "retrying" ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700">
                                🔄 Retrying
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                ⏰ Scheduled
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="text-xs text-gray-600 dark:text-gray-300 max-w-[200px] truncate" title={h.notes || ""}>
                              {h.notes || "-"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            </div>
            
            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowHistory(false)}
                  className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition ${
                    darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
                  } text-gray-800 dark:text-white text-sm sm:text-base`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup Messages */}
      <AnimatePresence>
        {popup.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 backdrop-blur-sm"
            onClick={() => setPopup({ show: false, type: "success", message: "" })}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={`rounded-2xl p-6 shadow-xl ${
                popup.type === "success" ? "border-t-4 border-green-500" : "border-t-4 border-red-500"
              } ${darkMode ? "bg-gray-800" : "bg-white"} max-w-md mx-4`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-full p-3 ${
                    popup.type === "success"
                      ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {popup.type === "success" ? (
                    <CheckCircle size={24} />
                  ) : (
                    <X size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-gray-900 dark:text-white mb-2">
                    {popup.type === "success" ? "Success" : "Error"}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {popup.message}
                  </p>
                  <button
                    onClick={() => setPopup({ show: false, type: "success", message: "" })}
                    className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      popup.type === "success"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    OK
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}