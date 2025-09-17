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

const AnimalFoodStock = () => {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  
  const [animalFoods, setAnimalFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRefillForm, setShowRefillForm] = useState(false);
  const [showUseForm, setShowUseForm] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [refillingFood, setRefillingFood] = useState(null);
  const [usingFood, setUsingFood] = useState(null);
  const [targetAnimal, setTargetAnimal] = useState("All Animals");
  const [showChart, setShowChart] = useState(false);
  const [selectedFoodForChart, setSelectedFoodForChart] = useState(null);
  const [consumptionData, setConsumptionData] = useState([]);
  const [refillQuantity, setRefillQuantity] = useState("");
  const [useQuantity, setUseQuantity] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    remaining: "",
    unit: "kg",
    targetAnimal: "All Animals",
    shelfLife: "180" // Default 6 months for animal food
  });

  // Calculate expiry date based on shelf life
  const calculateExpiryDate = (shelfLifeMonths) => {
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(shelfLifeMonths));
    return expiryDate.toISOString().split('T')[0];
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

  const fetchConsumptionData = async (foodId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/animalfood/consumption/${foodId}`);
      setConsumptionData(response.data);
    } catch (error) {
      console.error("Error fetching consumption data:", error);
      setError("Failed to load consumption data.");
    }
  };

  const filteredAnimalFoods = animalFoods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    food.targetAnimal.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      shelfLife: "180" // Default value for editing
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
      } else {
        await axios.post("http://localhost:5000/api/animalfood", payload);
      }
      
      setShowAddForm(false);
      setEditingFood(null);
      setFormData({
        name: "",
        quantity: "",
        remaining: "",
        unit: "kg",
        targetAnimal: "All Animals",
        shelfLife: "180"
      });
      fetchAnimalFoods();
    } catch (error) {
      console.error("Error saving animal food:", error);
      setError("Failed to save animal food. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this animal food?")) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:5000/api/animalfood/${id}`);
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
    
    try {
      await axios.patch(`http://localhost:5000/api/animalfood/refill/${refillingFood._id}`, {
        refillQuantity: parseInt(refillQuantity)
      });
      
      setShowRefillForm(false);
      setRefillingFood(null);
      setRefillQuantity("");
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
    
    try {
      await axios.patch(`http://localhost:5000/api/animalfood/consume/${usingFood._id}`, {
        quantityUsed: parseInt(useQuantity),
        recordedBy: "User" // You can replace this with actual user info
      });
      
      setShowUseForm(false);
      setUsingFood(null);
      setUseQuantity("");
      fetchAnimalFoods();
    } catch (error) {
      console.error("Error recording consumption:", error);
      setError("Failed to record consumption. Please try again.");
    }
  };

  const handleShowChart = async (food) => {
    setSelectedFoodForChart(food);
    await fetchConsumptionData(food._id);
    setShowChart(true);
  };

  const chartData = {
    labels: consumptionData.map(data => data.month),
    datasets: [
      {
        label: 'Consumption Rate',
        data: consumptionData.map(data => data.consumption),
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
        text: `Monthly Consumption Rate for ${selectedFoodForChart?.name || ''}`
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantity Consumed'
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
          <p className="mt-4">Loading animal foods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Animal Food Stock</h1>
        <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Manage animal food inventory and track consumption
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
                placeholder="Search food name..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              value={targetAnimal}
              onChange={(e) => setTargetAnimal(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            >
              <option value="All Animals">All Animals</option>
              <option value="Cows">Cows</option>
              <option value="Chickens">Chickens</option>
              <option value="Goats">Goats</option>
              <option value="Pigs">Pigs</option>
              <option value="Buffaloes">Buffaloes</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAnimalFoods}
              className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => {
                setEditingFood(null);
                setFormData({
                  name: "",
                  quantity: "",
                  remaining: "",
                  unit: "kg",
                  targetAnimal: "All Animals",
                  shelfLife: "180"
                });
                setShowAddForm(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={16} />
              Add Food
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
                FOOD NAME
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
                TARGET ANIMAL
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
            {filteredAnimalFoods.length > 0 ? (
              filteredAnimalFoods.map((food) => (
                <tr key={food._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{food.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {food.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {food.remaining}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {food.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}>
                      {food.targetAnimal}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(food.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(food.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleShowChart(food)}
                      className={`p-1 rounded-md mr-2 ${darkMode ? "text-green-400 hover:bg-gray-700" : "text-green-600 hover:bg-gray-100"}`}
                      title="View Consumption Chart"
                    >
                      <BarChart3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleRefill(food)}
                      className={`p-1 rounded-md mr-2 ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-600 hover:bg-gray-100"}`}
                      title="Refill Stock"
                    >
                      Refill
                    </button>
                    <button 
                      onClick={() => handleUse(food)}
                      className={`p-1 rounded-md mr-2 ${darkMode ? "text-orange-400 hover:bg-gray-700" : "text-orange-600 hover:bg-gray-100"}`}
                      title="Use Food"
                    >
                      <Minus size={16} />
                    </button>
                    <button 
                      onClick={() => handleEdit(food)}
                      className={`p-1 rounded-md mr-2 ${darkMode ? "text-indigo-400 hover:bg-gray-700" : "text-indigo-600 hover:bg-gray-100"}`}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(food._id)}
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
                  No animal foods found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Animal Food Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingFood ? "Edit Animal Food" : "Add New Animal Food"}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingFood(null);
                }}
                className={darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Food Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  required
                  placeholder="Enter food name"
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
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Target Animal *
                  </label>
                  <select
                    name="targetAnimal"
                    value={formData.targetAnimal}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
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
                  <option value="30">1 month</option>
                  <option value="60">2 months</option>
                  <option value="90">3 months</option>
                  <option value="180">6 months</option>
                  <option value="365">1 year</option>
                  <option value="730">2 years</option>
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
                    setEditingFood(null);
                  }}
                  className={`px-4 py-2 rounded-md ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-lg max-w-md w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Refill {refillingFood.name}</h2>
              <button
                onClick={() => {
                  setShowRefillForm(false);
                  setRefillingFood(null);
                }}
                className={darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRefillSubmit}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Current Stock: {refillingFood.remaining} {refillingFood.unit}
                </label>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Maximum Capacity: {refillingFood.quantity} {refillingFood.unit}
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
                  max={refillingFood.quantity - refillingFood.remaining}
                  placeholder="Enter quantity to refill"
                />
                <p className="text-xs text-gray-500 mt-1">
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
      {showUseForm && usingFood && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-lg max-w-md w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Use {usingFood.name}</h2>
              <button
                onClick={() => {
                  setShowUseForm(false);
                  setUsingFood(null);
                }}
                className={darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUseSubmit}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Current Stock: {usingFood.remaining} {usingFood.unit}
                </label>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Maximum Available: {usingFood.remaining} {usingFood.unit}
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
                  max={usingFood.remaining}
                  placeholder="Enter quantity to use"
                />
                <p className="text-xs text-gray-500 mt-1">
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
                Consumption Chart - {selectedFoodForChart?.name}
              </h2>
              <button
                onClick={() => setShowChart(false)}
                className={darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="h-96">
              {consumptionData.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>No consumption data available</p>
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