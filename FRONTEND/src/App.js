import './App.css';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Components/AnimalManagement/Dashboard/Dashboard.jsx';
import AnimalList from './Components/AnimalManagement/AnimalList/AnimalList.jsx';
import AnimalProductivity from './Components/AnimalManagement/AnimalProductivity/AnimalProductivity.jsx';
import AddAnimalForm from './Components/AnimalManagement/AddAnimalForm/AddAnimalForm.jsx';
import FarmDesigner from './Components/AnimalManagement/FarmDesigner/FarmDesigner.jsx';
import { LanguageProvider } from './Components/AnimalManagement/contexts/LanguageContext.js';
import FeedingScheduler from './Components/AnimalManagement/FeedingScheduler/FeedingScheduler.jsx';
import AddAnimalType from './Components/AnimalManagement/AddAnimalType/AddAnimalType.jsx';
import FeedStock from './Components/AnimalManagement/FeedStocks/FeedStocks.jsx';
import AnimalHealth from './Components/AnimalManagement/AnimalHealth/AnimalHealth.jsx';
import HealthReport from './Components/AnimalManagement/HealthReport/HealthReport.jsx';
import { LoaderProvider } from './Components/AnimalManagement/contexts/LoaderContext.js';
import Layout from './Components/AnimalManagement/Layout/Layout.jsx';
import { ThemeProvider } from './Components/AnimalManagement/contexts/ThemeContext.js';
import AnimalZones from './Components/AnimalManagement/AnimalZones/AnimalZones.jsx';
import Productivity from './Components/AnimalManagement/Productivity/Productivity.jsx';
import Settings from './Components/AnimalManagement/Settings/Settings.jsx';
import Alerts from './Components/AnimalManagement/Alerts/Alerts.jsx';
import { UserProvider } from './Components/AnimalManagement/contexts/UserContext.js';

//login or register
import Register from './Components/Registration/Registration.jsx';

// ✅ Import Home and Login
import Home from './Components/Home/Home.jsx';
import Login from './Components/Login/login.jsx';

function App() {
  return (
    <div className="App">
   
      <LoaderProvider>
        <LanguageProvider>
          <ThemeProvider>
             <UserProvider>
            <Routes>
              {/* ✅ Public routes (no sidebar/topbar) */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
               <Route path="/Register" element={<Register />} />

              {/* ✅ Protected routes with Layout */}
              <Route element={<Layout />}>
                <Route path="/AnimalManagement" element={<Dashboard />} />
                <Route path="/AnimalManagement/:type" element={<AnimalList />} />
                <Route path="/AnimalProductivity/:type" element={<AnimalProductivity />} />
                <Route path="/add-animal/:type" element={<AddAnimalForm />} />
                <Route path="/AnimalManagement/design-plan/:type" element={<FarmDesigner />} />
                <Route path="/feeding-scheduler" element={<FeedingScheduler />} />
                <Route path="/AnimalManagement/add-animal-type" element={<AddAnimalType />} />
                <Route path="/feed-stock" element={<FeedStock />} />
                <Route path="/animal-health" element={<AnimalHealth />} />
                <Route path="/HealthReport/:type" element={<HealthReport />} />
                <Route path="/zones" element={<AnimalZones />} />
                <Route path="/Productivity" element={<Productivity />} />
                <Route path="/settings" element={<Settings />} />                
                <Route path="/alerts" element={<Alerts />} />   
              </Route>
            </Routes>
            </UserProvider>
          </ThemeProvider>
        </LanguageProvider>
      </LoaderProvider>
      
    </div>
  );
}

export default App;
