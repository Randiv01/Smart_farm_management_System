import React from "react";
import DoctorNavBar from "../../DoctorPart/DoctorNavBar.js";

function H_SpecialistDetails() {
  return (
    <div className="flex">
      <DoctorNavBar />
      <div className="p-6 flex-1">
        <h1 className="text-2xl font-bold">Vet Specialist</h1>
        <p>Specialist doctor contact and details.</p>
      </div>
    </div>
  );
}

export default H_SpecialistDetails;
