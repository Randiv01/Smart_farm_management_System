import React from "react";
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";

// ----------------- Scroll -----------------
import ScrollToTop from "./Components/UserHome/ScrollToTop/ScrollToTop.jsx";

// ----------------- Context Providers -----------------
import { AuthProvider } from "./Components/UserHome/UHContext/UHAuthContext.jsx";
import { CartProvider } from "./Components/UserHome/UHContext/UHCartContext.jsx";
import { ThemeProvider as UserThemeProvider } from "./Components/UserHome/UHContext/UHThemeContext.jsx";
import { LanguageProvider } from "./Components/AnimalManagement/contexts/LanguageContext.js";
import { LoaderProvider } from "./Components/AnimalManagement/contexts/LoaderContext.js";
import { ThemeProvider as AnimalThemeProvider } from "./Components/AnimalManagement/contexts/ThemeContext.js";
import { UserProvider } from "./Components/AnimalManagement/contexts/UserContext.js";
import { IThemeProvider } from "./Components/InventoryManagement/Icontexts/IThemeContext.jsx";
import { ThemeProvider as PThemeProvider } from "./Components/PlantManagement/context/ThemeContext.jsx";
import { LanguageProvider as PLanguageProvider } from "./Components/PlantManagement/context/LanguageContext.jsx";
import { LanguageProvider as HLanguageProvider } from "./Components/HealthManagement/H_contexts/H_LanguageContext.js";
import { ThemeProvider as HThemeProvider } from "./Components/HealthManagement/H_contexts/H_ThemeContext.js";
import { ThemeProvider as HealthThemeProvider } from "./Components/HealthManagement/ThemeProvider/ThemeProvider.js";

// ----------------- User Components -----------------
import CartSidebar from "./Components/UserHome/UHCartSidebar/CartSidebar.jsx";
import Navbar from "./Components/UserHome/UHNavbar/UHNavbar.jsx";
import Home from "./Components/UserHome/UHHome/UHHome.jsx";
import Login from "./Components/UserHome/Login/login.jsx";
import Register from "./Components/UserHome/Registration/Registration.jsx";
import News from "./Components/UserHome/News/News.jsx";
import Catalog from "./Components/UserHome/UHCatalog/Catalog.jsx";
import Payment from "./Components/UserHome/UHPayment/Payment.jsx";
import PrivacyPolicy from "./Components/UserHome/UHFooter/PrivacyPolicy.jsx";
import TermsofService from "./Components/UserHome/UHFooter/TermsofService.jsx";
import ShippingPolicy from "./Components/UserHome/UHFooter/ShippingPolicy.jsx";
import RefundPolicy from "./Components/UserHome/UHFooter/RefundPolicy.jsx";
import AboutUs from "./Components/UserHome/AboutUs/AboutUs.jsx";
import ContactUs from "./Components/UserHome/ContactUs/ContactUs.jsx";
import CustomerProfile from "./Components/UserHome/CustomerProfile/CustomerProfile.jsx";
import MyOrders from "./Components/Orders/MyOrders.jsx";

// ----------------- Protected Routes -----------------
import UserProtectedRoute from "./Components/UserHome/ProtectedRoute.jsx";
import AdminProtectedRoute from "./Components/AnimalManagement/ProtectedRoute/ProtectedRoute.jsx";

// ----------------- Animal Management -----------------
import Layout from "./Components/AnimalManagement/Layout/Layout.jsx";
import Dashboard from "./Components/AnimalManagement/Dashboard/Dashboard.jsx";
import AnimalList from "./Components/AnimalManagement/AnimalList/AnimalList.jsx";
import AnimalProductivity from "./Components/AnimalManagement/AnimalProductivity/AnimalProductivity.jsx";
import AddAnimalForm from "./Components/AnimalManagement/AddAnimalForm/AddAnimalForm.jsx";
import FarmDesigner from "./Components/AnimalManagement/FarmDesigner/FarmDesigner.jsx";
import FeedingScheduler from "./Components/AnimalManagement/FeedingScheduler/FeedingScheduler.jsx";
import AddAnimalType from "./Components/AnimalManagement/AddAnimalType/AddAnimalType.jsx";
import FeedStock from "./Components/AnimalManagement/FeedStocks/FeedStocks.jsx";
import AnimalHealth from "./Components/AnimalManagement/AnimalHealth/AnimalHealth.jsx";
import HealthReport from "./Components/AnimalManagement/HealthReport/HealthReport.jsx";
import AnimalZones from "./Components/AnimalManagement/AnimalZones/AnimalZones.jsx";
import Productivity from "./Components/AnimalManagement/Productivity/Productivity.jsx";
import Settings from "./Components/AnimalManagement/Settings/Settings.jsx";
import Alerts from "./Components/AnimalManagement/Alerts/Alerts.jsx";

