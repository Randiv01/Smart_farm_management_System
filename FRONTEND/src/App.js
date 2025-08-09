import './App.css';
import Home from "./Components/Home/Home";
import { Routes, Route } from 'react-router-dom';
import Dashboard from "./Components/AnimalManagement/Dashboard/Dashboard";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
         <Route path="/AnimalManagement" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

export default App;
