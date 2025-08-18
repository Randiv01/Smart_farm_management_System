import React, { useState, useEffect } from "react";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import { useTheme } from "../contexts/ThemeContext.js";

export default function FeedingScheduler() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [animals, setAnimals] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [feedingHistory, setFeedingHistory] = useState([]);
  const [formData, setFormData] = useState({
    animalId: "",
    foodId: "",
    quantity: 0,
    feedingTimes: [],
    notes: "",
  });
  const [selectedFeedRemaining, setSelectedFeedRemaining] = useState(0);
  const [message, setMessage] = useState("");
  const [currentWeight, setCurrentWeight] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [newFeedingTime, setNewFeedingTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  // Fetch animals, feeds, history
  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const res = await fetch("http://localhost:5000/animal-types");
        const data = await res.json();
        setAnimals(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchFeeds = async () => {
      try {
        const res = await fetch("http://localhost:5000/feed-stocks");
        const data = await res.json();
        setFeeds(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await fetch("http://localhost:5000/feeding-history");
        const data = await res.json();
        setFeedingHistory(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAnimals();
    fetchFeeds();
    fetchHistory();
  }, []);

  // ESP32 weight polling
  useEffect(() => {
    const esp32Ip = "192.168.1.10";
    const fetchWeight = async () => {
      try {
        const res = await fetch(`http://${esp32Ip}/weight`);
        const text = await res.text();
        setCurrentWeight(text);
      } catch {
        setCurrentWeight(null);
      }
    };
    fetchWeight();
    const interval = setInterval(fetchWeight, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update max quantity
  useEffect(() => {
    const selectedFeed = feeds.find(f => f._id === formData.foodId);
    setSelectedFeedRemaining(selectedFeed ? Number(selectedFeed.remaining || selectedFeed.quantity) : 0);
  }, [formData.foodId, feeds]);

  // Recommended feed size for selected animal
  const selectedAnimal = animals.find(a => a._id === formData.animalId);
  const recommendedFeedSize = selectedAnimal?.feedSize;
  const feedUnit = selectedAnimal?.feedUnit || "g"; // dynamically get unit from DB

  const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddFeedingTime = () => {
    if (!newFeedingTime) return;
    setFormData(prev => ({ ...prev, feedingTimes: [...prev.feedingTimes, newFeedingTime] }));
    setNewFeedingTime("");
  };

  const handleRemoveFeedingTime = idx => {
    setFormData(prev => ({ ...prev, feedingTimes: prev.feedingTimes.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!formData.animalId || !formData.foodId || !formData.quantity || formData.feedingTimes.length === 0) {
      setMessage("⚠ Please fill all required fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/feed-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to schedule feeding");

      setMessage("✅ Feeding schedule saved successfully!");
      setFormData({ animalId: "", foodId: "", quantity: 0, feedingTimes: [], notes: "" });

      const historyRes = await fetch("http://localhost:5000/feeding-history");
      const historyData = await historyRes.json();
      setFeedingHistory(historyData || []);
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedNow = async () => {
    setMessage("");
    setLoading(true);
    if (!formData.animalId || !formData.quantity || Number(formData.quantity) <= 0) {
      setMessage("⚠ Please select animal and enter valid quantity.");
      setLoading(false);
      return;
    }

    try {
      const esp32Ip = "192.168.1.10";
      const res = await fetch(`http://${esp32Ip}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: Number(formData.quantity) }),
      });
      if (!res.ok) throw new Error(`ESP32 error: ${res.status}`);
      const data = await res.text();
      setMessage("✅ Feeding triggered! Response: " + data);

      const historyRes = await fetch("http://localhost:5000/feeding-history");
      const historyData = await historyRes.json();
      setFeedingHistory(historyData || []);
    } catch (err) {
      setMessage("❌ Failed to trigger feeding: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex min-h-screen transition-colors duration-300`}
      style={{ backgroundColor: darkMode ? undefined : "#f7e9cb" }}
    >
      <Sidebar sidebarOpen={sidebarOpen} />
      <div className={`flex-1 flex flex-col ${sidebarOpen ? "md:ml-64" : "md:ml-20"} transition-all duration-300`}>
        <TopNavbar sidebarOpen={sidebarOpen} onMenuClick={handleMenuClick} />
        <main className="flex-1 p-4 mt-16">
          <div className={`max-w-6xl mx-auto p-4 sm:p-6 rounded-2xl shadow-card transition ${darkMode ? "bg-dark-card text-dark-text" : "bg-light-beige text-gray-800"}`}>

            {/* ====== Form & UI Elements ====== */}
            <h2 className={`text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2`}>
              🐄 Feeding Scheduler
            </h2>

            {message && (
              <div
                className={`p-3 mb-4 rounded-lg font-semibold animate-popIn ${
                  message.includes("✅")
                    ? "bg-green-100 text-green-800 border-l-4 border-green-500 dark:bg-green-900 dark:text-green-100"
                    : "bg-red-100 text-red-800 border-l-4 border-red-500 dark:bg-red-900 dark:text-red-100"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-5 grid-cols-1 md:grid-cols-2">
              {/* Animal Selection */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold flex gap-1">Animal <span className="text-red-500">*</span></label>
                <select
                  name="animalId"
                  value={formData.animalId}
                  onChange={handleChange}
                  className={`p-2 rounded-lg border focus:ring-2 focus:ring-btn-blue ${darkMode ? "bg-dark-card border-dark-gray text-dark-text" : "bg-white border-gray-300 text-gray-800"}`}
                  required
                >
                  <option value="">-- Select Animal --</option>
                  {animals.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} {a.breed && `(${a.breed})`}
                    </option>
                  ))}
                </select>
                {recommendedFeedSize && (
                  <p className={`text-sm ${darkMode ? "text-btn-blue" : "text-blue-600"}`}>
                    Recommended Feed Size: {recommendedFeedSize} {feedUnit}
                  </p>
                )}
              </div>

              {/* Food Selection */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold flex gap-1">Food Type <span className="text-red-500">*</span></label>
                <select
                  name="foodId"
                  value={formData.foodId}
                  onChange={handleChange}
                  className={`p-2 rounded-lg border focus:ring-2 focus:ring-btn-blue ${darkMode ? "bg-dark-card border-dark-gray text-dark-text" : "bg-white border-gray-300 text-gray-800"}`}
                  required
                >
                  <option value="">-- Select Feed --</option>
                  {feeds.map((f) => (
                    <option key={f._id} value={f._id} disabled={f.remaining <= 0} className={f.remaining <= 0 ? "text-btn-red" : ""}>
                      {f.foodName} ({f.remaining} {feedUnit} remaining)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold">Quantity ({feedUnit}) <span className="text-red-500">*</span></label>
                <input
                  type="range"
                  min="1"
                  max={selectedFeedRemaining}
                  value={formData.quantity}
                  name="quantity"
                  onChange={handleChange}
                  className="w-full accent-btn-blue"
                  required
                />
                <div className="flex justify-between">
                  <span className="text-sm">{formData.quantity} {feedUnit}</span>
                  <span className="text-sm">Max: {selectedFeedRemaining} {feedUnit}</span>
                </div>
              </div>

              {/* Feeding Times */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold">Feeding Times <span className="text-red-500">*</span></label>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input
                    type="datetime-local"
                    value={newFeedingTime}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setNewFeedingTime(e.target.value)}
                    className={`flex-1 p-2 rounded-lg border ${darkMode ? "bg-dark-card border-dark-gray text-dark-text" : "bg-white border-gray-300 text-gray-800"}`}
                  />
                  <button type="button" onClick={handleAddFeedingTime} className={`px-4 py-2 rounded-lg ${darkMode ? "bg-btn-blue hover:bg-btn-blue/80 text-dark-text" : "bg-btn-blue hover:bg-btn-blue/80 text-white"} sm:w-auto w-full`}>
                    ➕ Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.feedingTimes.map((time, idx) => (
                    <span key={idx} className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${darkMode ? "bg-btn-blue/30 text-dark-text" : "bg-blue-100 text-blue-800"}`}>
                      {new Date(time).toLocaleString()}
                      <button type="button" onClick={() => handleRemoveFeedingTime(idx)} className="text-btn-red hover:scale-125">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-semibold">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className={`p-2 rounded-lg border ${darkMode ? "bg-dark-card border-dark-gray text-dark-text" : "bg-white border-gray-300 text-gray-800"}`}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 md:col-span-2 flex-wrap">
                <button type="submit" disabled={loading} className={`px-5 py-2 rounded-lg font-semibold ${darkMode ? "bg-btn-teal hover:bg-btn-teal/80 text-white" : "bg-btn-teal hover:bg-btn-teal/80 text-white"} flex-1 sm:flex-none disabled:opacity-50`}>
                  {loading ? "⏳ Processing..." : "💾 Save Schedule"}
                </button>
                <button type="button" onClick={handleFeedNow} disabled={loading} className={`px-5 py-2 rounded-lg font-semibold ${darkMode ? "bg-btn-yellow hover:bg-btn-yellow/80 text-dark-text" : "bg-btn-yellow hover:bg-btn-yellow/80 text-white"} flex-1 sm:flex-none disabled:opacity-50`}>
                  {loading ? "⏳ Processing..." : "⚡ Feed Now"}
                </button>
                <button type="button" onClick={() => setShowHistory(true)} className={`px-5 py-2 rounded-lg font-semibold ${darkMode ? "bg-btn-blue hover:bg-btn-blue/80 text-dark-text" : "bg-btn-blue hover:bg-btn-blue/80 text-white"} flex-1 sm:flex-none`}>
                  📜 Feeding History
                </button>
              </div>

            </form>

            {/* Weight Display */}
            <div className={`mt-6 p-4 rounded-lg flex items-center gap-2 ${darkMode ? "bg-dark-green/70 text-dark-text" : "bg-blue-100 text-blue-800"}`}>
              {currentWeight !== null ? (
                <p>⚖️ Current Weight: {currentWeight} {feedUnit}</p>
              ) : (
                <p>⚖️ Loading current weight...</p>
              )}
            </div>

            {/* History Modal */}
            {showHistory && (
              <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowHistory(false)}>
                <div className={`w-11/12 max-w-5xl max-h-[80vh] overflow-y-auto rounded-xl shadow-card p-4 ${darkMode ? "bg-dark-card text-dark-text" : "bg-light-beige text-gray-800"}`} onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-gray-300 dark:border-dark-gray pb-2 mb-4 sticky top-0 bg-inherit">
                    <h3 className="text-xl font-semibold flex items-center gap-2">📜 Feeding History</h3>
                    <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-btn-red text-2xl">×</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className={darkMode ? "bg-dark-gray" : "bg-gray-100"}>
                          <th className="px-3 py-2 text-left">Animal</th>
                          <th className="px-3 py-2 text-left">Feed</th>
                          <th className="px-3 py-2 text-left">Quantity</th>
                          <th className="px-3 py-2 text-left">Time</th>
                          <th className="px-3 py-2 text-left">Notes</th>
                          <th className="px-3 py-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feedingHistory.length > 0 ? (
                          feedingHistory.map((h) => (
                            <tr key={h._id} className={`border-t ${darkMode ? "border-dark-gray hover:bg-dark-gray/50" : "border-gray-200 hover:bg-gray-50"}`}>
                              <td className="px-3 py-2">{h.animalId?.name || "All"} {h.animalId?.breed && `(${h.animalId.breed})`}</td>
                              <td className="px-3 py-2">{h.foodId?.foodName || "Unknown"}</td>
                              <td className="px-3 py-2">{h.quantity} {feedUnit}</td>
                              <td className="px-3 py-2">{h.feedingTime ? new Date(h.feedingTime).toLocaleTimeString() : "-"}</td>
                              <td className="px-3 py-2">{h.notes || "-"}</td>
                              <td className="px-3 py-2">{h.feedingTime ? new Date(h.feedingTime).toLocaleDateString() : "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-3 py-2 text-center">No history found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
