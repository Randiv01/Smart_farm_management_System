import React from "react";
import DoctorNavBar from "../../DoctorPart/DoctorNavBar.js";

function H_MediStore() {
  return (
    <div className="flex">
      <DoctorNavBar />
      <div className="p-6 flex-1">
        <h1 className="text-2xl font-bold">Medicine Stock</h1>
        <p>List of medicines available for treatment.</p>
      </div>
    </div>
  );
}

export default H_MediStore;
