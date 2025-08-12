import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import "./AnimalList.css";

export default function AnimalList() {
  const { type } = useParams();
  const navigate = useNavigate();

  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);

  const [editData, setEditData] = useState({
    name: "",
    breed: "",
    age: "",
    dateOfBirth: "",
    gender: "Unknown",
    healthStatus: "",
    weight: "",
    owner: "",
    location: "",
    lastCheckup: "",
    reproductiveStatus: "",
    milkProduction: "",
    feedType: "",
    notes: "",
  });

  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  // Fetch animals
  const fetchAnimals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`http://localhost:5000/animals/${type}`);
      if (!res.ok) throw new Error("Failed to fetch animals");
      const data = await res.json();
      setAnimals(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, [type]);

  // Delete animal
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this animal?")) {
      try {
        const res = await fetch(`http://localhost:5000/animals/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete animal");
        fetchAnimals();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Edit animal
  const handleEdit = (animal) => {
    setEditId(animal._id);
    setEditData({
      name: animal.name || "",
      breed: animal.breed || "",
      age: animal.age || "",
      dateOfBirth: animal.dateOfBirth ? animal.dateOfBirth.slice(0, 10) : "",
      gender: animal.gender || "Unknown",
      healthStatus: animal.healthStatus || "",
      weight: animal.weight || "",
      owner: animal.owner || "",
      location: animal.location || "",
      lastCheckup: animal.lastCheckup ? animal.lastCheckup.slice(0, 10) : "",
      reproductiveStatus: animal.reproductiveStatus || "",
      milkProduction: animal.milkProduction || "",
      feedType: animal.feedType || "",
      notes: animal.notes || "",
    });
    setError(null);
  };

  // Update animal
  const handleUpdate = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/animals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editData,
          age: Number(editData.age),
          weight: Number(editData.weight),
          milkProduction: Number(editData.milkProduction),
          dateOfBirth: editData.dateOfBirth || null,
          lastCheckup: editData.lastCheckup || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to update animal");
      }

      const updatedAnimal = await res.json();

      setAnimals((prev) =>
        prev.map((a) => (a._id === id ? updatedAnimal : a))
      );

      setEditId(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={`animal-page ${darkMode ? "dark" : ""}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={type} />

      <TopNavbar darkMode={darkMode} setDarkMode={setDarkMode} onMenuClick={handleMenuClick} />

      <main className="main-content">
        <div className={`animal-list-container ${darkMode ? "dark" : ""}`}>
          <div className="header">
            <h2>{type.charAt(0).toUpperCase() + type.slice(1)} List</h2>
            <button
              className={`btn-add ${darkMode ? "dark" : ""}`}
              onClick={() => navigate(`/add-animal/${type}`)}
            >
              ➕ Add New {type}
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <table className={`animal-table ${darkMode ? "dark" : ""}`}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Breed</th>
                  <th>Age</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Health Status</th>
                  <th>Weight</th>
                  <th>Owner</th>
                  <th>Location</th>
                  <th>Last Checkup</th>
                  <th>Reproductive Status</th>
                  <th>Milk Production</th>
                  <th>Feed Type</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {animals.length === 0 ? (
                  <tr>
                    <td colSpan="15" className="no-data">
                      No {type} found.
                    </td>
                  </tr>
                ) : (
                  animals.map((animal) => (
                    <tr key={animal._id}>
                      <td>
                        {editId === animal._id ? (
                          <input
                            value={editData.name}
                            onChange={(e) =>
                              setEditData({ ...editData, name: e.target.value })
                            }
                            className={darkMode ? "dark" : ""}
                          />
                        ) : (
                          animal.name
                        )}
                      </td>
                      <td>
                        {editId === animal._id ? (
                          <input
                            value={editData.breed}
                            onChange={(e) =>
                              setEditData({ ...editData, breed: e.target.value })
                            }
                            className={darkMode ? "dark" : ""}
                          />
                        ) : (
                          animal.breed
                        )}
                      </td>
                      <td>
                        {editId === animal._id ? (
                          <input
                            type="number"
                            value={editData.age}
                            onChange={(e) =>
                              setEditData({ ...editData, age: e.target.value })
                            }
                            className={darkMode ? "dark" : ""}
                          />
                        ) : (
                          animal.age
                        )}
                      </td>
                      <td>
                        {editId === animal._id ? (
                          <input
                            type="date"
                            value={editData.dateOfBirth}
                            onChange={(e) =>
                              setEditData({ ...editData, dateOfBirth: e.target.value })
                            }
                            className={darkMode ? "dark" : ""}
                          />
                        ) : animal.dateOfBirth ? (
                          animal.dateOfBirth.slice(0, 10)
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {editId === animal._id ? (
                          <select
                            value={editData.gender}
                            onChange={(e) =>
                              setEditData({ ...editData, gender: e.target.value })
                            }
                            className={darkMode ? "dark" : ""}
                          >
                            <option value="Unknown">Unknown</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        ) : (
                          animal.gender || "Unknown"
                        )}
                      </td>
                      <td>
                        {editId === animal._id ? (
                          <input
                            value={editData.healthStatus}
                            onChange={(e) =>
                              setEditData({ ...editData, healthStatus: e.target.value })
                            }
                            className={darkMode ? "dark" : ""}
                          />
                        ) : (
                          <span
                            className={`status-badge ${
                              animal.healthStatus ? animal.healthStatus.toLowerCase() : ""
                            }`}
                          >
                            {animal.healthStatus || "-"}
                          </span>
                        )}
                      </td>
                      <td>
                        {editId === animal._id ? (
                          <input
                            type="number"
                            value={editData.weight}
                            onChange={(e) =>
                              setEditData({ ...editData, weight: e.target.value })
                            }
                            className={darkMode ? "dark" : ""}
                          />
                        ) : (
                          animal.weight || "-"
                        )}
                      </td>
                      <td>
                        {editId === animal._id ? (
                          <input
                            value={editData.owner}
                            onChange={(e) =>
                              setEditData({ ...editData, owner: e.target.value })
                            }
                            className={darkMode ? "dark" : ""}
                          />
                        ) : (
                          animal.owner || "-"
                        )}
                      </td>
                      <td>
                        {editId === animal._id ? (
                          <input
                            value={editData.location}
                            onChange={(e) =>
                              setEditData({ ...editData, location: e.target.value })
                            }
                            className={darkMode ? "dark" : ""}
                          />
                        ) : (
                          animal.location || "-"
                        )}
                      </td>
                      <td>
                        {editId === animal._id ? (
                          <input
                            type="date"
                            value={editData.lastCheckup}
                            onChange={(e) =>
                              setEditData({ ...editData, lastCheckup: e.target.value })
                            }
                            className={darkMode ? "dark" : ""}
                          />
                        ) : animal.lastCheckup ? (
                          animal.lastCheckup.slice(0, 10)
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {editId === animal._id ? (
                          <input
                            value={editData.reproductiveStatus}
                            onChange={(e) =>
                              setEditData({ ...editData, reproductiveStatus: e.target.value })
                            }
                            className={darkMode ? "dark" : ""}
                          />
                        ) : (
                          animal.reproductiveStatus || "-"
                        )}
                      </td>
                      <td>
                        {editId === animal._id ? (
                          <input
                            type="number"
                            value={editData.milkProduction}
                            onChange={(e) =>
                              setEditData({ ...editData, milkProduction: e.target.value })
                            }
                            className={darkMode ? "dark" : ""}
                          />
                        ) : (
                          animal.milkProduction || "-"
                        )}
                      </td>
                      <td>
                        {editId === animal._id ? (
                          <input
                            value={editData.feedType}
                            onChange={(e) =>
                              setEditData({ ...editData, feedType: e.target.value })
                            }
                            className={darkMode ? "dark" : ""}
                          />
                        ) : (
                          animal.feedType || "-"
                        )}
                      </td>
                      <td>
                        {editId === animal._id ? (
                          <textarea
                            value={editData.notes}
                            onChange={(e) =>
                              setEditData({ ...editData, notes: e.target.value })
                            }
                            rows={2}
                            className={darkMode ? "dark" : ""}
                            style={{ resize: "vertical" }}
                          />
                        ) : (
                          animal.notes || "-"
                        )}
                      </td>
                      <td>
                        {editId === animal._id ? (
                          <>
                            <button
                              className={`btn-save ${darkMode ? "dark" : ""}`}
                              onClick={() => handleUpdate(animal._id)}
                            >
                              💾 Save
                            </button>
                            <button
                              className={`btn-cancel ${darkMode ? "dark" : ""}`}
                              onClick={() => setEditId(null)}
                            >
                              ✖ Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className={`btn-edit ${darkMode ? "dark" : ""}`}
                              onClick={() => handleEdit(animal)}
                            >
                              ✏ Edit
                            </button>
                            <button
                              className={`btn-delete ${darkMode ? "dark" : ""}`}
                              onClick={() => handleDelete(animal._id)}
                            >
                              🗑 Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
