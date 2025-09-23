import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLoader } from "../contexts/LoaderContext";
import axios from "axios";
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  BarChart2,
  PieChart as PieIcon,
  LayoutGrid,
  Eye,
  Filter,
  AlertTriangle,
  RefreshCw,
  Download,
  MapPin,
  Ruler,
  Users,
  TrendingUp,
  EyeOff,
  TrendingDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AnimalZones() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { loading, setLoading } = useLoader();

  const [zones, setZones] = useState([]);
  const [search, setSearch] = useState("");
  const [showDiagram, setShowDiagram] = useState(false); // Visuals initially hidden
  const [editingZone, setEditingZone] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedAnimalType, setSelectedAnimalType] = useState("all");
  const [minUtilization, setMinUtilization] = useState("");
  const [maxUtilization, setMaxUtilization] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [insights, setInsights] = useState([]);
  const [error, setError] = useState(null);

  const [newZone, setNewZone] = useState({
    name: "",
    type: "Shelter",
    capacity: 0,
    currentOccupancy: 0,
    dimensions: { length: 0, width: 0, unit: "m" },
    assignedAnimalTypes: [],
    assignedBatch: [],
    environment: { temperature: "", humidity: "", waterDepth: "" },
  });

  const [popup, setPopup] = useState({ show: false, type: "success", message: "" });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, zone: null });
  const [animalTypes, setAnimalTypes] = useState([]);
  const [totalAnimals, setTotalAnimals] = useState(0);

  // Fetch animal counts by type
  const fetchAnimalTypes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/animal-types");
      const types = await Promise.all(
        res.data.map(async (type) => {
          const countRes = await axios.get(`http://localhost:5000/animals/count?type=${type._id}`);
          return { ...type, total: countRes.data.count || 0 };
        })
      );
      setAnimalTypes(types);
      setTotalAnimals(types.reduce((sum, t) => sum + t.total, 0));
    } catch (err) {
      showPopup("error", "Failed to fetch animal types");
      setError("Failed to load animal types. Please try again.");
    }
  };

  useEffect(() => {
    document.title = "Animal Zones - Animal Manager";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("http://localhost:5000/zones");
      setZones(res.data.zones || []);
      generateInsights(res.data.zones || []);
    } catch (err) {
      console.error("Failed to fetch zones:", err.response?.data || err.message);
      showPopup("error", "Failed to fetch zones");
      setError("Failed to load zones data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimalTypes();
  }, []);

  const zoneTypes = ["Shelter", "Cage", "Pond", "Open Field", "Barn", "Shelter + Pond"];
  const units = ["m", "km", "ft"];

  const showPopup = (type, message) => {
    setPopup({ show: true, type, message });
    setTimeout(() => setPopup({ show: false, type, message }), 2000);
  };

  const handleAddZone = async () => {
    if (!newZone.name || !newZone.capacity) {
      showPopup("error", "Name and capacity are required");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/zones", newZone);
      setZones((prev) => [res.data, ...prev]);
      resetForm();
      showPopup("success", "Zone added successfully");
      fetchData();
    } catch (err) {
      console.error("Failed to create zone:", err.response?.data || err.message);
      showPopup("error", "Failed to create zone");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateZone = async () => {
    if (!editingZone) return;
    try {
      setLoading(true);
      const res = await axios.put(`http://localhost:5000/zones/${editingZone._id}`, newZone);
      setZones((prev) => prev.map((z) => (z._id === editingZone._id ? res.data : z)));
      resetForm();
      setEditingZone(null);
      showPopup("success", "Zone updated successfully");
      fetchData();
    } catch (err) {
      console.error("Failed to update zone:", err.response?.data || err.message);
      showPopup("error", "Failed to update zone");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    const zone = confirmDelete.zone;
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/zones/${zone._id}`);
      setZones((prev) => prev.filter((z) => z._id !== zone._id));
      showPopup("success", "Zone deleted successfully");
      fetchData();
    } catch (err) {
      console.error("Failed to delete zone:", err.response?.data || err.message);
      showPopup("error", "Failed to delete zone");
    } finally {
      setConfirmDelete({ show: false, zone: null });
      setLoading(false);
    }
  };

  const handleEditClick = (zone) => {
    setEditingZone(zone);
    setNewZone({
      name: zone.name,
      type: zone.type,
      capacity: zone.capacity,
      currentOccupancy: zone.currentOccupancy,
      dimensions: zone.dimensions || { length: 0, width: 0, unit: "m" },
      assignedAnimalTypes: zone.assignedAnimalTypes || [],
      assignedBatch: zone.assignedBatch || [],
      environment: zone.environment || { temperature: "", humidity: "", waterDepth: "" },
    });
  };

  const resetForm = () => {
    setNewZone({
      name: "",
      type: "Shelter",
      capacity: 0,
      currentOccupancy: 0,
      dimensions: { length: 0, width: 0, unit: "m" },
      assignedAnimalTypes: [],
      assignedBatch: [],
      environment: { temperature: "", humidity: "", waterDepth: "" },
    });
  };

  const toSqMeters = (length, width, unit) => {
    const L = Number(length) || 0;
    const W = Number(width) || 0;
    if (!unit || unit === "m") return L * W;
    if (unit === "km") return L * 1000 * (W * 1000);
    if (unit === "ft") {
      const m = 0.3048;
      return L * m * (W * m);
    }
    return L * W;
  };

  const zoneAreaSqM = (z) =>
    toSqMeters(z?.dimensions?.length, z?.dimensions?.width, z?.dimensions?.unit);

  const totalFarmSizeSqM = useMemo(
    () => zones.reduce((sum, z) => sum + zoneAreaSqM(z), 0),
    [zones]
  );

  const totalCapacity = useMemo(
    () => zones.reduce((sum, z) => sum + (Number(z.capacity) || 0), 0),
    [zones]
  );

  const avgUtilizationPct = useMemo(() => {
    const cap = totalCapacity || 0;
    const occ = totalAnimals || 0;
    if (cap === 0) return 0;
    return Math.round((occ / cap) * 100);
  }, [totalCapacity, totalAnimals]);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6", "#F97316"];

  const zoneTypeData = useMemo(() => {
    const counts = {};
    zones.forEach((z) => {
      if (!z?.type) return;
      counts[z.type] = (counts[z.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [zones]);

  const animalsPerZoneData = useMemo(
    () =>
      zones.map((z) => ({
        name: z.name || z.zoneID || "Zone",
        animals: Number(z.currentOccupancy) || 0,
      })),
    [zones]
  );

  const layoutRects = useMemo(() => {
    if (!zones.length) return [];
    const lens = zones.map((z) => {
      const unit = z?.dimensions?.unit || "m";
      const Lm =
        unit === "km"
          ? (Number(z?.dimensions?.length) || 0) * 1000
          : unit === "ft"
          ? (Number(z?.dimensions?.length) || 0) * 0.3048
          : Number(z?.dimensions?.length) || 0;
      const Wm =
        unit === "km"
          ? (Number(z?.dimensions?.width) || 0) * 1000
          : unit === "ft"
          ? (Number(z?.dimensions?.width) || 0) * 0.3048
          : Number(z?.dimensions?.width) || 0;
      return { Lm, Wm };
    });

    const maxDim = Math.max(
      1,
      ...lens.map(({ Lm, Wm }) => Math.max(Lm || 0, Wm || 0))
    );
    const scale = 180 / maxDim;

    return zones.map((z, i) => {
      const unit = z?.dimensions?.unit || "m";
      let Lm =
        unit === "km"
          ? (Number(z?.dimensions?.length) || 0) * 1000
          : unit === "ft"
          ? (Number(z?.dimensions?.length) || 0) * 0.3048
          : Number(z?.dimensions?.length) || 0;
      let Wm =
        unit === "km"
          ? (Number(z?.dimensions?.width) || 0) * 1000
          : unit === "ft"
          ? (Number(z?.dimensions?.width) || 0) * 0.3048
          : Number(z?.dimensions?.width) || 0;

      const widthPx = Math.max(48, Math.round((Wm || 0) * scale));
      const heightPx = Math.max(48, Math.round((Lm || 0) * scale));

      const colorIndex = Math.max(0, zoneTypes.indexOf(z.type));
      const color = COLORS[colorIndex % COLORS.length];

      const cap = Number(z.capacity) || 0;
      const occ = Number(z.currentOccupancy) || 0;
      const util = cap ? Math.min(100, Math.round((occ / cap) * 100)) : 0;
      const ring =
        util >= 90 ? "ring-red-500" : util >= 60 ? "ring-amber-500" : "ring-emerald-500";

      return {
        key: z._id || i,
        widthPx,
        heightPx,
        color,
        ring,
        util,
        name: z.name || z.zoneID || "Zone",
        type: z.type || "Unknown",
        dims: `${z?.dimensions?.length || 0}×${z?.dimensions?.width || 0} ${unit}`,
        area: Math.round(zoneAreaSqM(z)),
        cap,
        occ,
      };
    });
  }, [zones]);

  const filteredZones = zones
    .filter((zone) => {
      const matchesType = selectedType === "all" || zone.type === selectedType;
      const matchesAnimalType =
        selectedAnimalType === "all" ||
        zone.assignedAnimalTypes.includes(selectedAnimalType);
      const matchesSearch =
        zone.name?.toLowerCase().includes(search.toLowerCase()) ||
        (zone.zoneID && zone.zoneID.toLowerCase().includes(search.toLowerCase()));
      const cap = Number(zone.capacity) || 0;
      const occ = Number(zone.currentOccupancy) || 0;
      const util = cap ? (occ / cap) * 100 : 0;
      const area = zoneAreaSqM(zone);
      const matchesUtil =
        (!minUtilization || util >= Number(minUtilization)) &&
        (!maxUtilization || util <= Number(maxUtilization));
      const matchesCapacity =
        (!minCapacity || cap >= Number(minCapacity)) &&
        (!maxCapacity || cap <= Number(maxCapacity));
      const matchesArea =
        (!minArea || area >= Number(minArea)) && (!maxArea || area <= Number(maxArea));

      return (
        matchesType &&
        matchesAnimalType &&
        matchesSearch &&
        matchesUtil &&
        matchesCapacity &&
        matchesArea
      );
    })
    .sort((a, b) => {
      let aValue = sortConfig.key === "name" ? a.name : a[sortConfig.key];
      let bValue = sortConfig.key === "name" ? b.name : b[sortConfig.key];

      if (sortConfig.key === "area") {
        aValue = zoneAreaSqM(a);
        bValue = zoneAreaSqM(b);
      } else if (sortConfig.key === "utilization") {
        const aCap = Number(a.capacity) || 0;
        const aOcc = Number(a.currentOccupancy) || 0;
        const bCap = Number(b.capacity) || 0;
        const bOcc = Number(b.currentOccupancy) || 0;
        aValue = aCap ? (aOcc / aCap) * 100 : 0;
        bValue = bCap ? (bOcc / bCap) * 100 : 0;
      }

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={16} className="inline ml-1" />
    ) : (
      <ChevronDown size={16} className="inline ml-1" />
    );
  };

  const generateInsights = (zonesData) => {
    const newInsights = [];

    if (zonesData.length > 0) {
      const highUtil = zonesData.filter((z) => {
        const cap = Number(z.capacity) || 0;
        const occ = Number(z.currentOccupancy) || 0;
        return cap > 0 && (occ / cap) * 100 > 90;
      });
      if (highUtil.length > 0) {
        newInsights.push({
          type: "warning",
          message: `${highUtil.length} zone(s) over 90% utilization: Consider expansion`,
        });
      }

      const lowUtil = zonesData.filter((z) => {
        const cap = Number(z.capacity) || 0;
        const occ = Number(z.currentOccupancy) || 0;
        return cap > 0 && (occ / cap) * 100 < 30;
      });
      if (lowUtil.length > 0) {
        newInsights.push({
          type: "info",
          message: `${lowUtil.length} zone(s) under 30% utilization: Optimize allocation`,
        });
      }

      if (avgUtilizationPct > 80) {
        newInsights.push({
          type: "success",
          message: `Overall utilization at ${avgUtilizationPct}%: Efficient operations`,
        });
      } else if (avgUtilizationPct < 50) {
        newInsights.push({
          type: "danger",
          message: `Overall utilization at ${avgUtilizationPct}%: Room for improvement`,
        });
      }
    }

    setInsights(newInsights);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.text("Animal Zones Report", 14, 16);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on ${date}`, 14, 23);

    autoTable(doc, {
      startY: 30,
      head: [["Name", "Type", "Capacity", "Occupancy", "Area (m²)"]],
      body: zones.map((z) => [
        z.name,
        z.type,
        z.capacity,
        z.currentOccupancy,
        Math.round(zoneAreaSqM(z)),
      ]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`zones-report-${date.replace(/\//g, "-")}.pdf`);
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "light-beige"} font-sans`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <MapPin className="text-blue-600 dark:text-blue-400" size={32} />
              Animal Zones Dashboard
            </h1>
            <p className={`mt-2 text-md ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Manage and visualize your farm zones efficiently
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg mb-6`}>
        <div className="relative mb-4">
          <Search
            size={20}
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          />
          <input
            type="text"
            placeholder="Search zones by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter size={20} />
            Advanced Filters
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`text-sm ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"} transition-colors`}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Zone Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="all">All Types</option>
                {zoneTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Animal Type</label>
              <select
                value={selectedAnimalType}
                onChange={(e) => setSelectedAnimalType(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="all">All Animal Types</option>
                {animalTypes.map((type) => (
                  <option key={type._id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Utilization Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min %"
                  value={minUtilization}
                  onChange={(e) => setMinUtilization(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                <span className="text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="number"
                  placeholder="Max %"
                  value={maxUtilization}
                  onChange={(e) => setMaxUtilization(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Capacity Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                <span className="text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Area Range (m²)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minArea}
                  onChange={(e) => setMinArea(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                <span className="text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxArea}
                  onChange={(e) => setMaxArea(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedType("all");
                  setSelectedAnimalType("all");
                  setMinUtilization("");
                  setMaxUtilization("");
                  setMinCapacity("");
                  setMaxCapacity("");
                  setMinArea("");
                  setMaxArea("");
                }}
                className={`w-full px-4 py-2.5 rounded-lg ${
                  darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                } transition-all`}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            {error}
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          icon={<LayoutGrid className="text-blue-600 dark:text-blue-400" size={28} />}
          title="Total Zones"
          value={zones.length.toLocaleString()}
          darkMode={darkMode}
        />
        <SummaryCard
          icon={<Users className="text-green-600 dark:text-green-400" size={28} />}
          title="Total Animals"
          value={totalAnimals.toLocaleString()}
          darkMode={darkMode}
        />
        <SummaryCard
          icon={<Ruler className="text-purple-600 dark:text-purple-400" size={28} />}
          title="Farm Size"
          value={`${Math.round(totalFarmSizeSqM).toLocaleString()} m²`}
          darkMode={darkMode}
        />
        <SummaryCard
          icon={<TrendingUp className="text-orange-600 dark:text-orange-400" size={28} />}
          title="Avg Utilization"
          value={`${avgUtilizationPct}%`}
          darkMode={darkMode}
        />
      </div>

      {/* Controls */}
<div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
  <div className="flex flex-wrap gap-3">
    <button
      onClick={fetchData}
      className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${
        darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
      } transition-all`}
    >
      <RefreshCw size={18} />
      Refresh
    </button>
    <button
      onClick={() => setShowDiagram(!showDiagram)}
      className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${
        showDiagram ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
      } transition-all`}
    >
      {showDiagram ? <EyeOff size={18} /> : <Eye size={18} />}
      {showDiagram ? "Hide Visuals" : "Show Visuals"}
    </button>
    <button
      onClick={exportPDF}
      className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${
        darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
      } transition-all`}
    >
      <Download size={18} />
      Export PDF
    </button>
  </div>
</div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg flex items-start ${
                insight.type === "success"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                  : insight.type === "warning" || insight.type === "info"
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                  : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
              }`}
            >
              {insight.type === "success" ? (
                <TrendingUp className="mr-2 mt-0.5 flex-shrink-0" size={18} />
              ) : insight.type === "warning" || insight.type === "info" ? (
                <AlertTriangle className="mr-2 mt-0.5 flex-shrink-0" size={18} />
              ) : (
                <TrendingDown className="mr-2 mt-0.5 flex-shrink-0" size={18} />
              )}
              <span>{insight.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Visual Dashboard */}
      <AnimatePresence initial={false}>
        {showDiagram && (
          <motion.div
            key="visuals"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={`rounded-2xl p-5 mb-6 shadow-lg ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 />
                <h3 className="text-lg font-semibold">Farm Visual Analytics</h3>
                <span className="text-xs opacity-70">(auto-updated)</span>
              </div>
              <button
                onClick={() => setShowDiagram(false)}
                className={`px-3 py-1 rounded-full flex items-center gap-2 ${
                  darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                } transition-all`}
              >
                <Eye size={16} />
                Hide Visuals
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div
                className={`rounded-xl p-4 border ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <LayoutGrid className="opacity-70" />
                  <h4 className="font-semibold">Interactive Zone Map</h4>
                </div>
                {zones.length === 0 ? (
                  <p className="text-sm opacity-70">No zones to visualize yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {layoutRects.map((r) => (
                      <div
                        key={r.key}
                        className={`relative rounded-xl ring-4 ${r.ring} shadow hover:scale-105 transition-transform`}
                        style={{
                          width: r.widthPx,
                          height: r.heightPx,
                          background: r.color,
                          color: "white",
                        }}
                        title={`${r.name} • ${r.type}\n${r.dims}\nArea: ${r.area} m²\nOcc: ${r.occ}/${r.cap} (${r.util}%)`}
                      >
                        <div className="absolute inset-0 p-2 flex flex-col">
                          <span className="text-xs font-bold leading-tight line-clamp-1">
                            {r.name}
                          </span>
                          <span className="text-[10px] opacity-90 leading-tight">
                            {r.type}
                          </span>
                          <span className="mt-auto text-[10px] opacity-90">
                            {r.occ}/{r.cap} • {r.util}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div
                  className={`rounded-xl p-4 border ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <PieIcon className="opacity-70" />
                    <h4 className="font-semibold">Zone Types Breakdown</h4>
                  </div>
                  {zoneTypeData.length === 0 ? (
                    <p className="text-sm opacity-70">No data available.</p>
                  ) : (
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={zoneTypeData}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={84}
                            label
                          >
                            {zoneTypeData.map((_, i) => (
                              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div
                  className={`rounded-xl p-4 border ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart2 className="opacity-70" />
                    <h4 className="font-semibold">Occupancy Distribution</h4>
                  </div>
                  {animalsPerZoneData.length === 0 ? (
                    <p className="text-sm opacity-70">No data available.</p>
                  ) : (
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={animalsPerZoneData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="animals" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Form */}
      <div className={`rounded-2xl p-6 mb-6 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus size={20} />
          {editingZone ? "Update Zone" : "Create New Zone"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Zone Name</label>
            <input
              type="text"
              placeholder="e.g. Chicken Coop"
              value={newZone.name}
              onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <div className="relative">
              <select
                value={newZone.type}
                onChange={(e) => setNewZone({ ...newZone, type: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border appearance-none ${
                  darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                {zoneTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <input
              type="number"
              placeholder="0"
              value={newZone.capacity}
              onChange={(e) => setNewZone({ ...newZone, capacity: parseInt(e.target.value || "") })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Animal Types</label>
            <input
              type="text"
              placeholder="e.g. chickens, cows"
              value={newZone.assignedAnimalTypes.join(", ")}
              onChange={(e) =>
                setNewZone({
                  ...newZone,
                  assignedAnimalTypes: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter((t) => t !== ""),
                })
              }
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Length</label>
            <input
              type="number"
              placeholder="0"
              value={newZone.dimensions.length}
              onChange={(e) =>
                setNewZone({
                  ...newZone,
                  dimensions: { ...newZone.dimensions, length: parseFloat(e.target.value || "") },
                })
              }
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Width</label>
            <input
              type="number"
              placeholder="0"
              value={newZone.dimensions.width}
              onChange={(e) =>
                setNewZone({
                  ...newZone,
                  dimensions: { ...newZone.dimensions, width: parseFloat(e.target.value || "") },
                })
              }
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <div className="relative">
              <select
                value={newZone.dimensions.unit}
                onChange={(e) =>
                  setNewZone({
                    ...newZone,
                    dimensions: { ...newZone.dimensions, unit: e.target.value },
                  })
                }
                className={`w-full px-3 py-2 rounded-lg border appearance-none ${
                  darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {editingZone && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingZone(null);
                resetForm();
              }}
              className={`px-4 py-2 rounded-lg ${
                darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Cancel
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={editingZone ? handleUpdateZone : handleAddZone}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              editingZone ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
            } text-white`}
          >
            <Plus size={16} />
            {editingZone ? "Update" : "Create"}
          </motion.button>
        </div>
      </div>

      {/* Zone Cards */}
      {filteredZones.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredZones.map((zone, index) => (
            <motion.div
              key={zone._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`rounded-2xl shadow-lg overflow-hidden ${
                darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-50"
              } transition-all duration-300 hover:shadow-xl hover:scale-105`}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {zone.name} {zone.zoneID ? `(${zone.zoneID})` : ""}
                    </h3>
                    <span
                      className={`text-sm px-2 py-1 rounded-full mt-1 ${
                        darkMode ? "bg-gray-700 text-blue-300" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {zone.type}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEditClick(zone)}
                      className={`p-1.5 rounded-md ${
                        darkMode ? "hover:bg-gray-600 text-yellow-400" : "hover:bg-gray-100 text-yellow-600"
                      }`}
                    >
                      <Edit2 size={16} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setConfirmDelete({ show: true, zone })}
                      className={`p-1.5 rounded-md ${
                        darkMode ? "hover:bg-gray-600 text-red-400" : "hover:bg-gray-100 text-red-600"
                      }`}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Row label="Capacity" value={zone.capacity} />
                  <Row label="Occupancy" value={zone.currentOccupancy} />
                  <Row
                    label="Animal Types"
                    value={zone.assignedAnimalTypes?.length ? zone.assignedAnimalTypes.join(", ") : "None"}
                  />
                  {zone.dimensions && (
                    <>
                      <Row
                        label="Dimensions"
                        value={`${zone.dimensions.length} × ${zone.dimensions.width} ${zone.dimensions.unit}`}
                      />
                      <Row label="Area" value={`${Math.round(zoneAreaSqM(zone))} m²`} />
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={`p-8 text-center rounded-xl ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
          <p className="text-gray-500 dark:text-gray-400">
            {zones.length > 0 ? "No zones found matching your search." : "No zones added yet."}
          </p>
        </div>
      )}

      {/* Global Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Popup */}
      <AnimatePresence>
        {popup.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={`rounded-2xl p-6 shadow-xl ${
                popup.type === "success" ? "border-t-4 border-green-500" : "border-t-4 border-red-500"
              } ${darkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-full p-2 ${
                    popup.type === "success"
                      ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {popup.type === "success" ? <Check size={24} /> : <X size={24} />}
                </div>
                <div>
                  <h5 className="font-bold text-gray-900 dark:text-white">
                    {popup.type === "success" ? "Success" : "Error"}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{popup.message}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {confirmDelete.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={`rounded-2xl p-6 shadow-xl border-t-4 border-yellow-500 ${
                darkMode ? "bg-gray-800" : "bg-white"
              } w-full max-w-md`}
            >
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600 dark:text-red-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Delete Zone</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete "{confirmDelete.zone?.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmDelete({ show: false, zone: null })}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
                  } flex-1`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteConfirmed}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white flex-1"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm opacity-75">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function SummaryCard({ icon, title, value, darkMode }) {
  return (
    <div
      className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-all flex items-center gap-4`}
    >
      <div className={`p-3 rounded-full ${darkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}