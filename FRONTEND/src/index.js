import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.js";
import "./index.css";

// 🐄 AnimalManagement (friend) providers at the root
import { LoaderProvider } from "./Components/AnimalManagement/contexts/LoaderContext.js";
import { LanguageProvider as AnimalLanguageProvider } from "./Components/AnimalManagement/contexts/LanguageContext.js";
import { ThemeProvider as AnimalThemeProvider } from "./Components/AnimalManagement/contexts/ThemeContext.js";
import { UserProvider } from "./Components/AnimalManagement/contexts/UserContext.js";

// (Remove reportWebVitals import & call unless you actually have reportWebVitals.js)

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <React.StrictMode>
      <LoaderProvider>
        <AnimalLanguageProvider>
          <AnimalThemeProvider>
            <UserProvider>
              <App />
            </UserProvider>
          </AnimalThemeProvider>
        </AnimalLanguageProvider>
      </LoaderProvider>
    </React.StrictMode>
  </BrowserRouter>
);
