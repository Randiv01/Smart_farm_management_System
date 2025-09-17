import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X,
  RefreshCw,
  BarChart3,
  AlertCircle,
  Minus
} from "lucide-react";
import { useITheme } from "../Icontexts/IThemeContext";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRefillForm, setShowRefillForm] = useState(false);
  const [showUseForm, setShowUseForm] = useState(false);
  const [editingFertilizer, setEditingFertilizer] = useState(null);
  const [refillingFertilizer, setRefillingFertilizer] = useState(null);
  const [usingFertilizer, setUsingFertilizer] = useState(null);
  const [fertilizerType, setFertilizerType] = useState("All Types");
  const [showChart, setShowChart] = useState(false);
  const [selectedFertilizerForChart, setSelectedFertilizerForChart] = useState(null);
  const [usageData, setUsageData] = useState([]);
  const [refillQuantity, setRefillQuantity] = useState("");
  const [useQuantity, setUseQuantity] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    remaining: "",
    unit: "kg",
    fertilizerType: "Organic",
    shelfLife: "365" // Default 1 year for fertilizer
  });

  // Calculate expiry date based on shelf life
  const calculateExpiryDate = (shelfLifeMonths) => {
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(shelfLifeMonths));
    return expiryDate.toISOString().split('T')[0];
  };

  // Fetch fertilizers from API
  useEffect(() => {
    fetchFertilizers();
  }, []);

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

  const fetchUsageData = async (fertilizerId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/Ifertilizerstock/usage/${fertilizerId}`);
      setUsageData(response.data);
    } catch (error) {
      console.error("Error fetching usage data:", error);
      setError("Failed to load usage data.");
    }
  };

  const filteredFertilizers = fertilizers.filter(fertilizer =>
    fertilizer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fertilizer.fertilizerType.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      shelfLife: "365" // Default value for editing
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
      } else {
        await axios.post("http://localhost:5000/api/Ifertilizerstock", payload);
      }
      
      setShowAddForm(false);
      setEditingFertilizer(null);
      setFormData({
        name: "",
        quantity: "",
        remaining: "",
        unit: "kg",
        fertilizerType: "Organic",
        shelfLife: "365"
      });
      fetchFertilizers();
    } catch (error) {
      console.error("Error saving fertilizer:", error);
      setError("Failed to save fertilizer. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this fertilizer?")) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:5000/api/Ifertilizerstock/${id}`);
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
    
    try {
      await axios.patch(`http://localhost:5000/api/Ifertilizerstock/refill/${refillingFertilizer._id}`, {
        refillQuantity: parseInt(refillQuantity)
      });
      
      setShowRefillForm(false);
      setRefillingFertilizer(null);
      setRefillQuantity("");
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
    
    try {
      await axios.patch(`http://localhost:5000/api/Ifertilizerstock/use/${usingFertilizer._id}`, {
        quantityUsed: parseInt(useQuantity),
        recordedBy: "User"
      });
      
      setShowUseForm(false);
      setUsingFertilizer(null);
      setUseQuantity("");
      fetchFertilizers();
    } catch (error) {
      console.error("Error recording usage:", error);
      setError("Failed to record usage. Please try again.");
    }
  };

  const handleShowChart = async (fertilizer) => {
    setSelectedFertilizerForChart(fertilizer);
    await fetchUsageData(fertilizer._id);
    setShowChart(true);
  };

  const chartData = {
    labels: usageData.map(data => data.month),
    datasets: [
      {
        label: 'Usage Rate',
        data: usageData.map(data => data.usage),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Monthly Usage Rate for ${selectedFertilizerForChart?.name || ''}`
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantity Used'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month'
        }
      }
    }
  };

  if (loading) {
    return (
      <div className={`min-h-full p-6 flex items-center justify-center ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4">Loading fertilizers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Fertilizer Stock</h1>
        <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Manage fertilizer inventory and track usage
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${darkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"}`}>
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {/* Search and Actions */}
      <div className={`p-4 rounded-lg shadow-sm mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search
                size={18}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="text"
                placeholder="Search fertilizer name..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              value={fertilizerType}
              onChange={(e) => setFertilizerType(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            >
              <option value="All Types">All Types</option>
              <option value="Organic">Organic</option>
              <option value="Inorganic">Inorganic</option>
              <option value="Liquid">Liquid</option>
              <option value="Granular">Granular</option>
              <option value="Powder">Powder</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchFertilizers}
              className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => {
                setEditingFertilizer(null);
                setFormData({
                  name: "",
                  quantity: "",
                  remaining: "",
                  unit: "kg",
                  fertilizerType: "Organic",
                  shelfLife: "365"
                });
                setShowAddForm(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={16} />
              Add Fertilizer
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className={`rounded-lg shadow-sm overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                FERTILIZER NAME
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                QUANTITY
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                REMAINING
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                UNIT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                TYPE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                EXPIRY DATE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                CREATED DATE
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-200 bg-white"}`}>
            {filteredFertilizers.length > 0 ? (
              filteredFertilizers.map((fertilizer) => (
                <tr key={fertilizer._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{fertilizer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {fertilizer.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {fertilizer.remaining}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {fertilizer.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                      {fertilizer.fertilizerType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(fertilizer.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(fertilizer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleShowChart(fertilizer)}
                      className={`p-1 rounded-md mr-2 ${darkMode ? "text-green-400 hover:bg-gray-700" : "text-green-600 hover:bg-gray-100"}`}
                      title="View Usage Chart"
                    >
                      <BarChart3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleRefill(fertilizer)}
                      className={`p-1 rounded-md mr-2 ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-600 hover:bg-gray-100"}`}
                      title="Refill Stock"
                    >
                      Refill
                    </button>
                    <button 
                      onClick={() => handleUse(fertilizer)}
                      className={`p-1 rounded-md mr-2 ${darkMode ? "text-orange-400 hover:bg-gray-700" : "text-orange-600 hover:bg-gray-100"}`}
                      title="Use Fertilizer"
                    >
                      <Minus size={16} />
                    </button>
                    <button 
                      onClick={() => handleEdit(fertilizer)}
                      className={`p-1 rounded-md mr-2 ${darkMode ? "text-indigo-400 hover:bg-gray-700" : "text-indigo-600 hover:bg-gray-100"}`}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(fertilizer._id)}
                      className={`p-1 rounded-md ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center">
                  No fertilizers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Fertilizer Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingFertilizer ? "Edit Fertilizer" : "Add New Fertilizer"}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingFertilizer(null);
                }}
                className={darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Fertilizer Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  required
                  placeholder="Enter fertilizer name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Total Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                    required
                    min="0"
                    placeholder="Total quantity"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    name="remaining"
                    value={formData.remaining}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                    required
                    min="0"
                    max={formData.quantity}
                    placeholder="Initial stock"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Unit *
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
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
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Fertilizer Type *
                  </label>
                  <select
                    name="fertilizerType"
                    value={formData.fertilizerType}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  >
                    <option value="Organic">Organic</option>
                    <option value="Inorganic">Inorganic</option>
                    <option value="Liquid">Liquid</option>
                    <option value="Granular">Granular</option>
                    <option value="Powder">Powder</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Shelf Life (months) *
                </label>
                <select
                  name="shelfLife"
                  value={formData.shelfLife}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  required
                >
                  <option value="90">3 months</option>
                  <option value="180">6 months</option>
                  <option value="365">1 year</option>
                  <option value="730">2 years</option>
                  <option value="1095">3 years</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Expiry date will be calculated automatically
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingFertilizer(null);
                  }}
                  className={`px-4 py-2 rounded-md ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-lg max-w-md w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Refill {refillingFertilizer.name}</h2>
              <button
                onClick={() => {
                  setShowRefillForm(false);
                  setRefillingFertilizer(null);
                }}
                className={darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRefillSubmit}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Current Stock: {refillingFertilizer.remaining} {refillingFertilizer.unit}
                </label>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Maximum Capacity: {refillingFertilizer.quantity} {refillingFertilizer.unit}
                </label>
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Refill Quantity *
                </label>
                <input
                  type="number"
                  value={refillQuantity}
                  onChange={(e) => setRefillQuantity(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  required
                  min="1"
                  max={refillingFertilizer.quantity - refillingFertilizer.remaining}
                  placeholder="Enter quantity to refill"
                />
                <p className="text-xs text-gray-500 mt-1">
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
                  className={`px-4 py-2 rounded-md ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Refill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Use Modal */}
      {showUseForm && usingFertilizer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-lg max-w-md w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Use {usingFertilizer.name}</h2>
              <button
                onClick={() => {
                  setShowUseForm(false);
                  setUsingFertilizer(null);
                }}
                className={darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUseSubmit}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Current Stock: {usingFertilizer.remaining} {usingFertilizer.unit}
                </label>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Maximum Available: {usingFertilizer.remaining} {usingFertilizer.unit}
                </label>
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Quantity to Use *
                </label>
                <input
                  type="number"
                  value={useQuantity}
                  onChange={(e) => setUseQuantity(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  required
                  min="1"
                  max={usingFertilizer.remaining}
                  placeholder="Enter quantity to use"
                />
                <p className="text-xs text-gray-500 mt-1">
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
                  className={`px-4 py-2 rounded-md ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Use
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chart Modal */}
      {showChart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-lg max-w-2xl w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Usage Chart - {selectedFertilizerForChart?.name}
              </h2>
              <button
                onClick={() => setShowChart(false)}
                className={darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="h-96">
              {usageData.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>No usage data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FertilizerStock;
