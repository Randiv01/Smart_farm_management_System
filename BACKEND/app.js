import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import animalRouter from "./routes/animalRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/animals", animalRouter);

// MongoDB Connection (EXPLICITLY connects to 'EasyFarming' DB)
mongoose.connect("mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("✅ Connected to MongoDB (Database: 'EasyFarming')");
    app.listen(5000, () => console.log("🚀 Server running on port 5000"));
  })
  .catch(err => console.error("❌ MongoDB connection failed:", err));