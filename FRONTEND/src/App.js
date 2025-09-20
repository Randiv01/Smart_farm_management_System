import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';

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

// Protected Routes
import UserProtectedRoute from "./Components/UserHome/ProtectedRoute.jsx"; // Customer
import AdminProtectedRoute from "./Components/AnimalManagement/ProtectedRoute/ProtectedRoute.jsx"; // Admin/Animal/Inventory/Plant/Health

// Animal Contexts
import { LanguageProvider } from './Components/AnimalManagement/contexts/LanguageContext.js';
import { LoaderProvider } from './Components/AnimalManagement/contexts/LoaderContext.js';
import { ThemeProvider as AnimalThemeProvider } from './Components/AnimalManagement/contexts/ThemeContext.js';
import { UserProvider } from './Components/AnimalManagement/contexts/UserContext.js';

// ----------------- Inventory Management -----------------
import { IThemeProvider } from './Components/InventoryManagement/Icontexts/IThemeContext.jsx';
import ILayout from './Components/InventoryManagement/Ilayout/ILayout.jsx';
import IDashboard from './Components/InventoryManagement/Ipages/IDashboard.jsx';
import Stock from './Components/InventoryManagement/Ipages/Stock.jsx';
import Catalog from "./Components/InventoryManagement/Ipages/Catalog.jsx";
import Payment from "./Components/InventoryManagement/Ipages/Payment.jsx";
import Orders from "./Components/InventoryManagement/Ipages/Orders.jsx";
import Expiry from './Components/InventoryManagement/Ipages/expiry.jsx';
import AnimalFoodStock from './Components/InventoryManagement/Ipages/AnimalFoodstock.jsx';
import FertilizerStock from './Components/InventoryManagement/Ipages/FertilizerStock.jsx';
import ISupplier from './Components/InventoryManagement/Ipages/ISupplier.jsx'; 

// ----------------- User / Frontend Pages -----------------
import Register from './Components/UserHome/Registration/Registration.jsx';
import Home from './Components/UserHome/UHHome/UHHome.jsx';
import Login from './Components/UserHome/Login/login.jsx';
import Navbar from './Components/UserHome/UHNavbar/UHNavbar.jsx';
import News from "./Components/UserHome/News/News.jsx"; 
import CustomerProfile from './Components/UserHome/CustomerProfile/CustomerProfile.jsx';
import MyOrders from './Components/Orders/MyOrders.jsx';

// User Contexts
import { CartProvider } from './Components/UserHome/UHContext/UHCartContext.jsx';
import { AuthProvider } from './Components/UserHome/UHContext/UHAuthContext.jsx';
import { ThemeProvider as UserThemeProvider } from './Components/UserHome/UHContext/UHThemeContext.jsx';

// ----------------- Health Management -----------------
import { LanguageProvider as HLanguageProvider } from './Components/HealthManagement/H_contexts/H_LanguageContext.js';
import { ThemeProvider as HThemeProvider } from './Components/HealthManagement/H_contexts/H_ThemeContext.js';

// Layouts (Health)
import AdminLayout from './Components/HealthManagement/H_layouts/H_AdminLayout.js';
import DoctorLayout from './Components/HealthManagement/H_layouts/H_DoctorLayout.js';
import PlantPathologistLayout from './Components/HealthManagement/H_layouts/H_PlantPathologistLayout.js';

// ADMIN COMPONENTS (Health)
import AddminPart from './Components/HealthManagement/AdminPart/HealthAddminPart.js';
import DoctorDetails from './Components/HealthManagement/AdminPart/DoctorDetails/DoctorDetails.js';
import SpecialistDetails from './Components/HealthManagement/AdminPart/H_SpecialistDetails/H_SpecialistDetails.js';
import MedicineCompany from './Components/HealthManagement/AdminPart/H_MedicineCompany/H_MedicineCompany.js';
import MediStore from './Components/HealthManagement/AdminPart/H_MediStore/H_MediStore.js';
import TreatmentsDetails from './Components/HealthManagement/AdminPart/TreatmentsDetails/TreatmentsDetails.js';
import TreatmentsPayments from './Components/HealthManagement/AdminPart/TreatmentsPayments/TreatmentsPayments.js';
import AdminProfile from './Components/HealthManagement/AdminPart/AdminProfile/AdminProfile.js';
import H_PlantPathologist from './Components/HealthManagement/AdminPart/H_PlantPathologist/H_PlantPathologist.js';

