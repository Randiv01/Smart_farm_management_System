// src/pages/E-LeavePlanner.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { 
  Calendar, Plus, FileDown, Edit, Trash2, X, Search, Filter, 
  BarChart3, PieChart as PieChartIcon, Download, User, Clock, AlertCircle 
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API = "http://localhost:5000/api/leaves";

// Custom components for better organization
const StatCard = ({ title, value, subtitle, icon: Icon, color, darkMode }) => (
  <div className={`p-4 rounded-lg shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"} border border-gray-100 flex flex-col`}>
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-medium text-sm">{title}</h4>
      <div className={`p-2 rounded-full ${color.bg} ${color.text}`}>
        <Icon size={16} />
      </div>
    </div>
    <div className="mt-2">
      <p className={`text-2xl font-bold ${color.value}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
    </div>
  </div>
);

const ChartContainer = ({ title, children, darkMode, className = "" }) => (
  <div className={`p-4 rounded-lg shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"} border border-gray-100 ${className}`}>
    <h4 className="font-medium mb-4">{title}</h4>
    <div className="h-64">
      {children}
    </div>
  </div>
);

export const ELeavePlanner = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState("requests");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [empSearch, setEmpSearch] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  // Form popup
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    empId: "",
    name: "",
    type: "Annual",
    from: "",
    to: "",
    days: "",
    reason: "",
    status: "Pending",
  });

  // Chart/Balance refs (for PDF)
  const distRef = useRef(null);
  const balanceRef = useRef(null);
  const trendRef = useRef(null);

  // Fetch leaves
  const loadLeaves = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (statusFilter !== "All Status") p.append("status", statusFilter);
      if (typeFilter !== "All Types") p.append("type", typeFilter);
      if (yearFilter) p.append("year", yearFilter);
      
      const res = await fetch(`${API}?${p.toString()}`);
      const data = await res.json();
      setLeaves(data);
      
      // Calculate stats
      const pending = data.filter(l => l.status === "Pending").length;
      const approved = data.filter(l => l.status === "Approved").length;
      const rejected = data.filter(l => l.status === "Rejected").length;
      
      setStats({
        pending,
        approved,
        rejected,
        total: data.length
      });
    } catch (error) {
      console.error("Error loading leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch upcoming leaves
  const loadUpcoming = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(`${API}/upcoming?from=${today}`);
      const data = await res.json();
      setUpcoming(data.slice(0, 9));
    } catch (error) {
      console.error("Error loading upcoming leaves:", error);
    }
  };

  // SSE real-time stream
  useEffect(() => {
    loadLeaves();
    loadUpcoming();
    
    const es = new EventSource(`${API}/stream`);
    es.addEventListener("change", (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        loadLeaves();
        loadUpcoming();
      } catch (_) {}
    });
    es.onerror = () => {
      // silently ignore; EventSource will retry
    };
    return () => es.close();
  }, [statusFilter, typeFilter, yearFilter]);

  // Submit create/update
  const submitForm = async (e) => {
    e.preventDefault();
    try {
      const body = {
        ...form,
        days: form.days ? Number(form.days) : undefined,
      };

      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API}/${editing._id}` : API;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Failed: ${err.error || res.statusText}`);
        return;
      }

      setShowForm(false);
      setEditing(null);
      setForm({
        empId: "",
        name: "",
        type: "Annual",
        from: "",
        to: "",
        days: "",
        reason: "",
        status: "Pending",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
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
    try {
      await fetch(`${API}/${row._id}`, { method: "DELETE" });
    } catch (error) {
      console.error("Error deleting leave:", error);
      alert("Error deleting leave request. Please try again.");
    }
  };

  // Derived chart data from current leaves list
  const leaveData = useMemo(() => {
    const sums = { Annual: 0, Sick: 0, Casual: 0, Other: 0 };
    leaves.forEach((l) => {
      sums[l.type] = (sums[l.type] || 0) + (l.days || 0);
    });
    return [
      { name: "Annual Leave", raw: sums.Annual, key: "Annual", color: "#3b82f6" },
      { name: "Sick Leave", raw: sums.Sick, key: "Sick", color: "#ef4444" },
      { name: "Casual Leave", raw: sums.Casual, key: "Casual", color: "#f59e0b" },
      { name: "Other", raw: sums.Other, key: "Other", color: "#8b5cf6" },
    ].map((x) => ({ name: x.name, value: x.raw, color: x.color }));
  }, [leaves]);

  // Status distribution data
  const statusData = useMemo(() => [
    { name: "Pending", value: stats.pending, color: "#f59e0b" },
    { name: "Approved", value: stats.approved, color: "#10b981" },
    { name: "Rejected", value: stats.rejected, color: "#ef4444" },
  ], [stats]);

  // Monthly trend data (mock data for demonstration)
  const monthlyTrendData = useMemo(() => {
    return [
      { month: "Jan", leaves: 12, approved: 10 },
      { month: "Feb", leaves: 18, approved: 15 },
      { month: "Mar", leaves: 15, approved: 12 },
      { month: "Apr", leaves: 22, approved: 18 },
      { month: "May", leaves: 17, approved: 14 },
      { month: "Jun", leaves: 20, approved: 16 },
      { month: "Jul", leaves: 25, approved: 20 },
      { month: "Aug", leaves: 19, approved: 16 },
      { month: "Sep", leaves: 23, approved: 19 },
      { month: "Oct", leaves: 16, approved: 14 },
      { month: "Nov", leaves: 21, approved: 18 },
      { month: "Dec", leaves: 24, approved: 20 },
    ];
  }, []);

  // Balance data
  const [balance, setBalance] = useState(null);
  const fetchBalance = async () => {
    if (!empSearch) {
      setBalance(null);
      return;
    }
    try {
      const res = await fetch(`${API}/balance?empId=${empSearch}&year=${yearFilter}`);
      const data = await res.json();
      if (data && data.balance) setBalance(data.balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [empSearch, yearFilter, leaves.length]);

  // PDF generation
  const generatePDF = async () => {
    if (!empSearch) {
      alert("Please enter an Employee ID to generate the report.");
      return;
    }
    
    try {
      const pdf = new jsPDF("p", "pt", "a4");
      pdf.setFontSize(16);
      pdf.text(`Leave Report - ${empSearch} (${yearFilter})`, 40, 40);

      // Capture Distribution
      if (distRef.current) {
        const canvas1 = await html2canvas(distRef.current);
        const img1 = canvas1.toDataURL("image/png");
        pdf.addImage(img1, "PNG", 40, 60, 520, 280, undefined, "FAST");
      }

      // Capture Balance
      if (balanceRef.current) {
        const canvas2 = await html2canvas(balanceRef.current);
        const img2 = canvas2.toDataURL("image/png");
        pdf.addPage();
        pdf.text(`Leave Balance - ${empSearch}`, 40, 40);
        pdf.addImage(img2, "PNG", 40, 60, 520, 280, undefined, "FAST");
      }

      // Capture Trend
      if (trendRef.current) {
        const canvas3 = await html2canvas(trendRef.current);
        const img3 = canvas3.toDataURL("image/png");
        pdf.addPage();
        pdf.text(`Monthly Leave Trend - ${yearFilter}`, 40, 40);
        pdf.addImage(img3, "PNG", 40, 60, 520, 280, undefined, "FAST");
      }

      // Upcoming
      pdf.addPage();
      pdf.text(`Upcoming Leaves`, 40, 40);
      pdf.setFontSize(11);
      let y = 70;
      upcoming.slice(0, 20).forEach((u) => {
        const line = `${u.name} (${u.empId}) - ${u.type} | ${new Date(
          u.from
        ).toLocaleDateString()} - ${new Date(u.to).toLocaleDateString()} | ${u.days} days | ${u.status}`;
        pdf.text(line, 40, y);
        y += 18;
      });

      pdf.save(`leave-report-${empSearch}-${yearFilter}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label, darkMode }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-md shadow-md ${darkMode ? 'bg-gray-700' : 'bg-white'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-6 font-sans min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Leave Management System</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {activeTab === "requests" 
            ? "Manage and track employee leave requests" 
            : "View leave analytics and summary reports"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex mb-6 border-b dark:border-gray-700">
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            activeTab === "requests"
              ? "border-b-2 border-orange-500 text-orange-500 dark:text-orange-400"
              : "text-inherit hover:text-orange-500 dark:hover:text-orange-400"
          }`}
        >
          <Calendar size={18} />
          <span>Leave Requests</span>
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            activeTab === "summary"
              ? "border-b-2 border-orange-500 text-orange-500 dark:text-orange-400"
              : "text-inherit hover:text-orange-500 dark:hover:text-orange-400"
          }`}
        >
          <BarChart3 size={18} />
          <span>Analytics & Reports</span>
        </button>
      </div>

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Leaves"
              value={stats.total}
              subtitle="All time"
              icon={Calendar}
              color={{
                bg: "bg-blue-100 dark:bg-blue-800",
                text: "text-blue-500 dark:text-blue-300",
                value: "text-blue-500"
              }}
              darkMode={darkMode}
            />
            <StatCard
              title="Pending"
              value={stats.pending}
              subtitle="Awaiting approval"
              icon={Clock}
              color={{
                bg: "bg-yellow-100 dark:bg-yellow-800",
                text: "text-yellow-500 dark:text-yellow-300",
                value: "text-yellow-500"
              }}
              darkMode={darkMode}
            />
            <StatCard
              title="Approved"
              value={stats.approved}
              subtitle="Leaves granted"
              icon={User}
              color={{
                bg: "bg-green-100 dark:bg-green-800",
                text: "text-green-500 dark:text-green-300",
                value: "text-green-500"
              }}
              darkMode={darkMode}
            />
            <StatCard
              title="Rejected"
              value={stats.rejected}
              subtitle="Leaves denied"
              icon={AlertCircle}
              color={{
                bg: "bg-red-100 dark:bg-red-800",
                text: "text-red-500 dark:text-red-300",
                value: "text-red-500"
              }}
              darkMode={darkMode}
            />
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
                  onChange={(e) => {
                    // Implement search functionality
                    const searchTerm = e.target.value.toLowerCase();
                    const filtered = leaves.filter(l => 
                      l.name.toLowerCase().includes(searchTerm) || 
                      l.empId.toLowerCase().includes(searchTerm)
                    );
                    setLeaves(filtered);
                  }}
                />
              </div>
              <select
                className={`px-3 py-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} border`}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
              <select
                className={`px-3 py-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} border`}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option>All Types</option>
                <option>Annual</option>
                <option>Sick</option>
                <option>Casual</option>
                <option>Other</option>
              </select>
              <select
                className={`px-3 py-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} border`}
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option>2023</option>
                <option>2024</option>
                <option>2025</option>
              </select>
            </div>
            <button
              onClick={() => {
                setEditing(null);
                setForm({
                  empId: "",
                  name: "",
                  type: "Annual",
                  from: "",
                  to: "",
                  days: "",
                  reason: "",
                  status: "Pending",
                });
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-md shadow hover:bg-orange-600 transition-colors"
            >
              <Plus size={18} />
              <span>New Request</span>
            </button>
          </div>

          {/* Table */}
          <div className={`rounded-lg overflow-hidden shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"} border border-gray-100 mb-6`}>
            <div className={`flex justify-between items-center p-4 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <h3 className="font-medium">Leave Requests</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {leaves.length} records found
              </span>
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
                    {leaves.map((r) => (
                      <tr key={r._id} className={`border-t ${darkMode ? "border-gray-700 hover:bg-gray-750" : "border-gray-200 hover:bg-gray-50"}`}>
                        <td className="p-3">{r.number}</td>
                        <td className="p-3 font-medium">{r.empId}</td>
                        <td className="p-3">{r.name}</td>
                        <td className="p-3">{r.type}</td>
                        <td className="p-3">{new Date(r.from).toLocaleDateString()}</td>
                        <td className="p-3">{new Date(r.to).toLocaleDateString()}</td>
                        <td className="p-3">{r.days}</td>
                        <td className="p-3 max-w-xs truncate">{r.reason}</td>
                        <td className="p-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              r.status === "Approved"
                                ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
                                : r.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200"
                                : "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => onEdit(r)}
                              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => onDelete(r)}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && leaves.length === 0 && (
                      <tr>
                        <td className="p-3 text-sm text-gray-500 dark:text-gray-400" colSpan={10}>
                          No leave records found.
                        </td>
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
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              />
              <div className={`relative p-6 rounded-lg shadow w-full max-w-3xl max-h-screen overflow-y-auto ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X />
                </button>
                <h3 className="text-lg font-semibold mb-4">
                  {editing ? "Update Leave Request" : "New Leave Request"}
                </h3>

                <form onSubmit={submitForm} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm">Employee ID *</label>
                    <input
                      type="text"
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                      value={form.empId}
                      onChange={(e) => setForm({ ...form, empId: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Name *</label>
                    <input
                      type="text"
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Leave Type *</label>
                    <select
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option>Annual</option>
                      <option>Sick</option>
                      <option>Casual</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">From Date *</label>
                    <input
                      type="date"
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                      value={form.from}
                      onChange={(e) => setForm({ ...form, from: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">To Date *</label>
                    <input
                      type="date"
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                      value={form.to}
                      onChange={(e) => setForm({ ...form, to: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Days</label>
                    <input
                      type="number"
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                      value={form.days}
                      onChange={(e) => setForm({ ...form, days: e.target.value })}
                      placeholder="Auto-calculate if empty"
                      min={1}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-sm">Reason</label>
                    <textarea
                      rows={3}
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Status *</label>
                    <select
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option>Pending</option>
                      <option>Approved</option>
                      <option>Rejected</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 text-right mt-2 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditing(null);
                      }}
                      className="bg-gray-400 text-white px-4 py-2 rounded shadow hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600 transition-colors"
                    >
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
              <div className={`flex items-center px-3 py-2 rounded-md ${darkMode ? "bg-gray-700" : "bg-white shadow-sm border"}`}>
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Emp ID"
                  className="ml-2 bg-transparent outline-none text-sm w-full"
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                />
              </div>
              <select
                className={`px-3 py-2 rounded-md ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} border`}
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option>2023</option>
                <option>2024</option>
                <option>2025</option>
              </select>
              <button
                onClick={generatePDF}
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-600 transition-colors"
              >
                <Download size={18} />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Charts + Balance */}
          <div className="grid md:grid-cols-2 gap-6">
            <ChartContainer title="Leave Distribution by Type" darkMode={darkMode} ref={distRef}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100 || 0).toFixed(0)}%`
                    }
                  >
                    {leaveData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title="Leave Status Distribution" darkMode={darkMode}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100 || 0).toFixed(0)}%`
                    }
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Additional Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <ChartContainer title="Monthly Leave Trend" darkMode={darkMode} ref={trendRef}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                  <XAxis dataKey="month" stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                  <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                  <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                  <Legend />
                  <Bar dataKey="leaves" name="Total Leaves" fill="#3b82f6" />
                  <Line type="monotone" dataKey="approved" name="Approved" stroke="#10b981" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title="Leave Balance" darkMode={darkMode} ref={balanceRef}>
              {!balance ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Enter an Employee ID to view leave balance
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    ["Annual", "bg-blue-500"],
                    ["Sick", "bg-red-500"],
                    ["Casual", "bg-orange-500"],
                  ].map(([key, bar]) => {
                    const total = balance[key].total;
                    const used = balance[key].used;
                    const pct = total ? Math.min((used / total) * 100, 100) : 0;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{key} Leave</span>
                          <span>
                            {used}/{total} days
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded h-2">
                          <div className={`${bar} h-2 rounded`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ChartContainer>
          </div>

          {/* Upcoming Leaves */}
          <ChartContainer title="Upcoming Leaves" darkMode={darkMode}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map((u) => (
                <div
                  key={u._id}
                  className={`p-4 rounded-lg border-l-4 ${
                    u.type === "Annual" ? "border-blue-500" :
                    u.type === "Sick" ? "border-red-500" :
                    u.type === "Casual" ? "border-orange-500" :
                    "border-purple-500"
                  } ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}
                >
                  <div className="flex justify-between mb-2">
                    <div>
                      <h5 className="font-semibold">{u.name}</h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{u.empId}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.status === "Approved" ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200" :
                      u.status === "Pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200" :
                      "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200"
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
                <p className="text-sm text-gray-500 dark:text-gray-400 col-span-3 text-center py-8">
                  No upcoming leaves.
                </p>
              )}
            </div>
          </ChartContainer>
        </div>
      )}
    </div>
  );
};