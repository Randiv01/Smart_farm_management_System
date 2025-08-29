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
import { ThemeProvider as AnimalThemeProvider } from './Components/AnimalManagement/contexts/ThemeContext.js';
import { UserProvider } from './Components/AnimalManagement/contexts/UserContext.js';

// ----------------- Inventory Management -----------------
import { IThemeProvider } from './Components/InventoryManagement/Icontexts/IThemeContext.jsx';
import ILayout from './Components/InventoryManagement/Ilayout/ILayout.jsx';
import IDashboard from './Components/InventoryManagement/Ipages/IDashboard.jsx';

// ----------------- User / Frontend Pages -----------------
import Register from './Components/UserHome/Registration/Registration.jsx';
import Home from './Components/UserHome/UHHome/UHHome.jsx';
import Login from './Components/UserHome/Login/login.jsx';
import Navbar from './Components/UserHome/UHNavbar/UHNavbar.jsx'; // Make sure to import Navbar

// ✅ User-side Contexts
import { CartProvider } from './Components/UserHome/UHContext/UHCartContext.jsx';
import { AuthProvider } from './Components/UserHome/UHContext/UHAuthContext.jsx';
import { ThemeProvider as UserThemeProvider } from './Components/UserHome/UHContext/UHThemeContext.jsx';

function App() {
  return (
    <div className="App">
      {/* Wrap everything in a single AuthProvider and other providers */}
      <AuthProvider>
        <UserThemeProvider>
          <CartProvider>
            {/* Single Routes component for all routes */}
            <Routes>
              {/* User/Frontend Routes */}
              <Route path="/" element={
                <>
                  <Navbar />
                  <Home />
                </>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Animal Management Routes */}
              <Route path="/AnimalManagement/*" element={
                <LoaderProvider>
                  <LanguageProvider>
                    <AnimalThemeProvider>
                      <UserProvider>
                        <ProtectedRoute allowedRoles={["animal"]}>
                          <Layout />
                        </ProtectedRoute>
                      </UserProvider>
                    </AnimalThemeProvider>
                  </LanguageProvider>
                </LoaderProvider>
              }>
                <Route index element={<Dashboard />} />
                <Route path=":type" element={<AnimalList />} />
                <Route path="productivity/:type" element={<AnimalProductivity />} />
                <Route path="add-animal/:type" element={<AddAnimalForm />} />
                <Route path="design-plan/:type" element={<FarmDesigner />} />
                <Route path="feeding-scheduler" element={<FeedingScheduler />} />
                <Route path="add-animal-type" element={<AddAnimalType />} />
                <Route path="feed-stock" element={<FeedStock />} />
                <Route path="animal-health" element={<AnimalHealth />} />
                <Route path="health-report/:type" element={<HealthReport />} />
                <Route path="zones" element={<AnimalZones />} />
                <Route path="productivity" element={<Productivity />} />
                <Route path="settings" element={<Settings />} />
                <Route path="alerts" element={<Alerts />} />
              </Route>
              
              {/* Inventory Management Routes */}
              <Route path="/InventoryManagement/*" element={
                <IThemeProvider>
                  <ILayout />
                </IThemeProvider>
              }>
                <Route index element={<IDashboard />} />
              </Route>
            </Routes>
          </CartProvider>
        </UserThemeProvider>
      </AuthProvider>
    </div>
  );
}

export default App;