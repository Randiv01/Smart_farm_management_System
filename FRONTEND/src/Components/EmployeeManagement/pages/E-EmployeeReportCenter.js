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
    <div className={`h-full ${darkMode ? "bg-gray-900 text-gray-200" : "light-beige"}`}>
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className={`w-full md:w-80 rounded-2xl border shadow-xl p-4 ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <div className="space-y-4">
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border shadow-sm ${
                darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
              }`}>
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full bg-transparent outline-none ${
                    darkMode ? "text-gray-200 placeholder-gray-400" : "text-gray-700 placeholder-gray-400"
                  }`}
                />
              </div>

              <select
                className={`w-full rounded-xl px-3 py-2 border shadow-sm ${
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

              <div className="flex flex-col gap-2">
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
                        className={`text-left px-3 py-2 rounded-xl border transition shadow-sm hover:shadow ${
                          active
                            ? "bg-orange-500 text-white border-transparent"
                            : darkMode
                            ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600"
                            : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium">{e.name}</div>
                        <div className="text-sm opacity-80">{e.title}</div>
                        <div className="text-xs opacity-70">{e.department}</div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {selectedEmployee && !employeeDetails && loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Loading employee report...</p>
                </div>
              </div>
            ) : selectedEmployee && employeeDetails ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-semibold ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  }`}>
                    {employeeDetails.employee.name}
                  </h3>
                  <button 
                    onClick={handleExportReport}
                    disabled={loading}
                    className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 shadow-lg hover:scale-[1.01] transition transform ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Exporting...' : 'Export Full Report'}</span>
                  </button>
                </div>

                <section className={`rounded-2xl border shadow-xl p-5 mb-6 ${
                  darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}>
                  <h4 className={`text-lg font-semibold ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  } mb-4`}>
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Employee ID</p>
                        <p className="font-medium">{employeeDetails.employee.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Department</p>
                        <p className="font-medium">{employeeDetails.employee.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Job Title</p>
                        <p className="font-medium">{employeeDetails.employee.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Joined Date</p>
                        <p className="font-medium">{employeeDetails.employee.joined}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Contact</p>
                        <p className="font-medium">{employeeDetails.employee.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Email</p>
                        <p className="font-medium">{employeeDetails.employee.email || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="sm:col-span-2 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                      <div>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Address</p>
                        <p className="font-medium">{employeeDetails.employee.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className={`flex items-start gap-3 rounded-2xl border shadow-xl p-4 ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}>
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Attendance</h4>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>This Month</p>
                      <p className="mt-1">
                        <span className="text-green-600">{employeeDetails.attendance.present} present</span>
                        <span className="mx-1 opacity-70">•</span>
                        <span className="text-red-600">{employeeDetails.attendance.absent} absent</span>
                        <span className="mx-1 opacity-70">•</span>
                        <span className="text-orange-500">{employeeDetails.attendance.onLeave} leave</span>
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-3 rounded-2xl border shadow-xl p-4 ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}>
                    <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Overtime</h4>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Hours</p>
                      <p className="mt-1">
                        This month: <span className="text-orange-600">{employeeDetails.overtime.currentMonth}h</span>
                        <br />
                        Last month: {employeeDetails.overtime.lastMonth}h
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-3 rounded-2xl border shadow-xl p-4 ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}>
                    <div className="p-2 rounded-full bg-green-100 text-green-600">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Salary</h4>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Current Month</p>
                      <p className="mt-1">
                        {employeeDetails.salary ? (
                          <>
                            Basic: ${employeeDetails.salary.basic}
                            <br />
                            Total: <span className="text-green-600">${employeeDetails.salary.total}</span>
                          </>
                        ) : (
                          <span className="text-gray-500">No salary data available</span>
                        )}
                      </p>
                    </div>
                  </div>
                </section>

                <section className={`rounded-2xl border shadow-xl p-5 ${
                  darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}>
                  <h4 className={`text-lg font-semibold ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  } mb-4`}>
                    Available Reports
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Attendance Report", desc: "Monthly attendance summary", tone: "text-blue-600", type: "attendance" },
                      { label: "Leave Report", desc: "Leave history and balance", tone: "text-orange-600", type: "leave" },
                      { label: "Overtime Report", desc: "Overtime hours and compensation", tone: "text-purple-600", type: "overtime" },
                      { label: "Salary Report", desc: "Salary history and breakdown", tone: "text-green-600", type: "salary" },
                    ].map((r, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-xl border transition shadow-sm hover:shadow ${
                          darkMode
                            ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                            : "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100"
                        } p-4`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className={`w-5 h-5 ${r.tone}`} />
                          <div>
                            <h5 className="font-medium">{r.label}</h5>
                            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{r.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadReport(r.type)}
                          disabled={loading}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                            loading 
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                              : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                        >
                          {loading ? 'Downloading...' : 'Download'}
                        </button>
                      </div>
                    ))}
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