// ----------------- Inventory Management -----------------
import ILayout from "./Components/InventoryManagement/Ilayout/ILayout.jsx";
import IDashboard from "./Components/InventoryManagement/Ipages/IDashboard.jsx";
import Stock from "./Components/InventoryManagement/Ipages/Stock.jsx";
import Orders from "./Components/InventoryManagement/Ipages/Orders.jsx";
import Expiry from "./Components/InventoryManagement/Ipages/expiry.jsx";
import AnimalFoodStock from "./Components/InventoryManagement/Ipages/AnimalFoodstock.jsx";
import FertilizerStock from "./Components/InventoryManagement/Ipages/FertilizerStock.jsx";
import ISupplier from "./Components/InventoryManagement/Ipages/ISupplier.jsx";
import ISettings from "./Components/InventoryManagement/Ipages/ISettings.jsx";


// ----------------- Employee Management -----------------
import EmployeeLayoutWrapper from "./Components/EmployeeManagement/Elayout/EmployeeLayoutWrapper.jsx";
import { Dashboard as EDashboard } from "./Components/EmployeeManagement/pages/E-Dashboard.js";
import { StaffHub as EStaffHub } from "./Components/EmployeeManagement/pages/E-StaffHub.js";
import { AttendanceTracker as EAttendanceTracker } from "./Components/EmployeeManagement/pages/E-AttendanceTracker.jsx";
import { ELeavePlanner } from "./Components/EmployeeManagement/pages/E-LeavePlanner.jsx";
import { OvertimeMonitor as EOvertimeMonitor } from "./Components/EmployeeManagement/pages/E-OvertimeMonitor.js";
import { SalaryDesk as ESalaryDesk } from "./Components/EmployeeManagement/pages/E-SalaryDesk.js";
import { EEmployeeReportCenter } from "./Components/EmployeeManagement/pages/E-EmployeeReportCenter.js";
import { SystemSettings as ESystemSettings } from "./Components/EmployeeManagement/pages/E-SystemSettings.js";

// ----------------- Plant Management -----------------
import PLayout from "./Components/PlantManagement/P-Layout.jsx";
import PDashboard from "./Components/PlantManagement/pages/P-Dashboard.jsx";
import PGreenhouseManagement from "./Components/PlantManagement/pages/P-GreenhouseManagement.jsx";
import PInspectionManagement from "./Components/PlantManagement/pages/P-InspectionManagement.jsx";
import PFertilizingManagement from "./Components/PlantManagement/pages/P-FertilizingManagement.jsx";
import PPestDiseaseManagement from "./Components/PlantManagement/pages/P-PestDiseaseManagement.jsx";
import PMonitorControl from "./Components/PlantManagement/pages/P-MonitorControl.jsx";
import PProductivity from "./Components/PlantManagement/pages/P-Productivity.jsx";
import PSettings from "./Components/PlantManagement/pages/P-Settings.jsx";

// ----------------- Health Management -----------------
// Layouts
import AdminLayout from "./Components/HealthManagement/H_layouts/H_AdminLayout.js";
import DoctorLayout from "./Components/HealthManagement/H_layouts/H_DoctorLayout.js";
import PlantPathologistLayout from "./Components/HealthManagement/H_layouts/H_PlantPathologistLayout.js";

