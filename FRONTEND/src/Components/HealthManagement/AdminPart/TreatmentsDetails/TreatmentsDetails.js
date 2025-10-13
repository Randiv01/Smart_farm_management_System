import React from "react";
import { useNavigate } from "react-router-dom";

// Main Treatments Page Component
function TreatmentsDetails() {
  const navigate = useNavigate();

  const handleViewAnimalTreatments = () => {
    navigate("/admin/H_AnimalTretmentDetils");
  };

  const handleViewPlantTreatments = () => {
    navigate("/admin/H_PlantTretmentDetils");
  };

  const handleAddAnimalTreatment = () => {
    navigate("/admin/H_AnimalTretmentAddFrom");
  };

  const handleAddPlantTreatment = () => {
    navigate("/admin/H_PlantTretmentAddFrom");
  };

  const handleBackToDashboard = () => {
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleBackToDashboard}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-center text-gray-800 flex-1">
            Farm Treatment Details
          </h1>
          <div className="w-24"></div> {/* Spacer */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plant Health Treatments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-green-600">
                Plant Health Treatments
              </h2>
            </div>

            {/* Plant Treatment Image */}
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src="../../../UserHome/Images/tretmentplant.jpg"
                alt="Plant Health Treatments"
                className="w-full h-80 object-cover rounded-lg shadow-md"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>

            <button
              onClick={handleAddPlantTreatment}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mb-3"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Treatment Details
            </button>
            <button
              onClick={handleViewPlantTreatments}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View Treatment Details
            </button>
          </div>

          {/* Animal Treatments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-blue-600">
                Animal Treatments
              </h2>
            </div>

            {/* Animal Treatment Image */}
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src="../../../UserHome/Images/tretmentanimal.webp"
                alt="Animal Treatments"
                className="w-full h-80 object-cover rounded-lg shadow-md"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>

            <button
              onClick={handleAddAnimalTreatment}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mb-3"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Treatment Details
            </button>
            <button
              onClick={handleViewAnimalTreatments}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View Treatment Details
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-700">
              Total Treatments
            </h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">24</p>
            <p className="text-sm text-gray-500">This month</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Active Cases</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">18</p>
            <p className="text-sm text-gray-500">Requiring attention</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-700">
              Success Rate
            </h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">92%</p>
            <p className="text-sm text-gray-500">Treatment effectiveness</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TreatmentsDetails;
