import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.js";
import { useLoader } from "../contexts/LoaderContext.js";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";

export default function HealthReport() {
  const { type } = useParams();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading: setGlobalLoading } = useLoader();

  const [animalType, setAnimalType] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [healthFields, setHealthFields] = useState([]);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const fetchData = async () => {
    try {
      setGlobalLoading(true);
      const typeRes = await axios.get(`http://localhost:5000/animal-types/${type}`);
      const typeData = typeRes.data;
      setAnimalType(typeData);

      // Extract Health Info fields dynamically
      const healthCategory = typeData.categories?.find(c => c.name === "Health Info");
      setHealthFields(healthCategory?.fields.map(f => f.name) || []);

      const animalsRes = await axios.get(`http://localhost:5000/animals?type=${typeData._id}`);
      setAnimals(animalsRes.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [type]);

  const handleEdit = (animal) => {
    setEditId(animal._id);
    setEditData({ ...animal.data });
  };

  const handleCancel = () => {
    setEditId(null);
    setEditData({});
  };

  const handleSave = async (id) => {
    try {
      setGlobalLoading(true);
      await axios.put(`http://localhost:5000/animals/${id}`, { data: editData });
      setEditId(null);
      fetchData();
    } catch (err) {
      alert("Failed to update animal");
    } finally {
      setGlobalLoading(false);
    }
  };

  const downloadPDF = (animal) => {
    const doc = new jsPDF();

    // Add logo
    const img = new Image();
    img.src = "/logo512.png";
    img.onload = () => {
      doc.addImage(img, "PNG", 14, 10, 30, 30);

      // Company name
      doc.setFontSize(16);
      doc.text("Mount Olive Farm House", 50, 20);
      doc.setFontSize(12);
      doc.text(`${animal.data?.name || animal.name} Health Report`, 14, 50);

      // Table of health fields
      const tableData = healthFields.map(f => [f, animal.data?.[f] || "-"]);
      autoTable(doc, {
        startY: 60,
        head: [["Field", "Value"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [60, 141, 188], textColor: 255 },
      });

      doc.save(`${animal.data?.name || animal.name}_HealthReport.pdf`);
    };
  };

  if (error) return (
    <div className={`p-4 text-center ${darkMode ? "text-red-300" : "text-red-600"}`}>
      {error}
    </div>
  );

  if (!animalType) return (
    <div className={`p-4 text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
      No data found
    </div>
  );

  return (
    <div className={`p-4 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-light-beige text-gray-900"}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">
          {animalType.name} Health Report
        </h2>
      </div>

      <div className={`overflow-x-auto rounded-lg shadow-md ${
        darkMode ? "bg-gray-800" : "bg-white"
      }`}>
        <table className="w-full">
          <thead className={`${
            darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800"
          }`}>
            <tr>
              <th className="p-3 text-center">QR Code</th>
              <th className="p-3">Name</th>
              {healthFields.map((field, idx) => (
                <th key={idx} className="p-3">{field}</th>
              ))}
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {animals.length === 0 ? (
              <tr>
                <td 
                  colSpan={3 + healthFields.length} 
                  className={`p-4 text-center italic ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No animals found
                </td>
              </tr>
            ) : (
              animals.map(animal => (
                <tr 
                  key={animal._id} 
                  className={`${
                    darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-50"
                  } border-b ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <td className="p-3 text-center">
                    {animal.qrCode ? (
                      <QRCodeCanvas value={animal.qrCode} size={50} level="H" />
                    ) : "-"}
                  </td>
                  <td className="p-3">{animal.data?.name || "-"}</td>
                  {healthFields.map((field, idx) => (
                    <td key={idx} className="p-3">
                      {editId === animal._id ? (
                        <input
                          type="text"
                          className={`w-full p-1 rounded border ${
                            darkMode 
                              ? "bg-gray-700 border-gray-600 text-gray-100" 
                              : "border-gray-300"
                          }`}
                          value={editData[field] || ""}
                          onChange={e => setEditData({ ...editData, [field]: e.target.value })}
                        />
                      ) : animal.data?.[field] || "-"}
                    </td>
                  ))}
                  <td className="p-3">
                    <div className="flex gap-2">
                      {editId === animal._id ? (
                        <>
                          <button 
                            className={`px-2 py-1 rounded ${
                              darkMode 
                                ? "bg-green-600 hover:bg-green-700" 
                                : "bg-green-500 hover:bg-green-600"
                            } text-white`}
                            onClick={() => handleSave(animal._id)}
                          >
                            Save
                          </button>
                          <button 
                            className={`px-2 py-1 rounded ${
                              darkMode 
                                ? "bg-red-600 hover:bg-red-700" 
                                : "bg-red-500 hover:bg-red-600"
                            } text-white`}
                            onClick={handleCancel}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            className={`px-2 py-1 rounded ${
                              darkMode 
                                ? "bg-blue-600 hover:bg-blue-700" 
                                : "bg-blue-500 hover:bg-blue-600"
                            } text-white`}
                            onClick={() => handleEdit(animal)}
                          >
                            Edit
                          </button>
                          <button 
                            className={`px-2 py-1 rounded ${
                              darkMode 
                                ? "bg-gray-600 hover:bg-gray-700" 
                                : "bg-gray-500 hover:bg-gray-600"
                            } text-white`}
                            onClick={() => downloadPDF(animal)}
                          >
                            PDF
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
    </div>
  );
}