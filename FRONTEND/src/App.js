import './App.css';
import Home from './Components/Home/Home.js';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Components/AnimalManagement/Dashboard/Dashboard.js';
import AnimalList from './Components/AnimalManagement/AnimalList/AnimalList.js';
import AddAnimalForm from './Components/AnimalManagement/AddAnimalForm/AddAnimalForm.js';
import FarmDesigner from './Components/AnimalManagement/FarmDesigner/FarmDesigner.js'; // <-- New import
import { LanguageProvider } from './Components/AnimalManagement/contexts/LanguageContext.js';
import FeedingScheduler from './Components/AnimalManagement/FeedingScheduler/FeedingScheduler.js';


function App() {
  return (
    <div className="App">
      <LanguageProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/AnimalManagement" element={<Dashboard />} />
          <Route path="/AnimalManagement/:type" element={<AnimalList />} />
          <Route path="/add-animal/:type" element={<AddAnimalForm />} />
          <Route path="/AnimalManagement/design-plan/:type" element={<FarmDesigner />} /> {/* New route */}
          <Route path="/feeding-scheduler" element={<FeedingScheduler />} />

        </Routes>
      </LanguageProvider>
    </div>
  );
}

export default App;
