import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.js";
import { useLoader } from "../contexts/LoaderContext.js";
import { QRCodeCanvas } from "qrcode.react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, 
  TrendingDown, 
  Download, 
  Filter, 
  BarChart3, 
  Calendar,
  AlertTriangle,
  Info,
  Search,
  RefreshCw,
  AlertCircle,
  Package,
  Bell,
  Plus,
  ChevronDown,
  ChevronUp,
  PawPrint,
  X,
} from "lucide-react";

export default function AnimalProductivity() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading: setGlobalLoading } = useLoader();

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
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedRecord, setEditedRecord] = useState(null);
  const [popup, setPopup] = useState({ show: false, success: true, message: "" });

  // State for new record with dynamic fields
  const [newRecord, setNewRecord] = useState({
    date: new Date().toISOString().split("T")[0],
    notes: ""
  });

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  // New state variables
  const [productivityStats, setProductivityStats] = useState({});
  const [productivityFields, setProductivityFields] = useState([]);
  const [trendStats, setTrendStats] = useState([]);
  const [insights, setInsights] = useState([]);
  const [timeframe, setTimeframe] = useState("month");
  const [groupBy, setGroupBy] = useState("day");
  const [productivityAnalytics, setProductivityAnalytics] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    document.title = "Animal Productivity Dashboard";
    fetchData();
  }, []);

  // Set up auto-refresh for live data
  useEffect(() => {
    if (showAnalytics) {
      const interval = setInterval(() => {
        fetchData();
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [showAnalytics]);

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

  const handleRecordChange = (field, value) => {
    setNewRecord(prev => ({
     ...prev,
     [field]: value
   }));
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

  // Calculate productivity totals for a specific period and field
  const calculateProductivityTotals = (records, period = 'day', fieldName) => {
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
      return recordDate >= startDate && recordDate <= now && record[fieldName] !== undefined;
    });
   
    if (recentRecords.length === 0) return { total: 0, average: 0 };
   
    const total = recentRecords.reduce((sum, record) => sum + (parseFloat(record[fieldName]) || 0), 0);
    const average = total / recentRecords.length;
   
    return { total, average };
  };

  // Calculate total productivity for a period across all fields
  const calculateTotalProductivity = (period = 'day', fieldName) => {
    let total = 0;
    
    animals.forEach(animal => {
      const records = productivityRecords[animal.isGroup ? animal.batchId : animal._id] || [];
      const { total: animalTotal } = calculateProductivityTotals(records, period, fieldName);
      total += animalTotal;
    });
    
    return total.toFixed(1);
  };

  // Prepare analytics data (simplified)
  const prepareAnalyticsData = () => {
    if (!animals.length || !productivityFields.length) return null;
    
    // Calculate productivity by date for trend chart (per field)
    const productivityByDate = {};
    const allRecords = [];
    
    // Collect all records
    animals.forEach(animal => {
      const records = productivityRecords[animal.isGroup ? animal.batchId : animal._id] || [];
      records.forEach(record => {
        allRecords.push({
          ...record,
          date: new Date(record.date).toISOString().split('T')[0],
          animalName: animal.data?.name || animal.animalId || animal.batchId
        });
      });
    });
    
    // Group by date
    allRecords.forEach(record => {
      if (!productivityByDate[record.date]) {
        productivityByDate[record.date] = {
          date: record.date,
          fields: {}
        };
      }
      productivityFields.forEach(field => {
        if (record[field.name] !== undefined) {
          if (!productivityByDate[record.date].fields[field.name]) {
            productivityByDate[record.date].fields[field.name] = {
              total: 0,
              count: 0
            };
          }
          productivityByDate[record.date].fields[field.name].total += parseFloat(record[field.name]) || 0;
          productivityByDate[record.date].fields[field.name].count += 1;
        }
      });
    });
    
    // Convert to array and sort by date
    const trendData = Object.values(productivityByDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString()
      }));
    
    // Weekly/Monthly comparison (per field)
    const weeklyData = [];
    const monthlyData = [];
    
    const now = new Date();
    
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRecords = allRecords.filter(r => r.date === dateStr);
      const dayFields = {};
      productivityFields.forEach(field => {
        const fieldRecords = dayRecords.filter(r => r[field.name] !== undefined);
        dayFields[field.name] = fieldRecords.reduce((sum, r) => sum + (parseFloat(r[field.name]) || 0), 0);
      });
      
      weeklyData.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dateStr,
        fields: dayFields
      });
    }
    
    // Last 30 days grouped by week
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekRecords = allRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });
      
      const weekFields = {};
      productivityFields.forEach(field => {
        const fieldRecords = weekRecords.filter(r => r[field.name] !== undefined);
        weekFields[field.name] = fieldRecords.reduce((sum, r) => sum + (parseFloat(r[field.name]) || 0), 0);
      });
      
      monthlyData.push({
        name: `Week ${4-i}`,
        range: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
        fields: weekFields
      });
    }
    
    return {
      trendData,
      weeklyData,
      monthlyData,
      lastUpdated: new Date().toLocaleTimeString()
    };
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
      setProductivityFields(typeData.productivityFields || []);

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

      // Fetch productivity analytics
      try {
        const analyticsRes = await fetch("http://localhost:5000/productivity/analytics?timeframe=month&groupBy=day");
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setProductivityAnalytics(analyticsData);
        }
      } catch (err) {
        console.error("Failed to fetch productivity analytics:", err);
      }

      // Calculate productivity stats
      const overall = {};
      productivityFields.forEach(field => {
        overall[field.name] = 0;
      });
      
      animalsData.forEach(animal => {
        const records = productivityRecords[animal._id] || []; // Adjust for batch if needed
        productivityFields.forEach(field => {
          const total = records.reduce((sum, r) => sum + (parseFloat(r[field.name]) || 0), 0);
          overall[field.name] += total;
        });
      });
      
      setProductivityStats(overall);
      
      // Generate insights
      generateInsights(typeData, overall, productivityAnalytics);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  // Generate insights function
  const generateInsights = (animalType, overallStats, analyticsData) => {
    const newInsights = [];
    
    // Top performing field
    if (productivityFields.length > 0) {
      const topField = productivityFields.reduce((prev, current) => {
        return (overallStats[prev.name] || 0) > (overallStats[current.name] || 0) ? prev : current;
      });
      
      if (topField) {
        newInsights.push({
          type: "success",
          message: `${topField.label} is the highest tracked metric with total of ${(overallStats[topField.name] || 0).toLocaleString()} ${topField.unit || 'units'}`
        });
      }
    }
    
    // Fields with no data
    const inactiveFields = productivityFields.filter(field => 
      (overallStats[field.name] || 0) === 0
    );
    
    if (inactiveFields.length > 0) {
      newInsights.push({
        type: "warning",
        message: `${inactiveFields.length} productivity field(s) have no recorded data: ${inactiveFields.map(f => f.label).join(', ')}`
      });
    }
    
    // Compare with previous period using analytics data
    if (analyticsData?.analytics && analyticsData.analytics.length >= 2) {
      const current = analyticsData.analytics[analyticsData.analytics.length - 1];
      const previous = analyticsData.analytics[analyticsData.analytics.length - 2];
      
      let totalCurrent = 0;
      let totalPrevious = 0;
      
      // Sum all productivity values
      if (current.values) {
        Object.values(current.values).forEach(fieldData => {
          totalCurrent += fieldData.total || 0;
        });
      }
      
      if (previous.values) {
        Object.values(previous.values).forEach(fieldData => {
          totalPrevious += fieldData.total || 0;
        });
      }
      
      if (totalPrevious > 0) {
        const change = ((totalCurrent - totalPrevious) / totalPrevious) * 100;
        
        if (Math.abs(change) > 5) {
          newInsights.push({
            type: change > 0 ? "success" : "danger",
            message: `Overall productivity has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% compared to last period`
          });
        }
      }
    }
    
    setInsights(newInsights);
  };

  // Update analytics data when animals or productivity records change
  useEffect(() => {
    if (showAnalytics) {
      setAnalyticsData(prepareAnalyticsData());
    }
  }, [animals, productivityRecords, showAnalytics, productivityFields]);

  // Toggle row expansion
  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddProductivityRecord = (animal) => {
    setSelectedAnimal(animal);
    // Initialize new record with dynamic fields
    const initialRecord = {
      date: new Date().toISOString().split('T')[0],
      notes: ""
    };
    productivityFields.forEach(field => {
      initialRecord[field.name] = field.type === 'number' ? '' : ''; // Default empty
    });
    setNewRecord(initialRecord);
    setShowAddRecordModal(true);
  };

  const handleSaveProductivityRecord = async () => {
    try {
      // Prepare payload
      const payload = {
        animalId: selectedAnimal.isGroup ? null : selectedAnimal._id,
        batchId: selectedAnimal.isGroup ? selectedAnimal.batchId : null,
        isGroup: selectedAnimal.isGroup,
        date: newRecord.date,
        notes: newRecord.notes,
        recordedBy: "User",
      };

      // Add dynamic fields
      productivityFields.forEach(field => {
        if (newRecord[field.name] !== undefined && newRecord[field.name] !== '') {
          payload[field.name] = field.type === 'number' ? parseFloat(newRecord[field.name]) : newRecord[field.name];
        }
      });

      const res = await fetch(`http://localhost:5000/productivity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        // Refresh records
        if (selectedAnimal.isGroup) {
          fetchProductivityRecords(selectedAnimal.batchId, true);
        } else {
          fetchProductivityRecords(selectedAnimal._id, false);
        }
        setShowAddRecordModal(false);
        setSelectedAnimal(null);
        fetchData();
        
        setPopup({ show: true, success: true, message: "Productivity record saved successfully!" });
      } else {
        const errorData = await res.json();
        setPopup({ show: true, success: false, message: errorData.message || "Failed to save record" });
      }
    } catch (err) {
      console.error("Error saving productivity record:", err);
      setPopup({ show: true, success: false, message: `Error: ${err.message}` });
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
      const updateData = {
        date: editedRecord.date,
        notes: editedRecord.notes
      };
      productivityFields.forEach(field => {
        if (editedRecord[field.name] !== undefined) {
          updateData[field.name] = field.type === 'number' ? parseFloat(editedRecord[field.name]) : editedRecord[field.name];
        }
      });

      const res = await fetch(`http://localhost:5000/productivity/${selectedRecord._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
     
      if (res.ok) {
        if (selectedAnimal.isGroup) {
          fetchProductivityRecords(selectedAnimal.batchId, true);
        } else {
          fetchProductivityRecords(selectedAnimal._id, false);
        }
        setEditMode(false);
        setSelectedRecord(null);
        fetchData();
        setPopup({ show: true, success: true, message: "Record updated successfully!" });
      } else {
        throw new Error("Failed to update record");
      }
    } catch (err) {
      console.error("Error updating record:", err);
      setPopup({ show: true, success: false, message: "Failed to update record" });
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        const res = await fetch(`http://localhost:5000/productivity/${recordId}`, {
          method: "DELETE",
        });
       
        if (res.ok) {
          if (selectedAnimal.isGroup) {
            fetchProductivityRecords(selectedAnimal.batchId, true);
          } else {
            fetchProductivityRecords(selectedAnimal._id, false);
          }
          fetchData();
          setPopup({ show: true, success: true, message: "Record deleted successfully!" });
        } else {
          throw new Error("Failed to delete record");
        }
      } catch (err) {
        console.error("Error deleting record:", err);
        setPopup({ show: true, success: false, message: "Failed to delete record" });
      }
    }
  };

  const handleViewAnalytics = () => {
    setShowAnalytics(!showAnalytics);
    if (!showAnalytics) {
      setAnalyticsData(prepareAnalyticsData());
    }
  };

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
       
        if (key === "zone" && !animal.isGroup) {
          return getZoneInfo(animal).name.toLowerCase().includes(filterValues[key].toLowerCase());
        }
       
        if (key === "healthStatus" && !animal.isGroup) {
          const healthStatus = animal.data?.healthStatus || "";
          return healthStatus.toLowerCase().includes(filterValues[key].toLowerCase());
        }
       
        if (key === "gender" && !animal.isGroup) {
          const gender = animal.data?.gender || "";
          return gender.toLowerCase().includes(filterValues[key].toLowerCase());
        }
       
        if (key === "ageRange" && !animal.isGroup) {
          const ageText = calculateAge(animal);
          if (ageText === "Unknown") return false;
         
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
        {productivityFields.map((field, idx) => (
          <div key={idx}>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              {field.label} ({field.unit || ''})
            </label>
            <input
              type={field.type}
              value={editedRecord[field.name] || ''}
              onChange={(e) => setEditedRecord({...editedRecord, [field.name]: e.target.value})}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required={field.required}
            />
          </div>
        ))}
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
                  {productivityFields.map((field, idx) => (
                    <th key={idx} className="p-2 text-center text-gray-700 dark:text-gray-300">
                      {field.label} ({field.unit || ''})
                    </th>
                  ))}
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
                      {productivityFields.map((field, fIdx) => (
                        <td key={fIdx} className="p-2 text-center text-gray-900 dark:text-white">
                          {record[field.name] !== undefined ? record[field.name] : "-"}
                        </td>
                      ))}
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

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-300 dark:border-gray-700 rounded shadow-lg">
          <p className="label text-gray-900 dark:text-white">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="intro" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Analytics View (simplified)
  const AnalyticsView = () => {
    if (!analyticsData) {
      return (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading analytics data...</p>
        </div>
      );
    }

    return (
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Productivity Analytics</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {analyticsData.lastUpdated}
            <button 
              onClick={fetchData}
              className="ml-3 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Insights Section */}
        {insights.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Insights</h4>
            <div className="grid grid-cols-1 gap-3">
              {insights.map((insight, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${
                    insight.type === "success" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" :
                    insight.type === "warning" ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200" :
                    "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                  }`}
                >
                  <div className="flex items-center">
                    {insight.type === "success" && <TrendingUp size={18} className="mr-2" />}
                    {insight.type === "warning" && <AlertTriangle size={18} className="mr-2" />}
                    {insight.type === "danger" && <TrendingDown size={18} className="mr-2" />}
                    {insight.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Productivity Trend Charts (two per row) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {productivityFields.filter(f => f.type === 'number').map((field, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
              <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white text-center">
                {field.label} Trend Over Time ({field.unit || ''})
              </h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey={`fields.${field.name}.total`} 
                      name="Total" 
                      stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
        
        {/* Weekly Productivity Charts (two per row) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {productivityFields.filter(f => f.type === 'number').map((field, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
              <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white text-center">
                Last 7 Days {field.label} ({field.unit || ''})
              </h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey={`fields.${field.name}`} name="Daily" fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
        
        {/* Monthly Productivity Charts (two per row) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {productivityFields.filter(f => f.type === 'number').map((field, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
              <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white text-center">
                Last 4 Weeks {field.label} ({field.unit || ''})
              </h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey={`fields.${field.name}`} name="Weekly" fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Colors for charts
  const CHART_COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', 
    '#FFBB28', '#FF8042', '#A4DE6C', '#D0ED57', '#FFC0CB', '#8A2BE2'
  ];

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

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={16} className="inline ml-1" /> : <ChevronDown size={16} className="inline ml-1" />;
  };

  const filteredAnimalsList = filteredAnimals.sort((a, b) => {
    let aValue = sortConfig.key === 'name' ? a.data?.name : a[sortConfig.key];
    let bValue = sortConfig.key === 'name' ? b.data?.name : b[sortConfig.key];
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  }); // Add sorting

  // Calculate summary stats
  const getSummary = () => {
    const totalAnimals = animals.length;
    // Add more as needed
    return { totalAnimals };
  };

  const summary = getSummary();

  // Render
  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "light-beige"}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <PawPrint  className="text-green-500" size={32} />
          {animalType.name.charAt(0).toUpperCase() + animalType.name.slice(1).toLowerCase()} Productivity
        </h1>
        <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Manage and track productivity records
        </p>
      </div>

      {/* Popup */}
      {popup.show && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setPopup({ ...popup, show: false })}
        >
          <div
            className={`bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-xs text-center shadow-xl border-t-4 ${
              popup.success ? "border-green-500" : "border-red-500"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="mb-4">
              {popup.success ? (
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto relative flex items-center justify-center">
                  <div className="w-10 h-5 border-l-2 border-b-2 border-green-500 rotate-[-45deg] translate-y-[-2px]"></div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto relative flex items-center justify-center">
                  <span className="w-8 h-1 bg-red-500 rotate-45 absolute"></span>
                  <span className="w-8 h-1 bg-red-500 -rotate-45 absolute"></span>
                </div>
              )}
            </div>

            {/* Message */}
            <p className="text-sm font-medium dark:text-gray-200 mb-2">{popup.message}</p>

            {/* Button */}
            <button
              onClick={() => {
                setPopup({ ...popup, show: false });

                if (popup.success) {
                  // Success → redirect to /AnimalManagement if needed, but per user, stay
                }
              }}
              className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
                popup.success
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              } transition-colors`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${darkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
            <Package className="text-blue-500" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Total Animals</h3>
            <p className="text-2xl font-bold">{summary.totalAnimals}</p>
          </div>
        </div>
        
        {productivityFields.filter(f => f.type === 'number').map((field, idx) => (
          <React.Fragment key={idx}>
            <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
              <div className={`p-3 rounded-full ${darkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
                <Package className="text-blue-500" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">{field.label} Daily</h3>
                <p className="text-2xl font-bold">{calculateTotalProductivity('day', field.name)} {field.unit || ''}</p>
              </div>
            </div>
            <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
              <div className={`p-3 rounded-full ${darkMode ? "bg-purple-900/30" : "bg-purple-100"}`}>
                <Package className="text-purple-500" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">{field.label} Weekly</h3>
                <p className="text-2xl font-bold">{calculateTotalProductivity('week', field.name)} {field.unit || ''}</p>
              </div>
            </div>
            <div className={`p-5 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg transition-all hover:shadow-xl flex items-center gap-4`}>
              <div className={`p-3 rounded-full ${darkMode ? "bg-orange-900/30" : "bg-orange-100"}`}>
                <Package className="text-orange-500" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">{field.label} Monthly</h3>
                <p className="text-2xl font-bold">{calculateTotalProductivity('month', field.name)} {field.unit || ''}</p>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Controls Section */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button 
            onClick={fetchData}
            className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
              darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"
            } transition-all`}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button 
            onClick={handleViewAnalytics} 
            className="bg-green-600 px-4 py-2 rounded-lg text-white hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <BarChart3 size={18} />
            {showAnalytics ? "Hide Analytics" : "Show Analytics"}
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && <AnalyticsView />}

      {/* Filter Section */}
      <div className={`p-4 rounded-xl shadow-lg mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
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
                placeholder="mm/dd/yyyy"
              />
              <span className="self-center text-gray-700 dark:text-gray-300">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange("end", e.target.value)}
                className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="mm/dd/yyyy"
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

      {/* Results Count */}
      <div className={`mb-4 flex justify-between items-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        <p className="text-sm">
          Showing {filteredAnimals.length} of {animals.length} items
        </p>
        {filteredAnimals.length === 0 && (
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterValues({});
              setDateRange({ start: "", end: "" });
              setActiveTab("all");
            }}
            className="text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={darkMode ? "bg-gray-700" : "bg-gray-100"}>
              <tr>
                <th className="p-3 text-center"></th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('id')}
                >
                  <div className="flex items-center">
                    {animalType.managementType === "batch" ? "Batch ID" : "QR & ID"} {getSortIcon('id')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    {animalType.managementType === "batch" ? "Batch Name" : "Name"} {getSortIcon('name')}
                  </div>
                </th>
                {animalType.managementType !== "batch" && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Gender</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Age</th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Zone</th>
                {animalType.managementType !== "batch" && (
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Health Status</th>
                )}
                {animalType.managementType === "batch" && (
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Animal Count</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Weight</th>
               
                {/* Dynamic Productivity Field Columns */}
                {productivityFields.map((field, idx) => (
                  <th key={idx} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    {field.label} ({field.unit || ''})
                  </th>
                ))}
               
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Last Record</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {filteredAnimalsList.length > 0 ? (
                filteredAnimalsList.map((animal) => {
                  const records = productivityRecords[animal.isGroup ? animal.batchId : animal._id] || [];
                  const latestRecord = getLatestRecord(records);
                  const healthStatus = getHealthStatus(animal);
                 
                  return (
                    <React.Fragment key={animal.isGroup ? animal.batchId : animal._id}>
                      <tr className={darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
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
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start">
                            {!animal.isGroup && animal.qrCode ? (
                              <div>
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
                              <div className="font-semibold">
                                {animal.batchId}
                              </div>
                            ) : (
                              animal.animalId
                            )}
                          </div>
                        </td>

                        {/* Name / Batch Name */}
                        <td className="px-6 py-4 font-medium">
                          {animal.data?.name || (animal.isGroup ? `Batch ${animal.batchId}` : "Unnamed")}
                        </td>

                        {/* Gender (only for individual animals) */}
                        {animalType.managementType !== "batch" && (
                          <td className="px-6 py-4">
                            {animal.data?.gender || "Unknown"}
                          </td>
                        )}

                        {/* Age (only for individual animals) */}
                        {animalType.managementType !== "batch" && (
                          <td className="px-6 py-4">
                            {calculateAge(animal)}
                          </td>
                        )}

                        {/* Zone */}
                        <td className="px-6 py-4">
                          {animal.isGroup ? "Multiple Zones" : getZoneInfo(animal).name}
                        </td>

                        {/* Health Status (only for individual animals) / Animal Count (for batches) */}
                        {animalType.managementType !== "batch" ? (
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${healthStatus.colorClass}`}>
                              {healthStatus.status}
                            </span>
                          </td>
                        ) : (
                          <td className="px-6 py-4 font-semibold">
                            {animal.animals?.length || animal.data?.batchCount || 0}
                          </td>
                        )}

                        {/* Weight */}
                        <td className="px-6 py-4">
                          {animal.isGroup ?
                            `${animal.animals?.reduce((sum, a) => sum + (parseFloat(a.data?.weight) || 0), 0).toFixed(1)} kg total` :
                            `${animal.data?.weight || "Unknown"} kg`
                          }
                        </td>

                        {/* Dynamic Productivity Field Columns */}
                        {productivityFields.map((field, idx) => {
                          const { average } = calculateProductivityTotals(records, 'day', field.name);
                         
                          return (
                            <td key={idx} className="px-6 py-4 font-semibold">
                              {average > 0 ? average.toFixed(1) : "-"} {field.unit || ''}
                            </td>
                          );
                        })}

                        {/* Last Record Date */}
                        <td className="px-6 py-4">
                          {latestRecord ? new Date(latestRecord.date).toLocaleDateString() : "No records"}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddProductivityRecord(animal);
                              }}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                            >
                              <Plus size={16} />
                              Add Record
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewHistory(animal);
                              }}
                              className={`p-2 rounded-lg transition-all ${darkMode ? "text-purple-400 hover:bg-gray-700" : "text-purple-600 hover:bg-gray-100"}`}
                              title="View History"
                            >
                              <TrendingUp size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                     
                      {/* Expanded Row for Details */}
                      {expandedRows[animal.isGroup ? animal.batchId : animal._id] && (
                        <tr className="bg-gray-50 dark:bg-gray-700">
                          <td colSpan={11 + productivityFields.length + (animalType.managementType === "batch" ? -2 : 0)} className="p-4">
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
                                </div>
                              </div>
                             
                              {/* Productivity Summary (dynamic fields) */}
                              <div className="flex-1">
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white text-center">Productivity Summary</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {productivityFields.map((field, idx) => {
                                    const daily = calculateProductivityTotals(records, 'day', field.name);
                                    const weekly = calculateProductivityTotals(records, 'week', field.name);
                                    const monthly = calculateProductivityTotals(records, 'month', field.name);
                                   
                                    return (
                                      <React.Fragment key={idx}>
                                        <div className="col-span-2 font-medium mt-2 first:mt-0 text-center">{field.label} ({field.unit || ''})</div>
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
                                          <span className="font-medium">Last Record:</span> {records.length > 0 ? new Date(records[records.length - 1].date).toLocaleDateString() : "None"}
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
                                        <div className="font-medium text-center">
                                          {productivityFields.map(field => record[field.name] !== undefined ? `${field.label}: ${record[field.name]} ${field.unit || ''}` : '').filter(Boolean).join(', ')}
                                        </div>
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
              ) : (
                <tr>
                  <td colSpan={11 + productivityFields.length + (animalType.managementType === "batch" ? -2 : 0)} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center h-full">
                      <Package size={48} className="text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No animals found</h3>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Try adjusting your search or filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddRecordModal && selectedAnimal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-md w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Plus size={24} />
                Add Productivity Record
              </h2>
              <button
                onClick={() => setShowAddRecordModal(false)}
                className={`p-2 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition-all`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {productivityFields.map((field, idx) => (
                <div key={idx}>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {field.label} ({field.unit || ''}) {field.required ? '*' : ''}
                  </label>
                  <input
                    type={field.type}
                    value={newRecord[field.name] || ''}
                    onChange={(e) => handleRecordChange(field.name, e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    }`}
                    required={field.required}
                  />
                </div>
              ))}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Date
                </label>
                <input
                  type="date"
                  value={newRecord.date}
                  onChange={(e) => handleRecordChange("date", e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Notes
                </label>
                <textarea
                  value={newRecord.notes}
                  onChange={(e) => handleRecordChange("notes", e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  rows="3"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddRecordModal(false)}
                className={`px-4 py-2.5 rounded-lg ${
                  darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                } transition-all`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProductivityRecord}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <Bell size={16} />
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedAnimal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-4xl w-full p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp size={24} />
                Productivity History
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className={`p-2 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition-all`}
              >
                <X size={20} />
              </button>
            </div>
            
            {editMode ? (
              <EditRecordForm />
            ) : (
              <RecordTable />
            )}
          </div>
        </div>
      )}
    </div>
  );
}