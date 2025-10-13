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
import { FileDown, Filter, Plus, ChevronDown, Edit, Trash2, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Loader from '../Loader/Loader.js'; // Import the Loader component
import { useETheme } from '../Econtexts/EThemeContext.jsx';


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

export const OvertimeMonitor = () => {
  const { theme } = useETheme();
  const darkMode = theme === 'dark';

  // Set browser tab title
  useEffect(() => {
    document.title = "Overtime Monitor - Employee Manager";
  }, []);

  const [activeTab, setActiveTab] = useState('records');

  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(true); // Loader state

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

  // ===== compute stats directly from the table (for the selected month/year) =====
  // Move useMemo hooks before any conditional returns
  const { totalOvertimeHours, avgPerEmployeeHours } = useMemo(() => {
    if (!Array.isArray(overtimeRecords) || overtimeRecords.length === 0) {
      return { totalOvertimeHours: 0, avgPerEmployeeHours: 0 };
    }
    const total = overtimeRecords.reduce((sum, r) => {
      let hours = 0;
      if (typeof r.overtimeHours === 'string' && r.overtimeHours.includes(':')) {
        // Handle string format like "2:30"
        const [h, m] = r.overtimeHours.split(':').map(Number);
        hours = h + (m / 60);
      } else {
        // Handle number format
        hours = Number(r.overtimeHours) || 0;
      }
      return sum + hours;
    }, 0);
    const uniqueEmployees = new Set(overtimeRecords.map((r) => r.employee?._id || r.employee)).size;
    return {
      totalOvertimeHours: total,
      avgPerEmployeeHours: uniqueEmployees ? total / uniqueEmployees : 0,
    };
  }, [overtimeRecords]);

  // fetch employees
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:5000/api/employees');
        const data = await res.json();
        // Handle both old format (array) and new format ({ docs: [...] })
        const employeesArray = Array.isArray(data) ? data : (data.docs || []);
        setEmployees(employeesArray);
      } catch (e) {
        console.error('Error fetching employees:', e);
      }
    })();
  }, []);

  // fetch overtime records (list table)
  const fetchOvertimeRecords = async () => {
    setLoading(true);
    setShowLoader(true); // Show loader when fetching data
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
      setShowLoader(false); // Hide loader when done
    }
  };

  // analytics fetchers
  const fetchTrend = async () => {
    setLoading(true);
    setShowLoader(true); // Show loader when fetching analytics
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
      setShowLoader(false); // Hide loader when done
    }
  };

  const fetchTopEmployees = async () => {
    setLoading(true);
    setShowLoader(true); // Show loader when fetching analytics
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
      setShowLoader(false); // Hide loader when done
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

  // Show loader while loading
  if (showLoader) {
    return <Loader darkMode={darkMode} />;
  }

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
      setShowLoader(true); // Show loader when submitting form
      
      // Calculate overtime hours if work extends beyond 5 PM
      const workDate = new Date(formData.date);
      const currentTime = new Date();
      const isToday = workDate.toDateString() === currentTime.toDateString();
      
      let regularHours = parseFloat(formData.regularHours) || 0;
      let overtimeHours = parseFloat(formData.overtimeHours) || 0;
      
      // If it's today and current time is after 5 PM, calculate overtime
      if (isToday && currentTime.getHours() >= 17) {
        const hoursWorkedAfter5 = currentTime.getHours() - 17;
        const minutesWorkedAfter5 = currentTime.getMinutes();
        const totalOvertimeToday = hoursWorkedAfter5 + (minutesWorkedAfter5 / 60);
        
        // Add to existing overtime hours
        overtimeHours += totalOvertimeToday;
        
        // Adjust regular hours to not exceed 8 hours
        if (regularHours > 8) {
          const excessRegular = regularHours - 8;
          overtimeHours += excessRegular;
          regularHours = 8;
        }
      }
      
      const submitData = {
        ...formData,
        regularHours: regularHours,
        overtimeHours: overtimeHours,
        totalHours: regularHours + overtimeHours
      };
      
      const url = editingRecord
        ? `http://localhost:5000/api/overtime/${editingRecord}`
        : 'http://localhost:5000/api/overtime';
      const method = editingRecord ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      if (!res.ok) throw new Error('Failed to save record');
      setShowForm(false);
      setEditingRecord(null);
      resetForm();
      fetchOvertimeRecords();
    } catch (e) {
      console.error('Error saving record:', e);
    } finally {
      setShowLoader(false); // Hide loader when done
    }
  };

  const handleDelete = async (id) => {
    try {
      setShowLoader(true); // Show loader when deleting
      const res = await fetch(`http://localhost:5000/api/overtime/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setDeleteConfirm(null);
      fetchOvertimeRecords();
    } catch (e) {
      console.error('Error deleting record:', e);
    } finally {
      setShowLoader(false); // Hide loader when done
    }
  };

  const formatHours = (hours) => {
    // Handle string format like "2:30" or "0:00"
    if (typeof hours === 'string' && hours.includes(':')) {
      return hours; // Return as-is if already in H:MM format
    }
    
    // Handle number format (decimal hours)
    const whole = Math.floor(Number(hours) || 0);
    const minutes = Math.round(((Number(hours) || 0) - whole) * 60);
    return `${whole}:${minutes.toString().padStart(2, '0')}`;
  };

  // ===== Export CURRENT TABLE VIEW as PDF (Professional Frontend Generation) =====
  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Company information
    const companyName = "Mount Olive Farm House";
    const companyAddress = "No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka";
    const companyContact = "Phone: +94 81 249 2134 | Email: info@mountolivefarm.com";
    const companyWebsite = "www.mountolivefarm.com";
    const reportDate = new Date().toLocaleDateString();
    const reportTime = new Date().toLocaleTimeString();
    
    // Professional color scheme
    const primaryColor = [34, 197, 94]; // Green
    const secondaryColor = [16, 185, 129]; // Teal
    const accentColor = [59, 130, 246]; // Blue
    const textColor = [31, 41, 55]; // Dark gray
    const lightGray = [243, 244, 246];

    // Add real company logo
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        doc.addImage(logoImg, 'PNG', 15, 10, 25, 25);
        generatePDFContent();
      };
      logoImg.onerror = () => {
        // Fallback to placeholder if logo fails to load
        doc.setFillColor(...primaryColor);
        doc.rect(15, 10, 25, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('MOF', 27, 25, { align: 'center' });
        generatePDFContent();
      };
      logoImg.src = '/logo512.png';
    } catch (error) {
      console.error('Error loading logo:', error);
      // Fallback to placeholder
      doc.setFillColor(...primaryColor);
      doc.rect(15, 10, 25, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MOF', 27, 25, { align: 'center' });
      generatePDFContent();
    }

    const generatePDFContent = () => {
      // Company header
      doc.setTextColor(...textColor);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, 45, 18);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(companyAddress, 45, 25);
      doc.text(companyContact, 45, 30);
      doc.text(companyWebsite, 45, 35);

      // Report title with professional styling
      doc.setFillColor(...lightGray);
      doc.rect(15, 40, 180, 10, 'F');
      doc.setTextColor(...primaryColor);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('OVERTIME MANAGEMENT REPORT', 105, 47, { align: 'center' });

      // Report metadata
      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Generated: ${reportDate} at ${reportTime}`, 15, 58);
      doc.text(`Period: ${new Date(0, filters.month - 1).toLocaleString('default', { month: 'long' })} ${filters.year}`, 15, 63);
      doc.text(`Report ID: MOF-OT-${Date.now().toString().slice(-6)}`, 15, 68);

      // Summary statistics
      doc.setFillColor(...secondaryColor);
      doc.rect(15, 75, 180, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('OVERTIME SUMMARY', 20, 81);

      doc.setTextColor(...textColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Records: ${overtimeRecords.length}`, 20, 90);
      doc.text(`Total Overtime Hours: ${formatHours(totalOvertimeHours)}`, 20, 95);
      doc.text(`Average Per Employee: ${formatHours(avgPerEmployeeHours)}`, 20, 100);

      // Prepare table data
      const headers = [["No", "Overtime ID", "Employee", "Date", "Regular Hours", "Overtime Hours", "Total Hours"]];
      
      const data = overtimeRecords.map((record, index) => [
        (index + 1).toString(),
        record.overtimeId || makeOvertimeIdFallback(record),
        record.employee?.name || 'N/A',
        new Date(record.date).toLocaleDateString(),
        formatHours(record.regularHours),
        formatHours(record.overtimeHours),
        formatHours(record.totalHours)
      ]);

      // Create professional table
      autoTable(doc, {
        head: headers,
        body: data,
        startY: 110,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: 3
        },
        bodyStyles: {
          fontSize: 8,
          textColor: textColor,
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { left: 15, right: 15 },
        styles: {
          lineColor: [209, 213, 219],
          lineWidth: 0.5,
          halign: 'left',
          valign: 'middle',
          overflow: 'linebreak'
        },
        didDrawPage: (data) => {
          // Add header and footer to each page
          addHeaderFooter();
        }
      });

      // Professional footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        addHeaderFooter();
      }

      // Save PDF with professional naming
      const monthName = new Date(0, filters.month - 1).toLocaleString('default', { month: 'long' });
      const fileName = `MOF_Overtime_Report_${monthName}_${filters.year}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    };

    const addHeaderFooter = () => {
      const pageCount = doc.internal.getNumberOfPages();
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      
      // Footer background
      doc.setFillColor(...lightGray);
      doc.rect(0, 275, 210, 20, 'F');
      
      // Footer content
      doc.setTextColor(...textColor);
      doc.setFontSize(8);
      doc.text(`Page ${currentPage} of ${pageCount}`, 15, 283);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 283, { align: 'center' });
      doc.text(companyName, 195, 283, { align: 'right' });
      
      // Footer line
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(15, 285, 195, 285);
      
      // Disclaimer
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.text("This report is generated by Mount Olive Farm House Management System", 105, 290, { align: 'center' });
    };
  };

  const handlePageChange = (newPage) => setPagination((p) => ({ ...p, page: newPage }));

  // pie colors
  const PIE_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f97316', '#f43f5e', '#a78bfa', '#22d3ee'];

  // legend text color based on theme
  const legendStyle = { color: darkMode ? '#E5E7EB' : '#374151' };

  // custom pie label so text stays readable in dark mode
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const label = `${name} (${formatHours(value)})`;
    return (
      <text x={x} y={y} fill={darkMode ? '#E5E7EB' : '#374151'} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
        {label}
      </text>
    );
  };

  return (
    <div className={`p-4 space-y-6 min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'light-beige'}`}>
      {/* PAGE HEADER — title + one-line tagline */}
      <div className="mb-2">
        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Overtime Management System
        </h1>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Track and optimize extra hours with real-time insights and simple controls.
        </p>
      </div>

      {/* Tabs */}
      <div className={`flex space-x-4 border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          onClick={() => setActiveTab('records')}
          className={`pb-2 px-4 ${activeTab === 'records' ? 'border-b-2 border-blue-500 text-blue-500 font-semibold' : 
            darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Overtime Records
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-2 px-4 ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-500 font-semibold' : 
            darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* RECORDS TAB */}
      {activeTab === 'records' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', Number(e.target.value))}
                className={`border rounded-md px-2 py-1 ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200' 
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
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
                className={`border rounded-md px-2 py-1 ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200' 
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
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
                className={`border rounded-md px-2 py-1 hidden ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200' 
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <button
                onClick={applyFilters}
                className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
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
            <div className={`p-4 rounded-xl shadow ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h4 className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Overtime Hours</h4>
              <p className="text-2xl font-bold text-orange-500">
                {formatHours(totalOvertimeHours)}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>This selection</p>
            </div>
            <div className={`p-4 rounded-xl shadow ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h4 className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Average Per Employee</h4>
              <p className="text-2xl font-bold text-blue-500">
                {formatHours(avgPerEmployeeHours)}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>hours/month</p>
            </div>
          </div>

          {/* Table (first column now Overtime ID) */}
          <div className="overflow-x-auto mt-6">
            <table className="w-full border-collapse">
              <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-100'}>
                <tr>
                  {['No', 'ID', 'Employee', 'Date', 'Regular Hours', 'Overtime Hours', 'Total Hours', 'Actions'].map((h) => (
                    <th key={h} className={`px-4 py-2 text-left text-sm font-semibold ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overtimeRecords.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={`px-4 py-4 text-center ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      No overtime records found
                    </td>
                  </tr>
                ) : (
                  overtimeRecords.map((record, index) => (
                    <tr key={record._id} className={`border-t ${
                      darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <td className={`px-4 py-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {index + 1}
                      </td>
                      <td className={`px-4 py-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {record.overtimeId || makeOvertimeIdFallback(record)}
                      </td>
                      <td className={`px-4 py-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{record.employee?.name}</td>
                      <td className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{new Date(record.date).toLocaleDateString()}</td>
                      <td className={`px-4 py-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{formatHours(record.regularHours)}</td>
                      <td className={`px-4 py-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{formatHours(record.overtimeHours)}</td>
                      <td className={`px-4 py-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{formatHours(record.totalHours)}</td>
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
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Controls (Export removed) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Overtime Trend</h3>
                <select
                  value={trendWindow}
                  onChange={(e) => setTrendWindow(e.target.value)}
                  className={`border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
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
                    <Legend wrapperStyle={legendStyle} />
                    <Line type="monotone" dataKey="hours" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`p-4 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Top Overtime Employees</h3>
                <button className="flex items-center gap-1 text-sm">
                  <select
                    value={topRange}
                    onChange={(e) => setTopRange(e.target.value)}
                    className={`border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
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
                      label={renderPieLabel}
                      labelLine={{ stroke: darkMode ? '#6B7280' : '#9CA3AF' }}
                    >
                      {topEmployees.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={
                        darkMode
                          ? { backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }
                          : {}
                      }
                    />
                    <Legend wrapperStyle={legendStyle} />
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
                  className={`w-full border rounded-md px-3 py-2 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
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
                  className={`w-full border rounded-md px-3 py-2 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
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
                    className={`w-full border rounded-md px-3 py-2 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
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
                    className={`w-full border rounded-md px-3 py-2 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
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
                  className={`w-full border rounded-md px-3 py-2 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
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
