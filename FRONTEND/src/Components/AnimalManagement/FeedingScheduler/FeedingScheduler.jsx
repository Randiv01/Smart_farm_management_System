import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Color palette for the app
const colors = {
  primary: {
    light: "#4f46e5",
    dark: "#6366f1"
  },
  secondary: {
    light: "#10b981",
    dark: "#34d399"
  },
  accent: {
    light: "#f59e0b",
    dark: "#fbbf24"
  },
  danger: {
    light: "#ef4444",
    dark: "#f87171"
  },
  background: {
    light: "#f8fafc",
    dark: "#1e293b"
  },
  card: {
    light: "#ffffff",
    dark: "#334155"
  }
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
    feedingTimes: [],
    notes: "",
    recurring: false,
    recurringDays: 1,
  });
  const [selectedFeedRemaining, setSelectedFeedRemaining] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [newFeedingTime, setNewFeedingTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmFeedNow, setConfirmFeedNow] = useState(false);

   // Fetch animals, feeds, and history
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const responses = await Promise.all([
          fetch("http://localhost:5000/feeding/animals"),
          fetch("http://localhost:5000/feeding/feeds"),
          fetch("http://localhost:5000/feeding/history")
        ]);

        const errors = responses.filter(res => !res.ok);
        if (errors.length > 0) throw new Error(`Failed to fetch: ${errors.map(e => e.statusText).join(", ")}`);

        const [animalsData, feedsData, historyData] = await Promise.all(responses.map(res => res.json()));

        setAnimals(animalsData || []);
        setFeeds(feedsData || []);
        setFeedingHistory(historyData || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ESP32 weight polling with error handling
  useEffect(() => {
    const esp32Ip = "192.168.1.10";
    let isMounted = true;
    
    const fetchWeight = async () => {
      try {
        const res = await fetch(`http://${esp32Ip}/weight`);
        if (!res.ok) throw new Error("ESP32 not responding");
        const text = await res.text();
        if (isMounted) setCurrentWeight(text);
      } catch (err) {
        if (isMounted) setCurrentWeight("Sensor offline");
      }
    };
    
    fetchWeight();
    const interval = setInterval(fetchWeight, 1000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Update max quantity when feed changes
  useEffect(() => {
    const selectedFeed = feeds.find((f) => f._id === formData.foodId);
    setSelectedFeedRemaining(
      selectedFeed ? Number(selectedFeed.remaining || selectedFeed.quantity) : 0
    );
  }, [formData.foodId, feeds]);

  // Derived state
  const selectedAnimal = animals.find((a) => a._id === formData.animalId);
  const recommendedFeedSize = selectedAnimal?.feedSize;
  const feedUnit = selectedAnimal?.feedUnit || "g";

  // Event handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddFeedingTime = () => {
    if (!newFeedingTime) {
      toast.warning("Please select a time");
      return;
    }

    if (new Date(newFeedingTime) < new Date()) {
      toast.error("Cannot schedule feeding in the past");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      feedingTimes: [...prev.feedingTimes, newFeedingTime],
    }));
    setNewFeedingTime("");
    toast.success("Time added to schedule");
  };

  const handleRemoveFeedingTime = (idx) => {
    setFormData((prev) => ({
      ...prev,
      feedingTimes: prev.feedingTimes.filter((_, i) => i !== idx),
    }));
  };

  const generateRecurringTimes = () => {
    if (!newFeedingTime || formData.recurringDays < 1) return;
    
    const times = [];
    const startDate = new Date(newFeedingTime);
    
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(startDate);
      newDate.setDate(newDate.getDate() + (i * formData.recurringDays));
      times.push(newDate.toISOString().slice(0, 16));
    }
    
    setFormData(prev => ({
      ...prev,
      feedingTimes: [...prev.feedingTimes, ...times]
    }));
    setNewFeedingTime("");
    toast.success(`Added ${times.length} recurring times`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.animalId || !formData.foodId || !formData.quantity || formData.feedingTimes.length === 0) {
      toast.error("Please fill all required fields");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/feed-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success("Feeding schedule saved successfully!");
      setFormData({
        animalId: "",
        foodId: "",
        quantity: 0,
        feedingTimes: [],
        notes: "",
        recurring: false,
        recurringDays: 1,
      });

      // Refresh history
      const historyRes = await fetch("http://localhost:5000/feeding-history");
      const historyData = await historyRes.json();
      setFeedingHistory(historyData || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedNow = async () => {
    setLoading(true);
    try {
      if (!formData.animalId || !formData.quantity || Number(formData.quantity) <= 0) {
        throw new Error("Please select animal and enter valid quantity");
      }

      const esp32Ip = "192.168.1.10";
      const res = await fetch(`http://${esp32Ip}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: Number(formData.quantity) }),
      });

      if (!res.ok) throw new Error(`ESP32 error: ${res.status}`);
      
      const data = await res.text();
      toast.success(`Feeding triggered! Response: ${data}`);

      // Add to history immediately
      const historyEntry = {
        animalId: { 
          _id: formData.animalId, 
          name: selectedAnimal?.name || "Unknown" 
        },
        foodId: { 
          _id: formData.foodId, 
          foodName: feeds.find(f => f._id === formData.foodId)?.foodName || "Unknown" 
        },
        quantity: formData.quantity,
        feedingTime: new Date().toISOString(),
        notes: `Manual feed - ${formData.notes || "No notes"}`,
      };

      setFeedingHistory(prev => [historyEntry, ...prev]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setConfirmFeedNow(false);
    }
  };

  // Calculate next feeding time
  const calculateNextFeeding = () => {
    if (formData.feedingTimes.length === 0) return null;
    
    const now = new Date();
    const futureTimes = formData.feedingTimes
      .map(time => new Date(time))
      .filter(time => time > now)
      .sort((a, b) => a - b);
    
    return futureTimes.length > 0 ? futureTimes[0] : null;
  };

  const nextFeeding = calculateNextFeeding();

  return (
    <div 
      className={`p-4 sm:p-6 rounded-xl transition-all duration-300 ${
        darkMode 
          ? `bg-[${colors.background.dark}] text-gray-100`
          : `bg-[${colors.background.light}] text-gray-800`
      }`}
      style={{
        backgroundColor: darkMode ? colors.background.dark : colors.background.light
      }}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${
            darkMode 
              ? `bg-[${colors.primary.dark}]` 
              : `bg-[${colors.primary.light}]`
          }`}
          style={{
            backgroundColor: darkMode ? colors.primary.dark : colors.primary.light
          }}>
            <span className="text-2xl">🍽️</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Feeding Scheduler</h2>
            <p className="text-sm opacity-80">
              Manage and schedule animal feedings
            </p>
          </div>
        </div>
        
        {nextFeeding && (
          <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            darkMode 
              ? `bg-[${colors.secondary.dark}]` 
              : `bg-[${colors.secondary.light}] text-white`
          }`}
          style={{
            backgroundColor: darkMode ? colors.secondary.dark : colors.secondary.light
          }}>
            <span className="text-lg">⏰</span>
            <span className="font-medium">
              Next: {nextFeeding.toLocaleDateString()} at{" "}
              {nextFeeding.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Weight Card */}
        <div className={`p-4 rounded-xl shadow-sm ${
          darkMode 
            ? `bg-[${colors.card.dark}] border border-gray-700` 
            : `bg-[${colors.card.light}] border border-gray-200`
        }`}
        style={{
          backgroundColor: darkMode ? colors.card.dark : colors.card.light
        }}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              darkMode ? "bg-blue-900/50" : "bg-blue-100"
            }`}>
              <span className="text-xl">⚖️</span>
            </div>
            <div>
              <h3 className="font-medium">Current Weight</h3>
              <p className="text-2xl font-bold">
                {currentWeight || "--"} {feedUnit}
              </p>
            </div>
          </div>
        </div>

        {/* Animals Card */}
        <div className={`p-4 rounded-xl shadow-sm ${
          darkMode 
            ? `bg-[${colors.card.dark}] border border-gray-700` 
            : `bg-[${colors.card.light}] border border-gray-200`
        }`}
        style={{
          backgroundColor: darkMode ? colors.card.dark : colors.card.light
        }}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              darkMode ? "bg-green-900/50" : "bg-green-100"
            }`}>
              <span className="text-xl">🐄</span>
            </div>
            <div>
              <h3 className="font-medium">Animals</h3>
              <p className="text-2xl font-bold">{animals.length}</p>
            </div>
          </div>
        </div>

        {/* Feed Stock Card */}
        <div className={`p-4 rounded-xl shadow-sm ${
          darkMode 
            ? `bg-[${colors.card.dark}] border border-gray-700` 
            : `bg-[${colors.card.light}] border border-gray-200`
        }`}
        style={{
          backgroundColor: darkMode ? colors.card.dark : colors.card.light
        }}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              darkMode ? "bg-amber-900/50" : "bg-amber-100"
            }`}>
              <span className="text-xl">🌾</span>
            </div>
            <div>
              <h3 className="font-medium">Feed Types</h3>
              <p className="text-2xl font-bold">{feeds.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Animal Selection */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold flex gap-1 items-center">
            <span className={`p-1 rounded ${
              darkMode ? "bg-blue-900/50" : "bg-blue-100"
            }`}>
              🐄
            </span>
            <span>Animal <span className="text-red-500">*</span></span>
          </label>
          <select
            name="animalId"
            value={formData.animalId}
            onChange={handleChange}
            className={`p-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
              darkMode
                ? `bg-[${colors.card.dark}] border-gray-700 text-gray-100`
                : `bg-[${colors.card.light}] border-gray-300 text-gray-800`
            }`}
            required
            disabled={loading}
            style={{
              backgroundColor: darkMode ? colors.card.dark : colors.card.light
            }}
          >
            <option value="">-- Select Animal --</option>
            {animals.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} {a.breed && `(${a.breed})`}
              </option>
            ))}
          </select>
          {recommendedFeedSize && (
            <p className={`text-sm ${
              darkMode ? "text-blue-300" : "text-blue-600"
            }`}>
              Recommended Feed Size: {recommendedFeedSize} {feedUnit}
            </p>
          )}
        </div>

        {/* Food Selection */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold flex gap-1 items-center">
            <span className={`p-1 rounded ${
              darkMode ? "bg-amber-900/50" : "bg-amber-100"
            }`}>
              🌾
            </span>
            <span>Food Type <span className="text-red-500">*</span></span>
          </label>
          <select
            name="foodId"
            value={formData.foodId}
            onChange={handleChange}
            className={`p-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
              darkMode
                ? `bg-[${colors.card.dark}] border-gray-700 text-gray-100`
                : `bg-[${colors.card.light}] border-gray-300 text-gray-800`
            }`}
            required
            disabled={loading}
            style={{
              backgroundColor: darkMode ? colors.card.dark : colors.card.light
            }}
          >
            <option value="">-- Select Feed --</option>
            {feeds.map((f) => (
              <option
                key={f._id}
                value={f._id}
                disabled={f.remaining <= 0}
                className={f.remaining <= 0 ? "text-red-500" : ""}
              >
                {f.foodName} ({f.remaining} {feedUnit} remaining)
                {f.remaining <= 0 && " - OUT OF STOCK"}
              </option>
            ))}
          </select>
          {formData.foodId && selectedFeedRemaining < 100 && (
            <p className="text-sm text-yellow-600 dark:text-yellow-300">
              ⚠ Low stock: Only {selectedFeedRemaining} {feedUnit} remaining
            </p>
          )}
        </div>

        {/* Quantity Slider */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold flex gap-1 items-center">
            <span className={`p-1 rounded ${
              darkMode ? "bg-purple-900/50" : "bg-purple-100"
            }`}>
              ⚖️
            </span>
            <span>Quantity ({feedUnit}) <span className="text-red-500">*</span></span>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max={selectedFeedRemaining}
              value={formData.quantity}
              name="quantity"
              onChange={handleChange}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                darkMode ? "accent-blue-400" : "accent-blue-600"
              }`}
              required
              disabled={loading}
            />
            <span className="min-w-[60px] text-center font-medium">
              {formData.quantity} {feedUnit}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Min: 1 {feedUnit}</span>
            <span>Max: {selectedFeedRemaining} {feedUnit}</span>
          </div>
        </div>

        {/* Feeding Times */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold flex gap-1 items-center">
            <span className={`p-1 rounded ${
              darkMode ? "bg-green-900/50" : "bg-green-100"
            }`}>
              ⏱️
            </span>
            <span>Feeding Times <span className="text-red-500">*</span></span>
          </label>
          
          {/* Recurring Schedule Options */}
          <div className={`p-3 rounded-lg mb-2 ${
            darkMode ? `bg-[${colors.card.dark}] border border-gray-700` : `bg-[${colors.card.light}] border border-gray-200`
          }`}
          style={{
            backgroundColor: darkMode ? colors.card.dark : colors.card.light
          }}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="recurring"
                checked={formData.recurring}
                onChange={handleChange}
                className={`w-4 h-4 rounded ${
                  darkMode ? "accent-blue-400" : "accent-blue-600"
                }`}
              />
              <span>Recurring Schedule</span>
            </label>
            
            {formData.recurring && (
              <div className="mt-2 flex items-center gap-2">
                <span>Every</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  name="recurringDays"
                  value={formData.recurringDays}
                  onChange={handleChange}
                  className={`w-16 p-2 rounded border ${
                    darkMode 
                      ? `bg-[${colors.card.dark}] border-gray-700 text-gray-100`
                      : `bg-[${colors.card.light}] border-gray-300 text-gray-800`
                  }`}
                  style={{
                    backgroundColor: darkMode ? colors.card.dark : colors.card.light
                  }}
                />
                <span>days</span>
              </div>
            )}
          </div>
          
          {/* Time Picker */}
          <div className="flex gap-2 flex-col sm:flex-row">
            <input
              type="datetime-local"
              value={newFeedingTime}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) => setNewFeedingTime(e.target.value)}
              className={`flex-1 p-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                darkMode
                  ? `bg-[${colors.card.dark}] border-gray-700 text-gray-100`
                  : `bg-[${colors.card.light}] border-gray-300 text-gray-800`
              }`}
              disabled={loading}
              style={{
                backgroundColor: darkMode ? colors.card.dark : colors.card.light
              }}
            />
            <button
              type="button"
              onClick={formData.recurring ? generateRecurringTimes : handleAddFeedingTime}
              className={`px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                darkMode
                  ? `bg-[${colors.primary.dark}] hover:bg-[${colors.primary.dark}]/90 text-white`
                  : `bg-[${colors.primary.light}] hover:bg-[${colors.primary.light}]/90 text-white`
              } sm:w-auto w-full`}
              disabled={loading}
              style={{
                backgroundColor: darkMode ? colors.primary.dark : colors.primary.light
              }}
            >
              <span>+</span>
              <span className="hidden sm:inline">Add Time</span>
            </button>
          </div>
          
          {/* Selected Times */}
          <div className="mt-2">
            <h4 className="text-sm font-medium mb-1">Scheduled Times:</h4>
            {formData.feedingTimes.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No times scheduled yet</p>
            ) : (
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                {formData.feedingTimes
                  .sort((a, b) => new Date(a) - new Date(b))
                  .map((time, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg flex justify-between items-center ${
                        darkMode 
                          ? `bg-[${colors.card.dark}] border border-gray-700`
                          : `bg-[${colors.card.light}] border border-gray-200`
                      }`}
                      style={{
                        backgroundColor: darkMode ? colors.card.dark : colors.card.light
                      }}
                    >
                      <span>
                        {new Date(time).toLocaleDateString()} at{" "}
                        {new Date(time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeedingTime(idx)}
                        className={`p-1 rounded-full hover:bg-opacity-20 ${
                          darkMode 
                            ? "hover:bg-red-400 text-red-400" 
                            : "hover:bg-red-500 text-red-500"
                        }`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-semibold flex gap-1 items-center">
            <span className={`p-1 rounded ${
              darkMode ? "bg-gray-700" : "bg-gray-200"
            }`}>
              📝
            </span>
            <span>Notes</span>
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className={`p-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
              darkMode
                ? `bg-[${colors.card.dark}] border-gray-700 text-gray-100`
                : `bg-[${colors.card.light}] border-gray-300 text-gray-800`
            }`}
            placeholder="Any special instructions..."
            disabled={loading}
            style={{
              backgroundColor: darkMode ? colors.card.dark : colors.card.light
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-semibold flex-1 flex items-center justify-center gap-2 transition ${
              darkMode
                ? `bg-[${colors.secondary.dark}] hover:bg-[${colors.secondary.dark}]/90 text-white`
                : `bg-[${colors.secondary.light}] hover:bg-[${colors.secondary.light}]/90 text-white`
            } disabled:opacity-50`}
            style={{
              backgroundColor: darkMode ? colors.secondary.dark : colors.secondary.light
            }}
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Save Schedule</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setConfirmFeedNow(true)}
            disabled={loading || !formData.animalId || !formData.quantity}
            className={`px-6 py-3 rounded-lg font-semibold flex-1 flex items-center justify-center gap-2 transition ${
              darkMode
                ? `bg-[${colors.accent.dark}] hover:bg-[${colors.accent.dark}]/90 text-white`
                : `bg-[${colors.accent.light}] hover:bg-[${colors.accent.light}]/90 text-white`
            } disabled:opacity-50`}
            style={{
              backgroundColor: darkMode ? colors.accent.dark : colors.accent.light
            }}
          >
            <span>⚡</span>
            <span>Feed Now</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHistory(true)}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-semibold flex-1 flex items-center justify-center gap-2 transition ${
              darkMode
                ? `bg-[${colors.primary.dark}] hover:bg-[${colors.primary.dark}]/90 text-white`
                : `bg-[${colors.primary.light}] hover:bg-[${colors.primary.light}]/90 text-white`
            } disabled:opacity-50`}
            style={{
              backgroundColor: darkMode ? colors.primary.dark : colors.primary.light
            }}
          >
            <span>📜</span>
            <span>View History</span>
          </button>
        </div>
      </form>

      {/* Feed Now Confirmation Modal */}
      {confirmFeedNow && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-md rounded-xl shadow-lg p-6 ${
              darkMode 
                ? `bg-[${colors.card.dark}] border border-gray-700`
                : `bg-[${colors.card.light}] border border-gray-200`
            }`}
            style={{
              backgroundColor: darkMode ? colors.card.dark : colors.card.light
            }}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className={`p-2 rounded-full ${
                darkMode ? "bg-yellow-900/50" : "bg-yellow-100"
              }`}>
                ⚠️
              </span>
              <span>Confirm Feeding</span>
            </h3>
            <p className="mb-4">
              You are about to dispense <strong>{formData.quantity} {feedUnit}</strong> of feed to{" "}
              <strong>{selectedAnimal?.name || "selected animal"}</strong>. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmFeedNow(false)}
                className={`px-4 py-2 rounded-lg ${
                  darkMode 
                    ? `bg-[${colors.card.dark}] border border-gray-600 hover:bg-gray-700`
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
                style={{
                  backgroundColor: darkMode ? colors.card.dark : colors.card.light
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFeedNow}
                disabled={loading}
                className={`px-4 py-2 rounded-lg ${
                  darkMode 
                    ? `bg-[${colors.accent.dark}] hover:bg-[${colors.accent.dark}]/90 text-white`
                    : `bg-[${colors.accent.light}] hover:bg-[${colors.accent.light}]/90 text-white`
                } disabled:opacity-50`}
                style={{
                  backgroundColor: darkMode ? colors.accent.dark : colors.accent.light
                }}
              >
                {loading ? "Dispensing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-lg flex flex-col ${
              darkMode 
                ? `bg-[${colors.card.dark}] border border-gray-700`
                : `bg-[${colors.card.light}] border border-gray-200`
            }`}
            style={{
              backgroundColor: darkMode ? colors.card.dark : colors.card.light
            }}
          >
            <div className="flex justify-between items-center border-b p-4 sticky top-0 z-10 bg-inherit">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className={`p-2 rounded-full ${
                  darkMode ? "bg-blue-900/50" : "bg-blue-100"
                }`}>
                  📜
                </span>
                <span>Feeding History</span>
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-2xl hover:text-red-500 transition"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-y-auto p-4">
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
                        <tr
                          key={h._id}
                          className={`border-t ${
                            darkMode
                              ? "border-gray-700 hover:bg-gray-700/50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <td className="p-3">
                            {h.animalId?.name || "All"}{" "}
                            {h.animalId?.breed && `(${h.animalId.breed})`}
                          </td>
                          <td className="p-3">{h.foodId?.foodName || "Unknown"}</td>
                          <td className="p-3">
                            {h.quantity} {feedUnit}
                          </td>
                          <td className="p-3">
                            {h.feedingTime
                              ? new Date(h.feedingTime).toLocaleString()
                              : "-"}
                          </td>
                          <td className="p-3">{h.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="border-t p-3 flex justify-end sticky bottom-0 bg-inherit">
              <button
                onClick={() => setShowHistory(false)}
                className={`px-4 py-2 rounded-lg ${
                  darkMode 
                    ? `bg-[${colors.primary.dark}] hover:bg-[${colors.primary.dark}]/90 text-white`
                    : `bg-[${colors.primary.light}] hover:bg-[${colors.primary.light}]/90 text-white`
                }`}
                style={{
                  backgroundColor: darkMode ? colors.primary.dark : colors.primary.light
                }}
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