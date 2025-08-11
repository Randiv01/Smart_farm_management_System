import './App.css';
import Home from './Components/Home/Home.js';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Components/AnimalManagement/Dashboard/Dashboard.js';
import { LanguageProvider } from './Components/AnimalManagement/contexts/LanguageContext.js';

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
