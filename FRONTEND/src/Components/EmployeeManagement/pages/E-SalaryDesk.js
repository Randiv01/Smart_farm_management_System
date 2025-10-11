import React, { useState, useEffect } from "react";
import {
  Search,
  FileDown,
  ChevronDown,
  DollarSign,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Plus,
  X,
  User,
  Calendar,
  Briefcase,
  Edit,
  Trash2,
} from "lucide-react";
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
  Cell,
} from "recharts";
import Loader from "../Loader/Loader.js";
import { useETheme } from '../Econtexts/EThemeContext.jsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE_URL = 'http://localhost:5000/api';

export const SalaryDesk = () => {
  const { theme } = useETheme();
  const darkMode = theme === 'dark';

  // Set browser tab title
  useEffect(() => {
    document.title = "Salary Management - Employee Manager";
  }, []);

  const [activeTab, setActiveTab] = useState("payroll");
  const [showLoader, setShowLoader] = useState(true);
  
  // State management
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [salarySummary, setSalarySummary] = useState({
    totalPayroll: 0,
    totalOvertime: 0,
    pendingPayments: 0,
    pendingCount: 0,
    paidCount: 0
  });
  const [analytics, setAnalytics] = useState({
    monthlyTrend: [],
    departmentDistribution: [],
    statusDistribution: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Add/Edit Salary Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    position: '',
    basicSalary: '',
    overtimePay: '0',
    overtimeHours: '0:00',
    allowances: '0',
    deductions: '0',
    payrollPeriod: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1
    },
    department: '',
    performanceBonus: '0',
    commission: '0',
    taxDeduction: '0',
    insuranceDeduction: '0',
    status: 'Pending',
    paymentMethod: 'Bank Transfer',
    remarks: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Extract year and month from selectedMonth
  const [year, month] = selectedMonth.split('-').map(Number);

  // Fetch salary records
  const fetchSalaryRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        year: year.toString(),
        month: month.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedDepartment) params.append('department', selectedDepartment);

      const response = await fetch(`${API_BASE_URL}/salary?${params}`);
      if (!response.ok) throw new Error('Failed to fetch salary records');
      
      const data = await response.json();
      setSalaryRecords(data.salaries || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.total || 0);
    } catch (error) {
      console.error('Error fetching salary records:', error);
      setError('Failed to load salary records');
    } finally {
      setLoading(false);
    }
  };

  // Fetch salary summary
  const fetchSalarySummary = async () => {
    try {
      const params = new URLSearchParams({
        year: year.toString(),
        month: month.toString()
      });
      
      const response = await fetch(`${API_BASE_URL}/salary/summary?${params}`);
      if (!response.ok) throw new Error('Failed to fetch salary summary');
      
      const data = await response.json();
      setSalarySummary(data.summary || salarySummary);
    } catch (error) {
      console.error('Error fetching salary summary:', error);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams({
        year: year.toString(),
        months: '6'
      });
      
      const response = await fetch(`${API_BASE_URL}/salary/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/salary/employees`);
      if (!response.ok) throw new Error('Failed to fetch employees');
      
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Process payroll
  const handleProcessPayroll = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/salary/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year,
          month
        })
      });
      
      if (!response.ok) throw new Error('Failed to process payroll');
      
      const data = await response.json();
      setSuccess(`Payroll processed successfully! ${data.processedCount} records created.`);
      
      // Refresh data
      await Promise.all([
        fetchSalaryRecords(),
        fetchSalarySummary(),
        fetchAnalytics()
      ]);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error processing payroll:', error);
      setError('Failed to process payroll');
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        year: year.toString(),
        month: month.toString(),
        format: 'excel'
      });
      
      const response = await fetch(`${API_BASE_URL}/salary/export/excel?${params}`);
      if (!response.ok) throw new Error('Failed to export Excel');
      
      const data = await response.json();
      
      // Create and download Excel file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename || 'salary_report.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('Excel file exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      setError('Failed to export Excel file');
    } finally {
      setLoading(false);
    }
  };

  // Export to PDF (Professional Frontend Generation)
  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for better table visibility
    
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
        doc.text('MOF', 32, 30, { align: 'center' });
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
      doc.text('MOF', 32, 30, { align: 'center' });
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
      doc.text(companyWebsite, 50, 37);

      // Report title with professional styling
      doc.setFillColor(...lightGray);
      doc.rect(20, 45, 257, 12, 'F');
      doc.setTextColor(...primaryColor);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SALARY MANAGEMENT REPORT', 148, 54, { align: 'center' });

      // Report metadata
      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const monthName = new Date(0, month - 1).toLocaleString('default', { month: 'long' });
      doc.text(`Report Generated: ${reportDate} at ${reportTime}`, 20, 65);
      doc.text(`Period: ${monthName} ${year}`, 20, 70);
      doc.text(`Report ID: MOF-SAL-${Date.now().toString().slice(-6)}`, 20, 75);

      // Summary statistics
      doc.setFillColor(...secondaryColor);
      doc.rect(20, 82, 257, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYROLL SUMMARY', 25, 88);

      doc.setTextColor(...textColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Records: ${salaryRecords.length}`, 25, 97);
      doc.text(`Total Payroll: LKR ${salarySummary.totalPayroll?.toLocaleString() || 0}`, 25, 102);
      doc.text(`Total Overtime: LKR ${salarySummary.totalOvertime?.toLocaleString() || 0}`, 25, 107);
      doc.text(`Pending Payments: ${salarySummary.pendingCount || 0}`, 25, 112);
      doc.text(`Paid Records: ${salarySummary.paidCount || 0}`, 25, 117);

      // Prepare table data
      const headers = [["Emp ID", "Name", "Position", "Basic Salary", "Overtime", "Allowances", "Deductions", "Net Salary", "Status"]];
      
      const data = salaryRecords.map(record => [
        record.employeeId || 'N/A',
        record.employeeName || 'N/A',
        record.position || 'N/A',
        `LKR ${(record.basicSalary || 0).toLocaleString()}`,
        `LKR ${(record.overtimePay || 0).toLocaleString()}`,
        `LKR ${(record.allowances || 0).toLocaleString()}`,
        `LKR ${(record.deductions || 0).toLocaleString()}`,
        `LKR ${(record.netSalary || 0).toLocaleString()}`,
        record.status || 'Pending'
      ]);

      // Create professional table
      autoTable(doc, {
        head: headers,
        body: data,
        startY: 125,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: 3,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: textColor,
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { left: 20, right: 20 },
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
      const fileName = `MOF_Salary_Report_${monthName}_${year}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      setSuccess('PDF file exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    };

    const addHeaderFooter = () => {
      const pageCount = doc.internal.getNumberOfPages();
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      
      // Footer background
      doc.setFillColor(...lightGray);
      doc.rect(0, 195, 297, 15, 'F'); // Landscape dimensions
      
      // Footer content
      doc.setTextColor(...textColor);
      doc.setFontSize(8);
      doc.text(`Page ${currentPage} of ${pageCount}`, 20, 203);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 148, 203, { align: 'center' });
      doc.text(companyName, 277, 203, { align: 'right' });
      
      // Footer line
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(20, 197, 277, 197);
      
      // Disclaimer
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.text("This report is generated by Mount Olive Farm House Management System", 148, 208, { align: 'center' });
    };
  };

  // Update salary status
  const handleUpdateStatus = async (salaryId, newStatus) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/salary/${salaryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          paymentDate: newStatus === 'Paid' ? new Date().toISOString() : null
        })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      setSuccess('Status updated successfully!');
      await fetchSalaryRecords();
      await fetchSalarySummary();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.employeeId) errors.employeeId = 'Employee is required';
    if (!formData.employeeName) errors.employeeName = 'Employee name is required';
    if (!formData.position) errors.position = 'Position is required';
    if (!formData.basicSalary || formData.basicSalary <= 0) errors.basicSalary = 'Basic salary must be greater than 0';
    if (!formData.payrollPeriod.year || !formData.payrollPeriod.month) errors.payrollPeriod = 'Payroll period is required';
    
    // Validate numeric fields
    const numericFields = ['basicSalary', 'overtimePay', 'allowances', 'deductions', 'performanceBonus', 'commission', 'taxDeduction', 'insuranceDeduction'];
    numericFields.forEach(field => {
      if (formData[field] && (isNaN(formData[field]) || parseFloat(formData[field]) < 0)) {
        errors[field] = `${field} must be a valid positive number`;
      }
    });
    
    // Validate overtime hours format
    if (formData.overtimeHours && !/^\d{1,2}:\d{2}$/.test(formData.overtimeHours)) {
      errors.overtimeHours = 'Overtime hours must be in format HH:MM';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper function to get basic salary by position
  const getBasicSalaryByPosition = (position) => {
    const salaryRanges = {
      'Employee Manager': 150000,
      'Animal Manager': 120000,
      'Plant Manager': 120000,
      'Inventory Manager': 100000,
      'Animal Health Manager': 110000,
      'Plant Health Manager': 110000,
      'Worker': 45000,
      'Care Taker': 55000,
      'Cleaner': 35000,
      'Driver': 65000,
      'Other': 50000
    };
    return salaryRanges[position] || 50000;
  };

  // Helper function to get overtime rate by position
  const getOvertimeRateByPosition = (position) => {
    const managerPositions = [
      'Employee Manager',
      'Animal Manager', 
      'Plant Manager',
      'Inventory Manager',
      'Animal Health Manager',
      'Plant Health Manager'
    ];
    
    if (managerPositions.includes(position)) {
      return 200; // LKR 200 per hour for managers
    } else {
      return 100; // LKR 100 per hour for others
    }
  };

  // Fetch overtime data for an employee
  const fetchOvertimeData = async (employeeId, year, month, position = null) => {
    try {
      console.log('=== FETCHING OVERTIME DATA ===');
      console.log('Input parameters:', { employeeId, year, month, position });
      
      // First, get the employee's ObjectId by their string ID
      console.log('Step 1: Fetching employee data...');
      const employeeResponse = await fetch(`${API_BASE_URL}/employees?search=${employeeId}`);
      console.log('Employee API response status:', employeeResponse.status);
      
      if (!employeeResponse.ok) {
        console.error('Failed to fetch employee data, status:', employeeResponse.status);
        return { totalOvertimeHours: "0:00", totalOvertimePay: 0 };
      }
      
      const employeeData = await employeeResponse.json();
      console.log('Employee API response data:', employeeData);
      
      // Handle both old format (array) and new format ({ docs: [...] })
      const employeesArray = Array.isArray(employeeData) ? employeeData : (employeeData.docs || []);
      const employee = employeesArray.find(emp => emp.id === employeeId);
      
      if (!employee) {
        console.error('Employee not found:', employeeId);
        console.log('Available employees:', employeesArray.map(emp => ({ id: emp.id, name: emp.name })));
        return { totalOvertimeHours: "0:00", totalOvertimePay: 0 };
      }
      
      console.log('Found employee:', employee);
      
      // Now fetch overtime records using the employee's ObjectId and date range
      console.log('Step 2: Fetching overtime records...');
      const overtimeUrl = `${API_BASE_URL}/overtime?employee=${employee._id}&year=${year}&month=${month}`;
      console.log('Overtime API URL:', overtimeUrl);
      
      const response = await fetch(overtimeUrl);
      console.log('Overtime API response status:', response.status);
      
      if (response.ok) {
        const overtimeData = await response.json();
        let totalOvertimeHours = "0:00";
        let totalOvertimePay = 0;
        
        console.log('Fetched overtime data:', overtimeData);
        console.log('Number of records:', overtimeData.records ? overtimeData.records.length : 0);
        console.log('Overtime data structure:', JSON.stringify(overtimeData, null, 2));
        
        if (overtimeData.records && overtimeData.records.length > 0) {
          let totalMinutes = 0;
          
          for (const overtime of overtimeData.records) {
            console.log('Processing overtime record:', overtime);
            console.log('Overtime hours value:', overtime.overtimeHours, 'Type:', typeof overtime.overtimeHours);
            
            if (typeof overtime.overtimeHours === 'string' && overtime.overtimeHours.includes(':')) {
              const [hours, minutes] = overtime.overtimeHours.split(':').map(Number);
              totalMinutes += (hours * 60) + minutes;
              console.log(`Added ${hours}h ${minutes}m = ${(hours * 60) + minutes} minutes`);
            } else if (typeof overtime.overtimeHours === 'number') {
              totalMinutes += overtime.overtimeHours * 60; // Convert hours to minutes
              console.log(`Added ${overtime.overtimeHours}h = ${overtime.overtimeHours * 60} minutes`);
            }
          }
          
          console.log('Total minutes calculated:', totalMinutes);
          
          const totalHours = Math.floor(totalMinutes / 60);
          const remainingMinutes = totalMinutes % 60;
          totalOvertimeHours = `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`;
          
          // Calculate overtime pay using fixed rates
          const employeePosition = position || employee.title;
          if (employeePosition) {
            const overtimeRate = getOvertimeRateByPosition(employeePosition);
            totalOvertimePay = (totalMinutes / 60) * overtimeRate;
            
            console.log('Overtime calculation:', {
              employeePosition,
              overtimeRate,
              totalMinutes,
              totalOvertimeHours,
              totalOvertimePay
            });
          }
        } else {
          console.log('No overtime records found or records array is empty');
        }
        
        console.log('Final calculated overtime:', { totalOvertimeHours, totalOvertimePay });
        return { totalOvertimeHours, totalOvertimePay: Math.round(totalOvertimePay) };
      } else {
        console.error('Overtime API call failed, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching overtime data:', error);
      console.error('Error details:', error.message);
    }
    console.log('Returning default values: { totalOvertimeHours: "0:00", totalOvertimePay: 0 }');
    return { totalOvertimeHours: "0:00", totalOvertimePay: 0 };
  };

  // Handle form input changes
  const handleFormChange = async (field, value) => {
    if (field === 'employeeId') {
      const selectedEmployee = employees.find(emp => emp.id === value);
      if (selectedEmployee) {
        const autoSalary = getBasicSalaryByPosition(selectedEmployee.title);
        
        // Fetch overtime data for the selected payroll period
        const year = formData.payrollPeriod.year;
        const month = formData.payrollPeriod.month;
        const { totalOvertimeHours, totalOvertimePay } = await fetchOvertimeData(value, year, month, selectedEmployee.title);
        
        console.log('Updating form data with overtime:', {
          employeeId: value,
          employeeName: selectedEmployee.name,
          position: selectedEmployee.title,
          basicSalary: autoSalary.toString(),
          overtimeHours: totalOvertimeHours,
          overtimePay: Math.round(totalOvertimePay).toString()
        });
        
        setFormData(prev => {
          const newData = {
            ...prev,
            employeeId: value,
            employeeName: selectedEmployee.name,
            position: selectedEmployee.title,
            basicSalary: autoSalary.toString(),
            overtimeHours: totalOvertimeHours,
            overtimePay: Math.round(totalOvertimePay).toString()
          };
          console.log('Form data updated:', newData);
          return newData;
        });
      }
    } else if (field === 'position') {
      const autoSalary = getBasicSalaryByPosition(value);
      setFormData(prev => ({
        ...prev,
        position: value,
        basicSalary: autoSalary.toString()
      }));
      
      // Recalculate overtime pay with new position using fixed rates
      if (formData.overtimeHours && formData.overtimeHours !== "0:00") {
        const [hours, minutes] = formData.overtimeHours.split(':').map(Number);
        const overtimeRate = getOvertimeRateByPosition(value);
        const overtimePay = (hours + minutes / 60) * overtimeRate;
        
        setFormData(prev => ({
          ...prev,
          overtimePay: Math.round(overtimePay).toString()
        }));
      }
    } else if (field.includes('.')) {
      const [parent, child] = field.split('.');
      
      // If payroll period changes, fetch new overtime data
      if (parent === 'payrollPeriod' && (child === 'year' || child === 'month') && formData.employeeId) {
        const newYear = child === 'year' ? parseInt(value) : formData.payrollPeriod.year;
        const newMonth = child === 'month' ? parseInt(value) : formData.payrollPeriod.month;
        
        const { totalOvertimeHours, totalOvertimePay } = await fetchOvertimeData(formData.employeeId, newYear, newMonth, formData.position);
        
        console.log('Payroll period changed, updating overtime:', {
          newYear,
          newMonth,
          totalOvertimeHours,
          totalOvertimePay
        });
        
        setFormData(prev => {
          const newData = {
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: value
            },
            overtimeHours: totalOvertimeHours,
            overtimePay: Math.round(totalOvertimePay).toString()
          };
          console.log('Form data updated after payroll period change:', newData);
          return newData;
        });
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmitForm = async () => {
    if (!validateForm()) {
      setError('Please fix the form errors before submitting');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const isEdit = !!editingSalary;
      const url = isEdit ? `${API_BASE_URL}/salary/${editingSalary._id}` : `${API_BASE_URL}/salary`;
      const method = isEdit ? 'PUT' : 'POST';
      
      // Convert form data to proper types for backend
      const salaryData = {
        ...formData,
        basicSalary: parseFloat(formData.basicSalary) || 0,
        overtimePay: parseFloat(formData.overtimePay) || 0,
        allowances: parseFloat(formData.allowances) || 0,
        performanceBonus: parseFloat(formData.performanceBonus) || 0,
        commission: parseFloat(formData.commission) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        taxDeduction: parseFloat(formData.taxDeduction) || 0,
        insuranceDeduction: parseFloat(formData.insuranceDeduction) || 0
      };
      
      console.log('Submitting salary data:', salaryData);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salaryData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Salary submission error:', errorData);
        throw new Error(errorData.message || `Failed to ${isEdit ? 'update' : 'create'} salary record`);
      }
      
      const data = await response.json();
      console.log('Salary submission success:', data);
      setSuccess(`Salary record ${isEdit ? 'updated' : 'created'} successfully!`);
      
      // Reset form
      setFormData({
        employeeId: '',
        employeeName: '',
        position: '',
        basicSalary: '',
        overtimePay: '0',
        overtimeHours: '0:00',
        allowances: '0',
        deductions: '0',
        payrollPeriod: {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1
        },
        department: '',
        performanceBonus: '0',
        commission: '0',
        taxDeduction: '0',
        insuranceDeduction: '0',
        status: 'Pending',
        paymentMethod: 'Bank Transfer',
        remarks: ''
      });
      setFormErrors({});
      setEditingSalary(null);
      setShowAddForm(false);
      
      // Refresh data
      console.log('Refreshing salary data after form submission...');
      await Promise.all([
        fetchSalaryRecords(),
        fetchSalarySummary()
      ]);
      
      // Force a re-render by updating a dummy state
      setForceUpdate(prev => prev + 1);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error submitting salary record:', error);
      setError(error.message || 'Failed to submit salary record');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit salary
  const handleEditSalary = async (salaryRecord) => {
    setEditingSalary(salaryRecord);
    
    // Fetch fresh overtime data for the employee and period
    const year = salaryRecord.payrollPeriod?.year || new Date().getFullYear();
    const month = salaryRecord.payrollPeriod?.month || new Date().getMonth() + 1;
    const { totalOvertimeHours, totalOvertimePay } = await fetchOvertimeData(salaryRecord.employeeId, year, month, salaryRecord.position);
    
    setFormData({
      employeeId: salaryRecord.employeeId,
      employeeName: salaryRecord.employeeName,
      position: salaryRecord.position,
      basicSalary: salaryRecord.basicSalary?.toString() || '',
      overtimePay: Math.round(totalOvertimePay).toString(), // Use calculated overtime pay
      overtimeHours: totalOvertimeHours, // Use calculated overtime hours
      allowances: salaryRecord.allowances?.toString() || '0',
      deductions: salaryRecord.deductions?.toString() || '0',
      payrollPeriod: {
        year: year,
        month: month
      },
      department: salaryRecord.department || '',
      performanceBonus: salaryRecord.performanceBonus?.toString() || '0',
      commission: salaryRecord.commission?.toString() || '0',
      taxDeduction: salaryRecord.taxDeduction?.toString() || '0',
      insuranceDeduction: salaryRecord.insuranceDeduction?.toString() || '0',
      status: salaryRecord.status || 'Pending',
      paymentMethod: salaryRecord.paymentMethod || 'Bank Transfer',
      remarks: salaryRecord.remarks || ''
    });
    setShowAddForm(true);
  };

  // Handle delete salary
  const handleDeleteSalary = async (salaryId) => {
    if (!window.confirm('Are you sure you want to delete this salary record?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/salary/${salaryId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete salary record');
      }
      
      setSuccess('Salary record deleted successfully!');
      
      // Refresh data
      console.log('Refreshing salary data after deletion...');
      await Promise.all([
        fetchSalaryRecords(),
        fetchSalarySummary()
      ]);
      
      // Force a re-render by updating a dummy state
      setForceUpdate(prev => prev + 1);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting salary record:', error);
      setError(error.message || 'Failed to delete salary record');
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchSalaryRecords(),
        fetchSalarySummary(),
        fetchAnalytics(),
        fetchEmployees()
      ]);
      setShowLoader(false);
    };
    
    loadInitialData();
  }, []);

  // Force refresh when forceUpdate changes
  useEffect(() => {
    if (forceUpdate > 0) {
      console.log('Force update triggered, refreshing data...');
      const refreshData = async () => {
        await Promise.all([
          fetchSalaryRecords(),
          fetchSalarySummary()
        ]);
      };
      refreshData();
    }
  }, [forceUpdate]);

  // Refresh data when filters change
  useEffect(() => {
    if (!showLoader) {
      fetchSalaryRecords();
      fetchSalarySummary();
    }
  }, [currentPage, searchTerm, selectedMonth, selectedStatus, selectedDepartment]);

  // Refresh analytics when month changes
  useEffect(() => {
    if (!showLoader) {
      fetchAnalytics();
    }
  }, [selectedMonth]);

  if (showLoader) {
    return <Loader darkMode={darkMode} />;
  }

  // Prepare chart data
  const monthlyTrendData = analytics.monthlyTrend.map(item => ({
    name: new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', { month: 'short' }),
    amount: item.totalPayroll
  }));

  const departmentData = analytics.departmentDistribution.map((item, index) => ({
    name: item._id || 'Unknown',
    value: item.totalSalary,
    employeeCount: item.employeeCount
  }));

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Pending':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return darkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700";
      case 'Processing':
        return darkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700";
      case 'Pending':
        return darkMode ? "bg-orange-900/30 text-orange-400" : "bg-orange-100 text-orange-700";
      default:
        return darkMode ? "bg-gray-900/30 text-gray-400" : "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'light-beige'}`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Salary Management System</h1>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Track and manage employee salaries with real-time insights and automated calculations.</p>
        </div>

        {/* Notifications */}
        {error && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            darkMode 
              ? 'bg-red-900/30 border border-red-700 text-red-300' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <AlertCircle className="w-5 h-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto font-bold">×</button>
          </div>
        )}
        
        {success && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            darkMode 
              ? 'bg-green-900/30 border border-green-700 text-green-300' 
              : 'bg-green-100 border border-green-400 text-green-700'
          }`}>
            <CheckCircle className="w-5 h-5" />
            {success}
            <button onClick={() => setSuccess(null)} className="ml-auto font-bold">×</button>
          </div>
        )}

        {/* Tabs */}
        <div className={`flex mb-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab("payroll")}
            className={`px-4 py-2 text-base font-medium transition-all ${
              activeTab === "payroll"
                ? "border-b-2 border-blue-600 text-blue-600"
                : darkMode 
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Salary Records
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 text-base font-medium transition-all ${
              activeTab === "reports"
                ? "border-b-2 border-blue-600 text-blue-600"
                : darkMode 
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Filter and Action Controls */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div className="flex gap-3 flex-wrap">
            <div className={`flex items-center px-3 py-2 rounded-lg shadow-sm ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Search size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`ml-2 bg-transparent outline-none text-sm ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}
              />
            </div>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`px-3 py-2 rounded-lg shadow-sm ${
                darkMode 
                  ? 'bg-gray-700 text-gray-200 border-gray-600' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <option value="2025-10">October 2025</option>
              <option value="2025-11">November 2025</option>
              <option value="2025-12">December 2025</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`px-3 py-2 rounded-lg shadow-sm ${
                darkMode 
                  ? 'bg-gray-700 text-gray-200 border-gray-600' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Paid">Paid</option>
              <option value="Failed">Failed</option>
            </select>

            <button className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm ${
              darkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
              <Search size={18} />
              <span>Filter</span>
            </button>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => {
                console.log('Add salary button clicked, resetting form...');
                setEditingSalary(null);
                
                // Reset form data to initial state
                const resetFormData = {
                  employeeId: '',
                  employeeName: '',
                  position: '',
                  basicSalary: '',
                  overtimePay: '0',
                  overtimeHours: '0:00',
                  allowances: '0',
                  deductions: '0',
                  payrollPeriod: {
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() + 1
                  },
                  department: '',
                  performanceBonus: '0',
                  commission: '0',
                  taxDeduction: '0',
                  insuranceDeduction: '0',
                  status: 'Pending',
                  paymentMethod: 'Bank Transfer',
                  remarks: ''
                };
                
                setFormData(resetFormData);
                setFormErrors({});
                setError(null);
                setSuccess(null);
                setShowAddForm(true);
                
                console.log('Form reset completed:', resetFormData);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              <Plus size={18} />
              <span>Add Record</span>
            </button>
            
            <button 
              onClick={handleExportPDF}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              <FileDown size={18} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={`rounded-lg shadow-sm p-6 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h4 className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Payroll</h4>
            <div className="text-2xl font-bold text-green-600">
              LKR {salarySummary.totalPayroll?.toLocaleString() || '0'}
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>This month</p>
          </div>
          
          <div className={`rounded-lg shadow-sm p-6 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h4 className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Overtime Pay</h4>
            <div className="text-2xl font-bold text-orange-600">
              LKR {salarySummary.totalOvertime?.toLocaleString() || '0'}
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>This month</p>
          </div>
          
          <div className={`rounded-lg shadow-sm p-6 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h4 className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pending Payments</h4>
            <div className="text-2xl font-bold text-yellow-600">
              LKR {salarySummary.pendingPayments?.toLocaleString() || '0'}
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{salarySummary.pendingCount || 0} employees</p>
          </div>
        </div>

        {/* Main Content */}
        <div className={`rounded-lg shadow-sm ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Payroll Tab */}
          {activeTab === "payroll" && (
            <>
              {/* Salary Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={`text-xs ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-500'
                  }`}>
                    <tr>
                      <th className="px-4 py-3 text-left">No</th>
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Employee</th>
                      <th className="px-4 py-3 text-left">Position</th>
                      <th className="px-4 py-3 text-left">Basic</th>
                      <th className="px-4 py-3 text-left">Overtime</th>
                      <th className="px-4 py-3 text-left">Total</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    darkMode ? 'divide-gray-700' : 'divide-gray-200'
                  }`}>
                    {loading ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-8 text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : salaryRecords.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                          No salary records found
                        </td>
                      </tr>
                    ) : (
                        salaryRecords.map((record, index) => (
                          <tr key={record._id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                            <td className={`px-4 py-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{index + 1}</td>
                            <td className={`px-4 py-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{record.employeeId}</td>
                            <td className={`px-4 py-3 font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{record.employeeName}</td>
                            <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{record.position}</td>
                            <td className={`px-4 py-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>LKR {record.basicSalary?.toLocaleString()}</td>
                            <td className={`px-4 py-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>LKR {record.overtimePay?.toLocaleString()}</td>
                            <td className={`px-4 py-3 font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>LKR {record.totalSalary?.toLocaleString()}</td>
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
                                <select
                                  value={record.status}
                                  onChange={(e) => handleUpdateStatus(record._id, e.target.value)}
                                  className={`px-2 py-1 rounded text-xs ${
                                    darkMode 
                                      ? 'bg-gray-700 text-gray-200 border-gray-600' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Paid">Paid</option>
                                  <option value="Failed">Failed</option>
                                </select>
                                <button 
                                  onClick={() => handleEditSalary(record)}
                                  className={`p-1 rounded ${
                                    darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                                  }`}
                                  title="Edit Salary"
                                >
                                  <Edit size={16} className="text-blue-500" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteSalary(record._id)}
                                  className={`p-1 rounded ${
                                    darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                                  }`}
                                  title="Delete Salary"
                                >
                                  <Trash2 size={16} className="text-red-500" />
                                </button>
                                <button className={`p-1 rounded ${
                                  darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                                }`}>
                                  <FileText size={16} className="text-green-500" />
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
              <div className={`flex justify-between items-center px-4 py-3 border-t ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Showing {salaryRecords.length} of {totalRecords} records
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded disabled:opacity-50 ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  <span className={`px-3 py-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded disabled:opacity-50 ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Salary Reports</h3>
                <div className="flex gap-3">
                  <select className={`px-3 py-2 rounded-xl ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"} shadow-sm`}>
                    <option>Last 6 Months</option>
                    <option>This Year</option>
                    <option>Last Year</option>
                    <option>Custom Range</option>
                  </select>
                  <button 
                    onClick={handleExportExcel}
                    disabled={loading}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-xl shadow-sm transition transform hover:scale-[1.01]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown size={18} />}
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Monthly Trend Chart */}
              <div className={`rounded-xl p-6 mb-6 ${darkMode ? "bg-gray-800" : "bg-gray-50"} shadow-lg`}>
                <h4 className="font-medium mb-4">Monthly Payroll Trend</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                      <XAxis dataKey="name" stroke={darkMode ? "#9CA3AF" : "#374151"} />
                      <YAxis stroke={darkMode ? "#9CA3AF" : "#374151"} />
                      <Tooltip
                        formatter={(value) => [`LKR ${value?.toLocaleString()}`, "Amount"]}
                        contentStyle={{
                          backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                          border: darkMode ? "1px solid #4B5563" : "1px solid #E5E7EB",
                          color: darkMode ? "#F3F4F6" : "#374151",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="amount" name="Payroll Amount" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Distribution */}
              <div className={`rounded-xl p-6 ${darkMode ? "bg-gray-800" : "bg-gray-50"} shadow-lg`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Salary Distribution by Department</h4>
                  <button className="flex items-center gap-1 text-sm">
                    <span>This Month</span>
                    <ChevronDown size={16} className={darkMode ? "text-gray-300" : "text-gray-500"} />
                  </button>
                </div>
                
                {analytics.departmentDistribution.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Progress Bars */}
                    <div className="flex flex-col gap-4">
                      {analytics.departmentDistribution.map((dept, index) => {
                        const maxSalary = Math.max(...analytics.departmentDistribution.map(d => d.totalSalary));
                        const percentage = (dept.totalSalary / maxSalary) * 100;
                        
                        return (
                          <div key={dept._id}>
                            <div className="flex justify-between mb-1 text-sm">
                              <span>{dept._id || 'Unknown'}</span>
                              <span>LKR {dept.totalSalary?.toLocaleString()} ({dept.employeeCount} employees)</span>
                            </div>
                            <div className={`w-full ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Pie Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={departmentData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {departmentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`LKR ${value?.toLocaleString()}`, "Amount"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No department data available for this period
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Add Salary Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl shadow-2xl`}>
              <div className="sticky top-0 bg-inherit border-b border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{editingSalary ? 'Edit Salary Record' : 'Add Salary Record'}</h2>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setFormErrors({});
                      setEditingSalary(null);
                    }}
                    className={`p-2 rounded-full hover:${darkMode ? "bg-gray-700" : "bg-gray-100"} transition`}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Employee Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <User className="inline w-4 h-4 mr-1" />
                        Employee *
                      </label>
                      <select
                        value={formData.employeeId}
                        onChange={(e) => handleFormChange('employeeId', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                        } ${formErrors.employeeId ? "border-red-500" : ""}`}
                      >
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.id} - {emp.name} ({emp.title})
                          </option>
                        ))}
                      </select>
                      {formErrors.employeeId && <p className="text-red-500 text-sm mt-1">{formErrors.employeeId}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Employee Name</label>
                      <input
                        type="text"
                        value={formData.employeeName}
                        readOnly
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? "bg-gray-700 text-gray-400 border-gray-600" : "bg-gray-100 text-gray-600 border-gray-300"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Position</label>
                      <input
                        type="text"
                        value={formData.position}
                        readOnly
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? "bg-gray-700 text-gray-400 border-gray-600" : "bg-gray-100 text-gray-600 border-gray-300"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <Calendar className="inline w-4 h-4 mr-1" />
                        Payroll Period *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={formData.payrollPeriod.year}
                          onChange={(e) => handleFormChange('payrollPeriod.year', parseInt(e.target.value))}
                          className={`px-3 py-2 rounded-lg border ${
                            darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                          } ${formErrors.payrollPeriod ? "border-red-500" : ""}`}
                        >
                          <option value={2024}>2024</option>
                          <option value={2025}>2025</option>
                          <option value={2026}>2026</option>
                        </select>
                        <select
                          value={formData.payrollPeriod.month}
                          onChange={(e) => handleFormChange('payrollPeriod.month', parseInt(e.target.value))}
                          className={`px-3 py-2 rounded-lg border ${
                            darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                          } ${formErrors.payrollPeriod ? "border-red-500" : ""}`}
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                      </div>
                      {formErrors.payrollPeriod && <p className="text-red-500 text-sm mt-1">{formErrors.payrollPeriod}</p>}
                    </div>
                  </div>

                  {/* Salary Components */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Basic Salary (LKR) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm">LKR</span>
                        <input
                          type="number"
                          value={formData.basicSalary}
                          onChange={(e) => handleFormChange('basicSalary', e.target.value)}
                          className={`w-full pl-12 pr-3 py-2 rounded-lg border ${
                            darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                          } ${formErrors.basicSalary ? "border-red-500" : ""}`}
                          placeholder="35000"
                          min="0"
                          step="1"
                        />
                      </div>
                      {formErrors.basicSalary && <p className="text-red-500 text-sm mt-1">{formErrors.basicSalary}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Overtime Pay (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm">LKR</span>
                        <input
                          key={`overtime-pay-${forceUpdate}`}
                          type="number"
                          value={formData.overtimePay}
                          onChange={(e) => handleFormChange('overtimePay', e.target.value)}
                          className={`w-full pl-12 pr-3 py-2 rounded-lg border ${
                            darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                          } ${formErrors.overtimePay ? "border-red-500" : ""}`}
                          placeholder="0"
                          min="0"
                          step="1"
                          readOnly
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Auto-calculated from overtime hours</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">Overtime Hours</label>
                        <button
                          type="button"
                          onClick={async () => {
                            if (formData.employeeId && formData.payrollPeriod.year && formData.payrollPeriod.month) {
                              console.log('Refresh button clicked, fetching overtime data...');
                              console.log('Form data before fetch:', {
                                employeeId: formData.employeeId,
                                year: formData.payrollPeriod.year,
                                month: formData.payrollPeriod.month,
                                position: formData.position
                              });
                              
                              const { totalOvertimeHours, totalOvertimePay } = await fetchOvertimeData(
                                formData.employeeId, 
                                formData.payrollPeriod.year, 
                                formData.payrollPeriod.month,
                                formData.position
                              );
                              
                              console.log('Received overtime data:', { totalOvertimeHours, totalOvertimePay });
                              
                              setFormData(prev => {
                                const newData = {
                                  ...prev,
                                  overtimeHours: totalOvertimeHours,
                                  overtimePay: Math.round(totalOvertimePay).toString()
                                };
                                console.log('Updating form data in refresh:', newData);
                                return newData;
                              });
                              
                              // Force a re-render
                              setForceUpdate(prev => prev + 1);
                            } else {
                              console.log('Missing required data for refresh:', {
                                employeeId: formData.employeeId,
                                year: formData.payrollPeriod?.year,
                                month: formData.payrollPeriod?.month
                              });
                            }
                          }}
                          className="text-xs text-blue-500 hover:text-blue-700 underline mr-2"
                          disabled={!formData.employeeId}
                        >
                          Refresh
                        </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (formData.employeeId && formData.payrollPeriod.year && formData.payrollPeriod.month) {
                            try {
                              const response = await fetch(`${API_BASE_URL}/salary/debug/overtime?employeeId=${formData.employeeId}&year=${formData.payrollPeriod.year}&month=${formData.payrollPeriod.month}`);
                              const data = await response.json();
                              console.log('Debug overtime data:', data);
                              
                              let message = `Found ${data.totalRecords} overtime records for ${data.employee.name} in ${data.period.year}/${data.period.month}\n\n`;
                              if (data.calculatedOvertime) {
                                message += `Calculated Overtime:\n`;
                                message += `Position: ${data.calculatedOvertime.position}\n`;
                                message += `Total Hours: ${data.calculatedOvertime.totalOvertimeHours}\n`;
                                message += `Total Pay: LKR ${data.calculatedOvertime.calculatedPay}\n`;
                                message += `Basic Salary: LKR ${data.calculatedOvertime.basicSalary}\n`;
                                message += `Overtime Rate: LKR ${data.calculatedOvertime.overtimeRate}/hour`;
                              }
                              alert(message);
                            } catch (error) {
                              console.error('Debug error:', error);
                              alert('Error fetching debug data');
                            }
                          }
                        }}
                        className="text-xs text-green-500 hover:text-green-700 underline"
                        disabled={!formData.employeeId}
                      >
                        Debug
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (formData.employeeId && formData.payrollPeriod.year && formData.payrollPeriod.month) {
                            console.log('=== MANUAL TEST BUTTON CLICKED ===');
                            try {
                              // Step 1: Test if backend is running
                              console.log('Step 1: Testing backend connection...');
                              const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/`);
                              console.log('Backend health check status:', healthResponse.status);
                              
                              // Step 2: Test employee API
                              console.log('Step 2: Testing employee API...');
                              const employeeTestResponse = await fetch(`${API_BASE_URL}/employees`);
                              console.log('Employee API status:', employeeTestResponse.status);
                              const employeeTestData = await employeeTestResponse.json();
                              console.log('Employee API data sample:', employeeTestData.docs?.slice(0, 2));
                              
                              // Step 3: Test overtime API directly
                              console.log('Step 3: Testing overtime API...');
                              const overtimeTestResponse = await fetch(`${API_BASE_URL}/overtime`);
                              console.log('Overtime API status:', overtimeTestResponse.status);
                              const overtimeTestData = await overtimeTestResponse.json();
                              console.log('Overtime API data sample:', overtimeTestData);
                              
                              // Step 4: Test the debug endpoint
                              console.log('Step 4: Testing debug endpoint...');
                              const testResponse = await fetch(`${API_BASE_URL}/salary/debug/overtime?employeeId=${formData.employeeId}&year=${formData.payrollPeriod.year}&month=${formData.payrollPeriod.month}`);
                              console.log('Debug API status:', testResponse.status);
                              const testData = await testResponse.json();
                              console.log('Debug API result:', testData);
                              
                              // Step 5: Test the fetchOvertimeData function
                              console.log('Step 5: Testing fetchOvertimeData function...');
                              const { totalOvertimeHours, totalOvertimePay } = await fetchOvertimeData(
                                formData.employeeId, 
                                formData.payrollPeriod.year, 
                                formData.payrollPeriod.month,
                                formData.position
                              );
                              
                              console.log('fetchOvertimeData result:', { totalOvertimeHours, totalOvertimePay });
                              
                              // Update form data with force update
                              setFormData(prev => {
                                const newData = {
                                  ...prev,
                                  overtimeHours: totalOvertimeHours,
                                  overtimePay: Math.round(totalOvertimePay).toString()
                                };
                                console.log('Updating form data in test:', newData);
                                return newData;
                              });
                              
                              // Force a re-render
                              setForceUpdate(prev => prev + 1);
                              
                              alert(`Test completed! Overtime: ${totalOvertimeHours}, Pay: LKR ${Math.round(totalOvertimePay)}\n\nCheck console for detailed logs.`);
                            } catch (error) {
                              console.error('Test error:', error);
                              alert('Test failed: ' + error.message + '\n\nCheck console for details.');
                            }
                          } else {
                            alert('Please select an employee and payroll period first');
                          }
                        }}
                        className="text-xs text-purple-500 hover:text-purple-700 underline ml-2"
                        disabled={!formData.employeeId}
                      >
                        Test
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (formData.employeeId) {
                            console.log('Creating test overtime records...');
                            try {
                              // First get the employee's ObjectId
                              console.log('Creating test data for employee ID:', formData.employeeId);
                              const employeeResponse = await fetch(`${API_BASE_URL}/employees`);
                              if (!employeeResponse.ok) {
                                throw new Error('Failed to fetch employee data');
                              }
                              
                              const employeeData = await employeeResponse.json();
                              console.log('All employees:', employeeData);
                              // Handle both old format (array) and new format ({ docs: [...] })
                              const employeesArray = Array.isArray(employeeData) ? employeeData : (employeeData.docs || []);
                              const employee = employeesArray.find(emp => emp.id === formData.employeeId);
                              
                              if (!employee) {
                                console.error('Employee not found. Available employees:', employeesArray.map(emp => ({ id: emp.id, name: emp.name })));
                                throw new Error(`Employee not found. Available: ${employeesArray.map(emp => emp.id).join(', ')}`);
                              }
                              
                              console.log('Found employee for test data:', employee);
                              
                              // Create test overtime records with ObjectId
                              const testOvertimeData = [
                                {
                                  employee: employee._id,
                                  date: new Date(2025, 9, 1), // October 1, 2025
                                  overtimeHours: "2:30",
                                  description: "Test overtime record 1",
                                  status: "Approved"
                                },
                                {
                                  employee: employee._id,
                                  date: new Date(2025, 9, 2), // October 2, 2025
                                  overtimeHours: "2:00",
                                  description: "Test overtime record 2",
                                  status: "Approved"
                                }
                              ];
                              
                              for (const overtimeRecord of testOvertimeData) {
                                const response = await fetch(`${API_BASE_URL}/overtime`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify(overtimeRecord)
                                });
                                
                                if (response.ok) {
                                  console.log('Created overtime record:', overtimeRecord);
                                } else {
                                  const errorText = await response.text();
                                  console.error('Failed to create overtime record:', errorText);
                                }
                              }
                              
                              alert('Test overtime records created! Now click Refresh to see the overtime data.');
                            } catch (error) {
                              console.error('Error creating test overtime records:', error);
                              alert('Error creating test records: ' + error.message);
                            }
                          } else {
                            alert('Please select an employee first');
                          }
                        }}
                        className="text-xs text-orange-500 hover:text-orange-700 underline ml-2"
                        disabled={!formData.employeeId}
                      >
                        Create Test Data
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (formData.employeeId && formData.payrollPeriod.year && formData.payrollPeriod.month) {
                            console.log('Using debug data to update form...');
                            try {
                              // Use the debug endpoint to get the data
                              const response = await fetch(`${API_BASE_URL}/salary/debug/overtime?employeeId=${formData.employeeId}&year=${formData.payrollPeriod.year}&month=${formData.payrollPeriod.month}`);
                              const data = await response.json();
                              
                              if (data.calculatedOvertime) {
                                const { totalOvertimeHours, calculatedPay } = data.calculatedOvertime;
                                
                                console.log('Using debug data:', { totalOvertimeHours, calculatedPay });
                                
                                setFormData(prev => {
                                  const newData = {
                                    ...prev,
                                    overtimeHours: totalOvertimeHours,
                                    overtimePay: Math.round(calculatedPay).toString()
                                  };
                                  console.log('Form updated with debug data:', newData);
                                  return newData;
                                });
                                
                                setForceUpdate(prev => prev + 1);
                                
                                alert(`Form updated with debug data!\nOvertime: ${totalOvertimeHours}\nPay: LKR ${Math.round(calculatedPay)}`);
                              } else {
                                alert('No overtime data found in debug response');
                              }
                            } catch (error) {
                              console.error('Error using debug data:', error);
                              alert('Error: ' + error.message);
                            }
                          } else {
                            alert('Please select an employee and payroll period first');
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 underline ml-2"
                        disabled={!formData.employeeId}
                      >
                        Use Debug Data
                      </button>
                      </div>
                      <input
                        key={`overtime-hours-${forceUpdate}`}
                        type="text"
                        value={formData.overtimeHours}
                        onChange={(e) => handleFormChange('overtimeHours', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                        } ${formErrors.overtimeHours ? "border-red-500" : ""}`}
                        placeholder="0:00"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Auto-calculated from attendance records</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Allowances (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm">LKR</span>
                        <input
                          type="number"
                          value={formData.allowances}
                          onChange={(e) => handleFormChange('allowances', e.target.value)}
                          className={`w-full pl-12 pr-3 py-2 rounded-lg border ${
                            darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                          }`}
                          placeholder="200"
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Deductions and Advanced */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Deductions (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm">LKR</span>
                        <input
                          type="number"
                          value={formData.deductions}
                          onChange={(e) => handleFormChange('deductions', e.target.value)}
                          className={`w-full pl-12 pr-3 py-2 rounded-lg border ${
                            darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                          }`}
                          placeholder="0"
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Tax Deduction (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm">LKR</span>
                        <input
                          type="number"
                          value={formData.taxDeduction}
                          onChange={(e) => handleFormChange('taxDeduction', e.target.value)}
                          className={`w-full pl-12 pr-3 py-2 rounded-lg border ${
                            darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                          }`}
                          placeholder="0"
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Insurance Deduction (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm">LKR</span>
                        <input
                          type="number"
                          value={formData.insuranceDeduction}
                          onChange={(e) => handleFormChange('insuranceDeduction', e.target.value)}
                          className={`w-full pl-12 pr-3 py-2 rounded-lg border ${
                            darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                          }`}
                          placeholder="0"
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Performance Bonus (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm">LKR</span>
                        <input
                          type="number"
                          value={formData.performanceBonus}
                          onChange={(e) => handleFormChange('performanceBonus', e.target.value)}
                          className={`w-full pl-12 pr-3 py-2 rounded-lg border ${
                            darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                          }`}
                          placeholder="0"
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status and Payment */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleFormChange('status', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Payment Method</label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                        }`}
                      >
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                        <option value="Check">Check</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Department</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => handleFormChange('department', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                        }`}
                        placeholder="e.g., Farm Operations"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Remarks</label>
                      <textarea
                        value={formData.remarks}
                        onChange={(e) => handleFormChange('remarks', e.target.value)}
                        rows="3"
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"
                        }`}
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setFormErrors({});
                      setEditingSalary(null);
                    }}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitForm}
                    disabled={loading}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                    {editingSalary ? 'Update Salary Record' : 'Create Salary Record'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryDesk;