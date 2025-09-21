import React, { createContext, useState, useContext } from "react";
import Loader from "../Loader/Loader.js";

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  return (
    <LoaderContext.Provider value={{ loading, setLoading }}>
      {loading && <Loader darkMode={false} />} {/* pass darkMode or make optional */}
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);
