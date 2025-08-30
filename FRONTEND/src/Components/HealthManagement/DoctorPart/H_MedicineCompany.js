import React from "react";
import DoctorNavBar from "../../DoctorPart/DoctorNavBar.js";

function H_MedicineCompany() {
  return (
    <div className="flex">
      <DoctorNavBar />
      <div className="p-6 flex-1">
        <h1 className="text-2xl font-bold">Pharmacy</h1>
        <p>Medicine company and pharmacy details.</p>
      </div>
    </div>
  );
}

export default H_MedicineCompany;
