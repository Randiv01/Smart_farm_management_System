import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useTheme } from "../contexts/ThemeContext.js";
import { useLoader } from "../contexts/LoaderContext.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function FeedStocks() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading } = useLoader();

  const [feedStocks, setFeedStocks] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ targetAnimal: "", expiryDate: "" });
  const [newFeedRow, setNewFeedRow] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [refillModal, setRefillModal] = useState({ open: false, feed: null, quantity: "" });
  const [editModal, setEditModal] = useState({ open: false, feed: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, feed: null });
  const [mobileNumber, setMobileNumber] = useState("");

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
    document.title = "Feed Stocks Management";
    fetchFeedStocks();
  }, []);

  const fetchFeedStocks = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/feed-stocks");
      const data = await res.json();
      setFeedStocks(data || []);
    } catch (err) {
      showMessage("❌ Failed to fetch feed stocks", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type }), 2500);
  };

  const validateFeed = feed => {
    if (!feed.foodName || !feed.quantity || Number(feed.quantity) <= 0 || !feed.unit || !feed.targetAnimal || !feed.expiryDate) {
      showMessage("❌ Fill all fields correctly", "error");
      return false;
    }
    return true;
  };

  const handleAddNewFeed = async feed => {
    if (!validateFeed(feed)) return;
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/feed-stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feed),
      });
      if (!res.ok) throw new Error("Failed to add feed stock");
      showMessage("✅ Feed stock added!", "success");
      setNewFeedRow(false);
      setNewFeed({ foodName: "", quantity: "", unit: "kg", targetAnimal: "", addDate: "", expiryDate: "", notes: "", supId: "" });
      fetchFeedStocks();
    } catch (err) {
      showMessage("❌ " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeed = async feed => {
    if (!validateFeed(feed)) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/feed-stocks/${feed._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feed),
      });
      if (!res.ok) throw new Error("Failed to update feed stock");
      showMessage("✅ Feed stock updated!", "success");
      fetchFeedStocks();
      setEditModal({ open: false, feed: null });
    } catch (err) {
      showMessage("❌ " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const feed = deleteModal.feed;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/feed-stocks/${feed._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete feed stock");
      showMessage("✅ Feed stock deleted!", "success");
      fetchFeedStocks();
      setDeleteModal({ open: false, feed: null });
    } catch (err) {
      showMessage("❌ " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRefill = async () => {
    if (!refillModal.quantity || Number(refillModal.quantity) <= 0) return showMessage("❌ Enter valid quantity", "error");
    const updatedFeed = { ...refillModal.feed, remaining: Number(refillModal.feed.remaining) + Number(refillModal.quantity) };
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/feed-stocks/${refillModal.feed._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFeed),
      });
      if (!res.ok) throw new Error("Failed to refill feed stock");
      showMessage("✅ Feed stock refilled!", "success");
      fetchFeedStocks();
      setRefillModal({ open: false, feed: null, quantity: "" });
    } catch (err) {
      showMessage("❌ " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const saveMobileNumber = () => {
    if (!mobileNumber) return showMessage("❌ Enter mobile number", "error");
    showMessage("✅ Mobile number saved!", "success");
  };

  const filteredFeeds = feedStocks.filter(feed => {
    const matchesFoodName = feed.foodName.toLowerCase().includes(search.toLowerCase());
    const matchesTarget = filter.targetAnimal ? feed.targetAnimal?.toLowerCase().includes(filter.targetAnimal.toLowerCase()) : true;
    const matchesExpiryDate = filter.expiryDate ? feed.expiryDate?.slice(0,10) === filter.expiryDate : true;
    return matchesFoodName && matchesTarget && matchesExpiryDate;
  });

  const pieOptions = {
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          boxWidth: 20,
          padding: 15,
          color: darkMode ? "#fff" : "#333",
          font: {
            size: 12
          }
        },
      },
      tooltip: {
        backgroundColor: darkMode ? "#2D3748" : "#fff",
        titleColor: darkMode ? "#fff" : "#333",
        bodyColor: darkMode ? "#fff" : "#333",
        borderColor: darkMode ? "#4A5568" : "#E2E8F0",
        borderWidth: 1,
      }
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  const pieData = {
    labels: filteredFeeds.map(f => f.foodName),
    datasets: [
      { 
        data: filteredFeeds.map(f => Number(f.quantity)), 
        backgroundColor: filteredFeeds.map((_, i) => `hsl(${i*50},70%,50%)`), 
        hoverOffset: 10,
        borderColor: darkMode ? "#1A202C" : "#fff",
        borderWidth: 1
      }
    ]
  };

  return (
    <div className={`h-full ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-800"}`}>
      {message.text && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg ${
          message.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        } animate-popIn`}>
          {message.text}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white dark:bg-dark-card p-2 rounded-lg shadow-sm">
            <input 
              type="tel" 
              placeholder="📱 Mobile Number" 
              value={mobileNumber} 
              onChange={e => setMobileNumber(e.target.value)} 
              className={`px-3 py-2 rounded border w-full ${
                darkMode ? "bg-dark-card border-gray-600 text-dark-text" : "bg-white border-gray-300 text-gray-800"
              }`} 
            />
            <button 
              onClick={saveMobileNumber} 
              className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700 transition whitespace-nowrap"
            >
              Save Number
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button 
            onClick={() => setNewFeedRow(!newFeedRow)} 
            className={`px-4 py-2 rounded text-white hover:bg-green-700 transition flex items-center justify-center gap-2 ${
              newFeedRow ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {newFeedRow ? (
              <>
                <span>❌ Cancel</span>
              </>
            ) : (
              <>
                <span>➕</span>
                <span>Add New Feed</span>
              </>
            )}
          </button>
          <button 
            onClick={() => setShowChart(!showChart)} 
            className="bg-yellow-500 px-4 py-2 rounded text-white hover:bg-yellow-600 transition flex items-center justify-center gap-2"
          >
            {showChart ? (
              <>
                <span>👁️</span>
                <span>Hide Chart</span>
              </>
            ) : (
              <>
                <span>📊</span>
                <span>Show Chart</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chart Section */}
      {showChart && (
        <div className={`mb-6 p-4 rounded-2xl shadow-lg ${
          darkMode ? "bg-dark-card" : "bg-white"
        } w-full h-64 md:h-80 lg:h-96`}>
          <h3 className="font-semibold mb-4 text-lg">Feed Stock Distribution</h3>
          <div className="w-full h-[calc(100%-2rem)]">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <div className="col-span-1 sm:col-span-2 md:col-span-1">
          <input 
            type="text" 
            placeholder="🔍 Search food name..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className={`px-3 py-2 rounded border w-full ${
              darkMode ? "bg-dark-card border-gray-600 text-dark-text" : "bg-white border-gray-300 text-gray-800"
            }`} 
          />
        </div>
        <div>
          <input 
            type="text" 
            placeholder="🐄 Target Animal" 
            value={filter.targetAnimal} 
            onChange={e => setFilter({...filter, targetAnimal: e.target.value})}
            className={`px-3 py-2 rounded border w-full ${
              darkMode ? "bg-dark-card border-gray-600 text-dark-text" : "bg-white border-gray-300 text-gray-800"
            }`} 
          />
        </div>
        <div>
          <input 
            type="date" 
            placeholder="📅 Expiry Date" 
            value={filter.expiryDate} 
            onChange={e => setFilter({...filter, expiryDate: e.target.value})}
            className={`px-3 py-2 rounded border w-full ${
              darkMode ? "bg-dark-card border-gray-600 text-dark-text" : "bg-white border-gray-300 text-gray-800"
            }`} 
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto rounded-lg shadow-lg">
        <table className={`min-w-full ${darkMode ? "bg-dark-card text-dark-text" : "bg-white text-gray-800"}`}>
          <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <tr>
              <th className="px-4 py-3 text-left">Food Name</th>
              <th className="px-4 py-3 text-center">Quantity</th>
              <th className="px-4 py-3 text-center">Remaining</th>
              <th className="px-4 py-3 text-center">Unit</th>
              <th className="px-4 py-3 text-center">Target Animal</th>
              <th className="px-4 py-3 text-center">Expiry Date</th>
              <th className="px-4 py-3 text-center">Supplier ID</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {newFeedRow && (
              <tr className={`${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100"}`}>
                <td className="px-4 py-3">
                  <input 
                    value={newFeed.foodName} 
                    onChange={e => setNewFeed({ ...newFeed, foodName: e.target.value })} 
                    placeholder="Feed name"
                    className={`px-2 py-1 w-full rounded border ${
                      darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                    }`}
                  />
                </td>
                <td className="px-4 py-3">
                  <input 
                    type="number" 
                    value={newFeed.quantity} 
                    onChange={e => setNewFeed({ ...newFeed, quantity: e.target.value })} 
                    placeholder="Qty"
                    className={`px-2 py-1 w-full rounded border ${
                      darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                    }`}
                  />
                </td>
                <td className="px-4 py-3 text-center">-</td>
                <td className="px-4 py-3">
                  <select 
                    value={newFeed.unit} 
                    onChange={e => setNewFeed({ ...newFeed, unit: e.target.value })} 
                    className={`px-2 py-1 w-full rounded border ${
                      darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input 
                    value={newFeed.targetAnimal} 
                    onChange={e => setNewFeed({ ...newFeed, targetAnimal: e.target.value })} 
                    placeholder="Animal"
                    className={`px-2 py-1 w-full rounded border ${
                      darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                    }`}
                  />
                </td>
                <td className="px-4 py-3">
                  <input 
                    type="date" 
                    value={newFeed.expiryDate} 
                    onChange={e => setNewFeed({ ...newFeed, expiryDate: e.target.value })} 
                    className={`px-2 py-1 w-full rounded border ${
                      darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                    }`}
                  />
                </td>
                <td className="px-4 py-3">
                  <input 
                    value={newFeed.supId} 
                    onChange={e => setNewFeed({ ...newFeed, supId: e.target.value })} 
                    placeholder="Supplier ID"
                    className={`px-2 py-1 w-full rounded border ${
                      darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                    }`}
                  />
                </td>
                <td className="px-4 py-3 flex gap-2 justify-center">
                  <button 
                    onClick={() => handleAddNewFeed(newFeed)} 
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition flex items-center gap-1"
                  >
                    <span>💾</span>
                    <span className="hidden sm:inline">Save</span>
                  </button>
                  <button 
                    onClick={() => setNewFeedRow(false)} 
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition flex items-center gap-1"
                  >
                    <span>❌</span>
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                </td>
              </tr>
            )}

            {filteredFeeds.length > 0 ? (
              filteredFeeds.map(feed => (
                <tr 
                  key={feed._id} 
                  className={`${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                >
                  <td className="px-4 py-3 font-medium">{feed.foodName}</td>
                  <td className="px-4 py-3 text-center">{feed.quantity}</td>
                  <td className={`px-4 py-3 text-center font-semibold ${
                    feed.remaining / feed.quantity < 0.2 ? "text-red-500" : 
                    feed.remaining / feed.quantity < 0.5 ? "text-yellow-500" : "text-green-500"
                  }`}>
                    {feed.remaining}
                  </td>
                  <td className="px-4 py-3 text-center">{feed.unit}</td>
                  <td className="px-4 py-3 text-center">{feed.targetAnimal}</td>
                  <td className={`px-4 py-3 text-center ${
                    new Date(feed.expiryDate) < new Date() ? "text-red-500 font-semibold" : ""
                  }`}>
                    {feed.expiryDate?.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-center">{feed.supId || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center flex-wrap">
                      <button 
                        onClick={() => setRefillModal({ open: true, feed, quantity: "" })} 
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition flex items-center gap-1"
                      >
                        <span>🔄</span>
                        <span className="hidden sm:inline">Refill</span>
                      </button>
                      <button 
                        onClick={() => setEditModal({ open: true, feed })} 
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition flex items-center gap-1"
                      >
                        <span>✏️</span>
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button 
                        onClick={() => setDeleteModal({ open: true, feed })} 
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition flex items-center gap-1"
                      >
                        <span>🗑️</span>
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  No feed stocks found. {search && "Try a different search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className={`p-6 rounded-2xl shadow-lg w-full max-w-md mx-4 ${
            darkMode ? "bg-dark-card" : "bg-white"
          } animate-popIn`}>
            <h3 className="font-semibold text-lg mb-4 text-center">
              Delete {deleteModal.feed.foodName}?
            </h3>
            <p className="text-center mb-6 dark:text-gray-300">
              Are you sure you want to permanently delete this feed stock?
            </p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={handleDeleteConfirm} 
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition flex-1 max-w-[120px]"
              >
                Delete
              </button>
              <button 
                onClick={() => setDeleteModal({ open: false, feed: null })} 
                className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500 transition flex-1 max-w-[120px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refill Modal */}
      {refillModal.open && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className={`p-6 rounded-2xl shadow-lg w-full max-w-md mx-4 ${
            darkMode ? "bg-dark-card" : "bg-white"
          } animate-popIn`}>
            <h3 className="font-semibold text-lg mb-2">
              Refill {refillModal.feed.foodName}
            </h3>
            <p className="mb-4 dark:text-gray-300">
              Current stock: {refillModal.feed.remaining} {refillModal.feed.unit}
            </p>
            <div className="mb-6">
              <label className="block mb-2 dark:text-gray-300">Quantity to add:</label>
              <input 
                type="number" 
                placeholder="Enter quantity" 
                value={refillModal.quantity}
                onChange={e => setRefillModal({...refillModal, quantity: e.target.value})}
                className={`px-3 py-2 w-full rounded border ${
                  darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                }`}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setRefillModal({ open: false, feed: null, quantity: "" })} 
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleRefill} 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center gap-1"
              >
                <span>💾</span>
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className={`p-6 rounded-2xl shadow-lg w-full max-w-md mx-4 ${
            darkMode ? "bg-dark-card" : "bg-white"
          } animate-popIn`}>
            <h3 className="font-semibold text-lg mb-4">
              Edit {editModal.feed.foodName}
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block mb-1 dark:text-gray-300">Food Name</label>
                <input 
                  type="text" 
                  placeholder="Food Name" 
                  value={editModal.feed.foodName}
                  onChange={e => setEditModal({...editModal, feed: {...editModal.feed, foodName: e.target.value}})}
                  className={`px-3 py-2 w-full rounded border ${
                    darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                  }`}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 dark:text-gray-300">Quantity</label>
                  <input 
                    type="number" 
                    placeholder="Quantity" 
                    value={editModal.feed.quantity}
                    onChange={e => setEditModal({...editModal, feed: {...editModal.feed, quantity: e.target.value}})}
                    className={`px-3 py-2 w-full rounded border ${
                      darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 dark:text-gray-300">Unit</label>
                  <select 
                    value={editModal.feed.unit} 
                    onChange={e => setEditModal({...editModal, feed: {...editModal.feed, unit: e.target.value}})}
                    className={`px-3 py-2 w-full rounded border ${
                      darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block mb-1 dark:text-gray-300">Target Animal</label>
                <input 
                  type="text" 
                  placeholder="Target Animal" 
                  value={editModal.feed.targetAnimal}
                  onChange={e => setEditModal({...editModal, feed: {...editModal.feed, targetAnimal: e.target.value}})}
                  className={`px-3 py-2 w-full rounded border ${
                    darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                  }`}
                />
              </div>
              
              <div>
                <label className="block mb-1 dark:text-gray-300">Expiry Date</label>
                <input 
                  type="date" 
                  value={editModal.feed.expiryDate?.slice(0,10)}
                  onChange={e => setEditModal({...editModal, feed: {...editModal.feed, expiryDate: e.target.value}})}
                  className={`px-3 py-2 w-full rounded border ${
                    darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                  }`}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setEditModal({ open: false, feed: null })} 
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateFeed(editModal.feed)} 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center gap-1"
              >
                <span>💾</span>
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}