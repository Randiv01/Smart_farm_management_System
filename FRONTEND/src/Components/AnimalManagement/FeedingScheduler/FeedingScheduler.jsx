import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Color palette for the app
const colors = {
  primary: { light: "#4f46e5", dark: "#6366f1" },
  secondary: { light: "#10b981", dark: "#34d399" },
  accent: { light: "#f59e0b", dark: "#fbbf24" },
  danger: { light: "#ef4444", dark: "#f87171" },
  background: { light: "#f8fafc", dark: "#1e293b" },
  card: { light: "#ffffff", dark: "#334155" }
};

export default function FeedingScheduler() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  // State management
  const [animals, setAnimals] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [feedingHistory, setFeedingHistory] = useState([]);
  const [formData, setFormData] = useState({
    animalId: "",
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

  // Fetch animals, feeds, and history
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setApiError(false);
        
        // Fetch animals and feeds
        const [animalsRes, feedsRes] = await Promise.all([
          fetch("http://localhost:5000/animal-types"),
          fetch("http://localhost:5000/api/animalfood")
        ]);

        if (!animalsRes.ok || !feedsRes.ok) {
          throw new Error("Failed to fetch data from server");
        }

        const animalsData = await animalsRes.json();
        const feedsData = await feedsRes.json();

        setAnimals(animalsData || []);
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
  const selectedAnimal = animals.find((a) => a._id === formData.animalId);
  const recommendedFeedSize = selectedAnimal?.feedSize;
  const selectedFeed = feeds.find((f) => f._id === formData.foodId);
  const feedUnit = selectedFeed?.unit || selectedAnimal?.feedUnit || "kg";

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
    if (!formData.animalId || !formData.foodId || !formData.quantity || 
        formData.feedingTimes.some(time => !time)) {
      toast.error("Please fill all required fields");
      setLoading(false);
      return;
    }

    try {
      // Prepare data for submission
      const submissionData = {
        animalId: formData.animalId,
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
        animalId: "",
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
    <div className={`p-4 sm:p-6 rounded-xl transition-all duration-300 ${
      darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
    }`}>
      
      {/* API Error Banner */}
      {apiError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>⚠️ Could not connect to server. Please check your backend.</p>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${darkMode ? "bg-blue-700" : "bg-blue-600"}`}>
            <span className="text-2xl">🍽️</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Feeding Scheduler</h2>
            <p className="text-sm opacity-80">Manage and schedule animal feedings</p>
          </div>
        </div>
        
        {/* ESP32 Connection Status */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            esp32Connected 
              ? (darkMode ? "bg-green-800/50" : "bg-green-100") 
              : (darkMode ? "bg-red-800/50" : "bg-red-100")
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              esp32Connected ? "bg-green-500" : "bg-red-500"
            }`}></div>
            <span className="text-sm">
              {esp32Connected ? "ESP32 Connected" : "ESP32 Disconnected"}
            </span>
          </div>
          <button
            onClick={() => setShowEsp32Config(true)}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            <span className="text-lg">⚙️</span>
            <span className="text-sm">Configure</span>
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Animals Card */}
        <div className={`p-4 rounded-xl shadow-sm transition-all hover:scale-[1.02] ${
          darkMode ? "bg-gray-700" : "bg-gray-100"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${darkMode ? "bg-green-900/50" : "bg-green-100"}`}>
              <span className="text-xl">🐄</span>
            </div>
            <div>
              <h3 className="font-medium">Animals</h3>
              <p className="text-2xl font-bold">{animals.length}</p>
            </div>
          </div>
        </div>

        {/* Feed Stock Card */}
        <div className={`p-4 rounded-xl shadow-sm transition-all hover:scale-[1.02] ${
          darkMode ? "bg-gray-700" : "bg-gray-100"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${darkMode ? "bg-amber-900/50" : "bg-amber-100"}`}>
              <span className="text-xl">🌾</span>
            </div>
            <div>
              <h3 className="font-medium">Feed Types</h3>
              <p className="text-2xl font-bold">{feeds.length}</p>
            </div>
          </div>
        </div>
        
        {/* ESP32 Status Card */}
        <div className={`p-4 rounded-xl shadow-sm transition-all hover:scale-[1.02] ${
          darkMode ? "bg-gray-700" : "bg-gray-100"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              esp32Connected 
                ? (darkMode ? "bg-blue-900/50" : "bg-blue-100") 
                : (darkMode ? "bg-red-900/50" : "bg-red-100")
            }`}>
              <span className="text-xl">📶</span>
            </div>
            <div>
              <h3 className="font-medium">Device Status</h3>
              <p className="text-lg font-bold">
                {esp32Connected ? "Connected" : "Disconnected"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Current Weight Card */}
        <div className={`p-4 rounded-xl shadow-sm transition-all hover:scale-[1.02] ${
          darkMode ? "bg-gray-700" : "bg-gray-100"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${darkMode ? "bg-purple-900/50" : "bg-purple-100"}`}>
              <span className="text-xl">⚖️</span>
            </div>
            <div>
              <h3 className="font-medium">Current Weight</h3>
              <p className="text-2xl font-bold">{currentWeight.toFixed(2)}g</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Animal Selection */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold flex gap-1 items-center">
            <span className={`p-1 rounded ${darkMode ? "bg-blue-900/50" : "bg-blue-100"}`}>🐄</span>
            <span>Animal <span className="text-red-500">*</span></span>
          </label>
          <select
            name="animalId"
            value={formData.animalId}
            onChange={handleChange}
            className={`p-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 transition ${
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
            }`}
            required
            disabled={loading}
          >
            <option value="">-- Select Animal --</option>
            {loading ? (
              <option value="" disabled>Loading animals...</option>
            ) : animals.length === 0 ? (
              <option value="" disabled>No animals found</option>
            ) : (
              animals.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} {a.breed && `(${a.breed})`}
                </option>
              ))
            )}
          </select>
          {recommendedFeedSize && (
            <p className={`text-sm ${darkMode ? "text-blue-300" : "text-blue-600"}`}>
              Recommended Feed Size: {recommendedFeedSize} {feedUnit}
            </p>
          )}
        </div>

        {/* Food Selection */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold flex gap-1 items-center">
            <span className={`p-1 rounded ${darkMode ? "bg-amber-900/50" : "bg-amber-100"}`}>🌾</span>
            <span>Food Type <span className="text-red-500">*</span></span>
          </label>
          <select
            name="foodId"
            value={formData.foodId}
            onChange={handleChange}
            className={`p-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 transition ${
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
              <span className={`p-1 rounded ${darkMode ? "bg-purple-900/50" : "bg-purple-100"}`}>⚖️</span>
              <span>Quantity ({feedUnit}) <span className="text-red-500">*</span></span>
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
                className={`w-full p-2 rounded-lg border-2 ${
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
            <span className={`p-1 rounded ${darkMode ? "bg-green-900/50" : "bg-green-100"}`}>⏱️</span>
            <span>Feeding Times <span className="text-red-500">*</span></span>
          </label>
          
          <div className="space-y-3">
            {formData.feedingTimes.map((time, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="datetime-local"
                  value={time}
                  onChange={(e) => handleFeedingTimeChange(index, e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className={`flex-1 p-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 transition ${
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
                    ✕
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
            <span>➕</span>
            <span>Add Another Time</span>
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
            <span className={`p-1 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>📝</span>
            <span>Notes</span>
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className={`p-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 transition ${
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
                ? (esp32Connected || !immediateFeeding ? "bg-green-700 hover:bg-green-600" : "bg-gray-600") 
                : (esp32Connected || !immediateFeeding ? "bg-green-600 hover:bg-green-500" : "bg-gray-400")
            } text-white disabled:opacity-50`}
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>💾</span>
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
              darkMode ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-500"
            } text-white disabled:opacity-50`}
          >
            <span>📜</span>
            <span>View History</span>
          </button>
        </div>
      </form>

      {/* ESP32 Configuration Modal */}
      {showEsp32Config && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-lg p-6 ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className={`p-2 rounded-full ${darkMode ? "bg-blue-900/50" : "bg-blue-100"}`}>📶</span>
                <span>ESP32 Configuration</span>
              </h3>
              <button onClick={() => setShowEsp32Config(false)} className="text-2xl hover:text-red-500 transition">
                ×
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
                  className={`p-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 transition ${
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
                      <span className="animate-spin">⏳</span>
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
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
                <div className={`p-3 rounded-lg ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}>
                  <p className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <span>✅</span>
                    <span>Successfully connected to ESP32 device</span>
                  </p>
                </div>
              )}
              
              {esp32Status === "error" && (
                <div className={`p-3 rounded-lg ${darkMode ? "bg-red-900/30" : "bg-red-100"}`}>
                  <p className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <span>❌</span>
                    <span>Failed to connect to ESP32 device</span>
                  </p>
                  <p className="text-sm mt-2">
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
                <span className={`p-2 rounded-full ${darkMode ? "bg-blue-900/50" : "bg-blue-100"}`}>📜</span>
                <span>Feeding History</span>
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-2xl hover:text-red-500 transition">
                ×
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