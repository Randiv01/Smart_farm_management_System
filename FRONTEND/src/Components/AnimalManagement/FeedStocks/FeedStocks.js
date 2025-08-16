import React, { useState, useEffect } from "react";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import "./FeedStocks.css";
import { useTheme } from "../contexts/ThemeContext.js";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function FeedStocks() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feedStocks, setFeedStocks] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ targetAnimal: "", addedDate: "", expiryDate: "" });
  const [newFeedRow, setNewFeedRow] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileNumber, setMobileNumber] = useState("");
  const [showChart, setShowChart] = useState(false);
  const [refillModal, setRefillModal] = useState({ open: false, feed: null, quantity: "" });

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  const [newFeed, setNewFeed] = useState({
    foodName: "",
    quantity: "",
    unit: "kg",
    targetAnimal: "",
    addDate: "",
    expiryDate: "",
    notes: "",
    supId: "",
  });

  useEffect(() => {
    document.title = "Feed Stocks";
    fetchFeedStocks();
  }, []);

  const fetchFeedStocks = async () => {
    try {
      const res = await fetch("http://localhost:5000/feed-stocks");
      const data = await res.json();
      setFeedStocks(data || []);

      const today = new Date();
      const expiryThreshold = new Date();
      expiryThreshold.setDate(today.getDate() + 15);

      const expiringFeeds = data.filter(feed => {
        if (!feed.expiryDate) return false;
        const expiryDate = new Date(feed.expiryDate);
        return expiryDate <= expiryThreshold;
      });

      if (expiringFeeds.length > 0) {
        const alert = {
          id: Date.now(),
          message: `${expiringFeeds.length} feed(s) expiring within 15 days!`,
        };
        setNotifications(prev => [alert, ...prev]);
      }
    } catch (err) {
      console.error("Error fetching feed stocks:", err);
    }
  };

  const sendAlert = (foodName, reduction) => {
    const alert = {
      id: Date.now(),
      message: `${foodName} reduced by ${reduction} units (${(reduction / Number(feedStocks.find(f => f.foodName === foodName).quantity)) * 100}%)!`,
    };
    setNotifications(prev => [alert, ...prev]);
  };

  const handleInlineChange = (id, field, value) => {
    setFeedStocks(prev =>
      prev.map(feed => (feed._id === id ? { ...feed, [field]: value } : feed))
    );
  };

  const handleUpdate = async feed => {
    try {
      const previousFeed = feedStocks.find(f => f._id === feed._id);
      const oldQty = Number(previousFeed.quantity);
      const newQty = Number(feed.quantity);
      const reduction = oldQty - newQty;

      if (reduction > 0 && reduction / oldQty > 0.1) {
        sendAlert(feed.foodName, reduction);
      }

      const res = await fetch(`http://localhost:5000/feed-stocks/${feed._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feed),
      });
      if (!res.ok) throw new Error("Failed to update feed stock");
      setMessage({ text: "✅ Feed stock updated!", type: "success" });
      fetchFeedStocks();
    } catch (err) {
      setMessage({ text: "❌ " + err.message, type: "error" });
    }
  };

  const handleDelete = async id => {
    if (!window.confirm("Are you sure you want to delete this feed stock?")) return;
    try {
      const res = await fetch(`http://localhost:5000/feed-stocks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete feed stock");
      setMessage({ text: "✅ Feed stock deleted!", type: "success" });
      fetchFeedStocks();
    } catch (err) {
      setMessage({ text: "❌ " + err.message, type: "error" });
    }
  };

  const handleAddNewFeed = async newFeed => {
    try {
      const res = await fetch("http://localhost:5000/feed-stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFeed),
      });
      if (!res.ok) throw new Error("Failed to add feed stock");
      setMessage({ text: "✅ Feed stock added!", type: "success" });
      setNewFeedRow(false);
      setNewFeed({
        foodName: "",
        quantity: "",
        unit: "kg",
        targetAnimal: "",
        addDate: "",
        expiryDate: "",
        notes: "",
        supId: "",
      });
      fetchFeedStocks();
    } catch (err) {
      setMessage({ text: "❌ " + err.message, type: "error" });
    }
  };

 const handleRefill = async () => {
  if (!refillModal.quantity) return;

  const newRemaining = Number(refillModal.feed.remaining) + Number(refillModal.quantity);

  const updatedFeed = { ...refillModal.feed, remaining: newRemaining };

  try {
    const res = await fetch(`http://localhost:5000/feed-stocks/${refillModal.feed._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFeed),
    });
    if (!res.ok) throw new Error("Failed to refill feed stock");

    setMessage({ text: "✅ Feed stock refilled!", type: "success" });
    fetchFeedStocks();
    setRefillModal({ open: false, feed: null, quantity: "" });
  } catch (err) {
    setMessage({ text: "❌ " + err.message, type: "error" });
  }
};


  const saveMobileNumber = () => {
    if (mobileNumber) {
      setMessage({ text: "✅ Mobile number saved!", type: "success" });
      // TODO: Save to backend
    }
  };

  const filteredFeeds = feedStocks.filter(feed => {
    const matchesFoodName = feed.foodName.toLowerCase().includes(search.toLowerCase());
    const matchesTarget = filter.targetAnimal
      ? feed.targetAnimal?.toLowerCase().includes(filter.targetAnimal.toLowerCase())
      : true;
    const matchesAddedDate = filter.addedDate ? feed.addDate?.slice(0, 10) === filter.addedDate : true;
    const matchesExpiryDate = filter.expiryDate ? feed.expiryDate?.slice(0, 10) === filter.expiryDate : true;
    return matchesFoodName && matchesTarget && matchesAddedDate && matchesExpiryDate;
  });

  const pieData = {
    labels: feedStocks.map(f => f.foodName),
    datasets: [
      {
        data: feedStocks.map(f => Number(f.quantity)),
        backgroundColor: feedStocks.map((_, i) => `hsl(${i * 50}, 70%, 50%)`),
        hoverOffset: 10,
      },
    ],
  };

  return (
    <div className={`feedstocks-page ${darkMode ? "dark" : ""}`}>
      <Sidebar sidebarOpen={sidebarOpen} />
      <TopNavbar sidebarOpen={sidebarOpen} notifications={notifications} onMenuClick={handleMenuClick} />

      <main className="main-content">
        <div className={`feedstocks-container ${darkMode ? "dark" : ""}`}>
          <h2>🛒 Feed Stocks</h2>

          <div className="notification-settings">
            <input
              type="tel"
              placeholder="📱 mobile"
              value={mobileNumber}
              onChange={e => setMobileNumber(e.target.value)}
              className={darkMode ? "dark" : ""}
            />
            <button onClick={saveMobileNumber} className={`btn-fsave ${darkMode ? "dark" : ""}`}>
              💾 Save
            </button>
          </div>

          <div className="filters">
            <input
              type="text"
              placeholder="🔍 Search by food name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={darkMode ? "dark" : ""}
            />
            <input
              type="text"
              placeholder="Target Animal"
              value={filter.targetAnimal}
              onChange={e => setFilter({ ...filter, targetAnimal: e.target.value })}
              className={darkMode ? "dark" : ""}
            />
            <input
              type="date"
              placeholder="Added Date"
              value={filter.addedDate}
              onChange={e => setFilter({ ...filter, addedDate: e.target.value })}
              className={darkMode ? "dark" : ""}
            />
            <input
              type="date"
              placeholder="Expiry Date"
              value={filter.expiryDate}
              onChange={e => setFilter({ ...filter, expiryDate: e.target.value })}
              className={darkMode ? "dark" : ""}
            />
          </div>

          {message.text && <div className={`popup ${message.type === "success" ? "success" : "error"}`}>{message.text}</div>}

          <div className="action-buttons">
            {!newFeedRow && (
              <button className={`btn-fsave ${darkMode ? "dark" : ""}`} onClick={() => setNewFeedRow(true)}>
                ➕ Add New Feed
              </button>
            )}
            <button className={`btn-fsave ${darkMode ? "dark" : ""}`} onClick={() => setShowChart(!showChart)}>
              {showChart ? "Hide" : "Show"} Overall Stock Chart
            </button>
          </div>

          {/* Table with Supplier ID */}
          <div className="feedstock-list">
            {filteredFeeds.length === 0 && !newFeedRow ? (
              <p>No feed stocks available.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Food Name</th>
                    <th>Quantity</th>
                    <th>Remaining</th>
                    <th>Unit</th>
                    <th>Target Animal</th>
                    <th>Expiry Date</th>
                    <th>Sup ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* New Feed Row */}
                  {newFeedRow && (
                    <tr>
                      <td><input value={newFeed.foodName} onChange={e => setNewFeed({ ...newFeed, foodName: e.target.value })} /></td>
                      <td><input type="number" value={newFeed.quantity} onChange={e => setNewFeed({ ...newFeed, quantity: e.target.value })} /></td>
                      <td>-</td>
                      <td>
                        <select value={newFeed.unit} onChange={e => setNewFeed({ ...newFeed, unit: e.target.value })}>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="lb">lb</option>
                        </select>
                      </td>
                      <td><input value={newFeed.targetAnimal} onChange={e => setNewFeed({ ...newFeed, targetAnimal: e.target.value })} /></td>
                      <td><input type="date" value={newFeed.expiryDate} onChange={e => setNewFeed({ ...newFeed, expiryDate: e.target.value })} /></td>
                      <td><input value={newFeed.supId} onChange={e => setNewFeed({ ...newFeed, supId: e.target.value })} /></td>
                      <td>
                        <button className="btn-feedupdate" onClick={() => handleAddNewFeed(newFeed)}>💾</button>
                        <button className="btn-feeddelete" onClick={() => setNewFeedRow(false)}>❌</button>
                      </td>
                    </tr>
                  )}

                  {/* Existing Feed Rows */}
                  {filteredFeeds.map(feed => {
                    const previousFeed = feedStocks.find(f => f._id === feed._id);
                    const reduction = previousFeed ? Number(previousFeed.quantity) - Number(feed.quantity) : 0;

                    return (
                        <tr key={feed._id}>
                        <td>
                            <input
                            value={feed.foodName}
                            onChange={e => handleInlineChange(feed._id, "foodName", e.target.value)}
                            />
                        </td>
                        <td>
                            <input
                            value={feed.quantity}
                            readOnly
                            />
                        </td>
                        <td>
                            <input
                            value={feed.remaining}
                            readOnly
                            />
                        </td>
                        <td>
                            <select
                            value={feed.unit}
                            onChange={e => handleInlineChange(feed._id, "unit", e.target.value)}
                            >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="lb">lb</option>
                            </select>
                        </td>
                        <td>
                            <input
                            value={feed.targetAnimal || ""}
                            onChange={e => handleInlineChange(feed._id, "targetAnimal", e.target.value)}
                            />
                        </td>
                        <td>
                            <input
                            type="date"
                            value={feed.expiryDate?.slice(0,10) || ""}
                            onChange={e => handleInlineChange(feed._id, "expiryDate", e.target.value)}
                            />
                        </td>
                        <td>{feed.supId || "-"}</td>
                        <td>
                            <button className="btn-feedupdate" onClick={() => setRefillModal({ open: true, feed, quantity: "" })}>
                            Refill
                            </button>
                            <button className="btn-feedupdate" onClick={() => handleUpdate(feed)}>💾</button>
                            <button className="btn-feeddelete" onClick={() => handleDelete(feed._id)}>🗑️</button>
                        </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Refill Modal - always at the end of page */}
            {refillModal.open && (
            <div className="modal-backdrop">
                <div className="modal">
                <h3>Refill {refillModal.feed.foodName}</h3>
                <input
                    type="number"
                    placeholder="Enter refill quantity"
                    value={refillModal.quantity}
                    onChange={e => setRefillModal({ ...refillModal, quantity: e.target.value })}
                    autoFocus
                />
                <div className="modal-actions">
                    <button onClick={handleRefill}>💾 Save</button>
                    <button onClick={() => setRefillModal({ open: false, feed: null, quantity: "" })}>❌ Cancel</button>
                </div>
                </div>
            </div>
            )}

          {/* Pie Chart */}
          {showChart && (
            <div style={{ maxWidth: "500px", marginTop: "2rem" }}>
              <h3>Feed Stock Distribution</h3>
              <Pie data={pieData} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
