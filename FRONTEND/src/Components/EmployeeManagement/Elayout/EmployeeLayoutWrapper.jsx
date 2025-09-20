import React from "react";
import { EThemeProvider } from '../Econtexts/EThemeContext.jsx';
import ELayout from "./ELayout.jsx";

const EmployeeLayoutWrapper = () => {
  return (
    <EThemeProvider>
      <ELayout />
    </EThemeProvider>
  );
};

export default EmployeeLayoutWrapper;
