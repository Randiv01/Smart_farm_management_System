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
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50"}`}>
      {/* PAGE HEADER — title + one-line tagline */}
      <div className="mb-6 p-6 lg:p-8 xl:p-10">
        <div className="max-w-7xl mx-auto">
          <h1 className={`text-3xl lg:text-4xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Reports
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Generate comprehensive employee reports and analytics
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Column - Employee List */}
          <aside className={`w-full lg:w-80 xl:w-96 rounded-2xl border shadow-lg p-6 lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <div className="space-y-4">
              {/* Search Bar */}
              <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
              }`}>
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full bg-transparent outline-none text-base ${
                    darkMode ? "text-gray-200 placeholder-gray-400" : "text-gray-700 placeholder-gray-400"
                  }`}
                />
              </div>

              {/* Department Filter */}
              <select
                className={`w-full rounded-xl px-4 py-3 border text-base ${
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
                        className={`group text-left px-4 py-4 rounded-xl border transition-all duration-300 ${
                          active
                            ? "bg-orange-500 text-white border-transparent shadow-lg"
                            : darkMode
                            ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600 hover:border-gray-500"
                            : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-bold text-lg mb-1 truncate">{e.name}</div>
                        <div className="text-sm opacity-80 mb-1 truncate">{e.title}</div>
                        <div className="text-xs opacity-70 truncate">{e.department}</div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          {/* Right Column - Employee Details */}
          <main className="flex-1 space-y-6">
            {selectedEmployee && !employeeDetails && loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Loading employee report...</p>
                </div>
              </div>
            ) : selectedEmployee && employeeDetails ? (
              <>
                {/* Employee Header */}
                <div className="mb-8">
                  <h3 className={`text-4xl font-bold mb-2 ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  }`}>
                    {employeeDetails.employee.name}
                  </h3>
                  <p className={`text-xl ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {employeeDetails.employee.title} • {employeeDetails.employee.department}
                  </p>
                </div>


                {/* Personal Information Section */}
                <section className={`rounded-2xl border shadow-lg p-5 ${
                  darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-indigo-500 text-white">
                      <User className="w-5 h-5" />
                    </div>
                    <h4 className={`text-xl font-bold ${
                      darkMode ? "text-gray-100" : "text-gray-900"
                    }`}>
                      Personal Information
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    <div className={`flex items-start gap-3 p-4 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}>
                      <div className={`p-2 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                        <User className={`w-5 h-5 ${darkMode ? "text-gray-200" : "text-gray-600"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Employee ID</p>
                        <p className={`font-semibold text-base ${darkMode ? "text-white" : "text-gray-900"}`}>{employeeDetails.employee.id}</p>
                      </div>
                    </div>
                    <div className={`flex items-start gap-3 p-4 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}>
                      <div className={`p-2 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                        <Briefcase className={`w-5 h-5 ${darkMode ? "text-gray-200" : "text-gray-600"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Department</p>
                        <p className={`font-semibold text-base break-words whitespace-normal ${darkMode ? "text-white" : "text-gray-900"}`}>{employeeDetails.employee.department}</p>
                      </div>
                    </div>
                    <div className={`flex items-start gap-3 p-4 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}>
                      <div className={`p-2 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                        <Award className={`w-5 h-5 ${darkMode ? "text-gray-200" : "text-gray-600"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Job Title</p>
                        <p className={`font-semibold text-base break-words whitespace-normal ${darkMode ? "text-white" : "text-gray-900"}`}>{employeeDetails.employee.title}</p>
                      </div>
                    </div>
                    <div className={`flex items-start gap-3 p-4 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}>
                      <div className={`p-2 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                        <Calendar className={`w-5 h-5 ${darkMode ? "text-gray-200" : "text-gray-600"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Joined Date</p>
                        <p className={`font-semibold text-base ${darkMode ? "text-white" : "text-gray-900"}`}>{employeeDetails.employee.joined}</p>
                      </div>
                    </div>
                    <div className={`flex items-start gap-3 p-4 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}>
                      <div className={`p-2 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                        <Phone className={`w-5 h-5 ${darkMode ? "text-gray-200" : "text-gray-600"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Contact</p>
                        <p className={`font-semibold text-base break-words whitespace-normal ${darkMode ? "text-white" : "text-gray-900"}`}>{employeeDetails.employee.contact}</p>
                      </div>
                    </div>
                    <div className={`flex items-start gap-3 p-4 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}>
                      <div className={`p-2 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                        <Mail className={`w-5 h-5 ${darkMode ? "text-gray-200" : "text-gray-600"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Email</p>
                        <p className={`font-semibold text-base break-words whitespace-normal ${darkMode ? "text-white" : "text-gray-900"}`}>{employeeDetails.employee.email || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className={`sm:col-span-2 xl:col-span-3 flex items-start gap-3 p-4 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}>
                      <div className={`p-2 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                        <LocationIcon className={`w-5 h-5 ${darkMode ? "text-gray-200" : "text-gray-600"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Address</p>
                        <p className={`font-semibold text-base break-words whitespace-normal ${darkMode ? "text-white" : "text-gray-900"}`}>{employeeDetails.employee.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Stats Cards Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <div className={`rounded-2xl border shadow-lg p-6 ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-blue-500 text-white">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-xl mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>Attendance</h4>
                        <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>This Month</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className={`text-sm font-medium ${darkMode ? "text-green-400" : "text-green-600"}`}>{employeeDetails.attendance.present} present</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className={`text-sm font-medium ${darkMode ? "text-red-400" : "text-red-600"}`}>{employeeDetails.attendance.absent} absent</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className={`text-sm font-medium ${darkMode ? "text-orange-400" : "text-orange-600"}`}>{employeeDetails.attendance.onLeave} leave</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-2xl border shadow-lg p-6 ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-orange-500 text-white">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-xl mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>Overtime</h4>
                        <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Hours</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>This month:</span>
                            <span className={`font-bold ${darkMode ? "text-orange-400" : "text-orange-600"}`}>
                              {employeeDetails.overtime.currentMonth > 0 
                                ? `${Math.floor(employeeDetails.overtime.currentMonth)}h ${Math.round((employeeDetails.overtime.currentMonth % 1) * 60)}m`
                                : '0h 0m'
                              }
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Last month:</span>
                            <span className={`font-bold ${darkMode ? "text-orange-400" : "text-orange-600"}`}>
                              {employeeDetails.overtime.lastMonth > 0 
                                ? `${Math.floor(employeeDetails.overtime.lastMonth)}h ${Math.round((employeeDetails.overtime.lastMonth % 1) * 60)}m`
                                : '0h 0m'
                              }
                            </span>
                          </div>
                          {employeeDetails.overtime.currentMonth > 0 && (
                            <div className="mt-3 p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-orange-600" />
                                <span className="text-xs font-bold text-orange-700 dark:text-orange-300">Active overtime</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-2xl border shadow-lg p-6 ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-green-500 text-white">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-xl mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>Salary</h4>
                        <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Current Month</p>
                        {employeeDetails.salary ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Basic:</span>
                            <span className={`font-bold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>LKR {employeeDetails.salary.basic?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                            <span className={`font-bold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Total:</span>
                            <span className={`font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>LKR {employeeDetails.salary.total?.toLocaleString()}</span>
                          </div>
                        </div>
                        ) : (
                          <div className="text-center py-4">
                            <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No salary data available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

              </>
            ) : (
              <section className={`h-full rounded-2xl border border-dashed p-12 flex flex-col items-center justify-center text-center ${
                darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"
              }`}>
                <FileText className={`w-16 h-16 mb-6 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? "text-gray-100" : "text-gray-900"
                }`}>No Employee Selected</h3>
                <p className={`text-base ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
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