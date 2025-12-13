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

// Store socket.io instance in app
app.set("io", io);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  // Join user to specific room based on their role
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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ----------------------- Uploads Setup -----------------------
const animalUploadsDir = path.join(__dirname, "AnimalManagement", "Uploads");
const uploadsDir = path.join(__dirname, "uploads");
const healthUploadsDir = path.join(
  __dirname,
  "HealthManagement",
  "Health_uploads"
);
const plantUploadsDir = path.join(__dirname, "PlantManagement", "Uploads");

[uploadsDir, healthUploadsDir, plantUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Serve static folders
app.use("/uploads", express.static(uploadsDir));
app.use("/animal-uploads", express.static(animalUploadsDir));
app.use("/Health_uploads", express.static(healthUploadsDir));
app.use("/Health_Uploads", express.static(healthUploadsDir));
app.use("/plant-uploads", express.static(plantUploadsDir));
app.use('/api/PlantManagement/Uploads', express.static(path.join(__dirname, 'PlantManagement', 'Uploads')));

// ----------------------- Batch Expiry Notification Function -----------------------
const checkExpiryNotifications = async () => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const batchesNearingExpiry = await MeatProductivity.find({
      expiryDate: { $lte: threeDaysFromNow, $gte: now },
      status: { $in: ["Fresh", "Stored", "Processed"] }, // Exclude already expired or sold
    });

    batchesNearingExpiry.forEach((batch) => {
      const daysUntilExpiry = Math.ceil((new Date(batch.expiryDate) - now) / (24 * 60 * 60 * 1000));
      if (daysUntilExpiry <= 3 && daysUntilExpiry >= 0) {
        io.emit("batchExpiring", {
          message: `Batch ${batch.batchId} (${batch.animalType}, ${batch.meatType}) is nearing expiry in ${daysUntilExpiry} day(s)`,
          batchId: batch.batchId,
        });
      }
    });
  } catch (error) {
    console.error("Error checking batch expiry:", error);
  }
};

// Set up interval for expiry checks (every 12 hours)
setInterval(checkExpiryNotifications, 12 * 60 * 60 * 1000);

// ----------------------- Multer setup -----------------------
// This is just a fallback, userRoutes has its own multer configuration
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
import chatbotRoutes from "./AnimalManagement/routes/chatbotRoutes.js";
import zonesRouter from "./AnimalManagement/routes/zoneRoutes.js";
import emergencyRoutes from "./AnimalManagement/routes/emergencyRoutes.js";
import feedingRoutes from "./AnimalManagement/routes/feedingRoutes.js";
import automatedFeedingRoutes from "./AnimalManagement/routes/automatedFeedingRoutes.js";
import { doctorRouter as animalDoctorRouter } from "./AnimalManagement/routes/doctorRoutes.js"; // ⚠️ Renamed to avoid conflict
import {
  sendMedicalRequest,
  testEmail,
} from "./AnimalManagement/controllers/medicalRequestController.js";
import animalProductivityRouter from "./AnimalManagement/routes/animalProductivityRoutes.js";
import { productivityNotificationRouter } from "./AnimalManagement/routes/productivityNotificationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import meatRoutes from "./AnimalManagement/routes/meatRoutes.js";
import notificationRoutes from "./AnimalManagement/routes/notificationRoutes.js";
import MeatProductivity from "./AnimalManagement/models/MeatProductivity.js";
import HarvestHistory from "./AnimalManagement/models/HarvestHistory.js";
import NotificationService from "./AnimalManagement/services/notificationService.js";
import automatedFeedingService from "./AnimalManagement/services/automatedFeedingService.js";

// Health Management
import doctorRoutes from "./HealthManagement/Routes/DoctorDetailsRoute.js";
import specialistRoutes from "./HealthManagement/Routes/HealthSpecialistRoute.js";
import medicineCompanyRoutes from "./HealthManagement/Routes/H_MedicineCompanyRoute.js";
import mediStoreRoutes from "./HealthManagement/Routes/H_mediStoreRoute.js";
import plantPathologistRoutes from "./HealthManagement/Routes/H_PlantPathologistRoute.js";
import fertiliserRoutes from "./HealthManagement/Routes/H_FertiliserRoute.js";
import fertiliserCompanyRoutes from "./HealthManagement/Routes/fertiliserCompanyRoutes.js";

// Contact Us
import contact from "./ContactUs/routes/contactRoutes.js";

// Plant Management
import inspectionRoutes from "./PlantManagement/Routes/inspectionRoutes.js";
import plantRoutes from "./PlantManagement/Routes/plantRoutes.js";
import fertilizingRoutes from "./PlantManagement/Routes/fertilizingRoutes.js";
import plantProductivityRoutes from "./PlantManagement/Routes/productivityRoutes.js";
import pestRoutes from "./PlantManagement/Routes/pestRoutes.js";
import consultationRoutes from "./PlantManagement/Routes/consultationRoutes.js";
import dashboardRoutes from "./PlantManagement/Routes/dashboardRoutes.js";

