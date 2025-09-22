import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.js";
import { QRCodeCanvas } from "qrcode.react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  BarChart3,
  RefreshCw,
  AlertCircle,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AnimalList() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const [animals, setAnimals] = useState([]);
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

  // Advanced search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({});
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Add export modal state
  const [exportModal, setExportModal] = useState({
    open: false,
    format: 'excel',
    selection: 'current', // 'current' or 'all'
    includeQR: false
  });

  useEffect(() => {
    document.title = "Animal List";
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

  // Fetch data with zone information - UPDATED: Handle batch records properly
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const typeRes = await fetch(`http://localhost:5000/animal-types/${type}`);
      if (!typeRes.ok) throw new Error(`Animal type not found`);
      const typeData = await typeRes.json();
      setAnimalType(typeData);

      // Initialize editData for appropriate category
      const mainCategory = typeData.categories.find(
        cat => cat.name === "Basic Info" || cat.name === "Batch Info" || cat.name === "Hive/Farm Info"
      );
      const initialEditData = {};
      if (mainCategory)
        mainCategory.fields.forEach(
          (field) => (initialEditData[field.name] = "")
        );
      setEditData(initialEditData);

      // Fetch animals with populated zone data
      const animalsRes = await fetch(
        `http://localhost:5000/animals?type=${typeData._id}`
      );
      if (!animalsRes.ok) throw new Error("Failed to fetch animals");
      const animalsData = await animalsRes.json();
      
      // FIXED: Handle batch records properly - don't group on frontend
      // Backend now returns batch records as single records with count field
      setAnimals(animalsData);
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

  // FIXED: Delete function to handle batch records properly
  const handleDelete = async (animalId, isBatch = false) => {
    setPopup({
      show: true,
      message: isBatch 
        ? `Are you sure you want to delete this entire batch? This will delete all ${animalType?.name.toLowerCase()}s in this batch.` 
        : "Are you sure you want to delete this animal?",
      success: false,
      type: "delete",
      confirmAction: async () => {
        try {
          if (isBatch) {
            // Delete batch record (single record representing the batch)
            const res = await fetch(`http://localhost:5000/animals/${animalId}`, {
              method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete batch");
          } else {
            // Delete individual animal
            const res = await fetch(`http://localhost:5000/animals/${animalId}`, {
              method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete animal");
          }
          fetchData();
          showPopup(isBatch ? "Batch deleted successfully!" : "Animal deleted successfully!", true, "save");
        } catch (err) {
          showPopup(err.message, false, "error");
        }
      },
    });
  };

  const handleEdit = (animal) => {
    setEditId(animal._id);
    const editValues = {};
    Object.keys(editData).forEach(
      (key) => (editValues[key] = animal.data[key] || "")
    );
    setEditData(editValues);
  };

  // FIXED: Update function to handle batch records
  const handleUpdate = async (id) => {
    const emptyFields = Object.entries(editData)
      .filter(([key, value]) => !value || value.toString().trim() === "")
      .map(([key]) => key);

    if (emptyFields.length > 0) {
      showPopup(
        `Please fill all fields before saving. Missing: ${emptyFields.join(
          ", "
        )}`,
        false,
        "error"
      );
      return;
    }

    try {
      const currentAnimalRes = await fetch(`http://localhost:5000/animals/${id}`);
      if (!currentAnimalRes.ok) throw new Error("Failed to fetch current animal data");
      const currentAnimal = await currentAnimalRes.json();
      
      const mergedData = {
        ...currentAnimal.data,
        ...editData
      };

      const res = await fetch(`http://localhost:5000/animals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: mergedData, updatedAt: Date.now() }),
      });
      if (!res.ok) throw new Error("Failed to update animal");
      const updatedAnimal = await res.json();
      
      // FIXED: Update the animal in state to reflect changes immediately
      setAnimals((prev) => prev.map((a) => (a._id === id ? updatedAnimal : a)));
      setEditId(null);
      showPopup("Animal updated successfully!");
    } catch (err) {
      showPopup(err.message, false, "error");
    }
  };

  // Get appropriate fields based on management type
  const getDisplayFields = () => {
    if (!animalType) return [];
    
    if (animalType.managementType === "batch") {
      return animalType.categories.find(cat => cat.name === "Batch Info")?.fields || [];
    } else if (animalType.managementType === "other") {
      return animalType.categories.find(cat => cat.name === "Hive/Farm Info")?.fields || [];
    } else {
      return animalType.categories.find(cat => cat.name === "Basic Info")?.fields || [];
    }
  };

  const displayFields = getDisplayFields();

  // Get group identifier for display
  const getGroupIdentifier = (animal) => {
    if (animal.isBatch) {
      return `Batch: ${animal.animalId}`;
    } else if (animalType.managementType === "batch") {
      return animal.batchId;
    } else if (animalType.managementType === "other") {
      return animal.groupId || animal.batchId || animal._id;
    }
    return animal.animalId;
  };

  // Get display count for animal
  const getDisplayCount = (animal) => {
    // FIXED: Always use count field if it exists, otherwise default to 1
    return animal.isBatch ? (animal.count || 1) : 1;
  };

  // Advanced search & filter logic
  const handleFilterChange = (field, value) => {
    const newFilterValues = { ...filterValues, [field]: value };
    setFilterValues(newFilterValues);
    
    // Update active filters
    if (value) {
      if (!activeFilters.includes(field)) {
        setActiveFilters([...activeFilters, field]);
      }
    } else {
      setActiveFilters(activeFilters.filter(f => f !== field));
    }
  };

  const removeFilter = (field) => {
    const newFilterValues = { ...filterValues };
    delete newFilterValues[field];
    setFilterValues(newFilterValues);
    setActiveFilters(activeFilters.filter(f => f !== field));
  };

  const clearAllFilters = () => {
    setFilterValues({});
    setActiveFilters([]);
    setSearchQuery("");
  };

  // Sorting functionality
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  // Filter and sort animals
  const filteredAnimals = animals.filter((animal) => {
    // Search query matching
    const matchesSearch = searchQuery
      ? Object.values(animal.data).some((val) =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        ) || 
        (getGroupIdentifier(animal) && getGroupIdentifier(animal).toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    // Filter matching
    const matchesFilters = Object.keys(filterValues).every((key) => {
      if (!filterValues[key]) return true;
      const val = animal.data[key] || "";
      if (displayFields.find((f) => f.name === key)?.type === "number") {
        return Number(val) === Number(filterValues[key]);
      }
      return String(val)
        .toLowerCase()
        .includes(filterValues[key].toLowerCase());
    });

    return matchesSearch && matchesFilters;
  });

  // Apply sorting
  const sortedAnimals = [...filteredAnimals].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue, bValue;
    
    if (sortConfig.key === 'zone') {
      aValue = getZoneInfo(a).name;
      bValue = getZoneInfo(b).name;
    } else if (sortConfig.key === 'count') {
      aValue = getDisplayCount(a);
      bValue = getDisplayCount(b);
    } else {
      aValue = a.data[sortConfig.key] || "";
      bValue = b.data[sortConfig.key] || "";
    }
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Export data function
  const exportData = () => {
    const dataToExport = exportModal.selection === 'current' ? sortedAnimals : animals;
    
    if (dataToExport.length === 0) {
      showPopup("No data available to export", false, "error");
      return;
    }

    if (exportModal.format === 'excel') {
      exportToExcel(dataToExport);
    } else {
      exportToPDF(dataToExport);
    }
    
    setExportModal({ open: false, format: 'excel', selection: 'current', includeQR: false });
  };

  // Export to Excel function - UPDATED for batch records
  const exportToExcel = (data) => {
    try {
      // Prepare data for Excel
      const worksheetData = data.map(animal => {
        const rowData = {
          'ID': getGroupIdentifier(animal),
          'Zone': getZoneInfo(animal).name,
          'Count': getDisplayCount(animal), // FIXED: Use getDisplayCount function
        };

        // Add dynamic fields
        displayFields.forEach(field => {
          rowData[field.label] = animal.data[field.name] || '-';
        });

        return rowData;
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // Set column widths
      const colWidths = [
        { wch: 25 }, // ID (wider for batch IDs)
        { wch: 15 }, // Zone
        { wch: 10 }, // Count
      ];
      
      displayFields.forEach(() => {
        colWidths.push({ wch: 20 });
      });
      
      worksheet['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, `${animalType.name} List`);
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, `${animalType.name}_List_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      showPopup("Excel file downloaded successfully!", true, "save");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      showPopup("Failed to export Excel file", false, "error");
    }
  };

  // Export to PDF function - UPDATED for batch records
  const exportToPDF = (data) => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`${animalType.name} List - ${new Date().toLocaleDateString()}`, 14, 15);

      // Prepare table data
      const headers = [
        'ID', 
        'Zone',
        'Count',
        ...displayFields.map(f => f.label)
      ];

      const tableData = data.map(animal => [
        getGroupIdentifier(animal),
        getZoneInfo(animal).name,
        getDisplayCount(animal).toString(), // FIXED: Use getDisplayCount function
        ...displayFields.map(field => animal.data[field.name] || '-')
      ]);

      // Create table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 20,
        theme: 'grid',
        headStyles: {
          fillColor: darkMode ? [55, 65, 81] : [79, 70, 229],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: darkMode ? [229, 231, 235] : [0, 0, 0],
          fillColor: darkMode ? [31, 41, 55] : [255, 255, 255]
        },
        alternateRowStyles: {
          fillColor: darkMode ? [40, 50, 65] : [240, 240, 240]
        },
        margin: { top: 20 },
        styles: {
          cellPadding: 2,
          halign: 'left',
          valign: 'middle',
          overflow: 'linebreak'
        }
      });

      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
      }

      // Save PDF
      doc.save(`${animalType.name}_List_${new Date().toISOString().split('T')[0]}.pdf`);
      
      showPopup("PDF downloaded successfully!", true, "save");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      showPopup("Failed to export PDF", false, "error");
    }
  };

  // Loading / Error
  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-48 text-gray-700 dark:text-gray-300">
        <svg
          className="animate-spin h-12 w-12 text-green-600 dark:text-green-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="mt-4 font-medium">Loading data...</p>
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
    <div className={`min-h-screen ${darkMode ? "dark bg-dark-bg" : "bg-light-beige"} p-6`}>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h2 className={`text-2xl font-semibold ${darkMode ? "text-dark-text" : "text-dark-gray"} mb-1`}>
            {animalType.name.charAt(0).toUpperCase() + animalType.name.slice(1).toLowerCase()} List
            {animalType.managementType !== "individual" && 
              ` (${animalType.managementType === "batch" ? "Batch" : "Hive/Farm"} View)`}
          </h2>

          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Manage and track your {animalType.name.toLowerCase()} inventory
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExportModal({ open: true, format: 'excel', selection: 'current', includeQR: false })}
            className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold bg-btn-teal text-white hover:bg-teal-700"
          >
            <Download size={16} />
            Export Data
          </button>
          <button
            onClick={() => navigate(`/AnimalManagement/add-animal/${animalType._id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold bg-btn-teal text-white hover:bg-teal-700"
          >
            ➕ Add New {animalType.managementType !== "individual" 
              ? (animalType.managementType === "batch" ? "Batch" : "Hive/Farm") 
              : animalType.name}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-xl ${darkMode ? "bg-dark-card" : "bg-soft-white"} shadow-lg`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${darkMode ? "bg-btn-teal/20" : "bg-btn-teal/10"}`}>
              <BarChart3 size={20} className="text-btn-teal" />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Total</p>
              <p className={`text-xl font-bold ${darkMode ? "text-dark-text" : "text-dark-gray"}`}>{animals.length}</p>
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-xl ${darkMode ? "bg-dark-card" : "bg-soft-white"} shadow-lg`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${darkMode ? "bg-blue-500/20" : "bg-blue-500/10"}`}>
              <AlertCircle size={20} className="text-blue-500" />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Filtered</p>
              <p className={`text-xl font-bold ${darkMode ? "text-dark-text" : "text-dark-gray"}`}>{sortedAnimals.length}</p>
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-xl ${darkMode ? "bg-dark-card" : "bg-soft-white"} shadow-lg`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${darkMode ? "bg-green-500/20" : "bg-green-500/10"}`}>
              <RefreshCw size={20} className="text-green-500" />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Last Updated</p>
              <p className={`text-sm font-medium ${darkMode ? "text-dark-text" : "text-dark-gray"}`}>Just now</p>
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-xl ${darkMode ? "bg-dark-card" : "bg-soft-white"} shadow-lg`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${darkMode ? "bg-purple-500/20" : "bg-purple-500/10"}`}>
              <Download size={20} className="text-purple-500" />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Actions</p>
              <button 
                onClick={() => setExportModal({ open: true, format: 'excel', selection: 'current', includeQR: false })}
                className="text-sm font-medium text-btn-teal hover:underline"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className={`p-4 rounded-xl shadow-lg mb-6 ${darkMode ? "bg-dark-card" : "bg-soft-white"}`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search
                size={20}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="text"
                placeholder="Search by any field..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                  darkMode ? "bg-dark-bg border-gray-600 text-dark-text" : "bg-white border-gray-300 text-dark-gray"
                }`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`mt-3 flex items-center gap-2 text-sm ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"} transition-colors`}
            >
              <Filter size={16} />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {displayFields.slice(0, 3).map((field) => (
                  <div key={field.name}>
                    <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {field.label}
                    </label>
                    <input
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                      placeholder={`Filter by ${field.label}`}
                      value={filterValues[field.name] || ""}
                      onChange={(e) => handleFilterChange(field.name, e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? "bg-dark-bg border-gray-600 text-dark-text" : "bg-white border-gray-300 text-dark-gray"
                      }`}
                    />
                  </div>
                ))}
                
                {/* Zone filter */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Zone
                  </label>
                  <select
                    value={filterValues.zone || ""}
                    onChange={(e) => handleFilterChange("zone", e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode ? "bg-dark-bg border-gray-600 text-dark-text" : "bg-white border-gray-300 text-dark-gray"
                    }`}
                  >
                    <option value="">All Zones</option>
                    {zones.map(zone => (
                      <option key={zone._id} value={zone.name}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Active filters:</span>
              <button 
                onClick={clearAllFilters}
                className="text-sm text-btn-teal hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((field) => (
                <span 
                  key={field} 
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                    darkMode ? "bg-btn-teal/20 text-btn-teal" : "bg-btn-teal/10 text-btn-teal"
                  }`}
                >
                  {field === "zone" ? "Zone" : displayFields.find(f => f.name === field)?.label || field}: {filterValues[field]}
                  <button 
                    onClick={() => removeFilter(field)}
                    className="ml-1 hover:opacity-70"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className={`mb-4 flex justify-between items-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        <p className="text-sm">
          Showing {sortedAnimals.length} of {animals.length} items
        </p>
        {activeFilters.length > 0 || searchQuery ? (
          <button
            onClick={clearAllFilters}
            className="text-sm text-btn-teal hover:underline flex items-center gap-1"
          >
            <X size={14} />
            Clear all filters
          </button>
        ) : null}
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
              <th className="p-3 text-center">QR & ID</th>
              <th 
                className="p-3 cursor-pointer hover:bg-opacity-80"
                onClick={() => requestSort('zone')}
              >
                <div className="flex items-center">
                  Zone {getSortIcon('zone')}
                </div>
              </th>
              <th 
                className="p-3 text-center cursor-pointer hover:bg-opacity-80"
                onClick={() => requestSort('count')}
              >
                <div className="flex items-center justify-center">
                  Count {getSortIcon('count')}
                </div>
              </th>
              {displayFields.map((field, idx) => (
                <th 
                  key={idx} 
                  className="p-3 cursor-pointer hover:bg-opacity-80"
                  onClick={() => requestSort(field.name)}
                >
                  <div className="flex items-center">
                    {field.label} {getSortIcon(field.name)}
                  </div>
                </th>
              ))}
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAnimals.length === 0 ? (
              <tr>
                <td
                  colSpan={displayFields.length + 4} // FIXED: Always 4 columns (ID, Zone, Count, Actions)
                  className="p-4 text-center italic text-gray-500 dark:text-gray-400"
                >
                  No matching {animalType.name} found.
                </td>
              </tr>
            ) : (
              sortedAnimals.map((animal) => (
                <tr
                  key={animal._id}
                  className={`${
                    darkMode ? "bg-dark-card text-dark-text" : "bg-white"
                  } hover:${darkMode ? "bg-dark-gray" : "bg-gray-100"}`}
                >
                  {/* QR Code + Animal/Batch ID */}
                  <td className="p-3">
                    <div className="flex flex-col items-center justify-center">
                      {animal.isBatch ? (
                        <div className="text-center">
                          <QRCodeCanvas 
                            value={animal.batchId || animal.animalId} 
                            size={60} 
                            level="H" 
                            className="mx-auto"
                          />
                          <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                            <strong>Batch: {animal.animalId}</strong>
                          </div>
                        </div>
                      ) : animalType.managementType !== "individual" ? (
                        <div className="text-center">
                          <QRCodeCanvas 
                            value={getGroupIdentifier(animal)} 
                            size={60} 
                            level="H" 
                            className="mx-auto"
                          />
                          <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                            {animalType.managementType === "batch" ? "Batch: " : "ID: "}
                            {getGroupIdentifier(animal)}
                          </div>
                        </div>
                      ) : animal.qrCode ? (
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
                        "-"
                      )}
                    </div>
                  </td>

                  {/* Zone */}
                  <td className="p-2 text-center">
                    {getZoneInfo(animal).name}
                  </td>

                  {/* Count - FIXED: Use getDisplayCount function */}
                  <td className="p-2 text-center font-semibold">
                    {getDisplayCount(animal)}
                  </td>

                  {/* Dynamic Fields */}
                  {displayFields.map((field, idx) => (
                    <td key={idx} className="p-2 text-center">
                      {editId === animal._id ? (
                        field.type === "select" && field.options ? (
                          <select
                            value={editData[field.name] || ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                [field.name]: e.target.value,
                              })
                            }
                            className={`w-full p-1 rounded border ${
                              darkMode
                                ? "bg-dark-card border-gray-600 text-dark-text"
                                : "border-gray-200"
                            }`}
                          >
                            <option value="">Select {field.label}</option>
                            {field.options.map((opt, i) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={
                              field.type === "number"
                                ? "number"
                                : field.type === "date"
                                ? "date"
                                : "text"
                            }
                            value={editData[field.name] || ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                [field.name]: e.target.value,
                              })
                            }
                            className={`w-full p-1 rounded border ${
                              darkMode
                                ? "bg-dark-card border-gray-600 text-dark-text"
                                : "border-gray-200"
                            }`}
                          />
                        )
                      ) : (
                        animal.data[field.name] || "-"
                      )}
                    </td>
                  ))}

                  {/* Actions */}
                  <td className="p-2 text-center">
                    <div className="flex justify-center gap-2">
                      {editId === animal._id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(animal._id)}
                            className="px-2 py-1 rounded bg-btn-teal text-white hover:bg-teal-700"
                          >
                            💾 Save
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="px-2 py-1 rounded bg-btn-gray text-white hover:bg-gray-700"
                          >
                            ✖ Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(animal)}
                            className="px-2 py-1 rounded bg-btn-blue text-white hover:bg-blue-800"
                          >
                            ✏ Edit
                          </button>
                          <button
                            onClick={() => {
                              setAnimalToMove(animal);
                              setMoveZoneId("");
                            }}
                            className="px-2 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
                          >
                            🏠 Move
                          </button>
                          <button
                            onClick={() => handleDelete(
                              animal._id, // FIXED: Always use animal._id
                              animal.isBatch // FIXED: Pass isBatch flag
                            )}
                            className="px-2 py-1 rounded bg-btn-red text-white hover:bg-red-600"
                          >
                            🗑 Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Move Zone Modal */}
      {animalToMove && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className={`bg-white dark:bg-dark-card p-6 rounded-xl w-96 ${darkMode ? "text-dark-text" : ""}`}>
            <h3 className="text-lg font-semibold mb-4">
              Move {animalToMove.isBatch ? "Batch" : animalType.managementType !== "individual" 
                ? (animalType.managementType === "batch" ? "Batch" : "Hive/Farm") 
                : animalToMove.data?.name} to another zone
            </h3>
            <select
              value={moveZoneId}
              onChange={(e) => setMoveZoneId(e.target.value)}
              className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a zone</option>
              {zones.map(zone => (
                <option 
                  key={zone._id} 
                  value={zone._id}
                  disabled={zone.currentOccupancy >= zone.capacity && zone._id !== getZoneInfo(animalToMove).id}
                >
                  {zone.name} ({zone.currentOccupancy}/{zone.capacity})
                  {zone.currentOccupancy >= zone.capacity && zone._id !== getZoneInfo(animalToMove).id && " - FULL"}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAnimalToMove(null)}
                className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!moveZoneId) {
                    showPopup("Please select a zone", false, "error");
                    return;
                  }
                  
                  try {
                    // FIXED: Use single endpoint for both individual and batch animals
                    const res = await fetch(`http://localhost:5000/animals/${animalToMove._id}/move-zone`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ zoneId: moveZoneId }),
                    });
                    
                    if (!res.ok) {
                      const errorData = await res.json();
                      throw new Error(errorData.message || "Failed to move animal");
                    }
                    
                    showPopup(animalToMove.isBatch ? "Batch moved successfully!" : "Animal moved successfully!");
                    setAnimalToMove(null);
                    fetchData();
                  } catch (err) {
                    showPopup(err.message, false, "error");
                  }
                }}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-md w-full p-6 ${darkMode ? "bg-dark-card" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Download size={24} />
                Export Data
              </h2>
              <button
                onClick={() => setExportModal({ open: false, format: 'excel', selection: 'current', includeQR: false })}
                className={`p-2 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"} transition-all`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportModal({...exportModal, format: 'excel'})}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center ${
                      exportModal.format === 'excel' 
                        ? 'border-btn-teal bg-btn-teal/10 text-btn-teal' 
                        : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <FileSpreadsheet size={24} />
                    <span className="mt-1 text-sm">Excel</span>
                  </button>
                  <button
                    onClick={() => setExportModal({...exportModal, format: 'pdf'})}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center ${
                      exportModal.format === 'pdf' 
                        ? 'border-btn-teal bg-btn-teal/10 text-btn-teal' 
                        : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <FileText size={24} />
                    <span className="mt-1 text-sm">PDF</span>
                  </button>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Data Selection
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportModal({...exportModal, selection: 'current'})}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center ${
                      exportModal.selection === 'current' 
                        ? 'border-btn-teal bg-btn-teal/10 text-btn-teal' 
                        : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">Current View</span>
                    <span className="text-xs mt-1">{sortedAnimals.length} items</span>
                  </button>
                  <button
                    onClick={() => setExportModal({...exportModal, selection: 'all'})}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center ${
                      exportModal.selection === 'all' 
                        ? 'border-btn-teal bg-btn-teal/10 text-btn-teal' 
                        : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">All Data</span>
                    <span className="text-xs mt-1">{animals.length} items</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setExportModal({ open: false, format: 'excel', selection: 'current', includeQR: false })}
                className={`px-4 py-2.5 rounded-lg ${
                  darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                } transition-all`}
              >
                Cancel
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2.5 bg-btn-teal text-white rounded-lg hover:bg-teal-700 transition-all flex items-center gap-2"
              >
                <Download size={16} />
                Export {exportModal.format.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup */}
      {popup.show && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div
            className={`bg-white dark:bg-dark-card p-5 rounded-2xl w-80 max-w-[90%] text-center shadow-lg animate-popIn border-l-4 ${
              popup.success
                ? "border-btn-teal"
                : popup.type === "delete"
                ? "border-yellow-400"
                : "border-btn-red"
            }`}
          >
            <p className="mb-4">{popup.message}</p>
            {popup.type === "delete" ? (
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    popup.confirmAction?.();
                    setPopup({ ...popup, show: false });
                  }}
                  className="px-4 py-2 rounded bg-btn-red text-white hover:bg-red-600"
                >
                  Yes
                </button>
                <button
                  onClick={() => setPopup({ ...popup, show: false })}
                  className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-600"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setPopup({ ...popup, show: false })}
                className="px-4 py-2 rounded bg-btn-teal text-white hover:bg-teal-700"
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}