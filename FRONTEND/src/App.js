import './App.css';
import Home from './Components/Home/Home.js';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Components/AnimalManagement/Dashboard/Dashboard.jsx';
import AnimalList from './Components/AnimalManagement/AnimalList/AnimalList.jsx';
import AddAnimalForm from './Components/AnimalManagement/AddAnimalForm/AddAnimalForm.jsx';
import FarmDesigner from './Components/AnimalManagement/FarmDesigner/FarmDesigner.jsx'; // <-- New import
import { LanguageProvider } from './Components/AnimalManagement/contexts/LanguageContext.js';
import FeedingScheduler from './Components/AnimalManagement/FeedingScheduler/FeedingScheduler.js';
import AddAnimalType from './Components/AnimalManagement/AddAnimalType/AddAnimalType.jsx';
import FeedStock from './Components/AnimalManagement/FeedStocks/FeedStocks.jsx';
import AnimalHealth from './Components/AnimalManagement/AnimalHealth/AnimalHealth.jsx';
import HealthReport from './Components/AnimalManagement/HealthReport/HealthReport.js';
import { LoaderProvider } from './Components/AnimalManagement/contexts/LoaderContext.js';


function App() {
  return (
    <div className="App">
      <LoaderProvider>
      <LanguageProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/AnimalManagement" element={<Dashboard />} />
          <Route path="/AnimalManagement/:type" element={<AnimalList />} />
          <Route path="/add-animal/:type" element={<AddAnimalForm />} />
          <Route path="/AnimalManagement/design-plan/:type" element={<FarmDesigner />} />
          <Route path="/feeding-scheduler" element={<FeedingScheduler />} />
          <Route path="/AnimalManagement/add-animal-type" element={<AddAnimalType />} />
          <Route path="/feed-stock" element={<FeedStock />} />
          <Route path="/animal-health" element={<AnimalHealth />} />
          <Route path="/HealthReport/:type" element={<HealthReport />} />


        </Routes>
      </LanguageProvider>
      </LoaderProvider>
    </div>
  );
}

export default App;
