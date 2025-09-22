import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  RefreshCw,
  AlertCircle,
  Minus,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Info,
  Calendar,
  Package,
  Zap,
  Clock,
  Mail,
  MessageSquare
} from "lucide-react";
import { useITheme } from "../Icontexts/IThemeContext";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const FertilizerStock = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  const [fertilizers, setFertilizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [fertilizerTypeFilter, setFertilizerTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRefillForm, setShowRefillForm] = useState(false);
  const [showUseForm, setShowUseForm] = useState(false);
  const [editingFertilizer, setEditingFertilizer] = useState(null);
  const [refillingFertilizer, setRefillingFertilizer] = useState(null);
  const [usingFertilizer, setUsingFertilizer] = useState(null);
  const [selectedFertilizerForChart, setSelectedFertilizerForChart] = useState(null);
  const [refillQuantity, setRefillQuantity] = useState("");
  const [useQuantity, setUseQuantity] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    remaining: "",
    unit: "kg",
    fertilizerType: "Organic",
    shelfLife: "365"
  });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Clear success messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch fertilizers
  useEffect(() => {
    fetchFertilizers();
  }, []);

  // Set initial chart selection
  useEffect(() => {
    if (selectedFertilizerForChart === null && fertilizers.length > 0) {
      setSelectedFertilizerForChart('all');
    }
  }, [fertilizers]);

  // Calculate expiry date based on shelf life
  const calculateExpiryDate = (shelfLifeMonths) => {
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(shelfLifeMonths));
    return expiryDate.toISOString().split('T')[0];
  };

  // Calculate days until expiry
  const calculateDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const differenceMs = expiry - today;
    return Math.floor(differenceMs / (1000 * 60 * 60 * 24));
  };

  // Get days left text and class
  const getDaysLeftText = (days) => {
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return 'Expires today';
    return `${days} day${days > 1 ? 's' : ''} left`;
  };

  const getDaysLeftClass = (days) => {
    if (days < 0) return "text-red-600 dark:text-red-400";
    if (days <= 7) return "text-orange-600 dark:text-orange-400";
    if (days <= 30) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  // Get stock level class
  const getStockLevelClass = (remaining, quantity) => {
    const percentage = (remaining / quantity) * 100;
    if (percentage <= 10) return "text-red-600 dark:text-red-400";
    if (percentage <= 30) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
  };

  // Get stock level badge
  const getStockLevelBadge = (remaining, quantity) => {
    const percentage = (remaining / quantity) * 100;
    if (percentage <= 10) return { text: "Critical", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" };
    if (percentage <= 30) return { text: "Low", class: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" };
    return { text: "Good", class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
  };

  // Fetch fertilizers from API
  const fetchFertilizers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/Ifertilizerstock");
      setFertilizers(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching fertilizers:", error);
      setError("Failed to load fertilizers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort fertilizers
  const filteredAndSortedFertilizers = () => {
    let filtered = fertilizers.filter(fertilizer =>
      (fertilizer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fertilizer.fertilizerType.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (fertilizerTypeFilter === "All Types" || fertilizer.fertilizerType === fertilizerTypeFilter)
    );

    // Apply tab filters
    if (activeTab !== "all") {
      filtered = filtered.filter(fertilizer => {
        const days = calculateDaysUntilExpiry(fertilizer.expiryDate);
        const percentage = (fertilizer.remaining / fertilizer.quantity) * 100;
      
        if (activeTab === 'expired') return days < 0;
        if (activeTab === 'expiringSoon') return days >= 0 && days <= 30;
        if (activeTab === 'lowStock') return percentage <= 30;
        if (activeTab === 'criticalStock') return percentage <= 10;
        return true;
      });
    }

    // Apply additional status filters
    if (statusFilter) {
      filtered = filtered.filter(fertilizer => {
        const days = calculateDaysUntilExpiry(fertilizer.expiryDate);
        const percentage = (fertilizer.remaining / fertilizer.quantity) * 100;
        if (statusFilter === 'expired') return days < 0;
        if (statusFilter === 'expiringSoon') return days >= 0 && days <= 30;
        if (statusFilter === 'lowStock') return percentage <= 30;
        if (statusFilter === 'criticalStock') return percentage <= 10;
        return true;
      });
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = sortConfig.key === 'expiryDate' ? new Date(a.expiryDate) :
                    sortConfig.key === 'remainingPercentage' ? (a.remaining / a.quantity) :
                    a[sortConfig.key];
        let bValue = sortConfig.key === 'expiryDate' ? new Date(b.expiryDate) :
                    sortConfig.key === 'remainingPercentage' ? (b.remaining / b.quantity) :
                    b[sortConfig.key];
      
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  };

  const filteredFertilizers = filteredAndSortedFertilizers();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (fertilizer) => {
    setEditingFertilizer(fertilizer);
    setFormData({
      name: fertilizer.name,
      quantity: fertilizer.quantity,
      remaining: fertilizer.remaining,
      unit: fertilizer.unit,
      fertilizerType: fertilizer.fertilizerType,
      shelfLife: "365"
    });
    setShowAddForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const expiryDate = calculateExpiryDate(formData.shelfLife);
      const payload = {
        ...formData,
        expiryDate
      };
      if (editingFertilizer) {
        await axios.put(`http://localhost:5000/api/Ifertilizerstock/${editingFertilizer._id}`, payload);
        setSuccess("Fertilizer updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/Ifertilizerstock", payload);
        setSuccess("Fertilizer added successfully!");
      }
    
      setShowAddForm(false);
      setEditingFertilizer(null);
      resetForm();
      fetchFertilizers();
    } catch (error) {
      console.error("Error saving fertilizer:", error);
      setError("Failed to save fertilizer. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      quantity: "",
      remaining: "",
      unit: "kg",
      fertilizerType: "Organic",
      shelfLife: "365"
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this fertilizer?")) {
      return;
    }
  
    try {
      await axios.delete(`http://localhost:5000/api/Ifertilizerstock/${id}`);
      setSuccess("Fertilizer deleted successfully!");
      fetchFertilizers();
    } catch (error) {
      console.error("Error deleting fertilizer:", error);
      setError("Failed to delete fertilizer. Please try again.");
    }
  };

  const handleRefill = (fertilizer) => {
    setRefillingFertilizer(fertilizer);
    setRefillQuantity("");
    setShowRefillForm(true);
  };

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
  
    if (parseInt(refillQuantity) <= 0 || parseInt(refillQuantity) > (refillingFertilizer.quantity - refillingFertilizer.remaining)) {
      setError("Invalid refill quantity.");
      return;
    }
    try {
      await axios.patch(`http://localhost:5000/api/Ifertilizerstock/refill/${refillingFertilizer._id}`, {
        refillQuantity: parseInt(refillQuantity)
      });
    
      setShowRefillForm(false);
      setRefillingFertilizer(null);
      setRefillQuantity("");
      setSuccess("Stock refilled successfully!");
      fetchFertilizers();
    } catch (error) {
      console.error("Error refilling fertilizer:", error);
      setError("Failed to refill fertilizer. Please try again.");
    }
  };

  const handleUse = (fertilizer) => {
    setUsingFertilizer(fertilizer);
    setUseQuantity("");
    setShowUseForm(true);
  };

  const handleUseSubmit = async (e) => {
    e.preventDefault();
  
    if (parseInt(useQuantity) <= 0 || parseInt(useQuantity) > usingFertilizer.remaining) {
      setError("Invalid use quantity.");
      return;
    }
    try {
      await axios.patch(`http://localhost:5000/api/Ifertilizerstock/use/${usingFertilizer._id}`, {
        quantityUsed: parseInt(useQuantity),
        recordedBy: "User"
      });
    
      setShowUseForm(false);
      setUsingFertilizer(null);
      setUseQuantity("");
      setSuccess("Usage recorded successfully!");
      fetchFertilizers();
    } catch (error) {
      console.error("Error recording usage:", error);
      setError("Failed to record usage. Please try again.");
    }
  };

  const handleChartFertilizerChange = (e) => {
    const value = e.target.value;
    if (value === 'all') {
      setSelectedFertilizerForChart('all');
    } else {
      const fertilizer = fertilizers.find(f => f._id === value);
      setSelectedFertilizerForChart(fertilizer);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline ml-1" /> : <ChevronDown size={16} className="inline ml-1" />;
  };

  // Compute chart data for stock levels
  const chartData = (() => {
    if (selectedFertilizerForChart === 'all') {
      return {
        labels: fertilizers.map(f => f.name),
        datasets: [
          {
            label: 'Remaining Stock',
            data: fertilizers.map(f => f.remaining),
            backgroundColor: 'rgba(75, 192, 128, 0.6)',
            borderColor: 'rgba(78, 184, 113, 1)',
            borderWidth: 0
          }
        ]
      };
    } else if (selectedFertilizerForChart) {
      const { quantity, remaining } = selectedFertilizerForChart;
      const used = quantity - remaining;
      return {
        labels: ['Total Stock', 'Remaining', 'Used'],
        datasets: [
          {
            label: 'Stock Level',
            data: [quantity, remaining, used],
            backgroundColor: [
              'rgba(54, 162, 235, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(255, 99, 132, 0.6)'
            ],
            borderColor: [
              'rgba(54, 162, 235, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 1
          }
        ]
      };
    }
    return { labels: [], datasets: [] };
  })();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#e5e7eb' : '#1f2937'
        }
      },
      title: {
        display: true,
        color: darkMode ? '#e5e7eb' : '#1f2937',
        font: { size: 17 },
        text: selectedFertilizerForChart === 'all'
          ? 'Stock Levels for All Fertilizers'
          : `Stock Breakdown for ${selectedFertilizerForChart?.name || 'Selected Fertilizer'}`
      },
      tooltip: {
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        titleColor: darkMode ? '#e5e7eb' : '#1f2937',
        bodyColor: darkMode ? '#e5e7eb' : '#1f2937'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantity',
          color: darkMode ? '#e5e7eb' : '#1f2937'
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: darkMode ? '#e5e7eb' : '#1f2937'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Fertilizer',
          color: darkMode ? '#e5e7eb' : '#1f2937'
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: darkMode ? '#e5e7eb' : '#1f2937'
        }
      }
    }
  };

  const exportToPDF = () => {
    try {
      if (filteredFertilizers.length === 0) {
        setError("No data available to export to PDF.");
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Adding title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Fertilizer Stock Report', 14, 20);

      // Adding metadata
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.text(`Total Items: ${filteredFertilizers.length}`, 14, 34);

      // Define table headers
      const headers = [['Name', 'Quantity', 'Remaining', 'Unit', 'Type', 'Expiry Date', 'Status']];

      // Prepare table data
      const data = filteredFertilizers.map(fertilizer => {
        const days = calculateDaysUntilExpiry(fertilizer.expiryDate);
        return [
          String(fertilizer.name || 'N/A'),
          String(fertilizer.quantity || 0),
          String(fertilizer.remaining || 0),
          String(fertilizer.unit || 'N/A'),
          String(fertilizer.fertilizerType || 'N/A'),
          fertilizer.expiryDate ? new Date(fertilizer.expiryDate).toLocaleDateString() : 'N/A',
          String(getDaysLeftText(days))
        ];
      });

      // Generate table using the functional API
      autoTable(doc, {
        head: headers,
        body: data,
        startY: 40,
        theme: 'striped',
        headStyles: {
          fillColor: darkMode ? [55, 65, 81] : [200, 200, 200],
          textColor: darkMode ? [229, 231, 235] : [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: darkMode ? [229, 231, 235] : [0, 0, 0],
          fillColor: darkMode ? [31, 41, 55] : [255, 255, 255]
        },
        alternateRowStyles: {
          fillColor: darkMode ? [40, 50, 65] : [240, 240, 240]
        },
        columnStyles: {
          0: { cellWidth: 40 }, // Name
          1: { cellWidth: 25 }, // Quantity
          2: { cellWidth: 25 }, // Remaining
          3: { cellWidth: 20 }, // Unit
          4: { cellWidth: 30 }, // Type
          5: { cellWidth: 25 }, // Expiry Date
          6: { cellWidth: 35 }  // Status
        },
        margin: { top: 40, left: 14, right: 14 },
        styles: {
          cellPadding: 2,
          halign: 'left',
          valign: 'middle',
          overflow: 'linebreak'
        },
        didParseCell: (data) => {
          if (data.cell.text && data.cell.text[0] === undefined) {
            data.cell.text = ['N/A'];
          }
        }
      });

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
      }

      // Save the PDF
      doc.save(`fertilizer_stock_report_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF. Please check the console for details and try again.");
    }
  };

  // Handle sending email
  const handleSendEmail = (fertilizer) => {
    try {
      const email = 'recipient@example.com';
      const subject = `Low Stock Alert: ${fertilizer.name}`;
      const body = `The stock for ${fertilizer.name} is running low. Current stock: ${fertilizer.remaining} ${fertilizer.unit}. Please consider refilling.`;
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
      window.location.href = mailtoLink;
    
      setSuccess(`Opening email client for ${fertilizer.name}...`);
    } catch (error) {
      console.error("Error opening email:", error);
      setError("Failed to open email client. Please try again.");
    }
  };

  // Handle sending WhatsApp message
  const handleSendWhatsApp = (fertilizer) => {
    try {
      const phone = '1234567890';
      const message = `Low Stock Alert: ${fertilizer.name} has ${fertilizer.remaining} ${fertilizer.unit} remaining. Please consider refilling.`;
      const whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
      window.open(whatsappLink, '_blank');
    
      setSuccess(`Opening WhatsApp for ${fertilizer.name}...`);
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      setError("Failed to open WhatsApp. Please try again.");
    }
  };

  // Calculate summary stats
  const getSummary = () => {
    const totalFertilizers = fertilizers.length;
    const lowStock = fertilizers.filter(fertilizer => (fertilizer.remaining / fertilizer.quantity) * 100 <= 30).length;
    const criticalStock = fertilizers.filter(fertilizer => (fertilizer.remaining / fertilizer.quantity) * 100 <= 10).length;
    const expiringSoon = fertilizers.filter(fertilizer => {
      const days = calculateDaysUntilExpiry(fertilizer.expiryDate);
      return days >= 0 && days <= 30;
    }).length;
    const expired = fertilizers.filter(fertilizer => {
      const days = calculateDaysUntilExpiry(fertilizer.expiryDate);
      return days < 0;
    }).length;
    return { totalFertilizers, lowStock, criticalStock, expiringSoon, expired };
  };

  const summary = getSummary();

  if (loading) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading fertilizers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Package className="text-green-500" size={32} />
          Fertilizer Stock
        </h1>
        <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Efficiently manage fertilizer inventory, track usage, and monitor stock levels
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
      {/* Chart Section */}
      <div className={`p-6 rounded-xl shadow-lg mb-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Stock Level Chart
          </h2>
          <select
            value={selectedFertilizerForChart?._id || selectedFertilizerForChart || ''}
            onChange={handleChartFertilizerChange}
            className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
          >
            <option value="" disabled>Select a fertilizer</option>
            <option value="all">All Fertilizers</option>
            {fertilizers.map(fertilizer => (
              <option key={fertilizer._id} value={fertilizer._id}>
                {fertilizer.name}
              </option>
            ))}
          </select>
        </div>
        <div className="h-[400px]">
          {chartData.labels.length > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Package size={48} className="text-gray-400 mb-4" />
              <p className={darkMode ? "text-gray-400" : "text-gray-500"}>No stock data available yet.</p>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Select a fertilizer to see stock levels here.</p>
            </div>
          )}
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`${darkMode ? "bg-blue-900/30" : "bg-blue-100"} p-3 rounded-full`}>
            <Package className="text-blue-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Total Fertilizers</h3>
            <p className="text-2xl font-bold">{summary.totalFertilizers}</p>
          </div>
        </div>
      
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`${darkMode ? "bg-orange-900/30" : "bg-orange-100"} p-3 rounded-full`}>
            <AlertCircle className="text-orange-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Low Stock</h3>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.lowStock}</p>
          </div>
        </div>
      
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`${darkMode ? "bg-red-900/30" : "bg-red-100"} p-3 rounded-full`}>
            <AlertCircle className="text-red-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Critical Stock</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.criticalStock}</p>
          </div>
        </div>
      
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`${darkMode ? "bg-yellow-900/30" : "bg-yellow-100"} p-3 rounded-full`}>
            <Clock className="text-yellow-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Expiring Soon</h3>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.expiringSoon}</p>
          </div>
        </div>
      
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`${darkMode ? "bg-red-900/30" : "bg-red-100"} p-3 rounded-full`}>
            <Calendar className="text-red-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Expired</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.expired}</p>
          </div>
        </div>
      </div>
      {/* Quick Action Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === "all"
            ? "bg-green-600 text-white"
            : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          All Items
        </button>
        <button
          onClick={() => setActiveTab("lowStock")}
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === "lowStock"
            ? "bg-orange-600 text-white"
            : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Low Stock
        </button>
        <button
          onClick={() => setActiveTab("criticalStock")}
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === "criticalStock"
            ? "bg-red-600 text-white"
            : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Critical Stock
        </button>
        <button
          onClick={() => setActiveTab("expiringSoon")}
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === "expiringSoon"
            ? "bg-yellow-600 text-white"
            : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Expiring Soon
        </button>
        <button
          onClick={() => setActiveTab("expired")}
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === "expired"
            ? "bg-red-600 text-white"
            : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Expired
        </button>
      </div>
      {/* Search and Filters */}
      <div className={`p-6 rounded-xl shadow-lg mb-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search
                size={20}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="text"
                placeholder="Search by name or type..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`mt-3 flex items-center gap-2 text-sm ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"} transition-colors`}
            >
              <Filter size={16} />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Fertilizer Type</label>
                  <select
                    value={fertilizerTypeFilter}
                    onChange={(e) => setFertilizerTypeFilter(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  >
                    <option value="All Types">All Types</option>
                    <option value="Organic">Organic</option>
                    <option value="Inorganic">Inorganic</option>
                    <option value="Liquid">Liquid</option>
                    <option value="Granular">Granular</option>
                    <option value="Powder">Powder</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  >
                    <option value="">All Statuses</option>
                    <option value="expired">Expired</option>
                    <option value="expiringSoon">Expiring Soon (≤30 days)</option>
                    <option value="lowStock">Low Stock (≤30%)</option>
                    <option value="criticalStock">Critical Stock (≤10%)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        
          <div className="flex items-center gap-3">
            <button
              onClick={fetchFertilizers}
              className={`p-2.5 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all`}
              title="Refresh Data"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={exportToPDF}
              className={`p-2.5 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all`}
              title="Download as PDF"
            >
              <Download size={20} />
            </button>
            <button
              onClick={() => {
                setEditingFertilizer(null);
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={16} />
              Add Fertilizer
            </button>
          </div>
        </div>
      </div>
      {/* Results Count */}
      <div className={`mb-4 flex justify-between items-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        <p className="text-sm">
          Showing {filteredFertilizers.length} of {fertilizers.length} items
        </p>
        {filteredFertilizers.length === 0 && (
          <button
            onClick={() => {
              setSearchTerm("");
              setFertilizerTypeFilter("All Types");
              setStatusFilter("");
              setActiveTab("all");
            }}
            className="text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>
      {/* Table View */}
      <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    Fertilizer Name {getSortIcon('name')}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('quantity')}
                >
                  <div className="flex items-center">
                    Quantity {getSortIcon('quantity')}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('remainingPercentage')}
                >
                  <div className="flex items-center">
                    Remaining {getSortIcon('remainingPercentage')}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Type
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('expiryDate')}
                >
                  <div className="flex items-center">
                    Expiry Date {getSortIcon('expiryDate')}
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
              {filteredFertilizers.length > 0 ? (
                filteredFertilizers.map((fertilizer) => {
                  const daysLeft = calculateDaysUntilExpiry(fertilizer.expiryDate);
                  const remainingPercentage = (fertilizer.remaining / fertilizer.quantity) * 100;
                  const stockLevelBadge = getStockLevelBadge(fertilizer.remaining, fertilizer.quantity);
                  const rowBg = remainingPercentage <= 10 ? (darkMode ? 'bg-red-900/10' : 'bg-red-50/50') :
                                remainingPercentage <= 30 ? (darkMode ? 'bg-orange-900/10' : 'bg-orange-50/50') :
                                daysLeft < 0 ? (darkMode ? 'bg-red-900/10' : 'bg-red-50/50') :
                                daysLeft <= 30 ? (darkMode ? 'bg-yellow-900/10' : 'bg-yellow-50/50') : '';
                  return (
                    <tr key={fertilizer._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-all ${rowBg}`}>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center">
                          <Package size={16} className="mr-2 text-gray-400" />
                          {fertilizer.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span>{fertilizer.quantity} {fertilizer.unit}</span>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${
                                remainingPercentage <= 10 ? 'bg-red-500' :
                                remainingPercentage <= 30 ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${remainingPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${getStockLevelClass(fertilizer.remaining, fertilizer.quantity)}`}>
                          {fertilizer.remaining} {fertilizer.unit}
                          <span className="text-xs ml-1">({remainingPercentage.toFixed(0)}%)</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${stockLevelBadge.class}`}>
                          {stockLevelBadge.text}
                        </span>
                        <div className="text-xs mt-1">
                          <span className={getDaysLeftClass(daysLeft)}>
                            {getDaysLeftText(daysLeft)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${darkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                          {fertilizer.fertilizerType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(fertilizer.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button
                            onClick={() => handleRefill(fertilizer)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-600 hover:bg-gray-100"}`}
                            title="Refill Stock"
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            onClick={() => handleUse(fertilizer)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-orange-400 hover:bg-gray-700" : "text-orange-600 hover:bg-gray-100"}`}
                            title="Record Usage"
                          >
                            <Minus size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(fertilizer)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-indigo-400 hover:bg-gray-700" : "text-indigo-600 hover:bg-gray-100"}`}
                            title="Edit Fertilizer"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(fertilizer._id)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"}`}
                            title="Delete Fertilizer"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button
                            onClick={() => handleSendEmail(fertilizer)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-gray-100"}`}
                            title="Send Email Notification"
                          >
                            <Mail size={18} />
                          </button>
                          <button
                            onClick={() => handleSendWhatsApp(fertilizer)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-green-400 hover:bg-gray-700" : "text-green-600 hover:bg-gray-100"}`}
                            title="Send WhatsApp Notification"
                          >
                            <MessageSquare size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package size={48} className="text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No fertilizers found</h3>
                      <p className={`text-sm max-w-md mx-auto ${darkMode ? "text-gray-400" : "text-gray-500"} mb-4`}>
                        Try adjusting your search or filter criteria, or add a new fertilizer item.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setFertilizerTypeFilter("All Types");
                          setStatusFilter("");
                          setActiveTab("all");
                        }}
                        className="text-green-600 dark:text-green-400 hover:underline text-sm"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Add/Edit Fertilizer Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {editingFertilizer ? <Edit size={24} /> : <Plus size={24} />}
                {editingFertilizer ? "Edit Fertilizer" : "Add New Fertilizer"}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingFertilizer(null);
                }}
                className={`p-2 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition-all`}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Fertilizer Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  required
                  placeholder="Enter fertilizer name"
                />
              </div>
            
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Total Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                    required
                    min="1"
                    placeholder="Total quantity"
                  />
                </div>
              
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    name="remaining"
                    value={formData.remaining}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                    required
                    min="0"
                    max={formData.quantity || Infinity}
                    placeholder="Initial stock"
                  />
                  {formData.quantity && (
                    <p className={`text-xs mt-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Max: {formData.quantity}
                    </p>
                  )}
                </div>
              </div>
            
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Unit *
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                    <option value="bag">bag</option>
                    <option value="sack">sack</option>
                    <option value="liter">liter</option>
                  </select>
                </div>
              
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Fertilizer Type *
                  </label>
                  <select
                    name="fertilizerType"
                    value={formData.fertilizerType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  >
                    <option value="Organic">Organic</option>
                    <option value="Inorganic">Inorganic</option>
                    <option value="Liquid">Liquid</option>
                    <option value="Granular">Granular</option>
                    <option value="Powder">Powder</option>
                  </select>
                </div>
              </div>
            
              <div className="mb-5">
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Shelf Life *
                </label>
                <select
                  name="shelfLife"
                  value={formData.shelfLife}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  required
                >
                  <option value="90">3 months</option>
                  <option value="180">6 months</option>
                  <option value="365">1 year</option>
                  <option value="730">2 years</option>
                  <option value="1095">3 years</option>
                </select>
                <p className={`text-xs mt-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"} flex items-center gap-1`}>
                  <Info size={12} />
                  Expiry date will be calculated automatically from today.
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingFertilizer(null);
                  }}
                  className={`px-4 py-2.5 rounded-lg ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"} transition-all`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  {editingFertilizer ? "Update Fertilizer" : "Add Fertilizer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Refill Modal */}
      {showRefillForm && refillingFertilizer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-lg w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Plus size={24} />
                Refill {refillingFertilizer.name}
              </h2>
              <button
                onClick={() => {
                  setShowRefillForm(false);
                  setRefillingFertilizer(null);
                }}
                className={`p-2 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition-all`}
              >
                <X size={20} />
              </button>
            </div>
          
            <form onSubmit={handleRefillSubmit}>
              <div className="mb-5">
                <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} mb-4`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Current Stock</p>
                      <p className="font-semibold">{refillingFertilizer.remaining} {refillingFertilizer.unit}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Maximum Capacity</p>
                      <p className="font-semibold">{refillingFertilizer.quantity} {refillingFertilizer.unit}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2.5 dark:bg-gray-600 mt-3">
                    <div
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{ width: `${(refillingFertilizer.remaining / refillingFertilizer.quantity) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            
              <div className="mb-5">
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Refill Quantity *
                </label>
                <input
                  type="number"
                  value={refillQuantity}
                  onChange={(e) => setRefillQuantity(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  required
                  min="1"
                  max={refillingFertilizer.quantity - refillingFertilizer.remaining}
                  placeholder="Enter quantity to add"
                />
                <p className={`text-xs mt-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Maximum you can add: {refillingFertilizer.quantity - refillingFertilizer.remaining} {refillingFertilizer.unit}
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefillForm(false);
                    setRefillingFertilizer(null);
                  }}
                  className={`px-4 py-2.5 rounded-lg ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"} transition-all`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                >
                  Refill Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Use Modal */}
      {showUseForm && usingFertilizer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-lg w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Minus size={24} />
                Record Usage for {usingFertilizer.name}
              </h2>
              <button
                onClick={() => {
                  setShowUseForm(false);
                  setUsingFertilizer(null);
                }}
                className={`p-2 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition-all`}
              >
                <X size={20} />
              </button>
            </div>
          
            <form onSubmit={handleUseSubmit}>
              <div className="mb-5">
                <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} mb-4`}>
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Available Stock</p>
                  <p className="font-semibold text-2xl">{usingFertilizer.remaining} {usingFertilizer.unit}</p>
                </div>
              </div>
            
              <div className="mb-5">
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Quantity Used *
                </label>
                <input
                  type="number"
                  value={useQuantity}
                  onChange={(e) => setUseQuantity(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  required
                  min="1"
                  max={usingFertilizer.remaining}
                  placeholder="Enter quantity used"
                />
                <p className={`text-xs mt-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Maximum you can use: {usingFertilizer.remaining} {usingFertilizer.unit}
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowUseForm(false);
                    setUsingFertilizer(null);
                  }}
                  className={`px-4 py-2.5 rounded-lg ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"} transition-all`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                >
                  Record Usage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FertilizerStock;