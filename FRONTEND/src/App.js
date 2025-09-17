import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';

// ----------------- Animal Management (Randev) -----------------
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

// ----------------- Inventory Management (Kokila)-----------------
import { IThemeProvider } from './Components/InventoryManagement/Icontexts/IThemeContext.jsx';
import ILayout from './Components/InventoryManagement/Ilayout/ILayout.jsx';
import IDashboard from './Components/InventoryManagement/Ipages/IDashboard.jsx';

// ----------------- Registration & Auth -----------------
import Register from './Components/Registration/Registration.jsx';
import Home from './Components/Home/Home.jsx';
import Login from './Components/Login/login.jsx';

// ----------------- HEALTH MANAGEMENT (Gimani part) -----------------
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

function App() {
  return (
    <div className="App">
      {/* Public routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Animal Management */}
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

      {/* Inventory Management */}
      <IThemeProvider>
        <Routes>
          <Route element={<ILayout />}>
            <Route path="/InventoryManagement" element={<IDashboard />} />
          </Route>
        </Routes>
      </IThemeProvider>

      {/* Health Management */}
      <HLanguageProvider>
        <HThemeProvider>
          <Routes>
            {/* Doctor */}
            <Route path="/doctor" element={<DoctorLayout />}>
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

            {/* Plant Pathologist */}
            <Route path="/plant-pathologist" element={<PlantPathologistLayout />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<PlantPathologistHome />} />
              <Route path="fertiliser-stock" element={<FertiliserStock />} />
              <Route path="fertiliser-details" element={<FertiliserDetails />} />
              <Route path="add-fertiliser" element={<H_FertiliserAdd />} />
              <Route path="help" element={<PlantPathologistAdditional />} />
              <Route path="profile" element={<PlantPathologistProfile />} />
              <Route path="*" element={<Navigate to="home" replace />} />
            </Route>

            {/* Admin */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="aaa" replace />} />
              <Route path="aaa" element={<AddminPart />} />
              <Route path="doctor-details" element={<DoctorDetails />} />
              <Route path="specialist-details" element={<SpecialistDetails />} />
              <Route path="medicine-company" element={<MedicineCompany />} />
              <Route path="medistore" element={<MediStore />} />
              <Route path="treatments-details" element={<TreatmentsDetails />} />
              <Route path="treatments-payments" element={<TreatmentsPayments />} />
              <Route path="profile" element={<AdminProfile />} />
              {/* Link H_PlantPathologist inside admin */}
              <Route path="plant-pathologist" element={<H_PlantPathologist />} />
              <Route path="*" element={<Navigate to="aaa" replace />} />
            </Route>
          </Routes>
        </HThemeProvider>
      </HLanguageProvider>
    </div>
  );
}

export default App;
