import React, { useState, useEffect } from "react";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import { useTheme } from "../contexts/ThemeContext.js";
import { useNavigate } from "react-router-dom";
import { useLoader } from "../contexts/LoaderContext.js";

export default function AddAnimalType() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { loading, setLoading } = useLoader();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [name, setName] = useState("");
  const [banner, setBanner] = useState(null);
  const [popup, setPopup] = useState({ show: false, success: true, message: "" });
  const navigate = useNavigate();

  const defaultCategories = [
    {
      name: "Basic Info",
      fields: [
        { name: "name", label: "Name", type: "text" },
        { name: "breed", label: "Breed", type: "text" },
        { name: "age", label: "Age", type: "number" },
        { name: "dob", label: "Date of Birth", type: "date" },
        { name: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
        { name: "owner", label: "Owner", type: "text" },
        { name: "location", label: "Location", type: "text" },
      ],
    },
    {
      name: "Health Info",
      fields: [
        { name: "weight", label: "Weight", type: "number" },
        { name: "temperature", label: "Temperature", type: "number" },
        {
          name: "healthStatus",
          label: "Health Status",
          type: "select",
          options: [
            "Healthy",
            "Sick",
            "Injured",
            "In Treatment",
            "Critical",
            "Quarantined",
            "Recovered",
            "Deceased",
          ],
          readOnly: true,
        },
        { name: "lastCheckup", label: "Last Checkup", type: "date" },
        { name: "symptoms", label: "Symptoms", type: "text" },
        {
          name: "vaccinations",
          label: "Vaccinations",
          type: "select",
          options: [
            "Not Vaccinated",
            "Partially Vaccinated",
            "Fully Vaccinated",
            "Overdue",
            "Unknown",
          ],
          readOnly: true,
        },
        { name: "treatments", label: "Treatments", type: "text" },
        {
          name: "reproductiveStatus",
          label: "Reproductive Status",
          type: "select",
          options: [
            "Not Pregnant",
            "Pregnant",
            "Lactating",
            "Ready for Breeding",
            "Unknown",
          ],
          readOnly: true,
        },
        { name: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
      ],
    },
    {
      name: "Productivity Info",
      fields: [
        { name: "milkProduction", label: "Milk Production", type: "number" },
        { name: "eggProduction", label: "Egg Production", type: "number" },
        { name: "feedType", label: "Feed Type", type: "text" },
        { name: "growthMetrics", label: "Growth Metrics", type: "text" },
      ],
    },
    {
      name: "Caretaker",
      fields: [
        { name: "caretakerName", label: "Caretaker Name", type: "text" },
        { name: "contact", label: "Contact", type: "tel" },
      ],
    },
  ];

  const [categories, setCategories] = useState(defaultCategories);

  useEffect(() => {
    document.title = "Add New Animal Type";
  }, []);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  const handleAddField = (categoryIndex) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].fields.push({ name: "", label: "", type: "text", options: [] });
    setCategories(newCategories);
  };

  const handleRemoveField = (catIdx, fieldIdx) => {
    const newCategories = [...categories];
    newCategories[catIdx].fields.splice(fieldIdx, 1);
    setCategories(newCategories);
  };

  const handleFieldChange = (catIdx, fieldIdx, key, value) => {
    const newCategories = [...categories];
    if (key === "label") {
      newCategories[catIdx].fields[fieldIdx].name = value.toLowerCase().replace(/\s+/g, "");
      newCategories[catIdx].fields[fieldIdx].label = value;
    } else if (key === "options") {
      newCategories[catIdx].fields[fieldIdx][key] = value.split(",").map((opt) => opt.trim());
    } else {
      newCategories[catIdx].fields[fieldIdx][key] = value;
    }
    setCategories(newCategories);
  };

  const handleSave = async () => {
    if (!name) return setPopup({ show: true, success: false, message: "Animal type name is required" });
    if (!banner) return setPopup({ show: true, success: false, message: "Banner image is required" });

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("categories", JSON.stringify(categories));
      formData.append("bannerImage", banner);

      const response = await fetch("http://localhost:5000/animal-types", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setPopup({ show: true, success: true, message: "Animal type saved successfully!" });
        setTimeout(() => navigate("/AnimalManagement"), 2000);
      } else {
        setPopup({ show: true, success: false, message: data.message || "Failed to save animal type" });
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setPopup({ show: true, success: false, message: "Failed to save animal type" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${darkMode ? "dark bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"} flex min-h-screen`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={null} />
      <div className={`flex-1 transition-all ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <TopNavbar onMenuClick={handleMenuClick} />

        <main className="max-w-6xl mx-auto p-6">
          <h2 className="text-2xl font-semibold text-center mb-6">{`Add New Animal Type`}</h2>

          <div className="flex flex-wrap gap-6 mb-6">
            <div className="flex flex-col flex-1 min-w-[200px]">
              <label className="mb-1 font-semibold">{`Animal Type Name:`}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-card dark:border-dark-gray dark:text-dark-text"
              />
            </div>

            <div className="flex flex-col flex-1 min-w-[200px]">
              <label className="mb-1 font-semibold">{`Banner Image:`}</label>
              <input
                type="file"
                onChange={(e) => setBanner(e.target.files[0])}
                className="px-1 py-1 border rounded focus:outline-none dark:bg-dark-card dark:border-dark-gray dark:text-dark-text"
              />
            </div>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
            {categories.map((cat, catIdx) => (
              <div
                key={catIdx}
                className={`flex flex-col bg-white dark:bg-dark-card rounded-xl shadow-cardDark p-4 h-full`}
              >
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200 dark:border-dark-gray">
                  <h3 className="font-semibold text-lg dark:text-dark-text">{cat.name}</h3>
                  <button
                    onClick={() => handleAddField(catIdx)}
                    className="bg-btn-blue text-white px-2 py-1 rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                  >
                    + Add Field
                  </button>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-1">
                  {cat.fields.map((field, fieldIdx) => (
                    <div key={fieldIdx} className="flex flex-wrap items-center gap-2">
                      <input
                        placeholder="Field Label"
                        value={field.label}
                        onChange={(e) => handleFieldChange(catIdx, fieldIdx, "label", e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-sm dark:bg-dark-card dark:text-dark-text dark:border-dark-gray"
                        disabled={field.readOnly}
                      />
                      <select
                        value={field.type}
                        onChange={(e) => handleFieldChange(catIdx, fieldIdx, "type", e.target.value)}
                        className="px-2 py-1 border rounded text-sm dark:bg-dark-card dark:text-dark-text dark:border-dark-gray"
                        disabled={field.readOnly}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="time">Time</option>
                        <option value="datetime">Datetime</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="tel">Tel</option>
                      </select>
                      {field.type === "select" && (
                        <input
                          placeholder="Options (comma separated)"
                          value={field.options?.join(",") || ""}
                          onChange={(e) => handleFieldChange(catIdx, fieldIdx, "options", e.target.value)}
                          className="flex-1 px-2 py-1 border rounded text-sm dark:bg-dark-card dark:text-dark-text dark:border-dark-gray"
                          disabled={field.readOnly}
                        />
                      )}
                      {!field.readOnly && (
                        <button
                          onClick={() => handleRemoveField(catIdx, fieldIdx)}
                          className="bg-btn-red text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ✖
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={handleSave}
              className="bg-btn-teal hover:bg-green-700 text-white px-4 py-2 rounded-2xl"
            >
              Save Animal Type
            </button>
          </div>
        </main>

        {/* Popup */}
        {popup.show && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setPopup({ ...popup, show: false })}
          >
            <div
              className={`bg-white dark:bg-dark-card p-6 rounded-2xl max-w-xs text-center shadow-cardDark animate-popIn border-t-4 ${
                popup.success ? "border-green-600" : "border-red-500"
              }`}
            >
              <div className="mb-2">
                {popup.success ? (
                  <div className="w-14 h-14 rounded-full border-4 border-green-600 mx-auto relative animate-checkGrow">
                    <div className="absolute left-1/4 top-1/4 w-2 h-5 border-r-4 border-b-4 border-white rotate-45"></div>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-red-500 mx-auto relative">
                    <span className="absolute left-1/2 top-1/2 w-7 h-1 bg-white rotate-45 -translate-x-1/2 -translate-y-1/2"></span>
                    <span className="absolute left-1/2 top-1/2 w-7 h-1 bg-white -rotate-45 -translate-x-1/2 -translate-y-1/2"></span>
                  </div>
                )}
              </div>
              <p className="text-sm font-medium dark:text-dark-text">{popup.message}</p>
            </div>
          </div>
        )}

        {/* Loader */}
        {loading && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="w-10 h-10 border-4 border-t-green-500 border-gray-200 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