// DOCTOR COMPONENTS (Health)
import DoctorDashboard from './Components/HealthManagement/DoctorPart/DoctorDashBoard.js';
import HealthAnimal from './Components/HealthManagement/DoctorPart/HealthAnimal.js';
import DoctorTreatment from './Components/HealthManagement/DoctorPart/DoctorTreatment.js';
import DoctorAdditional from './Components/HealthManagement/DoctorPart/DoctorAdditional.js';

// PLANT PATHOLOGIST COMPONENTS (Health)
import PlantPathologistHome from "./Components/HealthManagement/PlantPathologistPart/PlantPathologistHome.js";
import FertiliserStock from './Components/HealthManagement/PlantPathologistPart/H_FertiliserStock.js';
import FertiliserDetails from './Components/HealthManagement/PlantPathologistPart/H_FertiliserDetails.js';
import H_FertiliserAdd from './Components/HealthManagement/PlantPathologistPart/H_FertiliserAdd.js';
import PlantPathologistAdditional from './Components/HealthManagement/PlantPathologistPart/PathologisticAdditional.js';
import PlantPathologistProfile from './Components/HealthManagement/PlantPathologistPart/PathologisticProfile.js';

// ----------------- Plant Management -----------------
import PLayout from './Components/PlantManagement/P-Layout.jsx';
import PDashboard from './Components/PlantManagement/pages/P-Dashboard.jsx';
import PGreenhouseManagement from './Components/PlantManagement/pages/P-GreenhouseManagement.jsx';
import PInspectionManagement from './Components/PlantManagement/pages/P-InspectionManagement.jsx';
import PFertilizingManagement from './Components/PlantManagement/pages/P-FertilizingManagement.jsx';
import PPestDiseaseManagement from './Components/PlantManagement/pages/P-PestDiseaseManagement.jsx';
import PMonitorControl from './Components/PlantManagement/pages/P-MonitorControl.jsx';
import PProductivity from './Components/PlantManagement/pages/P-Productivity.jsx';
import PSettings from './Components/PlantManagement/pages/P-Settings.jsx';
import { ThemeProvider as PThemeProvider } from './Components/PlantManagement/context/ThemeContext.jsx';
import { LanguageProvider as PLanguageProvider } from './Components/PlantManagement/context/LanguageContext.jsx';

