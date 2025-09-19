import React from "react";
import { X } from "lucide-react";
import { StaffHub } from "./pages/E-StaffHub";
import { AttendanceTracker } from "./pages/E-AttendanceTracker";
import { LeavePlanner } from "./pages/E-LeavePlanner";
import { OvertimeMonitor } from "./pages/E-OvertimeMonitor";
import { SalaryDesk } from "./pages/E-SalaryDesk";
import { EmployeeReportCenter } from "./pages/E-EmployeeReportCenter";
import { SystemSettings } from "./pages/E-SystemSettings";

export const ModulePanel = ({ module, darkMode, onClose }) => {
  const renderModule = () => {
    switch (module) {
      case "staff":
        return <StaffHub darkMode={darkMode} />;
      case "attendance":
        return <AttendanceTracker darkMode={darkMode} />;
      case "leave":
        return <LeavePlanner darkMode={darkMode} />;
      case "overtime":
        return <OvertimeMonitor darkMode={darkMode} />;
      case "salary":
        return <SalaryDesk darkMode={darkMode} />;
      case "reports":
        return <EmployeeReportCenter darkMode={darkMode} />;
      case "settings":
        return <SystemSettings darkMode={darkMode} />;
      default:
        return <div>Module not found</div>;
    }
  };

  return (
    <div
      className={`rounded-lg overflow-hidden ${
        darkMode ? "bg-dark-card text-dark-text" : "bg-soft-white text-black"
      }`}
    >
      {/* Header */}
      <div
        className={`flex justify-between items-center p-4 ${
          darkMode ? "bg-dark-gray" : "bg-gray-100"
        }`}
      >
        <h2 className="text-xl font-bold">
          {module === "staff" && "Staff Hub"}
          {module === "attendance" && "Attendance Tracker"}
          {module === "leave" && "Leave Planner"}
          {module === "overtime" && "Overtime Monitor"}
          {module === "salary" && "Salary Desk"}
          {module === "reports" && "Employee Report Center"}
          {module === "settings" && "System Settings"}
        </h2>

        <button
          onClick={onClose}
          className={`p-2 rounded-full transition-colors ${
            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
          }`}
        >
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="p-6">{renderModule()}</div>
    </div>
  );
};
