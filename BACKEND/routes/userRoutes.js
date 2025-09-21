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
    const uploadDir = path.join(process.cwd(), 'uploads/profile-images');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  cb(null, file.mimetype.startsWith('image/'));
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

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: "normal"
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

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, role, email: user.email }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      role,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImage: user.profileImage
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
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update logged-in customer profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, address, city, country, dateOfBirth, bio } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone, address, city, country, dateOfBirth, bio },
      { new: true, runValidators: true }
    );

    res.json(user);
  } catch (err) {
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

    if (user.profileImage) {
      const oldPath = path.join(process.cwd(), user.profileImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.profileImage = path.join('uploads/profile-images', req.file.filename);
    await user.save();

    res.json({
      message: "Profile image uploaded successfully",
      imageUrl: `/api/users/profile-image/${req.file.filename}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete profile image
router.delete("/profile-image", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.profileImage) {
      const imgPath = path.join(process.cwd(), user.profileImage);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      user.profileImage = null;
      await user.save();
    }
    res.json({ message: "Profile image removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve profile images
router.get("/profile-image/:filename", (req, res) => {
  const imagePath = path.join(process.cwd(), 'uploads/profile-images', req.params.filename);
  if (fs.existsSync(imagePath)) res.sendFile(imagePath);
  else res.status(404).json({ error: "Image not found" });
});

// Deactivate account
router.put("/deactivate", verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isActive: false });
    res.json({ message: "Account deactivated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete account
router.delete("/account", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.profileImage) {
      const imgPath = path.join(process.cwd(), user.profileImage);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- Roles endpoint -------------------
router.get("/roles", verifyToken, (req, res) => {
  res.json(["animal", "plant", "inv", "emp", "health", "owner", "normal", "admin"]);
});

export { verifyToken, requireRole };
export default router;
