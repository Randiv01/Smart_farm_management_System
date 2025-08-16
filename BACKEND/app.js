import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { animalRouter } from "./routes/animalRoutes.js";
import { animalTypeRouter } from "./routes/animalTypeRoutes.js";
import feedStockRouter from "./routes/feedStockRoutes.js";
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

// Routes
app.use("/animals", animalRouter);
app.use("/animal-types", animalTypeRouter);
app.use("/feed-stocks", feedStockRouter);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('📁 Created uploads directory');
}

// MongoDB Connection
mongoose.connect("mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("✅ Connected to MongoDB (Database: 'EasyFarming')");
    app.listen(5000, () => console.log("🚀 Server running on port 5000"));
  })
  .catch(err => console.error("❌ MongoDB connection failed:", err));

export default app;
