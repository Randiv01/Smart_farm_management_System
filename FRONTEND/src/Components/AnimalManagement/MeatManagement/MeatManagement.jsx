import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pie, Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  TrendingUp,
  Download,
  Filter,
  BarChart2,
  PieChart,
  AlertTriangle,
  Search,
  RefreshCw,
  Activity,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  EyeOff,
  Plus,
  Package,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Save,
  ArrowLeft,
  Scissors,
  History,
  BarChart3,
} from "lucide-react";
import { useNotifications, NotificationContainer } from "../UI/Notification";
import { useTheme } from "../contexts/ThemeContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Meat type icons mapping
const meatIcons = {
  beef: '🥩',
  chicken: '🍗',
  pork: '🐖',
  lamb: '🐑',
  fish: '🐟',
  turkey: '🦃',
  default: '🍖',
};

// Status badge styling
const statusBadgeStyles = {
  Fresh: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  Stored: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  Processed: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
  Sold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  Expired: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
};

// Health condition badge styling
const healthBadgeStyles = {
  Good: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  Moderate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  Critical: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
};

export default function MeatProductivityDashboard() {
  const { notifications, addNotification, removeNotification } = useNotifications();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const [meatBatches, setMeatBatches] = useState([]);
  const [harvestHistory, setHarvestHistory] = useState([]);
  const [stats, setStats] = useState({
    totalBatches: 0,
    activeBatches: 0,
    harvestedBatches: 0,
    freshBatches: 0,
    nearExpiryBatches: 0,
    criticalBatches: 0,
    totalMeatProduced: 0,
  });
  const [filters, setFilters] = useState({
    animalType: "",
    status: "",
    healthCondition: "",
    fromDate: "",
    toDate: "",
    active: "true", // Default to show active batches
  });
  const [harvestFilters, setHarvestFilters] = useState({
    animalType: "",
    fromDate: "",
    toDate: "",
    storageLocation: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "productionDate", direction: "desc" });
  const [error, setError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHarvestHistory, setShowHarvestHistory] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showHarvestForm, setShowHarvestForm] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [harvestingBatchId, setHarvestingBatchId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("month");
  const [showFilters, setShowFilters] = useState(false);

  // Form state without batchId
  const [formData, setFormData] = useState({
    batchName: "",
    animalType: "",
    meatType: "",
    quantity: "",
    unit: "kg",
    productionDate: "",
    expiryDate: "",
    status: "Fresh",
    healthCondition: "Good",
    notes: "",
  });

  // Harvest form state
  const [harvestFormData, setHarvestFormData] = useState({
    slaughterDate: "",
    totalMeatProduced: "",
    storageLocation: "",
    harvestNotes: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [harvestFormErrors, setHarvestFormErrors] = useState({});

  // Common animal and meat types for suggestions
  const animalTypes = ["Cow", "Chicken", "Pig", "Sheep", "Goat", "Turkey", "Duck", "Fish"];
  const meatTypes = {
    Cow: ["Beef", "Veal"],
    Chicken: ["Breast", "Thighs", "Wings", "Drumsticks", "Whole"],
    Pig: ["Pork", "Bacon", "Ham", "Sausage"],
    Sheep: ["Lamb", "Mutton"],
    Goat: ["Chevon", "Goat Meat"],
    Turkey: ["Turkey Breast", "Ground Turkey", "Whole Turkey"],
    Duck: ["Duck Breast", "Whole Duck"],
    Fish: ["Salmon", "Tuna", "Cod", "Tilapia", "Trout"],
  };

  useEffect(() => {
    document.title = "Meat Dashboard - Animal Manager";
    fetchData();
    fetchHarvestHistory();

    const interval = setInterval(() => {
      checkExpiryNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [batchesRes, statsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/meats", { params: filters }),
        axios.get("http://localhost:5000/api/meats/dashboard/stats"),
      ]);

      setMeatBatches(batchesRes.data.data);
      setStats(statsRes.data.data);
      generateAnalyticsData(batchesRes.data.data);
    } catch (err) {
      console.error("Failed to fetch meat productivity data:", err);
      setError("Failed to load meat productivity data. Please try again.");
      addNotification("Failed to load meat productivity data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHarvestHistory = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/meats/harvest/history", {
        params: harvestFilters
      });
      setHarvestHistory(response.data.data);
    } catch (err) {
      console.error("Failed to fetch harvest history:", err);
      addNotification("Failed to load harvest history", "error");
    }
  };

  const fetchBatchData = async (batchId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:5000/api/meats/${batchId}`);
      const batch = response.data.data;

      setFormData({
        batchName: batch.batchName || "",
        animalType: batch.animalType || "",
        meatType: batch.meatType || "",
        quantity: batch.quantity || "",
        unit: batch.unit || "kg",
        productionDate: batch.productionDate ? new Date(batch.productionDate).toISOString().split('T')[0] : "",
        expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : "",
        status: batch.status || "Fresh",
        healthCondition: batch.healthCondition || "Good",
        notes: batch.notes || "",
      });
    } catch (err) {
      console.error("Failed to fetch batch data:", err);
      addNotification("Failed to load batch data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const generateAnalyticsData = (batches) => {
    if (!batches || batches.length === 0) return;

    const animalTypeData = {};
    const meatTypeData = {};
    const statusData = {};
    const monthlyData = {};

    batches.forEach(batch => {
      if (!animalTypeData[batch.animalType]) animalTypeData[batch.animalType] = 0;
      animalTypeData[batch.animalType] += batch.quantity;

      if (!meatTypeData[batch.meatType]) meatTypeData[batch.meatType] = 0;
      meatTypeData[batch.meatType] += batch.quantity;

      if (!statusData[batch.status]) statusData[batch.status] = 0;
      statusData[batch.status] += 1;

      const monthYear = new Date(batch.productionDate).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      if (!monthlyData[monthYear]) monthlyData[monthYear] = 0;
      monthlyData[monthYear] += batch.quantity;
    });

    setAnalyticsData({
      animalTypeData,
      meatTypeData,
      statusData,
      monthlyData,
    });
  };

  const fetchProductionAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:5000/api/meats/analytics/production", {
        params: { period: analyticsPeriod }
      });
      if (response.data.success) {
        setAnalyticsData(response.data.data);
      } else {
        addNotification("Failed to load production analytics", "error");
      }
    } catch (err) {
      console.error("Failed to fetch production analytics:", err);
      addNotification("Failed to load production analytics", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMeatCounts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/meats/analytics/counts", {
        params: { period: analyticsPeriod }
      });
      if (response.data.success) {
        setAnalyticsData(prev => ({
          ...prev,
          countsData: response.data.data
        }));
      }
    } catch (err) {
      console.error("Failed to fetch meat counts:", err);
      addNotification("Failed to load meat counts", "error");
    }
  };

  const checkExpiryNotifications = () => {
    const nearExpiryBatches = meatBatches.filter(
      batch =>
        batch.daysUntilExpiry > 0 &&
        batch.daysUntilExpiry <= 3 &&
        batch.status !== "Sold" &&
        batch.status !== "Expired"
    );

    if (nearExpiryBatches.length > 0) {
      nearExpiryBatches.forEach(batch => {
        if (batch.daysUntilExpiry === 1) {
          addNotification(`Batch ${batch.batchId} expires tomorrow!`, "warning");
        }
      });
    }
  };

  const deleteBatch = async (id) => {
    if (!window.confirm("Are you sure you want to delete this batch?")) return;

    try {
      const response = await axios.delete(`http://localhost:5000/api/meats/${id}`);
      if (response.data.success) {
        addNotification(response.data.message || "Batch deleted successfully", "success");
      } else {
        addNotification(response.data.message || "Failed to delete batch", "error");
      }
      fetchData();
    } catch (err) {
      console.error("Failed to delete batch:", err);
      const errorMsg = err.response?.data?.message || "Failed to delete batch";
      addNotification(errorMsg, "error");
    }
  };

  const harvestBatch = async (id) => {
    setHarvestingBatchId(id);
    setShowHarvestForm(true);
    
    // Pre-fill the slaughter date with today's date
    setHarvestFormData(prev => ({
      ...prev,
      slaughterDate: new Date().toISOString().split('T')[0]
    }));
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.text("Meat Productivity Report", 14, 16);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on ${date}`, 14, 23);

    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: [
        ["Total Batches", stats.totalBatches],
        ["Active Batches", stats.activeBatches],
        ["Harvested Batches", stats.harvestedBatches],
        ["Fresh Batches", stats.freshBatches],
        ["Near Expiry", stats.nearExpiryBatches],
        ["Critical Condition", stats.criticalBatches],
        ["Total Meat Produced", `${stats.totalMeatProduced} kg`],
      ],
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Batch ID", "Animal Type", "Meat Type", "Quantity", "Status", "Health", "Production Date", "Expiry Date"]],
      body: meatBatches.map(batch => [
        batch.batchId,
        batch.animalType,
        batch.meatType,
        `${batch.quantity} ${batch.unit}`,
        batch.status,
        batch.healthCondition,
        new Date(batch.productionDate).toLocaleDateString(),
        new Date(batch.expiryDate).toLocaleDateString(),
      ]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`meat-report-${date.replace(/\//g, "-")}.pdf`);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleHarvestFilterChange = (key, value) => {
    setHarvestFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      animalType: "",
      status: "",
      healthCondition: "",
      fromDate: "",
      toDate: "",
      active: "true",
    });
    setSearchTerm("");
  };

  const clearHarvestFilters = () => {
    setHarvestFilters({
      animalType: "",
      fromDate: "",
      toDate: "",
      storageLocation: "",
    });
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <ChevronUp size={16} className="inline ml-1" /> : <ChevronDown size={16} className="inline ml-1" />;
  };

  const sortedBatches = [...meatBatches].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (sortConfig.key.includes("Date")) {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (typeof aValue === "string") aValue = aValue.toLowerCase();
    if (typeof bValue === "string") bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const filteredBatches = sortedBatches.filter(
    batch =>
      batch.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.animalType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.meatType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMeatIcon = (meatType) => {
    const lowerType = meatType.toLowerCase();
    for (const [key, icon] of Object.entries(meatIcons)) {
      if (lowerType.includes(key)) {
        return icon;
      }
    }
    return meatIcons.default;
  };

  const getAnimalTypeChartData = () => {
    if (!analyticsData || !analyticsData.animalTypeData) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Quantity by Animal Type',
            data: [],
            backgroundColor: [
              '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
              '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#64748b',
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: Object.keys(analyticsData.animalTypeData),
      datasets: [
        {
          label: 'Quantity by Animal Type',
          data: Object.values(analyticsData.animalTypeData),
          backgroundColor: [
            '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
            '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#64748b',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getStatusChartData = () => {
    if (!analyticsData || !analyticsData.statusData) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Batches by Status',
            data: [],
            backgroundColor: [
              '#10b981', // Fresh - green
              '#3b82f6', // Stored - blue
              '#8b5cf6', // Processed - purple
              '#f59e0b', // Sold - yellow
              '#ef4444', // Expired - red
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: Object.keys(analyticsData.statusData),
      datasets: [
        {
          label: 'Batches by Status',
          data: Object.values(analyticsData.statusData),
          backgroundColor: [
            '#10b981', // Fresh - green
            '#3b82f6', // Stored - blue
            '#8b5cf6', // Processed - purple
            '#f59e0b', // Sold - yellow
            '#ef4444', // Expired - red
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getMonthlyTrendData = () => {
    if (!analyticsData || !analyticsData.productionTrend) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Monthly Production (kg)',
            data: [],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: true,
          },
        ],
      };
    }

    const labels = analyticsData.productionTrend.map(item => item._id.date);
    const data = analyticsData.productionTrend.map(item => item.totalMeat);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Monthly Production (kg)',
          data: data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };

  const getBatchStatsData = () => {
    if (!analyticsData || !analyticsData.batchStats) {
      return {
        labels: ['Active', 'Harvested'],
        datasets: [
          {
            label: 'Batch Status',
            data: [0, 0],
            backgroundColor: [
              '#10b981', // Active - green
              '#f59e0b', // Harvested - yellow
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: ['Active', 'Harvested'],
      datasets: [
        {
          label: 'Batch Status',
          data: [analyticsData.batchStats.active, analyticsData.batchStats.harvested],
          backgroundColor: [
            '#10b981', // Active - green
            '#f59e0b', // Harvested - yellow
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getAnimalDistributionData = () => {
    if (!analyticsData || !analyticsData.animalDistribution) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Meat Production by Animal Type (kg)',
            data: [],
            backgroundColor: [
              '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
              '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#64748b',
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: analyticsData.animalDistribution.map(item => item._id),
      datasets: [
        {
          label: 'Meat Production by Animal Type (kg)',
          data: analyticsData.animalDistribution.map(item => item.totalMeat),
          backgroundColor: [
            '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
            '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#64748b',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Form handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: "",
      }));
    }

    if (name === "animalType") {
      setFormData(prev => ({
        ...prev,
        meatType: "",
      }));
    }
  };

  const handleHarvestFormChange = (e) => {
    const { name, value } = e.target;
    setHarvestFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (harvestFormErrors[name]) {
      setHarvestFormErrors(prev => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.batchName.trim()) newErrors.batchName = "Batch name is required";
    if (!formData.animalType) newErrors.animalType = "Animal type is required";
    if (!formData.meatType) newErrors.meatType = "Meat type is required";
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = "Valid quantity is required";
    if (!formData.productionDate) newErrors.productionDate = "Production date is required";
    if (!formData.expiryDate) newErrors.expiryDate = "Expiry date is required";

    if (formData.productionDate && formData.expiryDate) {
      const productionDate = new Date(formData.productionDate);
      const expiryDate = new Date(formData.expiryDate);

      if (expiryDate <= productionDate) {
        newErrors.expiryDate = "Expiry date must be after production date";
      }
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateHarvestForm = () => {
    const newErrors = {};

    if (!harvestFormData.slaughterDate) newErrors.slaughterDate = "Slaughter date is required";
    if (!harvestFormData.totalMeatProduced || harvestFormData.totalMeatProduced <= 0) {
      newErrors.totalMeatProduced = "Valid total meat produced is required";
    }

    setHarvestFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);

      let response;
      if (editingBatchId) {
        response = await axios.put(`http://localhost:5000/api/meats/${editingBatchId}`, formData);
      } else {
        response = await axios.post("http://localhost:5000/api/meats", formData);
      }

      if (response.data.success) {
        addNotification(response.data.message || (editingBatchId ? "Batch updated successfully" : "Batch created successfully"), "success");
      } else {
        addNotification(response.data.message || "Failed to save batch", "error");
      }

      setShowForm(false);
      setEditingBatchId(null);
      setFormData({
        batchName: "",
        animalType: "",
        meatType: "",
        quantity: "",
        unit: "kg",
        productionDate: "",
        expiryDate: "",
        status: "Fresh",
        healthCondition: "Good",
        notes: "",
      });
      fetchData();
    } catch (err) {
      console.error("Failed to save batch:", err);
      const errorMsg = err.response?.data?.message || "Failed to save batch";
      addNotification(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHarvestFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateHarvestForm()) return;

    try {
      setIsLoading(true);
      const response = await axios.post(`http://localhost:5000/api/meats/${harvestingBatchId}/harvest`, harvestFormData);
      
      if (response.data.success) {
        addNotification(response.data.message || "Batch harvested successfully", "success");
      } else {
        addNotification(response.data.message || "Failed to harvest batch", "error");
      }
      
      setShowHarvestForm(false);
      setHarvestingBatchId(null);
      setHarvestFormData({
        slaughterDate: "",
        totalMeatProduced: "",
        storageLocation: "",
        harvestNotes: "",
      });
      
      fetchData();
      fetchHarvestHistory();
    } catch (err) {
      console.error("Failed to harvest batch:", err);
      const errorMsg = err.response?.data?.message || "Failed to harvest batch";
      addNotification(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateExpiryDate = (days) => {
    if (!formData.productionDate) return;

    const productionDate = new Date(formData.productionDate);
    productionDate.setDate(productionDate.getDate() + days);

    setFormData(prev => ({
      ...prev,
      expiryDate: productionDate.toISOString().split('T')[0],
    }));
  };

  const openForm = (batchId = null) => {
    if (batchId) {
      setEditingBatchId(batchId);
      fetchBatchData(batchId);
    } else {
      setEditingBatchId(null);
      setFormData({
        batchName: "",
        animalType: "",
        meatType: "",
        quantity: "",
        unit: "kg",
        productionDate: "",
        expiryDate: "",
        status: "Fresh",
        healthCondition: "Good",
        notes: "",
      });
    }
    setShowForm(true);
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "light-beige"} font-sans`}>
      {/* Notification Container */}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Activity className="text-blue-600 dark:text-blue-400" size={32} />
              Meat Productivity Dashboard
            </h1>
            <p className={`mt-2 text-md ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Manage and monitor meat production batches
            </p>
          </div>
          <button
            onClick={() => openForm()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-full flex items-center gap-2 hover:bg-blue-700 transition-all"
          >
            <Plus size={18} />
            Add New Batch
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-all flex items-center gap-4`}
        >
          <div className={`p-3 rounded-full ${darkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
            <Package className={darkMode ? "text-blue-400" : "text-blue-600"} size={28} />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Batches</h3>
            <p className="text-2xl font-bold">{stats.totalBatches}</p>
          </div>
        </div>

        <div
          className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-all flex items-center gap-4`}
        >
          <div className={`p-3 rounded-full ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}>
            <CheckCircle className={darkMode ? "text-green-400" : "text-green-600"} size={28} />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Active Batches</h3>
            <p className="text-2xl font-bold">{stats.activeBatches}</p>
          </div>
        </div>

        <div
          className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-all flex items-center gap-4`}
        >
          <div className={`p-3 rounded-full ${darkMode ? "bg-yellow-900/30" : "bg-yellow-100"}`}>
            <History className={darkMode ? "text-yellow-400" : "text-yellow-600"} size={28} />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Harvested</h3>
            <p className="text-2xl font-bold">{stats.harvestedBatches}</p>
          </div>
        </div>

        <div
          className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-all flex items-center gap-4`}
        >
          <div className={`p-3 rounded-full ${darkMode ? "bg-purple-900/30" : "bg-purple-100"}`}>
            <BarChart3 className={darkMode ? "text-purple-400" : "text-purple-600"} size={28} />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Meat</h3>
            <p className="text-2xl font-bold">{stats.totalMeatProduced} kg</p>
          </div>
        </div>
      </div>

      {/* Search Bar - Always Visible */}
      <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Search size={20} />
            Search Batches
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => setSearchTerm("")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              } transition-all`}
            >
              Clear Search
            </button>
            <button
              onClick={() => {
                fetchData();
                fetchHarvestHistory();
              }}
              className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${
                darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              } transition-all`}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Search</label>
          <div className="relative">
            <Search
              size={18}
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            />
            <input
              type="text"
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>
        </div>
      </div>

      {/* Advanced Filters - Toggle-able */}
      {showFilters && (
        <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg mb-6 transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter size={20} />
            Advanced Filters
          </h3>
          <div className="flex gap-3">
            <button
              onClick={clearFilters}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              } transition-all`}
            >
              Clear All
            </button>
            <button
              onClick={fetchData}
              className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${
                darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              } transition-all`}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Animal Type</label>
            <input
              type="text"
              value={filters.animalType}
              onChange={(e) => handleFilterChange("animalType", e.target.value)}
              placeholder="e.g., Cow, Chicken"
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">All Status</option>
              <option value="Fresh">Fresh</option>
              <option value="Stored">Stored</option>
              <option value="Processed">Processed</option>
              <option value="Sold">Sold</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Health Condition</label>
            <select
              value={filters.healthCondition}
              onChange={(e) => handleFilterChange("healthCondition", e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">All Conditions</option>
              <option value="Good">Good</option>
              <option value="Moderate">Moderate</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Batch Status</label>
            <select
              value={filters.active}
              onChange={(e) => handleFilterChange("active", e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="true">Active Only</option>
              <option value="false">Harvested Only</option>
              <option value="">All Batches</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Production Date Range</label>
            <div className="flex gap-3">
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
              <span className={`self-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>to</span>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
            </div>
          </div>

        </div>
      </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${
              showFilters ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            } transition-all`}
          >
            <Filter size={18} />
            {showFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
          </button>
          <button
            onClick={() => {
              const newShowAnalytics = !showAnalytics;
              setShowAnalytics(newShowAnalytics);
              if (newShowAnalytics) {
                fetchProductionAnalytics();
                fetchMeatCounts();
              }
            }}
            className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${
              showAnalytics ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            } transition-all`}
          >
            {showAnalytics ? <EyeOff size={18} /> : <BarChart2 size={18} />}
            {showAnalytics ? "Hide Analytics" : "Show Analytics"}
          </button>
          <button
            onClick={() => setShowHarvestHistory(!showHarvestHistory)}
            className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${
              showHarvestHistory ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            } transition-all`}
          >
            <History size={18} />
            {showHarvestHistory ? "Hide History" : "Show Harvest History"}
          </button>
          <button
            onClick={exportPDF}
            className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${
              darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            } transition-all`}
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>

        <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Showing {filteredBatches.length} of {meatBatches.length} batches
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Production Analytics</h2>
            <div className="flex gap-2">
              <select
                value={analyticsPeriod}
                onChange={(e) => setAnalyticsPeriod(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
              <button
                onClick={() => {
                  fetchProductionAnalytics();
                  fetchMeatCounts();
                }}
                className={`px-3 py-2 rounded-lg flex items-center gap-1 ${
                  darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Production Trend</h3>
                <TrendingUp className={darkMode ? "text-gray-400" : "text-gray-500"} size={20} />
              </div>
              <div className="h-80">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className={darkMode ? "text-gray-400" : "text-gray-500"}>Loading chart data...</div>
                  </div>
                ) : (
                  <Line
                    data={getMonthlyTrendData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: { color: darkMode ? "#f3f4f6" : "#111827" },
                        },
                      },
                      scales: {
                        x: {
                          ticks: { color: darkMode ? "#9ca3af" : "#6b7280" },
                          grid: { color: darkMode ? "#374151" : "#e5e7eb" },
                        },
                        y: {
                          ticks: { color: darkMode ? "#9ca3af" : "#6b7280" },
                          grid: { color: darkMode ? "#374151" : "#e5e7eb" },
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Batch Status</h3>
                <PieChart className={darkMode ? "text-gray-400" : "text-gray-500"} size={20} />
              </div>
              <div className="h-80">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className={darkMode ? "text-gray-400" : "text-gray-500"}>Loading chart data...</div>
                  </div>
                ) : (
                  <Doughnut
                    data={getBatchStatsData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: { color: darkMode ? "#f3f4f6" : "#111827" },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Meat Production by Animal Type</h3>
                <PieChart className={darkMode ? "text-gray-400" : "text-gray-500"} size={20} />
              </div>
              <div className="h-80">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className={darkMode ? "text-gray-400" : "text-gray-500"}>Loading chart data...</div>
                  </div>
                ) : (
                  <Bar
                    data={getAnimalDistributionData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: { color: darkMode ? "#f3f4f6" : "#111827" },
                        },
                      },
                      scales: {
                        x: {
                          ticks: { color: darkMode ? "#9ca3af" : "#6b7280" },
                          grid: { color: darkMode ? "#374151" : "#e5e7eb" },
                        },
                        y: {
                          ticks: { color: darkMode ? "#9ca3af" : "#6b7280" },
                          grid: { color: darkMode ? "#374151" : "#e5e7eb" },
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Storage Distribution</h3>
                <Package className={darkMode ? "text-gray-400" : "text-gray-500"} size={20} />
              </div>
              <div className="h-80">
                {analyticsData && analyticsData.storageDistribution && analyticsData.storageDistribution.length > 0 ? (
                  <Doughnut
                    data={{
                      labels: analyticsData.storageDistribution.map(item => item._id),
                      datasets: [
                        {
                          label: 'Storage Distribution',
                          data: analyticsData.storageDistribution.map(item => item.totalMeat),
                          backgroundColor: [
                            '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
                            '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#64748b',
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: { color: darkMode ? "#f3f4f6" : "#111827" },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className={`flex items-center justify-center h-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    No storage data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Harvest History Section */}
      {showHarvestHistory && showFilters && (
        <div className="mb-8">
          <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg mb-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History size={20} />
                Harvest History Filters
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={clearHarvestFilters}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  } transition-all`}
                >
                  Clear All
                </button>
                <button
                  onClick={fetchHarvestHistory}
                  className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${
                    darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  } transition-all`}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Animal Type</label>
                <input
                  type="text"
                  value={harvestFilters.animalType}
                  onChange={(e) => handleHarvestFilterChange("animalType", e.target.value)}
                  placeholder="e.g., Cow, Chicken"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Storage Location</label>
                <input
                  type="text"
                  value={harvestFilters.storageLocation}
                  onChange={(e) => handleHarvestFilterChange("storageLocation", e.target.value)}
                  placeholder="e.g., Freezer A, Cold Room B"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Slaughter Date Range</label>
                <div className="flex gap-3">
                  <input
                    type="date"
                    value={harvestFilters.fromDate}
                    onChange={(e) => handleHarvestFilterChange("fromDate", e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-lg border ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                  <span className={`self-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>to</span>
                  <input
                    type="date"
                    value={harvestFilters.toDate}
                    onChange={(e) => handleHarvestFilterChange("toDate", e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-lg border ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${darkMode ? "bg-gray-700" : "bg-gray-100"} text-left`}>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Batch ID</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Animal Type</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Meat Type</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Meat Produced</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Slaughter Date</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Storage Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {harvestHistory.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center">
                        No harvest history found
                      </td>
                    </tr>
                  ) : (
                    harvestHistory.map(record => (
                      <tr key={record._id} className={darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{record.batchId}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="mr-1">{getMeatIcon(record.animalType)}</span>
                          {record.animalType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{record.meatType}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.quantity} {record.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.totalMeatProduced} {record.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(record.slaughterDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{record.storageLocation || "N/A"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Batches Table */}
      {!showHarvestHistory && (
        <div className={`rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${darkMode ? "bg-gray-700" : "bg-gray-100"} text-left`}>
                  <th
                    className="px-6 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("batchId")}
                  >
                    Batch ID {getSortIcon("batchId")}
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("batchName")}
                  >
                    Name {getSortIcon("batchName")}
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("animalType")}
                  >
                    Animal Type {getSortIcon("animalType")}
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("meatType")}
                  >
                    Meat Type {getSortIcon("meatType")}
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("quantity")}
                  >
                    Quantity {getSortIcon("quantity")}
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("status")}
                  >
                    Status {getSortIcon("status")}
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("healthCondition")}
                  >
                    Health {getSortIcon("healthCondition")}
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("productionDate")}
                  >
                    Production {getSortIcon("productionDate")}
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("expiryDate")}
                  >
                    Expiry {getSortIcon("expiryDate")}
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center">
                      No batches found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map(batch => (
                    <tr key={batch._id} className={darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{batch.batchId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{batch.batchName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="mr-1">{getMeatIcon(batch.animalType)}</span>
                        {batch.animalType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{batch.meatType}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {batch.quantity} {batch.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusBadgeStyles[batch.status]}`}>
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${healthBadgeStyles[batch.healthCondition]}`}>
                          {batch.healthCondition}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(batch.productionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{new Date(batch.expiryDate).toLocaleDateString()}</span>
                          {batch.daysUntilExpiry !== undefined && (
                            <span className={`text-xs ${batch.daysUntilExpiry <= 3 ? "text-red-500" : darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {batch.daysUntilExpiry > 0 ? `${batch.daysUntilExpiry} days left` : "Expired"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openForm(batch._id)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                          {batch.isActive && (
                            <button
                              onClick={() => harvestBatch(batch._id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              Harvest
                            </button>
                          )}
                          <button
                            onClick={() => deleteBatch(batch._id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-4xl w-full mx-4 p-6 rounded-2xl ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"} shadow-xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"} transition-colors`}
                >
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold">{editingBatchId ? "Edit Meat Batch" : "Add New Meat Batch"}</h1>
                  <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {editingBatchId ? "Update the details of this meat batch" : "Create a new meat production batch"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"} transition-colors`}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Batch Name *
                  </label>
                  <input
                    type="text"
                    name="batchName"
                    value={formData.batchName}
                    onChange={handleFormChange}
                    placeholder="e.g., Premium Beef Batch 001"
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      formErrors.batchName ? "border-red-500" : darkMode ? "border-gray-600" : "border-gray-300"
                    } ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.batchName && <p className="mt-1 text-sm text-red-500">{formErrors.batchName}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Animal Type *
                  </label>
                  <select
                    name="animalType"
                    value={formData.animalType}
                    onChange={handleFormChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      formErrors.animalType ? "border-red-500" : darkMode ? "border-gray-600" : "border-gray-300"
                    } ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  >
                    <option value="">Select Animal Type</option>
                    {animalTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {formErrors.animalType && <p className="mt-1 text-sm text-red-500">{formErrors.animalType}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Meat Type *
                  </label>
                  <select
                    name="meatType"
                    value={formData.meatType}
                    onChange={handleFormChange}
                    disabled={!formData.animalType}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      formErrors.meatType ? "border-red-500" : darkMode ? "border-gray-600" : "border-gray-300"
                    } ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  >
                    <option value="">Select Meat Type</option>
                    {formData.animalType &&
                      meatTypes[formData.animalType]?.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                  </select>
                  {formErrors.meatType && <p className="mt-1 text-sm text-red-500">{formErrors.meatType}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Quantity *
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleFormChange}
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className={`flex-1 px-4 py-2.5 rounded-l-lg border ${
                        formErrors.quantity ? "border-red-500" : darkMode ? "border-gray-600" : "border-gray-300"
                      } ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleFormChange}
                      className={`px-4 py-2.5 rounded-r-lg border-t border-r border-b ${
                        darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-gray-100 text-gray-900"
                      }`}
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                  {formErrors.quantity && <p className="mt-1 text-sm text-red-500">{formErrors.quantity}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  >
                    <option value="Fresh">Fresh</option>
                    <option value="Stored">Stored</option>
                    <option value="Processed">Processed</option>
                    <option value="Sold">Sold</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Production Date *
                  </label>
                  <input
                    type="date"
                    name="productionDate"
                    value={formData.productionDate}
                    onChange={handleFormChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      formErrors.productionDate ? "border-red-500" : darkMode ? "border-gray-600" : "border-gray-300"
                    } ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.productionDate && <p className="mt-1 text-sm text-red-500">{formErrors.productionDate}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Expiry Date *
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => calculateExpiryDate(7)}
                      className={`px-3 py-1 text-xs rounded ${
                        darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      1 Week
                    </button>
                    <button
                      type="button"
                      onClick={() => calculateExpiryDate(14)}
                      className={`px-3 py-1 text-xs rounded ${
                        darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      2 Weeks
                    </button>
                    <button
                      type="button"
                      onClick={() => calculateExpiryDate(30)}
                      className={`px-3 py-1 text-xs rounded ${
                        darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      1 Month
                    </button>
                  </div>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleFormChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      formErrors.expiryDate ? "border-red-500" : darkMode ? "border-gray-600" : "border-gray-300"
                    } ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.expiryDate && <p className="mt-1 text-sm text-red-500">{formErrors.expiryDate}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Health Condition
                  </label>
                  <select
                    name="healthCondition"
                    value={formData.healthCondition}
                    onChange={handleFormChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  >
                    <option value="Good">Good</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows="3"
                    placeholder="Additional information about this batch..."
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`px-5 py-2.5 rounded-lg ${
                    darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  } transition-all`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Save size={18} />
                  {editingBatchId ? "Update Batch" : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Harvest Form Modal */}
      {showHarvestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-2xl w-full mx-4 p-6 rounded-2xl ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"} shadow-xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowHarvestForm(false)}
                  className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"} transition-colors`}
                >
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold">Harvest Batch</h1>
                  <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Record the harvest details for this batch
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHarvestForm(false)}
                className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"} transition-colors`}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleHarvestFormSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Slaughter Date *
                  </label>
                  <input
                    type="date"
                    name="slaughterDate"
                    value={harvestFormData.slaughterDate}
                    onChange={handleHarvestFormChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      harvestFormErrors.slaughterDate ? "border-red-500" : darkMode ? "border-gray-600" : "border-gray-300"
                    } ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {harvestFormErrors.slaughterDate && <p className="mt-1 text-sm text-red-500">{harvestFormErrors.slaughterDate}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Total Meat Produced (kg) *
                  </label>
                  <input
                    type="number"
                    name="totalMeatProduced"
                    value={harvestFormData.totalMeatProduced}
                    onChange={handleHarvestFormChange}
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      harvestFormErrors.totalMeatProduced ? "border-red-500" : darkMode ? "border-gray-600" : "border-gray-300"
                    } ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {harvestFormErrors.totalMeatProduced && <p className="mt-1 text-sm text-red-500">{harvestFormErrors.totalMeatProduced}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Storage Location
                  </label>
                  <input
                    type="text"
                    name="storageLocation"
                    value={harvestFormData.storageLocation}
                    onChange={handleHarvestFormChange}
                    placeholder="e.g., Freezer A, Cold Room B"
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Harvest Notes
                  </label>
                  <textarea
                    name="harvestNotes"
                    value={harvestFormData.harvestNotes}
                    onChange={handleHarvestFormChange}
                    rows="3"
                    placeholder="Additional information about this harvest..."
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowHarvestForm(false)}
                  className={`px-5 py-2.5 rounded-lg ${
                    darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  } transition-all`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Scissors size={18} />
                  Harvest Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}