// Admin Components
import AddminPart from "./Components/HealthManagement/AdminPart/HealthAddminPart.js";
import DoctorDetails from "./Components/HealthManagement/AdminPart/DoctorDetails/DoctorDetails.js";
import SpecialistDetails from "./Components/HealthManagement/AdminPart/H_SpecialistDetails/H_SpecialistDetails.js";
import MedicineCompany from "./Components/HealthManagement/AdminPart/H_MedicineCompany/H_MedicineCompany.js";
import MediStore from "./Components/HealthManagement/AdminPart/H_MediStore/H_MediStore.js";
import TreatmentsDetails from "./Components/HealthManagement/AdminPart/TreatmentsDetails/TreatmentsDetails.js";
import TreatmentsPayments from "./Components/HealthManagement/AdminPart/TreatmentsPayments/TreatmentsPayments.js";
import AdminProfile from "./Components/HealthManagement/AdminPart/AdminProfile/AdminProfile.js";
import H_PlantPathologist from "./Components/HealthManagement/AdminPart/H_PlantPathologist/H_PlantPathologist.js";

// Doctor Components
import DoctorDashboard from "./Components/HealthManagement/DoctorPart/DoctorDashBoard.js";
import HealthAnimal from "./Components/HealthManagement/DoctorPart/HealthAnimal.js";
import DoctorTreatment from "./Components/HealthManagement/DoctorPart/DoctorTreatment.js";
import DoctorAdditional from "./Components/HealthManagement/DoctorPart/DoctorAdditional.js";

// Plant Pathologist Components
import PlantPathologistHome from "./Components/HealthManagement/PlantPathologistPart/PlantPathologistHome.js";
import FertiliserStock from "./Components/HealthManagement/PlantPathologistPart/H_FertiliserStock.js";
import FertiliserDetails from "./Components/HealthManagement/PlantPathologistPart/H_FertiliserDetails.js";
import H_FertiliserAdd from "./Components/HealthManagement/PlantPathologistPart/H_FertiliserAdd.js";
import PlantPathologistAdditional from "./Components/HealthManagement/PlantPathologistPart/PathologisticAdditional.js";
import PlantPathologistProfile from "./Components/HealthManagement/PlantPathologistPart/PathologisticProfile.js";

