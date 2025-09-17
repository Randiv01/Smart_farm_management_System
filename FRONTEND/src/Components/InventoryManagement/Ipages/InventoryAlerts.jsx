import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import axios from "axios";

const InventoryAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/inventory/alerts");
      setAlerts(response.data);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || alerts.length === 0) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            <strong>Inventory Alert</strong>
            <ul className="list-disc list-inside mt-1">
              {alerts.map(alert => (
                <li key={alert._id}>
                  {alert.name} is {alert.status === 'Low Stock' ? 'low in stock' : 'out of stock'} 
                  ({alert.stock.quantity} {alert.stock.unit} remaining)
                </li>
              ))}
            </ul>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryAlerts;