import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import { useTheme } from "../contexts/ThemeContext.js";
import { QRCodeCanvas } from "qrcode.react";

export default function AnimalList() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState({});

  useEffect(() => {
    document.title = "Animal List";
  }, []);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  // ------------------ FETCH DATA ------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const typeRes = await fetch(`http://localhost:5000/animal-types/${type}`);
      if (!typeRes.ok) throw new Error(`Animal type not found`);
      const typeData = await typeRes.json();
      setAnimalType(typeData);

      // Initialize editData for Basic Info only
      const basicInfoCategory = typeData.categories.find(
        (cat) => cat.name === "Basic Info"
      );
      const initialEditData = {};
      if (basicInfoCategory)
        basicInfoCategory.fields.forEach(
          (field) => (initialEditData[field.name] = "")
        );
      setEditData(initialEditData);

      const animalsRes = await fetch(
        `http://localhost:5000/animals?type=${typeData._id}`
      );
      if (!animalsRes.ok) throw new Error("Failed to fetch animals");
      setAnimals((await animalsRes.json()) || []);
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

  const handleDelete = (id) => {
    setPopup({
      show: true,
      message: "Are you sure you want to delete this animal?",
      success: false,
      type: "delete",
      confirmAction: async () => {
        try {
          const res = await fetch(`http://localhost:5000/animals/${id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Failed to delete animal");
          fetchData();
          showPopup("Animal deleted successfully!", true, "save");
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

  // ------------------ UPDATE WITH VALIDATION ------------------
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
      const res = await fetch(`http://localhost:5000/animals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: editData, updatedAt: Date.now() }),
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

  // ------------------ BASIC INFO FIELDS ------------------
  const basicInfoFields = [];
  const basicInfoCategory = animalType?.categories?.find(
    (cat) => cat.name === "Basic Info"
  );
  if (basicInfoCategory)
    basicInfoCategory.fields?.forEach((field) =>
      basicInfoFields.push({
        name: field.name,
        label: field.label,
        type: field.type,
        options: field.options || null, // dynamically get options
      })
    );

  // ------------------ SEARCH & FILTER LOGIC ------------------
  const handleFilterChange = (field, value) => {
    setFilterValues({ ...filterValues, [field]: value });
  };

  const filteredAnimals = animals.filter((animal) => {
    const matchesSearch = searchQuery
      ? Object.values(animal.data).some((val) =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true;

    const matchesFilters = Object.keys(filterValues).every((key) => {
      if (!filterValues[key]) return true;
      const val = animal.data[key] || "";
      if (basicInfoFields.find((f) => f.name === key)?.type === "number") {
        return Number(val) === Number(filterValues[key]);
      }
      return String(val)
        .toLowerCase()
        .includes(filterValues[key].toLowerCase());
    });

    return matchesSearch && matchesFilters;
  });

  // ------------------ LOADING / ERROR ------------------
  if (loading)
    return (
      <div
        className={`flex min-h-screen ${
          darkMode ? "bg-dark-bg" : "bg-light-beige"
        }`}
      >
        <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={type} />
        <div
          className={`flex-1 pt-16 transition-all ${
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <TopNavbar onMenuClick={handleMenuClick} />
          <div className="flex justify-center items-center h-48 text-dark-gray dark:text-dark-text">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-btn-teal"></div>
            <p className="ml-4">Loading {type} data...</p>
          </div>
        </div>
      </div>
    );

  if (error || !animalType)
    return (
      <div
        className={`flex min-h-screen ${
          darkMode ? "bg-dark-bg" : "bg-light-beige"
        }`}
      >
        <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={type} />
        <div
          className={`flex-1 pt-16 transition-all ${
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <TopNavbar onMenuClick={handleMenuClick} />
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
        </div>
      </div>
    );

  // ------------------ RENDER ------------------
  return (
    <div
      className={`flex min-h-screen ${
        darkMode ? "bg-dark-bg" : "bg-light-beige"
      }`}
    >
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={type} />
      <div
        className={`flex-1 pt-16 transition-all ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <TopNavbar onMenuClick={handleMenuClick} />

        <main className="p-5">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center mb-5 gap-4">
            <h2
              className={`text-2xl font-semibold ${
                darkMode ? "text-dark-text" : "text-dark-gray"
              }`}
            >
              {animalType.name} List
            </h2>
            <button
              onClick={() => navigate(`/add-animal/${animalType._id}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold bg-btn-teal text-white hover:bg-teal-700"
            >
              ➕ Add New {animalType.name}
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
            {basicInfoFields.slice(0, 2).map((field) => (
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
                  {basicInfoFields.map((field, idx) => (
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
                      colSpan={basicInfoFields.length + 2}
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
                      {/* QR Code + Animal ID */}
                      <td className="p-3">
                        <div className="flex flex-col items-center justify-center">
                          {animal.qrCode ? (
                            <QRCodeCanvas value={animal.qrCode} size={60} level="H" />
                          ) : (
                            "-"
                          )}
                          <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                            {animal.animalId}
                          </div>
                        </div>
                      </td>

                      {/* Dynamic Fields */}
                      {basicInfoFields.map((field, idx) => (
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
                                onClick={() => handleDelete(animal._id)}
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

        {/* Popup */}
        {popup.show && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 animate-fadeIn">
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
    </div>
  );
}
