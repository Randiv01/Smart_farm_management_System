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
import autoTable from "jspdf-autotable"; // Fixed import
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Filter, 
  BarChart3, 
  PieChart,
  Calendar,
  AlertTriangle,
  Info
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

export default function AnimalProductivity() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading: setGlobalLoading } = useLoader();

  const [animalTypes, setAnimalTypes] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [productivityStats, setProductivityStats] = useState({});
  const [productivityFields, setProductivityFields] = useState([]);
  
  // Filters and date range
  const [selectedField, setSelectedField] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedManagementType, setSelectedManagementType] = useState("all");
  const [trendStats, setTrendStats] = useState([]);
  const [insights, setInsights] = useState([]);
  
  // View toggles
  const [showIndividualView, setShowIndividualView] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  useEffect(() => {
    document.title = "Animal Productivity Dashboard";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setGlobalLoading(true);
      const typesRes = await axios.get("http://localhost:5000/animal-types");
      const animalsRes = await axios.get("http://localhost:5000/animals");

      const types = typesRes.data;
      const allAnimals = animalsRes.data;
      setAnimals(allAnimals);

      // Extract productivity fields from all animal types
      const allProductivityFields = new Set();
      const productivityFieldLabels = {};
      const productivityFieldTypes = {};
      
      types.forEach(type => {
        const productivityCategory = type.categories?.find(
          cat => cat.name === "Productivity Info"
        );
        
        if (productivityCategory) {
          productivityCategory.fields?.forEach(field => {
            allProductivityFields.add(field.name);
            productivityFieldLabels[field.name] = field.label;
            productivityFieldTypes[field.name] = field.type;
          });
        }
      });
      
      setProductivityFields(Array.from(allProductivityFields).map(field => ({
        name: field,
        label: productivityFieldLabels[field] || field,
        type: productivityFieldTypes[field] || "number"
      })));

      const typesWithStats = types.map((type) => {
        const animalsOfType = allAnimals.filter(a => a.type._id === type._id);
        
        // Get productivity category for this type
        const productivityCategory = type.categories?.find(
          cat => cat.name === "Productivity Info"
        );
        
        // Calculate productivity for each field in the productivity category
        const productivity = {};
        if (productivityCategory) {
          productivityCategory.fields?.forEach(field => {
            productivity[field.name] = animalsOfType.reduce(
              (sum, a) => sum + (parseFloat(a.data?.[field.name]) || 0), 0
            );
          });
        }

        return {
          ...type,
          totalCount: animalsOfType.length,
          productivity,
          bannerImage: type.bannerImage,
          productivityFields: productivityCategory?.fields || []
        };
      });

      setAnimalTypes(typesWithStats);

      // Overall productivity aggregation
      const overall = {};
      productivityFields.forEach(field => {
        overall[field.name] = 0;
      });
      
      typesWithStats.forEach(t => {
        Object.keys(t.productivity).forEach(key => {
          overall[key] = (overall[key] || 0) + t.productivity[key];
        });
      });
      
      setProductivityStats(overall);
      
      // Generate mock trend data (in real app, fetch from API)
      generateMockTrendData(typesWithStats, overall);
      
      // Generate insights
      generateInsights(typesWithStats, overall);
    } catch (err) {
      console.error("Failed to fetch productivity data:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  const generateMockTrendData = (types, overallStats) => {
    // Generate 12 months of trend data
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    }
    
    const trendData = months.map(month => {
      const entry = { date: month };
      productivityFields.forEach(field => {
        // Generate random but somewhat realistic trend data
        const baseValue = overallStats[field.name] || 0;
        const fluctuation = baseValue * 0.2 * Math.random();
        const trend = baseValue * 0.02 * (Math.random() > 0.5 ? 1 : -1) * (months.indexOf(month) + 1);
        entry[field.name] = Math.round(baseValue / 12 + fluctuation + trend);
      });
      return entry;
    });
    
    setTrendStats(trendData);
  };

  const generateInsights = (types, overallStats) => {
    const newInsights = [];
    
    // Find top performing animal type
    if (types.length > 0) {
      const topType = types.reduce((prev, current) => {
        const prevProductivity = Object.values(prev.productivity).reduce((sum, val) => sum + val, 0);
        const currentProductivity = Object.values(current.productivity).reduce((sum, val) => sum + val, 0);
        return prevProductivity > currentProductivity ? prev : current;
      });
      
      if (topType) {
        newInsights.push({
          type: "success",
          message: `${topType.name} is your highest performing animal type with total productivity of ${Object.values(topType.productivity).reduce((sum, val) => sum + val, 0)} units`
        });
      }
    }
    
    // Check for types with no productivity data
    const inactiveTypes = types.filter(type => 
      Object.values(type.productivity).reduce((sum, val) => sum + val, 0) === 0
    );
    
    if (inactiveTypes.length > 0) {
      newInsights.push({
        type: "warning",
        message: `${inactiveTypes.length} animal type(s) have no recorded productivity data: ${inactiveTypes.map(t => t.name).join(', ')}`
      });
    }
    
    // Compare with previous period (simplified)
    if (trendStats.length >= 2) {
      const current = trendStats[trendStats.length - 1];
      const previous = trendStats[trendStats.length - 2];
      
      let totalCurrent = 0;
      let totalPrevious = 0;
      
      productivityFields.forEach(field => {
        totalCurrent += current[field.name] || 0;
        totalPrevious += previous[field.name] || 0;
      });
      
      const change = ((totalCurrent - totalPrevious) / totalPrevious) * 100;
      
      if (Math.abs(change) > 5) {
        newInsights.push({
          type: change > 0 ? "success" : "danger",
          message: `Productivity has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% compared to last period`
        });
      }
    }
    
    setInsights(newInsights);
  };

  // Generate chart data based on available productivity fields
  const productivityChartData = {
    labels: animalTypes.map(type => type.name),
    datasets: productivityFields.slice(0, 5).map((field, index) => ({
      label: field.label,
      data: animalTypes.map(type => type.productivity[field.name] || 0),
      backgroundColor: [
        "#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", 
        "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#64748b"
      ][index % 10],
      borderColor: darkMode ? "#374151" : "#e5e7eb",
      borderWidth: 1
    })),
  };

  // Trend chart data
  const trendChartData = {
    labels: trendStats.map(stat => stat.date),
    datasets: productivityFields.slice(0, 3).map((field, index) => ({
      label: field.label,
      data: trendStats.map(stat => stat[field.name] || 0),
      borderColor: [
        "#3b82f6", "#f59e0b", "#10b981"
      ][index % 3],
      backgroundColor: [
        "rgba(59, 130, 246, 0.1)",
        "rgba(245, 158, 11, 0.1)",
        "rgba(16, 185, 129, 0.1)"
      ][index % 3],
      tension: 0.3,
      fill: true
    })),
  };

  // Management type distribution
  const managementTypeData = {
    labels: ['Individual', 'Group/Batch', 'Other'],
    datasets: [
      {
        data: [
          animalTypes.filter(t => t.managementType === 'individual').length,
          animalTypes.filter(t => t.managementType === 'batch').length,
          animalTypes.filter(t => t.managementType === 'other').length
        ],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#8b5cf6'
        ],
        borderWidth: 0
      }
    ]
  };

  // Export to PDF - Fixed autoTable usage
  const exportPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    
    // Title
    doc.setFontSize(18);
    doc.text("Animal Productivity Report", 14, 16);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on ${date}`, 14, 23);
    
    // Summary table - Fixed autoTable call
    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: productivityFields.map(field => [
        field.label,
        productivityStats[field.name] || 0
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Animal type productivity - Fixed autoTable call
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Animal Type", "Count", ...productivityFields.map(f => f.label)]],
      body: animalTypes.map(type => [
        type.name,
        type.totalCount,
        ...productivityFields.map(field => type.productivity[field.name] || 0)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`productivity-report-${date.replace(/\//g, '-')}.pdf`);
  };

  // Get main productivity metrics for an animal type to display on cards
  const getMainProductivityMetrics = (animalType) => {
    if (!animalType.productivityFields || animalType.productivityFields.length === 0) {
      return "No productivity data";
    }
    
    // Show up to 2 main productivity metrics
    return animalType.productivityFields.slice(0, 2).map(field => (
      `${field.label}: ${animalType.productivity[field.name] || 0}`
    )).join(" | ");
  };

  // Filter animal types by management type
  const filteredAnimalTypes = selectedManagementType === "all" 
    ? animalTypes 
    : animalTypes.filter(type => type.managementType === selectedManagementType);

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-[#f7e9cb]"}`}>
      <div className="p-5">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Animal Productivity Dashboard</h2>

        {/* Insights Panel */}
        {insights.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg flex items-start ${
                  insight.type === "success" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" :
                  insight.type === "warning" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200" :
                  "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                }`}
              >
                {insight.type === "success" ? 
                  <TrendingUp className="mr-2 mt-0.5 flex-shrink-0" size={18} /> :
                  insight.type === "warning" ?
                  <AlertTriangle className="mr-2 mt-0.5 flex-shrink-0" size={18} /> :
                  <TrendingDown className="mr-2 mt-0.5 flex-shrink-0" size={18} />
                }
                <span>{insight.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Animals</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{animals.length}</div>
          </div>
          
          <div className={`p-4 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Animal Types</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{animalTypes.length}</div>
          </div>
          
          {/* Dynamic productivity stats */}
          {productivityFields.slice(0, 2).map((field, index) => (
            <div key={field.name} className={`p-4 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total {field.label}</div>
              <div className={`text-2xl font-bold ${
                index === 0 ? "text-blue-600 dark:text-blue-400" : 
                index === 1 ? "text-yellow-500 dark:text-yellow-400" : 
                "text-green-600 dark:text-green-400"
              }`}>
                {productivityStats[field.name] || 0}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={`p-4 rounded-xl shadow-sm mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <Filter size={18} className="mr-2 text-gray-500" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <select
              value={selectedManagementType}
              onChange={(e) => setSelectedManagementType(e.target.value)}
              className="px-3 py-2 rounded-lg border dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="all">All Management Types</option>
              <option value="individual">Individual</option>
              <option value="batch">Group/Batch</option>
              <option value="other">Other</option>
            </select>
            
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="px-3 py-2 rounded-lg border dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="">All Metrics</option>
              {productivityFields.map(field => (
                <option key={field.name} value={field.name}>{field.label}</option>
              ))}
            </select>
            
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 rounded-lg border dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 rounded-lg border dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            
            <button
              onClick={exportPDF}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-auto"
            >
              <Download size={16} className="mr-1" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Productivity by Type */}
          <div className={`p-5 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Productivity by Animal Type
              </h3>
              <BarChart3 className="text-gray-500" size={20} />
            </div>
            <div className="h-72">
              <Bar
                data={productivityChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: darkMode ? "#f3f4f6" : "#111827" }
                    }
                  },
                  scales: {
                    x: { 
                      ticks: { color: darkMode ? "#9ca3af" : "#6b7280" }, 
                      grid: { color: darkMode ? "#374151" : "#e5e7eb" } 
                    },
                    y: { 
                      ticks: { color: darkMode ? "#9ca3af" : "#6b7280" }, 
                      grid: { color: darkMode ? "#374151" : "#e5e7eb" },
                      beginAtZero: true
                    },
                  }
                }}
              />
            </div>
          </div>

          {/* Management Type Distribution */}
          <div className={`p-5 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Management Type Distribution
              </h3>
              <PieChart className="text-gray-500" size={20} />
            </div>
            <div className="h-72">
              <Doughnut
                data={managementTypeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: darkMode ? "#f3f4f6" : "#111827" }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Productivity Trends */}
          <div className={`p-5 rounded-xl shadow-sm lg:col-span-2 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Productivity Trends
              </h3>
              <TrendingUp className="text-gray-500" size={20} />
            </div>
            <div className="h-72">
              <Line
                data={trendChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: darkMode ? "#f3f4f6" : "#111827" }
                    }
                  },
                  scales: {
                    x: { 
                      ticks: { color: darkMode ? "#9ca3af" : "#6b7280" }, 
                      grid: { color: darkMode ? "#374151" : "#e5e7eb" } 
                    },
                    y: { 
                      ticks: { color: darkMode ? "#9ca3af" : "#6b7280" }, 
                      grid: { color: darkMode ? "#374151" : "#e5e7eb" },
                      beginAtZero: true
                    },
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Animal Types */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Animals by Type</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredAnimalTypes.length} of {animalTypes.length} types
            </span>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAnimalTypes.map(type => (
              <div
                key={type._id}
                onClick={() => navigate(`/AnimalProductivity/${type.name.toLowerCase()}`)}
                className={`cursor-pointer overflow-hidden rounded-lg shadow-md transition-all hover:shadow-lg ${
                  darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
                }`}
              >
                <img
                  src={type.bannerImage ? `http://localhost:5000${type.bannerImage}` : "/images/default.jpg"}
                  alt={type.name}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white truncate">{type.name}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                      {type.totalCount}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                    Management: <span className="capitalize">{type.managementType}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    {getMainProductivityMetrics(type)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}