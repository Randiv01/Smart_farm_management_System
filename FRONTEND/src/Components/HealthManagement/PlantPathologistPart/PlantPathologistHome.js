import React from "react";
import FertiliserCompanies from "./FertiliserCompanies.js"; // import the list component

const PlantPathologistHome = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-green-700 mb-4">
        Welcome Plant Pathologist
      </h1>
      <p className="text-gray-600 mb-6">
        Manage fertiliser companies, monitor crops, and access your tools below.
      </p>

      {/* Fertiliser Companies List */}
      <FertiliserCompanies />
    </div>
  );
};

export default PlantPathologistHome;
