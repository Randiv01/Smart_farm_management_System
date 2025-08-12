import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import animalRouter from "./routes/animalRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js"; // Add this import
import path from 'path'; // Add this import
import fs from 'fs'; // Move this import to the top level

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use("/animals", animalRouter);
app.use("/api/upload", uploadRouter); // Add this line

// MongoDB Connection
mongoose.connect("mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("✅ Connected to MongoDB (Database: 'EasyFarming')");
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
      console.log('📁 Created uploads directory');
    }
    app.listen(5000, () => console.log("🚀 Server running on port 5000"));
    app.listen(5000, () => console.log("🚀 Server running on port 5000"));
  })
  .catch(err => console.error("❌ MongoDB connection failed:", err));