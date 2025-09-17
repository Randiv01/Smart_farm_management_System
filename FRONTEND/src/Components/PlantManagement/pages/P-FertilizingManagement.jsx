// FertilizingManagement.jsx
import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import "../styles/theme.css";


const FertilizingManagement = () => {
  const { theme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [fertilizingRecords, setFertilizingRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [formMessage, setFormMessage] = useState({ type: "", text: "" });
  const COLORS = ["#e53935", "#43a047", "#fdd835", "#1e88e5"];

  const fetchRecords = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/fertilizing");
      setFertilizingRecords(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchRecords(); }, []);

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
    try {
      if (selectedRecord) {
        await axios.put(`http://localhost:5000/api/fertilizing/${selectedRecord._id}`, record);
        setFormMessage({ type: "success", text: "Record updated successfully!" });
      } else {
        await axios.post(`http://localhost:5000/api/fertilizing`, record);
        setFormMessage({ type: "success", text: "Record added successfully!" });
      }
      fetchRecords();
      setTimeout(() => {
        setShowForm(false);
        setSelectedRecord(null);
        setFormMessage({ type: "", text: "" });
      }, 1500);
    } catch (err) {
      console.error(err);
      setFormMessage({ type: "error", text: "Failed to save data. Try again." });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try { await axios.delete(`http://localhost:5000/api/fertilizing/${id}`); fetchRecords(); }
    catch (err) { console.error(err); }
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

  // Theme-based colors
  const bgCard = theme==='dark' ? 'bg-[#2d2d2d]' : 'bg-white';
  const textColor = theme==='dark' ? 'text-gray-200' : 'text-gray-800';
  const borderColor = theme==='dark' ? '#3a3a3b' : 'border-gray-300'; // same as InspectionManagement
  const inputBg = theme==='dark' ? '#3a3a3b' : '#fff';
  const inputText = theme==='dark' ? '#f4f7fb' : '#1f2937';

  return (
    <div className={`flex flex-col gap-6 p-4 ${textColor}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-semibold">Fertilizing Management</h1>
        <button className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-600" onClick={()=>setShowForm(true)}>
          <Plus size={16}/> New Record
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-xl shadow p-6 ${bgCard} border`} style={{borderColor}}>
          <h3 className="text-lg font-medium mb-4">Fertilizer Type Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={fertilizerTypeData} dataKey="value" nameKey="name" outerRadius={80} label>
                {fertilizerTypeData.map((entry, idx)=>(
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{backgroundColor: inputBg, color: inputText}} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={`rounded-xl shadow p-6 ${bgCard} border`} style={{borderColor}}>
          <h3 className="text-lg font-medium mb-4">Fertilizing Frequency by Greenhouse</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={fertilizingFrequencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme==='dark' ? '#555' : '#ccc'} />
              <XAxis dataKey="greenhouseNo" stroke={inputText} />
              <YAxis stroke={inputText} />
              <Tooltip contentStyle={{backgroundColor: inputBg, color: inputText}} />
              <Bar dataKey="frequency" fill="#2E7D32"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className={`flex flex-col sm:flex-row gap-4 items-start sm:items-end rounded-xl shadow p-4 ${bgCard} border`} style={{borderColor}}>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Date Range:</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e)=>setDateRange({...dateRange, start:e.target.value})}
              style={{backgroundColor: inputBg, color: inputText, borderColor}}
              className="px-3 py-2 border rounded-md"
            />
            <span className="self-center text-sm">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e)=>setDateRange({...dateRange, end:e.target.value})}
              style={{backgroundColor: inputBg, color: inputText, borderColor}}
              className="px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-xl shadow p-6 overflow-x-auto ${bgCard} border`} style={{borderColor}}>
        <h2 className="text-xl font-semibold mb-4">Fertilizing Records</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className={`bg-green-50 ${theme==='dark'?'bg-green-900 text-gray-200':'text-gray-800'}`}>
              <th className="px-4 py-2 text-left">Greenhouse No</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Fertilizer Type</th>
              <th className="px-4 py-2 text-left">Quantity (kg)</th>
              <th className="px-4 py-2 text-left">Staff</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(record => (
              <tr key={record._id} className={theme==='dark'?'hover:bg-gray-700':'hover:bg-gray-100'}>
                <td className="px-4 py-2">{record.greenhouseNo}</td>
                <td className="px-4 py-2">{record.date}</td>
                <td className="px-4 py-2">{record.fertilizerType}</td>
                <td className="px-4 py-2">{record.quantity}</td>
                <td className="px-4 py-2">{record.staff}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(record.status)}`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button className="p-1 hover:text-blue-500" onClick={()=>{setSelectedRecord(record); setShowForm(true);}}><Edit size={16}/></button>
                  <button className="p-1 hover:text-red-500" onClick={()=>handleDelete(record._id)}><Trash size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className={`fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start pt-24 z-50`}>
          <div className={`p-6 rounded-xl w-full max-w-2xl relative ${bgCard} border`} style={{borderColor}}>
            <h2 className="text-xl font-semibold mb-4">{selectedRecord?'Edit Fertilizing Record':'Add Fertilizing Record'}</h2>

            {formMessage.text && (
              <div className={`mb-3 px-3 py-2 rounded-md text-sm ${formMessage.type==='success'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                {formMessage.text}
              </div>
            )}

            <form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
              {/* Form fields with updated border color */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label>Greenhouse No</label>
                  <input type="text" name="greenhouseNo" defaultValue={selectedRecord?.greenhouseNo || ""} required 
                    style={{backgroundColor: inputBg, color: inputText, borderColor}} className="px-3 py-2 border rounded-md"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label>Date</label>
                  <input type="date" name="date" defaultValue={selectedRecord?.date || ""} required 
                    style={{backgroundColor: inputBg, color: inputText, borderColor}} className="px-3 py-2 border rounded-md"/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label>Fertilizer Type</label>
                  <select name="fertilizerType" defaultValue={selectedRecord?.fertilizerType || ""} required
                    style={{backgroundColor: inputBg, color: inputText, borderColor}} className="px-3 py-2 border rounded-md">
                    <option value="">Select Type</option>
                    <option value="Urea">Urea</option>
                    <option value="NPK">NPK</option>
                    <option value="Compost">Compost</option>
                    <option value="Organic">Organic</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label>Quantity (kg)</label>
                  <input type="number" name="quantity" min="0" step="0.1" defaultValue={selectedRecord?.quantity || 0} required
                    style={{backgroundColor: inputBg, color: inputText, borderColor}} className="px-3 py-2 border rounded-md"/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label>Staff</label>
                  <input type="text" name="staff" defaultValue={selectedRecord?.staff || ""} required
                    style={{backgroundColor: inputBg, color: inputText, borderColor}} className="px-3 py-2 border rounded-md"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label>Status</label>
                  <select name="status" defaultValue={selectedRecord?.status || "Untreated"} required
                    style={{backgroundColor: inputBg, color: inputText, borderColor}} className="px-3 py-2 border rounded-md">
                    <option value="Treated">Treated</option>
                    <option value="Untreated">Untreated</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={()=>{setShowForm(false); setSelectedRecord(null); setFormMessage({type:"",text:""})}} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FertilizingManagement;
