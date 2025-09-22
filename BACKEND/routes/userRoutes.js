// BACKEND/routes/userRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

// ------------------- Multer config for profile images -------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

// ------------------- Middleware -------------------
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Insufficient permissions" });
  next();
};

// ------------------- Register new user -------------------
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists with this email" });

    // Check if email is a manager email
    const isManagerEmail = email.includes('@mountolive.com');
    
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: isManagerEmail ? "normal" : "normal" // Default for customers, will be updated on login
    });

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: err.message });
  }
});

// ------------------- Login -------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    let role = user.role;

    // Check if email is from mountolive.com (manager)
    if (email.includes('@mountolive.com')) {
      const atIndex = email.indexOf("@");
      const lastDotIndex = email.lastIndexOf(".", atIndex);
      if (lastDotIndex !== -1 && lastDotIndex < atIndex) {
        const extractedRole = email.substring(lastDotIndex + 1, atIndex);
        const validRoles = ["animal", "plant", "inv", "emp", "health", "owner", "admin"];
        if (validRoles.includes(extractedRole)) {
          role = extractedRole;
          if (user.role !== extractedRole) {
            user.role = extractedRole;
            await user.save();
          }
        }
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, role, email: user.email }, JWT_SECRET, { expiresIn: "1d" });

    // Login endpoint in userRoutes.js - Ensure this returns all necessary data
    res.json({
      token,
      role,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImage: user.profileImage,
      isManager: email.includes('@mountolive.com'),
      // ✅ Add these fields if available
      phone: user.phone,
      address: user.address,
      city: user.city,
      country: user.country,
      dateOfBirth: user.dateOfBirth,
      bio: user.bio
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- Get all users (admin only) -------------------
router.get("/", verifyToken, requireRole(["owner", "admin"]), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;

    const users = await User.find(query)
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- Customer Routes -------------------

// Get logged-in customer profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Convert to plain object and add fullName
    const userObj = user.toObject();
    userObj.fullName = `${user.firstName} ${user.lastName}`;
    
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update logged-in customer profile (with optional image upload)
router.put("/profile", verifyToken, upload.single('profileImage'), async (req, res) => {
  try {
    console.log('Profile update request received:', {
      body: req.body,
      file: req.file,
      user: req.user
    });

    const { firstName, lastName, phone, address, city, country, dateOfBirth, bio } = req.body;

    // Build update object
    const updateData = { firstName, lastName, phone, address, city, country, bio };

    // Handle dateOfBirth conversion
    if (dateOfBirth) {
      updateData.dateOfBirth = new Date(dateOfBirth);
    } else {
      updateData.dateOfBirth = null; // Clear if empty
    }

    // Handle profile image upload if provided
    if (req.file) {
      console.log('Profile image uploaded:', req.file);
      const user = await User.findById(req.user.id);
      
      // Delete old profile image if exists
      if (user.profileImage) {
        const oldPath = path.join(process.cwd(), user.profileImage);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    console.log('Updating user with data:', updateData);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ FIX: Return complete user data
    const userObj = user.toObject();
    userObj.fullName = `${user.firstName} ${user.lastName}`;

    console.log('Profile updated successfully:', userObj);

    res.json(userObj);
  } catch (err) {
    console.error("Profile update error:", err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(400).json({ error: err.message });
  }
});

// Change password
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Current password and new password are required" });
    if (newPassword.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters long" });

    const user = await User.findById(req.user.id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Upload profile image
router.post("/upload-profile-image", verifyToken, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided" });

    const user = await User.findById(req.user.id);

    // Delete old profile image if exists
    if (user.profileImage) {
      const oldPath = path.join(process.cwd(), user.profileImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Update user with new profile image path
    user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({ 
      message: "Profile image uploaded successfully", 
      imageUrl: `/uploads/${req.file.filename}` 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete profile image
router.delete("/profile-image", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.profileImage) {
      const imagePath = path.join(process.cwd(), user.profileImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    user.profileImage = "";
    await user.save();

    res.json({ message: "Profile image removed successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ------------------- Admin Routes -------------------

// Get user by ID
router.get("/:id", verifyToken, requireRole(["owner", "admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user by ID
router.put("/:id", verifyToken, requireRole(["owner", "admin"]), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(400).json({ error: err.message });
  }
});

// Delete user (soft delete)
router.delete("/:id", verifyToken, requireRole(["owner", "admin"]), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;