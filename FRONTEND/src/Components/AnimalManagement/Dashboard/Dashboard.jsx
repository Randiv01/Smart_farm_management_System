// src/components/Dashboard.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pie, Bar } from "react-chartjs-2";
import axios from "axios";
import { useTheme } from "../contexts/ThemeContext";
import { useLoader } from "../contexts/LoaderContext";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useInView } from "react-intersection-observer";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    ArcElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCheck, FiUpload, FiSearch, FiAlertCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Loader from '../Loader/Loader.js';  // Import the Loader component // Import the Loader component

// Register necessary chart.js components and plugins
ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, Title, Tooltip, Legend, ChartDataLabels);

/**
 * Renders the main dashboard for the animal management application.
 * Displays animal type data, charts, and provides management functionality.
 */
export default function Dashboard() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const darkMode = theme === "dark";

    // Use the useLoader hook to control the global loading state
    const { setLoading } = useLoader();

    // State variables for animal types, data, and UI interactions
    const [animalTypes, setAnimalTypes] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editingCaretakerId, setEditingCaretakerId] = useState(null);
    const [nameInput, setNameInput] = useState("");
    const [caretakerInput, setCaretakerInput] = useState("");
    const [imageInput, setImageInput] = useState({});
    const [totalAnimals, setTotalAnimals] = useState(0);
    const [popup, setPopup] = useState({ show: false, type: "success", message: "" });
    const [confirmDelete, setConfirmDelete] = useState({ show: false, animal: null });
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // Intersection Observer hooks for chart animations
    const { ref: pieRef, inView: pieInView } = useInView({ triggerOnce: true, threshold: 0.3 });
    const { ref: barRef, inView: barInView } = useInView({ triggerOnce: true, threshold: 0.3 });

    // State for zone and farm utilization data
    const [zoneTypeCounts, setZoneTypeCounts] = useState({});
    const [totalZones, setTotalZones] = useState(0);
    const [farmUtilization, setFarmUtilization] = useState(0);

    // Set the document title on component mount
    useEffect(() => {
        document.title = "Animal Dashboard";
    }, []);

    // Fetch initial data for animal types and zones on component mount
    useEffect(() => {
        fetchAnimalTypes();
        fetchZoneData();
    }, []);

    /**
     * Shows a temporary popup message.
     * @param {string} type - The type of message ("success" or "error").
     * @param {string} message - The message to display.
     */
    const showPopup = (type, message) => {
        setPopup({ show: true, type, message });
        setTimeout(() => setPopup({ show: false, type, message }), 2000);
    };

    /**
     * Fetches animal types and their counts from the backend.
     * Manages the loading state using `setLoading`.
     */
    const fetchAnimalTypes = async () => {
        // Set loading state to true before starting the API call
        setLoading(true);
        setIsLoading(true);
        setFetchError(null);
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
            console.error("Failed to fetch animal types:", err);
            setFetchError("Failed to fetch animal types. Please try again later.");
            showPopup("error", "Failed to fetch animal types");
        } finally {
            // Set loading state to false after the API call completes (either success or error)
            setLoading(false);
            setIsLoading(false);
        }
    };

    /**
     * Fetches zone data and farm utilization statistics.
     * Manages the loading state using `setLoading`.
     */
    const fetchZoneData = async () => {
        // Set loading state to true before starting the API call
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:5000/zones");
            const { statistics } = res.data;
            setZoneTypeCounts(statistics.zoneTypesCount);
            setTotalZones(statistics.totalZones);
            setFarmUtilization(statistics.fillPercentage);
        } catch (err) {
            console.error("Failed to fetch zone data:", err.response?.data || err.message);
            showPopup("error", "Failed to fetch zone data");
        } finally {
            // Set loading state to false after the API call completes (either success or error)
            setLoading(false);
        }
    };

    /**
     * Handles the renaming of an animal type.
     */
    const handleRename = async (animal) => {
        if (!nameInput.trim()) return;
        try {
            const res = await axios.put(`http://localhost:5000/animal-types/${animal._id}`, { name: nameInput });
            setAnimalTypes(animalTypes.map(a => a._id === animal._id ? res.data : a));
            setEditingId(null);
            setNameInput("");
            showPopup("success", "Rename successful!");
        } catch {
            showPopup("error", "Rename failed!");
        }
    };

    /**
     * Handles the update of a caretaker name.
     */
    const handleUpdateCaretaker = async (animal) => {
        if (!caretakerInput.trim()) return;
        
        try {
            // Create updated caretakers array - update the first caretaker's name
            const updatedCaretakers = animal.caretakers && animal.caretakers.length > 0
                ? [{ ...animal.caretakers[0], name: caretakerInput }]
                : [{ id: Date.now().toString(), name: caretakerInput, mobile: "" }];

            const res = await axios.put(`http://localhost:5000/animal-types/${animal._id}`, { 
                caretakers: updatedCaretakers 
            });
            
            setAnimalTypes(animalTypes.map(a => a._id === animal._id ? res.data : a));
            setEditingCaretakerId(null);
            setCaretakerInput("");
            showPopup("success", "Caretaker updated!");
        } catch {
            showPopup("error", "Caretaker update failed!");
        }
    };

    /**
     * Handles the selection of a new image file.
     */
    const handleImageChange = (e, animal) => {
        if (e.target.files && e.target.files[0]) {
            setImageInput({ ...imageInput, [animal._id]: e.target.files[0] });
        }
    };

    /**
     * Uploads a new banner image for an animal type.
     */
    const handleImageSubmit = async (animal) => {
        if (!imageInput[animal._id]) return;
        const formData = new FormData();
        formData.append("bannerImage", imageInput[animal._id]);
        try {
            const res = await axios.put(`http://localhost:5000/animal-types/${animal._id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setAnimalTypes(animalTypes.map(a => a._id === animal._id ? res.data : a));
            setImageInput({ ...imageInput, [animal._id]: null });
            showPopup("success", "Image updated!");
        } catch {
            showPopup("error", "Image update failed!");
        }
    };

    /**
     * Handles the deletion of an animal type after confirmation.
     */
    const handleDeleteConfirmed = async () => {
        const animal = confirmDelete.animal;
        try {
            await axios.delete(`http://localhost:5000/animal-types/${animal._id}`);
            setAnimalTypes(animalTypes.filter(a => a._id !== animal._id));
            fetchAnimalTypes();
            showPopup("success", "Deleted successfully!");
        } catch {
            showPopup("error", "Delete failed!");
        } finally {
            setConfirmDelete({ show: false, animal: null });
        }
    };

    /**
     * Generates an array of colors for the charts.
     * @param {number} count - The number of colors to generate.
     * @returns {string[]} An array of RGBA color strings.
     */
    const generateColors = (count) => {
        const baseColors = [
            "rgba(74, 222, 128, 0.8)",
            "rgba(251, 191, 36, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(167, 139, 250, 0.8)",
            "rgba(244, 114, 182, 0.8)"
        ];
        return [...baseColors].slice(0, count);
    };

    /**
     * Filters the animal types based on the search term.
     */
    const filteredAnimalTypes = animalTypes.filter(animal =>
        animal.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Chart data and options
    const animalsData = {
        labels: filteredAnimalTypes.map(a => a.name),
        datasets: [{
            data: filteredAnimalTypes.map(a => a.total),
            backgroundColor: generateColors(filteredAnimalTypes.length),
            borderWidth: 2,
            borderColor: darkMode ? "#1f2937" : "#fff",
            hoverBorderWidth: 3,
            hoverBorderColor: darkMode ? "#f9fafb" : "#1f2937",
            hoverOffset: 10
        }]
    };

    const animalsOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    color: darkMode ? "#f9fafb" : "#1f2937",
                    boxWidth: 20,
                    padding: 15,
                    font: { family: "'Inter', sans-serif", size: 14 },
                    usePointStyle: true,
                    pointStyle: "circle"
                },
                onHover: (event, legendItem, legend) => {
                    document.getElementById("chart-container").style.cursor = "pointer";
                },
                onLeave: (event, legendItem, legend) => {
                    document.getElementById("chart-container").style.cursor = "default";
                }
            },
            tooltip: {
                backgroundColor: darkMode ? "#1f2937" : "#fff",
                titleColor: darkMode ? "#f9fafb" : "#1f2937",
                bodyColor: darkMode ? "#f9fafb" : "#1f2937",
                borderColor: darkMode ? "#374151" : "#e5e7eb",
                borderWidth: 1,
                padding: 12,
                callbacks: {
                    label: ctx => {
                        const value = ctx.raw;
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const percent = ((value / total) * 100).toFixed(1);
                        return `${ctx.label}: ${value} (${percent}%)`;
                    }
                }
            },
            datalabels: {
                color: darkMode ? "#f9fafb" : "#1f2937",
                formatter: (value, context) => {
                    const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percent = ((value / total) * 100).toFixed(0);
                    return `${percent}%`;
                },
                font: { weight: "600", size: 12, family: "'Inter', sans-serif" },
                anchor: "center",
                align: "center",
                offset: 0,
                clip: false
            }
        },
        animation: {
            animateScale: true,
            duration: 1200,
            easing: "easeOutCubic"
        },
        cutout: "65%",
        radius: "80%"
    };

    const zoneData = {
        labels: Object.keys(zoneTypeCounts),
        datasets: [{
            label: "Zones",
            data: barInView ? Object.values(zoneTypeCounts) : [0, 0, 0, 0, 0],
            backgroundColor: [
                "rgba(74, 222, 128, 0.8)",
                "rgba(251, 191, 36, 0.8)",
                "rgba(239, 68, 68, 0.8)",
                "rgba(59, 130, 246, 0.8)",
                "rgba(167, 139, 250, 0.8)"
            ],
            borderColor: darkMode ? "#1f2937" : "#fff",
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: [
                "rgba(74, 222, 128, 1)",
                "rgba(251, 191, 36, 1)",
                "rgba(239, 68, 68, 1)",
                "rgba(59, 130, 246, 1)",
                "rgba(167, 139, 250, 1)"
            ],
            hoverBorderWidth: 3,
            hoverBorderColor: darkMode ? "#f9fafb" : "#1f2937"
        }]
    };

    const healthOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: darkMode ? "#1f2937" : "#fff",
                titleColor: darkMode ? "#f9fafb" : "#1f2937",
                bodyColor: darkMode ? "#f9fafb" : "#1f2937",
                borderColor: darkMode ? "#374151" : "#e5e7eb",
                borderWidth: 1,
                padding: 12
            },
            datalabels: {
                display: false
            }
        },
        scales: {
            x: {
                grid: {
                    color: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
                },
                ticks: {
                    color: darkMode ? "#f9fafb" : "#1f2937"
                }
            },
            y: {
                grid: {
                    color: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
                },
                ticks: {
                    color: darkMode ? "#f9fafb" : "#1f2937"
                },
                beginAtZero: true
            }
        },
        animation: {
            duration: 1500,
            easing: "easeOutQuart"
        }
    };

    // Animated chart data
    const animatedAnimalsData = {
        ...animalsData,
        datasets: [{
            ...animalsData.datasets[0],
            data: pieInView ? animalsData.datasets[0].data : animalsData.datasets[0].data.map(() => 0)
        }]
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    // Show loader while data is being fetched
    if (isLoading) {
        return <Loader darkMode={darkMode} />;
    }

    return (
        <div className="pb-10" style={{ backgroundColor: darkMode ? "#1f2937" : "#f7e9cb" }}>
            {/* Show error message if fetch failed */}
            {fetchError && (
                <div className={`p-4 mb-6 rounded-xl ${darkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"} flex items-center gap-3`}>
                    <FiAlertCircle className="text-xl" />
                    <p>{fetchError}</p>
                    <button 
                        onClick={fetchAnimalTypes}
                        className="ml-auto px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Farm Overview */}
            <section className={`rounded-2xl p-4 sm:p-6 mb-6 ${darkMode ? "bg-dark-card" : "bg-white"} shadow-lg transition-all duration-300`}>
                <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-6 gap-4">
                    <div>
                        <h4 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-dark-text mb-1">Farm Overview</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your animal types and view statistics</p>
                    </div>

                    <div className="flex gap-3 items-center">
                        {animalTypes.length > 0 && (
                            <div className={`relative ${darkMode ? "bg-gray-700" : "bg-gray-100"} rounded-xl px-3 py-2 flex items-center`}>
                                <FiSearch className="text-gray-500 mr-2" />
                                <input
                                    type="text"
                                    placeholder="Search animal types..."
                                    className={`bg-transparent outline-none text-sm w-32 sm:w-40 ${darkMode ? "placeholder-gray-400 text-dark-text" : "placeholder-gray-500 text-gray-800"}`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-tr from-green-500 to-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
                            onClick={() => navigate("/AnimalManagement/add-animal-type")}
                        >
                            <FiPlus className="text-lg" />
                            <span>Add Animal Type</span>
                        </motion.button>
                    </div>
                </div>

                {/* Quick Stats */}
                {animalTypes.length > 0 && (
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 p-4 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"} transition-all duration-300`}>
                        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-600" : "bg-white"} shadow-sm transition-all duration-300`}>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Total Animals</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{totalAnimals}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-600" : "bg-white"} shadow-sm transition-all duration-300`}>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Animal Types</p>
                            <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{animalTypes.length}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-600" : "bg-white"} shadow-sm transition-all duration-300`}>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Total Zones</p>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalZones}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-600" : "bg-white"} shadow-sm transition-all duration-300`}>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Farm Space Used</p>
                            <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {farmUtilization}%
                            </p>
                        </div>
                    </div>
                )}

                {/* Animal Type Cards */}
                {animalTypes.length > 0 ? (
                    filteredAnimalTypes.length > 0 ? (
                        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {filteredAnimalTypes.map((animal, index) => (
                                <motion.div
                                    key={animal._id}
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className={`rounded-2xl shadow-lg overflow-hidden flex flex-col ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-50"} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                                >
                                    <div className="relative group">
                                        <div className="relative">
                                            <img
                                                src={animal.bannerImage ? `http://localhost:5000${animal.bannerImage}` : "/images/default.jpg"}
                                                alt={animal.name}
                                                className="w-full h-32 sm:h-40 object-cover transition-all duration-300 group-hover:brightness-90"
                                            />
                                            <label
                                                htmlFor={`file-${animal._id}`}
                                                className="absolute inset-0 flex items-end p-3 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                                            >
                                                <span className="text-white text-sm font-medium">Click to change image</span>
                                            </label>
                                        </div>
                                        <input
                                            type="file"
                                            id={`file-${animal._id}`}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleImageChange(e, animal)}
                                        />
                                        {imageInput[animal._id] && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-green-700 text-white px-3 py-1 rounded-lg hover:bg-green-800 transition-all duration-200 flex items-center gap-1 text-xs sm:text-sm shadow-md"
                                                onClick={() => handleImageSubmit(animal)}
                                            >
                                                <FiUpload size={14} />
                                                <span>Upload</span>
                                            </motion.button>
                                        )}
                                    </div>

                                    <div className="p-3 sm:p-4 flex-1">
                                        {editingId === animal._id ? (
                                            <div className="flex items-center gap-2 mb-2">
                                                <input
                                                    value={nameInput}
                                                    onChange={e => setNameInput(e.target.value)}
                                                    className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400 ${darkMode ? "bg-gray-600 border-gray-500 text-dark-text placeholder-gray-400" : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"} text-sm sm:text-base transition-all duration-200`}
                                                    placeholder="New name"
                                                    autoFocus
                                                    style={{ maxWidth: "calc(100% - 80px)" }}
                                                />
                                                <div className="flex gap-1">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-all"
                                                        onClick={() => handleRename(animal)}
                                                    >
                                                        <FiCheck size={18} />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-all"
                                                        onClick={() => setEditingId(null)}
                                                    >
                                                        <FiX size={18} />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center mb-2">
                                                <h5 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-dark-text">{animal.name}</h5>
                                                <motion.button
                                                    whileHover={{ scale: 1.2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="text-blue-500 hover:text-blue-700 transition-colors"
                                                    onClick={() => { setEditingId(animal._id); setNameInput(animal.name); }}
                                                >
                                                    <FiEdit2 size={16} />
                                                </motion.button>
                                            </div>
                                        )}
                                        {/* Caretaker Name section - Fixed to work with caretakers array */}
                                        <div className="mt-2 mb-2">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Caretaker:</p>
                                                    {editingCaretakerId === animal._id ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                value={caretakerInput}
                                                                onChange={e => setCaretakerInput(e.target.value)}
                                                                className={`w-32 px-2 py-1 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-dark-text" : "bg-gray-50 border-gray-300 text-gray-800"} text-sm transition-all duration-200`}
                                                                placeholder="Caretaker name"
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-1">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    className="bg-blue-600 text-white p-1 rounded-md hover:bg-blue-700 transition-all"
                                                                    onClick={() => handleUpdateCaretaker(animal)}
                                                                >
                                                                    <FiCheck size={16} />
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    className="bg-red-600 text-white p-1 rounded-md hover:bg-red-700 transition-all"
                                                                    onClick={() => setEditingCaretakerId(null)}
                                                                >
                                                                    <FiX size={16} />
                                                                </motion.button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                                            {animal.caretakers && animal.caretakers.length > 0 
                                                                ? animal.caretakers.map(c => c.name).join(', ')
                                                                : "Not assigned"
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {editingCaretakerId !== animal._id && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.2 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        className="text-blue-500 hover:text-blue-700 transition-colors"
                                                        onClick={() => { 
                                                            setEditingCaretakerId(animal._id); 
                                                            // Set input to the first caretaker's name or empty string
                                                            setCaretakerInput(
                                                                animal.caretakers && animal.caretakers.length > 0 
                                                                    ? animal.caretakers[0].name 
                                                                    : ""
                                                            ); 
                                                        }}
                                                    >
                                                        <FiEdit2 size={14} />
                                                    </motion.button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                                            <span>TypeID: {animal.typeId}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center">
                                                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${animal.total > 0 ? "bg-green-500" : "bg-gray-400"}`}></span>
                                                <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                                    Total: {animal.total}
                                                </span>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${animal.total > 10 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"}`}>
                                                {animal.total > 10 ? "High Stock" : "Low Stock"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-2 sm:p-3 flex justify-between items-center bg-gray-100 dark:bg-gray-600 rounded-b-2xl">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="text-white bg-blue-600 px-3 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-1 text-xs sm:text-sm"
                                            onClick={() => navigate(`/AnimalManagement/${animal.name.toLowerCase()}`)}
                                        >
                                            <span>View Details</span>
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="text-white bg-red-600 px-3 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-1 text-xs sm:text-sm"
                                            onClick={() => setConfirmDelete({ show: true, animal })}
                                        >
                                            <FiTrash2 size={14} />
                                            <span>Delete</span>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className={`p-8 text-center rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                            <p className="text-gray-500 dark:text-gray-400">No animal types found matching your search.</p>
                        </div>
                    )
                ) : (
                    // Show empty state when there are no animal types
                    <div className={`p-8 text-center rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                        <FiAlertCircle className="mx-auto text-4xl text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Animal Types Found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            There are no animal types in the database. Add your first animal type to get started.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-tr from-green-500 to-green-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all duration-200 mx-auto"
                            onClick={() => navigate("/AnimalManagement/add-animal-type")}
                        >
                            <FiPlus className="text-lg" />
                            <span>Add Your First Animal Type</span>
                        </motion.button>
                    </div>
                )}
            </section>

            {/* Charts Section - Only show if there are animal types */}
            {animalTypes.length > 0 && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Pie Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`p-4 sm:p-6 rounded-2xl shadow-lg ${darkMode ? "bg-dark-card" : "bg-white"} transition-colors duration-300`}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-dark-text text-lg">Animal Distribution</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Percentage of each animal type</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${darkMode ? "bg-gray-600 text-gray-200" : "bg-gray-100 text-gray-800"}`}>
                                    {filteredAnimalTypes.length} Types
                                </span>
                            </div>
                        </div>
                        <div ref={pieRef} id="chart-container" className="flex justify-center items-center h-64 sm:h-80 md:h-96 w-full">
                            <Pie
                                data={animatedAnimalsData}
                                options={animalsOptions}
                            />
                        </div>
                        <div className={`mt-4 p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"} text-sm`}>
                            <p className="text-gray-500 dark:text-gray-400 mb-1">Total animals: <span className="font-medium text-gray-900 dark:text-dark-text">{totalAnimals}</span></p>
                            <p className="text-gray-500 dark:text-gray-400">Most common: <span className="font-medium text-gray-900 dark:text-dark-text">
                                {animalTypes.length > 0 ? animalTypes.reduce((prev, current) => (prev.total > current.total) ? prev : current).name : "N/A"}
                            </span></p>
                        </div>
                    </motion.div>

                    {/* Bar Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={`p-4 sm:p-6 rounded-2xl shadow-lg ${darkMode ? "bg-dark-card" : "bg-white"} transition-colors duration-300`}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-dark-text text-lg">Zone Types</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Distribution of zone types</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${darkMode ? "bg-gray-600 text-gray-200" : "bg-gray-100 text-gray-800"}`}>
                                    {Object.keys(zoneTypeCounts).length} Types
                                </span>
                            </div>
                        </div>
                        <div ref={barRef} className="h-64 sm:h-80 md:h-96 w-full">
                            <Bar
                                data={zoneData}
                                options={healthOptions}
                            />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
                            {Object.entries(zoneTypeCounts).map(([type, count]) => (
                                <div key={type} className={`p-2 rounded-lg flex items-center ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                                    <span className="w-3 h-3 rounded-full mr-2" style={{
                                        backgroundColor: zoneData.datasets[0].backgroundColor[
                                            Object.keys(zoneTypeCounts).indexOf(type)
                                        ]
                                    }}></span>
                                    <span className={`text-xs ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                        {type}: {count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </section>
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
                            className={`rounded-2xl p-4 sm:p-6 shadow-xl ${popup.type === "success" ? "border-t-4 border-green-500" : "border-t-4 border-red-500"} ${darkMode ? "bg-dark-card" : "bg-white"} max-w-xs sm:max-w-md`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`rounded-full p-2 ${popup.type === "success" ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200"}`}>
                                    {popup.type === "success" ? (
                                        <FiCheck size={24} />
                                    ) : (
                                        <FiX size={24} />
                                    )}
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-900 dark:text-dark-text mb-1">
                                        {popup.type === "success" ? "Success" : "Error"}
                                    </h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{popup.message}</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
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
                            className={`rounded-2xl p-6 shadow-xl border-t-4 border-yellow-500 ${darkMode ? "bg-dark-card" : "bg-white"} w-full max-w-md mx-4`}
                        >
                            <div className="text-center mb-6">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                                    <FiTrash2 className="h-6 w-6 text-red-600 dark:text-red-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-2">
                                    Delete Animal Type
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Are you sure you want to delete "{confirmDelete.animal?.name}"? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex justify-center gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setConfirmDelete({ show: false, animal: null })}
                                    className={`px-4 py-2 rounded-lg border ${darkMode ? "bg-gray-600 border-gray-500 text-dark-text hover:bg-gray-500" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"} transition-colors duration-200 flex-1`}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleDeleteConfirmed}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 flex-1"
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