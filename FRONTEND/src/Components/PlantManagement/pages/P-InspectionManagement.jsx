// PInspectionManagement.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useTheme } from "../context/ThemeContext";
import Loader from "../Loader/Loader.js";
import "../styles/theme.css";
import { FaEdit, FaTrash, FaDownload, FaPlus, FaCalendarAlt } from "react-icons/fa";

const PInspectionManagement = () => {
  const { theme } = useTheme();
  const [inspections, setInspections] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ tunnel: "", date: "", inspector: "", status: "cleared", notes: "" });
  const [formErrors, setFormErrors] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

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

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/inspections");
      setInspections(res.data);
    } catch (error) {
      console.error("Error fetching inspections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchInspections(); 
  }, []);

  const validateForm = () => {
    const errors = {};
    
    // Validate Greenhouse ID
    if (!formData.tunnel) {
      errors.tunnel = "Greenhouse ID is required";
    } else if (!formData.tunnel.startsWith("GH")) {
      errors.tunnel = "Greenhouse ID must start with 'GH'";
    }
    
    // Validate Date
    if (!formData.date) {
      errors.date = "Date is required";
    }
    
    // Validate Inspector
    if (!formData.inspector) {
      errors.inspector = "Inspector name is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/inspections", formData);
      setFormData({ tunnel: "", date: "", inspector: "", status: "cleared", notes: "" });
      setShowForm(false);
      await fetchInspections();
    } catch (error) {
      console.error("Error adding inspection:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (insp) => {
    setEditingId(insp._id);
    setFormData({ 
      tunnel: insp.tunnel, 
      date: insp.date.slice(0,10), 
      inspector: insp.inspector, 
      status: insp.status, 
      notes: insp.notes 
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      await axios.put(`http://localhost:5000/api/inspections/${editingId}`, formData);
      setEditingId(null);
      setShowForm(false);
      await fetchInspections();
    } catch (error) {
      console.error("Error updating inspection:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this inspection?")) return;
    
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/inspections/${id}`);
      await fetchInspections();
    } catch (error) {
      console.error("Error deleting inspection:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/inspections/download/${id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `inspection_${id}.pdf`);
      document.body.appendChild(link); 
      link.click(); 
      link.remove();
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  // Charts data
  const statusCounts = ["cleared","issue"].map(s => ({
    name: s,
    value: inspections.filter(i => i.status === s).length
  }));

  const inspectionsPerDay = inspections.reduce((acc, insp) => {
    const date = insp.date.slice(0,10);
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const barChartData = Object.keys(inspectionsPerDay).map(date => ({ date, count: inspectionsPerDay[date] }));

  // Theme-based colors using CSS variables
  const bgCard = theme === 'dark' ? 'var(--card-bg)' : 'var(--card-bg)';
  const textColor = theme === 'dark' ? 'var(--text)' : 'var(--text)';
  const borderColor = theme === 'dark' ? 'var(--border)' : 'var(--border)';
  const buttonHover = theme === 'dark' ? 'hover:bg-green-700/20' : 'hover:bg-green-100';

  // Show loader while loading
  if (loading) {
    return <Loader darkMode={darkMode} />;
  }

  return (
    <div style={{backgroundColor: 'var(--background)'}} className={`flex flex-col gap-6 p-4 min-h-screen`}>
      <h1 style={{color: 'var(--text)'}} className="text-3xl font-bold flex items-center gap-2">
        <FaCalendarAlt className="text-green-500" />
        Inspection Management
      </h1>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}} className="border rounded-xl shadow-md p-4">
          <h3 style={{color: 'var(--text)'}} className="text-lg font-semibold mb-2">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusCounts} dataKey="value" nameKey="name" outerRadius={80} label>
                <Cell fill="#66BB6A" />
                <Cell fill="#EF5350" />
              </Pie>
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'var(--card-bg)', 
                  color: 'var(--text)',
                  borderColor: 'var(--border)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}} className="border rounded-xl shadow-md p-4">
          <h3 style={{color: 'var(--text)'}} className="text-lg font-semibold mb-2">Inspections per Day</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barChartData}>
              <XAxis dataKey="date" stroke={'var(--text)'} />
              <YAxis allowDecimals={false} stroke={'var(--text)'} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'var(--card-bg)', 
                  color: 'var(--text)',
                  borderColor: 'var(--border)'
                }}
              />
              <Bar dataKey="count" fill="#42A5F5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calendar */}
      <div style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}} className="border rounded-xl shadow-md p-4">
        <h3 style={{color: 'var(--text)'}} className="text-lg font-semibold mb-4">Inspection Calendar</h3>
        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          tileContent={({date}) => {
            const hasInspection = inspections.some(i => new Date(i.date).toDateString() === date.toDateString());
            return hasInspection ? <div className="w-2 h-2 mt-1 mx-auto rounded-full bg-green-500"></div> : null;
          }}
          className={`w-full rounded-lg border-0 ${theme === "dark" ? "bg-[var(--card-bg)] text-[var(--text)]" : "bg-[var(--card-bg)] text-[var(--text)]"}`}
        />
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}} className="border rounded-xl shadow-md p-4">
          <h3 style={{color: 'var(--text)'}} className="text-lg font-semibold mb-4">
            {editingId ? "Edit Inspection" : "Add New Inspection"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label style={{color: 'var(--text)'}} className="block text-sm font-medium mb-1">Greenhouse ID *</label>
              <input 
                style={{
                  backgroundColor: 'var(--card-bg)', 
                  color: 'var(--text)',
                  borderColor: formErrors.tunnel ? '#e53e3e' : 'var(--border)'
                }} 
                className="border rounded-md p-2 w-full" 
                placeholder="GH01" 
                name="tunnel"
                value={formData.tunnel} 
                onChange={handleInputChange} 
              />
              {formErrors.tunnel && <p className="text-red-500 text-xs mt-1">{formErrors.tunnel}</p>}
            </div>
            
            <div>
              <label style={{color: 'var(--text)'}} className="block text-sm font-medium mb-1">Date *</label>
              <input 
                style={{
                  backgroundColor: 'var(--card-bg)', 
                  color: 'var(--text)',
                  borderColor: formErrors.date ? '#e53e3e' : 'var(--border)'
                }} 
                className="border rounded-md p-2 w-full" 
                type="date" 
                name="date"
                value={formData.date} 
                onChange={handleInputChange} 
              />
              {formErrors.date && <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>}
            </div>
            
            <div>
              <label style={{color: 'var(--text)'}} className="block text-sm font-medium mb-1">Inspector *</label>
              <input 
                style={{
                  backgroundColor: 'var(--card-bg)', 
                  color: 'var(--text)',
                  borderColor: formErrors.inspector ? '#e53e3e' : 'var(--border)'
                }} 
                className="border rounded-md p-2 w-full" 
                placeholder="Inspector Name" 
                name="inspector"
                value={formData.inspector} 
                onChange={handleInputChange} 
              />
              {formErrors.inspector && <p className="text-red-500 text-xs mt-1">{formErrors.inspector}</p>}
            </div>
            
            <div>
              <label style={{color: 'var(--text)'}} className="block text-sm font-medium mb-1">Status</label>
              <select 
                style={{
                  backgroundColor: 'var(--card-bg)', 
                  color: 'var(--text)',
                  borderColor: 'var(--border)'
                }} 
                className="border rounded-md p-2 w-full" 
                name="status"
                value={formData.status} 
                onChange={handleInputChange}
              >
                <option value="cleared">Cleared</option>
                <option value="issue">Issue</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label style={{color: 'var(--text)'}} className="block text-sm font-medium mb-1">Notes</label>
              <input 
                style={{
                  backgroundColor: 'var(--card-bg)', 
                  color: 'var(--text)',
                  borderColor: 'var(--border)'
                }} 
                className="border rounded-md p-2 w-full" 
                placeholder="Notes" 
                name="notes"
                value={formData.notes} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            {editingId ? (
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors" 
                onClick={handleSave}
              >
                Save Changes
              </button>
            ) : (
              <button 
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors" 
                onClick={handleAdd}
              >
                Add Inspection
              </button>
            )}
            <button 
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors" 
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormErrors({});
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button 
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors w-fit flex items-center gap-2" 
          onClick={() => setShowForm(true)}
        >
          <FaPlus /> Add New Inspection
        </button>
      )}

      {/* Inspection Table */}
      <div style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}} className="border rounded-xl shadow-md p-4 overflow-x-auto">
        <h3 style={{color: 'var(--text)'}} className="text-lg font-semibold mb-4">Inspection Records</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{backgroundColor: theme === "dark" ? 'var(--primary)' : '#f0f9f0'}}>
              <th style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="p-3 text-left border-b">Date</th>
              <th style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="p-3 text-left border-b">Greenhouse ID</th>
              <th style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="p-3 text-left border-b">Inspector</th>
              <th style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="p-3 text-left border-b">Status</th>
              <th style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="p-3 text-left border-b">Notes</th>
              <th style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="p-3 text-left border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inspections.length > 0 ? (
              inspections.map(i => (
                <tr 
                  key={i._id} 
                  style={{backgroundColor: 'var(--card-bg)'}}
                  className="hover:opacity-80 transition-opacity"
                >
                  <td style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="p-3 border-b">
                    {new Date(i.date).toLocaleDateString()}
                  </td>
                  <td style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="p-3 border-b font-medium">
                    {i.tunnel}
                  </td>
                  <td style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="p-3 border-b">
                    {i.inspector}
                  </td>
                  <td style={{borderColor: 'var(--border)'}} className="p-3 border-b">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      i.status === "cleared" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    }`}>
                      {i.status}
                    </span>
                  </td>
                  <td style={{color: 'var(--text)', borderColor: 'var(--border)'}} className="p-3 border-b max-w-xs truncate">
                    {i.notes}
                  </td>
                  <td style={{borderColor: 'var(--border)'}} className="p-3 border-b">
                    <div className="flex gap-2">
                      <button 
                        className="p-2 rounded-md text-blue-600 hover:bg-blue-100 transition-colors" 
                        onClick={() => handleEdit(i)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="p-2 rounded-md text-red-600 hover:bg-red-100 transition-colors" 
                        onClick={() => handleDelete(i._id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                      <button 
                        className="p-2 rounded-md text-green-600 hover:bg-green-100 transition-colors" 
                        onClick={() => handleDownload(i._id)}
                        title="Download PDF"
                      >
                        <FaDownload />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{color: 'var(--text-light)'}} className="p-4 text-center">
                  No inspection records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Calendar Styles */}
      <style jsx>{`
        .react-calendar {
          width: 100%;
          background-color: var(--card-bg);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          font-family: inherit;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .react-calendar__navigation button {
          color: var(--text);
          min-width: 44px;
          background: none;
          font-size: 16px;
          margin-top: 8px;
        }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: ${theme === "dark" ? "var(--border)" : "#f0f0f0"};
        }
        .react-calendar__tile {
          color: var(--text);
          padding: 10px 6.6667px;
          background: none;
          text-align: center;
          line-height: 16px;
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: ${theme === "dark" ? "var(--border)" : "#f0f0f0"};
          border-radius: 6px;
        }
        .react-calendar__tile--now {
          background: ${theme === "dark" ? "var(--border)" : "#ffff76"};
          border-radius: 6px;
        }
        .react-calendar__tile--active {
          background: ${theme === "dark" ? "#4f9eae" : "#006edc"};
          color: white;
          border-radius: 6px;
        }
        .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: bold;
          font-size: 0.75em;
          color: var(--text-light);
        }
      `}</style>
    </div>
  );
};

export default PInspectionManagement;