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
import { createServer } from "http";
import { Server } from "socket.io";

// ----------------------- Fix __dirname for ES modules -----------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------- Initialize Express -----------------------
const app = express();

// ----------------------- Create HTTP server -----------------------
const server = createServer(app);

// ----------------------- Initialize Socket.io -----------------------
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Store socket.io instance in app for controllers
app.set("io", io);

// ----------------------- Socket.io Event Handling -----------------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  // Join user-specific room
  socket.on("join-user-room", (userId) => {
    socket.join(`user-${userId}`);
  });
});

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
const animalReportsDir = path.join(__dirname, "uploads", "animal-reports");
const plantReportsDir = path.join(__dirname, "uploads", "plant-reports");

[uploadsDir, healthUploadsDir, plantUploadsDir, animalReportsDir, plantReportsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Serve static folders
app.use("/uploads", express.static(uploadsDir));
app.use("/Health_uploads", express.static(healthUploadsDir));
app.use("/Health_Uploads", express.static(healthUploadsDir)); // for case-insensitive use
app.use("/plant-uploads", express.static(plantUploadsDir));

// ----------------------- Multer Setup -----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error("Only images and PDF files are allowed"));
};

const upload = multer({ storage, fileFilter });

// ----------------------- Import Routes -----------------------

// 🌿 Animal Management
import { animalRouter } from "./AnimalManagement/routes/animalRoutes.js";
import { animalTypeRouter } from "./AnimalManagement/routes/animalTypeRoutes.js";
import feedStockRouter from "./AnimalManagement/routes/feedStockRoutes.js";
import chatbotRoutes from "./AnimalManagement/routes/chatbotRoutes.js";
import zonesRouter from "./AnimalManagement/routes/zoneRoutes.js";
import emergencyRoutes from "./AnimalManagement/routes/emergencyRoutes.js";
import { doctorRouter as animalDoctorRouter } from "./AnimalManagement/routes/doctorRoutes.js";
import {
  sendMedicalRequest,
  testEmail,
} from "./AnimalManagement/controllers/medicalRequestController.js";
import productivityRouter from "./AnimalManagement/routes/productivityRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// 💊 Health Management
import doctorRoutes from "./HealthManagement/Routes/DoctorDetailsRoute.js";
import specialistRoutes from "./HealthManagement/Routes/HealthSpecialistRoute.js";
import medicineCompanyRoutes from "./HealthManagement/Routes/H_MedicineCompanyRoute.js";
import mediStoreRoutes from "./HealthManagement/Routes/H_mediStoreRoute.js";
import plantPathologistRoutes from "./HealthManagement/Routes/H_PlantPathologistRoute.js";
import fertiliserRoutes from "./HealthManagement/Routes/H_FertiliserRoute.js";
import fertiliserCompanyRoutes from "./HealthManagement/Routes/fertiliserCompanyRoutes.js";
import animalTreatmentRoutes from "./HealthManagement/Routes/H_animalTreatmentRoutes.js";
import H_plantTreatmentRoutes from "./HealthManagement/Routes/H_plantTreatmentRoutes.js"; // ✅ Your new route

// 📞 Contact Us
import contact from "./ContactUs/routes/contactRoutes.js";

// 🌱 Plant Management
import inspectionRoutes from "./PlantManagement/Routes/inspectionRoutes.js";
import plantRoutes from "./PlantManagement/Routes/plantRoutes.js";
import fertilizingRoutes from "./PlantManagement/Routes/fertilizingRoutes.js";
import plantProductivityRoutes from "./PlantManagement/Routes/productivityRoutes.js";
import pestRoutes from "./PlantManagement/Routes/pestRoutes.js";
import consultationRoutes from "./PlantManagement/Routes/consultationRoutes.js";

// 🏭 Inventory Management
import productRoutes from "./InventoryManagement/Iroutes/productRoutes.js";
import orderRoutes from "./InventoryManagement/Iroutes/orderRoutes.js";
import animalFoodRoutes from "./InventoryManagement/Iroutes/animalfoodRoutes.js";
import IfertilizerstockRoutes from "./InventoryManagement/Iroutes/IfertilizerstockRoutes.js";
import supplierRoutes from "./InventoryManagement/Iroutes/IsupplierRoutes.js";
import refillRequestRoutes from "./InventoryManagement/Iroutes/refillRequestRoutes.js";

