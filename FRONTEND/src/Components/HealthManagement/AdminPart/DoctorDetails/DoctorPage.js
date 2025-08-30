import React, { useEffect, useState } from "react";
import axios from "axios";

function DoctorPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch doctors from backend
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/doctors")
      .then((res) => {
        setDoctors(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching doctors:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-6">👨‍⚕️ Doctor Management</h1>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-4">
        <button
          className="bg-green-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-green-700 transition"
          onClick={() => alert("Add doctor feature coming soon!")}
        >
          ➕ Add New Doctor
        </button>

        <button
          className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
          onClick={() => alert("Download PDF feature coming soon!")}
        >
          📄 Download Doctor Details (PDF)
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <p className="text-gray-600">Loading doctors...</p>
      ) : doctors.length === 0 ? (
        <p className="text-gray-600">No doctors found.</p>
      ) : (
        /* Doctor Table */
        <table className="w-full border border-gray-300 shadow-md rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Specialization</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc) => (
              <tr
                key={doc._id}
                className="text-center hover:bg-gray-100 transition"
              >
                <td className="border px-4 py-2">{doc.name}</td>
                <td className="border px-4 py-2">{doc.specialization}</td>
                <td className="border px-4 py-2">{doc.email}</td>
                <td className="border px-4 py-2">{doc.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DoctorPage;
