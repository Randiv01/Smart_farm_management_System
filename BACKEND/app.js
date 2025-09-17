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
import multer from "multer";

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

for (const dir of [uploadsDir, healthUploadsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created ${dir}`);
  }
}

app.use("/uploads", express.static(uploadsDir));
app.use("/Health_uploads", express.static(healthUploadsDir));

// ----------------------- Multer setup -----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error("Only images are allowed"));
};
const upload = multer({ storage, fileFilter });

// ----------------------- Import Routes -----------------------
// Animal Management
import { animalRouter } from "./AnimalManagement/routes/animalRoutes.js";
import { animalTypeRouter } from "./AnimalManagement/routes/animalTypeRoutes.js";
import feedStockRouter from "./AnimalManagement/routes/feedStockRoutes.js";
import zonesRouter from "./AnimalManagement/routes/zoneRoutes.js";
import emergencyRoutes from "./AnimalManagement/routes/emergencyRoutes.js";
import chatbotRoutes from "./AnimalManagement/routes/chatbotRoutes.js";
import { doctorRouter } from "./AnimalManagement/routes/doctorRoutes.js";
import productivityRouter from "./AnimalManagement/routes/productivityRoutes.js";
import {
  sendMedicalRequest,
  testEmail,
} from "./AnimalManagement/controllers/medicalRequestController.js";
import userRoutes from "./routes/userRoutes.js";

// Health Management
import doctorRoutes from "./HealthManagement/Routes/DoctorDetailsRoute.js";
import specialistRoutes from "./HealthManagement/Routes/HealthSpecialistRoute.js";
import medicineCompanyRoutes from "./HealthManagement/Routes/H_MedicineCompanyRoute.js";
import mediStoreRoutes from "./HealthManagement/Routes/H_mediStoreRoute.js";
import plantPathologistRoutes from "./HealthManagement/Routes/H_PlantPathologistRoute.js";
import fertiliserRoutes from "./HealthManagement/Routes/H_FertiliserRoute.js";
import fertiliserCompanyRoutes from "./HealthManagement/Routes/fertiliserCompanyRoutes.js";
import doctorTreatmentRoutes from "./HealthManagement/Routes/DoctorTreatmentRoute.js";

// Plant Management
import inspectionRoutes from "./PlantManagement/Routes/inspectionRoutes.js";
import plantRoutes from "./PlantManagement/Routes/plantRoutes.js";
import fertilizingRoutes from "./PlantManagement/Routes/fertilizingRoutes.js";
import plantProductivityRoutes from "./PlantManagement/Routes/productivityRoutes.js";

// ----------------------- Debug env variables -----------------------
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

// Doctor routes from Animal Management
app.use("/api/doctors", doctorRouter);
app.use("/productivity", productivityRouter);
app.post("/api/medical-request", sendMedicalRequest);
app.post("/api/test-email", testEmail);

// Health Management
app.use("/api/doctors", doctorRoutes);
app.use("/api/specialists", specialistRoutes);
app.use("/api/medicine-companies", medicineCompanyRoutes);
app.use("/api/medistore", mediStoreRoutes);
app.use("/api/plant-pathologists", plantPathologistRoutes);
app.use("/api/fertilisers", fertiliserRoutes);
app.use("/api/fertiliser-companies", fertiliserCompanyRoutes);
app.use("/api/doctor-treatments", doctorTreatmentRoutes);

// Plant Management
app.use("/api/inspections", inspectionRoutes);
app.use("/api/plants", plantRoutes);
app.use("/api/fertilizing", fertilizingRoutes);
app.use("/api/productivity", plantProductivityRoutes);

// ----------------------- Health Check -----------------------
app.get("/health", (req, res) => res.json({ status: "OK", message: "Server is running" }));
app.get("/", (req, res) => res.send("Backend is running!"));

// ----------------------- MongoDB Connection -----------------------
const MONGO_URI =
  process.env.MONGO_URI ||
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
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});

export default app;
