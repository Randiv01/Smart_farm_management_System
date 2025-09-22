import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.js";
import { useLoader } from "../contexts/LoaderContext.js";
import axios from "axios";
import { Bar, Pie, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  BarChart2,
  PieChart,
  Calendar,
  AlertTriangle,
  Search,
  RefreshCw,
  Users,
  Activity,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  EyeOff,
  Plus,
  Package,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Animal type icons mapping
const animalIcons = {
  cow: '🐄',
  chicken: '🐔',
  sheep: '🐑',
  goat: '🐐',
  pig: '🐖',
  buffalo: '🐃',
  bafalos: '🐃',
  default: '🐾',
};

export default function AnimalProductivityDashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading: setGlobalLoading } = useLoader();

  const [animalTypes, setAnimalTypes] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [productivityStats, setProductivityStats] = useState({});
  const [productivityFields, setProductivityFields] = useState([]);
  const [productivityRecords, setProductivityRecords] = useState([]);
  const [productivityAnalytics, setProductivityAnalytics] = useState(null);
  const [selectedField, setSelectedField] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedManagementType, setSelectedManagementType] = useState("all");
  const [trendStats, setTrendStats] = useState([]);
  const [insights, setInsights] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [error, setError] = useState(null);
  const [totalAnimals, setTotalAnimals] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    document.title = "Animal Productivity - Animal Manager";
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setGlobalLoading(true);
      setError(null);

      // This Promise.all now uses the new '/productivity' endpoint we created
      const [typesRes, animalsRes, productivityRes, analyticsRes] = await Promise.all([
        axios.get("http://localhost:5000/animal-types"),
        axios.get("http://localhost:5000/animals"),
        axios.get("http://localhost:5000/productivity"), // This now works and gets ALL records
        axios.get("http://localhost:5000/productivity/analytics?timeframe=month&groupBy=day"),
      ]);

      const types = typesRes.data;
      const allAnimals = animalsRes.data;
      const allProductivityRecords = productivityRes.data.allRecords || []; // Correctly gets all records
      const analyticsData = analyticsRes.data;

      setAnimals(allAnimals);
      setProductivityRecords(allProductivityRecords);
      setProductivityAnalytics(analyticsData);

      const allProductivityFields = [];
      const fieldNames = new Set();
      types.forEach((type) => {
        if (type.productivityFields) {
          type.productivityFields.forEach((field) => {
            if (!fieldNames.has(field.name)) {
              fieldNames.add(field.name);
              allProductivityFields.push(field);
            }
          });
        }
      });
      setProductivityFields(allProductivityFields);

      const typesWithStats = types.map((type) => {
        // Robustly filter animals belonging to the current type
        const animalsOfType = allAnimals.filter(a => {
          if (!a.type) return false;
          const typeId = typeof a.type === 'object' ? a.type._id : a.type;
          return typeId === type._id;
        });

        const animalIdsOfType = new Set(animalsOfType.map(a => a._id.toString()));
        const batchIdsOfType = new Set(animalsOfType.filter(a => a.batchId).map(a => a.batchId));
        
        const recordsForType = allProductivityRecords.filter(record => {
  // First, check if it's a batch record
  if (record.batchId && batchIdsOfType.has(record.batchId)) {
    return true;
  }
  
  // Next, handle individual animal records robustly
  if (record.animalId) {
    // This handles if record.animalId is a full object OR just a string ID
    const recordAnimalIdStr = typeof record.animalId === 'object'
      ? record.animalId._id?.toString()
      : record.animalId.toString();
      
    return animalIdsOfType.has(recordAnimalIdStr);
  }

  return false;
});

        const productivity = {};
        if (type.productivityFields) {
            type.productivityFields.forEach(field => {
                productivity[field.name] = 0;
            });
        }
        
        recordsForType.forEach(record => {
            if (type.productivityFields) {
                type.productivityFields.forEach(field => {
                    if (record[field.name] && typeof record[field.name] === 'number') {
                        productivity[field.name] += record[field.name];
                    }
                });
            }
        });

        return {
          ...type,
          totalCount: animalsOfType.length,
          productivity,
          bannerImage: type.bannerImage,
          productivityFields: type.productivityFields || [],
        };
      });

      setAnimalTypes(typesWithStats);
      setTotalAnimals(allAnimals.length);

      const overall = {};
      allProductivityFields.forEach((field) => {
        overall[field.name] = allProductivityRecords.reduce((sum, record) => {
          return sum + (Number(record[field.name]) || 0);
        }, 0);
      });
      setProductivityStats(overall);
      
      generateTrendData(allProductivityRecords, allProductivityFields);
      generateInsights(typesWithStats, overall, analyticsData);

    } catch (err) {
      console.error("Failed to fetch productivity data:", err);
      setError("Failed to load productivity data. Please try again.");
      setMessage({ text: "Failed to load data", type: "error" });
    } finally {
      setGlobalLoading(false);
    }
  };


  // --- END: CORRECTED FETCH AND AGGREGATION LOGIC ---
  
  const generateTrendData = (records, fields) => {
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        date: date,
        label: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      });
    }

    const trendData = months.map((monthObj) => {
      const entry = { date: monthObj.label };
      const monthStart = new Date(monthObj.date.getFullYear(), monthObj.date.getMonth(), 1);
      const monthEnd = new Date(monthObj.date.getFullYear(), monthObj.date.getMonth() + 1, 0);

      const monthRecords = records.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= monthStart && recordDate <= monthEnd;
      });
      
      fields.forEach((field) => {
        entry[field.name] = monthRecords.reduce((sum, record) => sum + (Number(record[field.name]) || 0), 0);
      });

      return entry;
    });

    setTrendStats(trendData);
  };

  const generateInsights = (types, overallStats, analyticsData) => {
    const newInsights = [];

    if (types.length > 0) {
      const topType = types.reduce((prev, current) => {
        const prevProductivity = Object.values(prev.productivity).reduce((sum, val) => sum + val, 0);
        const currentProductivity = Object.values(current.productivity).reduce((sum, val) => sum + val, 0);
        return prevProductivity > currentProductivity ? prev : current;
      });

      if (topType) {
        const topProductivity = Object.values(topType.productivity).reduce((sum, val) => sum + val, 0);
        newInsights.push({
          type: "success",
          message: `${topType.name} is the highest performing animal type with total productivity of ${topProductivity.toLocaleString()} units`,
        });
      }
    }

    const inactiveTypes = types.filter((type) =>
      Object.values(type.productivity).reduce((sum, val) => sum + val, 0) === 0
    );

    if (inactiveTypes.length > 0) {
      newInsights.push({
        type: "warning",
        message: `${inactiveTypes.length} animal type(s) have no recorded productivity data: ${inactiveTypes.map((t) => t.name).join(", ")}`,
      });
    }

    if (analyticsData?.analytics && analyticsData.analytics.length >= 2) {
      const current = analyticsData.analytics[analyticsData.analytics.length - 1];
      const previous = analyticsData.analytics[analyticsData.analytics.length - 2];

      let totalCurrent = 0;
      let totalPrevious = 0;

      if (current.values) {
        Object.values(current.values).forEach((fieldData) => {
          totalCurrent += fieldData.total || 0;
        });
      }

      if (previous.values) {
        Object.values(previous.values).forEach((fieldData) => {
          totalPrevious += fieldData.total || 0;
        });
      }

      if (totalPrevious > 0) {
        const change = ((totalCurrent - totalPrevious) / totalPrevious) * 100;
        if (Math.abs(change) > 5) {
          newInsights.push({
            type: change > 0 ? "success" : "danger",
            message: `Productivity has ${change > 0 ? "increased" : "decreased"} by ${Math.abs(change).toFixed(1)}% compared to last period`,
          });
        }
      }
    }

    if (trendStats.length >= 6) {
      const lastSixMonths = trendStats.slice(-6);
      const firstThree = lastSixMonths.slice(0, 3);
      const lastThree = lastSixMonths.slice(3);

      let firstSum = 0;
      let lastSum = 0;

      firstThree.forEach((month) => {
        productivityFields.forEach((field) => {
          firstSum += month[field.name] || 0;
        });
      });

      lastThree.forEach((month) => {
        productivityFields.forEach((field) => {
          lastSum += month[field.name] || 0;
        });
      });

      if (firstSum > 0 && lastSum > 0) {
        const change = ((lastSum - firstSum) / firstSum) * 100;
        if (Math.abs(change) > 15) {
          newInsights.push({
            type: change > 0 ? "success" : "danger",
            message: `Significant ${change > 0 ? "increase" : "decrease"} (${Math.abs(change).toFixed(1)}%) in productivity over the last 3 months compared to previous 3 months`,
          });
        }
      }
    }

    setInsights(newInsights);
  };

  // Chart data
  const productivityChartData = {
    labels: animalTypes.map((type) => type.name),
    datasets: productivityFields.slice(0, 5).map((field, index) => ({
      label: field.label,
      data: animalTypes.map((type) => type.productivity[field.name] || 0),
      backgroundColor: [
        "#3b82f6",
        "#f59e0b",
        "#10b981",
        "#ef4444",
        "#8b5cf6",
        "#ec4899",
        "#06b6d4",
        "#f97316",
        "#84cc16",
        "#64748b",
      ][index % 10],
      borderColor: darkMode ? "#374151" : "#e5e7eb",
      borderWidth: 1,
    })),
  };

  const trendChartData = {
    labels: trendStats.map((stat) => stat.date),
    datasets: productivityFields.slice(0, 3).map((field, index) => ({
      label: field.label,
      data: trendStats.map((stat) => stat[field.name] || 0),
      borderColor: ["#3b82f6", "#f59e0b", "#10b981"][index % 3],
      backgroundColor: ["rgba(59, 130, 246, 0.1)", "rgba(245, 158, 11, 0.1)", "rgba(16, 185, 129, 0.1)"][index % 3],
      tension: 0.3,
      fill: true,
    })),
  };

  const managementTypeData = {
    labels: ["Individual", "Group/Batch", "Other"],
    datasets: [
      {
        data: [
          animalTypes.filter((t) => t.managementType === "individual").length,
          animalTypes.filter((t) => t.managementType === "batch").length,
          animalTypes.filter((t) => !["individual", "batch"].includes(t.managementType)).length,
        ],
        backgroundColor: ["#3b82f6", "#10b981", "#8b5cf6"],
        borderWidth: 0,
      },
    ],
  };

  const productivityByManagementData = {
    labels: ["Individual", "Group/Batch", "Other"],
    datasets: [
      {
        label: "Total Productivity",
        data: [
          animalTypes
            .filter((t) => t.managementType === "individual")
            .reduce((sum, type) => sum + Object.values(type.productivity).reduce((s, v) => s + v, 0), 0),
          animalTypes
            .filter((t) => t.managementType === "batch")
            .reduce((sum, type) => sum + Object.values(type.productivity).reduce((s, v) => s + v, 0), 0),
          animalTypes
            .filter((t) => !["individual", "batch"].includes(t.managementType))
            .reduce((sum, type) => sum + Object.values(type.productivity).reduce((s, v) => s + v, 0), 0),
        ],
        backgroundColor: ["rgba(59, 130, 246, 0.7)", "rgba(16, 185, 129, 0.7)", "rgba(139, 92, 246, 0.7)"],
        borderColor: ["rgb(59, 130, 246)", "rgb(16, 185, 129)", "rgb(139, 92, 246)"],
        borderWidth: 1,
      },
    ],
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.text("Animal Productivity Report", 14, 16);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on ${date}`, 14, 23);

    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value", "Unit"]],
      body: productivityFields.map((field) => [
        field.label,
        (productivityStats[field.name] || 0).toLocaleString(),
        field.unit,
      ]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Animal Type", "Count", ...productivityFields.map((f) => f.label)]],
      body: animalTypes.map((type) => [
        type.name,
        type.totalCount,
        ...productivityFields.map((field) => (type.productivity[field.name] || 0).toLocaleString()),
      ]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`productivity-report-${date.replace(/\//g, "-")}.pdf`);
  };

  const getMainProductivityMetrics = (animalType) => {
    if (!animalType.productivityFields || animalType.productivityFields.length === 0) {
      return "No productivity data recorded";
    }
    const metrics = animalType.productivityFields
      .map((field) => {
        const value = animalType.productivity[field.name] || 0;
        const unit = field.unit || "";
        // Only show metrics with a non-zero value
        if (value > 0) {
            return `${field.label}: ${value.toLocaleString()} ${unit}`;
        }
        return null;
      })
      .filter(Boolean); // Remove null entries
      
    if (metrics.length === 0) {
        return "No productivity data recorded";
    }

    return metrics.join(" | ");
  };

  const getProductivityPerAnimal = (animalType) => {
    if (animalType.totalCount === 0) return "N/A";
    const totalProductivity = Object.values(animalType.productivity).reduce((sum, val) => sum + val, 0);
    if (totalProductivity === 0) return "0.00";
    return (totalProductivity / animalType.totalCount).toFixed(2);
  };

  const getAnimalIcon = (typeName) => {
    const lowerName = typeName.toLowerCase();
    for (const [key, icon] of Object.entries(animalIcons)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return animalIcons.default;
  };

  const filteredAnimalTypes = animalTypes
    .filter((type) => activeTab === "all" || type.managementType === activeTab)
    .filter((type) => selectedManagementType === "all" || type.managementType === selectedManagementType)
    .filter((type) => type.name.toLowerCase().includes(searchTerm.toLowerCase()));

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

  const sortedAnimalTypes = filteredAnimalTypes.sort((a, b) => {
    let aValue = sortConfig.key === "name" ? a.name : a[sortConfig.key];
    let bValue = sortConfig.key === "name" ? b.name : b[sortConfig.key];

    if (typeof aValue === "string") aValue = aValue.toLowerCase();
    if (typeof bValue === "string") bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "light-beige"} font-sans`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Activity className="text-blue-600 dark:text-blue-400" size={32} />
              Productivity Dashboard
            </h1>
            <p className={`mt-2 text-md ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Monitor and analyze productivity across all animal types
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg mb-6`}>
        <div className="relative mb-4">
          <Search
            size={20}
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          />
          <input
            type="text"
            placeholder="Search by animal type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter size={20} />
            Advanced Filters
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`text-sm ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"} transition-colors`}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Management Type</label>
              <select
                value={selectedManagementType}
                onChange={(e) => setSelectedManagementType(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="all">All Management Types</option>
                <option value="individual">Individual</option>
                <option value="batch">Group/Batch</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Metric</label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">All Metrics</option>
                {productivityFields.map((field) => (
                  <option key={field.name} value={field.name}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Date Range</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className={`flex-1 px-3 py-2.5 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                <span className="self-center text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className={`flex-1 px-3 py-2.5 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            {error}
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-all flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
            <Users className="text-blue-600 dark:text-blue-400" size={28} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Animals</h3>
            <p className="text-2xl font-bold">{totalAnimals.toLocaleString()}</p>
          </div>
        </div>
        <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-all flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-purple-900/30" : "bg-purple-100"}`}>
            <Package className="text-purple-600 dark:text-purple-400" size={28} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Animal Types</h3>
            <p className="text-2xl font-bold">{animalTypes.length}</p>
          </div>
        </div>
        {productivityFields.slice(0, 2).map((field) => (
          <div
            key={field.name}
            className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-all flex items-center gap-4`}
          >
            <div className={`p-3 rounded-full ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}>
              <Activity className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total {field.label}</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(productivityStats[field.name] || 0).toLocaleString()} {field.unit}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        {["all", "individual", "batch", "other"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab === "all" ? "All Types" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchData}
            className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${
              darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            } transition-all`}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${
              showAnalytics ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            } transition-all`}
          >
            {showAnalytics ? <EyeOff size={18} /> : <BarChart2 size={18} />}
            {showAnalytics ? "Hide Analytics" : "Show Analytics"}
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
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="mb-8">
          {/* Insights */}
          {insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg flex items-start ${
                    insight.type === "success"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                      : insight.type === "warning"
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                  }`}
                >
                  {insight.type === "success" ? (
                    <TrendingUp className="mr-2 mt-0.5 flex-shrink-0" size={18} />
                  ) : insight.type === "warning" ? (
                    <AlertTriangle className="mr-2 mt-0.5 flex-shrink-0" size={18} />
                  ) : (
                    <TrendingDown className="mr-2 mt-0.5 flex-shrink-0" size={18} />
                  )}
                  <span>{insight.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Productivity by Animal Type</h3>
                <BarChart2 className="text-gray-500 dark:text-gray-400" size={20} />
              </div>
              <div className="h-80">
                <Bar
                  data={productivityChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { color: darkMode ? "#f3f4f6" : "#111827" },
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const field = productivityFields[context.datasetIndex];
                            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} ${field.unit}`;
                          },
                        },
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
              </div>
            </div>

            <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Management Type Distribution</h3>
                <PieChart className="text-gray-500 dark:text-gray-400" size={20} />
              </div>
              <div className="h-80">
                <Doughnut
                  data={managementTypeData}
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
              </div>
            </div>

            <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg lg:col-span-2`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Productivity Trends (Last 12 Months)</h3>
                <TrendingUp className="text-gray-500 dark:text-gray-400" size={20} />
              </div>
              <div className="h-80">
                <Line
                  data={trendChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { color: darkMode ? "#f3f4f6" : "#111827" },
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const field = productivityFields.find((f) => f.label === context.dataset.label);
                            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} ${field?.unit || ""}`;
                          },
                        },
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
              </div>
            </div>

            <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg lg:col-span-2`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Productivity by Management Type</h3>
                <BarChart2 className="text-gray-500 dark:text-gray-400" size={20} />
              </div>
              <div className="h-80">
                <Bar
                  data={productivityByManagementData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            return `Total Productivity: ${context.parsed.y.toLocaleString()}`;
                          },
                        },
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animal Types */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Package size={24} />
            Animal Types
          </h3>
          <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Showing {sortedAnimalTypes.length} of {animalTypes.length} types
          </span>
        </div>
        {sortedAnimalTypes.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}>
            <AlertTriangle size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No Animal Types Found</h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No animal types match the current filters. Try adjusting the filters or add a new animal type.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedManagementType("all");
                setSelectedField("");
                setFromDate("");
                setToDate("");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all mr-2"
            >
              Clear Filters
            </button>
            <button
              onClick={() => navigate("/AnimalManagement/add-animal-type")}
              className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all"
            >
              Add Animal Type
            </button>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedAnimalTypes.map((type) => (
              <div
                key={type._id}
                className={`rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl hover:scale-105 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="relative h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {type.bannerImage ? (
                    <img
                      src={`http://localhost:5000${type.bannerImage}`}
                      alt={type.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">{getAnimalIcon(type.name)}</span>
                  )}
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {type.totalCount} animals
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <span>{getAnimalIcon(type.name)}</span>
                      {type.name}
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full capitalize ${
                        type.managementType === "individual"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                          : type.managementType === "batch"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200"
                          : "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200"
                      }`}
                    >
                      {type.managementType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{getMainProductivityMetrics(type)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Avg: {getProductivityPerAnimal(type)} per animal
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/AnimalManagement/AnimalProductivity/${type.name.toLowerCase()}`);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View Productivity
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}