import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Plus, Edit, Trash, Download } from 'lucide-react';
import Modal from '../Modal.jsx';
import "../styles/theme.css";

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Productivity = () => {
  const { t } = useLanguage();
  const [records, setRecords] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch records from backend
  const fetchRecords = async (plantType = '') => {
    const res = await axios.get(`/api/productivity${plantType ? `?plantType=${plantType}` : ''}`);
    setRecords(res.data);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleAdd = async (data) => {
    const res = await axios.post('/api/productivity', data);
    setRecords([res.data, ...records]);
  };

  const handleUpdate = async (id, data) => {
    const res = await axios.put(`/api/productivity/${id}`, data);
    setRecords(records.map(r => r._id === id ? res.data : r));
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/productivity/${id}`);
    setRecords(records.filter(r => r._id !== id));
  };

  const annualHarvestData = () => {
    const yearMap = {};
    records.forEach(r => {
      const year = new Date(r.harvestDate).getFullYear();
      yearMap[year] = (yearMap[year] || 0) + r.quantity;
    });
    const years = [2021, 2022, 2023, 2024, 2025];
    return years.map(y => ({ year: y, quantity: yearMap[y] || 0 }));
  };

  const monthlyYieldData = () => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthMap = {};
    records
      .filter(r => selectedPlant ? r.plantType === selectedPlant : true)
      .forEach(r => {
        const m = new Date(r.harvestDate).getMonth();
        monthMap[m] = (monthMap[m] || 0) + r.quantity;
      });
    return months.map((month, idx) => ({ month, yield: monthMap[idx] || 0 }));
  };

  return (
    <div className="flex flex-col gap-6 p-4 bg-gray-50 min-h-screen">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Productivity</h1>
        <input
          type="text"
          placeholder="Search Plant Type..."
          className="border rounded px-3 py-2"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button
          className="flex items-center gap-1 px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} /> Add Harvest Record
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Annual Harvest</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={annualHarvestData()} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity" fill="#2E7D32" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow-md rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Monthly Yield {selectedPlant && `- ${selectedPlant}`}</h3>
          <select
            className="border rounded px-2 py-1 mb-2"
            value={selectedPlant}
            onChange={e => { setSelectedPlant(e.target.value); fetchRecords(e.target.value); }}
          >
            <option value="">All Plants</option>
            {[...new Set(records.map(r => r.plantType))].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyYieldData()} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="yield" stroke="#66BB6A" activeDot={{ r: 8 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Harvest Table */}
      <div className="bg-white shadow-md rounded-lg p-4">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100">
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
              .filter(r => r.plantType.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(record => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{record.plantType}</td>
                  <td className="px-4 py-2">{record.greenhouseNo}</td>
                  <td className="px-4 py-2">{new Date(record.harvestDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{record.quantity}</td>
                  <td className="px-4 py-2">{record.qualityGrade}</td>
                  <td className="px-4 py-2">{record.worker}</td>
                  <td className="px-4 py-2 flex gap-1">
                    <button className="p-1 rounded hover:bg-blue-100" onClick={() => console.log('Edit', record._id)}>
                      <Edit size={16} />
                    </button>
                    <button className="p-1 rounded hover:bg-red-100" onClick={() => handleDelete(record._id)}>
                      <Trash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title="Add Harvest Record" onClose={() => setShowModal(false)}>
          <form
            className="flex flex-col gap-4"
            onSubmit={async e => {
              e.preventDefault();
              const data = {
                plantType: e.target.plantType.value,
                greenhouseNo: e.target.greenhouseNo.value,
                harvestDate: e.target.harvestDate.value,
                quantity: parseFloat(e.target.quantity.value),
                qualityGrade: e.target.qualityGrade.value,
                worker: e.target.worker.value,
              };
              await handleAdd(data);
              setShowModal(false);
            }}
          >
            {/* form fields same as previous */}
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Productivity;
