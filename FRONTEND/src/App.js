import './App.css';
import Home from './Components/Home/Home.js';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Components/AnimalManagement/Dashboard/Dashboard.js';
import AnimalList from './Components/AnimalManagement/AnimalList/AnimalList.js'; // ✅ new import
import { LanguageProvider } from './Components/AnimalManagement/contexts/LanguageContext.js';
import AddAnimalForm from './Components/AnimalManagement/AddAnimalForm/AddAnimalForm.js';

function App() {
  return (
    <div className="App">
      <LanguageProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/AnimalManagement" element={<Dashboard />} />
          <Route path="/AnimalManagement/:type" element={<AnimalList />} /> {/* ✅ dynamic route */}
          <Route path="/add-animal/:type" element={<AddAnimalForm />} />
        </Routes>
      </LanguageProvider>
    </div>
  );
}

export default App;
