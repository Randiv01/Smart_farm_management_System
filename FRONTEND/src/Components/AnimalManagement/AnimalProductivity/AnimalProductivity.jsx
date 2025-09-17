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
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedRecord, setEditedRecord] = useState(null);
  const [newRecord, setNewRecord] = useState({
    productType: "",
    quantity: "",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });
  const [showAnalytics, setShowAnalytics] = useState(false);

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

  // Get health status with color
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

  // Calculate age from birth date
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
        ? `http://localhost:5000/productivity/batch/${id}`
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

  // Calculate productivity totals for a specific period
  const calculateProductivityTotals = (records, period = 'day') => {
    if (!records || records.length === 0) return { total: 0, average: 0 };
   
    const now = new Date();
    let startDate;
   
    switch(period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default: // day
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }
   
    const recentRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= now;
    });
   
    if (recentRecords.length === 0) return { total: 0, average: 0 };
   
    const total = recentRecords.reduce((sum, record) => sum + (parseFloat(record.quantity) || 0), 0);
    const average = total / recentRecords.length;
   
    return { total, average };
  };

  // Calculate productivity for all animals
  const calculateTotalProductivity = (period = 'day') => {
    let total = 0;
    
    animals.forEach(animal => {
      const records = productivityRecords[animal.isGroup ? animal.batchId : animal._id] || [];
      const { total: animalTotal } = calculateProductivityTotals(records, period);
      total += animalTotal;
    });
    
    return total.toFixed(1);
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
     
      // Group animals by batch for batch management types
      if (typeData.managementType === "batch") {
        const batchGroups = {};
        animalsData.forEach(animal => {
          const batchId = animal.batchId || "ungrouped";
          if (!batchGroups[batchId]) {
            batchGroups[batchId] = {
              _id: batchId,
              batchId: batchId,
              isGroup: true,
              animals: [],
              animalId: `BATCH-${batchId}`,
              data: {
                name: `${typeData.name} Batch - ${batchId}`,
                batchCount: 0
              }
            };
          }
          batchGroups[batchId].animals.push(animal);
          batchGroups[batchId].data.batchCount = batchGroups[batchId].animals.length;
        });
       
        const groupedAnimals = Object.values(batchGroups);
        setAnimals(groupedAnimals);
       
        // Fetch productivity records for each batch
        groupedAnimals.forEach(batch => {
          if (batch.batchId !== "ungrouped") {
            fetchProductivityRecords(batch.batchId, true);
          }
        });
      } else {
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
      }

      // Fetch batches
      const batchIds = [...new Set(animalsData
        .filter(animal => animal.batchId)
        .map(animal => animal.batchId)
      )];
      setBatches(batchIds.map(id => ({ _id: id, name: id })));

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
      const payload = {
        animalId: selectedAnimal.isGroup ? null : selectedAnimal._id,
        batchId: selectedAnimal.isGroup ? selectedAnimal.batchId : null,
        isGroup: selectedAnimal.isGroup,
        productType: newRecord.productType,
        quantity: parseFloat(newRecord.quantity),
        date: newRecord.date,
        notes: newRecord.notes
      };

      const res = await fetch(`http://localhost:5000/productivity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
     
      if (res.ok) {
        // Refresh the productivity records
        if (selectedAnimal.isGroup) {
          fetchProductivityRecords(selectedAnimal.batchId, true);
        } else {
          fetchProductivityRecords(selectedAnimal._id, false);
        }
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
    setSelectedRecord(null);
    setEditMode(false);
    setShowHistoryModal(true);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setEditedRecord({ ...record });
    setEditMode(true);
  };

  const handleSaveEditedRecord = async () => {
    try {
      const res = await fetch(`http://localhost:5000/productivity/${selectedRecord._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedRecord),
      });
     
      if (res.ok) {
        // Refresh data
        if (selectedAnimal.isGroup) {
          fetchProductivityRecords(selectedAnimal.batchId, true);
        } else {
          fetchProductivityRecords(selectedAnimal._id, false);
        }
        setEditMode(false);
        setSelectedRecord(null);
        fetchData();
      } else {
        throw new Error("Failed to update record");
      }
    } catch (err) {
      console.error("Error updating record:", err);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        const res = await fetch(`http://localhost:5000/productivity/${recordId}`, {
          method: "DELETE",
        });
       
        if (res.ok) {
          // Refresh data
          if (selectedAnimal.isGroup) {
            fetchProductivityRecords(selectedAnimal.batchId, true);
          } else {
            fetchProductivityRecords(selectedAnimal._id, false);
          }
          fetchData();
        } else {
          throw new Error("Failed to delete record");
        }
      } catch (err) {
        console.error("Error deleting record:", err);
      }
    }
  };

  const handleViewAnalytics = () => {
    setShowAnalytics(!showAnalytics);
  };

  // Get product types for this animal type
  const getProductTypes = () => {
    if (!animalType) return [];
   
    const typeName = animalType.name.toLowerCase();
    if (typeName.includes('cow')) return ['Milk Production (L)'];
    if (typeName.includes('chicken')) return ['Egg Production'];
    if (typeName.includes('sheep')) return ['Wool Production (kg)', 'Milk Production (L)'];
    if (typeName.includes('goat')) return ['Milk Production (L)'];
   
    return ['Production'];
  };

  const productTypes = getProductTypes();

  // Search & filter logic
  const handleFilterChange = (field, value) => {
    setFilterValues({ ...filterValues, [field]: value });
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange({ ...dateRange, [field]: value });
  };

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      // Search query matching
      const matchesSearch = searchQuery
        ? (animal.data?.name && animal.data.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (animal.animalId && animal.animalId.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (animal.batchId && animal.batchId.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      // Filter matching
      const matchesFilters = Object.keys(filterValues).every((key) => {
        if (!filterValues[key]) return true;
       
        // Special handling for zone filter (only for individual animals)
        if (key === "zone" && !animal.isGroup) {
          return getZoneInfo(animal).name.toLowerCase().includes(filterValues[key].toLowerCase());
        }
       
        // Special handling for health status (only for individual animals)
        if (key === "healthStatus" && !animal.isGroup) {
          const healthStatus = animal.data?.healthStatus || "";
          return healthStatus.toLowerCase().includes(filterValues[key].toLowerCase());
        }
       
        // Special handling for gender (only for individual animals)
        if (key === "gender" && !animal.isGroup) {
          const gender = animal.data?.gender || "";
          return gender.toLowerCase().includes(filterValues[key].toLowerCase());
        }
       
        // Special handling for age range (only for individual animals)
        if (key === "ageRange" && !animal.isGroup) {
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
          const records = productivityRecords[animal.isGroup ? animal.batchId : animal._id] || [];
          return records.some(record =>
            record.productType?.toLowerCase().includes(filterValues[key].toLowerCase())
          );
        }
       
        // For batch count filter
        if (key === "batchCount" && animal.isGroup) {
          const count = animal.data?.batchCount || 0;
          const [min, max] = filterValues[key].split('-').map(Number);
          return count >= min && count <= max;
        }
       
        return true;
      });

      // Date range filtering for productivity records
      const matchesDateRange = () => {
        if (!dateRange.start && !dateRange.end) return true;
       
        const records = productivityRecords[animal.isGroup ? animal.batchId : animal._id] || [];
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

  // Edit Record Form Component
  const EditRecordForm = () => (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Record</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Product Type
          </label>
          <select
            value={editedRecord.productType}
            onChange={(e) => setEditedRecord({...editedRecord, productType: e.target.value})}
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {productTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Quantity
          </label>
          <input
            type="number"
            step="0.1"
            value={editedRecord.quantity}
            onChange={(e) => setEditedRecord({...editedRecord, quantity: e.target.value})}
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Date
          </label>
          <input
            type="date"
            value={new Date(editedRecord.date).toISOString().split('T')[0]}
            onChange={(e) => setEditedRecord({...editedRecord, date: e.target.value})}
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Unit
          </label>
          <input
            type="text"
            value={editedRecord.unit || ''}
            onChange={(e) => setEditedRecord({...editedRecord, unit: e.target.value})}
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Notes
        </label>
        <textarea
          value={editedRecord.notes || ''}
          onChange={(e) => setEditedRecord({...editedRecord, notes: e.target.value})}
          className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows="3"
        />
        </div>
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={() => setEditMode(false)}
          className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveEditedRecord}
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );

  // Record Table Component
  const RecordTable = () => {
    const records = productivityRecords[selectedAnimal.isGroup ? selectedAnimal.batchId : selectedAnimal._id] || [];
   
    return (
      <>
        {records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-200 dark:bg-gray-700">
                <tr>
                  <th className="p-2 text-center text-gray-700 dark:text-gray-300">Date</th>
                  <th className="p-2 text-center text-gray-700 dark:text-gray-300">Product Type</th>
                  <th className="p-2 text-center text-gray-700 dark:text-gray-300">Quantity</th>
                  <th className="p-2 text-center text-gray-700 dark:text-gray-300">Unit</th>
                  <th className="p-2 text-center text-gray-700 dark:text-gray-300">Notes</th>
                  <th className="p-2 text-center text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((record, idx) => (
                    <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-2 text-center text-gray-900 dark:text-white">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="p-2 text-center text-gray-900 dark:text-white">{record.productType}</td>
                      <td className="p-2 text-center text-gray-900 dark:text-white">{record.quantity}</td>
                      <td className="p-2 text-center text-gray-900 dark:text-white">{record.unit || "-"}</td>
                      <td className="p-2 text-center text-gray-900 dark:text-white">{record.notes || "-"}</td>
                      <td className="p-2 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditRecord(record)}
                            className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(record._id)}
                            className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center">No productivity records found.</p>
        )}
      </>
    );
  };

  // Analytics Component
  const AnalyticsView = () => {
    // Calculate productivity by product type
    const productivityByType = {};
    
    productTypes.forEach(type => {
      productivityByType[type] = {
        daily: 0,
        weekly: 0,
        monthly: 0
      };
    });
    
    // Calculate totals for each product type
    animals.forEach(animal => {
      const records = productivityRecords[animal.isGroup ? animal.batchId : animal._id] || [];
      
      records.forEach(record => {
        if (productivityByType[record.productType]) {
          const recordDate = new Date(record.date);
          const now = new Date();
          const quantity = parseFloat(record.quantity) || 0;
          
          // Daily
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (recordDate >= today) {
            productivityByType[record.productType].daily += quantity;
          }
          
          // Weekly
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (recordDate >= weekAgo) {
            productivityByType[record.productType].weekly += quantity;
          }
          
          // Monthly
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          if (recordDate >= monthStart) {
            productivityByType[record.productType].monthly += quantity;
          }
        }
      });
    });
    
    return (
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Productivity Analytics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Object.entries(productivityByType).map(([type, data]) => (
            <div key={type} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-3">{type}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Daily:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{data.daily.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Weekly:</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">{data.weekly.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Monthly:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">{data.monthly.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-3">Total Production</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{calculateTotalProductivity('day')}</div>
              <div className="text-gray-700 dark:text-gray-300">Daily Production</div>
            </div>
            <div className="text-center p-4 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">{calculateTotalProductivity('week')}</div>
              <div className="text-gray-700 dark:text-gray-300">Weekly Production</div>
            </div>
            <div className="text-center p-4 bg-green-100 dark:bg-green-900 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-300">{calculateTotalProductivity('month')}</div>
              <div className="text-gray-700 dark:text-gray-300">Monthly Production</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading / Error
  if (loading)
    return (
      <div className="flex justify-center items-center h-48 text-gray-700 dark:text-gray-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
        <p className="ml-4">Loading {type} productivity data...</p>
      </div>
    );

  if (error || !animalType)
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {error ? `Error Loading ${type}` : "Animal Type Not Found"}
        </h2>
        <p className="text-red-500 dark:text-red-400 mb-4">
          {error || `The animal type "${type}" could not be loaded.`}
        </p>
        {error && (
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 mr-2"
            onClick={fetchData}
          >
            Retry
          </button>
        )}
      </div>
    );

  // Render
  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      <main className="p-5">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-5 gap-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {animalType.name} Productivity
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleViewAnalytics}
              className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold bg-purple-600 text-white hover:bg-purple-700"
            >
              {showAnalytics ? '📈 Hide Analytics' : '📊 View Analytics'}
            </button>
          </div>
        </div>

        {/* Analytics View */}
        {showAnalytics && <AnalyticsView />}

        {/* Filters Section */}
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Filters</h3>
         
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by ID, Name, Batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
           
            {/* Zone Filter (only for individual animals) */}
            {animalType.managementType !== "batch" && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Zone
                </label>
                <select
                  value={filterValues.zone || ""}
                  onChange={(e) => handleFilterChange("zone", e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Zones</option>
                  {zones.map(zone => (
                    <option key={zone._id} value={zone.name}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
           
            {/* Gender Filter (only for individual animals) */}
            {animalType.managementType !== "batch" && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Gender
                </label>
                <select
                  value={filterValues.gender || ""}
                  onChange={(e) => handleFilterChange("gender", e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}
           
            {/* Health Status Filter (only for individual animals) */}
            {animalType.managementType !== "batch" && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Health Status
                </label>
                <select
                  value={filterValues.healthStatus || ""}
                  onChange={(e) => handleFilterChange("healthStatus", e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="healthy">Healthy</option>
                  <option value="sick">Sick</option>
                  <option value="recovering">Recovering</option>
                  <option value="quarantined">Quarantined</option>
                </select>
              </div>
            )}
           
            {/* Age Range Filter (only for individual animals) */}
            {animalType.managementType !== "batch" && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Age Range (months)
                </label>
                <select
                  value={filterValues.ageRange || ""}
                  onChange={(e) => handleFilterChange("ageRange", e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            )}
           
            {/* Batch Count Filter (only for batch animals) */}
            {animalType.managementType === "batch" && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Batch Size
                </label>
                <select
                  value={filterValues.batchCount || ""}
                  onChange={(e) => handleFilterChange("batchCount", e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Sizes</option>
                  <option value="1-10">1-10 animals</option>
                  <option value="11-50">11-50 animals</option>
                  <option value="51-100">51-100 animals</option>
                  <option value="101-500">101-500 animals</option>
                  <option value="501-9999">500+ animals</option>
                </select>
              </div>
            )}
           
            {/* Product Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Product Type
              </label>
              <select
                value={filterValues.productType || ""}
                onChange={(e) => handleFilterChange("productType", e.target.value)}
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange("start", e.target.value)}
                  className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Start Date"
                />
                <span className="self-center text-gray-700 dark:text-gray-300">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange("end", e.target.value)}
                  className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
              {animalType.managementType === "batch" ? "Total Batches" : "Total Animals"}
            </h3>
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 text-center">{animals.length}</p>
          </div>
         
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-909 dark:text-white text-center">Daily Production</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 text-center">
              {calculateTotalProductivity('day')}
            </p>
          </div>
         
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">Weekly Production</h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 text-center">
              {calculateTotalProductivity('week')}
            </p>
          </div>
         
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">Monthly Production</h3>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 text-center">
              {calculateTotalProductivity('month')}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg shadow-md bg-white dark:bg-gray-800">
          <table className="w-full table-auto border-separate border-spacing-0 text-sm">
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 sticky top-0">
              <tr>
                <th className="p-3 text-center"></th>
                <th className="p-3 text-center">
                  {animalType.managementType === "batch" ? "Batch ID" : "QR & ID"}
                </th>
                <th className="p-3 text-center">
                  {animalType.managementType === "batch" ? "Batch Name" : "Name"}
                </th>
                {animalType.managementType !== "batch" && (
                  <>
                    <th className="p-3 text-center">Gender</th>
                    <th className="p-3 text-center">Age</th>
                  </>
                )}
                <th className="p-3 text-center">Zone</th>
                {animalType.managementType !== "batch" && (
                  <th className="p-3 text-center">Health Status</th>
                )}
                {animalType.managementType === "batch" && (
                  <th className="p-3 text-center">Animal Count</th>
                )}
                <th className="p-3 text-center">Weight</th>
                <th className="p-3 text-center">Feed Type</th>
               
                {/* Dynamic Product Columns */}
                {productTypes.map((type, idx) => (
                  <th key={idx} className="p-3 text-center">
                    {type}
                  </th>
                ))}
               
                <th className="p-3 text-center">Last Record</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnimals.length === 0 ? (
                <tr>
                  <td
                    colSpan={11 + productTypes.length + (animalType.managementType === "batch" ? -2 : 0)}
                    className="p-4 text-center italic text-gray-500 dark:text-gray-400"
                  >
                    No matching {animalType.name} found.
                  </td>
                </tr>
              ) : (
                filteredAnimals.map((animal) => {
                  const records = productivityRecords[animal.isGroup ? animal.batchId : animal._id] || [];
                  const latestRecord = getLatestRecord(records);
                  const healthStatus = getHealthStatus(animal);
                 
                  return (
                    <React.Fragment key={animal.isGroup ? animal.batchId : animal._id}>
                      <tr
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => toggleRowExpansion(animal.isGroup ? animal.batchId : animal._id)}
                      >
                        {/* Expand/Collapse Button */}
                        <td className="p-2 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(animal.isGroup ? animal.batchId : animal._id);
                            }}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            {expandedRows[animal.isGroup ? animal.batchId : animal._id] ? "▼" : "►"}
                          </button>
                        </td>
                       
                        {/* QR Code + Animal ID / Batch ID */}
                        <td className="p-2 text-center">
                          <div className="flex flex-col items-center justify-center">
                            {!animal.isGroup && animal.qrCode ? (
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
                            ) : animal.isGroup ? (
                              <div className="text-center font-semibold">
                                {animal.batchId}
                              </div>
                            ) : (
                              animal.animalId
                            )}
                          </div>
                        </td>

                        {/* Name / Batch Name */}
                        <td className="p-2 text-center">
                          {animal.data?.name || (animal.isGroup ? `Batch ${animal.batchId}` : "Unnamed")}
                        </td>

                        {/* Gender (only for individual animals) */}
                        {animalType.managementType !== "batch" && (
                          <td className="p-2 text-center">
                            {animal.data?.gender || "Unknown"}
                          </td>
                        )}

                        {/* Age (only for individual animals) */}
                        {animalType.managementType !== "batch" && (
                          <td className="p-2 text-center">
                            {calculateAge(animal)}
                          </td>
                        )}

                        {/* Zone */}
                        <td className="p-2 text-center">
                          {animal.isGroup ? "Multiple Zones" : getZoneInfo(animal).name}
                        </td>

                        {/* Health Status (only for individual animals) / Animal Count (for batches) */}
                        {animalType.managementType !== "batch" ? (
                          <td className="p-2 text-center">
                            <span className={`font-semibold ${healthStatus.colorClass}`}>
                              {healthStatus.status}
                            </span>
                          </td>
                        ) : (
                          <td className="p-2 text-center font-semibold">
                            {animal.animals?.length || animal.data?.batchCount || 0}
                          </td>
                        )}

                        {/* Weight */}
                        <td className="p-2 text-center">
                          {animal.isGroup ?
                            `${animal.animals?.reduce((sum, a) => sum + (parseFloat(a.data?.weight) || 0), 0).toFixed(1)} kg total` :
                            `${animal.data?.weight || "Unknown"} kg`
                          }
                        </td>

                        {/* Feed Type */}
                        <td className="p-2 text-center">
                          {animal.isGroup ? "Multiple Types" : (animal.data?.feedType || "Unknown")}
                        </td>

                        {/* Dynamic Product Columns */}
                        {productTypes.map((type, idx) => {
                          const typeRecords = records.filter(r => r.productType === type);
                          const { average } = calculateProductivityTotals(typeRecords, 'day');
                         
                          return (
                            <td key={idx} className="p-2 text-center font-semibold">
                              {average > 0 ? average.toFixed(1) : "-"}
                            </td>
                          );
                        })}

                        {/* Last Record Date */}
                        <td className="p-2 text-center">
                          {latestRecord ? new Date(latestRecord.date).toLocaleDateString() : "No records"}
                        </td>

                        {/* Actions */}
                        <td className="p-2 text-center">
                          <div className="flex flex-col gap-2 items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddProductivityRecord(animal);
                              }}
                              className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm w-full"
                            >
                              ➕ Add Record
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewHistory(animal);
                              }}
                              className="px-2 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 text-sm w-full"
                            >
                              📊 History
                            </button>
                          </div>
                        </td>
                      </tr>
                     
                      {/* Expanded Row for Details */}
                      {expandedRows[animal.isGroup ? animal.batchId : animal._id] && (
                        <tr className="bg-gray-50 dark:bg-gray-700">
                          <td colSpan={11 + productTypes.length + (animalType.managementType === "batch" ? -2 : 0)} className="p-4">
                            <div className="flex flex-col md:flex-row gap-6">
                              {/* Animal/Batch Details */}
                              <div className="flex-1">
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white text-center">
                                  {animal.isGroup ? "Batch Details" : "Animal Details"}
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="text-center">
                                    <span className="font-medium">ID:</span> {animal.isGroup ? animal.batchId : animal.animalId}
                                  </div>
                                  <div className="text-center">
                                    <span className="font-medium">Name:</span> {animal.data?.name || (animal.isGroup ? `Batch ${animal.batchId}` : "Unnamed")}
                                  </div>
                                  {!animal.isGroup && (
                                    <>
                                      <div className="text-center">
                                        <span className="font-medium">Gender:</span> {animal.data?.gender || "Unknown"}
                                      </div>
                                      <div className="text-center">
                                        <span className="font-medium">Age:</span> {calculateAge(animal)}
                                      </div>
                                    </>
                                  )}
                                  <div className="text-center">
                                    <span className="font-medium">Zone:</span> {animal.isGroup ? "Multiple Zones" : getZoneInfo(animal).name}
                                  </div>
                                  {!animal.isGroup ? (
                                    <div className="text-center">
                                      <span className="font-medium">Health:</span>
                                      <span className={`ml-1 font-semibold ${healthStatus.colorClass}`}>
                                        {healthStatus.status}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="text-center">
                                      <span className="font-medium">Animal Count:</span> {animal.animals?.length || animal.data?.batchCount || 0}
                                    </div>
                                  )}
                                  <div className="text-center">
                                    <span className="font-medium">Weight:</span> {animal.isGroup ?
                                      `${animal.animals?.reduce((sum, a) => sum + (parseFloat(a.data?.weight) || 0), 0).toFixed(1)} kg total` :
                                      `${animal.data?.weight || "Unknown"} kg`
                                    }
                                  </div>
                                  <div className="text-center">
                                    <span className="font-medium">Feed Type:</span> {animal.isGroup ? "Multiple Types" : (animal.data?.feedType || "Unknown")}
                                  </div>
                                </div>
                              </div>
                             
                              {/* Productivity Summary */}
                              <div className="flex-1">
                                <h4 className="font-semibold mb-2 text-gray-909 dark:text-white text-center">Productivity Summary</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {productTypes.map((type, idx) => {
                                    const typeRecords = records.filter(r => r.productType === type);
                                    const daily = calculateProductivityTotals(typeRecords, 'day');
                                    const weekly = calculateProductivityTotals(typeRecords, 'week');
                                    const monthly = calculateProductivityTotals(typeRecords, 'month');
                                   
                                    return (
                                      <React.Fragment key={idx}>
                                        <div className="col-span-2 font-medium mt-2 first:mt-0 text-center">{type}</div>
                                        <div className="text-center">
                                          <span className="font-medium">Daily Avg:</span> {daily.average > 0 ? `${daily.average.toFixed(1)}` : "-"}
                                        </div>
                                        <div className="text-center">
                                          <span className="font-medium">Weekly Total:</span> {weekly.total > 0 ? `${weekly.total.toFixed(1)}` : "-"}
                                        </div>
                                        <div className="text-center">
                                          <span className="font-medium">Monthly Total:</span> {monthly.total > 0 ? `${monthly.total.toFixed(1)}` : "-"}
                                        </div>
                                        <div className="text-center">
                                          <span className="font-medium">Last Record:</span> {typeRecords.length > 0 ? new Date(typeRecords[typeRecords.length - 1].date).toLocaleDateString() : "None"}
                                        </div>
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              </div>
                             
                              {/* Recent Records */}
                              <div className="flex-1">
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white text-center">Recent Records</h4>
                                {records.length > 0 ? (
                                  <div className="max-h-40 overflow-y-auto">
                                    {records.slice(-5).reverse().map((record, idx) => (
                                      <div key={idx} className="text-sm mb-2 p-2 bg-gray-100 dark:bg-gray-600 rounded">
                                        <div className="font-medium text-center">{record.productType}: {record.quantity} {record.unit || ""}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                          {new Date(record.date).toLocaleDateString()} - {record.notes || "No notes"}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">No productivity records yet.</p>
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
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Add Productivity Record for {selectedAnimal.isGroup ?
                  `Batch ${selectedAnimal.batchId}` :
                  (selectedAnimal.data?.name || selectedAnimal.animalId)
                }
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Product Type
                  </label>
                  <select
                    value={newRecord.productType}
                    onChange={(e) => setNewRecord({...newRecord, productType: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {productTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRecord.quantity}
                    onChange={(e) => setNewRecord({...newRecord, quantity: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Notes
                  </label>
                  <textarea
                    value={newRecord.notes}
                    onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddRecordModal(false)}
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
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
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Productivity History for {selectedAnimal.isGroup ?
                  `Batch ${selectedAnimal.batchId}` :
                  (selectedAnimal.data?.name || selectedAnimal.animalId)
                }
              </h3>
             
              {editMode ? (
                <EditRecordForm />
              ) : (
                <RecordTable />
              )}
             
              <div className="flex justify-end mt-6 gap-3">
                {editMode && (
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
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