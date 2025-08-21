import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.js";
import { QRCodeCanvas } from "qrcode.react";
import { Bar, Line, Pie } from "react-chartjs-2";
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
  const { type } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const [animals, setAnimals] = useState([]);
  const [batches, setBatches] = useState([]);
  const [animalType, setAnimalType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [popup, setPopup] = useState({
    show: false,
    success: true,
    message: "",
    type: "",
  });
  const [zones, setZones] = useState([]);
  const [moveZoneId, setMoveZoneId] = useState("");
  const [animalToMove, setAnimalToMove] = useState(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [batchFilter, setBatchFilter] = useState("");

  // Performance charts
  const [showPerformanceCharts, setShowPerformanceCharts] = useState(false);
  const [selectedAnimalForChart, setSelectedAnimalForChart] = useState(null);
  const [selectedBatchForChart, setSelectedBatchForChart] = useState(null);
  const [performanceData, setPerformanceData] = useState({});
  const [viewMode, setViewMode] = useState("individual"); // 'individual' or 'batch'

  useEffect(() => {
    document.title = `${type} Productivity Dashboard`;
  }, [type]);

  // Fetch zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await fetch("http://localhost:5000/zones");
        if (res.ok) {
          const data = await res.json();
          setZones(data.zones || []);
        }
      } catch (err) {
        console.error("Failed to fetch zones:", err);
      }
    };
    fetchZones();
  }, []);

  // Fetch batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await fetch("http://localhost:5000/batches");
        if (res.ok) {
          const data = await res.json();
          setBatches(data.batches || []);
        }
      } catch (err) {
        console.error("Failed to fetch batches:", err);
      }
    };
    fetchBatches();
  }, []);

  // ------------------ FETCH DATA ------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const typeRes = await fetch(`http://localhost:5000/animal-types/${type}`);
      if (!typeRes.ok) throw new Error(`Animal type not found`);
      const typeData = await typeRes.json();
      setAnimalType(typeData);

      // Initialize editData for Productivity Info only
      const productivityCategory = typeData.categories.find(
        (cat) => cat.name === "Productivity Info"
      );
      const initialEditData = {};
      if (productivityCategory)
        productivityCategory.fields.forEach(
          (field) => (initialEditData[field.name] = "")
        );
      setEditData(initialEditData);

      const animalsRes = await fetch(
        `http://localhost:5000/animals?type=${typeData._id}`
      );
      if (!animalsRes.ok) throw new Error("Failed to fetch animals");
      const animalsData = await animalsRes.json();
      setAnimals(animalsData || []);

      // Generate mock performance data for demonstration
      const mockPerformanceData = {};
      animalsData.forEach(animal => {
        const productivityFields = getProductivityFields(typeData);
        mockPerformanceData[animal._id] = {};
        
        productivityFields.forEach(field => {
          // Generate mock historical data for each productivity field
          mockPerformanceData[animal._id][field.name] = Array.from({length: 12}, (_, i) => ({
            date: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            value: Math.floor(Math.random() * 100) + 10
          }));
        });
      });
      
      setPerformanceData(mockPerformanceData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  const showPopup = (message, success = true, type = "save") => {
    setPopup({ show: true, message, success, type });
    if (type === "save")
      setTimeout(() => setPopup({ ...popup, show: false }), 2500);
  };

  const handleEdit = (animal) => {
    setEditId(animal._id);
    const editValues = {};
    Object.keys(editData).forEach(
      (key) => (editValues[key] = animal.data[key] || "")
    );
    setEditData(editValues);
  };

  const handleUpdate = async (id) => {
    const emptyFields = Object.entries(editData)
      .filter(([key, value]) => !value || value.toString().trim() === "")
      .map(([key]) => key);

    if (emptyFields.length > 0) {
      showPopup(
        `Please fill all fields before saving. Missing: ${emptyFields.join(", ")}`,
        false,
        "error"
      );
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/animals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: editData, updatedAt: Date.now() }),
      });
      if (!res.ok) throw new Error("Failed to update animal");
      const updatedAnimal = await res.json();
      setAnimals((prev) => prev.map((a) => (a._id === id ? updatedAnimal : a)));
      setEditId(null);
      showPopup("Animal productivity updated successfully!");
    } catch (err) {
      showPopup(err.message, false, "error");
    }
  };

  // Get productivity fields from animal type
  const getProductivityFields = (typeData) => {
    const productivityCategory = typeData?.categories?.find(
      (cat) => cat.name === "Productivity Info"
    );
    return productivityCategory?.fields || [];
  };

  // ------------------ PRODUCTIVITY INFO FIELDS ------------------
  const productivityFields = getProductivityFields(animalType);

  // ------------------ SEARCH & FILTER LOGIC ------------------
  const handleFilterChange = (field, value) => {
    setFilterValues({ ...filterValues, [field]: value });
  };

  const filteredAnimals = animals.filter((animal) => {
    const matchesSearch = searchQuery
      ? Object.values(animal.data).some((val) =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        ) || animal.animalId.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesFilters = Object.keys(filterValues).every((key) => {
      if (!filterValues[key]) return true;
      const val = animal.data[key] || "";
      if (productivityFields.find((f) => f.name === key)?.type === "number") {
        return Number(val) === Number(filterValues[key]);
      }
      return String(val)
        .toLowerCase()
        .includes(filterValues[key].toLowerCase());
    });

    const matchesBatch = batchFilter 
      ? animal.batchId === batchFilter 
      : true;

    return matchesSearch && matchesFilters && matchesBatch;
  });

  // ------------------ BATCH PERFORMANCE CALCULATIONS ------------------
  const calculateBatchPerformance = (batchId) => {
    const batchAnimals = animals.filter(animal => animal.batchId === batchId);
    if (batchAnimals.length === 0) return null;
    
    const performance = {};
    
    productivityFields.forEach(field => {
      const values = batchAnimals
        .map(animal => parseFloat(animal.data[field.name] || 0))
        .filter(val => !isNaN(val));
      
      if (values.length > 0) {
        performance[field.name] = {
          average: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    });
    
    return performance;
  };

  // ------------------ CHART FUNCTIONS ------------------
  const getPerformanceChartData = (animalId, fieldName) => {
    if (!performanceData[animalId] || !performanceData[animalId][fieldName]) {
      return {
        labels: [],
        datasets: []
      };
    }

    const data = performanceData[animalId][fieldName];
    return {
      labels: data.map(item => item.date),
      datasets: [
        {
          label: fieldName,
          data: data.map(item => item.value),
          borderColor: darkMode ? 'rgb(94, 234, 212)' : 'rgb(13, 148, 136)',
          backgroundColor: darkMode ? 'rgba(94, 234, 212, 0.2)' : 'rgba(13, 148, 136, 0.2)',
          tension: 0.1,
          fill: true
        }
      ]
    };
  };

  const getPerformanceBarData = (animalId) => {
    if (!animalId || !animals.find(a => a._id === animalId)) {
      return {
        labels: [],
        datasets: []
      };
    }

    const animal = animals.find(a => a._id === animalId);
    const fieldValues = productivityFields.map(field => ({
      field: field.label,
      value: animal.data[field.name] || 0
    }));

    return {
      labels: fieldValues.map(item => item.field),
      datasets: [
        {
          label: 'Current Values',
          data: fieldValues.map(item => item.value),
          backgroundColor: darkMode ? [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
          ] : [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 159, 64, 0.5)',
          ],
          borderColor: darkMode ? [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)',
            'rgb(255, 159, 64)',
          ] : [
            'rgb(220, 38, 38)',
            'rgb(37, 99, 235)',
            'rgb(234, 179, 8)',
            'rgb(13, 148, 136)',
            'rgb(126, 34, 206)',
            'rgb(234, 88, 12)',
          ],
          borderWidth: 1
        }
      ]
    };
  };

  const getBatchComparisonData = () => {
    const batchPerformance = {};
    
    batches.forEach(batch => {
      if (batch.animalType === animalType?._id) {
        batchPerformance[batch._id] = calculateBatchPerformance(batch._id);
      }
    });
    
    // For simplicity, just compare the first productivity field across batches
    const firstField = productivityFields[0]?.name;
    if (!firstField) return { labels: [], datasets: [] };
    
    const validBatches = Object.entries(batchPerformance)
      .filter(([_, perf]) => perf && perf[firstField])
      .map(([batchId, perf]) => ({
        batchId,
        name: batches.find(b => b._id === batchId)?.name || batchId,
        value: perf[firstField].average
      }));
    
    return {
      labels: validBatches.map(b => b.name),
      datasets: [
        {
          label: `Average ${productivityFields[0]?.label}`,
          data: validBatches.map(b => b.value),
          backgroundColor: darkMode ? [
            'rgba(94, 234, 212, 0.7)',
            'rgba(134, 239, 172, 0.7)',
            'rgba(253, 230, 138, 0.7)',
            'rgba(252, 165, 165, 0.7)',
            'rgba(196, 181, 253, 0.7)',
          ] : [
            'rgba(13, 148, 136, 0.7)',
            'rgba(34, 197, 94, 0.7)',
            'rgba(234, 179, 8, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(139, 92, 246, 0.7)',
          ],
          borderColor: darkMode ? [
            'rgb(94, 234, 212)',
            'rgb(134, 239, 172)',
            'rgb(253, 230, 138)',
            'rgb(252, 165, 165)',
            'rgb(196, 181, 253)',
          ] : [
            'rgb(13, 148, 136)',
            'rgb(34, 197, 94)',
            'rgb(234, 179, 8)',
            'rgb(239, 68, 68)',
            'rgb(139, 92, 246)',
          ],
          borderWidth: 1
        }
      ]
    };
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-dark-gray dark:text-dark-text">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-btn-teal"></div>
        <p className="ml-4 text-lg">Loading {type} productivity data...</p>
      </div>
    );

  if (error || !animalType)
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-dark-gray dark:text-dark-text">
          {error ? `Error Loading ${type}` : "Animal Type Not Found"}
        </h2>
        <p className="text-red-500 dark:text-btn-red mb-4">
          {error || `The animal type "${type}" could not be loaded.`}
        </p>
        {error && (
          <button
            className="px-4 py-2 rounded bg-btn-blue text-white hover:bg-blue-700 transition-colors mr-2"
            onClick={fetchData}
          >
            Retry
          </button>
        )}
        <button
          className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors"
          onClick={() => navigate("/AnimalManagement")}
        >
          Back to Management
        </button>
      </div>
    );

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-dark-bg" : "bg-gray-50"}`}>
      <main className="p-5 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div>
            <h2 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
              {animalType.name} Productivity Dashboard
            </h2>
            <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Monitor and manage productivity metrics for {animalType.name.toLowerCase()}s
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === "individual" ? "batch" : "individual")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "individual" 
                  ? "bg-btn-blue text-white hover:bg-blue-700" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {viewMode === "individual" ? "Individual View" : "Batch View"}
            </button>
            
            <button
              onClick={() => setShowPerformanceCharts(!showPerformanceCharts)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showPerformanceCharts 
                  ? "bg-btn-teal text-white hover:bg-teal-700" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {showPerformanceCharts ? "Hide Analytics" : "Show Analytics"}
            </button>
          </div>
        </div>

        {/* Performance Charts Section */}
        {showPerformanceCharts && (
          <div className={`mb-6 p-6 rounded-xl ${darkMode ? "bg-dark-card" : "bg-white"} shadow-lg transition-all duration-300`}>
            <h3 className="text-xl font-semibold mb-6 dark:text-white flex items-center">
              <span className="mr-2">📊</span> Performance Analytics
            </h3>
            
            {viewMode === "individual" ? (
              <>
                <div className="mb-6">
                  <label className="block mb-2 dark:text-gray-300 font-medium">Select Animal:</label>
                  <select
                    value={selectedAnimalForChart || ""}
                    onChange={(e) => setSelectedAnimalForChart(e.target.value)}
                    className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-gray dark:text-white w-full md:w-1/3 focus:ring-2 focus:ring-btn-teal focus:border-transparent transition-colors"
                  >
                    <option value="">-- Select an animal --</option>
                    {filteredAnimals.map(animal => (
                      <option key={animal._id} value={animal._id}>
                        {animal.data.name || `ID: ${animal.animalId}`}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedAnimalForChart && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Current Performance Bar Chart */}
                    <div className={`p-5 rounded-xl ${darkMode ? "bg-dark-gray" : "bg-gray-50"} shadow-inner`}>
                      <h4 className="text-lg font-medium mb-4 dark:text-white flex items-center">
                        <span className="mr-2">📈</span> Current Performance Metrics
                      </h4>
                      <div className="h-72">
                        <Bar
                          data={getPerformanceBarData(selectedAnimalForChart)}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                labels: {
                                  color: darkMode ? "#e5e7eb" : "#4b5563",
                                  font: {
                                    size: 14
                                  }
                                }
                              },
                              title: {
                                display: true,
                                color: darkMode ? "#e5e7eb" : "#4b5563",
                                font: {
                                  size: 16
                                }
                              }
                            },
                            scales: {
                              x: {
                                ticks: {
                                  color: darkMode ? "#9ca3af" : "#6b7280",
                                  font: {
                                    size: 12
                                  }
                                },
                                grid: {
                                  color: darkMode ? "#374151" : "#e5e7eb"
                                }
                              },
                              y: {
                                ticks: {
                                  color: darkMode ? "#9ca3af" : "#6b7280",
                                  font: {
                                    size: 12
                                  }
                                },
                                grid: {
                                  color: darkMode ? "#374151" : "#e5e7eb"
                                },
                                beginAtZero: true
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Historical Performance Line Charts */}
                    <div className={`p-5 rounded-xl ${darkMode ? "bg-dark-gray" : "bg-gray-50"} shadow-inner`}>
                      <h4 className="text-lg font-medium mb-4 dark:text-white flex items-center">
                        <span className="mr-2">🔄</span> Historical Trends
                      </h4>
                      <div className="mb-4">
                        <label className="block mb-2 dark:text-gray-300 font-medium">Select Metric:</label>
                        <select
                          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-white w-full focus:ring-2 focus:ring-btn-teal focus:border-transparent transition-colors"
                          onChange={(e) => {/* You can implement metric selection here */}}
                        >
                          {productivityFields.map(field => (
                            <option key={field.name} value={field.name}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="h-64">
                        <Line
                          data={getPerformanceChartData(selectedAnimalForChart, productivityFields[0]?.name)}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                labels: {
                                  color: darkMode ? "#e5e7eb" : "#4b5563",
                                  font: {
                                    size: 14
                                  }
                                }
                              }
                            },
                            scales: {
                              x: {
                                ticks: {
                                  color: darkMode ? "#9ca3af" : "#6b7280",
                                  font: {
                                    size: 12
                                  }
                                },
                                grid: {
                                  color: darkMode ? "#374151" : "#e5e7eb"
                                }
                              },
                              y: {
                                ticks: {
                                  color: darkMode ? "#9ca3af" : "#6b7280",
                                  font: {
                                    size: 12
                                  }
                                },
                                grid: {
                                  color: darkMode ? "#374151" : "#e5e7eb"
                                },
                                beginAtZero: true
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block mb-2 dark:text-gray-300 font-medium">Select Batch:</label>
                  <select
                    value={selectedBatchForChart || ""}
                    onChange={(e) => setSelectedBatchForChart(e.target.value)}
                    className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-gray dark:text-white w-full md:w-1/3 focus:ring-2 focus:ring-btn-teal focus:border-transparent transition-colors"
                  >
                    <option value="">-- Select a batch --</option>
                    {batches.filter(b => b.animalType === animalType._id).map(batch => (
                      <option key={batch._id} value={batch._id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Batch Comparison Chart */}
                  <div className={`p-5 rounded-xl ${darkMode ? "bg-dark-gray" : "bg-gray-50"} shadow-inner`}>
                    <h4 className="text-lg font-medium mb-4 dark:text-white flex items-center">
                      <span className="mr-2">📊</span> Batch Performance Comparison
                    </h4>
                    <div className="h-72">
                      <Bar
                        data={getBatchComparisonData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              labels: {
                                color: darkMode ? "#e5e7eb" : "#4b5563",
                                font: {
                                  size: 14
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              ticks: {
                                color: darkMode ? "#9ca3af" : "#6b7280",
                                font: {
                                  size: 12
                                }
                              },
                              grid: {
                                color: darkMode ? "#374151" : "#e5e7eb"
                              }
                            },
                            y: {
                              ticks: {
                                color: darkMode ? "#9ca3af" : "#6b7280",
                                font: {
                                  size: 12
                                }
                              },
                              grid: {
                                color: darkMode ? "#374151" : "#e5e7eb"
                              },
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Batch Summary */}
                  <div className={`p-5 rounded-xl ${darkMode ? "bg-dark-gray" : "bg-gray-50"} shadow-inner`}>
                    <h4 className="text-lg font-medium mb-4 dark:text-white flex items-center">
                      <span className="mr-2">ℹ️</span> Batch Summary
                    </h4>
                    {selectedBatchForChart && calculateBatchPerformance(selectedBatchForChart) ? (
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium dark:text-gray-300 mb-2">Batch: {batches.find(b => b._id === selectedBatchForChart)?.name}</h5>
                          <p className="text-sm dark:text-gray-400">
                            {animals.filter(a => a.batchId === selectedBatchForChart).length} animals
                          </p>
                        </div>
                        
                        {Object.entries(calculateBatchPerformance(selectedBatchForChart)).map(([field, data]) => {
                          const fieldLabel = productivityFields.find(f => f.name === field)?.label || field;
                          return (
                            <div key={field} className="p-3 rounded-lg bg-opacity-20 bg-btn-teal">
                              <h6 className="font-medium dark:text-white">{fieldLabel}</h6>
                              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Avg</div>
                                  <div className="font-semibold dark:text-white">{data.average.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Min</div>
                                  <div className="font-semibold dark:text-white">{data.min.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Max</div>
                                  <div className="font-semibold dark:text-white">{data.max.toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="dark:text-gray-400 italic">Select a batch to view performance summary</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-100 dark:bg-dark-card rounded-xl shadow-sm items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by any field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-btn-teal focus:border-transparent transition-colors"
            />
          </div>
          
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-white focus:outline-none focus:ring-2 focus:ring-btn-teal focus:border-transparent transition-colors"
          >
            <option value="">All Batches</option>
            {batches.filter(b => b.animalType === animalType._id).map(batch => (
              <option key={batch._id} value={batch._id}>
                {batch.name}
              </option>
            ))}
          </select>
          
          {productivityFields.slice(0, 2).map((field) => (
            <input
              key={field.name}
              type={
                field.type === "number"
                  ? "number"
                  : field.type === "date"
                  ? "date"
                  : "text"
              }
              placeholder={`Filter by ${field.label}`}
              value={filterValues[field.name] || ""}
              onChange={(e) => handleFilterChange(field.name, e.target.value)}
              className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-white focus:outline-none focus:ring-2 focus:ring-btn-teal focus:border-transparent transition-colors"
            />
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-xl shadow-md ${darkMode ? "bg-dark-card" : "bg-white"} border-l-4 border-btn-teal`}>
            <h3 className="text-lg font-semibold dark:text-white">Total Animals</h3>
            <p className="text-3xl font-bold dark:text-white mt-2">{filteredAnimals.length}</p>
          </div>
          
          {productivityFields.slice(0, 2).map(field => {
            const values = filteredAnimals
              .map(animal => parseFloat(animal.data[field.name] || 0))
              .filter(val => !isNaN(val));
              
            const average = values.length > 0 
              ? values.reduce((sum, val) => sum + val, 0) / values.length 
              : 0;
              
            return (
              <div key={field.name} className={`p-4 rounded-xl shadow-md ${darkMode ? "bg-dark-card" : "bg-white"} border-l-4 border-btn-blue`}>
                <h3 className="text-lg font-semibold dark:text-white">Avg. {field.label}</h3>
                <p className="text-3xl font-bold dark:text-white mt-2">{average.toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        {/* Productivity Table */}
        <div
          className={`overflow-x-auto rounded-xl shadow-lg ${
            darkMode ? "bg-dark-card" : "bg-white"
          } transition-colors duration-300`}
        >
          <table className="w-full table-auto border-separate border-spacing-0 text-sm">
            <thead
              className={
                darkMode
                  ? "bg-dark-gray text-white sticky top-0"
                  : "bg-gray-100 text-gray-800 font-semibold sticky top-0"
              }
            >
              <tr>
                <th className="p-4 text-left rounded-tl-xl">ID & QR</th>
                <th className="p-4 text-left">Batch</th>
                <th className="p-4 text-left">Zone</th>
                {productivityFields.map((field, idx) => (
                  <th key={idx} className="p-4 text-left">
                    {field.label}
                  </th>
                ))}
                <th className="p-4 text-left rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnimals.length === 0 ? (
                <tr>
                  <td
                    colSpan={productivityFields.length + 4}
                    className="p-6 text-center italic text-gray-500 dark:text-gray-400"
                  >
                    No matching {animalType.name} found.
                  </td>
                </tr>
              ) : (
                filteredAnimals.map((animal, index) => (
                  <tr
                    key={animal._id}
                    className={`${
                      darkMode 
                        ? index % 2 === 0 ? "bg-dark-card" : "bg-dark-gray" 
                        : index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:${darkMode ? "bg-gray-700" : "bg-gray-100"} transition-colors duration-150`}
                  >
                    <td className="p-4">
                      <div className="flex items-center">
                        {animal.qrCode ? (
                          <QRCodeCanvas 
                            value={animal.qrCode} 
                            size={50} 
                            level="H" 
                            bgColor={darkMode ? "#1f2937" : "#ffffff"}
                            fgColor={darkMode ? "#f3f4f6" : "#111827"}
                          />
                        ) : (
                          "-"
                        )}
                        <div className="ml-2">
                          <div className="font-medium dark:text-white">{animal.animalId}</div>
                          {animal.data.name && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{animal.data.name}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      {animal.batchId 
                        ? batches.find(b => b._id === animal.batchId)?.name || "Unknown"
                        : "Not assigned"}
                    </td>

                    <td className="p-4">
                      {animal.assignedZone
                        ? zones.find((z) => z._id === animal.assignedZone)?.name ||
                          "Unknown"
                        : "Not assigned"}
                    </td>

                    {productivityFields.map((field, idx) => (
                      <td key={idx} className="p-4">
                        {editId === animal._id ? (
                          <input
                            type={field.type === "number" ? "number" : "text"}
                            value={editData[field.name] || ""}
                            onChange={(e) =>
                              setEditData({ ...editData, [field.name]: e.target.value })
                            }
                            className={`w-full p-2 rounded-lg border ${
                              darkMode
                                ? "bg-dark-gray border-gray-600 text-white"
                                : "border-gray-300"
                            } focus:outline-none focus:ring-1 focus:ring-btn-teal transition-colors`}
                          />
                        ) : (
                          <span className="dark:text-white">{animal.data[field.name] || "-"}</span>
                        )}
                      </td>
                    ))}

                    <td className="p-4">
                      <div className="flex space-x-2">
                        {editId === animal._id ? (
                          <>
                            <button
                              onClick={() => handleUpdate(animal._id)}
                              className="px-3 py-2 rounded-lg bg-btn-teal text-white hover:bg-teal-700 transition-colors flex items-center"
                              title="Save Changes"
                            >
                              <span className="mr-1">💾</span> Save
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="px-3 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors flex items-center"
                              title="Cancel Editing"
                            >
                              <span className="mr-1">✖</span> Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEdit(animal)}
                            className="px-3 py-2 rounded-lg bg-btn-blue text-white hover:bg-blue-700 transition-colors flex items-center"
                            title="Edit Productivity Data"
                          >
                            <span className="mr-1">✏️</span> Edit
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setSelectedAnimalForChart(animal._id);
                            setShowPerformanceCharts(true);
                            setViewMode("individual");
                          }}
                          className="px-3 py-2 rounded-lg bg-btn-teal text-white hover:bg-teal-700 transition-colors flex items-center"
                          title="View Performance Charts"
                        >
                          <span className="mr-1">📊</span> Analytics
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Enhanced Popup */}
      {popup.show && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 backdrop-blur-sm transition-all duration-300">
          <div
            className={`p-6 rounded-2xl w-96 max-w-[90%] text-center shadow-2xl transform transition-all duration-300 scale-95 animate-popIn border-l-4 ${
              popup.success
                ? "border-btn-teal bg-white dark:bg-dark-card"
                : popup.type === "delete"
                ? "border-yellow-400 bg-white dark:bg-dark-card"
                : "border-red-500 bg-white dark:bg-dark-card"
            }`}
          >
            <div className={`text-4xl mb-3 ${popup.success ? "text-btn-teal" : "text-red-500"}`}>
              {popup.success ? "✅" : "❌"}
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              {popup.success ? "Success" : "Error"}
            </h3>
            <p className={`mb-5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{popup.message}</p>
            <button
              onClick={() => setPopup({ ...popup, show: false })}
              className="px-5 py-2 rounded-lg bg-btn-teal text-white hover:bg-teal-700 transition-colors w-full"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}