import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function HealthAnimal() {
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const [animals, setAnimals] = useState([
    {
      id: 1,
      name: "Cow",
      vaccinationStatus: "Up to date",
      isPregnant: false,
      illnessStatus: "Healthy",
      treatments: ["Annual check-up"],
      medicines: ["Vitamin supplement"],
      qrCode: "COW-001",
    },
    {
      id: 2,
      name: "Hen",
      vaccinationStatus: "Due in 2 days",
      isPregnant: true,
      illnessStatus: "Infected with Mydriasis",
      treatments: [],
      medicines: ["Antibiotic 5x/day"],
      qrCode: "HEN-002",
    },
    {
      id: 3,
      name: "Pig",
      vaccinationStatus: "Expired",
      isPregnant: false,
      illnessStatus: "Sick",
      treatments: ["Antibiotics", "Rest"],
      medicines: ["Amoxicillin", "Pain reliever"],
      qrCode: "PIG-003",
    },
    {
      id: 4,
      name: "Goat",
      vaccinationStatus: "Up to date",
      isPregnant: true,
      illnessStatus: "Healthy",
      treatments: [],
      medicines: [],
      qrCode: "GOAT-004",
    },
    {
      id: 5,
      name: "Buffalo",
      vaccinationStatus: "Due tomorrow",
      isPregnant: false,
      illnessStatus: "Minor injury",
      treatments: ["Bandage change"],
      medicines: ["Anti-inflammatory"],
      qrCode: "BUFF-005",
    },
  ]);

  const handleEdit = (animal) => {
    setEditId(animal.id);
    setEditData({ ...animal });
  };

  const handleCancel = () => {
    setEditId(null);
    setEditData({});
  };

  const handleSave = (id) => {
    setAnimals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...editData } : a))
    );
    setEditId(null);
  };

  const downloadPDF = (animal) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Farm Health Report", 14, 20);

    doc.setFontSize(14);
    doc.text(`${animal.name} Health Report`, 14, 30);

    const tableData = [
      ["Name", animal.name],
      ["Vaccination Status", animal.vaccinationStatus],
      ["Pregnant", animal.isPregnant ? "Yes" : "No"],
      ["Illness", animal.illnessStatus],
      ["Treatments", animal.treatments.length ? animal.treatments.join(", ") : "None"],
      ["Medicines", animal.medicines.length ? animal.medicines.join(", ") : "None"],
    ];

    autoTable(doc, {
      startY: 40,
      head: [["Field", "Value"]],
      body: tableData,
    });

    doc.save(`${animal.name}_HealthReport.pdf`);
  };

  return (
    <div className="p-6 bg-green-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-green-800">
        Animal Health Dashboard
      </h1>
      <p className="mb-6 text-green-700 text-lg">
        Manage and monitor health records for all animals in the facility.
      </p>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {animals.map((animal) => (
          <div
            key={animal.id}
            className="bg-green-100 p-6 rounded-lg shadow-md hover:shadow-lg transition duration-200"
          >
            <h2 className="text-xl font-semibold mb-3 text-green-800 border-b pb-2 flex justify-between items-center">
              {animal.name}
              <QRCodeCanvas value={animal.qrCode} size={40} />
            </h2>

            <div className="space-y-3 text-green-700">
              <p><strong>Vaccination:</strong> {animal.vaccinationStatus}</p>
              <p><strong>Pregnancy:</strong> {animal.isPregnant ? "Yes" : "No"}</p>
              <p><strong>Illness:</strong> {animal.illnessStatus}</p>
              <p><strong>Treatments:</strong> {animal.treatments.length ? animal.treatments.join(", ") : "None"}</p>
              <p><strong>Medicines:</strong> {animal.medicines.length ? animal.medicines.join(", ") : "None"}</p>
            </div>

            <div className="flex gap-2 mt-4">
              {editId === animal.id ? (
                <>
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                    onClick={() => handleSave(animal.id)}
                  >
                    Save
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    onClick={() => handleEdit(animal)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                    onClick={() => downloadPDF(animal)}
                  >
                    PDF
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HealthAnimal;