// Inventory Management
import productRoutes from "./InventoryManagement/Iroutes/productRoutes.js";
import orderRoutes from "./InventoryManagement/Iroutes/orderRoutes.js";
import animalFoodRoutes from "./InventoryManagement/Iroutes/animalfoodRoutes.js";
import IfertilizerstockRoutes from "./InventoryManagement/Iroutes/IfertilizerstockRoutes.js";
import supplierRoutes from "./InventoryManagement/Iroutes/IsupplierRoutes.js";
import refillRequestRoutes from "./InventoryManagement/Iroutes/refillRequestRoutes.js";
import exportMarketRoutes from "./InventoryManagement/Iroutes/IexportmarketRoutes.js";

// Employee Management
import employeeRoutes from "./EmployeeManager/E-route/employeeRoutes.js";
import attendanceRoutes from "./EmployeeManager/E-route/attendanceRoutes.js";
import leaveRoutes from "./EmployeeManager/E-route/leaveRoutes.js";
import overtimeRoutes from "./EmployeeManager/E-route/overtimeRoutes.js";
import salaryRoutes from "./EmployeeManager/E-route/salaryRoutes.js";
import reportRoutes from "./EmployeeManager/E-route/reportRoutes.js";

// ESP32 Proxy Routes
import esp32Routes from "./routes/esp32Routes.js";

// ----------------------- Debug env variables -----------------------
console.log(
  "OPENAI_API_KEY loaded:",
  process.env.OPENAI_API_KEY ? "YES" : "NO"
);
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
app.use("/api/feeding", feedingRoutes);
app.use("/api/automated-feeding", automatedFeedingRoutes);
app.use("/api/users", userRoutes);
// IMPORTANT: Avoid conflict with /api/doctors from HealthManagement
app.use("/api/animal-doctors", animalDoctorRouter); // ✅ moved from /api/doctors
app.use("/animal-productivity", animalProductivityRouter);
app.use("/api/notifications", productivityNotificationRouter);
app.post("/api/medical-request", sendMedicalRequest);
app.post("/api/test-email", testEmail);
app.use("/api/meats", meatRoutes);
app.use("/api/animal-management/notifications", notificationRoutes);

// Health Management
app.use("/api/doctors", doctorRoutes); // ✅ Only HealthManagement doctors here
app.use("/api/specialists", specialistRoutes);
app.use("/api/medicine-companies", medicineCompanyRoutes);
app.use("/api/medistore", mediStoreRoutes);
app.use("/api/plant-pathologists", plantPathologistRoutes);
app.use("/api/fertilisers", fertiliserRoutes);
app.use("/api/fertiliser-companies", fertiliserCompanyRoutes);

// Contact Us
app.use("/api/contact", contact);

// Plant Management
app.use("/api/inspections", inspectionRoutes);
app.use("/api/plants", plantRoutes);
app.use("/api/fertilizing", fertilizingRoutes);
app.use("/api/productivity", plantProductivityRoutes);
app.use("/api/pests", pestRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api", dashboardRoutes);

// Inventory Management
app.use("/api/inventory/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/animalfood", animalFoodRoutes);
app.use("/api/Ifertilizerstock", IfertilizerstockRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/refill-requests", refillRequestRoutes);
app.use("/api/export-market", exportMarketRoutes);

// Employee Management
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/overtime", overtimeRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/employee-reports", reportRoutes);

// ESP32 Proxy Routes - These proxy requests to your ESP32 device
app.use("/", esp32Routes);

// Customer Profile Image Upload (fallback route)
app.use(
  "/api/customers/profile-upload",
  upload.single("profileImage"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({
      message: "Profile image uploaded successfully",
      path: `/uploads/${req.file.filename}`,
    });
  }
);

// Add debug endpoints
app.get("/api/debug", (req, res) => {
  res.json({
    message: "Server is working",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

app.get("/api/check-db", async (req, res) => {
  try {
    // Try to perform a simple query
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
app.get("/health", (req, res) =>
  res.json({ status: "OK", message: "Server is running" })
);
app.get("/", (req, res) => res.send("Backend is running!"));

// ----------------------- 404 -----------------------
app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

// ----------------------- Error Handling Middleware -----------------------
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  
  // Handle multer errors specifically
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
    }
  }
  
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

// ----------------------- MongoDB Connection -----------------------
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.error(`\n💡 Troubleshooting tips:`);
    console.error(`   1. Check if your IP address is whitelisted in MongoDB Atlas`);
    console.error(`   2. Verify your MongoDB connection string in .env file`);
    console.error(`   3. Ensure your MongoDB Atlas cluster is running`);
    console.error(`   4. Check your network connection\n`);
    process.exit(1);
  }
};

// ----------------------- Start Server -----------------------
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    // Start notification service
    console.log('🔔 Starting notification service...');
    
    // Run initial notification check
    NotificationService.runAllChecks();
    
    // Schedule notification checks every 5 minutes
    setInterval(() => {
      NotificationService.runAllChecks();
    }, 5 * 60 * 1000);
    
    // Clean up expired notifications every hour
    setInterval(() => {
      NotificationService.cleanupExpiredNotifications();
    }, 60 * 60 * 1000);
    
    console.log('✅ Notification service started');
    
    // Start automated feeding service
    automatedFeedingService.start();
    console.log('🤖 Automated feeding service started');
  });
});

export default app;