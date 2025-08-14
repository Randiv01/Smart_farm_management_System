import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import animalRouter from "./routes/animalRoutes.js";
import path from 'path';
import fs from 'fs';

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use("/animals", animalRouter);

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
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
