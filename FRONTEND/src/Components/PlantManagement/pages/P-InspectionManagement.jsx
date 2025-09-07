// PInspectionManagement.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useTheme } from "../context/ThemeContext";
import "../styles/theme.css";


const PInspectionManagement = () => {
  const { theme } = useTheme();
  const [inspections, setInspections] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ tunnel: "", date: "", inspector: "", status: "cleared", notes: "" });
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchInspections = async () => {
    const res = await axios.get("http://localhost:5000/api/inspections");
    setInspections(res.data);
  };

  useEffect(() => { fetchInspections(); }, []);

  const handleAdd = async () => {
    if (!formData.tunnel || !formData.date || !formData.inspector) return alert("Fill all fields");
    await axios.post("http://localhost:5000/api/inspections", formData);
    setFormData({ tunnel: "", date: "", inspector: "", status: "cleared", notes: "" });
    setShowForm(false);
    fetchInspections();
  };

  const handleEdit = (insp) => {
    setEditingId(insp._id);
    setFormData({ tunnel: insp.tunnel, date: insp.date.slice(0,10), inspector: insp.inspector, status: insp.status, notes: insp.notes });
    setShowForm(true);
  };

  const handleSave = async () => {
    await axios.put(`http://localhost:5000/api/inspections/${editingId}`, formData);
    setEditingId(null);
    setShowForm(false);
    fetchInspections();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    await axios.delete(`http://localhost:5000/api/inspections/${id}`);
    fetchInspections();
  };

  const handleDownload = async (id) => {
    const res = await axios.get(`http://localhost:5000/api/inspections/download/${id}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inspection_${id}.pdf`);
    document.body.appendChild(link); link.click(); link.remove();
  };

  // Charts data
  const statusCounts = ["cleared","issue"].map(s => ({
    name: s,
    value: inspections.filter(i=>i.status===s).length
  }));

  const inspectionsPerDay = inspections.reduce((acc, insp) => {
    const date = insp.date.slice(0,10);
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const barChartData = Object.keys(inspectionsPerDay).map(date => ({ date, count: inspectionsPerDay[date] }));

  // Theme-based colors
  const bgCard = theme==='dark'?'bg-[#2d2d2d]':'bg-white';
  const textColor = theme==='dark'?'text-gray-200':'text-gray-800';
  const borderColor = theme==='dark' ? 'border-[#555]' : 'border-gray-300';
  const inputBg = theme==='dark' ? '#3a3a3b' : '#fff';
  const inputText = theme==='dark' ? '#f4f7fb' : '#1f2937';
  const buttonHover = theme==='dark' ? 'hover:bg-green-700/20' : 'hover:bg-green-100';

  return (
    <div className={`flex flex-col gap-6 p-4 ${textColor}`}>
      <h1 className="text-3xl font-bold">Inspection Management</h1>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`border rounded-xl shadow-md p-4 ${bgCard} ${borderColor}`}>
          <h3 className="text-lg font-semibold mb-2">Status Pie Chart</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusCounts} dataKey="value" nameKey="name" outerRadius={80} label>
                <Cell fill="#66BB6A" />
                <Cell fill="#EF5350" />
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: theme==="dark" ? "#3a3a3b" : "#fff", color: theme==="dark" ? "#fff" : "#000" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={`border rounded-xl shadow-md p-4 ${bgCard} ${borderColor}`}>
          <h3 className="text-lg font-semibold mb-2">Inspections per Day</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barChartData}>
              <XAxis dataKey="date" stroke={theme==="dark" ? "#fff" : "#000"} />
              <YAxis allowDecimals={false} stroke={theme==="dark" ? "#fff" : "#000"} />
              <Tooltip
                contentStyle={{ backgroundColor: theme==="dark" ? "#3a3a3b" : "#fff", color: theme==="dark" ? "#fff" : "#000" }}
              />
              <Bar dataKey="count" fill="#42A5F5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calendar */}
      <div className={`border rounded-xl shadow-md p-4 ${bgCard} ${borderColor}`}>
        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          tileContent={({date}) => {
            const hasInspection = inspections.some(i => new Date(i.date).toDateString() === date.toDateString());
            return hasInspection ? <div className="w-2 h-2 mt-1 mx-auto rounded-full bg-green-500"></div> : null;
          }}
          className={theme==="dark" ? "react-calendar react-calendar-dark" : "react-calendar"}
        />
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className={`border rounded-xl shadow-md p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 ${bgCard} ${borderColor}`}>
          <input style={{backgroundColor: inputBg, color: inputText}} className={`border rounded-md p-2 ${borderColor}`} placeholder="Greenhouse ID" value={formData.tunnel} onChange={e=>setFormData({...formData, tunnel:e.target.value})} />
          <input style={{backgroundColor: inputBg, color: inputText}} className={`border rounded-md p-2 ${borderColor}`} type="date" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})} />
          <input style={{backgroundColor: inputBg, color: inputText}} className={`border rounded-md p-2 ${borderColor}`} placeholder="Inspector" value={formData.inspector} onChange={e=>setFormData({...formData, inspector:e.target.value})} />
          <select style={{backgroundColor: inputBg, color: inputText}} className={`border rounded-md p-2 ${borderColor}`} value={formData.status} onChange={e=>setFormData({...formData, status:e.target.value})}>
            <option value="cleared">Cleared</option>
            <option value="issue">Issue</option>
          </select>
          <input style={{backgroundColor: inputBg, color: inputText}} className={`border rounded-md p-2 ${borderColor}`} placeholder="Notes" value={formData.notes} onChange={e=>setFormData({...formData, notes:e.target.value})} />
          {editingId ? (
            <button className="col-span-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600" onClick={handleSave}>Save</button>
          ) : (
            <button className="col-span-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600" onClick={handleAdd}>Add Inspection</button>
          )}
        </div>
      )}

      {!showForm && (
        <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 w-fit" onClick={()=>setShowForm(true)}>Add New Inspection</button>
      )}

      {/* Inspection Table */}
      <div className={`border rounded-xl shadow-md p-4 overflow-x-auto ${bgCard} ${borderColor}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className={`bg-green-100 ${theme==="dark" ? "bg-green-900 text-gray-200" : "text-gray-800"}`}>
              <th className="p-2">Date</th>
              <th className="p-2">Tunnel</th>
              <th className="p-2">Inspector</th>
              <th className="p-2">Status</th>
              <th className="p-2">Notes</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map(i => (
              <tr key={i._id} className={theme==="dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}>
                <td className="p-2">{new Date(i.date).toLocaleDateString()}</td>
                <td className="p-2">{i.tunnel}</td>
                <td className="p-2">{i.inspector}</td>
                <td className="p-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${i.status==="cleared" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                    {i.status}
                  </span>
                </td>
                <td className="p-2">{i.notes}</td>
                <td className="p-2 flex gap-2">
                  <button className="px-2 py-1 border rounded hover:bg-blue-100" onClick={()=>handleEdit(i)}>✏</button>
                  <button className="px-2 py-1 border rounded hover:bg-red-100" onClick={()=>handleDelete(i._id)}>🗑</button>
                  <button className="px-2 py-1 border rounded hover:bg-green-100" onClick={()=>handleDownload(i._id)}>⬇</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calendar Styles */}
      <style jsx>{`
        .react-calendar {
          width: 100%;
          background-color: ${theme==="dark" ? "#111111" : "#ffffff"};
          color: ${theme==="dark" ? "#f4f7fb" : "#1f2937"};
          border: 1px solid ${theme==="dark" ? "#222838" : "#e5e7eb"};
          border-radius: 12px;
          padding: 10px;
          font-family: inherit;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .react-calendar__tile {
          color: ${theme==="dark" ? "#f4f7fb" : "#1f2937"};
        }
        .react-calendar__tile:hover {
          background-color: rgba(100, 100, 100, 0.2);
        }
      `}</style>
    </div>
  );
};

export default PInspectionManagement;
