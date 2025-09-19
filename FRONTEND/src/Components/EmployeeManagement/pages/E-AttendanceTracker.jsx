// Frontend: E-AttendanceTracker.jsx
import React, { useState, useEffect } from "react";
import { Search, Filter, Plus, Trash2, Edit, FileDown, Clock, UserCheck, UserX, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Set base URL for API calls
const API_BASE_URL = "http://localhost:5000";

export const AttendanceTracker = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState("daily");
  const [showForm, setShowForm] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [summaryData, setSummaryData] = useState({ present: 0, absent: 0, onLeave: 0, late: 0, total: 0 });
  const [chartData, setChartData] = useState([]);
  const [reportStats, setReportStats] = useState({ attendanceRate: 0, lateArrivals: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportPeriod, setReportPeriod] = useState("thisweek");
  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    date: new Date().toISOString().split("T")[0],
    checkIn: "",
    checkOut: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Configure axios base URL
  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL;
  }, []);

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const params = { date: selectedDate };
      if (searchTerm) params.employeeId = searchTerm;
      
      const response = await axios.get("/api/attendance", { params });
      setAttendanceData(response.data);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      setErrorMessage("Error fetching attendance data. Make sure the server is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary data
  const fetchSummaryData = async () => {
    try {
      const response = await axios.get(`/api/attendance/summary/${selectedDate}`);
      setSummaryData(response.data);
    } catch (error) {
      console.error("Error fetching summary data:", error);
    }
  };

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/attendance/reports", {
        params: { period: reportPeriod }
      });
      setChartData(response.data.chartData || []);
      setReportStats({
        attendanceRate: response.data.attendanceRate || 0,
        lateArrivals: response.data.lateArrivals || 0
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      setErrorMessage("Error fetching report data. Make sure the server is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when dependencies change
  useEffect(() => {
    if (activeTab === "daily") {
      fetchAttendanceData();
      fetchSummaryData();
    } else {
      fetchReportData();
    }
  }, [activeTab, selectedDate, searchTerm, reportPeriod]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.employeeId.trim()) errors.employeeId = "Employee ID is required";
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.date) errors.date = "Date is required";
    
    // If check-in is provided, validate it
    if (formData.checkIn) {
      const [hours, minutes] = formData.checkIn.split(':').map(Number);
      if (hours > 23 || minutes > 59) {
        errors.checkIn = "Invalid time format";
      }
    }
    
    // If check-out is provided, validate it
    if (formData.checkOut) {
      const [hours, minutes] = formData.checkOut.split(':').map(Number);
      if (hours > 23 || minutes > 59) {
        errors.checkOut = "Invalid time format";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Determine status based on check-in time
  const determineStatus = (checkInTime) => {
    if (!checkInTime || checkInTime === "-") return "Absent";
    
    const [time, modifier] = checkInTime.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    
    // After 10:00 AM is absent
    if (hours > 10 || (hours === 10 && minutes > 0)) return "Absent";
    
    // After 8:00 AM is late
    if (hours > 8 || (hours === 8 && minutes > 0)) return "Late";
    
    // Before 8:00 AM is present
    return "Present";
  };

  // Handle form submission
  // Frontend: E-AttendanceTracker.jsx - Update the handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMessage("");
  setSuccessMessage("");
  
  if (!validateForm()) return;
  
  try {
    // Convert time formats for backend (don't determine status here - backend will do it)
    const submitData = {
      employeeId: formData.employeeId,
      name: formData.name,
      date: formData.date,
      checkIn: formData.checkIn ? convertToDisplayTime(formData.checkIn) : "-",
      checkOut: formData.checkOut ? convertToDisplayTime(formData.checkOut) : "-",
      // Remove the status field - backend will calculate it
    };

    if (editingId) {
      await axios.patch(`/api/attendance/${editingId}`, submitData);
      setSuccessMessage("Attendance record updated successfully!");
    } else {
      await axios.post("/api/attendance", submitData);
      setSuccessMessage("Attendance record added successfully!");
    }
    
    // Rest of the function remains the same...
  } catch (error) {
    console.error("Error saving attendance:", error);
    const errorMsg = error.response?.data?.message || "Error saving attendance record. Make sure the server is running.";
    setErrorMessage(errorMsg);
  }
};

  // Convert time format from "HH:MM" to "H:MM AM/PM" for display
  // Frontend: E-AttendanceTracker.jsx - Update the convertToDisplayTime function
const convertToDisplayTime = (timeStr) => {
  if (timeStr === "-" || !timeStr) return "-";
  
  // Check if it's already in display format (contains AM/PM)
  if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
  
  // Convert from "HH:MM" to "H:MM AM/PM"
  let [hours, minutes] = timeStr.split(":").map(Number);
  const modifier = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert to 12-hour format
  
  return `${hours}:${minutes.toString().padStart(2, '0')} ${modifier}`;
};

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this attendance record?")) return;
    
    try {
      await axios.delete(`/api/attendance/${id}`);
      setSuccessMessage("Attendance record deleted successfully!");
      fetchAttendanceData();
      fetchSummaryData();
      if (activeTab === "reports") fetchReportData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting attendance:", error);
      setErrorMessage("Error deleting attendance record");
    }
  };

  // Handle edit
// Frontend: E-AttendanceTracker.jsx - Update the handleEdit function
const handleEdit = (record) => {
  // Convert display time back to input time format
  const convertToTimeInput = (timeStr) => {
    if (timeStr === "-" || !timeStr) return "";
    
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  setFormData({
    employeeId: record.employeeId,
    name: record.name,
    date: new Date(record.date).toISOString().split("T")[0],
    checkIn: record.checkIn !== "-" ? convertToTimeInput(record.checkIn) : "",
    checkOut: record.checkOut !== "-" ? convertToTimeInput(record.checkOut) : "",
    // Remove status field
  });
  setEditingId(record._id);
  setShowForm(true);
};

  // Generate PDF report
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("Attendance Report", 14, 22);
    
    // Period
    doc.setFontSize(12);
    doc.text(`Period: ${reportPeriod}`, 14, 32);
    
    // Stats
    doc.text(`Attendance Rate: ${reportStats.attendanceRate}%`, 14, 42);
    doc.text(`Late Arrivals: ${reportStats.lateArrivals}`, 14, 52);
    
    // Chart data as table
    const tableData = chartData.map(item => [
      item.period,
      item.present,
      item.absent,
      item.leave,
      item.late
    ]);
    
    autoTable(doc, {
      startY: 60,
      head: [['Date', 'Present', 'Absent', 'Leave', 'Late']],
      body: tableData,
    });
    
    doc.save("attendance-report.pdf");
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Present": return "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200";
      case "Absent": return "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200";
      case "On Leave": return "bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200";
      case "Late": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "Present": return <UserCheck size={16} className="text-green-500" />;
      case "Absent": return <UserX size={16} className="text-red-500" />;
      case "On Leave": return <Calendar size={16} className="text-orange-500" />;
      case "Late": return <Clock size={16} className="text-yellow-500" />;
      default: return null;
    }
  };

  // Data for pie chart in reports
  const pieData = [
    { name: 'Present', value: summaryData.present, color: '#22c55e' },
    { name: 'Absent', value: summaryData.absent, color: '#ef4444' },
    { name: 'On Leave', value: summaryData.onLeave, color: '#f59e0b' },
    { name: 'Late', value: summaryData.late, color: '#eab308' }
  ];

  return (
    <div className={`font-sans min-h-screen ${darkMode ? "bg-gray-900 text-gray-200" : "bg-light-beige text-gray-800"}`}>
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Success: </strong>
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex mb-6 border-b dark:border-gray-700">
        <button
          onClick={() => setActiveTab("daily")}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            activeTab === "daily"
              ? "border-b-2 border-dark-green text-dark-green dark:text-dark-green"
              : "text-inherit"
          }`}
        >
          <Calendar size={18} />
          <span>Daily Attendance</span>
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            activeTab === "reports"
              ? "border-b-2 border-dark-green text-dark-green dark:text-dark-green"
              : "text-inherit"
          }`}
        >
          <FileDown size={18} />
          <span>Reports</span>
        </button>
      </div>

      {/* Daily Attendance */}
      {activeTab === "daily" && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className={`flex items-center px-3 py-2 rounded-md ${darkMode ? "bg-gray-700" : "bg-soft-white shadow-card"}`}>
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
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-sm"
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
                className={`px-3 py-2 border rounded-md text-sm ${darkMode ? "bg-gray-800 border-gray-600" : "bg-soft-white border-gray-300"}`}
              />
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-dark-green text-soft-white hover:bg-green-700 transition-colors shadow-btn"
              >
                <Plus size={18} />
                <span>Add Attendance</span>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
            <div className={`p-4 rounded-lg shadow-card ${darkMode ? "bg-dark-card" : "bg-soft-white"}`}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-800">
                  <UserCheck size={20} className="text-green-500 dark:text-green-300" />
                </div>
                <h4 className="font-medium">Present</h4>
              </div>
              <div className="flex justify-between items-end mt-2">
                <p className="text-2xl font-bold text-green-500">{summaryData.present}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">out of {summaryData.total}</p>
              </div>
            </div>
            <div className={`p-4 rounded-lg shadow-card ${darkMode ? "bg-dark-card" : "bg-soft-white"}`}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-800">
                  <UserX size={20} className="text-red-500 dark:text-red-300" />
                </div>
                <h4 className="font-medium">Absent</h4>
              </div>
              <div className="flex justify-between items-end mt-2">
                <p className="text-2xl font-bold text-red-500">{summaryData.absent}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">out of {summaryData.total}</p>
              </div>
            </div>
            <div className={`p-4 rounded-lg shadow-card ${darkMode ? "bg-dark-card" : "bg-soft-white"}`}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-800">
                  <Calendar size={20} className="text-orange-500 dark:text-orange-300" />
                </div>
                <h4 className="font-medium">On Leave</h4>
              </div>
              <div className="flex justify-between items-end mt-2">
                <p className="text-2xl font-bold text-orange-500">{summaryData.onLeave}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">out of {summaryData.total}</p>
              </div>
            </div>
            <div className={`p-4 rounded-lg shadow-card ${darkMode ? "bg-dark-card" : "bg-soft-white"}`}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-800">
                  <Clock size={20} className="text-yellow-500 dark:text-yellow-300" />
                </div>
                <h4 className="font-medium">Late</h4>
              </div>
              <div className="flex justify-between items-end mt-2">
                <p className="text-2xl font-bold text-yellow-500">{summaryData.late}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">out of {summaryData.total}</p>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          {loading ? (
            <div className="text-center py-8">Loading attendance data...</div>
          ) : (
            <div className={`rounded-lg overflow-hidden shadow-card ${darkMode ? "bg-dark-card" : "bg-soft-white"}`}>
              <table className="w-full border-collapse">
                <thead className={darkMode ? "bg-gray-800" : "bg-gray-100"}>
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
                        className={`border-t ${darkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50"}`}
                      >
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">{record.employeeId}</td>
                        <td className="px-4 py-3">{record.name}</td>
                        <td className="px-4 py-3">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{record.checkIn}</td>
                        <td className="px-4 py-3">{record.checkOut}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}
                            >
                              {record.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEdit(record)}
                              className="p-2 bg-btn-blue text-white rounded-full hover:bg-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(record._id)}
                              className="p-2 bg-btn-red text-white rounded-full hover:bg-red-600 transition-colors"
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
            </div>
          )}

          {/* Add/Edit Attendance Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`p-6 rounded-lg w-full max-w-md max-h-screen overflow-y-auto ${darkMode ? "bg-dark-card" : "bg-soft-white"} shadow-xl`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {editingId ? <Edit size={20} /> : <Plus size={20} />}
                  {editingId ? "Edit Attendance" : "Add Attendance"}
                </h3>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee ID *</label>
                    <input 
                      type="text" 
                      name="employeeId"
                      placeholder="Enter Employee ID" 
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"} ${formErrors.employeeId ? "border-red-500" : ""}`}
                      value={formData.employeeId}
                      onChange={handleInputChange}
                    />
                    {formErrors.employeeId && <p className="text-red-500 text-xs mt-1">{formErrors.employeeId}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input 
                      type="text" 
                      name="name"
                      placeholder="Enter Name" 
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"} ${formErrors.name ? "border-red-500" : ""}`}
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Date *</label>
                    <input 
                      type="date" 
                      name="date"
                      className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"} ${formErrors.date ? "border-red-500" : ""}`}
                      value={formData.date}
                      onChange={handleInputChange}
                    />
                    {formErrors.date && <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Check In</label>
                      <input 
                        type="time" 
                        name="checkIn"
                        className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"} ${formErrors.checkIn ? "border-red-500" : ""}`}
                        value={formData.checkIn}
                        onChange={handleInputChange}
                      />
                      {formErrors.checkIn && <p className="text-red-500 text-xs mt-1">{formErrors.checkIn}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Check Out</label>
                      <input 
                        type="time" 
                        name="checkOut"
                        className={`w-full border rounded px-3 py-2 ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"} ${formErrors.checkOut ? "border-red-500" : ""}`}
                        value={formData.checkOut}
                        onChange={handleInputChange}
                      />
                      {formErrors.checkOut && <p className="text-red-500 text-xs mt-1">{formErrors.checkOut}</p>}
                    </div>
                  </div>
                  
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        setFormData({
                          employeeId: "",
                          name: "",
                          date: new Date().toISOString().split("T")[0],
                          checkIn: "",
                          checkOut: "",
                          status: "Present"
                        });
                        setFormErrors({});
                      }} 
                      className="px-4 py-2 rounded bg-btn-gray text-white hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 rounded bg-dark-green text-white hover:bg-green-700 transition-colors"
                    >
                      {editingId ? "Update" : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reports */}
      {activeTab === "reports" && (
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileDown size={20} />
              Attendance Reports
            </h3>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
              <select 
                className={`px-3 py-2 border rounded-md text-sm ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}`}
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
              >
                <option value="thisweek">This Week</option>
                <option value="lastweek">Last Week</option>
                <option value="thismonth">This Month</option>
                <option value="lastmonth">Last Month</option>
              </select>
              <button
                onClick={generatePDF}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-btn-blue text-white hover:bg-blue-600 transition-colors"
              >
                <FileDown size={16} />
                <span>Generate PDF</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading report data...</div>
          ) : (
            <>
              <div className={`p-6 rounded-lg mb-6 shadow-card ${darkMode ? "bg-dark-card" : "bg-soft-white"}`}>
                <h4 className="mb-4 font-medium">Attendance Summary - {reportPeriod}</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                      <XAxis dataKey="period" stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                      <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                      <Tooltip 
                        contentStyle={darkMode ? { 
                          backgroundColor: '#1F2937', 
                          borderColor: '#374151',
                          color: '#F9FAFB'
                        } : {}} 
                      />
                      <Legend />
                      <Bar dataKey="present" name="Present" fill="#22c55e" />
                      <Bar dataKey="absent" name="Absent" fill="#ef4444" />
                      <Bar dataKey="leave" name="Leave" fill="#f59e0b" />
                      <Bar dataKey="late" name="Late" fill="#eab308" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className={`p-6 rounded-lg shadow-card ${darkMode ? "bg-dark-card" : "bg-soft-white"}`}>
                  <h4 className="font-medium mb-2">Today's Attendance Distribution</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={darkMode ? { 
                            backgroundColor: '#1F2937', 
                            borderColor: '#374151',
                            color: '#F9FAFB'
                          } : {}} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg shadow-card ${darkMode ? "bg-dark-card" : "bg-soft-white"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-full bg-green-100 dark:bg-green-800">
                        <UserCheck size={20} className="text-green-500 dark:text-green-300" />
                      </div>
                      <h4>Attendance Rate</h4>
                    </div>
                    <p className="text-2xl font-bold text-green-500">{reportStats.attendanceRate}%</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Average for selected period</p>
                  </div>
                  
                  <div className={`p-4 rounded-lg shadow-card ${darkMode ? "bg-dark-card" : "bg-soft-white"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-800">
                        <Clock size={20} className="text-yellow-500 dark:text-yellow-300" />
                      </div>
                      <h4>Late Arrivals</h4>
                    </div>
                    <p className="text-2xl font-bold text-yellow-500">{reportStats.lateArrivals}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Selected period</p>
                  </div>
                  
                  <div className={`p-4 rounded-lg shadow-card ${darkMode ? "bg-dark-card" : "bg-soft-white"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-full bg-red-100 dark:bg-red-800">
                        <UserX size={20} className="text-red-500 dark:text-red-300" />
                      </div>
                      <h4>Absent Employees</h4>
                    </div>
                    <p className="text-2xl font-bold text-red-500">{summaryData.absent}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
                  </div>
                  
                  <div className={`p-4 rounded-lg shadow-card ${darkMode ? "bg-dark-card" : "bg-soft-white"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-800">
                        <Calendar size={20} className="text-orange-500 dark:text-orange-300" />
                      </div>
                      <h4>On Leave</h4>
                    </div>
                    <p className="text-2xl font-bold text-orange-500">{summaryData.onLeave}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};