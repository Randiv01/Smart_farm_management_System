import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Plus,
  Clock,
  History,
  Settings,
  Wifi,
  WifiOff,
  Scale,
  Save,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
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
  const [currentWeight, setCurrentWeight] = useState(0);
  const [showEsp32Config, setShowEsp32Config] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [esp32Status, setEsp32Status] = useState("disconnected");
  const [immediateFeeding, setImmediateFeeding] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");


   useEffect(() => {
          document.title = "FeedingScheduler - Animal Manager";
      }, []);

  // Fetch zones, feeds, and history
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setApiError(false);
        
        // Fetch zones and feeds
        const [zonesRes, feedsRes] = await Promise.all([
          fetch("http://localhost:5000/zones"),
          fetch("http://localhost:5000/api/animalfood")
        ]);

        if (!zonesRes.ok || !feedsRes.ok) {
          throw new Error("Failed to fetch data from server");
        }

        const zonesData = await zonesRes.json();
        const feedsData = await feedsRes.json();

        setZones(zonesData.zones || []);
        setFeeds(feedsData || []);
        
      } catch (err) {
        console.error("Fetch error:", err);
        setApiError(true);
        toast.error("Failed to load data from server.");
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
      const response = await fetch(`http://${esp32Ip}/`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        setEsp32Connected(true);
        setEsp32Status("connected");
        toast.success("ESP32 connected successfully!");
        
        // Get current weight
        const weightResponse = await fetch(`http://${esp32Ip}/weight`);
        if (weightResponse.ok) {
          const weight = await weightResponse.text();
          setCurrentWeight(parseFloat(weight));
        }
      } else {
        setEsp32Connected(false);
        setEsp32Status("error");
        toast.error("ESP32 connection failed");
      }
    } catch (error) {
      console.error("ESP32 connection error:", error);
      setEsp32Connected(false);
      setEsp32Status("error");
      toast.error("Cannot connect to ESP32");
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
      toast.error("Please fill all required fields");
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

      toast.success("Feeding schedule saved successfully!");
      
      // If ESP32 is connected and immediate feeding is requested, trigger feeding
      if (esp32Connected && immediateFeeding) {
        try {
          const feedRes = await fetch(`http://${esp32Ip}/feed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: formData.quantity }),
          });
          
          if (feedRes.ok) {
            toast.info("Immediate feeding process started on ESP32 device");
            
            // Monitor feeding progress
            monitorFeedingProgress();
          } else {
            toast.warning("Schedule saved but immediate feeding failed");
          }
        } catch (err) {
          console.error("ESP32 feeding error:", err);
          toast.warning("Schedule saved but couldn't communicate with ESP32");
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
      toast.error(err.message || "Failed to save schedule");
    } finally {
      setLoading(false);
    }
  };

  // Monitor feeding progress
  const monitorFeedingProgress = async () => {
    const checkInterval = setInterval(async () => {
      try {
        const weightResponse = await fetch(`http://${esp32Ip}/weight`);
        if (weightResponse.ok) {
          const weight = await weightResponse.text();
          setCurrentWeight(parseFloat(weight));
          
          // If weight is close to target, assume feeding is complete
          if (Math.abs(parseFloat(weight) - formData.quantity) < 0.1) {
            clearInterval(checkInterval);
            toast.success("Feeding completed successfully!");
          }
        }
      } catch (error) {
        console.error("Error monitoring feeding:", error);
        clearInterval(checkInterval);
      }
    }, 1000);
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
      toast.error("Failed to load feeding history");
    } finally {
      setLoading(false);
    }
  };

  // Get food name safely - handles both name and foodName properties
  const getFoodName = (foodItem) => {
    if (!foodItem) return "Unknown";
    return foodItem.name || foodItem.foodName || "Unknown";
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "light-beige"}`}>
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Calendar className="text-blue-500" size={32} />
          Feeding Scheduler
        </h1>
        <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Schedule and manage animal feeding times with automated feeding system
        </p>
      </div>

      {/* ESP32 Connection Panel */}
      <div className={`p-5 rounded-xl shadow-sm mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
          
          <div className="flex gap-2">
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
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              <span>Test Connection</span>
            </button>
            
            <button
              onClick={() => setShowEsp32Config(true)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <Settings size={16} />
              <span>Configure</span>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Zones Card */}
        <div className={`p-5 rounded-xl shadow-sm transition-all hover:shadow-md ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}>
              <span className="text-2xl">🏠</span>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Zones</h3>
              <p className="text-2xl font-bold">{zones.length}</p>
            </div>
          </div>
        </div>

        {/* Feed Stock Card */}
        <div className={`p-5 rounded-xl shadow-sm transition-all hover:shadow-md ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${darkMode ? "bg-amber-900/30" : "bg-amber-100"}`}>
              <span className="text-2xl">🌾</span>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Feed Types</h3>
              <p className="text-2xl font-bold">{feeds.length}</p>
            </div>
          </div>
        </div>
        
        {/* ESP32 Status Card */}
        <div className={`p-5 rounded-xl shadow-sm transition-all hover:shadow-md ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${
              esp32Connected 
                ? (darkMode ? "bg-blue-900/30" : "bg-blue-100") 
                : (darkMode ? "bg-red-900/30" : "bg-red-100")
            }`}>
              {esp32Connected ? <Wifi className="text-blue-500" size={20} /> : <WifiOff className="text-red-500" size={20} />}
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Device Status</h3>
              <p className="text-lg font-bold">
                {esp32Connected ? "Connected" : "Disconnected"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Current Weight Card */}
        <div className={`p-5 rounded-xl shadow-sm transition-all hover:shadow-md ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${darkMode ? "bg-purple-900/30" : "bg-purple-100"}`}>
              <Scale className="text-purple-500" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Current Weight</h3>
              <p className="text-2xl font-bold">{currentWeight.toFixed(2)}g</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className={`p-5 rounded-xl shadow-sm mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="text-blue-500" size={20} />
          Schedule Feeding
        </h3>

        <form onSubmit={handleSubmit} className="grid gap-6 grid-cols-1 md:grid-cols-2">
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
          <div className="flex flex-col sm:flex-row gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={loading || !esp32Connected && immediateFeeding}
              className={`px-6 py-3 rounded-lg font-semibold flex-1 flex items-center justify-center gap-2 transition ${
                darkMode 
                  ? (esp32Connected || !immediateFeeding ? "bg-blue-700 hover:bg-blue-600" : "bg-gray-600") 
                  : (esp32Connected || !immediateFeeding ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-400")
              } text-white disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{immediateFeeding ? "Save & Feed Now" : "Save Schedule"}</span>
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
              className={`px-6 py-3 rounded-lg font-semibold flex-1 flex items-center justify-center gap-2 transition ${
                darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
              } text-white disabled:opacity-50`}
            >
              <History size={16} />
              <span>View History</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl rounded-xl shadow-lg p-6 ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History className="text-blue-500" size={24} />
                Feeding History
              </h3>
              <button 
                onClick={() => setShowHistory(false)} 
                className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-96">
              {feedingHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No feeding history found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className={darkMode ? "bg-gray-700" : "bg-gray-100"}>
                        <th className="p-3 text-left">Animal</th>
                        <th className="p-3 text-left">Feed</th>
                        <th className="p-3 text-left">Quantity</th>
                        <th className="p-3 text-left">Time</th>
                        <th className="p-3 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedingHistory.map((h) => (
                        <tr key={h._id} className={`border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                          <td className="p-3">{h.animalId?.name || "Unknown"}</td>
                          <td className="p-3">{getFoodName(h.foodId)}</td>
                          <td className="p-3">{h.quantity} {h.foodId?.unit || feedUnit}</td>
                          <td className="p-3">
                            {h.feedingTime ? new Date(h.feedingTime).toLocaleString() : "-"}
                          </td>
                          <td className="p-3">{h.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowHistory(false)}
                className={`px-4 py-2 rounded-lg ${
                  darkMode ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-500"
                } text-white`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}