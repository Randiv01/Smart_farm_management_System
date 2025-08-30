import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaWhatsapp, FaEnvelope, FaPhoneAlt } from "react-icons/fa";

function DoctorDashboard() {
  const [specialists, setSpecialists] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch specialists
    const fetchSpecialists = axios.get("http://localhost:5000/api/specialists");
    // Fetch pharmacies / medicine companies
    const fetchPharmacies = axios.get("http://localhost:5000/api/medicine-companies");

    Promise.all([fetchSpecialists, fetchPharmacies])
      .then(([specRes, pharmRes]) => {
        setSpecialists(specRes.data);
        setPharmacies(pharmRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <p className="p-6 text-green-600">Loading data...</p>
    );

  return (
    <div className="p-6 bg-green-50 min-h-screen">
      {/* Specialists Section */}
      <h1 className="text-3xl font-bold mb-8 text-green-800">
        Specialists
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
        {specialists.map((spec) => (
          <div
            key={spec._id}
            className="bg-green-100 shadow-lg rounded-xl p-6 flex flex-col items-center transition-transform hover:scale-105"
          >
            <img
              src={
                spec.photo
                  ? `http://localhost:5000/${spec.photo}`
                  : "/default-profile.png"
              }
              alt={spec.fullName}
              className="w-32 h-32 rounded-full mb-4 object-cover border-4 border-green-200"
              onError={(e) => { e.target.src = "/default-profile.png"; }}
            />
            <h2 className="text-xl font-semibold text-green-800 mb-4 text-center">
              {spec.fullName}
            </h2>
            <div className="flex space-x-6">
              <a
                href={`https://wa.me/${spec.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-600 text-3xl"
                title="WhatsApp"
              >
                <FaWhatsapp />
              </a>
              <a
                href={`mailto:${spec.email}`}
                className="text-blue-400 hover:text-blue-500 text-3xl"
                title="Email"
              >
                <FaEnvelope />
              </a>
              <a
                href={`tel:${spec.phone}`}
                className="text-red-400 hover:text-red-500 text-3xl"
                title="Call"
              >
                <FaPhoneAlt />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Pharmacies Section */}
      <h1 className="text-3xl font-bold mb-8 text-green-800">
        Pharmacies
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {pharmacies.map((pharm) => (
          <div
            key={pharm._id}
            className="bg-green-100 shadow-lg rounded-xl p-6 flex flex-col items-center transition-transform hover:scale-105"
          >
            <h2 className="text-xl font-semibold text-green-800 mb-4 text-center">
              {pharm.pharmacy_name || pharm.name || "Pharmacy Name"}
            </h2>
            <div className="flex space-x-6">
              <a
                href={`https://wa.me/${pharm.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-600 text-3xl"
                title="WhatsApp"
              >
                <FaWhatsapp />
              </a>
              <a
                href={`mailto:${pharm.email}`}
                className="text-blue-400 hover:text-blue-500 text-3xl"
                title="Email"
              >
                <FaEnvelope />
              </a>
              <a
                href={`tel:${pharm.phone}`}
                className="text-red-400 hover:text-red-500 text-3xl"
                title="Call"
              >
                <FaPhoneAlt />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DoctorDashboard;