// 👷 Employee Management
import employeeRoutes from "./EmployeeManager/E-route/employeeRoutes.js";
import attendanceRoutes from "./EmployeeManager/E-route/attendanceRoutes.js";
import leaveRoutes from "./EmployeeManager/E-route/leaveRoutes.js";
import overtimeRoutes from "./EmployeeManager/E-route/overtimeRoutes.js";

// ----------------------- Debug Environment Variables -----------------------
console.log("✅ OPENAI_API_KEY loaded:", process.env.OPENAI_API_KEY ? "YES" : "NO");
console.log("✅ EMAIL_USER loaded:", process.env.EMAIL_USER ? "YES" : "NO");

// ----------------------- Routes Setup -----------------------

// 🧠 Chatbot
app.use("/api/chatbot", chatbotRoutes);

// 🐄 Animal Management
app.use("/animals", animalRouter);
app.use("/animal-types", animalTypeRouter);
app.use("/feed-stocks", feedStockRouter);
app.use("/zones", zonesRouter);
app.use("/emergency", emergencyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/animal-doctors", animalDoctorRouter); // avoid conflict with /api/doctors
app.use("/productivity", productivityRouter);
app.post("/api/medical-request", sendMedicalRequest);
app.post("/api/test-email", testEmail);

// 🩺 Health Management
app.use("/api/doctors", doctorRoutes);
app.use("/api/specialists", specialistRoutes);
app.use("/api/medicine-companies", medicineCompanyRoutes);
app.use("/api/medistore", mediStoreRoutes);
app.use("/api/plant-pathologists", plantPathologistRoutes);
app.use("/api/fertilisers", fertiliserRoutes);
app.use("/api/fertiliser-companies", fertiliserCompanyRoutes);

// IMPORTANT: Match frontend endpoint
app.use("/api/animal-treatments", animalTreatmentRoutes);

// ✅ NEW Plant Treatment Routes
app.use("/api/plant-treatments", H_plantTreatmentRoutes);

// 📞 Contact Us
app.use("/api/contact", contact);

// 🌿 Plant Management
app.use("/api/inspections", inspectionRoutes);
app.use("/api/plants", plantRoutes);
app.use("/api/fertilizing", fertilizingRoutes);
app.use("/api/productivity", plantProductivityRoutes);
app.use("/api/pests", pestRoutes);
app.use("/api/consultations", consultationRoutes);

// 🏭 Inventory Management
app.use("/api/inventory/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/animalfood", animalFoodRoutes);
app.use("/api/Ifertilizerstock", IfertilizerstockRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/refill-requests", refillRequestRoutes);

// 👷 Employee Management
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/overtime", overtimeRoutes);

// 🖼️ Customer Profile Image Upload
app.post("/api/customers/profile-upload", upload.single("profileImage"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({
    message: "Profile image uploaded successfully",
    path: `/uploads/${req.file.filename}`,
  });
});

// 🧩 Debug Endpoints
app.get("/api/debug", (req, res) => {
  res.json({
    message: "Server is working",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

app.get("/api/check-db", async (req, res) => {
  try {
    const Pest = mongoose.model("Pest");
    const consultationCount = await mongoose.model("Consultation").countDocuments();
    const pestCount = await Pest.countDocuments();
    res.json({
      success: true,
      message: "MongoDB is connected",
      pestCount,
      consultationCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "MongoDB connection error",
      error: error.message,
    });
  }
});

// ----------------------- Health Check -----------------------
app.get("/health", (req, res) => res.json({ status: "OK", message: "Server is running" }));
app.get("/", (req, res) => res.send("🌿 Easy Farming Backend is running!"));

// ----------------------- 404 Not Found -----------------------
app.use((req, res) => {
  res.status(404).json({ message: "Route Not Found" });
});

// ----------------------- Error Handling Middleware -----------------------
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

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
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});

export default app;