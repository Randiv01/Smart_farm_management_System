// IDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useITheme } from "../Icontexts/IThemeContext";
import { 
  TrendingUp, TrendingDown, Download, AlertTriangle, Package, 
  Globe, ShoppingCart, DollarSign, BarChart3, PieChart as PieChartIcon,
  RefreshCw, Filter, Zap, AlertCircle, Box, Truck, CheckCircle, Clock,
  Calendar, FileText, Printer, Mail, X, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const IDashboard = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalStock: 695,
    exportStock: 275,
    localSales: 420,
    totalValue: 3290.05,
    trends: {
      totalStock: 12,
      exportStock: 18,
      localSales: -3,
      totalValue: 7
    }
  });

  const [loading, setLoading] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [activeChartTab, setActiveChartTab] = useState("stock");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    format: 'pdf',
    includeCharts: true,
    dateRange: 'month',
    sections: {
      summary: true,
      charts: true,
      alerts: true,
      activity: true
    }
  });
  const [generatingReport, setGeneratingReport] = useState(false);
  const reportRef = useRef();

  const [lowStockItems, setLowStockItems] = useState([
    { name: "Organic Eggs", current: 12, threshold: 20, category: "Eggs" },
    { name: "Fresh Milk", current: 18, threshold: 25, category: "Dairy" },
    { name: "Tomatoes", current: 22, threshold: 30, category: "Vegetables" },
    { name: "Chicken Breast", current: 15, threshold: 25, category: "Meat" }
  ]);

  const [recentActivity, setRecentActivity] = useState([
    { action: "stock_added", item: "Vegetables", quantity: "200kg", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { action: "sold", item: "Eggs", quantity: "50 units", timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { action: "exported", item: "Meat", quantity: "30 units", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { action: "stock_added", item: "Milk", quantity: "150L", timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) }
  ]);

  // Chart color schemes for dark/light mode
  const COLORS = {
    vegetables: darkMode ? '#86efac' : '#22c55e',
    eggs: darkMode ? '#fde047' : '#eab308',
    meat: darkMode ? '#fdba74' : '#f97316',
    milk: darkMode ? '#a5b4fc' : '#6366f1',
    finals: darkMode ? '#c084fc' : '#a855f7',
    primary: darkMode ? '#86efac' : '#22c55e',
    secondary: darkMode ? '#107703ff' : '#02751eff',
    accent: darkMode ? '#1ef81eff' : '#4bf916ff',
    background: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#e5e7eb' : '#374151',
    grid: darkMode ? '#4b5563' : '#e5e7eb'
  };

  // Sample chart data
  const [chartData, setChartData] = useState({
    stockByCategory: [
      { category: 'Vegetables', weekly: 150, monthly: 100, yearly: 200, export: 50 },
      { category: 'Eggs', weekly: 120, monthly: 80, yearly: 150, export: 40 },
      { category: 'Meat', weekly: 90, monthly: 70, yearly: 120, export: 60 },
      { category: 'Milk', weekly: 110, monthly: 90, yearly: 130, export: 70 },
      { category: 'Finals', weekly: 80, monthly: 60, yearly: 100, export: 30 }
    ],
    stockDistribution: [
      { name: 'Vegetables', value: 150, color: COLORS.vegetables },
      { name: 'Eggs', value: 120, color: COLORS.eggs },
      { name: 'Meat', value: 90, color: COLORS.meat },
      { name: 'Milk', value: 110, color: COLORS.milk },
      { name: 'Finals', value: 80, color: COLORS.finals }
    ],
    monthlyTrend: [
      { month: 'Jan', stock: 520, sales: 480, value: 2800 },
      { month: 'Feb', stock: 580, sales: 520, value: 3100 },
      { month: 'Mar', stock: 620, sales: 580, value: 3500 },
      { month: 'Apr', stock: 590, sales: 610, value: 3300 },
      { month: 'May', stock: 640, sales: 590, value: 3700 },
      { month: 'Jun', stock: 680, sales: 630, value: 3900 },
      { month: 'Jul', stock: 720, sales: 670, value: 4200 },
      { month: 'Aug', stock: 695, sales: 720, value: 4100 },
      { month: 'Sep', stock: 730, sales: 680, value: 4300 },
      { month: 'Oct', stock: 750, sales: 710, value: 4500 },
      { month: 'Nov', stock: 780, sales: 740, value: 4800 },
      { month: 'Dec', stock: 820, sales: 780, value: 5200 }
    ]
  });

  // Set browser tab title
  useEffect(() => {
    document.title = "Farm Manager - Inventory Dashboard";
  }, []);

  // Clear success messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setSuccess("Dashboard data refreshed successfully");
        setLoading(false);
      }, 1000);
    } catch (error) {
      setError("Failed to refresh dashboard data");
      setLoading(false);
    }
  };

  const openReportModal = () => {
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
  };

  const updateReportOption = (key, value) => {
    setReportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateSectionOption = (section, value) => {
    setReportOptions(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: value
      }
    }));
  };

  const generateCSVReport = () => {
    let csvContent = "Farm Manager Inventory Report\n\n";
    
    // Summary section
    if (reportOptions.sections.summary) {
      csvContent += "SUMMARY\n";
      csvContent += "Metric,Value,Trend\n";
      csvContent += `Total Stock,${dashboardData.totalStock},${dashboardData.trends.totalStock}%\n`;
      csvContent += `Export Stock,${dashboardData.exportStock},${dashboardData.trends.exportStock}%\n`;
      csvContent += `Local Sales,${dashboardData.localSales},${dashboardData.trends.localSales}%\n`;
      csvContent += `Total Value,$${dashboardData.totalValue},${dashboardData.trends.totalValue}%\n\n`;
    }

    // Low stock alerts
    if (reportOptions.sections.alerts) {
      csvContent += "LOW STOCK ALERTS\n";
      csvContent += "Product,Current Stock,Threshold,Category\n";
      lowStockItems.forEach(item => {
        csvContent += `${item.name},${item.current},${item.threshold},${item.category}\n`;
      });
      csvContent += "\n";
    }

    // Recent activity
    if (reportOptions.sections.activity) {
      csvContent += "RECENT ACTIVITY\n";
      csvContent += "Action,Item,Quantity,Date\n";
      recentActivity.forEach(activity => {
        csvContent += `${activity.action},${activity.item},${activity.quantity},${activity.timestamp.toLocaleDateString()}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farm-inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generatePDFReport = async () => {
    setGeneratingReport(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
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
          pdf.addImage(logoImg, 'PNG', 20, 15, 25, 25);
          generatePDFContent();
        };
        logoImg.onerror = () => {
          // Fallback to placeholder if logo fails to load
          pdf.setFillColor(...primaryColor);
          pdf.rect(20, 15, 25, 25, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('MOF', 30, 30, { align: 'center' });
          generatePDFContent();
        };
        logoImg.src = '/logo512.png';
      } catch (error) {
        console.error('Error loading logo:', error);
        // Fallback to placeholder
        pdf.setFillColor(...primaryColor);
        pdf.rect(20, 15, 25, 25, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MOF', 30, 30, { align: 'center' });
        generatePDFContent();
      }

      const generatePDFContent = () => {

      // Company header
      pdf.setTextColor(...textColor);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(companyName, 50, 20);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(companyAddress, 50, 27);
      pdf.text(companyContact, 50, 32);

      // Report title with professional styling
      pdf.setFillColor(...lightGray);
      pdf.rect(20, 40, 170, 12, 'F');
      pdf.setTextColor(...primaryColor);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INVENTORY MANAGEMENT REPORT', 105, 49, { align: 'center' });

      // Report metadata
      pdf.setTextColor(...textColor);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Report Generated: ${reportDate} at ${reportTime}`, 20, 60);
      pdf.text(`Report ID: MOF-IM-${Date.now().toString().slice(-6)}`, 20, 65);

      let yPosition = 75;

      // Summary section with professional styling
      if (reportOptions.sections.summary) {
        pdf.setFillColor(...secondaryColor);
        pdf.rect(20, yPosition, 170, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INVENTORY SUMMARY', 25, yPosition + 6);
        yPosition += 15;

        const summaryData = [
          ['Metric', 'Current Value', 'Trend', 'Status'],
          ['Total Stock', dashboardData.totalStock.toString(), `${dashboardData.trends.totalStock}%`, 'Active'],
          ['Export Stock', dashboardData.exportStock.toString(), `${dashboardData.trends.exportStock}%`, 'Active'],
          ['Local Sales', dashboardData.localSales.toString(), `${dashboardData.trends.localSales}%`, 'Active'],
          ['Total Value', `$${dashboardData.totalValue}`, `${dashboardData.trends.totalValue}%`, 'Active']
        ];

        // Create professional table for summary
        pdf.autoTable({
          head: [summaryData[0]],
          body: summaryData.slice(1),
          startY: yPosition,
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

        yPosition = pdf.lastAutoTable.finalY + 15;
      }

      // Low stock alerts with professional styling
      if (reportOptions.sections.alerts && lowStockItems.length > 0) {
        pdf.setFillColor(...accentColor);
        pdf.rect(20, yPosition, 170, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('LOW STOCK ALERTS', 25, yPosition + 6);
        yPosition += 15;

        const alertData = lowStockItems.map(item => [
          item.name,
          item.category,
          `${item.current}/${item.threshold}`,
          'Critical'
        ]);

        pdf.autoTable({
          head: [['Item Name', 'Category', 'Current/Threshold', 'Status']],
          body: alertData,
          startY: yPosition,
          theme: 'grid',
          headStyles: {
            fillColor: [239, 68, 68], // Red for alerts
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
            fillColor: [254, 242, 242] // Light red
          },
          margin: { left: 20, right: 20 }
        });

        yPosition = pdf.lastAutoTable.finalY + 15;
      }

      // Stock distribution section
      if (reportOptions.includeCharts && reportOptions.sections.charts) {
        pdf.setFillColor(...secondaryColor);
        pdf.rect(20, yPosition, 170, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('STOCK DISTRIBUTION', 25, yPosition + 6);
        yPosition += 15;

        const distributionData = chartData.stockDistribution.map(item => [
          item.name,
          item.value.toString(),
          'Active'
        ]);

        pdf.autoTable({
          head: [['Category', 'Stock Units', 'Status']],
          body: distributionData,
          startY: yPosition,
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
      }

      // Professional footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Footer background
        pdf.setFillColor(...lightGray);
        pdf.rect(0, 280, 210, 20, 'F');
        
        // Footer content
        pdf.setTextColor(...textColor);
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${pageCount}`, 20, 288);
        pdf.text(`Generated on ${new Date().toLocaleString()}`, 105, 288, { align: 'center' });
        pdf.text(companyName, 190, 288, { align: 'right' });
        
        // Footer line
        pdf.setDrawColor(...primaryColor);
        pdf.setLineWidth(0.5);
        pdf.line(20, 290, 190, 290);
        
        // Disclaimer
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(7);
        pdf.text("This report is generated by Mount Olive Farm House Management System", 105, 295, { align: 'center' });
      }

        // Save PDF with professional naming
        const fileName = `MOF_Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        setSuccess("PDF report generated successfully!");
      };
    } catch (error) {
      setError("Failed to generate PDF report");
    } finally {
      setGeneratingReport(false);
      closeReportModal();
    }
  };

  const generateReport = () => {
    if (reportOptions.format === 'pdf') {
      generatePDFReport();
    } else {
      generateCSVReport();
      setSuccess("CSV report generated successfully!");
      closeReportModal();
    }
  };

  const sendEmailReport = () => {
    // Simulate email sending
    setGeneratingReport(true);
    setTimeout(() => {
      setSuccess("Report has been sent to your email!");
      setGeneratingReport(false);
      closeReportModal();
    }, 2000);
  };

  // Chart components
  const renderStockByCategoryChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData.stockByCategory}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
        <XAxis dataKey="category" stroke={COLORS.text} />
        <YAxis stroke={COLORS.text} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: COLORS.background,
            border: `1px solid ${COLORS.grid}`,
            borderRadius: '4px',
            padding: '8px',
            color: COLORS.text
          }}
        />
        <Legend />
        <Bar dataKey="weekly" fill={COLORS.primary} name="Weekly Stock" radius={[4, 4, 0, 0]} />
        <Bar dataKey="monthly" fill={COLORS.secondary} name="Monthly Stock" radius={[4, 4, 0, 0]} />
        <Bar dataKey="export" fill={COLORS.accent} name="Export Stock" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderStockDistributionChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData.stockDistribution}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          label={({ name, value }) => `${name}: ${value}`}
        >
          {chartData.stockDistribution.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: COLORS.background,
            border: `1px solid ${COLORS.grid}`,
            borderRadius: '4px',
            padding: '8px',
            color: COLORS.text
          }}
        />
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderMonthlyTrendChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData.monthlyTrend}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
        <XAxis dataKey="month" stroke={COLORS.text} />
        <YAxis stroke={COLORS.text} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: COLORS.background,
            border: `1px solid ${COLORS.grid}`,
            borderRadius: '4px',
            padding: '8px',
            color: COLORS.text
          }}
        />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="stock" 
          stroke={COLORS.primary} 
          fill={COLORS.primary}
          fillOpacity={0.3}
          name="Total Stock"
        />
        <Area 
          type="monotone" 
          dataKey="sales" 
          stroke={COLORS.secondary} 
          fill={COLORS.secondary}
          fillOpacity={0.3}
          name="Sales"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderValueTrendChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData.monthlyTrend}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
        <XAxis dataKey="month" stroke={COLORS.text} />
        <YAxis stroke={COLORS.text} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: COLORS.background,
            border: `1px solid ${COLORS.grid}`,
            borderRadius: '4px',
            padding: '8px',
            color: COLORS.text
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={COLORS.accent} 
          strokeWidth={3}
          dot={{ fill: COLORS.accent, strokeWidth: 2, r: 4 }}
          name="Total Value ($)"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const getTrendIcon = (value) => {
    return value > 0 ? <TrendingUp size={16} className="text-green-500" /> : <TrendingDown size={16} className="text-red-500" />;
  };

  const getTrendColor = (value) => {
    return value > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  };

  const formatActivityAction = (action) => {
    const actions = {
      'stock_added': 'Stock Added',
      'sold': 'Sold',
      'exported': 'Exported'
    };
    return actions[action] || action;
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="text-green-500" size={32} />
            Farm Overview
          </h1>
          <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Inventory summary and analytics for your farm management
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${darkMode ? "bg-green-900/30 text-green-200" : "bg-green-100 text-green-800"} shadow-sm`}>
            <Zap size={20} className="mr-3 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${darkMode ? "bg-red-900/30 text-red-200" : "bg-red-100 text-red-800"} shadow-sm`}>
            <AlertCircle size={20} className="mr-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Stock Card */}
          <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
            <div className={`p-3 rounded-full ${darkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
              <Package className="text-blue-500" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Total Stock</h3>
              <p className="text-2xl font-bold">{dashboardData.totalStock}</p>
              <div className={`flex items-center mt-2 text-sm ${getTrendColor(dashboardData.trends.totalStock)}`}>
                {getTrendIcon(dashboardData.trends.totalStock)}
                <span className="ml-1">
                  {Math.abs(dashboardData.trends.totalStock)}% {dashboardData.trends.totalStock > 0 ? "increase" : "decrease"} from last month
                </span>
              </div>
            </div>
          </div>

          {/* Export Stock Card */}
          <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
            <div className={`p-3 rounded-full ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}>
              <Globe className="text-green-500" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Export Stock</h3>
              <p className="text-2xl font-bold">{dashboardData.exportStock}</p>
              <div className={`flex items-center mt-2 text-sm ${getTrendColor(dashboardData.trends.exportStock)}`}>
                {getTrendIcon(dashboardData.trends.exportStock)}
                <span className="ml-1">
                  {Math.abs(dashboardData.trends.exportStock)}% {dashboardData.trends.exportStock > 0 ? "increase" : "decrease"} from last month
                </span>
              </div>
            </div>
          </div>

          {/* Local Sales Card */}
          <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
            <div className={`p-3 rounded-full ${darkMode ? "bg-purple-900/30" : "bg-purple-100"}`}>
              <ShoppingCart className="text-purple-500" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Local Sales</h3>
              <p className="text-2xl font-bold">{dashboardData.localSales}</p>
              <div className={`flex items-center mt-2 text-sm ${getTrendColor(dashboardData.trends.localSales)}`}>
                {getTrendIcon(dashboardData.trends.localSales)}
                <span className="ml-1">
                  {Math.abs(dashboardData.trends.localSales)}% {dashboardData.trends.localSales > 0 ? "increase" : "decrease"} from last month
                </span>
              </div>
            </div>
          </div>

          {/* Total Value Card */}
          <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
            <div className={`p-3 rounded-full ${darkMode ? "bg-amber-900/30" : "bg-amber-100"}`}>
              <DollarSign className="text-amber-500" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Total Value</h3>
              <p className="text-2xl font-bold">${dashboardData.totalValue.toLocaleString()}</p>
              <div className={`flex items-center mt-2 text-sm ${getTrendColor(dashboardData.trends.totalValue)}`}>
                {getTrendIcon(dashboardData.trends.totalValue)}
                <span className="ml-1">
                  {Math.abs(dashboardData.trends.totalValue)}% {dashboardData.trends.totalValue > 0 ? "increase" : "decrease"} from last month
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh Data
          </button>
          <button
            onClick={() => setShowChart(!showChart)}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <PieChartIcon size={16} />
            {showChart ? "Hide Charts" : "Show Charts"}
          </button>
          <button
            onClick={openReportModal}
            className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download size={16} />
            Generate Report
          </button>
        </div>

        {/* Charts Section */}
        {showChart && (
          <div className={`mb-8 rounded-xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center">
                  <BarChart3 className="mr-2" size={24} />
                  Inventory Analytics
                </h2>
                <div className="flex space-x-2">
                  {['stock', 'distribution', 'trend', 'value'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveChartTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeChartTab === tab
                          ? 'bg-green-600 text-white'
                          : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tab === 'stock' && 'Stock by Category'}
                      {tab === 'distribution' && 'Stock Distribution'}
                      {tab === 'trend' && 'Monthly Trend'}
                      {tab === 'value' && 'Value Trend'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {activeChartTab === 'stock' && renderStockByCategoryChart()}
              {activeChartTab === 'distribution' && renderStockDistributionChart()}
              {activeChartTab === 'trend' && renderMonthlyTrendChart()}
              {activeChartTab === 'value' && renderValueTrendChart()}
            </div>
          </div>
        )}

        {/* Additional Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Generate Report Card */}
          <div className={`p-6 rounded-xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"} flex flex-col justify-between`}>
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <FileText className="mr-2" size={20} />
                Report Generation
              </h3>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mb-4`}>
                Generate comprehensive inventory reports in PDF or CSV format with customizable options.
              </p>
            </div>
            <button
              onClick={openReportModal}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors w-full"
            >
              <Download size={16} />
              <span>Generate Custom Report</span>
            </button>
          </div>

          {/* Low Stock Alerts */}
          <div className={`p-6 rounded-xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${darkMode ? "bg-red-900/30" : "bg-red-100"}`}>
                  <AlertTriangle className={`text-red-500`} size={20} />
                </div>
                <h3 className="text-lg font-semibold">Low Stock Alerts</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-800"}`}>
                {lowStockItems.length} alerts
              </span>
            </div>
            <div className="space-y-3">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {item.name}
                    </span>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full ${
                          item.current < item.threshold * 0.3 ? 'bg-red-500' : 
                          item.current < item.threshold * 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((item.current / item.threshold) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ml-2 ${
                    item.current < item.threshold * 0.3 ? 'text-red-500' : 
                    item.current < item.threshold * 0.6 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {item.current}/{item.threshold}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`p-6 rounded-xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="mr-2" size={20} />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index}>
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <span className="font-medium">{formatActivityAction(activity.action)}:</span> {activity.quantity} of {activity.item}
                  </p>
                  <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={closeReportModal}
              />
             
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative z-50 w-full max-w-2xl p-6 rounded-lg shadow-xl ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
              >
                <button
                  onClick={closeReportModal}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X size={24} />
                </button>
               
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FileText className="mr-2" size={24} />
                  Generate Inventory Report
                </h2>
               
                <div className="space-y-6">
                  {/* Report Format */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Report Format</h3>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="pdf"
                          checked={reportOptions.format === 'pdf'}
                          onChange={(e) => updateReportOption('format', e.target.value)}
                          className="mr-2"
                        />
                        PDF Document
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="csv"
                          checked={reportOptions.format === 'csv'}
                          onChange={(e) => updateReportOption('format', e.target.value)}
                          className="mr-2"
                        />
                        CSV Spreadsheet
                      </label>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Date Range</h3>
                    <div className="flex gap-4">
                      {['week', 'month', 'quarter', 'year'].map((range) => (
                        <label key={range} className="flex items-center">
                          <input
                            type="radio"
                            value={range}
                            checked={reportOptions.dateRange === range}
                            onChange={(e) => updateReportOption('dateRange', e.target.value)}
                            className="mr-2"
                          />
                          {range.charAt(0).toUpperCase() + range.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Include Charts */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportOptions.includeCharts}
                        onChange={(e) => updateReportOption('includeCharts', e.target.checked)}
                        className="mr-2"
                      />
                      Include charts and graphs
                    </label>
                  </div>

                  {/* Report Sections */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Report Sections</h3>
                    <div className="space-y-2">
                      {Object.entries(reportOptions.sections).map(([section, enabled]) => (
                        <label key={section} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => updateSectionOption(section, e.target.checked)}
                            className="mr-2"
                          />
                          {section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1')}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
               
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={closeReportModal}
                    className={`px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendEmailReport}
                    disabled={generatingReport}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 disabled:opacity-50"
                  >
                    <Mail size={16} />
                    Send to Email
                  </button>
                  <button
                    onClick={generateReport}
                    disabled={generatingReport}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-50"
                  >
                    {generatingReport ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    Generate Report
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IDashboard;