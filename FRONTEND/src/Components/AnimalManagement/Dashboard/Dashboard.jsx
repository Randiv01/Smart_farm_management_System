import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar";
import Sidebar from "../Sidebar/Sidebar";
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

ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading } = useLoader();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [animalTypes, setAnimalTypes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [imageInput, setImageInput] = useState({});
  const [totalAnimals, setTotalAnimals] = useState(0);
  const [popup, setPopup] = useState({ show: false, type: "success", message: "" });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, animal: null });

  useEffect(() => { fetchAnimalTypes(); }, []);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  const showPopup = (type, message) => {
    setPopup({ show: true, type, message });
    setTimeout(() => setPopup({ show: false, type, message }), 2000);
  };

  const fetchAnimalTypes = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/animal-types");
      const types = await Promise.all(
        res.data.map(async (type) => {
          const countRes = await axios.get(`http://localhost:5000/animals/count?type=${type._id}`);
          return { ...type, total: countRes.data.count || 0 };
        })
      );
      setAnimalTypes(types);
      setTotalAnimals(types.reduce((sum, t) => sum + t.total, 0));
    } catch (err) { showPopup("error", "Failed to fetch animal types"); }
    finally { setLoading(false); }
  };

  const handleRename = async (animal) => {
    if (!nameInput.trim()) return;
    try {
      const res = await axios.put(`http://localhost:5000/animal-types/${animal._id}`, { name: nameInput });
      setAnimalTypes(animalTypes.map(a => a._id === animal._id ? res.data : a));
      setEditingId(null); setNameInput("");
      showPopup("success", "Rename successful!");
    } catch { showPopup("error", "Rename failed!"); }
  };

  const handleImageChange = (e, animal) => { setImageInput({ ...imageInput, [animal._id]: e.target.files[0] }); };
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
    } catch { showPopup("error", "Image update failed!"); }
  };

  const handleDeleteConfirmed = async () => {
    const animal = confirmDelete.animal;
    try {
      await axios.delete(`http://localhost:5000/animal-types/${animal._id}`);
      setAnimalTypes(animalTypes.filter(a => a._id !== animal._id));
      fetchAnimalTypes();
      showPopup("success", "Deleted successfully!");
    } catch { showPopup("error", "Delete failed!"); }
    finally { setConfirmDelete({ show: false, animal: null }); }
  };

  const generateColors = (count) => ["#4ade80", "#fbbf24", "#f87171", "#3b82f6", "#a78bfa", "#f472b6"];

  const animalsData = {
    labels: animalTypes.map(a => a.name),
    datasets: [{ data: animalTypes.map(a => a.total), backgroundColor: generateColors(animalTypes.length), borderWidth: 2 }]
  };

  const animalsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: darkMode ? "#f9fafb" : "#1f2937", boxWidth: 20, padding: 15, font: { family: "'Inter', sans-serif", size: 14 } } },
      tooltip: { callbacks: { label: ctx => {
        const value = ctx.raw;
        const total = ctx.dataset.data.reduce((a,b)=>a+b,0);
        const percent = ((value/total)*100).toFixed(1);
        return `${ctx.label}: ${value} (${percent}%)`;
      }}},
      datalabels: { color: "#fff", formatter: (value, context) => {
        const total = context.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
        const percent = ((value/total)*100).toFixed(0);
        return `${percent}%\n(${value})`;
      }, font: { weight: "600", size: 12, family: "'Inter', sans-serif" } }
    },
    animation: { animateScale: true, duration: 1200, easing: "easeOutCubic" }
  };

  const healthData = {
    labels: ["Healthy", "Monitoring", "Treatment", "Recovery"],
    datasets: [{ label: "Animals", data: [150,20,5,10], backgroundColor: ["#2e7d32","#fbbf24","#ef4444","#2563eb"], borderWidth: 1 }]
  };

  // Intersection Observer for scroll animation
  const { ref: pieRef, inView: pieInView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const animatedAnimalsData = { ...animalsData, datasets: [{ ...animalsData.datasets[0], data: pieInView ? animalsData.datasets[0].data : animalsData.datasets[0].data.map(()=>0) }] };

  return (
    <div className={`flex min-h-screen ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-800"}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} />
      <div className="flex-1 transition-all duration-300" style={{ marginLeft: sidebarOpen ? "260px" : "0" }}>
        <TopNavbar onMenuClick={handleMenuClick} />
        <main className="pt-20 px-4 md:px-8">
          {/* Farm Overview */}
          <section className={`rounded-2xl p-6 mb-6 ${darkMode ? "bg-dark-card" : "bg-white"} shadow-lg`}>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <h4 className="text-2xl font-bold">Current Animals in the Farm</h4>
              <button
                className="bg-gradient-to-tr from-green-400 to-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:shadow-lg transition"
                onClick={() => navigate("/AnimalManagement/add-animal-type")}
              >
                <span className="text-lg font-bold">+</span> Add Animal Type
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {animalTypes.map(animal => (
                <div key={animal._id} className={`rounded-2xl shadow-lg overflow-hidden flex flex-col ${darkMode ? "bg-dark-card" : "bg-white"}`}>
                  <div className="relative">
                    <img
                      src={animal.bannerImage ? `http://localhost:5000${animal.bannerImage}` : "/images/default.jpg"}
                      alt={animal.name}
                      className="w-full h-40 object-cover cursor-pointer hover:brightness-90"
                      onClick={() => document.getElementById(`file-${animal._id}`).click()}
                    />
                    <input type="file" id={`file-${animal._id}`} className="hidden" accept="image/*" onChange={(e)=>handleImageChange(e, animal)} />
                    {imageInput[animal._id] && (
                      <button className="absolute bottom-3 right-3 bg-green-700 text-white px-2 py-1 rounded hover:bg-green-800 transition" onClick={()=>handleImageSubmit(animal)}>Upload</button>
                    )}
                  </div>

                  <div className="p-4 flex-1">
                    {editingId===animal._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={nameInput}
                          onChange={e=>setNameInput(e.target.value)}
                          className={`px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-green-400 w-28 ${darkMode?"bg-dark-card border-gray-600 text-dark-text":"bg-white border-gray-300 text-gray-800"}`}
                        />
                        <button className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition" onClick={()=>handleRename(animal)}>✓</button>
                        <button className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition" onClick={()=>setEditingId(null)}>×</button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="font-semibold">{animal.name}</h5>
                        <button className="text-blue-500 hover:text-blue-700" onClick={()=>{setEditingId(animal._id); setNameInput(animal.name);}}>✎</button>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">TypeID: {animal.typeId}</p>
                    <p className="text-sm mt-1">Total: {animal.total}</p>
                  </div>

                  <div className="p-3 flex justify-between items-center bg-gray-100 dark:bg-gray-700 rounded-b-2xl">
                    <Link to={`/AnimalManagement/${animal.name.toLowerCase()}`} className="text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition">View</Link>
                    <button className="text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition" onClick={()=>setConfirmDelete({show:true,animal})}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            <div className={`flex justify-between mt-6 p-4 rounded-xl ${darkMode?"bg-dark-card":"bg-gray-100"}`}>
              <div className="text-center flex-1">
                <strong className="block mb-1 text-gray-500 dark:text-gray-400">Total Animals</strong>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">{totalAnimals}</span>
              </div>
              <div className="text-center flex-1">
                <strong className="block mb-1 text-gray-500 dark:text-gray-400">Animal Types</strong>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">{animalTypes.length}</span>
              </div>
            </div>
          </section>

          {/* Charts */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-2xl shadow-lg ${darkMode?"bg-dark-card":"bg-white"}`}>
              <h4 className="font-semibold mb-4">Animal Distribution</h4>
              <div ref={pieRef} className="flex justify-center items-center h-96 w-full">
                <Pie data={animatedAnimalsData} options={animalsOptions} plugins={[ChartDataLabels]} />
              </div>
            </div>
            <div className={`p-6 rounded-2xl shadow-lg ${darkMode?"bg-dark-card":"bg-white"}`}>
              <h4 className="font-semibold mb-4">Health Status</h4>
              <div className="h-64">
                <Bar data={healthData} options={{ responsive:true, plugins:{ legend:{ display:false }}}} />
              </div>
            </div>
          </section>
        </main>

        {/* Popup */}
        {popup.show && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className={`rounded-2xl p-6 shadow-lg ${popup.type==="success"?"border-t-4 border-green-500":"border-t-4 border-red-500"} bg-white dark:bg-dark-card animate-popIn`}>
              <p className="text-gray-900 dark:text-dark-text font-medium">{popup.message}</p>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {confirmDelete.show && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-xl animate-popIn text-center border-t-4 border-yellow-500">
              <p className="mb-4 text-gray-900 dark:text-dark-text">Are you sure you want to delete this animal type?</p>
              <div className="flex justify-center gap-4">
                <button onClick={handleDeleteConfirmed} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">Delete</button>
                <button onClick={()=>setConfirmDelete({show:false,animal:null})} className="bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-dark-text px-4 py-2 rounded hover:bg-gray-400 transition">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
