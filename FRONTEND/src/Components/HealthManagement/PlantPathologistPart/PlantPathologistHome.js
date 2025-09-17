import React from "react";
import FertiliserCompanies from "./FertiliserCompanies.js"; // import the list component

const PlantPathologistHome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="relative text-center mb-12">
          <h1 className="text-5xl font-extrabold text-green-800 tracking-tight">
            Welcome, Plant Pathologist
          </h1>
          <div className="mt-2 h-1 w-24 mx-auto bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Manage fertiliser companies, monitor crops, and access your tools with ease. Explore the resources below to optimize your workflow.
          </p>
        </div>

        {/* Fertiliser Companies Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-gray-200 relative overflow-hidden">
          {/* Decorative Corner Elements */}
          <div className="absolute top-0 left-0 w-16 h-16 bg-green-200 opacity-20 rounded-full transform -translate-x-8 -translate-y-8"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-green-200 opacity-20 rounded-full transform translate-x-8 translate-y-8"></div>

          <h2 className="text-2xl font-semibold text-green-700 mb-6">
            Fertiliser Companies
          </h2>
          <FertiliserCompanies />
        </div>
      </div>
    </div>
  );
};

export default PlantPathologistHome;
