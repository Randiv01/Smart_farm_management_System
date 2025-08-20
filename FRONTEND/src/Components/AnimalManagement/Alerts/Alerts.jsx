import React, { useState, useEffect } from "react";
import { useLoader } from "../contexts/LoaderContext.js";
import axios from "axios";
import { useTheme } from "../contexts/ThemeContext.js";

export default function Alerts() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading } = useLoader();

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    document.title = "Animal Alerts";
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/alerts"); // Your API endpoint
      setAlerts(res.data);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-5 h-full ${darkMode ? "bg-gray-900" : "bg-[#f7e9cb]"}`}>
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Alerts</h2>
      {alerts.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">No alerts at the moment.</p>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <div key={alert._id} className={`p-4 rounded-lg shadow border-l-4 ${
              alert.level === "critical" ? "border-red-500 bg-red-50 dark:bg-red-900/30" :
              alert.level === "warning" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30" :
              "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
            }`}>
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 dark:text-white">{alert.title}</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(alert.date).toLocaleString()}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{alert.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
