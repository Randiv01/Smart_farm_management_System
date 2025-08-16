import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import { useTheme } from "../contexts/ThemeContext.js";
import { useLoader } from "../contexts/LoaderContext.js"; // <-- loader context
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Correct import
import axios from "axios";
import "./HealthReport.css"; // unique CSS

export default function HealthReportUnique() {
  const { type } = useParams();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading: setGlobalLoading } = useLoader(); // <-- global loader

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [animalType, setAnimalType] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [healthFields, setHealthFields] = useState([]);
  const [error, setError] = useState(null);

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  const fetchData = async () => {
    try {
      setGlobalLoading(true); // <-- show global loader
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
      setGlobalLoading(false); // <-- hide global loader
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
    img.src = "/logo512.png"; // Public folder path
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

  if (error) return <div className="hr-unique-error">{error}</div>;
  if (!animalType) return <div className="hr-unique-error">No data found</div>;

  return (
    <div className={`hr-unique-dashboard ${darkMode ? "hr-unique-dark" : ""}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} type={type} />
      <div className={`hr-unique-main-wrapper ${sidebarOpen ? "hr-unique-sidebar-open" : "hr-unique-sidebar-closed"}`}>
        <TopNavbar onMenuClick={handleMenuClick} />
        <main className="hr-unique-report-page">
          <div className="hr-unique-header">
            <h2>{animalType.name} Health Report</h2>
          </div>

          <div className="hr-unique-table-container">
            <table className="hr-unique-health-table">
              <thead>
                <tr>
                  <th>QR Code</th>
                  <th>Name</th>
                  {healthFields.map((field, idx) => <th key={idx}>{field}</th>)}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {animals.length === 0 ? (
                  <tr>
                    <td colSpan={2 + healthFields.length + 1} className="hr-unique-no-data">No animals found</td>
                  </tr>
                ) : (
                  animals.map(animal => (
                    <tr key={animal._id}>
                      <td>{animal.qrCode ? <QRCodeCanvas value={animal.qrCode} size={50} level="H" /> : "-"}</td>
                      <td>{animal.data?.name || "-"}</td>
                      {healthFields.map((field, idx) => (
                        <td key={idx}>
                          {editId === animal._id ? (
                            <input
                              type="text"
                              className="hr-unique-edit-input"
                              value={editData[field] || ""}
                              onChange={e => setEditData({ ...editData, [field]: e.target.value })}
                            />
                          ) : animal.data?.[field] || "-"}
                        </td>
                      ))}
                      <td>
                        {editId === animal._id ? (
                          <>
                            <button className="hr-unique-btn-save" onClick={() => handleSave(animal._id)}>Save</button>
                            <button className="hr-unique-btn-cancel" onClick={handleCancel}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="hr-unique-btn-edit" onClick={() => handleEdit(animal)}>Edit</button>
                            <button className="hr-unique-btn-download" onClick={() => downloadPDF(animal)}>Download PDF</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
