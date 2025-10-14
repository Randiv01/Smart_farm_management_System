// IDashboard.jsx
import React, { useState, useEffect } from "react";
import { useITheme } from "../Icontexts/IThemeContext";
import { 
  TrendingUp, TrendingDown, Package, AlertTriangle, DollarSign, 
  BarChart3, Layers, RefreshCw, Zap, AlertCircle, Clock,
  Calendar, FileText, Plus, Eye, EyeOff, Download, PieChart as PieChartIcon, TrendingUp as TrendingUpIcon
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const IDashboard = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 1247,
    lowStockItems: 23,
    totalValue: 45680.50,
    categories: 8,
    trends: {
      totalProducts: 8,
      lowStockItems: -12,
      totalValue: 15,
      categories: 0
    }
  });

  const [loading, setLoading] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Sample data for charts and tables
  const [chartData, setChartData] = useState([
    { category: 'Vegetables', stock: 320, color: '#22c55e' },
    { category: 'Dairy', stock: 180, color: '#3b82f6' },
    { category: 'Meat', stock: 150, color: '#f97316' },
    { category: 'Grains', stock: 280, color: '#eab308' },
    { category: 'Fruits', stock: 220, color: '#a855f7' },
    { category: 'Spices', stock: 95, color: '#ef4444' }
  ]);

  // Pie chart data for inventory distribution
  const [pieChartData, setPieChartData] = useState([
    { name: 'Vegetables', value: 320, color: '#22c55e' },
    { name: 'Dairy', value: 180, color: '#3b82f6' },
    { name: 'Meat', value: 150, color: '#f97316' },
    { name: 'Grains', value: 280, color: '#eab308' },
    { name: 'Fruits', value: 220, color: '#a855f7' },
    { name: 'Spices', value: 95, color: '#ef4444' }
  ]);

  // Line chart data for inventory trends over time
  const [lineChartData, setLineChartData] = useState([
    { month: 'Jan', inventory: 1200, sales: 800, value: 25000 },
    { month: 'Feb', inventory: 1350, sales: 950, value: 28000 },
    { month: 'Mar', inventory: 1180, sales: 1100, value: 32000 },
    { month: 'Apr', inventory: 1420, sales: 1200, value: 35000 },
    { month: 'May', inventory: 1380, sales: 1050, value: 30000 },
    { month: 'Jun', inventory: 1247, sales: 980, value: 45680 }
  ]);

  const [recentProducts, setRecentProducts] = useState([
    { name: "Organic Tomatoes", category: "Vegetables", dateAdded: "2024-01-15", stockQty: 45 },
    { name: "Fresh Milk", category: "Dairy", dateAdded: "2024-01-14", stockQty: 32 },
    { name: "Chicken Breast", category: "Meat", dateAdded: "2024-01-14", stockQty: 28 },
    { name: "Brown Rice", category: "Grains", dateAdded: "2024-01-13", stockQty: 67 },
    { name: "Apples", category: "Fruits", dateAdded: "2024-01-13", stockQty: 52 },
    { name: "Black Pepper", category: "Spices", dateAdded: "2024-01-12", stockQty: 15 }
  ]);

  // Chart color schemes for dark/light mode
  const COLORS = {
    primary: darkMode ? '#86efac' : '#22c55e',
    secondary: darkMode ? '#107703ff' : '#02751eff',
    accent: darkMode ? '#1ef81eff' : '#4bf916ff',
    background: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#e5e7eb' : '#374151',
    grid: darkMode ? '#4b5563' : '#e5e7eb'
  };


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

  const getTrendIcon = (value) => {
    return value > 0 ? <TrendingUp size={16} className="text-green-500" /> : <TrendingDown size={16} className="text-red-500" />;
  };

  const getTrendColor = (value) => {
    return value > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  };

  // PDF generation function
  const generatePDFReport = async () => {
    setGeneratingPDF(true);
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

      // Add company logo
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
        pdf.text('INVENTORY MANAGEMENT DASHBOARD REPORT', 105, 49, { align: 'center' });

        // Report metadata
        pdf.setTextColor(...textColor);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Report Generated: ${reportDate} at ${reportTime}`, 20, 60);
        pdf.text(`Report ID: MOF-IM-${Date.now().toString().slice(-6)}`, 20, 65);

        let yPosition = 75;

        // Summary section with professional styling
        pdf.setFillColor(...secondaryColor);
        pdf.rect(20, yPosition, 170, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INVENTORY SUMMARY', 25, yPosition + 6);
        yPosition += 15;

        const summaryData = [
          ['Metric', 'Current Value', 'Trend', 'Status'],
          ['Total Products', dashboardData.totalProducts.toString(), `${dashboardData.trends.totalProducts}%`, 'Active'],
          ['Low Stock Items', dashboardData.lowStockItems.toString(), `${dashboardData.trends.lowStockItems}%`, 'Alert'],
          ['Total Value', `$${dashboardData.totalValue.toLocaleString()}`, `${dashboardData.trends.totalValue}%`, 'Active'],
          ['Categories', dashboardData.categories.toString(), `${dashboardData.trends.categories}%`, 'Stable']
        ];

        // Create professional table for summary
        const tableData = summaryData.slice(1);
        const cellWidth = 40;
        const cellHeight = 8;
        const startX = 20;
        let currentY = yPosition;

        // Draw table headers
        pdf.setFillColor(...primaryColor);
        pdf.rect(startX, currentY, cellWidth * 4, cellHeight, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        
        summaryData[0].forEach((header, index) => {
          pdf.text(header, startX + (index * cellWidth) + 2, currentY + 6);
        });

        currentY += cellHeight;

        // Draw table rows
        tableData.forEach((row, rowIndex) => {
          const fillColor = rowIndex % 2 === 0 ? [249, 250, 251] : [255, 255, 255];
          pdf.setFillColor(...fillColor);
          pdf.rect(startX, currentY, cellWidth * 4, cellHeight, 'F');
          
          pdf.setTextColor(...textColor);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          
          row.forEach((cell, cellIndex) => {
            pdf.text(cell, startX + (cellIndex * cellWidth) + 2, currentY + 6);
          });
          
          currentY += cellHeight;
        });

        yPosition = currentY + 10;

        // Chart data section
        pdf.setFillColor(...accentColor);
        pdf.rect(20, yPosition, 170, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('STOCK LEVELS BY CATEGORY', 25, yPosition + 6);
        yPosition += 15;

        const chartDataTable = chartData.map(item => [
          item.category,
          item.stock.toString(),
          'Active'
        ]);

        // Create chart data table manually
        const chartTableData = chartDataTable;
        let chartCurrentY = yPosition;

        // Draw chart table headers
        pdf.setFillColor(...primaryColor);
        pdf.rect(startX, chartCurrentY, cellWidth * 3, cellHeight, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        
        ['Category', 'Stock Level', 'Status'].forEach((header, index) => {
          pdf.text(header, startX + (index * cellWidth) + 2, chartCurrentY + 6);
        });

        chartCurrentY += cellHeight;

        // Draw chart table rows
        chartTableData.forEach((row, rowIndex) => {
          const fillColor = rowIndex % 2 === 0 ? [249, 250, 251] : [255, 255, 255];
          pdf.setFillColor(...fillColor);
          pdf.rect(startX, chartCurrentY, cellWidth * 3, cellHeight, 'F');
          
          pdf.setTextColor(...textColor);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          
          row.forEach((cell, cellIndex) => {
            pdf.text(cell, startX + (cellIndex * cellWidth) + 2, chartCurrentY + 6);
          });
          
          chartCurrentY += cellHeight;
        });

        yPosition = chartCurrentY + 10;

        // Recent products section
        pdf.setFillColor(...secondaryColor);
        pdf.rect(20, yPosition, 170, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('RECENTLY ADDED PRODUCTS', 25, yPosition + 6);
        yPosition += 15;

        const recentProductsTable = recentProducts.map(product => [
          product.name,
          product.category,
          product.dateAdded,
          product.stockQty.toString()
        ]);

        // Create recent products table manually
        const productsTableData = recentProductsTable;
        let productsCurrentY = yPosition;

        // Draw products table headers
        pdf.setFillColor(...primaryColor);
        pdf.rect(startX, productsCurrentY, cellWidth * 4, cellHeight, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        
        ['Product Name', 'Category', 'Date Added', 'Stock Qty'].forEach((header, index) => {
          pdf.text(header, startX + (index * cellWidth) + 2, productsCurrentY + 6);
        });

        productsCurrentY += cellHeight;

        // Draw products table rows
        productsTableData.forEach((row, rowIndex) => {
          const fillColor = rowIndex % 2 === 0 ? [249, 250, 251] : [255, 255, 255];
          pdf.setFillColor(...fillColor);
          pdf.rect(startX, productsCurrentY, cellWidth * 4, cellHeight, 'F');
          
          pdf.setTextColor(...textColor);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          
          row.forEach((cell, cellIndex) => {
            pdf.text(cell, startX + (cellIndex * cellWidth) + 2, productsCurrentY + 6);
          });
          
          productsCurrentY += cellHeight;
        });

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
        const fileName = `MOF_Inventory_Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        setSuccess("PDF report generated successfully!");
      };
    } catch (error) {
      setError("Failed to generate PDF report");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Chart components
  const renderStockByCategoryChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
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
        <Bar dataKey="stock" fill={COLORS.primary} name="Stock Level" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  // Pie chart for inventory distribution
  const renderInventoryDistributionChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={pieChartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {pieChartData.map((entry, index) => (
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

  // Line chart for inventory trends
  const renderInventoryTrendsChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={lineChartData}>
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
          dataKey="inventory" 
          stroke={COLORS.primary} 
          strokeWidth={3}
          dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
          name="Inventory Level"
        />
        <Line 
          type="monotone" 
          dataKey="sales" 
          stroke={COLORS.secondary} 
          strokeWidth={3}
          dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 4 }}
          name="Sales Volume"
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={COLORS.accent} 
          strokeWidth={3}
          dot={{ fill: COLORS.accent, strokeWidth: 2, r: 4 }}
          name="Value ($)"
        />
      </LineChart>
    </ResponsiveContainer>
  );

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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="text-green-500" size={32} />
            Inventory Dashboard
          </h1>
          <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Comprehensive inventory overview and analytics
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Products Card */}
          <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
            <div className={`p-3 rounded-full ${darkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
              <Package className="text-blue-500" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Total Products</h3>
              <p className="text-2xl font-bold">{dashboardData.totalProducts}</p>
              <div className={`flex items-center mt-2 text-sm ${getTrendColor(dashboardData.trends.totalProducts)}`}>
                {getTrendIcon(dashboardData.trends.totalProducts)}
                <span className="ml-1">
                  {Math.abs(dashboardData.trends.totalProducts)}% {dashboardData.trends.totalProducts > 0 ? "increase" : "decrease"} from last month
                </span>
              </div>
            </div>
          </div>

          {/* Low Stock Items Card */}
          <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
            <div className={`p-3 rounded-full ${darkMode ? "bg-red-900/30" : "bg-red-100"}`}>
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Low Stock Items</h3>
              <p className="text-2xl font-bold">{dashboardData.lowStockItems}</p>
              <div className={`flex items-center mt-2 text-sm ${getTrendColor(dashboardData.trends.lowStockItems)}`}>
                {getTrendIcon(dashboardData.trends.lowStockItems)}
                <span className="ml-1">
                  {Math.abs(dashboardData.trends.lowStockItems)}% {dashboardData.trends.lowStockItems > 0 ? "increase" : "decrease"} from last month
                </span>
              </div>
            </div>
          </div>

          {/* Total Value Card */}
          <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
            <div className={`p-3 rounded-full ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}>
              <DollarSign className="text-green-500" size={24} />
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

          {/* Categories Card */}
          <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
            <div className={`p-3 rounded-full ${darkMode ? "bg-purple-900/30" : "bg-purple-100"}`}>
              <Layers className="text-purple-500" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Categories</h3>
              <p className="text-2xl font-bold">{dashboardData.categories}</p>
              <div className={`flex items-center mt-2 text-sm ${getTrendColor(dashboardData.trends.categories)}`}>
                {getTrendIcon(dashboardData.trends.categories)}
                <span className="ml-1">
                  {Math.abs(dashboardData.trends.categories)}% {dashboardData.trends.categories > 0 ? "increase" : "decrease"} from last month
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
            {showChart ? <EyeOff size={16} /> : <Eye size={16} />}
            {showChart ? "Hide Charts" : "Show Charts"}
          </button>
          <button
            onClick={generatePDFReport}
            disabled={generatingPDF}
            className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            <Download size={16} className={generatingPDF ? "animate-pulse" : ""} />
            {generatingPDF ? "Generating PDF..." : "Download Report"}
          </button>
        </div>

        {/* Charts & Data Section */}
        {showChart && (
          <div className="space-y-6 mb-8">
            {/* First Row - Bar Chart and Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className={`rounded-xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold flex items-center">
                    <BarChart3 className="mr-2" size={24} />
                    Stock Levels by Category
                  </h2>
                </div>
                <div className="p-6">
                  {renderStockByCategoryChart()}
                </div>
              </div>

              {/* Pie Chart */}
              <div className={`rounded-xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold flex items-center">
                    <PieChartIcon className="mr-2" size={24} />
                    Inventory Distribution
                  </h2>
                </div>
                <div className="p-6">
                  {renderInventoryDistributionChart()}
                </div>
              </div>
            </div>

            {/* Second Row - Line Chart and Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Chart */}
              <div className={`rounded-xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold flex items-center">
                    <TrendingUpIcon className="mr-2" size={24} />
                    Inventory Trends
                  </h2>
                </div>
                <div className="p-6">
                  {renderInventoryTrendsChart()}
                </div>
              </div>

              {/* Recently Added Products Table */}
              <div className={`rounded-xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Clock className="mr-2" size={24} />
                    Recently Added Products
                  </h2>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                          <th className={`text-left py-3 px-2 font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            Product Name
                          </th>
                          <th className={`text-left py-3 px-2 font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            Category
                          </th>
                          <th className={`text-left py-3 px-2 font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            Date Added
                          </th>
                          <th className={`text-left py-3 px-2 font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            Stock Qty
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentProducts.map((product, index) => (
                          <tr key={index} className={`border-b ${darkMode ? "border-gray-700" : "border-gray-200"} hover:${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                            <td className={`py-3 px-2 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                              {product.name}
                            </td>
                            <td className={`py-3 px-2 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                              {product.category}
                            </td>
                            <td className={`py-3 px-2 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                              {product.dateAdded}
                            </td>
                            <td className={`py-3 px-2 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                              {product.stockQty}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default IDashboard;