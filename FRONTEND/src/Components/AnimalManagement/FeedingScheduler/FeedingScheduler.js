import React, { useState, useEffect } from "react";
import axios from "axios";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import "./FeedingScheduler.css";
import { useTheme } from '../contexts/ThemeContext.js';

export default function FeedingScheduler() {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [animals, setAnimals] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [feedingHistory, setFeedingHistory] = useState([]);
  const [formData, setFormData] = useState({
    animalId: "",
    foodType: "",
    quantity: 0,
    feedingTimes: [], // multiple feeding times
    notes: "",
  });
  const [selectedFeedRemaining, setSelectedFeedRemaining] = useState(0);
  const [message, setMessage] = useState("");
  const [currentWeight, setCurrentWeight] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [newFeedingTime, setNewFeedingTime] = useState("");

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  

  // Fetch data on component mount
  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const res = await axios.get("http://localhost:5000/animal-types");
        setAnimals(res.data || []);
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

  // fetch current weight from Arduino/ESP32
  useEffect(() => {
    const esp32Ip = "192.168.1.10";
    const fetchWeight = async () => {
      try {
        const res = await fetch(`http://${esp32Ip}/weight`);
        const text = await res.text();
        setCurrentWeight(text);
      } catch (err) { 
        setCurrentWeight(null); 
      }
    };
    fetchWeight();
    const interval = setInterval(fetchWeight, 1000);
    return () => clearInterval(interval);
  }, []);

  // update remaining max for selected feed
  useEffect(() => {
    const selectedFeed = feeds.find(f => f.foodName === formData.foodType);
    setSelectedFeedRemaining(selectedFeed ? Number(selectedFeed.remaining || selectedFeed.quantity) : 0);
  }, [formData.foodType, feeds]);

  const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddFeedingTime = () => {
    if (!newFeedingTime) return;
    setFormData(prev => ({ ...prev, feedingTimes: [...prev.feedingTimes, newFeedingTime] }));
    setNewFeedingTime("");
  };

  const handleRemoveFeedingTime = (index) => {
    setFormData(prev => ({
      ...prev,
      feedingTimes: prev.feedingTimes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage("");

    if (!formData.animalId || !formData.foodType || !formData.quantity || formData.feedingTimes.length === 0) {
      setMessage("⚠ Please fill all required fields.");
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
      setFormData({ animalId: "", foodType: "", quantity: 0, feedingTimes: [], notes: "" });
      const historyRes = await fetch("http://localhost:5000/feeding-history");
      const historyData = await historyRes.json();
      setFeedingHistory(historyData || []);
    } catch (err) { 
      setMessage("❌ " + err.message); 
    }
  };

  const handleFeedNow = async () => {
    setMessage("");
    if (!formData.animalId || !formData.quantity || Number(formData.quantity) <= 0) {
      setMessage("⚠ Please select animal and enter valid quantity.");
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
      
      // Refresh history after feeding
      const historyRes = await fetch("http://localhost:5000/feeding-history");
      const historyData = await historyRes.json();
      setFeedingHistory(historyData || []);
    } catch (err) { 
      setMessage("❌ Failed to trigger feeding: " + err.message); 
    }
  };

  return (
    <div className={`feeding-page ${darkMode ? "dark" : ""}`}>
      <Sidebar sidebarOpen={sidebarOpen} />
      <TopNavbar sidebarOpen={sidebarOpen} onMenuClick={handleMenuClick} />
      <main className="main-content">
        <div className={`feeding-container ${darkMode ? "dark" : ""}`}>
          <h2>🐄 Feeding Scheduler</h2>
          
          {message && (
            <div className={`form-message ${message.includes("✅") ? "success" : "error"}`}>
              {message}
            </div>
          )}

          <form className="feeding-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Animal <span className="required">*</span></label>
              <select 
                name="animalId" 
                value={formData.animalId} 
                onChange={handleChange}
                className={darkMode ? "dark" : ""}
              >
                <option value="">-- Select Animal --</option>
                <option value="all">Select All</option>
                {animals.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.name} 
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Food Type <span className="required">*</span></label>
              <select 
                name="foodType" 
                value={formData.foodType} 
                onChange={handleChange}
                className={darkMode ? "dark" : ""}
              >
                <option value="">-- Select Feed --</option>
                {feeds.map(f => (
                  <option key={f._id} value={f.foodName}>
                    {f.foodName} ({f.remaining} {f.unit} remaining)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quantity (grams) <span className="required">*</span></label>
              <div className="quantity-control">
                <input
                  type="range"
                  min="1"
                  max={selectedFeedRemaining}
                  value={formData.quantity}
                  name="quantity"
                  onChange={handleChange}
                />
                <span className="quantity-value">
                  {formData.quantity} g (max {selectedFeedRemaining})
                </span>
              </div>
            </div>

            <div className="form-group">
                <label>
                  Feeding Times <span className="required">*</span>
                </label>

                {/* Time input & add button */}
                <div className="time-input-group">
                  <input
                    type="datetime-local"
                    value={newFeedingTime}
                    min={new Date().toISOString().slice(0, 16)} // prevent past times
                    onChange={e => setNewFeedingTime(e.target.value)}
                    className={`time-input ${darkMode ? "dark" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={handleAddFeedingTime}
                    className={`btn-add-time ${darkMode ? "dark" : ""}`}
                  >
                    ➕ Add
                  </button>
                </div>

                {/* List of added times */}
                {formData.feedingTimes.length > 0 && (
                  <div className="time-tags">
                    {formData.feedingTimes.map((time, idx) => (
                      <span key={idx} className="time-tag">
                        {new Date(time).toLocaleString()} {/* nicely formatted */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeedingTime(idx)}
                          className="btn-remove-time"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>


            <div className="form-group">
              <label>Notes</label>
              <textarea 
                name="notes" 
                value={formData.notes} 
                onChange={handleChange}
                className={darkMode ? "dark" : ""}
              />
            </div>

            <div className="feeding-buttons">
              <button type="submit" className={`btn-save ${darkMode ? "dark" : ""}`}>
                💾 Save Schedule
              </button>
              <button 
                type="button" 
                onClick={handleFeedNow}
                className={`btn-feed-now ${darkMode ? "dark" : ""}`}
              >
                ⚡ Feed Now
              </button>
              <button 
                type="button" 
                onClick={() => setShowHistory(true)}
                className={`btn-history ${darkMode ? "dark" : ""}`}
              >
                📜 Feeding History
              </button>
            </div>
          </form>

          <div className={`weight-display ${darkMode ? "dark" : ""}`}>
            {currentWeight !== null ? (
              <p>⚖️ Current Weight: {currentWeight} grams</p>
            ) : (
              <p>⚖️ Loading current weight...</p>
            )}
          </div>

          {showHistory && (
            <div className="modal-backdrop" onClick={() => setShowHistory(false)}>
              <div className={`modal ${darkMode ? "dark" : ""}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>📜 Feeding History</h3>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className={`btn-close ${darkMode ? "dark" : ""}`}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-content">
                  <table>
                    <thead>
                      <tr>
                        <th>Animal</th>
                        <th>Feed</th>
                        <th>Quantity</th>
                        <th>Times</th>
                        <th>Notes</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedingHistory.length > 0 ? (
                        feedingHistory.map((h, idx) => (
                          <tr key={idx}>
                            <td>{h.animalName || "All"}</td>
                            <td>{h.foodType}</td>
                            <td>{h.quantity} g</td>
                            <td>{h.feedingTimes?.join(", ") || "-"}</td>
                            <td>{h.notes || "-"}</td>
                            <td>{new Date(h.createdAt).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="no-history">
                            No feeding history available
                          </td>
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
  );
}