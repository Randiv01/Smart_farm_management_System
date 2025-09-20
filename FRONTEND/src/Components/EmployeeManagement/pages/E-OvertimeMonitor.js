import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { FileDown, Filter, Plus, ChevronDown, Loader, Edit, Trash2, X } from 'lucide-react';

export const OvertimeMonitor = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState('records');
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: ''
  });
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0
  });

  // Fetch employees for dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/employees');
        const data = await response.json();
        setEmployees(data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };
    
    fetchEmployees();
  }, []);

  // Fetch overtime records
  const fetchOvertimeRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: filters.month,
        year: filters.year,
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status })
      });
      
      const response = await fetch(`http://localhost:5000/api/overtime?${params}`);
      const data = await response.json();
      setOvertimeRecords(data.records);
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages,
        total: data.total
      }));
    } catch (error) {
      console.error('Error fetching overtime records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/overtime/analytics?period=monthly');
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'records') {
      fetchOvertimeRecords();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, pagination.page]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    if (activeTab === 'records') {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchOvertimeRecords();
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      employee: '',
      date: '',
      regularHours: '',
      overtimeHours: '',
      description: ''
    });
    setEditingRecord(null);
  };

  // Open form for editing
  const handleEdit = (record) => {
    setEditingRecord(record._id);
    setFormData({
      employee: record.employee._id,
      date: new Date(record.date).toISOString().split('T')[0],
      regularHours: record.regularHours,
      overtimeHours: record.overtimeHours,
      description: record.description || ''
    });
    setShowForm(true);
  };

  // Submit new or update overtime record
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingRecord 
        ? `http://localhost:5000/api/overtime/${editingRecord}`
        : 'http://localhost:5000/api/overtime';
      
      const method = editingRecord ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowForm(false);
        resetForm();
        fetchOvertimeRecords(); // Refresh the list
      } else {
        console.error('Failed to save record');
      }
    } catch (error) {
      console.error('Error saving record:', error);
    }
  };

  // Delete overtime record
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/overtime/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setDeleteConfirm(null);
        fetchOvertimeRecords(); // Refresh the list
      } else {
        console.error('Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  // Export data
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        month: filters.month,
        year: filters.year,
        ...(filters.status && { status: filters.status })
      });
      
      const response = await fetch(`http://localhost:5000/api/overtime/export?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `overtime-records-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // Format chart data
  const formatChartData = () => {
    if (!analyticsData?.trendData) return [];
    
    return analyticsData.trendData.map(item => ({
      name: `Month ${item._id}`,
      hours: item.totalHours
    }));
  };

  // Format employee progress data
  const formatEmployeeData = () => {
    if (!analyticsData?.topEmployees) return [];
    
    const maxHours = Math.max(...analyticsData.topEmployees.map(e => e.hours));
    
    return analyticsData.topEmployees.map(emp => ({
      ...emp,
      width: `${(emp.hours / maxHours) * 100}%`
    }));
  };

  // Format hours for display
  const formatHours = (hours) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

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

      {/* Records Tab */}
      {!loading && activeTab === 'records' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <select 
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
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
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="border rounded-md px-2 py-1 dark:bg-gray-800 dark:border-gray-700"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
              <select 
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border rounded-md px-2 py-1 dark:bg-gray-800 dark:border-gray-700"
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
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-btn-teal text-white hover:bg-green-700"
              >
                <Plus size={18} />
                <span>Add Record</span>
              </button>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-btn-blue text-white hover:bg-blue-700"
              >
                <FileDown size={18} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-xl shadow bg-white dark:bg-dark-card">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">Total Overtime Hours</h4>
              <p className="text-2xl font-bold text-orange-500">
                {analyticsData?.statistics?.totalOvertime ? formatHours(analyticsData.statistics.totalOvertime) : '0:00'}
              </p>
              <p className="text-xs text-gray-400">This month</p>
            </div>
            <div className="p-4 rounded-xl shadow bg-white dark:bg-dark-card">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">Average Per Employee</h4>
              <p className="text-2xl font-bold text-blue-500">
                {analyticsData?.statistics?.avgPerEmployee ? formatHours(analyticsData.statistics.avgPerEmployee) : '0:00'}
              </p>
              <p className="text-xs text-gray-400">Hours/month</p>
            </div>
            <div className="p-4 rounded-xl shadow bg-white dark:bg-dark-card">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">Pending Approval</h4>
              <p className="text-2xl font-bold text-yellow-500">{analyticsData?.statistics?.pendingCount || 0}</p>
              <p className="text-xs text-gray-400">Records</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-6">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  {['ID', 'Employee', 'Date', 'Regular Hours', 'Overtime Hours', 'Total Hours', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-sm font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overtimeRecords.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-4 text-center text-gray-500">
                      No overtime records found
                    </td>
                  </tr>
                ) : (
                  overtimeRecords.map((record) => (
                    <tr key={record._id} className="border-t dark:border-gray-700">
                      <td className="px-4 py-2">{record._id.substring(0, 6)}</td>
                      <td className="px-4 py-2">{record.employee?.name}</td>
                      <td className="px-4 py-2">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{formatHours(record.regularHours)}</td>
                      <td className="px-4 py-2">{formatHours(record.overtimeHours)}</td>
                      <td className="px-4 py-2">{formatHours(record.totalHours)}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold 
                          ${record.status === 'Approved' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 
                            record.status === 'Rejected' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' : 
                            'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                          {record.status}
                        </span>
                      </td>
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

      {/* Analytics Tab */}
      {!loading && activeTab === 'analytics' && analyticsData && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Overtime Analytics</h3>
            <div className="flex items-center gap-3">
              <select className="border rounded-md px-2 py-1 dark:bg-gray-800 dark:border-gray-700">
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>This Year</option>
                <option>Custom Range</option>
              </select>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-btn-blue text-white hover:bg-blue-700"
              >
                <FileDown size={18} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="p-4 rounded-xl shadow bg-white dark:bg-dark-card">
            <h4 className="mb-4 font-medium">Monthly Overtime Trend</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
                  <XAxis dataKey="name" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                  <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                  <Tooltip 
                    contentStyle={darkMode ? { 
                      backgroundColor: '#1F2937', 
                      borderColor: '#374151',
                      color: '#F9FAFB'
                    } : {}} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#f97316" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Employees */}
          <div className="p-4 rounded-xl shadow bg-white dark:bg-dark-card">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Top Overtime Employees</h4>
              <button className="flex items-center gap-1 text-sm">
                <span>This Month</span>
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {formatEmployeeData().map((emp, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm">
                    <span>{emp.name}</span>
                    <span>{formatHours(emp.hours)} hours</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: emp.width }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Record Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg p-6 w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingRecord ? 'Edit Overtime Record' : 'Add Overtime Record'}
              </h2>
              <button 
                onClick={() => {
                  setShowForm(false);
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
                  {employees.map(emp => (
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
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-md bg-btn-gray text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-btn-teal text-white hover:bg-green-700"
                >
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
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-md bg-btn-gray text-white hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-md bg-btn-red text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};