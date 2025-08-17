import React, { useState, useEffect } from "react";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useTheme } from "../contexts/ThemeContext.js";
import { useLoader } from "../contexts/LoaderContext.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function FeedStocks() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading } = useLoader();

  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

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
      position: "bottom", // show names below the chart
      labels: {
        boxWidth: 20,
        padding: 15,
      },
    },
  },
  maintainAspectRatio: false, // chart fills the container
  layout: {
    padding: 0,
  },
};



  const pieData = {
    labels: filteredFeeds.map(f => f.foodName),
    datasets: [
      { data: filteredFeeds.map(f => Number(f.quantity)), backgroundColor: filteredFeeds.map((_, i) => `hsl(${i*50},70%,50%)`), hoverOffset:10 }
    ]
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-800"}`}>
      
      <Sidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 transition-all duration-300" style={{ marginLeft: sidebarOpen ? 250 : 80 }}>
        <TopNavbar sidebarOpen={sidebarOpen} notifications={[]} onMenuClick={handleMenuClick} />

        <main className="pt-28 px-4 md:px-8">
          {message.text && (
            <div className={`fixed top-32 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg ${message.type==="success"?"bg-green-500 text-white":"bg-red-500 text-white"} animate-popIn`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-2 mb-4">
            <div className="flex gap-2 flex-wrap">
              <input type="tel" placeholder="📱 Mobile Number" value={mobileNumber} onChange={e=>setMobileNumber(e.target.value)} 
                className={`px-2 py-1 rounded border ${darkMode?"bg-dark-card border-gray-600 text-dark-text":"bg-white border-gray-300 text-gray-800"}`} />
              <button onClick={saveMobileNumber} className="bg-blue-600 px-3 py-1 rounded text-white hover:bg-blue-700 transition">💾 Save</button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={()=>setNewFeedRow(!newFeedRow)} className="bg-green-600 px-3 py-1 rounded text-white hover:bg-green-700 transition">➕ Add New Feed</button>
              <button onClick={()=>setShowChart(!showChart)} className="bg-yellow-500 px-3 py-1 rounded text-white hover:bg-yellow-600 transition">{showChart?"Hide":"Show"} Stock Chart</button>
            </div>
          </div>

          {showChart && (
            <div className="mb-6 p-4 rounded-2xl shadow-lg bg-white dark:bg-dark-card w-64 h-64">
              <h3 className="font-semibold mb-4">Feed Stock Distribution</h3>
              <Pie data={pieData} options={pieOptions} />
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            <input type="text" placeholder="Search food name..." value={search} onChange={e=>setSearch(e.target.value)} 
              className={`px-2 py-1 rounded border ${darkMode?"bg-dark-card border-gray-600 text-dark-text":"bg-white border-gray-300 text-gray-800"}`} />
            <input type="text" placeholder="Target Animal" value={filter.targetAnimal} onChange={e=>setFilter({...filter,targetAnimal:e.target.value})}
              className={`px-2 py-1 rounded border ${darkMode?"bg-dark-card border-gray-600 text-dark-text":"bg-white border-gray-300 text-gray-800"}`} />
            <input type="date" placeholder="Expiry Date" value={filter.expiryDate} onChange={e=>setFilter({...filter,expiryDate:e.target.value})}
              className={`px-2 py-1 rounded border ${darkMode?"bg-dark-card border-gray-600 text-dark-text":"bg-white border-gray-300 text-gray-800"}`} />
          </div>

          {/* Table */}
          <div className="overflow-x-auto shadow-lg">
            <table className={`min-w-full ${darkMode ? "bg-dark-card text-dark-text" : "bg-white text-gray-800"}`}>
              <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <tr>
                  <th className="px-3 py-2 text-center">Food Name</th>
                  <th className="px-3 py-2 text-center">Quantity</th>
                  <th className="px-3 py-2 text-center">Remaining</th>
                  <th className="px-3 py-2 text-center">Unit</th>
                  <th className="px-3 py-2 text-center">Target Animal</th>
                  <th className="px-3 py-2 text-center">Expiry Date</th>
                  <th className="px-3 py-2 text-center">Sup ID</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {newFeedRow && (
                  <tr className="border-t border-gray-300 dark:border-gray-600 text-center">
                    <td><input value={newFeed.foodName} onChange={e => setNewFeed({ ...newFeed, foodName: e.target.value })} className="px-1 py-1 w-full text-center" /></td>
                    <td><input type="number" value={newFeed.quantity} onChange={e => setNewFeed({ ...newFeed, quantity: e.target.value })} className="px-1 py-1 w-full text-center" /></td>
                    <td>-</td>
                    <td>
                      <select value={newFeed.unit} onChange={e => setNewFeed({ ...newFeed, unit: e.target.value })} className="px-1 py-1 w-full text-center">
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="lb">lb</option>
                      </select>
                    </td>
                    <td><input value={newFeed.targetAnimal} onChange={e => setNewFeed({ ...newFeed, targetAnimal: e.target.value })} className="px-1 py-1 w-full text-center" /></td>
                    <td><input type="date" value={newFeed.expiryDate} onChange={e => setNewFeed({ ...newFeed, expiryDate: e.target.value })} className="px-1 py-1 w-full text-center" /></td>
                    <td><input value={newFeed.supId} onChange={e => setNewFeed({ ...newFeed, supId: e.target.value })} className="px-1 py-1 w-full text-center" /></td>
                    <td className="flex gap-1 justify-center">
                      <button onClick={() => handleAddNewFeed(newFeed)} className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition">💾</button>
                      <button onClick={() => setNewFeedRow(false)} className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition">❌</button>
                    </td>
                  </tr>
                )}

                {filteredFeeds.map(feed => (
                  <tr key={feed._id} className="border-t border-gray-300 dark:border-gray-600 text-center">
                    <td>{feed.foodName}</td>
                    <td>{feed.quantity}</td>
                    <td>{feed.remaining}</td>
                    <td>{feed.unit}</td>
                    <td>{feed.targetAnimal}</td>
                    <td>{feed.expiryDate?.slice(0, 10)}</td>
                    <td>{feed.supId || "-"}</td>
                    <td className="flex gap-1 justify-center flex-wrap">
                      <button onClick={() => setRefillModal({ open: true, feed, quantity: "" })} className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition">Refill</button>
                      <button onClick={() => setEditModal({ open: true, feed })} className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition">✏️ Edit</button>
                      <button onClick={() => setDeleteModal({ open: true, feed })} className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Delete Modal */}
          {deleteModal.open && (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
              <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg w-80 animate-popIn">
                <h3 className="font-semibold mb-4 text-center">Are you sure you want to delete <span className="font-bold">{deleteModal.feed.foodName}</span>?</h3>
                <div className="flex justify-center gap-4">
                  <button onClick={handleDeleteConfirm} className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 transition">Yes</button>
                  <button onClick={()=>setDeleteModal({open:false,feed:null})} className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500 transition">No</button>
                </div>
              </div>
            </div>
          )}

          {/* Refill Modal */}
          {refillModal.open && (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
              <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg w-80 animate-popIn">
                <h3 className="font-semibold mb-2">Refill {refillModal.feed.foodName}</h3>
                <input type="number" placeholder="Enter quantity" value={refillModal.quantity}
                  onChange={e=>setRefillModal({...refillModal,quantity:e.target.value})}
                  className="px-2 py-1 w-full rounded border mb-4"/>
                <div className="flex justify-end gap-2">
                  <button onClick={handleRefill} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition">💾 Save</button>
                  <button onClick={()=>setRefillModal({open:false,feed:null,quantity:""})} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition">❌ Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editModal.open && (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
              <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg w-80 animate-popIn">
                <h3 className="font-semibold mb-2">Edit {editModal.feed.foodName}</h3>
                <input type="text" placeholder="Food Name" value={editModal.feed.foodName}
                  onChange={e=>setEditModal({...editModal, feed:{...editModal.feed,foodName:e.target.value}})}
                  className="px-2 py-1 w-full rounded border mb-2"/>
                <input type="number" placeholder="Quantity" value={editModal.feed.quantity}
                  onChange={e=>setEditModal({...editModal, feed:{...editModal.feed,quantity:e.target.value}})}
                  className="px-2 py-1 w-full rounded border mb-2"/>
                <select value={editModal.feed.unit} onChange={e=>setEditModal({...editModal, feed:{...editModal.feed,unit:e.target.value}})} className="px-2 py-1 w-full rounded border mb-2">
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lb">lb</option>
                </select>
                <input type="text" placeholder="Target Animal" value={editModal.feed.targetAnimal}
                  onChange={e=>setEditModal({...editModal, feed:{...editModal.feed,targetAnimal:e.target.value}})}
                  className="px-2 py-1 w-full rounded border mb-2"/>
                <input type="date" value={editModal.feed.expiryDate?.slice(0,10)}
                  onChange={e=>setEditModal({...editModal, feed:{...editModal.feed,expiryDate:e.target.value}})}
                  className="px-2 py-1 w-full rounded border mb-4"/>
                <div className="flex justify-end gap-2">
                  <button onClick={()=>handleUpdateFeed(editModal.feed)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition">💾 Save</button>
                  <button onClick={()=>setEditModal({open:false,feed:null})} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition">❌ Cancel</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
