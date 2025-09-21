import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { FileDown, Filter, Plus, ChevronDown, Loader, Edit, Trash2, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ===== helpers to build a professional Overtime ID (frontend fallback) =====
const looksLikeObjectId = (s) => typeof s === 'string' && /^[0-9a-f]{24}$/i.test(s);

const getEmployeeCode = (emp) => {
  if (!emp) return 'EMP-XXX';
  const candidates = [
    emp.employeeCode,
    emp.code,
    emp.empId,
    emp.staffId,
    emp.employeeId,
    emp.customId,
    emp.hrId,
    emp.id, // sometimes teams store a custom code here
  ].filter(Boolean);

  const chosen = candidates.find((c) => typeof c === 'string' && !looksLikeObjectId(c));
  if (chosen) return String(chosen).toUpperCase();

  const namePart = (emp.name || 'EMP').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
  return `EMP-${namePart}`;
};

const makeOvertimeIdFallback = (record) => {
  const code = getEmployeeCode(record?.employee);
  const d = new Date(record?.date || Date.now());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const tail = (record?._id || '').toString().slice(-6).toUpperCase();
  return `OT-${code}-${y}${m}${day}-${tail}`;
};

export const OvertimeMonitor = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState('records');

  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // records filtering/pagination
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: '' // kept in case you still want to filter on server, but we remove status column
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });

  // form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee: '',
    date: '',
    regularHours: '',
    overtimeHours: '',
    description: ''
  });
  const [employees, setEmployees] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // analytics state (built from API helpers)
  const [trendWindow, setTrendWindow] = useState('30'); // 30 | 90 | 365
  const [trendData, setTrendData] = useState([]);       // last 30/90/this year
  const [topRange, setTopRange] = useState('thisMonth'); // thisMonth | lastMonth
  const [topEmployees, setTopEmployees] = useState([]);  // for pie chart

  // fetch employees
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:5000/api/employees');
        const data = await res.json();
        setEmployees(data);
      } catch (e) {
        console.error('Error fetching employees:', e);
      }
    })();
  }, []);

  // fetch overtime records (list table)
  const fetchOvertimeRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: filters.month,
        year: filters.year,
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
      });
      const res = await fetch(`http://localhost:5000/api/overtime?${params}`);
      const data = await res.json();
      setOvertimeRecords(data.records || []);
      setPagination((p) => ({ ...p, totalPages: data.totalPages || 1, total: data.total || 0 }));
    } catch (e) {
      console.error('Error fetching overtime records:', e);
    } finally {
      setLoading(false);
    }
  };

  // analytics fetchers
  const fetchTrend = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/overtime/analytics?mode=trend&window=${trendWindow}`
      );
      const data = await res.json();
      setTrendData(
        (data.trendData || []).map((d) => ({
          name: d.label || d.date,
          hours: d.hours,
        }))
      );
    } catch (e) {
      console.error('Error fetching trend:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/overtime/analytics?mode=top&range=${topRange}`
      );
      const data = await res.json();
      setTopEmployees(data.topEmployees || []);
    } catch (e) {
      console.error('Error fetching top employees:', e);
    } finally {
      setLoading(false);
    }
  };

  // tab -> load content
  useEffect(() => {
    if (activeTab === 'records') {
      fetchOvertimeRecords();
    } else {
      fetchTrend();
      fetchTopEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // pagination page change re-load
  useEffect(() => {
    if (activeTab === 'records') fetchOvertimeRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  // analytics control changes
  useEffect(() => {
    if (activeTab === 'analytics') fetchTrend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendWindow]);

  useEffect(() => {
    if (activeTab === 'analytics') fetchTopEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topRange]);

  // helpers
  const handleFilterChange = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const applyFilters = () => {
    if (activeTab === 'records') {
      setPagination((p) => ({ ...p, page: 1 }));
      fetchOvertimeRecords();
    }
  };
  const handleInputChange = (e) => setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));
  const resetForm = () =>
    setFormData({ employee: '', date: '', regularHours: '', overtimeHours: '', description: '' });

  const handleEdit = (record) => {
    setEditingRecord(record._id);
    setFormData({
      employee: record.employee?._id,
      date: new Date(record.date).toISOString().split('T')[0],
      regularHours: record.regularHours,
      overtimeHours: record.overtimeHours,
      description: record.description || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingRecord
        ? `http://localhost:5000/api/overtime/${editingRecord}`
        : 'http://localhost:5000/api/overtime';
      const method = editingRecord ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to save record');
      setShowForm(false);
      setEditingRecord(null);
      resetForm();
      fetchOvertimeRecords();
    } catch (e) {
      console.error('Error saving record:', e);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/overtime/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setDeleteConfirm(null);
      fetchOvertimeRecords();
    } catch (e) {
      console.error('Error deleting record:', e);
    }
  };

  // ===== compute stats directly from the table (for the selected month/year) =====
  const { totalOvertimeHours, avgPerEmployeeHours } = useMemo(() => {
    if (!Array.isArray(overtimeRecords) || overtimeRecords.length === 0) {
      return { totalOvertimeHours: 0, avgPerEmployeeHours: 0 };
    }
    const total = overtimeRecords.reduce((sum, r) => sum + (Number(r.overtimeHours) || 0), 0);
    const uniqueEmployees = new Set(overtimeRecords.map((r) => r.employee?._id || r.employee)).size;
    return {
      totalOvertimeHours: total,
      avgPerEmployeeHours: uniqueEmployees ? total / uniqueEmployees : 0,
    };
  }, [overtimeRecords]);

  const formatHours = (hours) => {
    const whole = Math.floor(Number(hours) || 0);
    const minutes = Math.round(((Number(hours) || 0) - whole) * 60);
    return `${whole}:${minutes.toString().padStart(2, '0')}`;
  };

  // ===== Export CURRENT TABLE VIEW as PDF (uses Overtime ID) =====
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const title = `Overtime Records - ${new Date(0, filters.month - 1).toLocaleString('default', {
      month: 'long',
    })} ${filters.year}`;

    doc.setFontSize(16);
    doc.text(title, 14, 14);

    const body = overtimeRecords.map((r) => [
      r.overtimeId || makeOvertimeIdFallback(r), // <-- OVERTIME ID
      r.employee?.name || '',
      new Date(r.date).toLocaleDateString(),
      formatHours(r.regularHours),
      formatHours(r.overtimeHours),
      formatHours(r.totalHours),
      r.description || '-',
    ]);

    autoTable(doc, {
      head: [['ID', 'Employee', 'Date', 'Regular Hours', 'Overtime Hours', 'Total Hours', 'Description']],
      body,
      startY: 20,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [33, 150, 243] },
    });

    // footer summary
    const endY = doc.lastAutoTable.finalY || 20;
    doc.setFontSize(12);
    doc.text(`Total Overtime: ${formatHours(totalOvertimeHours)}`, 14, endY + 10);
    doc.text(
      `Average per Employee: ${formatHours(avgPerEmployeeHours)} hours/month`,
      80,
      endY + 10
    );

    doc.save(
      `overtime-records-${filters.year}-${String(filters.month).padStart(2, '0')}.pdf`
    );
  };

  const handlePageChange = (newPage) => setPagination((p) => ({ ...p, page: newPage }));

  // pie colors
  const PIE_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f97316', '#f43f5e', '#a78bfa', '#22d3ee'];

  return (
    <div className={`p-4 space-y-6 min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('records')}
          className={`pb-2 px-4 ${activeTab === 'records' ? 'border-b-2 border-blue-500 text-blue-500 font-semibold' : 'text-gray-500'}`}
        >
          Overtime Records
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-2 px-4 ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-500 font-semibold' : 'text-gray-500'}`}
        >
          Analytics
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader className="animate-spin" size={32} />
        </div>
      )}

      {/* RECORDS TAB */}
      {!loading && activeTab === 'records' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', Number(e.target.value))}
                className="border rounded-md px-2 py-1 dark:bg-gray-800 dark:border-gray-700"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', Number(e.target.value))}
                className="border rounded-md px-2 py-1 dark:bg-gray-800 dark:border-gray-700"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const y = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  );
                })}
              </select>

              {/* optional status control kept hidden */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border rounded-md px-2 py-1 dark:bg-gray-800 dark:border-gray-700 hidden"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <button
                onClick={applyFilters}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <Filter size={18} />
                <span>Filter</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setEditingRecord(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-btn-teal text-white hover:bg-green-700"
              >
                <Plus size={18} />
                <span>Add Record</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-btn-blue text-white hover:bg-blue-700"
              >
                <FileDown size={18} />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl shadow bg-white dark:bg-dark-card">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">Total Overtime Hours</h4>
              <p className="text-2xl font-bold text-orange-500">
                {formatHours(totalOvertimeHours)}
              </p>
              <p className="text-xs text-gray-400">This selection</p>
            </div>
            <div className="p-4 rounded-xl shadow bg-white dark:bg-dark-card">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">Average Per Employee</h4>
              <p className="text-2xl font-bold text-blue-500">
                {formatHours(avgPerEmployeeHours)}
              </p>
              <p className="text-xs text-gray-400">hours/month</p>
            </div>
          </div>

          {/* Table (first column now Overtime ID) */}
          <div className="overflow-x-auto mt-6">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  {['ID', 'Employee', 'Date', 'Regular Hours', 'Overtime Hours', 'Total Hours', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-sm font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overtimeRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                      No overtime records found
                    </td>
                  </tr>
                ) : (
                  overtimeRecords.map((record) => (
                    <tr key={record._id} className="border-t dark:border-gray-700">
                      <td className="px-4 py-2">
                        {record.overtimeId || makeOvertimeIdFallback(record)}
                      </td>
                      <td className="px-4 py-2">{record.employee?.name}</td>
                      <td className="px-4 py-2">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{formatHours(record.regularHours)}</td>
                      <td className="px-4 py-2">{formatHours(record.overtimeHours)}</td>
                      <td className="px-4 py-2">{formatHours(record.totalHours)}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(record._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="mx-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* ANALYTICS TAB */}
      {!loading && activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Controls (Export removed) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl shadow bg-white dark:bg-dark-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Overtime Trend</h3>
                <select
                  value={trendWindow}
                  onChange={(e) => setTrendWindow(e.target.value)}
                  className="border rounded-md px-2 py-1 dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="365">This Year</option>
                </select>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                    <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                    <Tooltip
                      contentStyle={
                        darkMode
                          ? { backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }
                          : {}
                      }
                    />
                    <Legend />
                    <Line type="monotone" dataKey="hours" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-4 rounded-xl shadow bg-white dark:bg-dark-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Top Overtime Employees</h3>
                <button className="flex items-center gap-1 text-sm">
                  <select
                    value={topRange}
                    onChange={(e) => setTopRange(e.target.value)}
                    className="border rounded-md px-2 py-1 dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                  </select>
                  <ChevronDown size={16} className="hidden" />
                </button>
              </div>

              {/* Pie chart distribution */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      dataKey="hours"
                      nameKey="name"
                      data={topEmployees}
                      outerRadius={100}
                      label={(d) => `${d.name} (${formatHours(d.hours)})`}
                    >
                      {topEmployees.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Record Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg p-6 w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{editingRecord ? 'Edit Overtime Record' : 'Add Overtime Record'}</h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingRecord(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Employee</label>
                <select
                  name="employee"
                  value={formData.employee}
                  onChange={handleInputChange}
                  required
                  className="w-full border rounded-md px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full border rounded-md px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Regular Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    name="regularHours"
                    value={formData.regularHours}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-md px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Overtime Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    name="overtimeHours"
                    value={formData.overtimeHours}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-md px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRecord(null);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-md bg-btn-gray text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-md bg-btn-teal text-white hover:bg-green-700">
                  {editingRecord ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg p-6 w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-6">Are you sure you want to delete this overtime record? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-md bg-btn-gray text-white hover:bg-gray-600">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 rounded-md bg-btn-red text-white hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
