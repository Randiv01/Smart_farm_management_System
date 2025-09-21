import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useLoader } from "../contexts/LoaderContext";
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

function ProductivityTracker() {
  const { animalId, type } = useParams();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { loading, setLoading } = useLoader();
  
  const [animal, setAnimal] = useState(null);
  const [animalType, setAnimalType] = useState(null);
  const [records, setRecords] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [timeframe, setTimeframe] = useState("month");
  const [groupBy, setGroupBy] = useState("day");
  const [newRecord, setNewRecord] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAnimalData();
    fetchProductivityRecords();
    fetchProductivityAnalytics();
  }, [animalId, type, timeframe, groupBy]);

  const fetchAnimalData = async () => {
    try {
      setLoading(true);
      let url;
      
      if (animalId) {
        url = `http://localhost:5000/animals/${animalId}`;
      } else if (type) {
        url = `http://localhost:5000/animal-types/name/${type}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (animalId) {
        setAnimal(data);
        // Fetch the animal type to get productivity fields
        const typeResponse = await fetch(`http://localhost:5000/animal-types/${data.type}`);
        const typeData = await typeResponse.json();
        setAnimalType(typeData);
        
        // Initialize new record with productivity fields
        const initialRecord = {};
        if (typeData.productivityFields) {
          typeData.productivityFields.forEach(field => {
            initialRecord[field.name] = "";
          });
        }
        setNewRecord(initialRecord);
      } else {
        setAnimalType(data);
        
        // Initialize new record with productivity fields
        const initialRecord = {};
        if (data.productivityFields) {
          data.productivityFields.forEach(field => {
            initialRecord[field.name] = "";
          });
        }
        setNewRecord(initialRecord);
      }
    } catch (error) {
      console.error("Error fetching animal data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductivityRecords = async () => {
    try {
      let url;
      
      if (animalId) {
        url = `http://localhost:5000/productivity/animal/${animalId}`;
      } else if (type) {
        url = `http://localhost:5000/productivity/type/${type}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error("Error fetching productivity records:", error);
    }
  };

  const fetchProductivityAnalytics = async () => {
    try {
      let url = `http://localhost:5000/productivity/analytics?timeframe=${timeframe}&groupBy=${groupBy}`;
      
      if (animalId && animal && animal.type) {
        url += `&animalTypeId=${animal.type}`;
      } else if (type) {
        // Get animal type ID from name
        const typeResponse = await fetch(`http://localhost:5000/animal-types/name/${type}`);
        const typeData = await typeResponse.json();
        url += `&animalTypeId=${typeData._id}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching productivity analytics:", error);
    }
  };

  const handleRecordChange = (fieldName, value) => {
    setNewRecord({
      ...newRecord,
      [fieldName]: value
    });
  };

  const submitRecord = async () => {
    try {
      setLoading(true);
      
      const payload = {
        date,
        ...newRecord
      };
      
      if (animalId) {
        payload.animalId = animalId;
        payload.isGroup = false;
      } else if (type) {
        // For type-wide records, we need to get an animal ID or use batch approach
        // This is a simplified implementation
        payload.animalType = type;
        payload.isGroup = true;
      }
      
      const response = await fetch('http://localhost:5000/productivity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        // Reset form and refresh data
        const initialRecord = {};
        if (animalType.productivityFields) {
          animalType.productivityFields.forEach(field => {
            initialRecord[field.name] = "";
          });
        }
        setNewRecord(initialRecord);
        setDate(new Date().toISOString().split('T')[0]);
        fetchProductivityRecords();
        fetchProductivityAnalytics();
      }
    } catch (error) {
      console.error("Error submitting productivity record:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!analytics || !analytics.analytics || !animalType) return null;
    
    const chartData = {};
    
    // Create datasets for each productivity field
    animalType.productivityFields.forEach(field => {
      chartData[field.name] = {
        labels: analytics.analytics.map(item => item.date),
        datasets: [
          {
            label: field.label,
            data: analytics.analytics.map(item => 
              item.values[field.name] ? item.values[field.name].average : 0
            ),
            backgroundColor: `hsl(${Math.random() * 360}, 70%, 70%)`,
            borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
            borderWidth: 2
          }
        ]
      };
    });
    
    return chartData;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!animalType) {
    return <div>Animal type not found</div>;
  }

  const chartData = prepareChartData();

  return (
    <div className={`p-6 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <h2 className="text-2xl font-bold mb-6">
        {animalId ? `Productivity Tracking for ${animal?.data?.name || animal?.animalId}` : 
                    `Productivity Tracking for ${animalType.name}`}
      </h2>
      
      {/* Filters */}
      <div className={`p-4 rounded-xl mb-6 ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-1">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className={`p-2 rounded border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className={`p-2 rounded border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Productivity Input Form */}
      <div className={`p-6 rounded-xl mb-6 ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
        <h3 className="text-lg font-semibold mb-4">Add New Record</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full p-2 rounded border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {animalType.productivityFields && animalType.productivityFields.map((field, index) => (
            <div key={index}>
              <label className="block text-sm font-medium mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={field.type || "number"}
                value={newRecord[field.name] || ""}
                onChange={(e) => handleRecordChange(field.name, e.target.value)}
                placeholder={`Enter ${field.label} ${field.unit ? `(${field.unit})` : ''}`}
                className={`w-full p-2 rounded border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                required={field.required}
              />
            </div>
          ))}
        </div>
        
        <button
          onClick={submitRecord}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Add Record
        </button>
      </div>
      
      {/* Analytics Charts */}
      {chartData && (
        <div className={`p-6 rounded-xl mb-6 ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
          <h3 className="text-lg font-semibold mb-4">Productivity Analytics</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.keys(chartData).map(fieldName => (
              <div key={fieldName} className="h-80">
                <h4 className="text-md font-medium mb-2 text-center">
                  {animalType.productivityFields.find(f => f.name === fieldName)?.label}
                </h4>
                <Line
                  data={chartData[fieldName]}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const field = animalType.productivityFields.find(f => f.name === fieldName);
                            return `${context.dataset.label}: ${context.parsed.y} ${field.unit}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: animalType.productivityFields.find(f => f.name === fieldName)?.unit || ''
                        }
                      }
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Productivity History */}
      <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
        <h3 className="text-lg font-semibold mb-4">Productivity History</h3>
        
        {records.length === 0 ? (
          <p className="text-gray-500">No productivity records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className={`${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                  <th className="p-2 text-left">Date</th>
                  {animalType.productivityFields && animalType.productivityFields.map((field, index) => (
                    <th key={index} className="p-2 text-left">{field.label}</th>
                  ))}
                  <th className="p-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={index} className={index % 2 === 0 ? (darkMode ? "bg-gray-700" : "bg-gray-50") : ""}>
                    <td className="p-2">{new Date(record.date).toLocaleDateString()}</td>
                    {animalType.productivityFields && animalType.productivityFields.map((field, i) => (
                      <td key={i} className="p-2">
                        {record[field.name] || "N/A"} {field.unit && record[field.name] ? field.unit : ""}
                      </td>
                    ))}
                    <td className="p-2">{record.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductivityTracker;