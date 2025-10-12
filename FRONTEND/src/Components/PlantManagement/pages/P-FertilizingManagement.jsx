// FertilizingManagement.jsx
import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash, Send } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import Loader from "../Loader/Loader.js";
import "../styles/theme.css";

const FertilizingManagement = () => {
  const { theme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [fertilizingRecords, setFertilizingRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [formMessage, setFormMessage] = useState({ type: "", text: "" });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const COLORS = ["#e53935", "#43a047", "#fdd835", "#1e88e5"];

  // Check theme for loader
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setDarkMode(isDark);
    };

    checkTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['data-theme'] 
    });

    return () => observer.disconnect();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/fertilizing");
      setFertilizingRecords(res.data);
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchRecords(); 
  }, []);

  const validateForm = (formData) => {
    const errors = {};
    
    // Greenhouse ID validation
    if (!formData.greenhouseNo) {
      errors.greenhouseNo = "Greenhouse ID is required";
    } else if (!formData.greenhouseNo.toUpperCase().startsWith("GH")) {
      errors.greenhouseNo = "Greenhouse ID must start with 'GH'";
    }
    
    // Date validation
    if (!formData.date) {
      errors.date = "Date is required";
    }
    
    // Fertilizer Type validation
    if (!formData.fertilizerType) {
      errors.fertilizerType = "Fertilizer type is required";
    }
    
    // Quantity validation
    if (!formData.quantity || formData.quantity <= 0) {
      errors.quantity = "Quantity must be greater than 0";
    }
    
    // Staff validation
    if (!formData.staff) {
      errors.staff = "Staff name is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const record = {
      greenhouseNo: form.greenhouseNo.value,
      date: form.date.value,
      fertilizerType: form.fertilizerType.value,
      quantity: parseFloat(form.quantity.value),
      staff: form.staff.value,
      status: form.status.value,
    };
    
    if (!validateForm(record)) return;
    
    try {
      setLoading(true);
      if (selectedRecord) {
        await axios.put(`http://localhost:5000/api/fertilizing/${selectedRecord._id}`, record);
        setFormMessage({ type: "success", text: "Record updated successfully!" });
      } else {
        await axios.post(`http://localhost:5000/api/fertilizing`, record);
        setFormMessage({ type: "success", text: "Record added successfully!" });
      }
      await fetchRecords();
      setTimeout(() => {
        setShowForm(false);
        setSelectedRecord(null);
        setFormMessage({ type: "", text: "" });
        setFormErrors({});
      }, 1500);
    } catch (err) {
      console.error(err);
      setFormMessage({ type: "error", text: "Failed to save data. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try { 
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/fertilizing/${id}`); 
      await fetchRecords(); 
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (record) => {
    try {
      setLoading(true);
      const notificationData = {
        title: 'New Fertilizing Record',
        message: `${record.quantity}kg of ${record.fertilizerType} applied to ${record.greenhouseNo} on ${record.date}`,
        type: 'info',
        source: 'Plant Management',
        targetModule: 'Inventory Management',
        data: {
          fertilizingId: record._id,
          greenhouseNo: record.greenhouseNo,
          fertilizerType: record.fertilizerType,
          quantity: record.quantity,
          date: record.date,
          staff: record.staff,
          status: record.status
        }
      };

      // Create notification for Plant Management as well
      const plantNotificationData = {
        title: 'Fertilizing Record Sent',
        message: `Fertilizing record sent to Inventory Management: ${record.quantity}kg of ${record.fertilizerType} to ${record.greenhouseNo}`,
        type: 'info',
        source: 'Plant Management',
        targetModule: 'Plant Management',
        data: {
          fertilizingId: record._id,
          greenhouseNo: record.greenhouseNo,
          fertilizerType: record.fertilizerType,
          quantity: record.quantity,
          date: record.date,
          staff: record.staff,
          status: record.status
        }
      };

      await axios.post('http://localhost:5000/api/notifications', notificationData);
      await axios.post('http://localhost:5000/api/notifications', plantNotificationData);
      setFormMessage({ type: "success", text: "Notification sent to Inventory Management!" });
      
      setTimeout(() => {
        setFormMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error('Error sending notification:', error);
      setFormMessage({ type: "error", text: "Failed to send notification. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name } = e.target;
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const fertilizerTypeData = fertilizingRecords.reduce((acc, record) => {
    const index = acc.findIndex((d) => d.name === record.fertilizerType);
    if (index > -1) acc[index].value += 1;
    else acc.push({ name: record.fertilizerType, value: 1 });
    return acc;
  }, []);

  const fertilizingFrequencyData = fertilizingRecords.reduce((acc, record) => {
    const index = acc.findIndex((d) => d.greenhouseNo === record.greenhouseNo);
    if (index > -1) acc[index].frequency += 1;
    else acc.push({ greenhouseNo: record.greenhouseNo, frequency: 1 });
    return acc;
  }, []);

  const getStatusClass = (status) =>
    status.toLowerCase() === "treated" 
      ? "bg-green-100 text-green-700"
      : "bg-orange-100 text-orange-700";

  const filteredRecords = fertilizingRecords.filter(record => {
    if (dateRange.start && dateRange.end) {
      return record.date >= dateRange.start && record.date <= dateRange.end;
    }
    return true;
  });

  // Theme-based colors using CSS variables
  const bgCard = theme === 'dark' ? 'var(--card-bg)' : 'var(--card-bg)';
  const textColor = theme === 'dark' ? 'var(--text)' : 'var(--text)';
  const borderColor = theme === 'dark' ? 'var(--border)' : 'var(--border)';
  const inputBg = theme === 'dark' ? 'var(--card-bg)' : 'var(--card-bg)';
  const inputText = theme === 'dark' ? 'var(--text)' : 'var(--text)';

  // Show loader while loading
  if (loading) {
    return <Loader darkMode={darkMode} />;
  }

  return (
    <div style={{backgroundColor: 'var(--background)'}} className={`flex flex-col gap-6 p-4 min-h-screen`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 style={{color: 'var(--text)'}} className="text-3xl font-semibold">Fertilizing Management</h1>
        <button 
          className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-600 transition-colors" 
          onClick={() => setShowForm(true)}
        >
          <Plus size={16}/> New Record
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}} className="rounded-xl shadow p-6 border">
          <h3 style={{color: 'var(--text)'}} className="text-lg font-medium mb-4">Fertilizer Type Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={fertilizerTypeData} dataKey="value" nameKey="name" outerRadius={80} label>
                {fertilizerTypeData.map((entry, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{
                backgroundColor: 'var(--card-bg)', 
                color: 'var(--text)',
                borderColor: 'var(--border)'
              }} />
              <Legend wrapperStyle={{ color: 'var(--text)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}} className="rounded-xl shadow p-6 border">
          <h3 style={{color: 'var(--text)'}} className="text-lg font-medium mb-4">Fertilizing Frequency by Greenhouse</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={fertilizingFrequencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#555' : '#ccc'} />
              <XAxis dataKey="greenhouseNo" stroke={'var(--text)'} />
              <YAxis stroke={'var(--text)'} />
              <Tooltip contentStyle={{
                backgroundColor: 'var(--card-bg)', 
                color: 'var(--text)',
                borderColor: 'var(--border)'
              }} />
              <Bar dataKey="frequency" fill="#2E7D32"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end rounded-xl shadow p-4 border">
        <div className="flex flex-col gap-1">
          <label style={{color: 'var(--text)'}} className="text-sm font-medium">Date Range:</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              style={{
                backgroundColor: 'var(--card-bg)', 
                color: 'var(--text)', 
                borderColor: 'var(--border)'
              }}
              className="px-3 py-2 border rounded-md"
            />
            <span style={{color: 'var(--text)'}} className="self-center text-sm">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              style={{
                backgroundColor: 'var(--card-bg)', 
                color: 'var(--text)', 
                borderColor: 'var(--border)'
              }}
              className="px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}} className="rounded-xl shadow p-6 overflow-x-auto border">
        <h2 style={{color: 'var(--text)'}} className="text-xl font-semibold mb-4">Fertilizing Records</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{backgroundColor: theme === 'dark' ? 'var(--primary)' : '#f0f9f0'}}>
              <th style={{color: 'var(--text)'}} className="px-4 py-2 text-left border-b" style1={{borderColor: 'var(--border)'}}>Greenhouse No</th>
              <th style={{color: 'var(--text)'}} className="px-4 py-2 text-left border-b" style2={{borderColor: 'var(--border)'}}>Date</th>
              <th style={{color: 'var(--text)'}} className="px-4 py-2 text-left border-b" style3={{borderColor: 'var(--border)'}}>Fertilizer Type</th>
              <th style={{color: 'var(--text)'}} className="px-4 py-2 text-left border-b" style4={{borderColor: 'var(--border)'}}>Quantity (kg)</th>
              <th style={{color: 'var(--text)'}} className="px-4 py-2 text-left border-b" style5={{borderColor: 'var(--border)'}}>Staff</th>
              <th style={{color: 'var(--text)'}} className="px-4 py-2 text-left border-b" style6={{borderColor: 'var(--border)'}}>Status</th>
              <th style={{color: 'var(--text)'}} className="px-4 py-2 text-left border-b" style7={{borderColor: 'var(--border)'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(record => (
              <tr 
                key={record._id} 
                style={{backgroundColor: 'var(--card-bg)'}}
                className="hover:opacity-80 transition-opacity"
              >
                <td style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="px-4 py-2 border-b">{record.greenhouseNo}</td>
                <td style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="px-4 py-2 border-b">{record.date}</td>
                <td style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="px-4 py-2 border-b">{record.fertilizerType}</td>
                <td style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="px-4 py-2 border-b">{record.quantity}</td>
                <td style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="px-4 py-2 border-b">{record.staff}</td>
                <td style={{borderColor: 'var(--border)'}} className="px-4 py-2 border-b">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(record.status)}`}>
                    {record.status}
                  </span>
                </td>
                <td style={{borderColor: 'var(--border)'}} className="px-4 py-2 border-b flex gap-2">
                  <button 
                    className="p-1 hover:text-blue-500 transition-colors" 
                    onClick={() => {setSelectedRecord(record); setShowForm(true);}}
                    title="Edit"
                  >
                    <Edit size={16}/>
                  </button>
                  <button 
                    className="p-1 hover:text-green-500 transition-colors" 
                    onClick={() => handleSendNotification(record)}
                    title="Send to Inventory Management"
                  >
                    <Send size={16}/>
                  </button>
                  <button 
                    className="p-1 hover:text-red-500 transition-colors" 
                    onClick={() => handleDelete(record._id)}
                    title="Delete"
                  >
                    <Trash size={16}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRecords.length === 0 && (
          <div style={{color: 'var(--text-light)'}} className="text-center py-8">
            No fertilizing records found
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start pt-24 z-50 p-4">
          <div style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}} className="p-6 rounded-xl w-full max-w-2xl relative border">
            <h2 style={{color: 'var(--text)'}} className="text-xl font-semibold mb-4">
              {selectedRecord ? 'Edit Fertilizing Record' : 'Add Fertilizing Record'}
            </h2>

            {formMessage.text && (
              <div className={`mb-3 px-3 py-2 rounded-md text-sm ${
                formMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {formMessage.text}
              </div>
            )}

            <form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
              {/* Form fields with validation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label style={{color: 'var(--text)'}}>Greenhouse No</label>
                  <input 
                    type="text" 
                    name="greenhouseNo" 
                    defaultValue={selectedRecord?.greenhouseNo || ""} 
                    required 
                    style={{
                      backgroundColor: 'var(--card-bg)', 
                      color: 'var(--text)', 
                      borderColor: formErrors.greenhouseNo ? '#e53e3e' : 'var(--border)'
                    }} 
                    className="px-3 py-2 border rounded-md"
                    onChange={handleInputChange}
                  />
                  {formErrors.greenhouseNo && (
                    <p className="text-red-500 text-sm">{formErrors.greenhouseNo}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label style={{color: 'var(--text)'}}>Date</label>
                  <input 
                    type="date" 
                    name="date" 
                    defaultValue={selectedRecord?.date || ""} 
                    required 
                    style={{
                      backgroundColor: 'var(--card-bg)', 
                      color: 'var(--text)', 
                      borderColor: formErrors.date ? '#e53e3e' : 'var(--border)'
                    }} 
                    className="px-3 py-2 border rounded-md"
                    onChange={handleInputChange}
                  />
                  {formErrors.date && (
                    <p className="text-red-500 text-sm">{formErrors.date}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label style={{color: 'var(--text)'}}>Fertilizer Type</label>
                  <select 
                    name="fertilizerType" 
                    defaultValue={selectedRecord?.fertilizerType || ""} 
                    required
                    style={{
                      backgroundColor: 'var(--card-bg)', 
                      color: 'var(--text)', 
                      borderColor: formErrors.fertilizerType ? '#e53e3e' : 'var(--border)'
                    }} 
                    className="px-3 py-2 border rounded-md"
                    onChange={handleInputChange}
                  >
                    <option value="">Select Type</option>
                    <option value="Urea">Urea</option>
                    <option value="NPK">NPK</option>
                    <option value="Compost">Compost</option>
                    <option value="Organic">Organic</option>
                  </select>
                  {formErrors.fertilizerType && (
                    <p className="text-red-500 text-sm">{formErrors.fertilizerType}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label style={{color: 'var(--text)'}}>Quantity (kg)</label>
                  <input 
                    type="number" 
                    name="quantity" 
                    min="0" 
                    step="0.1" 
                    defaultValue={selectedRecord?.quantity || 0} 
                    required
                    style={{
                      backgroundColor: 'var(--card-bg)', 
                      color: 'var(--text)', 
                      borderColor: formErrors.quantity ? '#e53e3e' : 'var(--border)'
                    }} 
                    className="px-3 py-2 border rounded-md"
                    onChange={handleInputChange}
                  />
                  {formErrors.quantity && (
                    <p className="text-red-500 text-sm">{formErrors.quantity}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label style={{color: 'var(--text)'}}>Staff</label>
                  <input 
                    type="text" 
                    name="staff" 
                    defaultValue={selectedRecord?.staff || ""} 
                    required
                    style={{
                      backgroundColor: 'var(--card-bg)', 
                      color: 'var(--text)', 
                      borderColor: formErrors.staff ? '#e53e3e' : 'var(--border)'
                    }} 
                    className="px-3 py-2 border rounded-md"
                    onChange={handleInputChange}
                  />
                  {formErrors.staff && (
                    <p className="text-red-500 text-sm">{formErrors.staff}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label style={{color: 'var(--text)'}}>Status</label>
                  <select 
                    name="status" 
                    defaultValue={selectedRecord?.status || "Untreated"} 
                    required
                    style={{
                      backgroundColor: 'var(--card-bg)', 
                      color: 'var(--text)', 
                      borderColor: 'var(--border)'
                    }} 
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="Treated">Treated</option>
                    <option value="Untreated">Untreated</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false); 
                    setSelectedRecord(null); 
                    setFormMessage({type: "", text: ""}); 
                    setFormErrors({});
                  }} 
                  style={{
                    backgroundColor: 'var(--card-bg)', 
                    color: 'var(--text)', 
                    borderColor: 'var(--border)'
                  }}
                  className="px-4 py-2 border rounded-md hover:opacity-80 transition-opacity"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FertilizingManagement;