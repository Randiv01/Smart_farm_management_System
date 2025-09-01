// server.js (or your main file)
import dotenv from "dotenv";
dotenv.config(); 
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { animalRouter } from "./AnimalManagement/routes/animalRoutes.js";
import { animalTypeRouter } from "./AnimalManagement/routes/animalTypeRoutes.js";
import feedStockRouter from "./AnimalManagement/routes/feedStockRoutes.js";
import zonesRouter from "./AnimalManagement/routes/zoneRoutes.js";
import emergencyRoutes from "./AnimalManagement/routes/emergencyRoutes.js";
import { doctorRouter } from './AnimalManagement/routes/doctorRoutes.js';
import { sendMedicalRequest, testEmail } from './AnimalManagement/controllers/medicalRequestController.js';
import productivityRouter from './AnimalManagement/routes/productivityRoutes.js';
import userRoutes from "./routes/userRoutes.js";
dotenv.config();
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); 

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/Health_uploads', express.static(path.join(__dirname, 'HealthManagement', 'Health_uploads')));

// Ensure uploads folders exist
const uploadsDir = path.join(__dirname, 'uploads');
const healthUploadsDir = path.join(__dirname, 'HealthManagement', 'Health_uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

if (!fs.existsSync(healthUploadsDir)) {
  fs.mkdirSync(healthUploadsDir, { recursive: true });
  console.log('📁 Created Health_uploads directory');
}

// Routes
app.use("/animals", animalRouter);
app.use("/animal-types", animalTypeRouter);
app.use("/feed-stocks", feedStockRouter);
app.use("/zones", zonesRouter);
app.use("/emergency", emergencyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRouter);
app.use("/productivity", productivityRouter);
app.post('/api/medical-request', sendMedicalRequest);
app.post('/api/test-email', testEmail);

// Health Management Routes
import doctorRoutes from "./HealthManagement/Routes/DoctorDetailsRoute.js";
import specialistRoutes from "./HealthManagement/Routes/HealthSpecialistRoute.js";
import medicineCompanyRoutes from "./HealthManagement/Routes/H_MedicineCompanyRoute.js";
import mediStoreRoutes from "./HealthManagement/Routes/H_mediStoreRoute.js";
import plantPathologistRoutes from "./HealthManagement/Routes/H_PlantPathologistRoute.js";
import fertiliserRoutes from "./HealthManagement/Routes/H_FertiliserRoute.js";
import fertiliserCompanyRoutes from "./HealthManagement/Routes/fertiliserCompanyRoutes.js";

app.use("/api/doctors", doctorRoutes);
app.use("/api/specialists", specialistRoutes);
app.use("/api/medicine-companies", medicineCompanyRoutes);
app.use("/api/medistore", mediStoreRoutes);
app.use("/api/plant-pathologists", plantPathologistRoutes);
app.use("/api/fertilisers", fertiliserRoutes);
app.use("/api/fertiliser-companies", fertiliserCompanyRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// MongoDB Connection
mongoose.connect("mongodb+srv://EasyFarming:sliit123@easyFarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("✅ Connected to MongoDB (Database: 'EasyFarming')");
    app.listen(5000, () => console.log("🚀 Server running on port 5000"));
  })
  .catch(err => console.error("❌ MongoDB connection failed:", err));

export default app;