function App() {
  return (
    <div className="App">
      {/* Main App wrapped in User Contexts */}
      <AuthProvider>
        <UserThemeProvider>
          <CartProvider>
            <Routes>
              {/* ----------------- Public Routes ----------------- */}
              <Route path="/" element={<><Navbar /><Home /></>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/news" element={<><News /></>} />

              {/* ----------------- Customer Routes ----------------- */}
              <Route path="/profile" element={
                <UserProtectedRoute>
                  <><Navbar /><CustomerProfile /></>
                </UserProtectedRoute>
              } />
              
              <Route path="/orders" element={
                <UserProtectedRoute>
                  <><Navbar /><MyOrders /></>
                </UserProtectedRoute>
              } />

              {/* Legacy customer routes - redirect to new paths */}
              <Route path="/customer/profile" element={<Navigate to="/profile" replace />} />
              <Route path="/customer/orders" element={<Navigate to="/orders" replace />} />

              {/* ----------------- Animal Management / Admin Routes ----------------- */}
              <Route path="/AnimalManagement/*" element={
                <AdminProtectedRoute allowedRoles={["animal"]}>
                  <LoaderProvider>
                    <LanguageProvider>
                      <AnimalThemeProvider>
                        <UserProvider>
                          <Layout />
                        </UserProvider>
                      </AnimalThemeProvider>
                    </LanguageProvider>
                  </LoaderProvider>
                </AdminProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="feeding-scheduler" element={<FeedingScheduler />} />
                <Route path="add-animal-type" element={<AddAnimalType />} />
                <Route path="feed-stock" element={<FeedStock />} />
                <Route path="animal-health" element={<AnimalHealth />} />
                <Route path="HealthReport/:type" element={<HealthReport />} />
                <Route path="add-animal/:type" element={<AddAnimalForm />} />
                <Route path="AnimalProductivity/:type" element={<AnimalProductivity />} />
                <Route path="design-plan/:type" element={<FarmDesigner />} />
                <Route path="zones" element={<AnimalZones />} />
                <Route path="productivity" element={<Productivity />} />
                <Route path="settings" element={<Settings />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path=":type" element={<AnimalList />} />
              </Route>

              {/* ----------------- Inventory Management Routes ----------------- */}
              <Route path="/InventoryManagement/*" element={
                <AdminProtectedRoute allowedRoles={["inv"]}>
                  <IThemeProvider>
                    <ILayout />
                  </IThemeProvider>
                </AdminProtectedRoute>
              }>
                <Route index element={<IDashboard />} />
                <Route path="stock" element={<Stock />} />
                <Route path="orders" element={<Orders />} />
                <Route path="expiry" element={<Expiry />} /> 
                <Route path="animalfood" element={<AnimalFoodStock />} /> 
                <Route path="FertilizerStock" element={<FertilizerStock />} /> 
                <Route path="isuppliers" element={<ISupplier />} />
              </Route>

              {/* Catalog and Payment routes - accessible to customers */}
              <Route path="/InventoryManagement/catalog" element={
                <IThemeProvider>
                  <><Catalog /></>
                </IThemeProvider>
              } />
              
              <Route path="/InventoryManagement/payment" element={
                <UserProtectedRoute>
                  <IThemeProvider>
                    <><Payment /></>
                  </IThemeProvider>
                </UserProtectedRoute>
              } />

              {/* ----------------- Plant Management Routes ----------------- */}
              <Route path="/PlantManagement/*" element={
                <AdminProtectedRoute allowedRoles={["plant"]}>
                  <PThemeProvider>
                    <PLanguageProvider>
                      <PLayout />
                    </PLanguageProvider>
                  </PThemeProvider>
                </AdminProtectedRoute>
              }>
                <Route index element={<PDashboard />} />
                <Route path="greenhouse" element={<PGreenhouseManagement />} />
                <Route path="inspection" element={<PInspectionManagement />} />
                <Route path="fertilizing" element={<PFertilizingManagement />} />
                <Route path="pest-disease" element={<PPestDiseaseManagement />} />
                <Route path="monitor-control" element={<PMonitorControl />} />
                <Route path="productivity" element={<PProductivity />} />
                <Route path="settings" element={<PSettings />} />
              </Route>

              {/* ----------------- Health Management Routes ----------------- */}
              {/* Doctor Routes */}
              <Route path="/doctor/*" element={
                <AdminProtectedRoute allowedRoles={["health"]}>
                  <HLanguageProvider>
                    <HThemeProvider>
                      <DoctorLayout />
                    </HThemeProvider>
                  </HLanguageProvider>
                </AdminProtectedRoute>
              }>
                <Route index element={<Navigate to="home" replace />} />
                <Route path="home" element={<DoctorDashboard />} />
                <Route path="animals" element={<HealthAnimal />} />
                <Route path="medicine-stock" element={<MediStore />} />
                <Route path="pharmacy" element={<MedicineCompany />} />
                <Route path="vet-specialist" element={<SpecialistDetails />} />
                <Route path="treatment-details" element={<DoctorTreatment />} />
                <Route path="help" element={<DoctorAdditional />} />
                <Route path="*" element={<Navigate to="home" replace />} />
              </Route>

              {/* Plant Pathologist Routes */}
              <Route path="/plant-pathologist/*" element={
                <AdminProtectedRoute allowedRoles={["health"]}>
                  <HLanguageProvider>
                    <HThemeProvider>
                      <PlantPathologistLayout />
                    </HThemeProvider>
                  </HLanguageProvider>
                </AdminProtectedRoute>
              }>
                <Route index element={<Navigate to="home" replace />} />
                <Route path="home" element={<PlantPathologistHome />} />
                <Route path="fertiliser-stock" element={<FertiliserStock />} />
                <Route path="fertiliser-details" element={<FertiliserDetails />} />
                <Route path="add-fertiliser" element={<H_FertiliserAdd />} />
                <Route path="help" element={<PlantPathologistAdditional />} />
                <Route path="profile" element={<PlantPathologistProfile />} />
                <Route path="*" element={<Navigate to="home" replace />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin/*" element={
                <AdminProtectedRoute allowedRoles={["health"]}>
                  <HLanguageProvider>
                    <HThemeProvider>
                      <AdminLayout />
                    </HThemeProvider>
                  </HLanguageProvider>
                </AdminProtectedRoute>
              }>
                <Route index element={<Navigate to="aaa" replace />} />
                <Route path="aaa" element={<AddminPart />} />
                <Route path="doctor-details" element={<DoctorDetails />} />
                <Route path="specialist-details" element={<SpecialistDetails />} />
                <Route path="medicine-company" element={<MedicineCompany />} />
                <Route path="medistore" element={<MediStore />} />
                <Route path="treatments-details" element={<TreatmentsDetails />} />
                <Route path="treatments-payments" element={<TreatmentsPayments />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="plant-pathologist" element={<H_PlantPathologist />} />
                <Route path="*" element={<Navigate to="aaa" replace />} />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </UserThemeProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
