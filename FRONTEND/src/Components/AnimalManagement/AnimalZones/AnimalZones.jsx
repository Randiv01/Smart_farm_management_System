// src/Components/AnimalManagement/AnimalZones/AnimalZones.jsx
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
  Check,
  X,
  BarChart2,
  PieChart as PieIcon,
  LayoutGrid,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Charts ---
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

export default function AnimalZones() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { loading, setLoading } = useLoader();

  const [zones, setZones] = useState([]);
  const [search, setSearch] = useState("");
  const [showDiagram, setShowDiagram] = useState(true); // show visuals by default
  const [editingZone, setEditingZone] = useState(null);

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

  // Add this state
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
    setTotalAnimals(types.reduce((sum, t) => sum + t.total, 0)); // 👈 total animals
  } catch (err) {
    showPopup("error", "Failed to fetch animal types");
  }
};

  useEffect(() => {
    document.title = "Animal zones";
  }, []);

  const zoneTypes = ["Shelter", "Cage", "Pond", "Open Field", "Barn"];
  const units = ["m", "km", "ft"];

  const showPopup = (type, message) => {
    setPopup({ show: true, type, message });
    setTimeout(() => setPopup({ show: false, type, message }), 2000);
  };

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/zones");
      setZones(res.data.zones || []);
    } catch (err) {
      console.error("Failed to fetch zones:", err.response?.data || err.message);
      showPopup("error", "Failed to fetch zones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
    fetchAnimalTypes();
  }, []);

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

  const filteredZones = zones.filter(
    (zone) =>
      zone.name?.toLowerCase().includes(search.toLowerCase()) ||
      (zone.zoneID && zone.zoneID.toLowerCase().includes(search.toLowerCase()))
  );

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // ---------- Helpers: unit conversion + metrics ----------
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

  // ---------- Charts data ----------
  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6", "#F97316"];

  const zoneTypeData = useMemo(() => {
    const counts = {};
    zones.forEach((z) => {
      if (!z?.type) return;
      counts[z.type] = (counts[z.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [zones]);

  const animalDistributionData = useMemo(() => {
    // If assignedAnimalTypes lists species, count by species across all zones.
    const counts = {};
    zones.forEach((z) => {
      const list = Array.isArray(z.assignedAnimalTypes) ? z.assignedAnimalTypes : [];
      if (list.length === 0 && z.currentOccupancy) {
        // If no types specified, group under "Unknown"
        counts["Unknown"] = (counts["Unknown"] || 0) + Number(z.currentOccupancy || 0);
      } else {
        list.forEach((t) => {
          counts[t || "Unknown"] = (counts[t || "Unknown"] || 0) + Number(z.currentOccupancy || 0);
        });
      }
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

  // ---------- Visual farm layout (scaled boxes) ----------
  const layoutRects = useMemo(() => {
    if (!zones.length) return [];
    // Get max dimension (in meters) to scale into ~180px
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
    const scale = 180 / maxDim; // largest side ~180px

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

      // px, with clamped min size for visibility
      const widthPx = Math.max(48, Math.round((Wm || 0) * scale));
      const heightPx = Math.max(48, Math.round((Lm || 0) * scale));

      const colorIndex = Math.max(0, zoneTypes.indexOf(z.type));
      const color = COLORS[colorIndex % COLORS.length];

      // capacity utilization color ring
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

  return (
    <div className={`h-full ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
      <div className="max-w-7xl mx-auto p-4 md:p-6">

        {/* -------- TOP: Title + Search + Toggle Visuals -------- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-2xl font-bold mb-3 md:mb-0">Animal Zones Management</h2>
          <div className="flex gap-2 items-center w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-64">
              <div className={`flex items-center rounded-xl px-3 py-2 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <Search className="text-gray-500 mr-2" size={18} />
                <input
                  type="text"
                  placeholder="Search zones..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full bg-transparent outline-none ${
                    darkMode ? "placeholder-gray-400" : "placeholder-gray-500"
                  }`}
                />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowDiagram((s) => !s)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                darkMode ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-500"
              } text-white`}
              title="Toggle Visual Dashboard"
            >
              {showDiagram ? <EyeOff size={18} /> : <Eye size={18} />}
              {showDiagram ? "Hide Visuals" : "Show Visuals"}
            </motion.button>
          </div>
        </div>

        {/* -------- VERY TOP: Big Total Farm Size -------- */}
        <div
          className={`rounded-2xl px-5 py-4 mb-4 shadow ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutGrid className="opacity-70" />
            <p className="text-lg md:text-xl font-semibold">
              Total Farm Size:{" "}
              <span className="font-bold">
                {new Intl.NumberFormat().format(Math.round(totalFarmSizeSqM))} m²
              </span>
            </p>
          </div>
        </div>

        {/* -------- VISUAL DASHBOARD (read-only) -------- */}
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
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 />
                <h3 className="text-lg font-semibold">Farm Visual Representation</h3>
                <span className="text-xs opacity-70">(read-only, auto-updated)</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <SummaryCard
                  title="Zones"
                  value={zones.length}
                  darkMode={darkMode}
                />
                <SummaryCard
                   title="Animals"
                  value={new Intl.NumberFormat().format(totalAnimals)}
                  darkMode={darkMode}
                />
                <SummaryCard
                  title="Capacity"
                  value={new Intl.NumberFormat().format(totalCapacity)}
                  darkMode={darkMode}
                />
                <SummaryCard
                  title="Avg Utilization"
                  value={`${avgUtilizationPct}%`}
                  darkMode={darkMode}
                />
              </div>

              {/* Layout + Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scaled Layout */}
                <div
                  className={`rounded-xl p-4 border ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <LayoutGrid className="opacity-70" />
                    <h4 className="font-semibold">Scaled Zone Layout</h4>
                  </div>
                  {zones.length === 0 ? (
                    <p className="text-sm opacity-70">No zones to visualize yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      {layoutRects.map((r) => (
                        <div
                          key={r.key}
                          className={`relative rounded-xl ring-4 ${r.ring} shadow`}
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

                {/* Charts */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Zone Type Distribution */}
                  <div
                    className={`rounded-xl p-4 border ${
                      darkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <PieIcon className="opacity-70" />
                      <h4 className="font-semibold">Zone Type Distribution</h4>
                    </div>
                    {zoneTypeData.length === 0 ? (
                      <p className="text-sm opacity-70">No data.</p>
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

                  {/* Animals per Zone (Bar) */}
                  <div
                    className={`rounded-xl p-4 border ${
                      darkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart2 className="opacity-70" />
                      <h4 className="font-semibold">Animals per Zone</h4>
                    </div>
                    {animalsPerZoneData.length === 0 ? (
                      <p className="text-sm opacity-70">No data.</p>
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

        {/* -------- Add / Edit Form (unchanged behavior) -------- */}
        <div className={`rounded-2xl p-6 mb-6 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className="text-lg font-semibold mb-4">
            {editingZone ? "Edit Zone" : "Add New Zone"}
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
                }`}
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
                  }`}
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
                }`}
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
                }`}
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
                }`}
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
                }`}
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
                  }`}
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
              {editingZone ? "Update Zone" : "Add Zone"}
            </motion.button>
          </div>
        </div>

        {/* -------- Zone Cards -------- */}
        {filteredZones.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredZones.map((zone, index) => (
              <motion.div
                key={zone._id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`rounded-2xl shadow-lg overflow-hidden ${
                  darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-50"
                } transition-all duration-300 hover:shadow-xl`}
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
      </div>

      {/* -------- Global Loader Overlay -------- */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
        </div>
      )}

      {/* -------- Popup -------- */}
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

      {/* -------- Delete Confirm Modal -------- */}
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

/* ---------- Small UI helpers ---------- */
function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm opacity-75">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function SummaryCard({ title, value, darkMode }) {
  return (
    <div
      className={`rounded-xl p-4 shadow border ${
        darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"
      }`}
    >
      <div className="text-sm opacity-70">{title}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
