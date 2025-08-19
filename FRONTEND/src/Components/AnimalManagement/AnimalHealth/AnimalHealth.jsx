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
    document.title = "Animal Health Dashboard";
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

      // Calculate male/female
      const maleCount = allAnimals.filter(a => a.data?.gender === "Male").length;
      const femaleCount = allAnimals.filter(a => a.data?.gender === "Female").length;
      setGenderStats({ male: maleCount, female: femaleCount });

      const typesWithStats = types.map(type => {
        const animalsOfType = allAnimals.filter(a => a.type._id === type._id);

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
        overallHealthStats[status] = allAnimals.filter(a => a.data?.healthStatus === status).length;
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

  const genderChartData = {
    labels: ["Male", "Female"],
    datasets: [
      {
        label: "Animals by Gender",
        data: [genderStats.male, genderStats.female],
        backgroundColor: ["#3b82f6", "#ec4899"],
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

  return (
    <div className={`h-full ${darkMode ? "bg-gray-900" : "bg-[#f7e9cb]"}`}>
      <div className="p-5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Animal Health Dashboard</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate("/emergency")}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              Emergency Protocol
            </button>
            <button 
              onClick={() => navigate("/medical-support")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
              </svg>
              Medical Support
            </button>
          </div>
        </div>

        {/* Emergency Summary Section */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Emergency Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg border-l-4 border-red-500">
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
            
            <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg border-l-4 border-orange-500">
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
            
            <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg border-l-4 border-amber-500">
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

        {/* Reproductive & Vaccination Status */}
        <section className={`p-5 rounded-xl shadow-sm mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Reproductive Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(reproductiveStats).map(([status, count]) => (
              <div 
                key={status} 
                className={`p-3 rounded-lg text-center ${
                  darkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-300">{status}</p>
                <p className="font-bold text-gray-800 dark:text-white">{count}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-4 text-gray-800 dark:text-white">Vaccination Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(vaccinationStats).map(([status, count]) => (
              <div 
                key={status} 
                className={`p-3 rounded-lg text-center ${
                  darkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-300">{status}</p>
                <p className="font-bold text-gray-800 dark:text-white">{count}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Animal Types - Prioritized by Emergency Status */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Animals by Type</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Sorted by emergency cases
            </span>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {animalTypes.map(type => (
              <div
                key={type._id}
                onClick={() => navigate(`/HealthReport/${type.name.toLowerCase()}`)}
                className={`cursor-pointer overflow-hidden rounded-lg shadow-md transition-all hover:shadow-lg ${
                  darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
                }`}
              >
                <div className="relative">
                  <img
                    src={type.bannerImage ? `http://localhost:5000${type.bannerImage}` : "/images/default.jpg"}
                    alt={type.name}
                    className="w-full h-32 object-cover"
                  />
                  {type.emergencyCount > 0 && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {type.emergencyCount} Emergency
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white truncate">{type.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      type.emergencyCount > 0 ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200" : 
                      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                    }`}>
                      {type.totalCount}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1">
                    {healthStatusPriority.slice(0, 4).map(status => (
                      type.healthCounts[status] > 0 && (
                        <div key={status} className={`flex items-center justify-between p-1 rounded text-xs ${getStatusColor(status)}`}>
                          <span className="truncate">{status.split(" ")[0]}</span>
                          <span className="font-bold ml-1">{type.healthCounts[status]}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Animals</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{animals.length}</div>
          </div>
          <div className={`p-4 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Male</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{genderStats.male}</div>
          </div>
          <div className={`p-4 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Female</div>
            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{genderStats.female}</div>
          </div>
          <div className={`p-4 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Critical/Deceased</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {(healthStats.Critical || 0) + (healthStats.Deceased || 0)}
            </div>
          </div>
        </div>

        {/* Health Status Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className={`p-5 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Health Status Distribution</h3>
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

          <div className={`p-5 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Gender Distribution</h3>
            <div className="h-64">
              <Pie 
                data={genderChartData} 
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
      </div>
    </div>
  );
}