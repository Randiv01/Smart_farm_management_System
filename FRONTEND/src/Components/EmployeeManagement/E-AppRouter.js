// src/Components/EmployeeManagement/E-AppRouter.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import { App as EApp } from "./E-App"; // <-- Rename to avoid conflict with main App

const EAppRouter = () => {
  return (
    <Routes>
      {/* Employee Management Main Layout (Sidebar + Header + Dashboard) */}
      <Route path="./E-App.js" element={<EApp />} />
    </Routes>
  );
};

export default EAppRouter;
