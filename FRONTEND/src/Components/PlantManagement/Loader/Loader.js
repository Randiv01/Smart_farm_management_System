import React from "react";
import "./Loader.css";

export default function Loader({ darkMode = false }) {
  return (
    <div className={`loader-overlay ${darkMode ? "dark" : ""}`}>
      <div className="loader-scene">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}
