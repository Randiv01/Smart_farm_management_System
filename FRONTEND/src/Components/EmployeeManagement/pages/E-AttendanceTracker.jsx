import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  Clock,
  UserCheck,
  UserX,
  Calendar,
  X,
  Download,
  BarChart3
} from "lucide-react";
import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Loader from "../Loader/Loader.js";// Import the Loader component


// Base URL for API calls
const API_BASE_URL = "http://localhost:5000";

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg text-white ${bgColor} flex items-center justify-between min-w-80`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4">
        <X size={16} />
      </button>
    </div>
  );
};

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
    <div className="h-64">{children}</div>
  </div>
);

export const AttendanceTracker = ({ darkMode }) => {
  const getLocalDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const todayStr = getLocalDateString(today);

  const [activeTab, setActiveTab] = useState("daily");
  const [showForm, setShowForm] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [summaryData, setSummaryData] = useState({ present: 0, absent: 0, onLeave: 0, late: 0, total: 0 });
  const [chartData, setChartData] = useState([]);
  const [reportStats, setReportStats] = useState({ attendanceRate: 0, lateArrivals: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [reportPeriod, setReportPeriod] = useState("thisweek");
  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    date: todayStr,
    checkIn: "",
    checkOut: "",
    status: "Present",
  });
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [employeeStats, setEmployeeStats] = useState([]);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [showLoader, setShowLoader] = useState(false); // New state for loader

  // keep the original record (for date-change detection)
  const originalRecordRef = useRef(null);

  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL;
    // attach interceptors only once
    const reqI = axios.interceptors.request.use((request) => request);
    const resI = axios.interceptors.response.use((response) => response, (error) => Promise.reject(error));
    return () => {
      axios.interceptors.request.eject(reqI);
      axios.interceptors.response.eject(resI);
    };
  }, []);

  const showNotification = (message, type = "success") => setNotification({ show: true, message, type });
  const closeNotification = () => setNotification({ show: false, message: "", type: "" });

  const fetchAttendanceData = async () => {
    setLoading(true);
    setShowLoader(true); // Show loader when fetching data
    try {
      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (searchTerm) params.search = searchTerm;
      const { data } = await axios.get("/api/attendance", { params });
      setAttendanceData(data);
    } catch (error) {
      showNotification("Error fetching attendance data. Make sure the server is running on port 5000.", "error");
    } finally { 
      setLoading(false);
      setShowLoader(false); // Hide loader when done
    }
  };

  const fetchSummaryData = async (dateStr = selectedDate) => {
    setShowLoader(true); // Show loader for summary data
    try {
      const { data } = await axios.get(`/api/attendance/summary/${dateStr}`);
      setSummaryData(data);
    } catch (error) {
      showNotification("Error fetching summary data", "error");
    } finally {
      setShowLoader(false); // Hide loader when done
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setShowLoader(true); // Show loader for report data
    try {
      const { data } = await axios.get("/api/attendance/reports", { params: { period: reportPeriod } });
      setChartData(data.chartData || []);
      setReportStats({ attendanceRate: data.attendanceRate || 0, lateArrivals: data.lateArrivals || 0 });
      setEmployeeStats(data.employeeStats || []);
      setAttendanceTrend((data.chartData || []).map((item) => ({
        day: new Date(item.period).toLocaleDateString("en-US", { weekday: "short" }),
        present: item.present,
        absent: item.absent,
      })));
      await fetchSummaryData(todayStr);
    } catch (error) {
      showNotification("Error fetching report data. Make sure the server is running on port 5000.", "error");
    } finally { 
      setLoading(false);
      setShowLoader(false); // Hide loader when done
    }
  };

  useEffect(() => {
    if (activeTab === "daily") {
      fetchAttendanceData();
      fetchSummaryData();
    } else {
      fetchReportData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedDate, searchTerm, reportPeriod]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.employeeId.trim()) errors.employeeId = "Employee ID is required";
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.date) errors.date = "Date is required";
    if (!formData.status) errors.status = "Status is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const convertToDisplayTime = (timeStr) => {
    if (timeStr === "-" || !timeStr) return "-";
    if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr; // already display format
    let [hours, minutes] = timeStr.split(":").map(Number);
    const modifier = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, "0")} ${modifier}`;
  };

  const convertToTimeInput = (timeStr) => {
    if (timeStr === "-" || !timeStr) return "";
    try {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    originalRecordRef.current = null;
    setFormData({
      employeeId: "",
      name: "",
      date: todayStr,
      checkIn: "",
      checkOut: "",
      status: "Present",
    });
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      setShowLoader(true); // Show loader when submitting form
      const submitData = {
        employeeId: formData.employeeId.trim(),
        name: formData.name.trim(),
        date: formData.date, // local yyyy-mm-dd string
        checkIn: formData.checkIn ? convertToDisplayTime(formData.checkIn) : "-",
        checkOut: formData.checkOut ? convertToDisplayTime(formData.checkOut) : "-",
        status: formData.status,
      };

      if (editingId) {
        await axios.patch(`/api/attendance/${editingId}`, submitData);
        showNotification("Attendance record updated successfully!");
        // ✅ Keep the updated row visible even if its date changed
        const oldISO = originalRecordRef.current?.dateISO;
        if (oldISO && oldISO !== formData.date) {
          setSelectedDate(formData.date);
        }
      } else {
        await axios.post("/api/attendance", submitData);
        showNotification("Attendance record added successfully!");
      }

      closeForm();
      await fetchAttendanceData();
      await fetchSummaryData();
      if (activeTab === "reports") await fetchReportData();
    } catch (error) {
      const errorMsg = error?.response?.data?.message || "Error saving attendance record. Make sure the server is running.";
      showNotification(errorMsg, "error");
    } finally { 
      setLoading(false);
      setShowLoader(false); // Hide loader when done
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this attendance record?")) return;
    try {
      setShowLoader(true); // Show loader when deleting
      await axios.delete(`/api/attendance/${id}`);
      showNotification("Attendance record deleted successfully!");
      await fetchAttendanceData();
      await fetchSummaryData();
      if (activeTab === "reports") await fetchReportData();
    } catch {
      showNotification("Error deleting attendance record", "error");
    } finally {
      setShowLoader(false); // Hide loader when done
    }
  };

  const handleEdit = (record) => {
    // keep a copy for date-change detection (ISO day string)
    const localDate = new Date(record.date);
    const dateStr = getLocalDateString(localDate);
    originalRecordRef.current = { id: record._id, dateISO: dateStr };
    setFormData({
      employeeId: record.employeeId,
      name: record.name,
      date: dateStr,
      checkIn: record.checkIn !== "-" ? convertToTimeInput(record.checkIn) : "",
      checkOut: record.checkOut !== "-" ? convertToTimeInput(record.checkOut) : "",
      status: record.status,
    });
    setEditingId(record._id);
    setShowForm(true);
    setFormErrors({});
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Present": return "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200";
      case "Absent": return "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200";
      case "On Leave": return "bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200";
      case "Late": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Present": return <UserCheck size={16} className="text-green-500" />;
      case "Absent": return <UserX size={16} className="text-red-500" />;
      case "On Leave": return <Calendar size={16} className="text-orange-500" />;
      case "Late": return <Clock size={16} className="text-yellow-500" />;
      default: return null;
    }
  };

  const pieData = [
    { name: 'Present', value: summaryData.present, color: '#22c55e' },
    { name: 'Absent', value: summaryData.absent, color: '#ef4444' },
    { name: 'On Leave', value: summaryData.onLeave, color: '#f59e0b' },
    { name: 'Late', value: summaryData.late, color: '#eab308' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-md shadow-md ${darkMode ? 'bg-gray-700 border border-gray-600 text-gray-100' : 'bg-white border border-gray-200'}`}>
          <p className="font-medium">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} style={{ color: entry.color }}>{entry.name}: {entry.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`font-sans min-h-screen ${darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-800"}`}>
      {/* Loader Component */}
      {showLoader && <Loader darkMode={darkMode} />}
      
      {notification.show && (
        <Notification message={notification.message} type={notification.type} onClose={closeNotification} />
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Attendance Management System</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {activeTab === "daily" ? "Track and manage daily attendance records" : "View detailed reports and analytics"}
        </p>
      </div>

      <div className="flex mb-6 border-b dark:border-gray-700">
        <button
          onClick={() => setActiveTab("daily")}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === "daily" ? "border-b-2 border-green-600 text-green-600 dark:text-green-400" : "text-inherit hover:text-green-600 dark:hover:text-green-400"}`}
        >
          <Calendar size={18} />
          <span>Daily Attendance</span>
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === "reports" ? "border-b-2 border-green-600 text-green-600 dark:text-green-400" : "text-inherit hover:text-green-600 dark:hover:text-green-400"}`}
        >
          <BarChart3 size={18} />
          <span>Reports & Analytics</span>
        </button>
      </div>

      {activeTab === "daily" && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className={`flex items-center px-3 py-2 rounded-md ${darkMode ? "bg-gray-700" : "bg-white shadow-sm border"}`}>
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Employee ID or Name..."
                  className="ml-2 bg-transparent outline-none text-sm w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={() => setSearchTerm("")}
              >
                <Filter size={18} />
                <span>Clear Filter</span>
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center w-full md:w-auto">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`px-3 py-2 border rounded-md text-sm ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}`}
              />
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors shadow-md"
              >
                <Plus size={18} />
                <span>Add Record</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
              title="Present"
              value={summaryData.present}
              subtitle={`out of ${summaryData.total}`}
              icon={UserCheck}
              color={{ bg: "bg-green-100 dark:bg-green-800", text: "text-green-500 dark:text-green-300", value: "text-green-500" }}
              darkMode={darkMode}
            />
            <StatCard
              title="Absent"
              value={summaryData.absent}
              subtitle={`out of ${summaryData.total}`}
              icon={UserX}
              color={{ bg: "bg-red-100 dark:bg-red-800", text: "text-red-500 dark:text-red-300", value: "text-red-500" }}
              darkMode={darkMode}
            />
            <StatCard
              title="On Leave"
              value={summaryData.onLeave}
              subtitle={`out of ${summaryData.total}`}
              icon={Calendar}
              color={{ bg: "bg-orange-100 dark:bg-orange-800", text: "text-orange-500 dark:text-orange-300", value: "text-orange-500" }}
              darkMode={darkMode}
            />
            <StatCard
              title="Late"
              value={summaryData.late}
              subtitle={`out of ${summaryData.total}`}
              icon={Clock}
              color={{ bg: "bg-yellow-100 dark:bg-yellow-800", text: "text-yellow-500 dark:text-yellow-300", value: "text-yellow-500" }}
              darkMode={darkMode}
            />
          </div>

          <div className="mb-6">
            <ChartContainer title="Today's Attendance Overview" darkMode={darkMode}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={darkMode ? { backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' } : {}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className={`rounded-lg overflow-hidden shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"} border border-gray-100`}>
            <div className={`flex justify-between items-center p-4 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <h3 className="font-medium">Attendance Records</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {attendanceData.length} records found
              </span>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading attendance data...</div>
            ) : (
              <table className="w-full border-collapse">
                <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    <th className="text-left px-4 py-3 text-xs uppercase font-semibold">No</th>
                    <th className="text-left px-4 py-3 text-xs uppercase font-semibold">EmpId</th>
                    <th className="text-left px-4 py-3 text-xs uppercase font-semibold">Name</th>
                    <th className="text-left px-4 py-3 text-xs uppercase font-semibold">Date</th>
                    <th className="text-left px-4 py-3 text-xs uppercase font-semibold">Check In</th>
                    <th className="text-left px-4 py-3 text-xs uppercase font-semibold">Check Out</th>
                    <th className="text-left px-4 py-3 text-xs uppercase font-semibold">Status</th>
                    <th className="text-left px-4 py-3 text-xs uppercase font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.length > 0 ? (
                    attendanceData.map((record, index) => (
                      <tr
                        key={record._id}
                        className={`border-t ${darkMode ? "border-gray-700 hover:bg-gray-750" : "border-gray-200 hover:bg-gray-50"}`}
                      >
                        <td className="px-4 py-3">{record.number || index + 1}</td>
                        <td className="px-4 py-3 font-medium">{record.employeeId}</td>
                        <td className="px-4 py-3">{record.name}</td>
                        <td className="px-4 py-3">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{record.checkIn}</td>
                        <td className="px-4 py-3">{record.checkOut}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(record._id)}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                        No attendance records found for the selected date
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`p-6 rounded-lg w-full max-w-md max-h-screen overflow-y-auto ${darkMode ? "bg-gray-800" : "bg-white"} shadow-xl`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {editingId ? <Edit size={20} /> : <Plus size={20} />}
                    {editingId ? "Edit Attendance" : "Add Attendance"}
                  </h3>
                  <button onClick={closeForm} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <X size={20} />
                  </button>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee ID *</label>
                    <input
                      type="text"
                      name="employeeId"
                      placeholder="Enter Employee ID"
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} ${formErrors.employeeId ? "border-red-500" : ""}`}
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    {formErrors.employeeId && <p className="text-red-500 text-xs mt-1">{formErrors.employeeId}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter Name"
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} ${formErrors.name ? "border-red-500" : ""}`}
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Date *</label>
                    <input
                      type="date"
                      name="date"
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} ${formErrors.date ? "border-red-500" : ""}`}
                      value={formData.date}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    {formErrors.date && <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status *</label>
                    <select
                      name="status"
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} ${formErrors.status ? "border-red-500" : ""}`}
                      value={formData.status}
                      onChange={handleInputChange}
                      disabled={loading}
                    >
                      <option value="">Select Status</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                    {formErrors.status && <p className="text-red-500 text-xs mt-1">{formErrors.status}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Check In</label>
                      <input
                        type="time"
                        name="checkIn"
                        className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} ${formErrors.checkIn ? "border-red-500" : ""}`}
                        value={formData.checkIn}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                      {formErrors.checkIn && <p className="text-red-500 text-xs mt-1">{formErrors.checkIn}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Check Out</label>
                      <input
                        type="time"
                        name="checkOut"
                        className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} ${formErrors.checkOut ? "border-red-500" : ""}`}
                        value={formData.checkOut}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                      {formErrors.checkOut && <p className="text-red-500 text-xs mt-1">{formErrors.checkOut}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : (editingId ? "Update" : "Save")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "reports" && (
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 size={20} />
              Attendance Analytics
            </h3>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
              <select
                className={`px-3 py-2 border rounded-md text-sm ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
              >
                <option value="thisweek">This Week</option>
                <option value="lastweek">Last Week</option>
                <option value="thismonth">This Month</option>
                <option value="lastmonth">Last Month</option>
              </select>
              <button
                onClick={() => {
                  const doc = new jsPDF('p', 'mm', 'a4');
                  
                  // Company information
                  const companyName = "Mount Olive Farm House";
                  const companyAddress = "No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka";
                  const companyContact = "Phone: +94 81 249 2134 | Email: info@mountolivefarm.com";
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
                      doc.addImage(logoImg, 'PNG', 20, 15, 25, 25);
                      generatePDFContent();
                    };
                    logoImg.onerror = () => {
                      // Fallback to placeholder if logo fails to load
                      doc.setFillColor(...primaryColor);
                      doc.rect(20, 15, 25, 25, 'F');
                      doc.setTextColor(255, 255, 255);
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'bold');
                      doc.text('MOF', 30, 30, { align: 'center' });
                      generatePDFContent();
                    };
                    logoImg.src = '/logo512.png';
                  } catch (error) {
                    console.error('Error loading logo:', error);
                    // Fallback to placeholder
                    doc.setFillColor(...primaryColor);
                    doc.rect(20, 15, 25, 25, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text('MOF', 30, 30, { align: 'center' });
                    generatePDFContent();
                  }

                  const generatePDFContent = () => {

                  // Company header
                  doc.setTextColor(...textColor);
                  doc.setFontSize(18);
                  doc.setFont('helvetica', 'bold');
                  doc.text(companyName, 50, 20);
                  
                  doc.setFontSize(9);
                  doc.setFont('helvetica', 'normal');
                  doc.text(companyAddress, 50, 27);
                  doc.text(companyContact, 50, 32);

                  // Report title with professional styling
                  doc.setFillColor(...lightGray);
                  doc.rect(20, 40, 170, 12, 'F');
                  doc.setTextColor(...primaryColor);
                  doc.setFontSize(16);
                  doc.setFont('helvetica', 'bold');
                  doc.text("ATTENDANCE REPORT", 105, 49, { align: 'center' });

                  // Report metadata
                  doc.setTextColor(...textColor);
                  doc.setFontSize(10);
                  doc.setFont('helvetica', 'normal');
                  doc.text(`Report Generated: ${reportDate} at ${reportTime}`, 20, 60);
                  doc.text(`Period: ${reportPeriod}`, 20, 65);
                  doc.text(`Report ID: MOF-AR-${Date.now().toString().slice(-6)}`, 20, 70);

                  // Summary section
                  doc.setFillColor(...secondaryColor);
                  doc.rect(20, 80, 170, 8, 'F');
                  doc.setTextColor(255, 255, 255);
                  doc.setFontSize(12);
                  doc.setFont('helvetica', 'bold');
                  doc.text("ATTENDANCE SUMMARY", 25, 86);

                  const summaryData = [
                    ['Metric', 'Value', 'Status'],
                    ['Attendance Rate', `${reportStats.attendanceRate}%`, 'Active'],
                    ['Late Arrivals', reportStats.lateArrivals.toString(), 'Active'],
                    ['Total Present', reportStats.totalPresent?.toString() || '0', 'Active'],
                    ['Total Absent', reportStats.totalAbsent?.toString() || '0', 'Active']
                  ];

                  // Create professional table for summary
                  doc.autoTable({
                    head: [summaryData[0]],
                    body: summaryData.slice(1),
                    startY: 95,
                    theme: 'grid',
                    headStyles: {
                      fillColor: primaryColor,
                      textColor: [255, 255, 255],
                      fontStyle: 'bold',
                      fontSize: 10
                    },
                    bodyStyles: {
                      fontSize: 9,
                      textColor: textColor,
                      cellPadding: 3
                    },
                    alternateRowStyles: {
                      fillColor: [249, 250, 251]
                    },
                    margin: { left: 20, right: 20 }
                  });

                  // Detailed attendance data
                  const finalY = doc.lastAutoTable.finalY + 15;
                  doc.setFillColor(...accentColor);
                  doc.rect(20, finalY, 170, 8, 'F');
                  doc.setTextColor(255, 255, 255);
                  doc.setFontSize(12);
                  doc.setFont('helvetica', 'bold');
                  doc.text("DETAILED ATTENDANCE DATA", 25, finalY + 6);

                  const tableData = chartData.map((i) => [i.period, i.present, i.absent, i.leave, i.late]);
                  
                  doc.autoTable({
                    head: [['Date', 'Present', 'Absent', 'Leave', 'Late']],
                    body: tableData,
                    startY: finalY + 15,
                    theme: 'grid',
                    headStyles: {
                      fillColor: primaryColor,
                      textColor: [255, 255, 255],
                      fontStyle: 'bold',
                      fontSize: 10
                    },
                    bodyStyles: {
                      fontSize: 9,
                      textColor: textColor,
                      cellPadding: 3
                    },
                    alternateRowStyles: {
                      fillColor: [249, 250, 251]
                    },
                    margin: { left: 20, right: 20 }
                  });

                  // Professional footer
                  const pageCount = doc.internal.getNumberOfPages();
                  for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    
                    // Footer background
                    doc.setFillColor(...lightGray);
                    doc.rect(0, 280, 210, 20, 'F');
                    
                    // Footer content
                    doc.setTextColor(...textColor);
                    doc.setFontSize(8);
                    doc.text(`Page ${i} of ${pageCount}`, 20, 288);
                    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 288, { align: 'center' });
                    doc.text(companyName, 190, 288, { align: 'right' });
                    
                    // Footer line
                    doc.setDrawColor(...primaryColor);
                    doc.setLineWidth(0.5);
                    doc.line(20, 290, 190, 290);
                    
                    // Disclaimer
                    doc.setTextColor(100, 100, 100);
                    doc.setFontSize(7);
                    doc.text("This report is generated by Mount Olive Farm House Management System", 105, 295, { align: 'center' });
                  }

                    // Save PDF with professional naming
                    const fileName = `MOF_Attendance_Report_${reportPeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
                    doc.save(fileName);
                  };
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Download size={16} />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading report data...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Attendance Rate"
                  value={`${reportStats.attendanceRate}%`}
                  subtitle="Selected period"
                  icon={UserCheck}
                  color={{ bg: "bg-green-100 dark:bg-green-800", text: "text-green-500 dark:text-green-300", value: "text-green-500" }}
                  darkMode={darkMode}
                />
                <StatCard
                  title="Late Arrivals"
                  value={reportStats.lateArrivals}
                  subtitle="Selected period"
                  icon={Clock}
                  color={{ bg: "bg-yellow-100 dark:bg-yellow-800", text: "text-yellow-500 dark:text-yellow-300", value: "text-yellow-500" }}
                  darkMode={darkMode}
                />
                <StatCard
                  title="Absent Employees"
                  value={summaryData.absent}
                  subtitle="Today"
                  icon={UserX}
                  color={{ bg: "bg-red-100 dark:bg-red-800", text: "text-red-500 dark:text-red-300", value: "text-red-500" }}
                  darkMode={darkMode}
                />
                <StatCard
                  title="On Leave"
                  value={summaryData.onLeave}
                  subtitle="Today"
                  icon={Calendar}
                  color={{ bg: "bg-orange-100 dark:bg-orange-800", text: "text-orange-500 dark:text-orange-300", value: "text-orange-500" }}
                  darkMode={darkMode}
                />
              </div>

              <div className="mb-6">
                <ChartContainer title={`Attendance Trends - ${reportPeriod}`} darkMode={darkMode}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RBarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                      <XAxis dataKey="period" stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                      <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="present" name="Present" fill="#22c55e" />
                      <Bar dataKey="absent" name="Absent" fill="#ef4444" />
                      <Bar dataKey="leave" name="Leave" fill="#f59e0b" />
                      <Bar dataKey="late" name="Late" fill="#eab308" />
                    </RBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <ChartContainer title="Attendance Trend" darkMode={darkMode}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                      <XAxis dataKey="day" stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                      <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="present" name="Present" stroke="#22c55e" strokeWidth={2} />
                      <Line type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Top Performers" darkMode={darkMode}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={employeeStats.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                      <XAxis dataKey="name" stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                      <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="present" name="Present" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="late" name="Late" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              {/* Employee table can remain as before */}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;