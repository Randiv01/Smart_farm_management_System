import React, { useState, useEffect } from "react";
import { 
  Search, 
  RefreshCw,
  AlertCircle,
  Filter,
  Package,
  Bell,
  BarChart3,
  Plus,
  ChevronDown,
  ChevronUp,
  Download,
  TrendingUp,
  X,
  Mail,
  MessageSquare,
  PieChart,
  Info
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useLoader } from "../contexts/LoaderContext";
import { Pie, Line } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title 
} from "chart.js";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

export default function FeedStocksAnimalManager() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading } = useLoader();

  const [animalFoods, setAnimalFoods] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [targetAnimalFilter, setTargetAnimalFilter] = useState("All Animals");
  const [statusFilter, setStatusFilter] = useState("");
  const [showChart, setShowChart] = useState(false);
  const [refillModal, setRefillModal] = useState({ open: false, food: null, quantity: "" });
  const [mobileNumber, setMobileNumber] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [stockData, setStockData] = useState([]);
  const [showStockChart, setShowStockChart] = useState(false);
  const [selectedFoodForChart, setSelectedFoodForChart] = useState(null);

  useEffect(() => {
    document.title = "Feed Stocks - Animal Manager";
    fetchAnimalFoods();
  }, []);

  const fetchAnimalFoods = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/animalfood");
      const data = await response.json();
      setAnimalFoods(data || []);
    } catch (error) {
      showMessage("❌ Failed to load animal foods", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStockData = async (foodId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/animalfood/stock/${foodId}`);
      const data = await response.json();
      setStockData(data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      showMessage("Failed to load stock data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type }), 3000);
  };

  const handleRefillRequest = async () => {
    if (!refillModal.quantity || Number(refillModal.quantity) <= 0) {
      return showMessage("❌ Enter valid quantity", "error");
    }
    
    try {
      setLoading(true);
      // Send refill request to inventory manager
      const res = await fetch("http://localhost:5000/api/refill-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodId: refillModal.food._id,
          foodName: refillModal.food.name,
          quantity: refillModal.quantity,
          requestedBy: "Animal Manager",
          mobileNumber: mobileNumber,
          timestamp: new Date().toISOString()
        }),
      });
      
      if (!res.ok) throw new Error("Failed to send refill request");
      
      showMessage("✅ Refill request sent to inventory manager!", "success");
      setRefillModal({ open: false, food: null, quantity: "" });
      setMobileNumber("");
    } catch (err) {
      showMessage("❌ " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const differenceMs = expiry - today;
    return Math.floor(differenceMs / (1000 * 60 * 60 * 24));
  };

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

  const getStockLevelClass = (remaining, quantity) => {
    const percentage = (remaining / quantity) * 100;
    if (percentage <= 10) return "text-red-600 dark:text-red-400";
    if (percentage <= 30) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
  };

  const getStockLevelBadge = (remaining, quantity) => {
    const percentage = (remaining / quantity) * 100;
    if (percentage <= 10) return { text: "Critical", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" };
    if (percentage <= 30) return { text: "Low", class: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" };
    return { text: "Good", class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
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

  const filteredFoods = () => {
    let filtered = animalFoods.filter(food => 
      (food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.targetAnimal.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (targetAnimalFilter === "All Animals" || food.targetAnimal === targetAnimalFilter)
    );

    // Apply tab filters
    if (activeTab !== "all") {
      filtered = filtered.filter(food => {
        const days = calculateDaysUntilExpiry(food.expiryDate);
        const percentage = (food.remaining / food.quantity) * 100;
        
        if (activeTab === 'expired') return days < 0;
        if (activeTab === 'expiringSoon') return days >= 0 && days <= 30;
        if (activeTab === 'lowStock') return percentage <= 30;
        if (activeTab === 'criticalStock') return percentage <= 10;
        return true;
      });
    }

    // Apply additional status filters
    if (statusFilter) {
      filtered = filtered.filter(food => {
        const days = calculateDaysUntilExpiry(food.expiryDate);
        const percentage = (food.remaining / food.quantity) * 100;
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

  const filteredAnimalFoods = filteredFoods();

  const pieOptions = {
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          boxWidth: 20,
          padding: 15,
          color: darkMode ? "#fff" : "#333",
          font: {
            size: 12
          }
        },
      },
      tooltip: {
        backgroundColor: darkMode ? "#2D3748" : "#fff",
        titleColor: darkMode ? "#fff" : "#333",
        bodyColor: darkMode ? "#fff" : "#333",
        borderColor: darkMode ? "#4A5568" : "#E2E8F0",
        borderWidth: 1,
      }
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  const pieData = {
    labels: filteredAnimalFoods.map(f => f.name),
    datasets: [
      { 
        data: filteredAnimalFoods.map(f => Number(f.remaining)), 
        backgroundColor: filteredAnimalFoods.map((_, i) => `hsl(${i*50},70%,50%)`), 
        hoverOffset: 10,
        borderColor: darkMode ? "#1A202C" : "#fff",
        borderWidth: 1
      }
    ]
  };

  const stockChartOptions = {
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
        text: `Stock Levels for ${selectedFoodForChart?.name || ''}`,
        color: darkMode ? '#e5e7eb' : '#1f2937',
        font: { size: 16 }
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
          text: 'Date',
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

  const stockChartData = {
    labels: stockData.map(data => new Date(data.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Stock Level',
        data: stockData.map(data => data.quantity),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        tension: 0.1
      }
    ]
  };

  const exportToPDF = () => {
    if (filteredAnimalFoods.length === 0) {
      showMessage("No data available to export", "error");
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Animal Feed Stock Report', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total Items: ${filteredAnimalFoods.length}`, 14, 34);

    const headers = [['Food Name', 'Remaining', 'Unit', 'Target Animal', 'Expiry Date', 'Status']];

    const data = filteredAnimalFoods.map(food => {
      const days = calculateDaysUntilExpiry(food.expiryDate);
      return [
        String(food.name || 'N/A'),
        String(food.remaining || 0),
        String(food.unit || 'N/A'),
        String(food.targetAnimal || 'N/A'),
        food.expiryDate ? new Date(food.expiryDate).toLocaleDateString() : 'N/A',
        String(getDaysLeftText(days))
      ];
    });

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 40,
      theme: 'striped',
      headStyles: {
        fillColor: darkMode ? [55, 65, 81] : [79, 70, 229],
        textColor: [255, 255, 255],
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
      margin: { top: 40, left: 14, right: 14 },
      styles: {
        cellPadding: 2,
        halign: 'left',
        valign: 'middle',
        overflow: 'linebreak'
      }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
    }

    doc.save(`animal_feed_stock_report_${new Date().toISOString().split('T')[0]}.pdf`);
    showMessage("PDF downloaded successfully!", "success");
  };

  const handleShowStockChart = async (food) => {
    setSelectedFoodForChart(food);
    await fetchStockData(food._id);
    setShowStockChart(true);
  };

  // Calculate summary stats
  const getSummary = () => {
    const totalFoods = animalFoods.length;
    const lowStock = animalFoods.filter(food => (food.remaining / food.quantity) * 100 <= 30).length;
    const criticalStock = animalFoods.filter(food => (food.remaining / food.quantity) * 100 <= 10).length;
    const expiringSoon = animalFoods.filter(food => {
      const days = calculateDaysUntilExpiry(food.expiryDate);
      return days >= 0 && days <= 30;
    }).length;
    const expired = animalFoods.filter(food => {
      const days = calculateDaysUntilExpiry(food.expiryDate);
      return days < 0;
    }).length;

    return { totalFoods, lowStock, criticalStock, expiringSoon, expired };
  };

  const summary = getSummary();

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Package className="text-green-500" size={32} />
          Animal Feed Stocks
        </h1>
        <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          View feed stock levels and request refills from inventory manager
        </p>
      </div>

      {/* Success/Error Messages */}
      {message.text && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg ${
          message.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        } animate-popIn`}>
          {message.text}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
            <Package className="text-blue-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Total Foods</h3>
            <p className="text-2xl font-bold">{summary.totalFoods}</p>
          </div>
        </div>
        
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-orange-900/30" : "bg-orange-100"}`}>
            <AlertCircle className="text-orange-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Low Stock</h3>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.lowStock}</p>
          </div>
        </div>
        
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-red-900/30" : "bg-red-100"}`}>
            <AlertCircle className="text-red-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Critical Stock</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.criticalStock}</p>
          </div>
        </div>
        
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-yellow-900/30" : "bg-yellow-100"}`}>
            <AlertCircle className="text-yellow-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Expiring Soon</h3>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.expiringSoon}</p>
          </div>
        </div>
        
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-red-900/30" : "bg-red-100"}`}>
            <AlertCircle className="text-red-500" size={24} />
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

      {/* Controls Section */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button 
            onClick={fetchAnimalFoods}
            className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
              darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"
            } transition-all`}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button 
            onClick={() => setShowChart(!showChart)} 
            className="bg-purple-600 px-4 py-2 rounded-lg text-white hover:bg-purple-700 transition flex items-center justify-center gap-2"
          >
            <BarChart3 size={18} />
            {showChart ? "Hide Chart" : "Show Chart"}
          </button>
          <button 
            onClick={exportToPDF}
            className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
              darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"
            } transition-all`}
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Chart Section */}
      {showChart && (
        <div className={`mb-6 p-4 rounded-xl shadow-lg ${
          darkMode ? "bg-gray-800" : "bg-white"
        } w-full h-64 md:h-80 lg:h-96`}>
          <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
            <BarChart3 size={20} />
            Feed Stock Distribution
          </h3>
          <div className="w-full h-[calc(100%-2rem)]">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className={`p-4 rounded-xl shadow-lg mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search
                size={20}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="text"
                placeholder="Search by name or target animal..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
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
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Target Animal</label>
                  <select
                    value={targetAnimalFilter}
                    onChange={(e) => setTargetAnimalFilter(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="All Animals">All Animals</option>
                    <option value="Cows">Cows</option>
                    <option value="Chickens">Chickens</option>
                    <option value="Goats">Goats</option>
                    <option value="Pigs">Pigs</option>
                    <option value="Buffaloes">Buffaloes</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    }`}
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
        </div>
      </div>

      {/* Results Count */}
      <div className={`mb-4 flex justify-between items-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        <p className="text-sm">
          Showing {filteredAnimalFoods.length} of {animalFoods.length} items
        </p>
        {filteredAnimalFoods.length === 0 && (
          <button
            onClick={() => {
              setSearchTerm("");
              setTargetAnimalFilter("All Animals");
              setStatusFilter("");
              setActiveTab("all");
            }}
            className="text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={darkMode ? "bg-gray-700" : "bg-gray-100"}>
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    Food Name {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('remaining')}
                >
                  <div className="flex items-center">
                    Remaining {getSortIcon('remaining')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Target Animal
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('expiryDate')}
                >
                  <div className="flex items-center">
                    Expiry Date {getSortIcon('expiryDate')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {filteredAnimalFoods.length > 0 ? (
                filteredAnimalFoods.map((food) => {
                  const daysLeft = calculateDaysUntilExpiry(food.expiryDate);
                  const remainingPercentage = (food.remaining / food.quantity) * 100;
                  const stockLevelBadge = getStockLevelBadge(food.remaining, food.quantity);
                  
                  return (
                    <tr key={food._id} className={darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center">
                          <Package size={16} className="mr-2 text-gray-400" />
                          {food.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`font-semibold ${getStockLevelClass(food.remaining, food.quantity)}`}>
                            {food.remaining} {food.unit}
                          </span>
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
                        {food.unit}
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
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          darkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-100 text-blue-800"
                        }`}>
                          {food.targetAnimal}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span>{new Date(food.expiryDate).toLocaleDateString()}</span>
                          <span className={`text-xs ${getDaysLeftClass(daysLeft)}`}>
                            {getDaysLeftText(daysLeft)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => setRefillModal({ open: true, food, quantity: "" })} 
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                          >
                            <Plus size={16} />
                            Request Refill
                          </button>
                          <button 
                            onClick={() => handleShowStockChart(food)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-purple-400 hover:bg-gray-700" : "text-purple-600 hover:bg-gray-100"}`}
                            title="View Stock History"
                          >
                            <TrendingUp size={18} />
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
                      <h3 className="text-lg font-medium mb-2">No animal foods found</h3>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Try adjusting your search or filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refill Request Modal */}
      {refillModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-md w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Plus size={24} />
                Request Refill
              </h2>
              <button
                onClick={() => setRefillModal({ open: false, food: null, quantity: "" })}
                className={`p-2 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition-all`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-5">
              <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} mb-4`}>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Food Item</p>
                <p className="font-semibold text-lg">{refillModal.food.name}</p>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Current Stock</p>
                    <p className="font-semibold">{refillModal.food.remaining} {refillModal.food.unit}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Target Animal</p>
                    <p className="font-semibold">{refillModal.food.targetAnimal}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-5">
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Quantity Needed *
              </label>
              <input
                type="number"
                placeholder="Enter quantity needed"
                value={refillModal.quantity}
                onChange={e => setRefillModal({...refillModal, quantity: e.target.value})}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
                required
                min="1"
              />
            </div>

            <div className="mb-5">
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Your Mobile Number (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter your mobile number for updates"
                value={mobileNumber}
                onChange={e => setMobileNumber(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setRefillModal({ open: false, food: null, quantity: "" })}
                className={`px-4 py-2.5 rounded-lg ${
                  darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                } transition-all`}
              >
                Cancel
              </button>
              <button
                onClick={handleRefillRequest}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <Bell size={16} />
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Chart Modal */}
      {showStockChart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-4xl w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp size={24} />
                Stock History - {selectedFoodForChart?.name}
              </h2>
              <button
                onClick={() => setShowStockChart(false)}
                className={`p-2 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition-all`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="h-[400px]">
              {stockData.length > 0 ? (
                <Line data={stockChartData} options={stockChartOptions} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <TrendingUp size={48} className="text-gray-400 mb-4" />
                  <p className={darkMode ? "text-gray-400" : "text-gray-500"}>No stock history available yet.</p>
                  <p className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Stock changes will appear here over time.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}