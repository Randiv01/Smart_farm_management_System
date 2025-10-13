import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash, Send } from 'lucide-react';
import Modal from '../P-Modal.jsx';
import { useTheme } from '../context/ThemeContext';
import Loader from '../Loader/Loader';
import "../styles/theme.css";

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Productivity = () => {
  const { theme } = useTheme();
  const [records, setRecords] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Theme-based colors
  const bgCard = theme === 'dark' ? 'bg-[#2d2d2d]' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
  const borderColor = theme === 'dark' ? '#3a3a3b' : 'border-gray-300';
  const inputBg = theme === 'dark' ? '#3a3a3b' : '#fff';
  const inputText = theme === 'dark' ? '#f4f7fb' : '#1f2937';

  // Fetch records from backend
  const fetchRecords = async (plantType = '') => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/productivity${plantType ? `?plantType=${plantType}` : ''}`);
      setRecords(res.data || []);
    } catch (err) {
      console.error('Fetch error:', err.response || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  // Add new record
  const handleAdd = async (data) => {
    try {
      const res = await axios.post('http://localhost:5000/api/productivity', data);
      setRecords([res.data, ...records]);
    } catch (err) { console.error('Add error:', err.response || err); }
  };

  // Update existing record
  const handleUpdate = async (id, data) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/productivity/${id}`, data);
      setRecords(records.map(r => r._id === id ? res.data : r));
    } catch (err) { console.error('Update error:', err.response || err); }
  };

  // Delete record
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/productivity/${id}`);
      setRecords(records.filter(r => r._id !== id));
    } catch (err) { console.error(err); }
  };

  // Send harvest record to Inventory Management
  const handleSendToInventory = async (record) => {
    try {
      setLoading(true);
      const notificationData = {
        title: 'New Harvest Record',
        message: `${record.quantity}kg of ${record.plantType} harvested from ${record.greenhouseNo} on ${new Date(record.harvestDate).toLocaleDateString()}`,
        type: 'success',
        source: 'Plant Management',
        targetModule: 'Inventory Management',
        data: {
          harvestId: record._id,
          plantType: record.plantType,
          greenhouseNo: record.greenhouseNo,
          harvestDate: record.harvestDate,
          quantity: record.quantity,
          qualityGrade: record.qualityGrade,
          worker: record.worker
        }
      };

      // Create notification for Plant Management as well
      const plantNotificationData = {
        title: 'Harvest Record Sent',
        message: `Harvest record sent to Inventory Management: ${record.quantity}kg of ${record.plantType} from ${record.greenhouseNo}`,
        type: 'success',
        source: 'Plant Management',
        targetModule: 'Plant Management',
        data: {
          harvestId: record._id,
          plantType: record.plantType,
          greenhouseNo: record.greenhouseNo,
          harvestDate: record.harvestDate,
          quantity: record.quantity,
          qualityGrade: record.qualityGrade,
          worker: record.worker
        }
      };

      await axios.post('http://localhost:5000/api/notifications', notificationData);
      await axios.post('http://localhost:5000/api/notifications', plantNotificationData);
      alert('Harvest record sent to Inventory Management successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (record = null) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  // Annual Harvest Chart
  const annualHarvestData = () => {
    const yearMap = {};
    records.forEach(r => {
      const year = r.harvestDate ? new Date(r.harvestDate).getFullYear() : 'Unknown';
      yearMap[year] = (yearMap[year] || 0) + (r.quantity || 0);
    });
    const years = [2021, 2022, 2023, 2024, 2025];
    return years.map(y => ({ year: y, quantity: yearMap[y] || 0 }));
  };

  // Monthly Yield Chart
  const monthlyYieldData = () => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthMap = {};
    records
      .filter(r => selectedPlant ? r.plantType === selectedPlant : true)
      .forEach(r => {
        const m = r.harvestDate ? new Date(r.harvestDate).getMonth() : 0;
        monthMap[m] = (monthMap[m] || 0) + (r.quantity || 0);
      });
    return months.map((month, idx) => ({ month, yield: monthMap[idx] || 0 }));
  };

  // Show loader while data is being fetched
  if (loading) {
    return <Loader darkMode={theme === 'dark'} />;
  }

  return (
    <div className={`flex flex-col gap-6 p-4 ${textColor}`}>

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Productivity</h1>
        <input
          type="text"
          placeholder="Search Plant Type..."
          className="border rounded px-3 py-2"
          style={{backgroundColor: inputBg, color: inputText, borderColor}}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button
          className="flex items-center gap-1 px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
          onClick={() => openModal()}
        >
          <Plus size={16} /> Add Harvest Record
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-xl shadow p-4 ${bgCard} border`} style={{borderColor}}>
          <h3 className="text-lg font-semibold mb-4">Annual Harvest</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={annualHarvestData()} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme==='dark'?'#555':'#ccc'} />
              <XAxis dataKey="year" stroke={inputText}/>
              <YAxis stroke={inputText}/>
              <Tooltip contentStyle={{backgroundColor: inputBg, color: inputText}}/>
              <Legend />
              <Bar dataKey="quantity" fill="#2E7D32" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`rounded-xl shadow p-4 ${bgCard} border`} style={{borderColor}}>
          <h3 className="text-lg font-semibold mb-4">
            Monthly Yield {selectedPlant && `- ${selectedPlant}`}
          </h3>
          <select
            className="border rounded px-2 py-1 mb-2"
            style={{backgroundColor: inputBg, color: inputText, borderColor}}
            value={selectedPlant}
            onChange={e => { setSelectedPlant(e.target.value); fetchRecords(e.target.value); }}
          >
            <option value="">All Plants</option>
            {[...new Set(records.map(r => r.plantType).filter(Boolean))].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyYieldData()} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme==='dark'?'#555':'#ccc'} />
              <XAxis dataKey="month" stroke={inputText}/>
              <YAxis stroke={inputText}/>
              <Tooltip contentStyle={{backgroundColor: inputBg, color: inputText}}/>
              <Legend />
              <Line type="monotone" dataKey="yield" stroke="#66BB6A" activeDot={{ r: 8 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-xl shadow p-4 overflow-x-auto ${bgCard} border`} style={{borderColor}}>
        <h2 className="text-xl font-semibold mb-4">Harvest Records</h2>
        <table className="w-full border-collapse">
          <thead className={theme==='dark'?'bg-gray-800 text-gray-200':'bg-gray-100 text-gray-800'}>
            <tr>
              <th className="px-4 py-2 text-left">Plant Type</th>
              <th className="px-4 py-2 text-left">Greenhouse No</th>
              <th className="px-4 py-2 text-left">Harvest Date</th>
              <th className="px-4 py-2 text-left">Quantity (kg)</th>
              <th className="px-4 py-2 text-left">Quality Grade</th>
              <th className="px-4 py-2 text-left">Worker</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records
              .filter(r => (r.plantType || '').toLowerCase().includes(searchTerm.toLowerCase()))
              .map(record => (
              <tr key={record._id} className={theme==='dark'?'hover:bg-gray-700':'hover:bg-gray-50'}>
                <td className="px-4 py-2">{record.plantType || 'Unknown'}</td>
                <td className="px-4 py-2">{record.greenhouseNo || '-'}</td>
                <td className="px-4 py-2">{record.harvestDate ? new Date(record.harvestDate).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-2">{record.quantity || 0}</td>
                <td className="px-4 py-2">{record.qualityGrade || '-'}</td>
                <td className="px-4 py-2">{record.worker || '-'}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button className="p-1 hover:text-blue-500" onClick={()=>openModal(record)} title="Edit"><Edit size={16}/></button>
                  <button className="p-1 hover:text-green-500" onClick={()=>handleSendToInventory(record)} title="Send to Inventory Management"><Send size={16}/></button>
                  <button className="p-1 hover:text-red-500" onClick={()=>handleDelete(record._id)} title="Delete"><Trash size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={`fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start pt-24 z-50`}>
          <div className={`p-6 rounded-xl w-full max-w-2xl relative ${bgCard} border`} style={{borderColor}}>
            <h2 className="text-xl font-semibold mb-4">{editingRecord ? 'Edit Harvest Record' : 'Add Harvest Record'}</h2>
            <form className="flex flex-col gap-4" onSubmit={async e=>{
              e.preventDefault();
              const data = {
                plantType: e.target.plantType.value,
                greenhouseNo: e.target.greenhouseNo.value,
                harvestDate: e.target.harvestDate.value,
                quantity: parseFloat(e.target.quantity.value),
                qualityGrade: e.target.qualityGrade.value,
                worker: e.target.worker.value,
              };
              if(editingRecord) await handleUpdate(editingRecord._id, data);
              else await handleAdd(data);
              setShowModal(false);
              setEditingRecord(null);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label>Plant Type</label>
                  <input name="plantType" defaultValue={editingRecord?.plantType||''} required
                    style={{backgroundColor: inputBg, color: inputText, borderColor}} className="px-3 py-2 border rounded-md"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label>Greenhouse No</label>
                  <input name="greenhouseNo" defaultValue={editingRecord?.greenhouseNo||''} required
                    style={{backgroundColor: inputBg, color: inputText, borderColor}} className="px-3 py-2 border rounded-md"/>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label>Harvest Date</label>
                <input type="date" name="harvestDate" defaultValue={editingRecord ? new Date(editingRecord.harvestDate).toISOString().split('T')[0] : ''} required
                  style={{backgroundColor: inputBg, color: inputText, borderColor}} className="px-3 py-2 border rounded-md"/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label>Quantity (kg)</label>
                  <input type="number" name="quantity" defaultValue={editingRecord?.quantity||0} required
                    style={{backgroundColor: inputBg, color: inputText, borderColor}} className="px-3 py-2 border rounded-md"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label>Quality Grade</label>
                  <select name="qualityGrade" defaultValue={editingRecord?.qualityGrade||''} required
                    style={{backgroundColor: inputBg, color: inputText, borderColor}} className="px-3 py-2 border rounded-md">
                    <option value="">Select Grade</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label>Worker</label>
                <input name="worker" defaultValue={editingRecord?.worker||''} required
                  style={{backgroundColor: inputBg, color: inputText, borderColor}} className="px-3 py-2 border rounded-md"/>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={()=>{setShowModal(false); setEditingRecord(null)}} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Productivity;