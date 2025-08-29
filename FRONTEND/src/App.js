import './App.css';
import { Routes, Route } from 'react-router-dom';

// ----------------- Animal Management -----------------
import Dashboard from './Components/AnimalManagement/Dashboard/Dashboard.jsx';
import AnimalList from './Components/AnimalManagement/AnimalList/AnimalList.jsx';
import AnimalProductivity from './Components/AnimalManagement/AnimalProductivity/AnimalProductivity.jsx';
import AddAnimalForm from './Components/AnimalManagement/AddAnimalForm/AddAnimalForm.jsx';
import FarmDesigner from './Components/AnimalManagement/FarmDesigner/FarmDesigner.jsx';
import FeedingScheduler from './Components/AnimalManagement/FeedingScheduler/FeedingScheduler.jsx';
import AddAnimalType from './Components/AnimalManagement/AddAnimalType/AddAnimalType.jsx';
import FeedStock from './Components/AnimalManagement/FeedStocks/FeedStocks.jsx';
import AnimalHealth from './Components/AnimalManagement/AnimalHealth/AnimalHealth.jsx';
import HealthReport from './Components/AnimalManagement/HealthReport/HealthReport.jsx';
import Layout from './Components/AnimalManagement/Layout/Layout.jsx';
import AnimalZones from './Components/AnimalManagement/AnimalZones/AnimalZones.jsx';
import Productivity from './Components/AnimalManagement/Productivity/Productivity.jsx';
import Settings from './Components/AnimalManagement/Settings/Settings.jsx';
import Alerts from './Components/AnimalManagement/Alerts/Alerts.jsx';
import ProtectedRoute from "./Components/AnimalManagement/ProtectedRoute/ProtectedRoute.jsx";

// ✅ Contexts (Animal)
import { LanguageProvider } from './Components/AnimalManagement/contexts/LanguageContext.js';
import { LoaderProvider } from './Components/AnimalManagement/contexts/LoaderContext.js';
import { ThemeProvider } from './Components/AnimalManagement/contexts/ThemeContext.js';
import { UserProvider } from './Components/AnimalManagement/contexts/UserContext.js';

// ----------------- Inventory Management -----------------
import { IThemeProvider } from './Components/InventoryManagement/Icontexts/IThemeContext.jsx';
import ILayout from './Components/InventoryManagement/Ilayout/ILayout.jsx';
import IDashboard from './Components/InventoryManagement/Ipages/IDashboard.jsx';

// ----------------- Registration & Auth -----------------
import Register from './Components/Registration/Registration.jsx';
import Home from './Components/Home/Home.jsx';
import Login from './Components/Login/login.jsx';

function App() {
  return (
    <div className="App">
      {/* ---------------- Animal Management Context Wrappers ---------------- */}
      <LoaderProvider>
        <LanguageProvider>
          <ThemeProvider>
            <UserProvider>
              <Routes>
                {/* ✅ Public routes (no sidebar/topbar) */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* ✅ Animal Management Routes (restricted to role=animal) */}
                <Route
                  element={
                    <ProtectedRoute allowedRoles={["animal"]}>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
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

      {/* ---------------- Inventory Management Context Wrapper ---------------- */}
      <IThemeProvider>
        <Routes>
          <Route element={<ILayout />}>
            <Route path="/InventoryManagement" element={<IDashboard />} />
          </Route>
        </Routes>
      </IThemeProvider>
    </div>
  );
}

export default App;
