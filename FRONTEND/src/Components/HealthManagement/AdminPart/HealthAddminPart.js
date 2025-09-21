// frontend/src/components/Dashboard.js
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
  Cell,
} from "recharts";

// React Icons (WhatsApp, Email, Download)
import { FaWhatsapp } from "react-icons/fa";
import { FiMail, FiDownload } from "react-icons/fi";

// Correct image imports from HealthAddminPart.js
import img1 from "../../UserHome/Images/ContactUs3.webp";
import img2 from "../../UserHome/Images/ContactUs2.jpg";
import img3 from "../../UserHome/Images/healthAdmin5.jpg";
import img4 from "../../UserHome/Images/healthAdmin3.webp";

function Dashboard() {
  const [medicines, setMedicines] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [error, setError] = useState("");

  // Refs for charts
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);

  // Hero slideshow
  const slides = [img1, img2, img3, img4];
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 6000); // 6 seconds
    return () => clearInterval(id);
  }, [slides.length]);

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

  // Color rules
  const colors = {
    red: "#ef4444",
    // Greens (mg)
    greenLight: "#86efac",
    greenMid: "#22c55e",
    greenDark: "#166534",
    // Blues (ml)
    blueLight: "#93c5fd",
    blueMid: "#3b82f6",
    blueDark: "#1d4ed8",
    // Oranges (g)
    orangeLight: "#fdba74",
    orangeMid: "#f97316",
    orangeDark: "#7c2d12",
    // Pinks (l)
    pinkLight: "#f9a8d4",
    pinkMid: "#ec4899",
    pinkDark: "#831843",
    // Fallback
    slate: "#94a3b8",
  };

  const getColorForItem = (item) => {
    const unit = String(item.unit || "").trim().toLowerCase();
    const q = parseFloat(item.quantity_available);
    if (isNaN(q)) return colors.slate;

    switch (unit) {
      case "mg":
        if (q < 100) return colors.red;
        if (q >= 500) return colors.greenDark;
        if (q > 200) return colors.greenMid;
        return colors.greenLight; // 100-200
      case "ml":
        if (q < 200) return colors.red;
        if (q >= 500) return colors.blueDark; // precedence for 500+
        if (q > 400) return colors.blueMid;   // 401-499
        return colors.blueLight;              // 200-400
      case "g":
        if (q < 500) return colors.red;
        if (q >= 900) return colors.orangeDark;
        if (q > 600) return colors.orangeMid; // 601-899
        return colors.orangeLight;            // 500-600
      case "l":
        if (q < 1.5) return colors.red;
        if (q >= 6.5) return colors.pinkDark;
        if (q > 3.5) return colors.pinkMid;   // 3.51-6.49
        return colors.pinkLight;              // 1.5-3.5
      default:
        return colors.slate;
    }
  };

  // Build chart data with numeric quantity and color
  const chartData = medicines.map((m) => {
    const quantityNum = parseFloat(m.quantity_available) || 0;
    const fill = getColorForItem(m);
    return { ...m, quantityNum, fill };
  });

  // Colored dots for LineChart
  const renderColoredDot = (props) => {
    const color = getColorForItem(props.payload || {});
    return <circle cx={props.cx} cy={props.cy} r={4} stroke={color} fill={color} />;
  };

  // Format number for wa.me (digits only)
  const formatWhatsAppNumber = (input) => {
    if (!input) return "";
    const digits = String(input).replace(/[^\d]/g, "");
    return digits;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* -------------------- Hero Slideshow -------------------- */}
        <div className="relative rounded-xl overflow-hidden shadow-lg">
          <img
            src={slides[slideIndex]}
            alt="Admin slide"
            className="w-full h-64 md:h-80 lg:h-96 object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow">
              Welcome, Mount Olive Farm House
            </h1>
            <p className="mt-3 text-lg md:text-2xl font-semibold drop-shadow">
              Medicine Stock Charts
            </p>
          </div>
          {/* Dots */}
          <div className="absolute bottom-3 right-4 flex space-x-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  i === slideIndex ? "bg-white" : "bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>

        {/* -------------------- Medicine Charts -------------------- */}
        <div>
          {error && <p className="text-red-600 text-center mb-4">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <div className="bg-white shadow-lg rounded-lg p-4" ref={barChartRef}>
              <h3 className="text-xl font-semibold text-green-700 mb-2">
                Medicine Stock (Bar Chart)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="medicine_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantityNum" name="Quantity">
                    {chartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <button
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
                onClick={() => downloadChart(barChartRef, "Medicine_BarChart")}
              >
                <FiDownload size={18} />
                <span>Download Bar Chart</span>
              </button>
            </div>

            {/* Line Chart */}
            <div className="bg-white shadow-lg rounded-lg p-4" ref={lineChartRef}>
              <h3 className="text-xl font-semibold text-green-700 mb-2">
                Medicine Stock (Line Chart)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="medicine_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="quantityNum"
                    name="Quantity"
                    stroke="#94a3b8"      // neutral line stroke
                    dot={renderColoredDot} // colored dots per item
                    activeDot={renderColoredDot}
                  />
                </LineChart>
              </ResponsiveContainer>
              <button
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2"
                onClick={() => downloadChart(lineChartRef, "Medicine_LineChart")}
              >
                <FiDownload size={18} />
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
                  {doctors.map((d) => {
                    const waNumber = formatWhatsAppNumber(d.phoneNo);
                    return (
                      <tr key={d._id} className="border-b hover:bg-green-50">
                        <td className="px-6 py-3">
                          {d.profilePhoto ? (
                            <img
                              src={`http://localhost:5000/Health_Uploads/${d.profilePhoto}`}
                              alt={d.fullName}
                              className="w-14 h-14 rounded-full object-cover border-2 border-green-500"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                              {d.fullName ? d.fullName.charAt(0) : "?"}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3 font-semibold text-gray-700">
                          {d.fullName}
                        </td>
                        <td className="px-6 py-3 text-gray-600">{d.phoneNo}</td>
                        <td className="px-6 py-3">
                          <div className="flex space-x-2 items-center">
                            {/* WhatsApp */}
                            {waNumber ? (
                              <a
                                href={`https://wa.me/${waNumber}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded hover:bg-gray-100 transition-colors"
                                title="WhatsApp"
                                aria-label="WhatsApp"
                              >
                                <FaWhatsapp
                                  size={26}
                                  className="text-green-500 hover:text-green-600 hover:scale-110 transition-transform"
                                />
                              </a>
                            ) : null}

                            {/* Email */}
                            {d.email ? (
                              <a
                                href={`mailto:${d.email}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded hover:bg-gray-100 transition-colors"
                                title="Email"
                                aria-label="Email"
                              >
                                <FiMail
                                  size={26}
                                  className="text-blue-500 hover:text-blue-600 hover:scale-110 transition-transform"
                                />
                              </a>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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