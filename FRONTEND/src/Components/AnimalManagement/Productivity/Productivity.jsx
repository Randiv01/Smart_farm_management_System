import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.js";
import { useLoader } from "../contexts/LoaderContext.js";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AnimalProductivity() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading: setGlobalLoading } = useLoader();

  const [animalTypes, setAnimalTypes] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [productivityStats, setProductivityStats] = useState({}); // e.g., milk, eggs, weight

  useEffect(() => {
    document.title = "Animal Productivity Dashboard";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setGlobalLoading(true);
      const typesRes = await axios.get("http://localhost:5000/animal-types");
      const animalsRes = await axios.get("http://localhost:5000/animals");

      const types = typesRes.data;
      const allAnimals = animalsRes.data;
      setAnimals(allAnimals);

      const typesWithStats = types.map((type) => {
        const animalsOfType = allAnimals.filter(a => a.type._id === type._id);

        // Example productivity stats: milk, eggs, weight
        const productivity = {
          milk: animalsOfType.reduce((sum, a) => sum + (a.data?.milk || 0), 0),
          eggs: animalsOfType.reduce((sum, a) => sum + (a.data?.eggs || 0), 0),
          weight: animalsOfType.reduce((sum, a) => sum + (a.data?.weight || 0), 0),
        };

        return {
          ...type,
          totalCount: animalsOfType.length,
          productivity,
          bannerImage: type.bannerImage
        };
      });

      setAnimalTypes(typesWithStats);

      // Overall productivity aggregation
      const overall = { milk: 0, eggs: 0, weight: 0 };
      typesWithStats.forEach(t => {
        overall.milk += t.productivity.milk;
        overall.eggs += t.productivity.eggs;
        overall.weight += t.productivity.weight;
      });
      setProductivityStats(overall);
    } catch (err) {
      console.error("Failed to fetch productivity data:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  const productivityChartData = {
    labels: ["Milk (L)", "Eggs (pcs)", "Weight (kg)"],
    datasets: [
      {
        label: "Total Productivity",
        data: [productivityStats.milk, productivityStats.eggs, productivityStats.weight],
        backgroundColor: ["#3b82f6", "#f59e0b", "#10b981"],
        borderColor: darkMode ? "#374151" : "#e5e7eb",
        borderWidth: 1
      },
    ],
  };

  return (
    <div className={`h-full ${darkMode ? "bg-gray-900" : "bg-[#f7e9cb]"}`}>
      <div className="p-5">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Animal Productivity Dashboard</h2>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`p-4 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Animals</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{animals.length}</div>
          </div>
          <div className={`p-4 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Milk (L)</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{productivityStats.milk || 0}</div>
          </div>
          <div className={`p-4 rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Eggs (pcs)</div>
            <div className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">{productivityStats.eggs || 0}</div>
          </div>
        </div>

        {/* Productivity Chart */}
        <div className={`p-5 rounded-xl shadow-sm mb-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Overall Productivity</h3>
          <div className="h-64">
            <Bar
              data={productivityChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: { color: darkMode ? "#f3f4f6" : "#111827" }
                  }
                },
                scales: {
                  x: { ticks: { color: darkMode ? "#9ca3af" : "#6b7280" }, grid: { color: darkMode ? "#374151" : "#e5e7eb" } },
                  y: { ticks: { color: darkMode ? "#9ca3af" : "#6b7280" }, grid: { color: darkMode ? "#374151" : "#e5e7eb" } },
                }
              }}
            />
          </div>
        </div>

        {/* Animal Types */}
        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Animals by Type</h3>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {animalTypes.map(type => (
              <div
                key={type._id}
                onClick={() => navigate(`/AnimalProductivity/${type.name.toLowerCase()}`)}
                className={`cursor-pointer overflow-hidden rounded-lg shadow-md transition-all hover:shadow-lg ${
                  darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
                }`}
              >
                <img
                  src={type.bannerImage ? `http://localhost:5000${type.bannerImage}` : "/images/default.jpg"}
                  alt={type.name}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white truncate">{type.name}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                      {type.totalCount}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    Milk: {type.productivity.milk} L | Eggs: {type.productivity.eggs} pcs
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
