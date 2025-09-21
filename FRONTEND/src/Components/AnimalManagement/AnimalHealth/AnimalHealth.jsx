import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.js";
import { useLoader } from "../contexts/LoaderContext.js";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  AlertTriangle,
  Activity,
  Heart,
  Shield,
  TrendingUp,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Search,
  ChevronRight,
  BarChart3,
  PieChart
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AnimalHealth() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading: setGlobalLoading } = useLoader();

  const [animalTypes, setAnimalTypes] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [healthStats, setHealthStats] = useState({});
  const [reproductiveStats, setReproductiveStats] = useState({});
  const [vaccinationStats, setVaccinationStats] = useState({});
  const [genderStats, setGenderStats] = useState({ male: 0, female: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("emergency");

  // Prioritized health statuses - emergency first
  const healthStatusPriority = [
    "Critical", 
    "In Treatment",
    "Quarantined",
    "Injured",
    "Sick",
    "Healthy",
    "Recovered",
    "Deceased"
  ];

  useEffect(() => {
    document.title = "Animal Health - Animal Manager";
    fetchData();
  }, []);
  

  const fetchData = async () => {
    try {
      setGlobalLoading(true);
      const typesRes = await axios.get("http://localhost:5000/animal-types");
      const animalsRes = await axios.get("http://localhost:5000/animals");

      const types = typesRes.data;
      const allAnimals = animalsRes.data;
      
      // Filter out animals with null types to prevent errors
      const validAnimals = allAnimals.filter(a => a.type !== null);
      setAnimals(validAnimals);

      // Log animals with null types for debugging
      const animalsWithNullTypes = allAnimals.filter(a => a.type === null);
      if (animalsWithNullTypes.length > 0) {
        console.warn(`Found ${animalsWithNullTypes.length} animals with null types`);
        console.warn("Animal IDs with null types:", animalsWithNullTypes.map(a => a.animalId));
      }

      // Calculate male/female
      const maleCount = validAnimals.filter(a => a.data?.gender === "Male").length;
      const femaleCount = validAnimals.filter(a => a.data?.gender === "Female").length;
      setGenderStats({ male: maleCount, female: femaleCount });

      const typesWithStats = types.map(type => {
        const animalsOfType = validAnimals.filter(a => a.type._id === type._id);

        // Health counts for prioritized statuses
        const healthCounts = {};
        healthStatusPriority.forEach(status => {
          healthCounts[status] = animalsOfType.filter(a => a.data?.healthStatus === status).length;
        });

        const reproductive = {
          "Not Pregnant": animalsOfType.filter(a => a.data?.reproductiveStatus === "Not Pregnant").length,
          "Pregnant": animalsOfType.filter(a => a.data?.reproductiveStatus === "Pregnant").length,
          "Lactating": animalsOfType.filter(a => a.data?.reproductiveStatus === "Lactating").length,
          "Ready for Breeding": animalsOfType.filter(a => a.data?.reproductiveStatus === "Ready for Breeding").length,
          "Unknown": animalsOfType.filter(a => !a.data?.reproductiveStatus || a.data?.reproductiveStatus === "Unknown").length,
        };

        const vaccination = {
          "Not Vaccinated": animalsOfType.filter(a => a.data?.vaccinations === "Not Vaccinated").length,
          "Partially Vaccinated": animalsOfType.filter(a => a.data?.vaccinations === "Partially Vaccinated").length,
          "Fully Vaccinated": animalsOfType.filter(a => a.data?.vaccinations === "Fully Vaccinated").length,
          "Overdue": animalsOfType.filter(a => a.data?.vaccinations === "Overdue").length,
          "Unknown": animalsOfType.filter(a => !a.data?.vaccinations || a.data?.vaccinations === "Unknown").length,
        };

        return {
          ...type,
          totalCount: animalsOfType.length,
          healthCounts,
          reproductive,
          vaccination,
          bannerImage: type.bannerImage,
          emergencyCount: animalsOfType.filter(a => 
            ["Critical", "In Treatment", "Quarantined"].includes(a.data?.healthStatus)
          ).length
        };
      });

      // Sort animal types by emergency count (highest first)
      typesWithStats.sort((a, b) => b.emergencyCount - a.emergencyCount);

      // Aggregate overall health stats
      const overallHealthStats = {};
      healthStatusPriority.forEach(status => {
        overallHealthStats[status] = validAnimals.filter(a => a.data?.healthStatus === status).length;
      });

      // Aggregate reproductive and vaccination
      const allReproductive = {};
      const allVaccination = {};
      typesWithStats.forEach(t => {
        Object.keys(t.reproductive).forEach(k => {
          allReproductive[k] = (allReproductive[k] || 0) + t.reproductive[k];
        });
        Object.keys(t.vaccination).forEach(k => {
          allVaccination[k] = (allVaccination[k] || 0) + t.vaccination[k];
        });
      });

      setAnimalTypes(typesWithStats);
      setHealthStats(overallHealthStats);
      setReproductiveStats(allReproductive);
      setVaccinationStats(allVaccination);

    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  const healthChartData = {
    labels: healthStatusPriority,
    datasets: [
      {
        label: "Animals",
        data: healthStatusPriority.map(status => healthStats[status] || 0),
        backgroundColor: [
          "#ef4444", // Critical - red
          "#f97316", // In Treatment - orange
          "#f59e0b", // Quarantined - amber
          "#fbbf24", // Injured - yellow
          "#ff9800", // Sick - deep orange
          "#4caf50", // Healthy - green
          "#10b981", // Recovered - emerald
          "#6b7280"  // Deceased - gray
        ],
        borderColor: darkMode ? "#374151" : "#e5e7eb",
        borderWidth: 1
      },
    ],
  };

  const vaccinationChartData = {
    labels: Object.keys(vaccinationStats),
    datasets: [
      {
        label: "Vaccination Status",
        data: Object.values(vaccinationStats),
        backgroundColor: [
          "#3b82f6", // Not Vaccinated - blue
          "#f59e0b", // Partially Vaccinated - amber
          "#10b981", // Fully Vaccinated - green
          "#ef4444", // Overdue - red
          "#9ca3af", // Unknown - gray
        ],
        borderColor: darkMode ? "#374151" : "#e5e7eb",
        borderWidth: 1
      },
    ],
  };

  // Emergency status colors
  const getStatusColor = (status) => {
    switch(status) {
      case "Critical": return "bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500";
      case "In Treatment": return "bg-orange-100 dark:bg-orange-900/50 border-l-4 border-orange-500";
      case "Quarantined": return "bg-amber-100 dark:bg-amber-900/50 border-l-4 border-amber-500";
      case "Injured": return "bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500";
      case "Sick": return "bg-orange-50 dark:bg-orange-800/30 border-l-4 border-orange-400";
      case "Healthy": return "bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500";
      case "Recovered": return "bg-emerald-100 dark:bg-emerald-900/50 border-l-4 border-emerald-500";
      case "Deceased": return "bg-gray-200 dark:bg-gray-700 border-l-4 border-gray-500";
      default: return "bg-gray-100 dark:bg-gray-700 border-l-4 border-gray-400";
    }
  };

  const getStatusIconColor = (status) => {
    switch(status) {
      case "Critical": return "text-red-500";
      case "In Treatment": return "text-orange-500";
      case "Quarantined": return "text-amber-500";
      case "Injured": return "text-yellow-500";
      case "Sick": return "text-orange-400";
      case "Healthy": return "text-green-500";
      case "Recovered": return "text-emerald-500";
      case "Deceased": return "text-gray-500";
      default: return "text-gray-400";
    }
  };

  // Filter and sort animal types
  const filteredAnimalTypes = animalTypes
    .filter(type => 
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "all" || type.emergencyCount > 0)
    )
    .sort((a, b) => {
      if (sortBy === "emergency") return b.emergencyCount - a.emergencyCount;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.totalCount - a.totalCount;
    });

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "light-beige"}`}>
      <div className="p-5">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <Activity className="text-green-500" size={32} />
              Animal Health Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor and manage the health status of all animals in the facility
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className={`p-4 rounded-xl shadow-sm mb-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={20}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="text"
                placeholder="Search animal types..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Filter size={18} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <option value="all">All Statuses</option>
                  <option value="emergency">Emergency Cases Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <option value="emergency">Emergency Priority</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="count">Population Size</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Summary Section */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={24} />
            Emergency Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-xl border-l-4 border-red-500 shadow-sm transition-all hover:shadow-md">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-red-800 dark:text-red-200">Critical Animals</h4>
                <span className="text-2xl font-bold text-red-600 dark:text-red-300">
                  {healthStats.Critical || 0}
                </span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-300 mt-2">
                Immediate attention required
              </p>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-xl border-l-4 border-orange-500 shadow-sm transition-all hover:shadow-md">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-orange-800 dark:text-orange-200">In Treatment</h4>
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-300">
                  {healthStats["In Treatment"] || 0}
                </span>
              </div>
              <p className="text-sm text-orange-600 dark:text-orange-300 mt-2">
                Currently receiving medical care
              </p>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-xl border-l-4 border-amber-500 shadow-sm transition-all hover:shadow-md">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-amber-800 dark:text-amber-200">Quarantined</h4>
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-300">
                  {healthStats.Quarantined || 0}
                </span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-300 mt-2">
                Isolated for observation
              </p>
            </div>
          </div>
        </section>


        {/* Animal Types - Prioritized by Emergency Status */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              Animals by Type
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-full">
                {filteredAnimalTypes.length} types
              </span>
              <span>Sorted by {sortBy === "emergency" ? "emergency cases" : sortBy === "name" ? "name" : "population"}</span>
            </div>
          </div>
          
          {filteredAnimalTypes.length === 0 ? (
            <div className={`p-8 rounded-xl text-center ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <p className="text-gray-500 dark:text-gray-400">No animal types found matching your search criteria.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAnimalTypes.map(type => (
                <div
                  key={type._id}
                  className={`overflow-hidden rounded-xl shadow-md transition-all hover:shadow-lg ${
                    darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={type.bannerImage ? `http://localhost:5000${type.bannerImage}` : "/images/default.jpg"}
                      alt={type.name}
                      className="w-full h-40 object-cover"
                    />
                    {type.emergencyCount > 0 && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {type.emergencyCount} Emergency
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-bold text-gray-800 dark:text-white truncate">{type.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        type.emergencyCount > 0 ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200" : 
                        "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                      }`}>
                        {type.totalCount} animals
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {healthStatusPriority.slice(0, 4).map(status => (
                        type.healthCounts[status] > 0 && (
                          <div key={status} className={`flex items-center justify-between p-2 rounded text-xs ${getStatusColor(status)}`}>
                            <span className="truncate flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${getStatusIconColor(status)}`}></div>
                              {status.split(" ")[0]}
                            </span>
                            <span className="font-bold ml-1">{type.healthCounts[status]}</span>
                          </div>
                        )
                      ))}
                    </div>
                    
                    <button
                      onClick={() => navigate(`/AnimalManagement/HealthReport/${type.name.toLowerCase()}`)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                      View Health Info
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


        {/* Health Status Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className={`p-5 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"} transition-all hover:shadow-md`}>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <BarChart3 size={20} />
              Health Status Distribution
            </h3>
            <div className="h-64">
              <Bar 
                data={healthChartData} 
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: {
                        color: darkMode ? "#f3f4f6" : "#111827"
                      }
                    }
                  },
                  scales: {
                    x: {
                      ticks: {
                        color: darkMode ? "#9ca3af" : "#6b7280"
                      },
                      grid: {
                        color: darkMode ? "#374151" : "#e5e7eb"
                      }
                    },
                    y: {
                      ticks: {
                        color: darkMode ? "#9ca3af" : "#6b7280"
                      },
                      grid: {
                        color: darkMode ? "#374151" : "#e5e7eb"
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>

          <div className={`p-5 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"} transition-all hover:shadow-md`}>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <PieChart size={20} />
              Vaccination Status Distribution
            </h3>
            <div className="h-64">
              <Pie 
                data={vaccinationChartData} 
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: {
                        color: darkMode ? "#f3f4f6" : "#111827"
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Reproductive & Vaccination Status */}
        <div className={`p-5 rounded-xl shadow-sm mb-8 ${darkMode ? "bg-gray-800" : "bg-white"} transition-all hover:shadow-md`}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
            <TrendingUp size={20} />
            Reproductive Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(reproductiveStats).map(([status, count]) => (
              <div 
                key={status} 
                className={`p-3 rounded-lg text-center transition-all hover:scale-105 ${
                  darkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-300">{status}</p>
                <p className="font-bold text-gray-800 dark:text-white">{count}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-4 text-gray-800 dark:text-white flex items-center gap-2">
            <Shield size={20} />
            Vaccination Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(vaccinationStats).map(([status, count]) => (
              <div 
                key={status} 
                className={`p-3 rounded-lg text-center transition-all hover:scale-105 ${
                  darkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-300">{status}</p>
                <p className="font-bold text-gray-800 dark:text-white">{count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}