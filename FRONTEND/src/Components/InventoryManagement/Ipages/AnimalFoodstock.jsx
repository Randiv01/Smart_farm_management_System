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
  TrendingUp,
  Filter,
  Info,
  Calendar,
  Package,
  Zap,
  Clock,
  Mail,
  MessageSquare,
  PieChart
} from "lucide-react";
import { useITheme } from "../Icontexts/IThemeContext";
import axios from "axios";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnimalFoodStock = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  
  const [animalFoods, setAnimalFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [targetAnimalFilter, setTargetAnimalFilter] = useState("All Animals");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRefillForm, setShowRefillForm] = useState(false);
  const [showUseForm, setShowUseForm] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [refillingFood, setRefillingFood] = useState(null);
  const [usingFood, setUsingFood] = useState(null);
  const [showPieChart, setShowPieChart] = useState(false);
  const [showStockChart, setShowStockChart] = useState(false);
  const [selectedFoodForChart, setSelectedFoodForChart] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [refillQuantity, setRefillQuantity] = useState("");
  const [useQuantity, setUseQuantity] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    remaining: "",
    unit: "kg",
    targetAnimal: "All Animals",
    shelfLife: "180"
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

  // Fetch animal foods from API
  useEffect(() => {
    fetchAnimalFoods();
  }, []);

  const fetchAnimalFoods = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/animalfood");
      setAnimalFoods(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching animal foods:", error);
      setError("Failed to load animal foods. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStockData = async (foodId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/animalfood/stock/${foodId}`);
      setStockData(response.data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setError("Failed to load stock data.");
    }
  };

  // Handle sending email
  const handleSendEmail = (food) => {
    try {
      const email = 'recipient@example.com';
      const subject = `Low Stock Alert: ${food.name}`;
      const body = `The stock for ${food.name} is running low. Current stock: ${food.remaining} ${food.unit}. Please consider refilling.`;
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      window.location.href = mailtoLink;
      
      setSuccess(`Opening email client for ${food.name}...`);
    } catch (error) {
      console.error("Error opening email:", error);
      setError("Failed to open email client. Please try again.");
    }
  };

  // Handle sending WhatsApp message
  const handleSendWhatsApp = (food) => {
    try {
      const phone = '1234567890';
      const message = `Low Stock Alert: ${food.name} has ${food.remaining} ${food.unit} remaining. Please consider refilling.`;
      const whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappLink, '_blank');
      
      setSuccess(`Opening WhatsApp for ${food.name}...`);
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      setError("Failed to open WhatsApp. Please try again.");
    }
  };

  // Filter and sort animal foods
  const filteredAndSortedFoods = () => {
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

  const filteredAnimalFoods = filteredAndSortedFoods();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      quantity: food.quantity,
      remaining: food.remaining,
      unit: food.unit,
      targetAnimal: food.targetAnimal,
      shelfLife: "180"
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

      if (editingFood) {
        await axios.put(`http://localhost:5000/api/animalfood/${editingFood._id}`, payload);
        setSuccess("Food item updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/animalfood", payload);
        setSuccess("Food item added successfully!");
      }
      
      setShowAddForm(false);
      setEditingFood(null);
      resetForm();
      fetchAnimalFoods();
    } catch (error) {
      console.error("Error saving animal food:", error);
      setError("Failed to save animal food. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      quantity: "",
      remaining: "",
      unit: "kg",
      targetAnimal: "All Animals",
      shelfLife: "180"
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this animal food?")) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:5000/api/animalfood/${id}`);
      setSuccess("Food item deleted successfully!");
      fetchAnimalFoods();
    } catch (error) {
      console.error("Error deleting animal food:", error);
      setError("Failed to delete animal food. Please try again.");
    }
  };

  const handleRefill = (food) => {
    setRefillingFood(food);
    setRefillQuantity("");
    setShowRefillForm(true);
  };

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    
    if (parseInt(refillQuantity) <= 0 || parseInt(refillQuantity) > (refillingFood.quantity - refillingFood.remaining)) {
      setError("Invalid refill quantity.");
      return;
    }

    try {
      await axios.patch(`http://localhost:5000/api/animalfood/refill/${refillingFood._id}`, {
        refillQuantity: parseInt(refillQuantity)
      });
      
      setShowRefillForm(false);
      setRefillingFood(null);
      setRefillQuantity("");
      setSuccess("Stock refilled successfully!");
      fetchAnimalFoods();
    } catch (error) {
      console.error("Error refilling animal food:", error);
      setError("Failed to refill animal food. Please try again.");
    }
  };

  const handleUse = (food) => {
    setUsingFood(food);
    setUseQuantity("");
    setShowUseForm(true);
  };

  const handleUseSubmit = async (e) => {
    e.preventDefault();
    
    if (parseInt(useQuantity) <= 0 || parseInt(useQuantity) > usingFood.remaining) {
      setError("Invalid use quantity.");
      return;
    }

    try {
      await axios.patch(`http://localhost:5000/api/animalfood/consume/${usingFood._id}`, {
        quantityUsed: parseInt(useQuantity),
        recordedBy: "User"
      });
      
      setShowUseForm(false);
      setUsingFood(null);
      setUseQuantity("");
      setSuccess("Usage recorded successfully!");
      fetchAnimalFoods();
    } catch (error) {
      console.error("Error recording consumption:", error);
      setError("Failed to record consumption. Please try again.");
    }
  };

  const handleShowPieChart = () => {
    setShowPieChart(true);
  };

  const handleShowStockChart = async (food) => {
    setSelectedFoodForChart(food);
    await fetchStockData(food._id);
    setShowStockChart(true);
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

  const pieChartData = {
    labels: filteredAnimalFoods.map(food => food.name),
    datasets: [
      {
        label: 'Stock Distribution',
        data: filteredAnimalFoods.map(food => food.remaining),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const stockChartData = {
    labels: stockData.map(data => data.date),
    datasets: [
      {
        label: 'Stock Level',
        data: stockData.map(data => data.quantity),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      }
    ]
  };

  const baseChartOptions = {
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
        font: { size: 16 }
      },
      tooltip: {
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        titleColor: darkMode ? '#e5e7eb' : '#1f2937',
        bodyColor: darkMode ? '#e5e7eb' : '#1f2937'
      }
    }
  };

  const pieChartOptions = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      title: {
        ...baseChartOptions.plugins.title,
        text: 'Animal Food Stock Distribution'
      }
    }
  };

  const stockChartOptions = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      title: {
        ...baseChartOptions.plugins.title,
        text: `Stock Levels for ${selectedFoodForChart?.name || ''}`
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

  const exportToPDF = () => {
    try {
      if (filteredAnimalFoods.length === 0) {
        setError("No data available to export to PDF.");
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Animal Food Stock Report', 14, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.text(`Total Items: ${filteredAnimalFoods.length}`, 14, 34);

      const headers = [['Food Name', 'Quantity', 'Remaining', 'Unit', 'Target Animal', 'Expiry Date', 'Status']];

      const data = filteredAnimalFoods.map(food => {
        const days = calculateDaysUntilExpiry(food.expiryDate);
        return [
          String(food.name || 'N/A'),
          String(food.quantity || 0),
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
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 30 },
          5: { cellWidth: 25 },
          6: { cellWidth: 35 }
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

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
      }

      doc.save(`animal_food_stock_report_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF. Please check the console for details and try again.");
    }
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

  if (loading) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading animal foods...</p>
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
          Animal Food Stock
        </h1>
        <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Efficiently manage animal food inventory, track consumption, and monitor stock levels
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
            <Clock className="text-yellow-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Expiring Soon</h3>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.expiringSoon}</p>
          </div>
        </div>
        
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-red-900/30" : "bg-red-100"}`}>
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
                placeholder="Search by name or target animal..."
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
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Target Animal</label>
                  <select
                    value={targetAnimalFilter}
                    onChange={(e) => setTargetAnimalFilter(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
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
              onClick={fetchAnimalFoods}
              className={`p-2.5 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all`}
              title="Refresh Data"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={exportToPDF}
              className={`p-2.5 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all`}
              title="Export to PDF"
            >
              <Download size={20} />
            </button>
            <button
              onClick={handleShowPieChart}
              className={`p-2.5 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all`}
              title="View Stock Distribution"
            >
              <PieChart size={20} />
            </button>
            <button
              onClick={() => {
                setEditingFood(null);
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={16} />
              Add Food
            </button>
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
                    Food Name {getSortIcon('name')}
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
                  Target Animal
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
              {filteredAnimalFoods.length > 0 ? (
                filteredAnimalFoods.map((food) => {
                  const daysLeft = calculateDaysUntilExpiry(food.expiryDate);
                  const remainingPercentage = (food.remaining / food.quantity) * 100;
                  const stockLevelBadge = getStockLevelBadge(food.remaining, food.quantity);
                  const rowBg = remainingPercentage <= 10 ? (darkMode ? 'bg-red-900/10' : 'bg-red-50/50') :
                                remainingPercentage <= 30 ? (darkMode ? 'bg-orange-900/10' : 'bg-orange-50/50') :
                                daysLeft < 0 ? (darkMode ? 'bg-red-900/10' : 'bg-red-50/50') :
                                daysLeft <= 30 ? (darkMode ? 'bg-yellow-900/10' : 'bg-yellow-50/50') : '';

                  return (
                    <tr key={food._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-all ${rowBg}`}>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center">
                          <Package size={16} className="mr-2 text-gray-400" />
                          {food.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span>{food.quantity} {food.unit}</span>
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
                        <span className={`font-semibold ${getStockLevelClass(food.remaining, food.quantity)}`}>
                          {food.remaining} {food.unit}
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
                          {food.targetAnimal}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(food.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button 
                            onClick={() => handleRefill(food)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-600 hover:bg-gray-100"}`}
                            title="Refill Stock"
                          >
                            <Plus size={18} />
                          </button>
                          <button 
                            onClick={() => handleUse(food)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-orange-400 hover:bg-gray-700" : "text-orange-600 hover:bg-gray-100"}`}
                            title="Record Usage"
                          >
                            <Minus size={18} />
                          </button>
                          <button 
                            onClick={() => handleEdit(food)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-indigo-400 hover:bg-gray-700" : "text-indigo-600 hover:bg-gray-100"}`}
                            title="Edit Food"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(food._id)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"}`}
                            title="Delete Food"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleSendEmail(food)}
                            className={`p-2 rounded-lg transition-all ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-gray-100"}`}
                            title="Send Email Notification"
                          >
                            <Mail size={18} />
                          </button>
                          <button 
                            onClick={() => handleSendWhatsApp(food)}
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
                      <h3 className="text-lg font-medium mb-2">No animal foods found</h3>
                      <p className={`text-sm max-w-md mx-auto ${darkMode ? "text-gray-400" : "text-gray-500"} mb-4`}>
                        Try adjusting your search or filter criteria, or add a new food item.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setTargetAnimalFilter("All Animals");
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

      {/* Add/Edit Animal Food Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {editingFood ? <Edit size={24} /> : <Plus size={24} />}
                {editingFood ? "Edit Animal Food" : "Add New Animal Food"}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingFood(null);
                }}
                className={`p-2 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition-all`}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Food Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  required
                  placeholder="Enter food name"
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
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Target Animal *
                  </label>
                  <select
                    name="targetAnimal"
                    value={formData.targetAnimal}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"} focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                  >
                    <option value="All Animals">All Animals</option>
                    <option value="Cows">Cows</option>
                    <option value="Chickens">Chickens</option>
                    <option value="Goats">Goats</option>
                    <option value="Pigs">Pigs</option>
                    <option value="Buffaloes">Buffaloes</option>
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
                  <option value="30">1 month</option>
                  <option value="60">2 months</option>
                  <option value="90">3 months</option>
                  <option value="180">6 months</option>
                  <option value="365">1 year</option>
                  <option value="730">2 years</option>
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
                    setEditingFood(null);
                  }}
                  className={`px-4 py-2.5 rounded-lg ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"} transition-all`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  {editingFood ? "Update Food" : "Add Food"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refill Modal */}
      {showRefillForm && refillingFood && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-lg w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Plus size={24} />
                Refill {refillingFood.name}
              </h2>
              <button
                onClick={() => {
                  setShowRefillForm(false);
                  setRefillingFood(null);
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
                      <p className="font-semibold">{refillingFood.remaining} {refillingFood.unit}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Maximum Capacity</p>
                      <p className="font-semibold">{refillingFood.quantity} {refillingFood.unit}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2.5 dark:bg-gray-600 mt-3">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full" 
                      style={{ width: `${(refillingFood.remaining / refillingFood.quantity) * 100}%` }}
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
                  max={refillingFood.quantity - refillingFood.remaining}
                  placeholder="Enter quantity to add"
                />
                <p className={`text-xs mt-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Maximum you can add: {refillingFood.quantity - refillingFood.remaining} {refillingFood.unit}
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefillForm(false);
                    setRefillingFood(null);
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
      {showUseForm && usingFood && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-lg w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Minus size={24} />
                Record Usage for {usingFood.name}
              </h2>
              <button
                onClick={() => {
                  setShowUseForm(false);
                  setUsingFood(null);
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
                  <p className="font-semibold text-2xl">{usingFood.remaining} {usingFood.unit}</p>
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
                  max={usingFood.remaining}
                  placeholder="Enter quantity used"
                />
                <p className={`text-xs mt-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Maximum you can use: {usingFood.remaining} {usingFood.unit}
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowUseForm(false);
                    setUsingFood(null);
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

      {/* Pie Chart Modal */}
      {showPieChart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-4xl w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <PieChart size={24} />
                Stock Distribution
              </h2>
              <button
                onClick={() => setShowPieChart(false)}
                className={`p-2 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition-all`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="h-[400px]">
              {filteredAnimalFoods.length > 0 ? (
                <Pie data={pieChartData} options={pieChartOptions} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <PieChart size={48} className="text-gray-400 mb-4" />
                  <p className={darkMode ? "text-gray-400" : "text-gray-500"}>No stock data available yet.</p>
                  <p className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Add food items to see the distribution here.</p>
                </div>
              )}
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
                Stock Chart - {selectedFoodForChart?.name}
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
                  <p className={darkMode ? "text-gray-400" : "text-gray-500"}>No stock data available yet.</p>
                  <p className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Stock changes will appear here over time.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalFoodStock;