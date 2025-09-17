import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const [medicines, setMedicines] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [error, setError] = useState("");

  // Refs for charts
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);

  // Fetch medicine details
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/medistore")
      .then((res) => setMedicines(res.data))
      .catch((err) => {
        console.error("Error fetching medicine data:", err);
        setError("Failed to fetch medicine data");
      });
  }, []);

  // Fetch doctor details
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/doctors")
      .then((res) => {
        setDoctors(res.data);
        setLoadingDoctors(false);
      })
      .catch((err) => {
        console.error("Error fetching doctor data:", err);
        setLoadingDoctors(false);
      });
  }, []);

  // Download chart as PNG
  const downloadChart = async (ref, name) => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${name}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* -------------------- Welcome Heading -------------------- */}
        <h1 className="text-4xl font-extrabold text-green-700 mb-8 text-center">
          Welcome, Mount Olive Farm House
        </h1>

        {/* -------------------- Medicine Charts -------------------- */}
        <div>
          <h2 className="text-3xl font-bold text-green-700 mb-6 text-center">
            Medicine Stock Charts
          </h2>

          {error && <p className="text-red-600 text-center mb-4">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <div className="bg-white shadow-lg rounded-lg p-4" ref={barChartRef}>
              <h3 className="text-xl font-semibold text-green-700 mb-2">
                Medicine Stock (Bar Chart)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={medicines}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="medicine_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity_available" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
              <button
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
                onClick={() => downloadChart(barChartRef, "Medicine_BarChart")}
              >
                <i className="fas fa-download"></i>
                <span>Download Bar Chart</span>
              </button>
            </div>

            {/* Line Chart */}
            <div className="bg-white shadow-lg rounded-lg p-4" ref={lineChartRef}>
              <h3 className="text-xl font-semibold text-green-700 mb-2">
                Medicine Stock (Line Chart)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={medicines}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="medicine_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="quantity_available"
                    stroke="#16a34a"
                  />
                </LineChart>
              </ResponsiveContainer>
              <button
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
                onClick={() => downloadChart(lineChartRef, "Medicine_LineChart")}
              >
                <i className="fas fa-download"></i>
                <span>Download Line Chart</span>
              </button>
            </div>
          </div>
        </div>

        {/* -------------------- Doctor Details -------------------- */}
        <div>
          <h2 className="text-3xl font-bold text-green-700 mb-6 text-center">
            Doctor Details
          </h2>

          {loadingDoctors ? (
            <p className="text-center text-gray-600">Loading doctors...</p>
          ) : doctors.length === 0 ? (
            <p className="text-center text-gray-600">No doctors found.</p>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full table-auto">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left">Photo</th>
                    <th className="px-6 py-3 text-left">Full Name</th>
                    <th className="px-6 py-3 text-left">Phone</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((d) => (
                    <tr key={d._id} className="border-b hover:bg-green-50">
                      <td className="px-6 py-3">
                        <img
                          src={`http://localhost:5000/Health_Uploads/${d.profilePhoto}`}
                          alt={d.fullName}
                          className="w-14 h-14 rounded-full object-cover border-2 border-green-500"
                        />
                      </td>
                      <td className="px-6 py-3 font-semibold text-gray-700">
                        {d.fullName}
                      </td>
                      <td className="px-6 py-3 text-gray-600">{d.phoneNo}</td>
                      <td className="px-6 py-3 flex space-x-3">
                        {/* WhatsApp */}
                        <a
                          href={`https://wa.me/${d.phoneNo}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center space-x-2 shadow">
                            <i className="fab fa-whatsapp"></i>
                            <span>WhatsApp</span>
                          </button>
                        </a>

                        {/* Email */}
                        <a
                          href={`mailto:${d.email}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center space-x-2 shadow">
                            <i className="fas fa-envelope"></i>
                            <span>Email</span>
                          </button>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
