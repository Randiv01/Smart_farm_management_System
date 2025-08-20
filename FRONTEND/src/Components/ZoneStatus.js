import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";

export default function ZoneStatus() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };
    
    fetchZones();
    // Refresh every 30 seconds
    const interval = setInterval(fetchZones, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading zone status...</div>;

  return (
    <div className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
      <h3 className="text-lg font-semibold mb-4">Zone Occupancy Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map(zone => (
          <div 
            key={zone._id} 
            className={`p-3 rounded-lg border-l-4 ${
              zone.currentOccupancy >= zone.capacity 
                ? "bg-red-100 border-red-500 dark:bg-red-900/30" 
                : zone.currentOccupancy / zone.capacity > 0.8 
                ? "bg-yellow-100 border-yellow-500 dark:bg-yellow-900/30"
                : "bg-green-100 border-green-500 dark:bg-green-900/30"
            }`}
          >
            <h4 className="font-medium">{zone.name}</h4>
            <p className="text-sm">
              {zone.currentOccupancy} / {zone.capacity} animals
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  zone.currentOccupancy >= zone.capacity 
                    ? "bg-red-500" 
                    : zone.currentOccupancy / zone.capacity > 0.8 
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${(zone.currentOccupancy / zone.capacity) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}