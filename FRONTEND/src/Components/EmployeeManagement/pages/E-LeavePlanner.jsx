// src/pages/E-LeavePlanner.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar, Plus, Edit, Trash2, X, Search, Download,
  BarChart3, User, Clock, AlertCircle
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  AreaChart, Area, CartesianGrid, XAxis, YAxis
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import Loader from "../Loader/Loader.js";
import { useETheme } from '../Econtexts/EThemeContext.jsx'; // Import the Loader component

const API = "/api/leaves";

const StatCard = ({ title, value, subtitle, icon: Icon, color, darkMode }) => (
  <div className={`p-4 rounded-lg shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"} ${darkMode ? "border-gray-700" : "border-gray-100"} border flex flex-col`}>
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-medium text-sm">{title}</h4>
      <div className={`p-2 rounded-full ${color.bg} ${color.text}`}>
        <Icon size={16} />
      </div>
    </div>
    <div className="mt-2">
      <p className={`text-2xl font-bold ${color.value}`}>{value}</p>
      <p className={`text-xs mt-1 ${
        darkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>{subtitle}</p>
    </div>
  </div>
);

const ChartContainer = React.forwardRef(({ title, children, darkMode, className = "" }, ref) => (
  <div ref={ref} className={`p-4 rounded-lg shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"} ${darkMode ? "border-gray-700" : "border-gray-100"} border ${className}`}>
    <h4 className="font-medium mb-4">{title}</h4>
    <div className="h-64">{children}</div>
  </div>
));

