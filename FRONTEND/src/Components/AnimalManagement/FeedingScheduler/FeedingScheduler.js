import React, { useState, useEffect } from "react";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import "./FeedingScheduler.css";
import { useTheme } from '../contexts/ThemeContext.js';

export default function FeedingScheduler() {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [animals, setAnimals] = useState([]);
  const [formData, setFormData] = useState({
    animalId: "",
    foodType: "",
    quantity: "", // in grams
    feedingTime: "",
    notes: "",
  });
  const [message, setMessage] = useState("");
  const [currentWeight, setCurrentWeight] = useState(null);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    // Fetch animals list from backend API
    const fetchAnimals = async () => {
      try {
        const res = await fetch("http://localhost:5000/animals");
        const data = await res.json();
        setAnimals(data || []);
      } catch (err) {
        console.error("Error fetching animals:", err);
      }
    };
    fetchAnimals();
  }, []);

  useEffect(() => {
    // Fetch current weight from ESP32 every 1 second
    const esp32Ip = "192.168.1.10"; // Change to your ESP32 IP
    const fetchWeight = async () => {
      try {
        const res = await fetch(`http://${esp32Ip}/weight`);
        const text = await res.text();
        setCurrentWeight(text);
      } catch (err) {
        console.error("Failed to fetch weight:", err);
        setCurrentWeight(null);
      }
    };

    fetchWeight();
    const intervalId = setInterval(fetchWeight, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (
      !formData.animalId ||
      !formData.foodType ||
      !formData.quantity ||
      !formData.feedingTime
    ) {
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
      setFormData({
        animalId: "",
        foodType: "",
        quantity: "",
        feedingTime: "",
        notes: "",
      });
    } catch (err) {
      setMessage("❌ " + err.message);
    }
  };

  const handleFeedNow = async () => {
    setMessage("");

    if (!formData.animalId) {
      setMessage("⚠ Please select an animal or 'Select All'.");
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setMessage("⚠ Please enter a valid feeding quantity in grams.");
      return;
    }

    try {
      const esp32Ip = "192.168.1.10"; // Change to your ESP32 IP

      const res = await fetch(`http://${esp32Ip}/feed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: Number(formData.quantity), // grams as number
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`ESP32 error: ${res.status} ${errorText}`);
      }

      const data = await res.text();
      setMessage("✅ Feeding triggered! Response: " + data);
    } catch (err) {
      setMessage("❌ Failed to trigger feeding: " + err.message);
    }
  };

  const handleCheckHistory = () => {
    window.location.href = "/feeding-history";
  };

  return (
    <div className={`feeding-page ${darkMode ? "dark" : ""}`}>
       <Sidebar sidebarOpen={sidebarOpen} />
       <TopNavbar onMenuClick={handleMenuClick} />

      <main className="main-content">
        <div className={`feeding-container ${darkMode ? "dark" : ""}`}>
          <h2>🐄 Feeding Scheduler</h2>

          {message && <p className="form-message">{message}</p>}

          <form className="feeding-form" onSubmit={handleSubmit}>
            <label>
              Animal <span className="required">*</span>
            </label>
            <select
              name="animalId"
              value={formData.animalId}
              onChange={handleChange}
              className={darkMode ? "dark" : ""}
            >
              <option value="">-- Select Animal --</option>
              <option value="all">Select All</option>
              {animals.map((animal) => (
                <option key={animal._id} value={animal._id}>
                  {animal.name} ({animal.breed})
                </option>
              ))}
            </select>

            <label>
              Food Type <span className="required">*</span>
            </label>
            <input
              type="text"
              name="foodType"
              placeholder="Enter food type"
              value={formData.foodType}
              onChange={handleChange}
              className={darkMode ? "dark" : ""}
            />

            <label>
              Quantity (grams) <span className="required">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              placeholder="Enter quantity in grams"
              value={formData.quantity}
              onChange={handleChange}
              className={darkMode ? "dark" : ""}
              min="1"
            />

            <label>
              Feeding Time <span className="required">*</span>
            </label>
            <input
              type="datetime-local"
              name="feedingTime"
              value={formData.feedingTime}
              onChange={handleChange}
              className={darkMode ? "dark" : ""}
            />

            <label>Notes</label>
            <textarea
              name="notes"
              placeholder="Any special instructions?"
              value={formData.notes}
              onChange={handleChange}
              className={darkMode ? "dark" : ""}
            />

            <div className="feeding-buttons">
              <button type="submit" className={`btn-save ${darkMode ? "dark" : ""}`}>
                💾 Save Schedule
              </button>
              <button
                type="button"
                className={`btn-feed-now ${darkMode ? "dark" : ""}`}
                onClick={handleFeedNow}
              >
                ⚡ Feed Now
              </button>
              <button
                type="button"
                className={`btn-history ${darkMode ? "dark" : ""}`}
                onClick={handleCheckHistory}
              >
                📜 Feeding History
              </button>
            </div>
          </form>

          <div className="weight-display">
            {currentWeight !== null ? (
              <p>⚖️ Current Weight: {currentWeight} grams</p>
            ) : (
              <p>Loading current weight...</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
