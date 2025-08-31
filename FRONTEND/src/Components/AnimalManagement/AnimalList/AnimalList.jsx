import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.js";
import { QRCodeCanvas } from "qrcode.react";

export default function AnimalList() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const [animals, setAnimals] = useState([]);
  const [animalType, setAnimalType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [popup, setPopup] = useState({
    show: false,
    success: true,
    message: "",
    type: "",
  });
  const [zones, setZones] = useState([]);
  const [moveZoneId, setMoveZoneId] = useState("");
  const [animalToMove, setAnimalToMove] = useState(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState({});

  useEffect(() => {
    document.title = "Animal List";
  }, []);

  // Fetch zones
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
      }
    };
    fetchZones();
  }, []);

  // Helper function to safely get zone information
  const getZoneInfo = (animal) => {
    if (!animal) return { name: "Not assigned", id: null };
    
    // Check different possible ways the zone data might be structured
    if (animal.assignedZone && typeof animal.assignedZone === 'object') {
      return {
        name: animal.assignedZone.name || "Unknown",
        id: animal.assignedZone._id
      };
    }
    
    if (animal.assignedZone && typeof animal.assignedZone === 'string') {
      // If it's just an ID string, try to find the zone in the zones state
      const foundZone = zones.find(z => z._id === animal.assignedZone);
      return foundZone 
        ? { name: foundZone.name, id: foundZone._id }
        : { name: "Unknown", id: animal.assignedZone };
    }
    
    if (animal.zoneId) {
      const foundZone = zones.find(z => z._id === animal.zoneId);
      return foundZone 
        ? { name: foundZone.name, id: foundZone._id }
        : { name: "Unknown", id: animal.zoneId };
    }
    
    return { name: "Not assigned", id: null };
  };

  // Fetch data with zone information
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const typeRes = await fetch(`http://localhost:5000/animal-types/${type}`);
      if (!typeRes.ok) throw new Error(`Animal type not found`);
      const typeData = await typeRes.json();
      setAnimalType(typeData);

      // Initialize editData for appropriate category
      const mainCategory = typeData.categories.find(
        cat => cat.name === "Basic Info" || cat.name === "Batch Info" || cat.name === "Hive/Farm Info"
      );
      const initialEditData = {};
      if (mainCategory)
        mainCategory.fields.forEach(
          (field) => (initialEditData[field.name] = "")
        );
      setEditData(initialEditData);

      // Fetch animals with populated zone data
      const animalsRes = await fetch(
        `http://localhost:5000/animals?type=${typeData._id}`
      );
      if (!animalsRes.ok) throw new Error("Failed to fetch animals");
      const animalsData = await animalsRes.json();
      
      // For batch/group management, group animals by batchId
      if (typeData.managementType === "batch") {
        const batchGroups = {};
        animalsData.forEach(animal => {
          if (animal.batchId) {
            if (!batchGroups[animal.batchId]) {
              batchGroups[animal.batchId] = {
                ...animal,
                count: 1,
                animals: [animal]
              };
            } else {
              batchGroups[animal.batchId].count += 1;
              batchGroups[animal.batchId].animals.push(animal);
            }
          } else {
            // Handle individual animals in batch types (shouldn't normally happen)
            if (!batchGroups[animal._id]) {
              batchGroups[animal._id] = {
                ...animal,
                count: 1,
                animals: [animal]
              };
            }
          }
        });
        
        // Convert to array
        setAnimals(Object.values(batchGroups));
      } else if (typeData.managementType === "other") {
        // For "other" management type (hives/farms), group by a unique identifier
        // Use batchId if available, otherwise use the first field from Hive/Farm Info
        const hiveFarmGroups = {};
        const mainField = typeData.categories.find(cat => cat.name === "Hive/Farm Info")?.fields[0]?.name || "name";
        
        animalsData.forEach(animal => {
          const groupKey = animal.batchId || animal.data[mainField] || animal._id;
          
          if (!hiveFarmGroups[groupKey]) {
            hiveFarmGroups[groupKey] = {
              ...animal,
              groupId: groupKey,
              animals: [animal]
            };
          } else {
            hiveFarmGroups[groupKey].animals.push(animal);
          }
        });
        
        // Convert to array
        setAnimals(Object.values(hiveFarmGroups));
      } else {
        // For individual management, show all animals
        setAnimals(animalsData);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  const showPopup = (message, success = true, type = "save") => {
    setPopup({ show: true, message, success, type });
    if (type === "save")
      setTimeout(() => setPopup({ ...popup, show: false }), 2500);
  };

  const handleDelete = (id, isGroup = false, groupType = "individual") => {
    setPopup({
      show: true,
      message: isGroup 
        ? `Are you sure you want to delete this entire ${groupType === "batch" ? "batch" : groupType === "other" ? "hive/farm" : "group"}? This will delete all items in this ${groupType === "batch" ? "batch" : groupType === "other" ? "hive/farm" : "group"}.` 
        : "Are you sure you want to delete this animal?",
      success: false,
      type: "delete",
      confirmAction: async () => {
        try {
          if (isGroup) {
            if (groupType === "batch") {
              const res = await fetch(`http://localhost:5000/animals/batch/${id}`, {
                method: "DELETE",
              });
              if (!res.ok) throw new Error("Failed to delete batch");
            } else {
              // For "other" type, we need to delete all animals in the group
              // First find all animals with this groupId
              const groupAnimals = animals.find(a => 
                (a.batchId === id) || (a.groupId === id) || (a._id === id)
              )?.animals || [];
              
              // Delete each animal individually
              for (const animal of groupAnimals) {
                const res = await fetch(`http://localhost:5000/animals/${animal._id}`, {
                  method: "DELETE",
                });
                if (!res.ok) throw new Error("Failed to delete animal");
              }
            }
          } else {
            const res = await fetch(`http://localhost:5000/animals/${id}`, {
              method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete animal");
          }
          fetchData();
          showPopup(isGroup ? `${groupType === "batch" ? "Batch" : groupType === "other" ? "Hive/Farm" : "Group"} deleted successfully!` : "Animal deleted successfully!", true, "save");
        } catch (err) {
          showPopup(err.message, false, "error");
        }
      },
    });
  };

  const handleEdit = (animal) => {
    setEditId(animal._id);
    const editValues = {};
    Object.keys(editData).forEach(
      (key) => (editValues[key] = animal.data[key] || "")
    );
    setEditData(editValues);
  };

const handleUpdate = async (id) => {
  // Validate empty fields
  const emptyFields = Object.entries(editData)
    .filter(([key, value]) => !value || value.toString().trim() === "")
    .map(([key]) => key);

  if (emptyFields.length > 0) {
    showPopup(
      `Please fill all fields before saving. Missing: ${emptyFields.join(
        ", "
      )}`,
      false,
      "error"
    );
    return;
  }

  try {
    // First get the current animal data
    const currentAnimalRes = await fetch(`http://localhost:5000/animals/${id}`);
    if (!currentAnimalRes.ok) throw new Error("Failed to fetch current animal data");
    const currentAnimal = await currentAnimalRes.json();
    
    // Merge the updated fields with existing data
    const mergedData = {
      ...currentAnimal.data, // Keep all existing data
      ...editData           // Override with updated fields
    };

    const res = await fetch(`http://localhost:5000/animals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: mergedData, updatedAt: Date.now() }),
    });
    if (!res.ok) throw new Error("Failed to update animal");
    const updatedAnimal = await res.json();
    setAnimals((prev) => prev.map((a) => (a._id === id ? updatedAnimal : a)));
    setEditId(null);
    showPopup("Animal updated successfully!");
  } catch (err) {
    showPopup(err.message, false, "error");
  }
};

  // Get appropriate fields based on management type
  const getDisplayFields = () => {
    if (!animalType) return [];
    
    if (animalType.managementType === "batch") {
      return animalType.categories.find(cat => cat.name === "Batch Info")?.fields || [];
    } else if (animalType.managementType === "other") {
      return animalType.categories.find(cat => cat.name === "Hive/Farm Info")?.fields || [];
    } else {
      return animalType.categories.find(cat => cat.name === "Basic Info")?.fields || [];
    }
  };

  const displayFields = getDisplayFields();

  // Get group identifier for display
  const getGroupIdentifier = (animal) => {
    if (animalType.managementType === "batch") {
      return animal.batchId;
    } else if (animalType.managementType === "other") {
      return animal.groupId || animal.batchId || animal._id;
    }
    return animal.animalId;
  };

  // Search & filter logic
  const handleFilterChange = (field, value) => {
    setFilterValues({ ...filterValues, [field]: value });
  };

  const filteredAnimals = animals.filter((animal) => {
    const matchesSearch = searchQuery
      ? Object.values(animal.data).some((val) =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        ) || 
        (getGroupIdentifier(animal) && getGroupIdentifier(animal).toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesFilters = Object.keys(filterValues).every((key) => {
      if (!filterValues[key]) return true;
      const val = animal.data[key] || "";
      if (displayFields.find((f) => f.name === key)?.type === "number") {
        return Number(val) === Number(filterValues[key]);
      }
      return String(val)
        .toLowerCase()
        .includes(filterValues[key].toLowerCase());
    });

    return matchesSearch && matchesFilters;
  });

  // Loading / Error
  if (loading)
    return (
      <div className="flex justify-center items-center h-48 text-dark-gray dark:text-dark-text">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-btn-teal"></div>
        <p className="ml-4">Loading {type} data...</p>
      </div>
    );

  if (error || !animalType)
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-dark-gray dark:text-dark-text">
          {error ? `Error Loading ${type}` : "Animal Type Not Found"}
        </h2>
        <p className="text-red-500 dark:text-btn-red mb-4">
          {error || `The animal type "${type}" could not be loaded.`}
        </p>
        {error && (
          <button
            className="px-4 py-2 rounded bg-btn-blue text-white hover:bg-blue-800 mr-2"
            onClick={fetchData}
          >
            Retry
          </button>
        )}
        <button
            className="px-4 py-2 rounded bg-btn-gray text-white hover:bg-gray-700"
            onClick={() => navigate("/AnimalManagement")}
          >
            Back
          </button>
      </div>
    );

  // Render
  return (
    <div className={`${darkMode ? "dark bg-dark-bg" : "bg-light-beige"}`}>
      <main className="p-5">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-5 gap-4">
          <h2
            className={`text-2xl font-semibold ${
              darkMode ? "text-dark-text" : "text-dark-gray"
            }`}
          >
            {animalType.name} List
            {animalType.managementType !== "individual" && 
              ` (${animalType.managementType === "batch" ? "Batch" : "Hive/Farm"} View)`}
          </h2>
          <button
            onClick={() => navigate(`/AnimalManagement/add-animal/${animalType._id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold bg-btn-teal text-white hover:bg-teal-700"
          >
            ➕ Add New {animalType.managementType !== "individual" 
              ? (animalType.managementType === "batch" ? "Batch" : "Hive/Farm") 
              : animalType.name}
          </button>
        </div>

        {/* Modern Search Bar */}
        <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-100 dark:bg-dark-card rounded-lg shadow-inner items-center">
          <input
            type="text"
            placeholder="Search by any field..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-btn-teal focus:border-btn-teal"
          />
          {displayFields.slice(0, 2).map((field) => (
            <input
              key={field.name}
              type={
                field.type === "number"
                  ? "number"
                  : field.type === "date"
                  ? "date"
                  : "text"
              }
              placeholder={`Filter by ${field.label}`}
              value={filterValues[field.name] || ""}
              onChange={(e) => handleFilterChange(field.name, e.target.value)}
              className="p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-btn-teal focus:border-btn-teal"
            />
          ))}
        </div>

        {/* Table */}
        <div
          className={`overflow-x-auto rounded-lg shadow-md ${
            darkMode ? "bg-dark-card shadow-cardDark" : "bg-soft-white shadow-card"
          }`}
        >
          <table className="w-full table-auto border-separate border-spacing-0 text-sm">
            <thead
              className={
                darkMode
                  ? "bg-dark-gray text-dark-text sticky top-0"
                  : "bg-gray-200 text-dark-gray font-semibold sticky top-0"
              }
            >
              <tr>
                <th className="p-3 text-center">QR & ID</th>
                <th className="p-3">Zone</th>
                {animalType.managementType === "batch" && (
                  <th className="p-3 text-center">Count</th>
                )}
                {displayFields.map((field, idx) => (
                  <th key={idx} className="p-3">
                    {field.label}
                  </th>
                ))}
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnimals.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayFields.length + (animalType.managementType === "batch" ? 4 : 3)}
                    className="p-4 text-center italic text-gray-500 dark:text-gray-400"
                  >
                    No matching {animalType.name} found.
                  </td>
                </tr>
              ) : (
                filteredAnimals.map((animal) => (
                  <tr
                    key={animal._id}
                    className={`${
                      darkMode ? "bg-dark-card text-dark-text" : "bg-white"
                    } hover:${darkMode ? "bg-dark-gray" : "bg-gray-100"}`}
                  >
                    {/* QR Code + Animal/Batch/Hive ID */}
                    <td className="p-3">
                      <div className="flex flex-col items-center justify-center">
                        {animalType.managementType !== "individual" ? (
                          // For batch/other animals, show group ID and QR code
                          <div className="text-center">
                            <QRCodeCanvas 
                              value={getGroupIdentifier(animal)} 
                              size={60} 
                              level="H" 
                              className="mx-auto" // Center the QR code
                            />
                            <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                              {animalType.managementType === "batch" ? "Batch: " : "ID: "}
                              {getGroupIdentifier(animal)}
                            </div>
                          </div>
                        ) : animal.qrCode ? (
                          // For individual animals, show individual QR code
                          <div className="text-center">
                            <QRCodeCanvas 
                              value={animal.qrCode} 
                              size={60} 
                              level="H" 
                              className="mx-auto" // Center the QR code
                            />
                            <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                              {animal.animalId}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>

                    {/* Zone */}
                    <td className="p-2 text-center">
                      {getZoneInfo(animal).name}
                    </td>

                    {/* Count for batch animals only */}
                    {animalType.managementType === "batch" && (
                      <td className="p-2 text-center font-semibold">
                        {animal.count}
                      </td>
                    )}

                    {/* Dynamic Fields */}
                    {displayFields.map((field, idx) => (
                      <td key={idx} className="p-2 text-center">
                        {editId === animal._id ? (
                          field.type === "select" && field.options ? (
                            <select
                              value={editData[field.name] || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  [field.name]: e.target.value,
                                })
                              }
                              className={`w-full p-1 rounded border ${
                                darkMode
                                  ? "bg-dark-card border-gray-600 text-dark-text"
                                  : "border-gray-200"
                              }`}
                            >
                              <option value="">Select {field.label}</option>
                              {field.options.map((opt, i) => (
                                <option key={i} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={
                                field.type === "number"
                                  ? "number"
                                  : field.type === "date"
                                  ? "date"
                                  : "text"
                              }
                              value={editData[field.name] || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  [field.name]: e.target.value,
                                })
                              }
                              className={`w-full p-1 rounded border ${
                                darkMode
                                  ? "bg-dark-card border-gray-600 text-dark-text"
                                  : "border-gray-200"
                              }`}
                            />
                          )
                        ) : (
                          animal.data[field.name] || "-"
                        )}
                      </td>
                    ))}

                    {/* Actions */}
                    <td className="p-2 text-center">
                      <div className="flex justify-center gap-2">
                        {editId === animal._id ? (
                          <>
                            <button
                              onClick={() => handleUpdate(animal._id)}
                              className="px-2 py-1 rounded bg-btn-teal text-white hover:bg-teal-700"
                            >
                              💾 Save
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="px-2 py-1 rounded bg-btn-gray text-white hover:bg-gray-700"
                            >
                              ✖ Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(animal)}
                              className="px-2 py-1 rounded bg-btn-blue text-white hover:bg-blue-800"
                            >
                              ✏ Edit
                            </button>
                            <button
                              onClick={() => {
                                setAnimalToMove(animal);
                                setMoveZoneId("");
                              }}
                              className="px-2 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
                            >
                              🏠 Move
                            </button>
                            <button
                              onClick={() => handleDelete(
                                animalType.managementType !== "individual" 
                                  ? (animalType.managementType === "batch" ? animal.batchId : animal.groupId || animal._id)
                                  : animal._id,
                                animalType.managementType !== "individual",
                                animalType.managementType
                              )}
                              className="px-2 py-1 rounded bg-btn-red text-white hover:bg-red-600"
                            >
                              🗑 Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Move Zone Modal */}
      {animalToMove && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className={`bg-white dark:bg-dark-card p-6 rounded-xl w-96 ${darkMode ? "text-dark-text" : ""}`}>
            <h3 className="text-lg font-semibold mb-4">
              Move {animalType.managementType !== "individual" 
                ? (animalType.managementType === "batch" ? "Batch" : "Hive/Farm") 
                : animalToMove.data?.name} to another zone
            </h3>
            <select
              value={moveZoneId}
              onChange={(e) => setMoveZoneId(e.target.value)}
              className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a zone</option>
              {zones.map(zone => (
                <option 
                  key={zone._id} 
                  value={zone._id}
                  disabled={zone.currentOccupancy >= zone.capacity && zone._id !== getZoneInfo(animalToMove).id}
                >
                  {zone.name} ({zone.currentOccupancy}/{zone.capacity})
                  {zone.currentOccupancy >= zone.capacity && zone._id !== getZoneInfo(animalToMove).id && " - FULL"}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAnimalToMove(null)}
                className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!moveZoneId) {
                    showPopup("Please select a zone", false, "error");
                    return;
                  }
                  
                  try {
                    // For batch/other animals, use the appropriate update endpoint
                    if (animalType.managementType !== "individual") {
                      if (animalType.managementType === "batch") {
                        const res = await fetch(`http://localhost:5000/animals/batch/${animalToMove.batchId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ zoneId: moveZoneId }),
                        });
                        
                        if (!res.ok) {
                          const errorData = await res.json();
                          throw new Error(errorData.message || "Failed to move batch");
                        }
                      } else {
                        // For "other" type, move each animal individually
                        for (const animal of animalToMove.animals || [animalToMove]) {
                          const res = await fetch(`http://localhost:5000/animals/${animal._id}/move-zone`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ zoneId: moveZoneId }),
                          });
                          
                          if (!res.ok) {
                            const errorData = await res.json();
                            throw new Error(errorData.message || "Failed to move animal");
                          }
                        }
                      }
                    } else {
                      // For individual animals
                      const res = await fetch(`http://localhost:5000/animals/${animalToMove._id}/move-zone`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ zoneId: moveZoneId }),
                      });
                      
                      if (!res.ok) {
                        const errorData = await res.json();
                        throw new Error(errorData.message || "Failed to move animal");
                      }
                    }
                    
                    showPopup(animalType.managementType !== "individual" 
                      ? `${animalType.managementType === "batch" ? "Batch" : "Hive/Farm"} moved successfully!` 
                      : "Animal moved successfully!");
                    setAnimalToMove(null);
                    fetchData(); // Refresh data
                  } catch (err) {
                    showPopup(err.message, false, "error");
                  }
                }}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup */}
      {popup.show && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div
            className={`bg-white dark:bg-dark-card p-5 rounded-2xl w-80 max-w-[90%] text-center shadow-lg animate-popIn border-l-4 ${
              popup.success
                ? "border-btn-teal"
                : popup.type === "delete"
                ? "border-yellow-400"
                : "border-btn-red"
            }`}
          >
            <p className="mb-4">{popup.message}</p>
            {popup.type === "delete" ? (
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    popup.confirmAction?.();
                    setPopup({ ...popup, show: false });
                  }}
                  className="px-4 py-2 rounded bg-btn-red text-white hover:bg-red-600"
                >
                  Yes
                </button>
                <button
                  onClick={() => setPopup({ ...popup, show: false })}
                  className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-600"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setPopup({ ...popup, show: false })}
                className="px-4 py-2 rounded bg-btn-teal text-white hover:bg-teal-700"
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}