// ----------------- App -----------------
function App() {
  return (
    <div className="App">
      <ScrollToTop />

      <AuthProvider>
        <UserThemeProvider>
          <CartProvider>
            <CartSidebar />

            <HLanguageProvider>
              <HThemeProvider>
                <HealthThemeProvider>
                  <LanguageProvider>
                    <AnimalThemeProvider>
                      <LoaderProvider>
                        <UserProvider>
                          <Routes>
                            {/* ----------------- Public Routes ----------------- */}
                            <Route path="/" element={<><Navbar /><Home /></>} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/news" element={<News />} />
                            <Route path="/catalog" element={<Catalog />} />
                            <Route path="/payment" element={<Payment />} />
                            <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
                            <Route path="/termsofservice" element={<TermsofService />} />
                            <Route path="/shippingPolicy" element={<ShippingPolicy />} />
                            <Route path="/refundPolicy" element={<RefundPolicy />} />
                            <Route path="/about" element={<AboutUs />} />
                            <Route path="/contact" element={<ContactUs />} />

                            {/* ----------------- Customer Protected ----------------- */}
                            <Route path="/profile" element={<UserProtectedRoute><><Navbar /><CustomerProfile /></></UserProtectedRoute>} />
                            <Route path="/orders" element={<UserProtectedRoute><><Navbar /><MyOrders /></></UserProtectedRoute>} />

                            {/* ----------------- Animal Management ----------------- */}
                            <Route path="/AnimalManagement/*" element={
                              <AdminProtectedRoute allowedRoles={["animal"]}><Layout /></AdminProtectedRoute>
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

                            {/* ----------------- Inventory Management ----------------- */}
                            <Route path="/InventoryManagement/*" element={
                              <AdminProtectedRoute allowedRoles={["inv"]}>
                                <IThemeProvider><ILayout /></IThemeProvider>
                              </AdminProtectedRoute>
                            }>
                              <Route index element={<IDashboard />} />
                              <Route path="stock" element={<Stock />} />
                              <Route path="orders" element={<Orders />} />
                              <Route path="expiry" element={<Expiry />} />
                              <Route path="animalfood" element={<AnimalFoodStock />} />
                              <Route path="FertilizerStock" element={<FertilizerStock />} />
                              <Route path="isuppliers" element={<ISupplier />} />
                              <Route path="isettings" element={<ISettings />} />
                            </Route>

                            {/* ----------------- Employee Management ----------------- */}
                            <Route path="/EmployeeManagement/*" element={<EmployeeLayoutWrapper />}>
                              <Route index element={<EDashboard />} />
                              <Route path="staff" element={<EStaffHub />} />
                              <Route path="attendance" element={<EAttendanceTracker />} />
                              <Route path="leave" element={<ELeavePlanner />} />
                              <Route path="overtime" element={<EOvertimeMonitor />} />
                              <Route path="salary" element={<ESalaryDesk />} />
                              <Route path="reports" element={<EEmployeeReportCenter />} />
                              <Route path="settings" element={<ESystemSettings />} />
                            </Route>

                            {/* ----------------- Plant Management ----------------- */}
                            <Route path="/PlantManagement/*" element={
                              <AdminProtectedRoute allowedRoles={["plant"]}>
                                <PThemeProvider><PLanguageProvider><PLayout /></PLanguageProvider></PThemeProvider>
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

                            {/* ----------------- Health Management ----------------- */}
                            {/* Admin */}
                            <Route path="/admin/*" element={
                              <AdminProtectedRoute allowedRoles={["health"]}>
                                <HLanguageProvider><HThemeProvider><HealthThemeProvider><AdminLayout /></HealthThemeProvider></HThemeProvider></HLanguageProvider>
                              </AdminProtectedRoute>
                            }>
                              <Route index element={<Navigate to="dashboard" replace />} />
                              <Route path="dashboard" element={<AddminPart />} />
                              <Route path="doctor-details" element={<DoctorDetails />} />
                              <Route path="specialist-details" element={<SpecialistDetails />} />
                              <Route path="medicine-company" element={<MedicineCompany />} />
                              <Route path="medistore" element={<MediStore />} />
                              <Route path="treatments-details" element={<TreatmentsDetails />} />
                              <Route path="treatments-payments" element={<TreatmentsPayments />} />
                              <Route path="profile" element={<AdminProfile />} />
                              <Route path="plant-pathologist" element={<H_PlantPathologist />} />
                            </Route>

                            {/* Doctor */}
                            <Route path="/doctor/*" element={
                              <AdminProtectedRoute allowedRoles={["health"]}>
                                <HLanguageProvider><HThemeProvider><HealthThemeProvider><DoctorLayout /></HealthThemeProvider></HThemeProvider></HLanguageProvider>
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
                            </Route>

                            {/* Plant Pathologist */}
                            <Route path="/plant-pathologist/*" element={
                              <AdminProtectedRoute allowedRoles={["health"]}>
                                <HLanguageProvider><HThemeProvider><HealthThemeProvider><PlantPathologistLayout /></HealthThemeProvider></HThemeProvider></HLanguageProvider>
                              </AdminProtectedRoute>
                            }>
                              <Route index element={<Navigate to="home" replace />} />
                              <Route path="home" element={<PlantPathologistHome />} />
                              <Route path="fertiliser-stock" element={<FertiliserStock />} />
                              <Route path="fertiliser-details" element={<FertiliserDetails />} />
                              <Route path="add-fertiliser" element={<H_FertiliserAdd />} />
                              <Route path="help" element={<PlantPathologistAdditional />} />
                              <Route path="profile" element={<PlantPathologistProfile />} />
                            </Route>

                            {/* ----------------- Catch All ----------------- */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </UserProvider>
                      </LoaderProvider>
                    </AnimalThemeProvider>
                  </LanguageProvider>
                </HealthThemeProvider>
              </HThemeProvider>
            </HLanguageProvider>
          </CartProvider>
        </UserThemeProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
