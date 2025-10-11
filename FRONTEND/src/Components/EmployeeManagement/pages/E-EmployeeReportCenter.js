import React, { useState, useEffect } from "react";
import {
  Search,
  FileDown,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Award,
  Briefcase,
  MapPin as LocationIcon,
} from "lucide-react";
import Loader from "../Loader/Loader.js";
import { useETheme } from '../Econtexts/EThemeContext.jsx';

export const EEmployeeReportCenter = () => {
  const { theme, toggleTheme } = useETheme();
  const darkMode = theme === 'dark';

  // Set browser tab title
  useEffect(() => {
    document.title = "Employee Report Center - Employee Manager";
  }, []);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showLoader, setShowLoader] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch employees list
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (departmentFilter !== 'all') params.append('department', departmentFilter);
      
      const response = await fetch(`http://localhost:5000/api/employee-reports/employees?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setEmployees(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch employees');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee report details
  const fetchEmployeeReport = async (employeeId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/employee-reports/employee/${employeeId}`);
      const data = await response.json();
      
      if (data.success) {
        setEmployeeDetails(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch employee report');
      console.error('Error fetching employee report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployee(employeeId);
    fetchEmployeeReport(employeeId);
  };

  // Handle export comprehensive report
  const handleExportReport = async () => {
    if (!selectedEmployee) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/employee-reports/employee/${selectedEmployee}/export?format=pdf`);
      
      if (response.ok) {
        // Get the filename from the response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `${selectedEmployee}_comprehensive_report.pdf`;
        
        // Get the PDF content
        const pdfBlob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Show success message
        alert('Comprehensive report exported successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to export report');
      }
    } catch (err) {
      setError('Failed to export report');
      console.error('Error exporting report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle download specific report types
  const handleDownloadReport = async (reportType) => {
    if (!selectedEmployee) return;
    
    try {
      setLoading(true);
      let endpoint = '';
      let filename = '';
      
      switch (reportType) {
        case 'attendance':
          endpoint = `http://localhost:5000/api/employee-reports/employee/${selectedEmployee}/attendance/export?format=pdf`;
          filename = `${selectedEmployee}_attendance_report.pdf`;
          break;
        case 'overtime':
          endpoint = `http://localhost:5000/api/employee-reports/employee/${selectedEmployee}/overtime/export?format=pdf`;
          filename = `${selectedEmployee}_overtime_report.pdf`;
          break;
        case 'salary':
          endpoint = `http://localhost:5000/api/employee-reports/employee/${selectedEmployee}/salary/export?format=pdf`;
          filename = `${selectedEmployee}_salary_report.pdf`;
          break;
        case 'leave':
          endpoint = `http://localhost:5000/api/employee-reports/employee/${selectedEmployee}/leave/export?format=pdf`;
          filename = `${selectedEmployee}_leave_report.pdf`;
          break;
        default:
          return;
      }
      
      const response = await fetch(endpoint);
      
      if (response.ok) {
        // Get the PDF content
        const pdfBlob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Show success message
        alert(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report exported successfully!`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || `Failed to export ${reportType} report`);
      }
    } catch (err) {
      setError(`Failed to export ${reportType} report`);
      console.error(`Error exporting ${reportType} report:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
      fetchEmployees();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Fetch employees when search term or filter changes
  useEffect(() => {
    if (!showLoader) {
      const debounceTimer = setTimeout(() => {
        fetchEmployees();
      }, 300);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, departmentFilter, showLoader]);

  if (showLoader) {
    return <Loader darkMode={darkMode} />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-gray-200" : "light-beige"}`}>
      <div className="max-w-full mx-auto p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8">
          <aside className={`w-full lg:w-80 xl:w-96 2xl:w-[28rem] rounded-2xl sm:rounded-3xl border shadow-xl sm:shadow-2xl p-4 sm:p-6 ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <div className="space-y-4">
              <div className={`flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 border shadow-md sm:shadow-lg ${
                darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
              }`}>
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full bg-transparent outline-none text-sm sm:text-base md:text-lg ${
                    darkMode ? "text-gray-200 placeholder-gray-400" : "text-gray-700 placeholder-gray-400"
                  }`}
                />
              </div>

              <select
                className={`w-full rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 border shadow-md sm:shadow-lg text-sm sm:text-base md:text-lg ${
                  darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-200 text-gray-700"
                }`}
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                <option value="farm">Farm Operations</option>
                <option value="inventory">Inventory Management</option>
                <option value="health">Health Management</option>
                <option value="admin">Administration</option>
                <option value="employee">Employee Management</option>
                <option value="plant">Plant Management</option>
                <option value="animal">Animal Management</option>
              </select>

              <div className="flex flex-col gap-2 sm:gap-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Loading employees...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-4">
                    <p className={`text-sm ${darkMode ? "text-red-400" : "text-red-600"}`}>{error}</p>
                    <button 
                      onClick={fetchEmployees}
                      className="mt-2 px-3 py-1 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
                    >
                      Retry
                    </button>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-4">
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No employees found</p>
                  </div>
                ) : (
                  employees.map((e) => {
                    const active = selectedEmployee === e.id;
                    return (
                      <button
                        key={e.id}
                        onClick={() => handleEmployeeSelect(e.id)}
                        className={`text-left px-3 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border transition-all duration-300 shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl hover:scale-[1.01] sm:hover:scale-[1.02] ${
                          active
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-transparent shadow-orange-500/25"
                            : darkMode
                            ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600 hover:border-gray-500"
                            : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-bold text-sm sm:text-base md:text-lg mb-1">{e.name}</div>
                        <div className="text-xs sm:text-sm md:text-base opacity-80 mb-1">{e.title}</div>
                        <div className="text-xs sm:text-sm opacity-70">{e.department}</div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          <main className="flex-1 space-y-4 sm:space-y-6 md:space-y-8">
            {selectedEmployee && !employeeDetails && loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Loading employee report...</p>
                </div>
              </div>
            ) : selectedEmployee && employeeDetails ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <div>
                    <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${
                      darkMode ? "text-gray-100" : "text-gray-900"
                    } mb-2 sm:mb-3`}>
                      {employeeDetails.employee.name}
                    </h3>
                    <p className={`text-base sm:text-lg md:text-xl ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {employeeDetails.employee.title} • {employeeDetails.employee.department}
                    </p>
                  </div>
                  <button 
                    onClick={handleExportReport}
                    disabled={loading}
                    className={`inline-flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 shadow-lg sm:shadow-xl hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 text-sm sm:text-base md:text-lg lg:text-xl font-semibold sm:font-bold ${
                      loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl sm:hover:shadow-2xl'
                    }`}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <FileDown className="w-5 h-5" />
                    )}
                    <span>{loading ? 'Exporting...' : 'Export Full Report'}</span>
                  </button>
                </div>

                <section className={`rounded-2xl sm:rounded-3xl border shadow-xl sm:shadow-2xl p-6 sm:p-8 md:p-10 lg:p-12 ${
                  darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}>
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10 lg:mb-12">
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-indigo-500 text-white shadow-lg sm:shadow-xl">
                      <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                    </div>
                    <h4 className={`text-xl sm:text-2xl md:text-3xl font-bold ${
                      darkMode ? "text-gray-100" : "text-gray-900"
                    }`}>
                      Personal Information
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
                    <div className={`flex items-center gap-4 p-6 rounded-2xl ${darkMode ? "bg-gray-700/50" : "bg-blue-50/50"} border ${darkMode ? "border-gray-600" : "border-blue-100"} hover:shadow-lg transition-all duration-300`}>
                      <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-blue-600"}`}>Employee ID</p>
                        <p className="font-bold text-xl">{employeeDetails.employee.id}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-4 p-6 rounded-2xl ${darkMode ? "bg-gray-700/50" : "bg-green-50/50"} border ${darkMode ? "border-gray-600" : "border-green-100"} hover:shadow-lg transition-all duration-300`}>
                      <div className="p-3 rounded-xl bg-green-100 text-green-600">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-green-600"}`}>Department</p>
                        <p className="font-bold text-xl">{employeeDetails.employee.department}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-4 p-6 rounded-2xl ${darkMode ? "bg-gray-700/50" : "bg-purple-50/50"} border ${darkMode ? "border-gray-600" : "border-purple-100"} hover:shadow-lg transition-all duration-300`}>
                      <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-purple-600"}`}>Job Title</p>
                        <p className="font-bold text-xl">{employeeDetails.employee.title}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-4 p-6 rounded-2xl ${darkMode ? "bg-gray-700/50" : "bg-orange-50/50"} border ${darkMode ? "border-gray-600" : "border-orange-100"} hover:shadow-lg transition-all duration-300`}>
                      <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-orange-600"}`}>Joined Date</p>
                        <p className="font-bold text-xl">{employeeDetails.employee.joined}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-4 p-6 rounded-2xl ${darkMode ? "bg-gray-700/50" : "bg-red-50/50"} border ${darkMode ? "border-gray-600" : "border-red-100"} hover:shadow-lg transition-all duration-300`}>
                      <div className="p-3 rounded-xl bg-red-100 text-red-600">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-red-600"}`}>Contact</p>
                        <p className="font-bold text-xl">{employeeDetails.employee.contact}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-4 p-6 rounded-2xl ${darkMode ? "bg-gray-700/50" : "bg-indigo-50/50"} border ${darkMode ? "border-gray-600" : "border-indigo-100"} hover:shadow-lg transition-all duration-300`}>
                      <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-indigo-600"}`}>Email</p>
                        <p className="font-bold text-xl">{employeeDetails.employee.email || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className={`sm:col-span-2 xl:col-span-3 flex items-start gap-4 p-6 rounded-2xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50/50"} border ${darkMode ? "border-gray-600" : "border-gray-200"} hover:shadow-lg transition-all duration-300`}>
                      <div className="p-3 rounded-xl bg-gray-100 text-gray-600">
                        <LocationIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Address</p>
                        <p className="font-bold text-xl">{employeeDetails.employee.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
                  <div className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border shadow-xl sm:shadow-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl sm:hover:shadow-3xl hover:scale-[1.02] sm:hover:scale-[1.03] ${
                    darkMode ? "bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/50" : "bg-gradient-to-br from-blue-50 to-white border-blue-200"
                  }`}>
                    <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-500/10 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
                    <div className="relative flex items-start gap-6">
                      <div className="p-4 rounded-2xl bg-blue-500 text-white shadow-xl">
                        <Calendar className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-2xl mb-2">Attendance</h4>
                        <p className={`text-base font-medium mb-4 ${darkMode ? "text-blue-300" : "text-blue-600"}`}>This Month</p>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-green-600 font-bold text-lg">{employeeDetails.attendance.present} present</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-red-600 font-bold text-lg">{employeeDetails.attendance.absent} absent</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-orange-500 font-bold text-lg">{employeeDetails.attendance.onLeave} leave</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border shadow-xl sm:shadow-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl sm:hover:shadow-3xl hover:scale-[1.02] sm:hover:scale-[1.03] ${
                    darkMode ? "bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-700/50" : "bg-gradient-to-br from-orange-50 to-white border-orange-200"
                  }`}>
                    <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-orange-500/10 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
                    <div className="relative flex items-start gap-6">
                      <div className="p-4 rounded-2xl bg-orange-500 text-white shadow-xl">
                        <Clock className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-2xl mb-2">Overtime</h4>
                        <p className={`text-base font-medium mb-4 ${darkMode ? "text-orange-300" : "text-orange-600"}`}>Hours</p>
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm sm:text-base font-medium">This month:</span>
                            <span className="text-orange-600 font-bold text-lg sm:text-xl md:text-2xl">
                              {employeeDetails.overtime.currentMonth > 0 
                                ? `${Math.floor(employeeDetails.overtime.currentMonth)}h ${Math.round((employeeDetails.overtime.currentMonth % 1) * 60)}m`
                                : '0h 0m'
                              }
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm sm:text-base font-medium">Last month:</span>
                            <span className="text-orange-500 font-bold text-base sm:text-lg md:text-xl">
                              {employeeDetails.overtime.lastMonth > 0 
                                ? `${Math.floor(employeeDetails.overtime.lastMonth)}h ${Math.round((employeeDetails.overtime.lastMonth % 1) * 60)}m`
                                : '0h 0m'
                              }
                            </span>
                          </div>
                          {employeeDetails.overtime.currentMonth > 0 && (
                            <div className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-orange-100 dark:bg-orange-900/20">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                                <span className="text-xs sm:text-sm font-bold text-orange-700 dark:text-orange-300">Active overtime</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border shadow-xl sm:shadow-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl sm:hover:shadow-3xl hover:scale-[1.02] sm:hover:scale-[1.03] ${
                    darkMode ? "bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700/50" : "bg-gradient-to-br from-green-50 to-white border-green-200"
                  }`}>
                    <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-500/10 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
                    <div className="relative flex items-start gap-6">
                      <div className="p-4 rounded-2xl bg-green-500 text-white shadow-xl">
                        <DollarSign className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-2xl mb-2">Salary</h4>
                        <p className={`text-base font-medium mb-4 ${darkMode ? "text-green-300" : "text-green-600"}`}>Current Month</p>
                        {employeeDetails.salary ? (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm sm:text-base font-medium">Basic:</span>
                            <span className="text-gray-700 dark:text-gray-300 font-bold text-sm sm:text-base md:text-lg">LKR {employeeDetails.salary.basic?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-600">
                            <span className="text-base sm:text-lg font-bold">Total:</span>
                            <span className="text-green-600 font-bold text-lg sm:text-xl md:text-2xl">LKR {employeeDetails.salary.total?.toLocaleString()}</span>
                          </div>
                        </div>
                        ) : (
                          <div className="text-center py-6">
                            <span className="text-gray-500 text-lg">No salary data available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className={`rounded-2xl sm:rounded-3xl border shadow-xl sm:shadow-2xl p-6 sm:p-8 md:p-10 lg:p-12 ${
                  darkMode ? "bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700" : "bg-gradient-to-br from-white to-gray-50/50 border-gray-200"
                }`}>
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10 lg:mb-12">
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-indigo-500 text-white shadow-lg sm:shadow-xl">
                      <FileText className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                    </div>
                    <h4 className={`text-xl sm:text-2xl md:text-3xl font-bold ${
                      darkMode ? "text-gray-100" : "text-gray-900"
                    }`}>
                      Available Reports
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
                    {[
                      { 
                        label: "Attendance Report", 
                        desc: "Monthly attendance summary with detailed breakdown", 
                        tone: "blue", 
                        type: "attendance",
                        icon: Calendar,
                        bgColor: "from-blue-500 to-blue-600"
                      },
                      { 
                        label: "Leave Report", 
                        desc: "Leave history, balance, and usage patterns", 
                        tone: "orange", 
                        type: "leave",
                        icon: Calendar,
                        bgColor: "from-orange-500 to-orange-600"
                      },
                      { 
                        label: "Overtime Report", 
                        desc: "Overtime hours, rates, and compensation details", 
                        tone: "purple", 
                        type: "overtime",
                        icon: Clock,
                        bgColor: "from-purple-500 to-purple-600"
                      },
                      { 
                        label: "Salary Report", 
                        desc: "Salary history, breakdown, and payment records", 
                        tone: "green", 
                        type: "salary",
                        icon: DollarSign,
                        bgColor: "from-green-500 to-green-600"
                      },
                    ].map((r, i) => {
                      const IconComponent = r.icon;
                      return (
                        <div
                          key={i}
                          className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] ${
                            darkMode
                              ? "bg-gray-700/50 border-gray-600 hover:bg-gray-600/50"
                              : "bg-white/80 border-gray-200 hover:bg-white"
                          } p-6`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className={`p-4 rounded-2xl bg-gradient-to-r ${r.bgColor} text-white shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                                <IconComponent className="w-6 h-6" />
                              </div>
                              <div>
                                <h5 className="font-bold text-xl mb-2">{r.label}</h5>
                                <p className={`text-base ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{r.desc}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDownloadReport(r.type)}
                              disabled={loading}
                              className={`px-6 py-3 rounded-xl text-base font-bold transition-all duration-300 transform hover:scale-105 ${
                                loading 
                                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                  : `bg-gradient-to-r ${r.bgColor} text-white hover:shadow-xl`
                              }`}
                            >
                              {loading ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Downloading...</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <FileDown className="w-4 h-4" />
                                  <span>Download</span>
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            ) : (
              <section className={`h-full rounded-2xl border border-dashed shadow-xl p-10 flex flex-col items-center justify-center text-center ${
                darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"
              }`}>
                <FileText className={`w-12 h-12 mb-4 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                <h3 className={`text-lg font-semibold ${
                  darkMode ? "text-gray-100" : "text-gray-900"
                }`}>No Employee Selected</h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Select an employee from the list to view their detailed profile and generate reports.
                </p>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};