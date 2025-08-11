import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from './App.js';
import { LanguageProvider } from './Components/AnimalManagement/contexts/LanguageContext.js';
import { ThemeProvider } from './Components/AnimalManagement/contexts/ThemeContext.js';  // import your ThemeProvider here
import "./index.css";


const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <React.StrictMode>
      <LanguageProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </LanguageProvider>
    </React.StrictMode>
  </BrowserRouter>
);
