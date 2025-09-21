import React from "react";
import "./Loader.css";

export default function Loader({ darkMode }) {
  return (
    <div className={`loader-overlay ${darkMode ? "dark" : ""}`}>
      <div className="loader-scene">
        {/* New Loader */}
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}
