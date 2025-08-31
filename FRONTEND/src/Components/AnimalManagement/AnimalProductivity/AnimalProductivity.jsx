import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.js";
import { QRCodeCanvas } from "qrcode.react";

export default function AnimalProductivity() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const [animals, setAnimals] = useState([]);
  const [animalType, setAnimalType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zones, setZones] = useState([]);
  const [batches, setBatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [productivityRecords, setProductivityRecords] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [dateRange, setDateRange] = useState({
    start: "",
    end: ""
  });
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [newRecord, setNewRecord] = useState({
    productType: "",
    quantity: "",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  useEffect(() => {
    document.title = "Animal Productivity";
  }, []);

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
    
    if (animalType && animalType.managementType === "batch") {
      fetchBatches();
    }
  }, [animalType]);

  // Helper function to safely get zone information
  const getZoneInfo = (animal) => {
    if (!animal) return { name: "Not assigned", id: null };
    
    if (animal.assignedZone && typeof animal.assignedZone === 'object') {
      return {
        name: animal.assignedZone.name || "Unknown",
        id: animal.assignedZone._id
      };
    }
    
    if (animal.assignedZone && typeof animal.assignedZone === 'string') {
      const foundZone = zones.find(z => z._id === animal.assignedZone);
      return foundZone 
        ? { name: foundZone.name, id: foundZone._id }
        : { name: "Unknown", id: animal.assignedZone };
    }
    
    if (animal.zoneId) {
      const foundZone = zones.find(z => z._id === animal.zoneId);
      return foundZone 
        ? { name: foundZone.name, id: foundZone._id }
        : { name: "Unknown", id: animal.zoneId };
    }
    
    return { name: "Not assigned", id: null };
  };

  // Get batch name by ID
  const getBatchName = (batchId) => {
    const batch = batches.find(b => b._id === batchId);
    return batch ? batch.name : "Unknown Batch";
  };

  // Get health status with color - FIXED to access data.healthStatus
  const getHealthStatus = (animal) => {
    const status = animal.data?.healthStatus || "Unknown";
    let colorClass = "";
    
    switch(status.toLowerCase()) {
      case "healthy":
        colorClass = "text-green-600 dark:text-green-400";
        break;
      case "sick":
        colorClass = "text-red-600 dark:text-red-400";
        break;
      case "recovering":
        colorClass = "text-yellow-600 dark:text-yellow-400";
        break;
      case "quarantined":
        colorClass = "text-orange-600 dark:text-orange-400";
        break;
      default:
        colorClass = "text-gray-600 dark:text-gray-400";
    }
    
    return { status, colorClass };
  };

  // Calculate age from birth date (using data.dob) - FIXED
  const calculateAge = (animal) => {
    const birthDate = animal.data?.dob;
    
    if (!birthDate) return "Unknown";
    
    const birth = new Date(birthDate);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
  };

  // Fetch productivity records for an animal/group
  const fetchProductivityRecords = async (id, isGroup = false) => {
    try {
      const endpoint = isGroup 
        ? `http://localhost:5000/productivity/group/${id}`
        : `http://localhost:5000/productivity/animal/${id}`;
      
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setProductivityRecords(prev => ({
          ...prev,
          [id]: data.records || []
        }));
      }
    } catch (err) {
      console.error("Failed to fetch productivity records:", err);
    }
  };

  // Get latest productivity record
  const getLatestRecord = (records) => {
    if (!records || records.length === 0) return null;
    
    return records.reduce((latest, record) => {
      return new Date(record.date) > new Date(latest.date) ? record : latest;
    }, records[0]);
  };

  // Calculate productivity totals
  const calculateProductivityTotals = (records, period = 'day') => {
    if (!records || records.length === 0) return { total: 0, average: 0 };
    
    const now = new Date();
    let startDate;
    
    switch(period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      default: // day
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    const recentRecords = records.filter(record => 
      new Date(record.date) >= startDate
    );
    
    if (recentRecords.length === 0) return { total: 0, average: 0 };
    
    const total = recentRecords.reduce((sum, record) => sum + (record.quantity || 0), 0);
    const average = total / recentRecords.length;
    
    return { total, average };
  };

  // Fetch data with productivity information
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const typeRes = await fetch(`http://localhost:5000/animal-types/${type}`);
      if (!typeRes.ok) throw new Error(`Animal type not found`);
      const typeData = await typeRes.json();
      setAnimalType(typeData);

      // Fetch animals
      const animalsRes = await fetch(
        `http://localhost:5000/animals?type=${typeData._id}`
      );
      if (!animalsRes.ok) throw new Error("Failed to fetch animals");
      const animalsData = await animalsRes.json();
      
      // For individual animals
      const individualAnimals = animalsData.map(animal => ({
        ...animal,
        isGroup: false,
        animals: [animal]
      }));
      setAnimals(individualAnimals);
      
      // Fetch productivity records for each animal
      individualAnimals.forEach(animal => {
        fetchProductivityRecords(animal._id, false);
      });
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

  // Toggle row expansion
  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddProductivityRecord = (animal) => {
    setSelectedAnimal(animal);
    setNewRecord({
      productType: productTypes[0] || "",
      quantity: "",
      date: new Date().toISOString().split('T')[0],
      notes: ""
    });
    setShowAddRecordModal(true);
  };

  const handleSaveProductivityRecord = async () => {
    try {
      const res = await fetch(`http://localhost:5000/productivity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: selectedAnimal._id,
          isGroup: selectedAnimal.isGroup,
          productType: newRecord.productType,
          quantity: parseFloat(newRecord.quantity),
          date: newRecord.date,
          notes: newRecord.notes
        }),
      });
      
      if (res.ok) {
        // Refresh the productivity records
        fetchProductivityRecords(selectedAnimal._id, selectedAnimal.isGroup);
        setShowAddRecordModal(false);
        setSelectedAnimal(null);
        // Refresh the data to update the table
        fetchData();
      } else {
        throw new Error("Failed to save record");
      }
    } catch (err) {
      console.error("Error saving productivity record:", err);
    }
  };

  const handleViewHistory = (animal) => {
    setSelectedAnimal(animal);
    setShowHistoryModal(true);
  };

  const handleEditAnimal = (id) => {
    navigate(`/AnimalManagement/edit-animal/${id}`);
  };

  // Get product types for this animal type - FIXED to use milkProduction from data
  const getProductTypes = () => {
    if (!animalType) return [];
    
    // For cows, use milkProduction from the data object
    const typeName = animalType.name.toLowerCase();
    if (typeName.includes('cow')) return ['Milk Production (L)'];
    if (typeName.includes('chicken')) return ['Egg Production'];
    if (typeName.includes('sheep')) return ['Wool Production (kg)', 'Milk Production (L)'];
    if (typeName.includes('goat')) return ['Milk Production (L)'];
    
    return ['Production'];
  };

  const productTypes = getProductTypes();

  // Search & filter logic - FIXED to search in data object
  const handleFilterChange = (field, value) => {
    setFilterValues({ ...filterValues, [field]: value });
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange({ ...dateRange, [field]: value });
  };

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      // Search query matching - FIXED to search in data object
      const matchesSearch = searchQuery
        ? Object.values(animal.data || {}).some((val) =>
            String(val).toLowerCase().includes(searchQuery.toLowerCase())
          ) || 
          (animal.animalId && animal.animalId.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (animal.data?.name && animal.data.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      // Filter matching - FIXED to filter in data object
      const matchesFilters = Object.keys(filterValues).every((key) => {
        if (!filterValues[key]) return true;
        
        // Special handling for zone filter
        if (key === "zone") {
          return getZoneInfo(animal).name.toLowerCase().includes(filterValues[key].toLowerCase());
        }
        
        // Special handling for health status - FIXED to access data.healthStatus
        if (key === "healthStatus") {
          const healthStatus = animal.data?.healthStatus || "";
          return healthStatus.toLowerCase().includes(filterValues[key].toLowerCase());
        }
        
        // Special handling for gender - FIXED to access data.gender
        if (key === "gender") {
          const gender = animal.data?.gender || "";
          return gender.toLowerCase().includes(filterValues[key].toLowerCase());
        }
        
        // Special handling for age range - FIXED to use data.dob
        if (key === "ageRange") {
          const ageText = calculateAge(animal);
          if (ageText === "Unknown") return false;
          
          // Convert age to months for filtering
          let ageInMonths = 0;
          if (ageText.includes('year')) {
            const years = parseInt(ageText.split(' ')[0]);
            const months = parseInt(ageText.split(' ')[2]);
            ageInMonths = years * 12 + months;
          } else {
            ageInMonths = parseInt(ageText.split(' ')[0]);
          }
          
          const [min, max] = filterValues[key].split('-').map(Number);
          return ageInMonths >= min && ageInMonths <= max;
        }
        
        // Special handling for product type
        if (key === "productType") {
          const records = productivityRecords[animal._id] || [];
          return records.some(record => 
            record.productType?.toLowerCase().includes(filterValues[key].toLowerCase())
          );
        }
        
        // For other fields, check in data object
        const val = animal.data?.[key] || "";
        return String(val)
          .toLowerCase()
          .includes(filterValues[key].toLowerCase());
      });

      // Date range filtering for productivity records
      const matchesDateRange = () => {
        if (!dateRange.start && !dateRange.end) return true;
        
        const records = productivityRecords[animal._id] || [];
        if (records.length === 0) return false;
        
        if (dateRange.start && dateRange.end) {
          return records.some(record => {
            const recordDate = new Date(record.date);
            return recordDate >= new Date(dateRange.start) && 
                   recordDate <= new Date(dateRange.end);
          });
        }
        
        if (dateRange.start) {
          return records.some(record => 
            new Date(record.date) >= new Date(dateRange.start)
          );
        }
        
        if (dateRange.end) {
          return records.some(record => 
            new Date(record.date) <= new Date(dateRange.end)
          );
        }
        
        return true;
      };

      return matchesSearch && matchesFilters && matchesDateRange();
    });
  }, [animals, searchQuery, filterValues, dateRange, productivityRecords, zones]);

  // Loading / Error
  if (loading)
    return (
      <div className="flex justify-center items-center h-48 text-dark-gray dark:text-dark-text">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-btn-teal"></div>
        <p className="ml-4">Loading {type} productivity data...</p>
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
            className="px-4 py-2 rounded bg-btn-blue text-white hover:bg-blue-800 mr-2"
            onClick={fetchData}
          >
            Retry
          </button>
        )}
        <button
            className="px-4 py-2 rounded bg-btn-gray text-white hover:bg-gray-700"
            onClick={() => navigate("/AnimalManagement")}
          >
            Back
          </button>
      </div>
    );

  // Render
  return (
    <div className={`${darkMode ? "dark bg-dark-bg" : "bg-light-beige"} min-h-screen`}>
      <main className="p-5">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-5 gap-4">
          <h2
            className={`text-2xl font-semibold ${
              darkMode ? "text-dark-text" : "text-dark-gray"
            }`}
          >
            {animalType.name} Productivity
          </h2>
          <button
            onClick={() => navigate("/AnimalManagement")}
            className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold bg-btn-gray text-white hover:bg-gray-700"
          >
            ← Back to Management
          </button>
        </div>

        {/* Filters Section */}
        <div className="mb-6 p-4 bg-gray-100 dark:bg-dark-card rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-dark-gray dark:text-dark-text">Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-1 text-dark-gray dark:text-dark-text">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by ID, Name, QR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text"
              />
            </div>
            
            {/* Zone Filter */}
            <div>
              <label className="block text-sm font-medium mb-1 text-dark-gray dark:text-dark-text">
                Zone
              </label>
              <select
                value={filterValues.zone || ""}
                onChange={(e) => handleFilterChange("zone", e.target.value)}
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text"
              >
                <option value="">All Zones</option>
                {zones.map(zone => (
                  <option key={zone._id} value={zone.name}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Gender Filter - FIXED */}
            <div>
              <label className="block text-sm font-medium mb-1 text-dark-gray dark:text-dark-text">
                Gender
              </label>
              <select
                value={filterValues.gender || ""}
                onChange={(e) => handleFilterChange("gender", e.target.value)}
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* Health Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-1 text-dark-gray dark:text-dark-text">
                Health Status
              </label>
              <select
                value={filterValues.healthStatus || ""}
                onChange={(e) => handleFilterChange("healthStatus", e.target.value)}
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text"
              >
                <option value="">All Statuses</option>
                <option value="healthy">Healthy</option>
                <option value="sick">Sick</option>
                <option value="recovering">Recovering</option>
                <option value="quarantined">Quarantined</option>
              </select>
            </div>
            
            {/* Age Range Filter */}
            <div>
              <label className="block text-sm font-medium mb-1 text-dark-gray dark:text-dark-text">
                Age Range (months)
              </label>
              <select
                value={filterValues.ageRange || ""}
                onChange={(e) => handleFilterChange("ageRange", e.target.value)}
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text"
              >
                <option value="">All Ages</option>
                <option value="0-6">0-6 months</option>
                <option value="7-12">7-12 months</option>
                <option value="13-24">13-24 months</option>
                <option value="25-60">25-60 months</option>
                <option value="61-120">61-120 months</option>
                <option value="121-999">121+ months</option>
              </select>
            </div>
            
            {/* Product Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-1 text-dark-gray dark:text-dark-text">
                Product Type
              </label>
              <select
                value={filterValues.productType || ""}
                onChange={(e) => handleFilterChange("productType", e.target.value)}
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text"
              >
                <option value="">All Types</option>
                {productTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date Range Filter */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-dark-gray dark:text-dark-text">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange("start", e.target.value)}
                  className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text"
                  placeholder="Start Date"
                />
                <span className="self-center text-dark-gray dark:text-dark-text">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange("end", e.target.value)}
                  className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text"
                  placeholder="End Date"
                />
              </div>
            </div>
          </div>
          
          {/* Clear Filters Button */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setFilterValues({});
                setDateRange({ start: "", end: "" });
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-dark-gray dark:text-dark-text hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-dark-gray dark:text-dark-text">Total Animals</h3>
            <p className="text-2xl font-bold text-btn-teal">{animals.length}</p>
          </div>
          
          <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-dark-gray dark:text-dark-text">Daily Production</h3>
            <p className="text-2xl font-bold text-btn-blue">
              {animals.reduce((sum, animal) => {
                const records = productivityRecords[animal._id] || [];
                const { total } = calculateProductivityTotals(records, 'day');
                return sum + total;
              }, 0).toFixed(1)}
            </p>
          </div>
          
          <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-dark-gray dark:text-dark-text">Weekly Production</h3>
            <p className="text-2xl font-bold text-btn-purple">
              {animals.reduce((sum, animal) => {
                const records = productivityRecords[animal._id] || [];
                const { total } = calculateProductivityTotals(records, 'week');
                return sum + total;
              }, 0).toFixed(1)}
            </p>
          </div>
          
          <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-dark-gray dark:text-dark-text">Monthly Production</h3>
            <p className="text-2xl font-bold text-btn-orange">
              {animals.reduce((sum, animal) => {
                const records = productivityRecords[animal._id] || [];
                const { total } = calculateProductivityTotals(records, 'month');
                return sum + total;
              }, 0).toFixed(1)}
            </p>
          </div>
        </div>

        {/* Table */}
        <div
          className={`overflow-x-auto rounded-lg shadow-md ${
            darkMode ? "bg-dark-card shadow-cardDark" : "bg-soft-white shadow-card"
          }`}
        >
          <table className="w-full table-auto border-separate border-spacing-0 text-sm">
            <thead
              className={
                darkMode
                  ? "bg-dark-gray text-dark-text sticky top-0"
                  : "bg-gray-200 text-dark-gray font-semibold sticky top-0"
              }
            >
              <tr>
                <th className="p-3"></th>
                <th className="p-3 text-center">QR & ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Gender</th>
                <th className="p-3">Age</th>
                <th className="p-3">Zone</th>
                <th className="p-3">Health Status</th>
                <th className="p-3">Weight</th>
                <th className="p-3">Feed Type</th>
                
                {/* Dynamic Product Columns - FIXED to show milkProduction from data */}
                {productTypes.map((type, idx) => (
                  <th key={idx} className="p-3">
                    {type}
                  </th>
                ))}
                
                <th className="p-3">Last Record</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnimals.length === 0 ? (
                <tr>
                  <td
                    colSpan={11 + productTypes.length}
                    className="p-4 text-center italic text-gray-500 dark:text-gray-400"
                  >
                    No matching {animalType.name} found.
                  </td>
                </tr>
              ) : (
                filteredAnimals.map((animal) => {
                  const records = productivityRecords[animal._id] || [];
                  const latestRecord = getLatestRecord(records);
                  const healthStatus = getHealthStatus(animal);
                  
                  return (
                    <React.Fragment key={animal._id}>
                      <tr
                        className={`${
                          darkMode ? "bg-dark-card text-dark-text" : "bg-white"
                        } hover:${darkMode ? "bg-dark-gray" : "bg-gray-100"} cursor-pointer`}
                        onClick={() => toggleRowExpansion(animal._id)}
                      >
                        {/* Expand/Collapse Button */}
                        <td className="p-2 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(animal._id);
                            }}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-gray"
                          >
                            {expandedRows[animal._id] ? "▼" : "►"}
                          </button>
                        </td>
                        
                        {/* QR Code + Animal ID - FIXED */}
                        <td className="p-2">
                          <div className="flex flex-col items-center justify-center">
                            {animal.qrCode ? (
                              <div className="text-center">
                                <QRCodeCanvas 
                                  value={animal.qrCode} 
                                  size={60} 
                                  level="H" 
                                  className="mx-auto"
                                />
                                <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                  {animal.animalId}
                                </div>
                              </div>
                            ) : (
                              animal.animalId
                            )}
                          </div>
                        </td>

                        {/* Name - FIXED to show data.name */}
                        <td className="p-2">
                          {animal.data?.name || "Unnamed"}
                        </td>

                        {/* Gender - FIXED to show data.gender */}
                        <td className="p-2">
                          {animal.data?.gender || "Unknown"}
                        </td>

                        {/* Age - FIXED */}
                        <td className="p-2">
                          {calculateAge(animal)}
                        </td>

                        {/* Zone */}
                        <td className="p-2">
                          {getZoneInfo(animal).name}
                        </td>

                        {/* Health Status - FIXED */}
                        <td className="p-2">
                          <span className={`font-semibold ${healthStatus.colorClass}`}>
                            {healthStatus.status}
                          </span>
                        </td>

                        {/* Weight - FIXED to show data.weight */}
                        <td className="p-2">
                          {animal.data?.weight ? `${animal.data.weight} kg` : "Unknown"}
                        </td>

                        {/* Feed Type - FIXED to show data.feedType */}
                        <td className="p-2">
                          {animal.data?.feedType || "Unknown"}
                        </td>

                        {/* Dynamic Product Columns - FIXED to show milkProduction from data */}
                        {productTypes.map((type, idx) => {
                          // For milk production, show the value from data.milkProduction
                          if (type.includes('Milk')) {
                            return (
                              <td key={idx} className="p-2 text-center font-semibold">
                                {animal.data?.milkProduction || "0"}
                              </td>
                            );
                          }
                          
                          // For other product types, show from productivity records
                          const typeRecords = records.filter(r => r.productType === type);
                          const { average } = calculateProductivityTotals(typeRecords, 'day');
                          
                          return (
                            <td key={idx} className="p-2 text-center font-semibold">
                              {average > 0 ? average.toFixed(1) : "-"}
                            </td>
                          );
                        })}

                        {/* Last Record Date */}
                        <td className="p-2">
                          {latestRecord ? new Date(latestRecord.date).toLocaleDateString() : "No records"}
                        </td>

                        {/* Actions */}
                        <td className="p-2">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddProductivityRecord(animal);
                              }}
                              className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
                            >
                              ➕ Add Record
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewHistory(animal);
                              }}
                              className="px-2 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 text-sm"
                            >
                              📊 History
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAnimal(animal._id);
                              }}
                              className="px-2 py-1 rounded bg-btn-blue text-white hover:bg-blue-800 text-sm"
                            >
                              ✏ Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Row for Details */}
                      {expandedRows[animal._id] && (
                        <tr className={`${darkMode ? "bg-dark-gray" : "bg-gray-50"}`}>
                          <td colSpan={11 + productTypes.length} className="p-4">
                            <div className="flex flex-col md:flex-row gap-6">
                              {/* Animal Details */}
                              <div className="flex-1">
                                <h4 className="font-semibold mb-2 text-dark-gray dark:text-dark-text">
                                  Animal Details
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="font-medium">ID:</span> {animal.animalId}
                                  </div>
                                  <div>
                                    <span className="font-medium">Name:</span> {animal.data?.name || "Unnamed"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Gender:</span> {animal.data?.gender || "Unknown"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Age:</span> {calculateAge(animal)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Breed:</span> {animal.data?.breed || "Unknown"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Weight:</span> {animal.data?.weight ? `${animal.data.weight} kg` : "Unknown"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Feed Type:</span> {animal.data?.feedType || "Unknown"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Health:</span> 
                                    <span className={`ml-1 font-semibold ${healthStatus.colorClass}`}>
                                      {healthStatus.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Productivity Summary */}
                              <div className="flex-1">
                                <h4 className="font-semibold mb-2 text-dark-gray dark:text-dark-text">Productivity Summary</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {productTypes.map((type, idx) => {
                                    // For milk production, show from data.milkProduction
                                    if (type.includes('Milk')) {
                                      return (
                                        <React.Fragment key={idx}>
                                          <div className="col-span-2 font-medium mt-2 first:mt-0">{type}</div>
                                          <div>
                                            <span className="font-medium">Current:</span> {animal.data?.milkProduction || "0"} L/day
                                          </div>
                                          <div>
                                            <span className="font-medium">Status:</span> {animal.data?.milkProduction > 0 ? "Active" : "Inactive"}
                                          </div>
                                        </React.Fragment>
                                      );
                                    }
                                    
                                    // For other product types, show from records
                                    const typeRecords = records.filter(r => r.productType === type);
                                    const daily = calculateProductivityTotals(typeRecords, 'day');
                                    const weekly = calculateProductivityTotals(typeRecords, 'week');
                                    const monthly = calculateProductivityTotals(typeRecords, 'month');
                                    
                                    return (
                                      <React.Fragment key={idx}>
                                        <div className="col-span-2 font-medium mt-2 first:mt-0">{type}</div>
                                        <div>
                                          <span className="font-medium">Daily Avg:</span> {daily.average > 0 ? `${daily.average.toFixed(1)}` : "-"}
                                        </div>
                                        <div>
                                          <span className="font-medium">Weekly Total:</span> {weekly.total > 0 ? `${weekly.total.toFixed(1)}` : "-"}
                                        </div>
                                        <div>
                                          <span className="font-medium">Monthly Total:</span> {monthly.total > 0 ? `${monthly.total.toFixed(1)}` : "-"}
                                        </div>
                                        <div>
                                          <span className="font-medium">Last Record:</span> {typeRecords.length > 0 ? new Date(typeRecords[typeRecords.length - 1].date).toLocaleDateString() : "None"}
                                        </div>
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              {/* Recent Records */}
                              <div className="flex-1">
                                <h4 className="font-semibold mb-2 text-dark-gray dark:text-dark-text">Recent Records</h4>
                                {records.length > 0 ? (
                                  <div className="max-h-40 overflow-y-auto">
                                    {records.slice(-5).reverse().map((record, idx) => (
                                      <div key={idx} className="text-sm mb-2 p-2 bg-gray-100 dark:bg-dark-bg rounded">
                                        <div className="font-medium">{record.productType}: {record.quantity} {record.unit || ""}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {new Date(record.date).toLocaleDateString()} - {record.notes || "No notes"}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">No productivity records yet.</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Add Record Modal */}
        {showAddRecordModal && selectedAnimal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4 text-dark-gray dark:text-dark-text">
                Add Productivity Record for {selectedAnimal.data?.name || selectedAnimal.animalId}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-dark-gray dark:text-dark-text">
                    Product Type
                  </label>
                  <select
                    value={newRecord.productType}
                    onChange={(e) => setNewRecord({...newRecord, productType: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text"
                  >
                    {productTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-dark-gray dark:text-dark-text">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRecord.quantity}
                    onChange={(e) => setNewRecord({...newRecord, quantity: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-dark-gray dark:text-dark-text">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-dark-gray dark:text-dark-text">
                    Notes
                  </label>
                  <textarea
                    value={newRecord.notes}
                    onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddRecordModal(false)}
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-dark-gray dark:text-dark-text hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProductivityRecord}
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Save Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && selectedAnimal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4 text-dark-gray dark:text-dark-text">
                Productivity History for {selectedAnimal.data?.name || selectedAnimal.animalId}
              </h3>
              {productivityRecords[selectedAnimal._id]?.length > 0 ? (
                <table className="w-full table-auto">
                  <thead className="bg-gray-200 dark:bg-dark-gray">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Product Type</th>
                      <th className="p-2">Quantity</th>
                      <th className="p-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productivityRecords[selectedAnimal._id]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((record, idx) => (
                        <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="p-2">{new Date(record.date).toLocaleDateString()}</td>
                          <td className="p-2">{record.productType}</td>
                          <td className="p-2">{record.quantity} {record.unit || ""}</td>
                          <td className="p-2">{record.notes || "-"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No productivity records found.</p>
              )}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-dark-gray dark:text-dark-text hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}