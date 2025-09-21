// ----------------------- Environment Setup -----------------------
import dotenv from "dotenv";
dotenv.config(); // ✅ Must be first

// ----------------------- Imports -----------------------
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ----------------------- Fix __dirname for ES modules -----------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------- Initialize Express -----------------------
const app = express();

// ----------------------- Middleware -----------------------
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------- Uploads Setup -----------------------
const uploadsDir = path.join(__dirname, "uploads");
const healthUploadsDir = path.join(__dirname, "HealthManagement", "Health_uploads");
const plantUploadsDir = path.join(__dirname, "PlantManagement", "Uploads");

// Ensure directories exist
[uploadsDir, healthUploadsDir, plantUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("📁 Created directory:", dir);
  }
});

// Serve static folders
app.use("/uploads", express.static(uploadsDir));
// Serve with both capitalizations to match any frontend usage
app.use("/Health_uploads", express.static(healthUploadsDir));
app.use("/Health_Uploads", express.static(healthUploadsDir));
app.use("/plant-uploads", express.static(plantUploadsDir));

// ----------------------- Import Routes -----------------------
// Animal Management
import { animalRouter } from "./AnimalManagement/routes/animalRoutes.js";
import { animalTypeRouter } from "./AnimalManagement/routes/animalTypeRoutes.js";
import feedStockRouter from "./AnimalManagement/routes/feedStockRoutes.js";
import chatbotRoutes from "./AnimalManagement/routes/chatbotRoutes.js";
import zonesRouter from "./AnimalManagement/routes/zoneRoutes.js";
import emergencyRoutes from "./AnimalManagement/routes/emergencyRoutes.js";
import { doctorRouter as animalDoctorRouter } from "./AnimalManagement/routes/doctorRoutes.js"; // ⚠️ Renamed to avoid conflict
import {
  sendMedicalRequest,
  testEmail,
} from "./AnimalManagement/controllers/medicalRequestController.js";
import productivityRouter from "./AnimalManagement/routes/productivityRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Health Management
import doctorRoutes from "./HealthManagement/Routes/DoctorDetailsRoute.js";
import specialistRoutes from "./HealthManagement/Routes/HealthSpecialistRoute.js";
import medicineCompanyRoutes from "./HealthManagement/Routes/H_MedicineCompanyRoute.js";
import mediStoreRoutes from "./HealthManagement/Routes/H_mediStoreRoute.js";
import plantPathologistRoutes from "./HealthManagement/Routes/H_PlantPathologistRoute.js";
import fertiliserRoutes from "./HealthManagement/Routes/H_FertiliserRoute.js";
import fertiliserCompanyRoutes from "./HealthManagement/Routes/fertiliserCompanyRoutes.js";

// Contact us
import contact from "./ContactUs/routes/contactRoutes.js";

// Plant Management
import inspectionRoutes from "./PlantManagement/Routes/inspectionRoutes.js";
import plantRoutes from "./PlantManagement/Routes/plantRoutes.js";
import fertilizingRoutes from "./PlantManagement/Routes/fertilizingRoutes.js";
import plantProductivityRoutes from "./PlantManagement/Routes/productivityRoutes.js";

// Inventory Management
import productRoutes from "./InventoryManagement/Iroutes/productRoutes.js";
import orderRoutes from "./InventoryManagement/Iroutes/orderRoutes.js";
import animalFoodRoutes from "./InventoryManagement/Iroutes/animalfoodRoutes.js";
import IfertilizerstockRoutes from "./InventoryManagement/Iroutes/IfertilizerstockRoutes.js";
import supplierRoutes from "./InventoryManagement/Iroutes/IsupplierRoutes.js";

// Employee Management
import employeeRoutes from "./EmployeeManager/E-route/employeeRoutes.js";
import attendanceRoutes from "./EmployeeManager/E-route/attendanceRoutes.js";
import leaveRoutes from "./EmployeeManager/E-route/leaveRoutes.js";
import overtimeRoutes from "./EmployeeManager/E-route/overtimeRoutes.js";

// ----------------------- Debug env variables (optional) -----------------------
console.log("OPENAI_API_KEY loaded:", process.env.OPENAI_API_KEY ? "YES" : "NO");
console.log("EMAIL_USER loaded:", process.env.EMAIL_USER ? "YES" : "NO");

// ----------------------- Routes Setup -----------------------
// Chatbot
app.use("/api/chatbot", chatbotRoutes);

// Animal Management
app.use("/animals", animalRouter);
app.use("/animal-types", animalTypeRouter);
app.use("/feed-stocks", feedStockRouter);
app.use("/zones", zonesRouter);
app.use("/emergency", emergencyRoutes);
app.use("/api/users", userRoutes);
// IMPORTANT: Avoid conflict with /api/doctors from HealthManagement
app.use("/api/animal-doctors", animalDoctorRouter); // ✅ moved from /api/doctors
app.use("/productivity", productivityRouter);
app.post("/api/medical-request", sendMedicalRequest);
app.post("/api/test-email", testEmail);

// Health Management
app.use("/api/doctors", doctorRoutes); // ✅ Only HealthManagement doctors here
app.use("/api/specialists", specialistRoutes);
app.use("/api/medicine-companies", medicineCompanyRoutes);
app.use("/api/medistore", mediStoreRoutes);
app.use("/api/plant-pathologists", plantPathologistRoutes);
app.use("/api/fertilisers", fertiliserRoutes);
app.use("/api/fertiliser-companies", fertiliserCompanyRoutes);

// Contact us
app.use("/api/contact", contact);

// Plant Management
app.use("/api/inspections", inspectionRoutes);
app.use("/api/plants", plantRoutes);
app.use("/api/fertilizing", fertilizingRoutes);
app.use("/api/productivity", plantProductivityRoutes);

// Inventory Management
app.use("/api/inventory/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/animalfood", animalFoodRoutes);
app.use("/api/Ifertilizerstock", IfertilizerstockRoutes);
app.use("/api/suppliers", supplierRoutes);

// Employee Management
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/overtime", overtimeRoutes);

// ----------------------- Health Check -----------------------
app.get("/health", (req, res) => res.json({ status: "OK", message: "Server is running" }));
app.get("/", (req, res) => res.send("Backend is running!"));

// ----------------------- 404 -----------------------
app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

// ----------------------- Error Handling Middleware -----------------------
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

// ----------------------- MongoDB Connection -----------------------
const MONGO_URI = process.env.MONGO_URI ||
  "mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// ----------------------- Start Server -----------------------
connectDB().then(() => {
  app.listen(5000, () => console.log("🚀 Server running on port 5000"));
});

export default app;