export const ELeavePlanner = () => {
  const { theme } = useETheme();

  // Set browser tab title
  useEffect(() => {
    document.title = "Leave Management - Employee Manager";
  }, []);
  const darkMode = theme === 'dark';
  const [activeTab, setActiveTab] = useState("requests");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState(String(new Date().getMonth() + 1)); // 1-12
  const [leaves, setLeaves] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [showLoader, setShowLoader] = useState(true); // Loader state
  const [allEmployees, setAllEmployees] = useState([]);

  const [tableSearch, setTableSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    empId: "", name: "", type: "Annual", from: "", to: "", days: "", reason: "", status: "Pending",
  });

  // analytics
  const [trendData, setTrendData] = useState([]);
  const [balanceEmp, setBalanceEmp] = useState("");
  const [balance, setBalance] = useState(null);
  const [upcomingEmp, setUpcomingEmp] = useState("");

  const empIdOptions = useMemo(
    () => Array.from(new Set(leaves.map(l => l.empId))).sort(),
    [leaves]
  );

  const distRef = useRef(null);
  const statusRef = useRef(null);
  const balanceRef = useRef(null);
  const trendRef = useRef(null);

  // Move hooks before any conditional returns
  // charts: distribution + status
  const leaveData = useMemo(() => {
    const sums = { Annual: 0, Sick: 0, Casual: 0, Other: 0 };
    leaves.forEach((l) => { sums[l.type] = (sums[l.type] || 0) + (l.days || 0); });
    return [
      { name: "Annual Leave", value: sums.Annual, color: "#3b82f6" },
      { name: "Sick Leave",   value: sums.Sick,   color: "#ef4444" },
      { name: "Casual Leave", value: sums.Casual, color: "#f59e0b" },
      { name: "Other",        value: sums.Other,  color: "#8b5cf6" },
    ];
  }, [leaves]);

  const statusData = useMemo(() => ([
    { name: "Pending",  value: stats.pending,  color: "#f59e0b" },
    { name: "Approved", value: stats.approved, color: "#10b981" },
    { name: "Rejected", value: stats.rejected, color: "#ef4444" },
  ]), [stats]);

  const filteredLeaves = useMemo(() => {
    if (!tableSearch.trim()) return leaves;
    const t = tableSearch.toLowerCase();
    return leaves.filter(r =>
      r.name?.toLowerCase().includes(t) || r.empId?.toLowerCase().includes(t)
    );
  }, [tableSearch, leaves]);

  const buildQuery = () => {
    const p = new URLSearchParams();
    if (statusFilter !== "All Status") p.append("status", statusFilter);
    if (typeFilter !== "All Types") p.append("type", typeFilter);
    if (yearFilter) p.append("year", yearFilter);
    if (monthFilter) p.append("month", monthFilter); // 1-12
    return p.toString();
  };

  const fetchAllEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      const employees = Array.isArray(data) ? data : (data.docs || []);
      setAllEmployees(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}?${buildQuery()}`);
      const data = await res.json();
      setLeaves(data);

      const pending = data.filter(l => l.status === "Pending").length;
      const approved = data.filter(l => l.status === "Approved").length;
      const rejected = data.filter(l => l.status === "Rejected").length;
      setStats({ pending, approved, rejected, total: data.length });
    } catch (e) {
      console.error("Error loading leaves:", e);
    } finally {
      setLoading(false);
      setShowLoader(false); // Hide loader when data is loaded
    }
  };

  // ------- Monthly Trend helpers (fallback if API empty) -------
  const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const zeroTrend = () =>
    Array.from({ length: 12 }, (_, i) => ({ month: monthLabels[i], leaves: 0, approved: 0 }));

  const computeTrendFromLeaves = () => {
    const y = Number(yearFilter);
    const rows = zeroTrend();
    const passStatus = (s) =>
      statusFilter === "All Status" ? true : s === statusFilter;
    const passType = (t) =>
      typeFilter === "All Types" ? true : t === typeFilter;

    leaves.forEach((l) => {
      const d = new Date(l.from);
      if (d.getFullYear() !== y) return;
      if (!passStatus(l.status) || !passType(l.type)) return;
      const idx = d.getMonth();
      rows[idx].leaves += 1;
      if (l.status === "Approved") rows[idx].approved += 1;
    });
    return rows;
  };

  // ✅ real monthly trend (tries API, falls back to local compute)
  const loadTrend = async () => {
    try {
      const qp = new URLSearchParams({ year: yearFilter });
      if (statusFilter !== "All Status") qp.append("status", statusFilter);
      if (typeFilter !== "All Types") qp.append("type", typeFilter);

      let data = zeroTrend();

      const res = await fetch(`${API}/trend?${qp.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.months?.length) {
          data = json.months.map((m) => ({
            month: monthLabels[(m.month ?? 1) - 1],
            leaves: m.leaves || 0,
            approved: m.approved || 0,
          }));
        }
      }

      const allZero = data.every(d => (d.leaves || 0) === 0 && (d.approved || 0) === 0);
      setTrendData(allZero ? computeTrendFromLeaves() : data);
    } catch (e) {
      console.error("Error loading trend:", e);
      setTrendData(computeTrendFromLeaves());
    }
  };

  const loadUpcoming = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const p = new URLSearchParams({ from: today });
      if (upcomingEmp) p.append("empId", upcomingEmp);
      const res = await fetch(`${API}/upcoming?${p.toString()}`);
      const data = await res.json();
      setUpcoming(data.slice(0, 30));
    } catch (e) {
      console.error("Error loading upcoming:", e);
    }
  };

  const loadBalance = async () => {
    if (!balanceEmp) { setBalance(null); return; }
    try {
      const res = await fetch(`${API}/balance?empId=${balanceEmp}&year=${yearFilter}`);
      const data = await res.json();
      setBalance(data?.balance || null);
    } catch (e) {
      console.error("Error fetching balance:", e);
      setBalance(null);
    }
  };

  // initial + live
  useEffect(() => {
    loadLeaves();
    loadTrend();
    fetchAllEmployees(); // Fetch all employees for dropdown
    const es = new EventSource(`${API}/stream`);
    es.addEventListener("change", () => {
      loadLeaves();
      loadTrend();
      loadUpcoming();
      loadBalance();
    });
    es.onerror = () => {};
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, yearFilter, monthFilter]);

  useEffect(() => {
    if (!trendData.length || trendData.every(m => m.leaves === 0 && m.approved === 0)) {
      setTrendData(computeTrendFromLeaves());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaves]);

  useEffect(() => { loadUpcoming(); }, [upcomingEmp, yearFilter]);
  useEffect(() => { loadBalance(); }, [balanceEmp, yearFilter]);

  // Show loader while loading
  if (showLoader) {
    return <Loader darkMode={darkMode} />;
  }

  // CRUD
  const submitForm = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form, days: form.days ? Number(form.days) : undefined };
      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API}/${editing._id}` : API;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Failed: ${err.error || res.statusText}`);
        return;
      }
      setShowForm(false);
      setEditing(null);
      setForm({ empId:"", name:"", type:"Annual", from:"", to:"", days:"", reason:"", status:"Pending" });
    } catch (e) {
      console.error("Error submitting form:", e);
      alert("Error submitting form. Please try again.");
    }
  };

  const onEdit = (row) => {
    setEditing(row);
    setForm({
      empId: row.empId,
      name: row.name,
      type: row.type,
      from: row.from?.slice(0, 10),
      to: row.to?.slice(0, 10),
      days: String(row.days || ""),
      reason: row.reason || "",
      status: row.status,
    });
    setShowForm(true);
  };

  const onDelete = async (row) => {
    if (!window.confirm("Are you sure you want to delete this leave request?")) return;
    try { await fetch(`${API}/${row._id}`, { method: "DELETE" }); }
    catch (e) {
      console.error("Error deleting leave:", e);
      alert("Error deleting leave request. Please try again.");
    }
  };

  /* --------------------- PDF (Professional design matching Animal Management style) --------------------- */

  const generatePDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    
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
        pdf.addImage(logoImg, 'PNG', 15, 10, 25, 25);
        generatePDFContent();
      };
      logoImg.onerror = () => {
        // Fallback to placeholder if logo fails to load
        pdf.setFillColor(...primaryColor);
        pdf.rect(15, 10, 25, 25, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MOF', 27, 25, { align: 'center' });
        generatePDFContent();
      };
      logoImg.src = '/logo512.png';
    } catch (error) {
      console.error('Error loading logo:', error);
      // Fallback to placeholder
      pdf.setFillColor(...primaryColor);
      pdf.rect(15, 10, 25, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MOF', 27, 25, { align: 'center' });
      generatePDFContent();
    }

    const generatePDFContent = () => {
      // Company header
      pdf.setTextColor(...textColor);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(companyName, 45, 18);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(companyAddress, 45, 25);
      pdf.text(companyContact, 45, 30);
      pdf.text(companyWebsite, 45, 35);

      // Report title with professional styling
      pdf.setFillColor(...lightGray);
      pdf.rect(15, 40, 180, 10, 'F');
      pdf.setTextColor(...primaryColor);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LEAVE MANAGEMENT REPORT', 105, 47, { align: 'center' });

      // Report metadata
      pdf.setTextColor(...textColor);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Report Generated: ${reportDate} at ${reportTime}`, 15, 58);
      pdf.text(`Year: ${yearFilter}`, 15, 63);
      pdf.text(`Report ID: MOF-LM-${Date.now().toString().slice(-6)}`, 15, 68);

      // Summary statistics
      pdf.setFillColor(...secondaryColor);
      pdf.rect(15, 75, 180, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LEAVE SUMMARY', 20, 81);

      pdf.setTextColor(...textColor);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Leave Requests: ${stats.total}`, 20, 90);
      pdf.text(`Approved: ${stats.approved}`, 20, 95);
      pdf.text(`Pending: ${stats.pending}`, 20, 100);
      pdf.text(`Rejected: ${stats.rejected}`, 20, 105);

      // Calculate leave type totals
      const typeTotals = leaveData.map(d => ({ type: d.name, totalDays: d.value }));
      const totalDays = Math.max(1, typeTotals.reduce((s, r) => s + (r.totalDays || 0), 0));
      
      pdf.text(`Total Leave Days: ${totalDays}`, 20, 110);
      typeTotals.forEach((item, index) => {
        const percentage = Math.round(((item.totalDays || 0) / totalDays) * 100);
        pdf.text(`${item.type}: ${item.totalDays} days (${percentage}%)`, 20, 115 + (index * 5));
      });

      // Prepare table data for leave requests
      const headers = [["Employee", "Emp ID", "Type", "From", "To", "Days", "Status", "Reason"]];
      
      const data = filteredLeaves.slice(0, 50).map(leave => [
        leave.name || 'N/A',
        leave.empId || 'N/A',
        leave.type || 'N/A',
        leave.from ? new Date(leave.from).toLocaleDateString() : 'N/A',
        leave.to ? new Date(leave.to).toLocaleDateString() : 'N/A',
        leave.days?.toString() || '0',
        leave.status || 'N/A',
        (leave.reason || 'N/A').substring(0, 30) + (leave.reason?.length > 30 ? '...' : '')
      ]);

      // Create professional table
      autoTable(pdf, {
        head: headers,
        body: data,
        startY: 140,
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
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        addHeaderFooter();
      }

      // Save PDF with professional naming
      const fileName = `MOF_Leave_Management_Report_${yearFilter}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    };

    const addHeaderFooter = () => {
      const pageCount = pdf.internal.getNumberOfPages();
      const currentPage = pdf.internal.getCurrentPageInfo().pageNumber;
      
      // Footer background
      pdf.setFillColor(...lightGray);
      pdf.rect(0, 275, 210, 20, 'F');
      
      // Footer content
      pdf.setTextColor(...textColor);
      pdf.setFontSize(8);
      pdf.text(`Page ${currentPage} of ${pageCount}`, 15, 283);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, 105, 283, { align: 'center' });
      pdf.text(companyName, 195, 283, { align: 'right' });
      
      // Footer line
      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(0.5);
      pdf.line(15, 285, 195, 285);
      
      // Disclaimer
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(7);
      pdf.text("This report is generated by Mount Olive Farm House Management System", 105, 290, { align: 'center' });
    };
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-md shadow-md ${darkMode ? 'bg-gray-700' : 'bg-white'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <p className="font-medium">{label}</p>
          {payload.map((e, i) => (
            <p key={i} style={{ color: e.color }}>{e.name}: {e.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-6 font-sans min-h-screen ${darkMode ? "bg-gray-900 text-white" : "light-beige"}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Leave Management System</h2>
        <p className={`text-sm ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {activeTab === "requests" ? "Manage and track employee leave requests" : "View leave analytics and summary reports"}
        </p>
      </div>

      {/* Tabs */}
      <div className={`flex mb-6 border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            activeTab === "requests" 
              ? "border-b-2 border-orange-500 text-orange-500" 
              : darkMode 
                ? "text-gray-400 hover:text-orange-400" 
                : "text-gray-600 hover:text-orange-500"
          }`}
        >
          <Calendar size={18} /><span>Leave Requests</span>
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            activeTab === "summary" 
              ? "border-b-2 border-orange-500 text-orange-500" 
              : darkMode 
                ? "text-gray-400 hover:text-orange-400" 
                : "text-gray-600 hover:text-orange-500"
          }`}
        >
          <BarChart3 size={18} /><span>Analytics & Reports</span>
        </button>
      </div>

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Leaves" value={stats.total} subtitle="All time" icon={Calendar}
              color={{ 
                bg: darkMode ? "bg-blue-800" : "bg-blue-100", 
                text: darkMode ? "text-blue-300" : "text-blue-500", 
                value: "text-blue-500" 
              }} darkMode={darkMode}/>
            <StatCard title="Pending" value={stats.pending} subtitle="Awaiting approval" icon={Clock}
              color={{ 
                bg: darkMode ? "bg-yellow-800" : "bg-yellow-100", 
                text: darkMode ? "text-yellow-300" : "text-yellow-500", 
                value: "text-yellow-500" 
              }} darkMode={darkMode}/>
            <StatCard title="Approved" value={stats.approved} subtitle="Leaves granted" icon={User}
              color={{ 
                bg: darkMode ? "bg-green-800" : "bg-green-100", 
                text: darkMode ? "text-green-300" : "text-green-500", 
                value: "text-green-500" 
              }} darkMode={darkMode}/>
            <StatCard title="Rejected" value={stats.rejected} subtitle="Leaves denied" icon={AlertCircle}
              color={{ 
                bg: darkMode ? "bg-red-800" : "bg-red-100", 
                text: darkMode ? "text-red-300" : "text-red-500", 
                value: "text-red-500" 
              }} darkMode={darkMode}/>
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className={`flex items-center px-3 py-2 rounded-md ${darkMode ? "bg-gray-700" : "bg-white shadow-sm border"}`}>
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  className="ml-2 bg-transparent outline-none text-sm w-full"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                />
              </div>
              <select className={`px-3 py-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} border`}
                      value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option>All Status</option><option>Pending</option><option>Approved</option><option>Rejected</option>
              </select>
              <select className={`px-3 py-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} border`}
                      value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option>All Types</option><option>Annual</option><option>Sick</option><option>Casual</option><option>Other</option>
              </select>
              <select className={`px-3 py-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} border`}
                      value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <select className={`px-3 py-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} border`}
                      value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                <option>2023</option><option>2024</option><option>2025</option>
              </select>
            </div>
            <button
              onClick={() => {
                setEditing(null);
                setForm({ empId:"", name:"", type:"Annual", from:"", to:"", days:"", reason:"", status:"Pending" });
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-md shadow hover:bg-orange-600 transition-colors"
            >
              <Plus size={18} /><span>New Request</span>
            </button>
          </div>

          {/* Table */}
          <div className={`rounded-lg overflow-hidden shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"} ${darkMode ? "border-gray-700" : "border-gray-100"} border mb-6`}>
            <div className={`flex justify-between items-center p-4 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <h3 className="font-medium">Leave Requests</h3>
              <span className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>{filteredLeaves.length} records found</span>
            </div>
            {loading ? (
              <div className="text-center py-8">Loading leave data...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      <th className="text-left p-3 text-xs uppercase font-semibold">No</th>
                      <th className="text-left p-3 text-xs uppercase font-semibold">Emp ID</th>
                      <th className="text-left p-3 text-xs uppercase font-semibold">Name</th>
                      <th className="text-left p-3 text-xs uppercase font-semibold">Type</th>
                      <th className="text-left p-3 text-xs uppercase font-semibold">From</th>
                      <th className="text-left p-3 text-xs uppercase font-semibold">To</th>
                      <th className="text-left p-3 text-xs uppercase font-semibold">Days</th>
                      <th className="text-left p-3 text-xs uppercase font-semibold">Reason</th>
                      <th className="text-left p-3 text-xs uppercase font-semibold">Status</th>
                      <th className="text-left p-3 text-xs uppercase font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.map((r, idx) => (
                      <tr key={r._id} className={`border-t ${darkMode ? "border-gray-700 hover:bg-gray-750" : "border-gray-200 hover:bg-gray-50"}`}>
                        <td className="p-3">{r.number ?? (idx + 1)}</td>
                        <td className="p-3 font-medium">{r.empId}</td>
                        <td className="p-3">{r.name}</td>
                        <td className="p-3">{r.type}</td>
                        <td className="p-3">{new Date(r.from).toLocaleDateString()}</td>
                        <td className="p-3">{new Date(r.to).toLocaleDateString()}</td>
                        <td className="p-3">{r.days}</td>
                        <td className="p-3 max-w-xs truncate">{r.reason}</td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            r.status === "Approved"
                              ? darkMode ? "bg-green-800 text-green-200" : "bg-green-100 text-green-700"
                              : r.status === "Pending"
                              ? darkMode ? "bg-yellow-800 text-yellow-200" : "bg-yellow-100 text-yellow-700"
                              : darkMode ? "bg-red-800 text-red-200" : "bg-red-100 text-red-700"
                          }`}>{r.status}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button onClick={() => onEdit(r)} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600" title="Edit"><Edit size={14} /></button>
                            <button onClick={() => onDelete(r)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600" title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && filteredLeaves.length === 0 && (
                      <tr>
                        <td className={`p-3 text-sm colSpan={10} ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>No leave records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Popup Form */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => { setShowForm(false); setEditing(null); }} />
              <div className={`relative p-6 rounded-lg shadow w-full max-w-3xl max-h-screen overflow-y-auto ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className={`absolute right-3 top-3 text-gray-500 ${
                  darkMode ? 'hover:text-gray-300' : 'hover:text-gray-700'
                }`}><X /></button>
                <h3 className="text-lg font-semibold mb-4">{editing ? "Update Leave Request" : "New Leave Request"}</h3>
                <form onSubmit={submitForm} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm">Employee *</label>
                    <select className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                            value={form.empId} onChange={(e) => {
                              const value = e.target.value;
                              setForm({ ...form, empId: value });
                              
                              // Auto-fetch employee name when employee ID changes
                              if (value.trim()) {
                                const employee = allEmployees.find(emp => emp.id === value.trim());
                                if (employee) {
                                  setForm(prev => ({ ...prev, name: employee.name }));
                                }
                              }
                            }} required>
                      <option value="">Select Employee</option>
                      {allEmployees.map((employee) => (
                        <option key={employee._id} value={employee.id}>
                          {employee.id} - {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Name *</label>
                    <input type="text" className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                           value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Leave Type *</label>
                    <select className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                            value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option>Annual</option><option>Sick</option><option>Casual</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">From Date *</label>
                    <input type="date" className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                           value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">To Date *</label>
                    <input type="date" className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                           value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Days</label>
                    <input type="number" className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                           value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} placeholder="Auto-calc if empty" min={1} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-sm">Reason</label>
                    <textarea rows={3} className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                              value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Status *</label>
                    <select className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                            value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option>Pending</option><option>Approved</option><option>Rejected</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 text-right mt-2 flex gap-2 justify-end">
                    <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                      className="bg-gray-400 text-white px-4 py-2 rounded shadow hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600">
                      {editing ? "Update" : "Submit Request"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Analytics & Reports Tab */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-lg font-semibold">Leave Analytics & Reports</h3>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <select className={`px-3 py-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} border`}
                      value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                <option>2023</option><option>2024</option><option>2025</option>
              </select>
              <button onClick={generatePDF} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-600">
                <Download size={18} /><span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Charts + Balance */}
          <div className="grid md:grid-cols-2 gap-6">
            <ChartContainer title="Leave Distribution by Type" darkMode={darkMode} ref={distRef}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leaveData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                       label={({ name, percent }) => `${name}: ${(percent * 100 || 0).toFixed(0)}%`}>
                    {leaveData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title="Leave Status Distribution" darkMode={darkMode} ref={statusRef}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                       label={({ name, percent }) => `${name}: ${(percent * 100 || 0).toFixed(0)}%`}>
                    {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* ✅ Monthly Leave Trend */}
            <ChartContainer title="Monthly Leave Trend" darkMode={darkMode} ref={trendRef}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorLeaves" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                  <XAxis dataKey="month" stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                  <YAxis allowDecimals={false} stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                  <Tooltip /><Legend />
                  <Area type="monotone" dataKey="leaves" name="Total Leaves" stroke="#3b82f6" fill="url(#colorLeaves)" />
                  <Area type="monotone" dataKey="approved" name="Approved" stroke="#10b981" fill="url(#colorApproved)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Leave Balance (search + table) */}
            <ChartContainer title="Leave Balance" darkMode={darkMode} ref={balanceRef}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    list="empIdList"
                    className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                    placeholder="Search Employee ID (e.g. EMPID001)"
                    value={balanceEmp}
                    onChange={(e) => setBalanceEmp(e.target.value)}
                  />
                  <datalist id="empIdList">
                    {empIdOptions.map(id => <option key={id} value={id} />)}
                  </datalist>
                </div>

                {!balance ? (
                  <p className={`text-sm ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>Enter/select an Employee ID to view leave balance.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                        <tr>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Total</th>
                          <th className="text-left p-2">Used</th>
                          <th className="text-left p-2">Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        {["Annual","Sick","Casual","Other"].map(k => (
                          <tr key={k} className={darkMode ? "border-t border-gray-700" : "border-t border-gray-200"}>
                            <td className="p-2">{k}</td>
                            <td className="p-2">{balance[k]?.total ?? 0}</td>
                            <td className="p-2">{balance[k]?.used ?? 0}</td>
                            <td className="p-2">{balance[k]?.remaining ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </ChartContainer>
          </div>

          {/* Upcoming Leaves */}
          <ChartContainer title="Upcoming Leaves" darkMode={darkMode}>
            <div className="mb-3">
              <input
                list="empIdList2"
                className={`w-full md:w-80 border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                placeholder="(Optional) Filter by Employee ID"
                value={upcomingEmp}
                onChange={(e) => setUpcomingEmp(e.target.value)}
              />
              <datalist id="empIdList2">
                {empIdOptions.map(id => <option key={id} value={id} />)}
              </datalist>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map((u) => (
                <div
                  key={u._id}
                  className={`p-4 rounded-lg border-l-4 ${
                    u.type === "Annual" ? "border-blue-500" :
                    u.type === "Sick"   ? "border-red-500" :
                    u.type === "Casual" ? "border-orange-500" : "border-purple-500"
                  } ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}
                >
                  <div className="flex justify-between mb-2">
                    <div>
                      <h5 className="font-semibold">{u.name}</h5>
                      <p className={`text-sm ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>{u.empId}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.status === "Approved" ? (darkMode ? "bg-green-800 text-green-200" : "bg-green-100 text-green-700") :
                      u.status === "Pending" ? (darkMode ? "bg-yellow-800 text-yellow-200" : "bg-yellow-100 text-yellow-700") :
                      (darkMode ? "bg-red-800 text-red-200" : "bg-red-100 text-red-700")
                    }`}>
                      {u.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{u.type} Leave</p>
                  <p className="text-sm">
                    {new Date(u.from).toLocaleDateString()} - {new Date(u.to).toLocaleDateString()}
                  </p>
                  <p className="text-sm">{u.days} days</p>
                </div>
              ))}
              {upcoming.length === 0 && (
                <p className={`text-sm col-span-3 text-center py-8 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No upcoming leaves{upcomingEmp ? ` for ${upcomingEmp}` : ""}.
                </p>
              )}
            </div>
          </ChartContainer>
        </div>
      )}
    </div>
  );
};