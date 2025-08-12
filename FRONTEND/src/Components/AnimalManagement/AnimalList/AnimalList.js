import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Home, Plus, FileText, Calendar, 
  HeartPulse, Activity, BarChart2, 
  Bell, Settings, UserCheck 
} from "lucide-react";
// Removed: import UserCheckIcon from '../assets/UserCheckIcon'; 
import TopNavbar from '../TopNavbar/TopNavbar.js';
import './AnimalList.css';

export default function AnimalList() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch animals by type
  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/animals/${type}`);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      setAnimals(data || []);
    } catch (err) {
      setError(err.message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    fetchAnimals();
  }, [type]);

  if (loading) return <div className={`loading ${darkMode ? 'dark' : ''}`}>Loading...</div>;
  if (error) return <div className={`error ${darkMode ? 'dark' : ''}`}>Error: {error}</div>;

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      <TopNavbar 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        onMenuClick={handleMenuClick} 
      />
      
      <div className="main-content">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'} ${darkMode ? 'dark' : ''}`}>
          <nav>
            <ul>
              <li onClick={() => navigate("/AnimalManagement")}>
                <Home size={20} className="mr-2" />
                <span>Overview</span>
              </li>
              <li onClick={() => navigate(`/add-animal/${type}`)}>
                <Plus size={20} className="icon" />
                <span>Register Animals</span>
              </li>
              <li onClick={() => navigate(`/animal-list/${type}`)}>
                <FileText size={20} className="icon" />
                <span>Animal List</span>
              </li>
              <li>
                <Calendar size={20} className="icon" />
                <span>Feeding Schedule</span>
              </li>
              <li>
                <HeartPulse size={20} className="icon" />
                <span>Health</span>
              </li>
              <li>
                <Activity size={20} className="icon" />
                <span>Productivity</span>
              </li>
              <li>
                <BarChart2 size={20} className="icon" />
                <span>Reports</span>
              </li>
              <li>
                <Bell size={20} className="icon" />
                <span>Alerts</span>
              </li>
              <li>
                <UserCheck size={20} className="icon" />
                <span>Caretaker</span>
              </li>
              <li>
                <Settings size={20} className="icon" />
                <span>Settings</span>
              </li>
            </ul>
          </nav>
        </aside>

        <div className={`content-area ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="animal-list-container">
            <div className="header">
              <h2>{type.charAt(0).toUpperCase() + type.slice(1)} List</h2>
              <button 
                className="add-button"
                onClick={() => navigate(`/add-animal/${type}`)}
              >
                Add New {type}
              </button>
            </div>

            <table className="animal-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Breed</th>
                  <th>Age</th>
                  <th>Health Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {animals.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">
                      No {type} found. Please add one.
                    </td>
                  </tr>
                ) : (
                  animals.map(animal => (
                    <tr key={animal._id}>
                      <td>{animal.name}</td>
                      <td>{animal.breed}</td>
                      <td>{animal.age}</td>
                      <td>
                        <span className={`status-badge ${animal.healthStatus?.toLowerCase() || 'healthy'}`}>
                          {animal.healthStatus || 'Healthy'}
                        </span>
                      </td>
                      <td className="actions">
                        <button 
                          className="edit-btn"
                          onClick={() => navigate(`/edit-animal/${animal._id}`)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(animal._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  async function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this animal?")) {
      try {
        const response = await fetch(`http://localhost:5000/animals/${id}`, {
          method: "DELETE"
        });
        
        if (response.ok) {
          fetchAnimals(); // Refresh the list
        } else {
          throw new Error("Failed to delete animal");
        }
      } catch (err) {
        setError(err.message);
      }
    }
  }
}
