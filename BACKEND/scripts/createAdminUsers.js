import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const adminUsers = [
  {
    firstName: "Randiv",
    lastName: "Owner",
    email: "samantha.owner@mountolive.com",
    password: "Owner123!",
    role: "owner",
    isAdmin: true
  },
  {
    firstName: "John",
    lastName: "Animal",
    email: "john.animal@mountolive.com",
    password: "Animal123!",
    role: "animal",
    isAdmin: false
  },
  {
    firstName: "Mary",
    lastName: "Plant",
    email: "mary.plant@mountolive.com",
    password: "Plant123!",
    role: "plant",
    isAdmin: false
  },
  {
    firstName: "David",
    lastName: "Inventory",
    email: "david.inv@mountolive.com",
    password: "Inv123!",
    role: "inv",
    isAdmin: false
  },
  {
    firstName: "Sarah",
    lastName: "Employee",
    email: "sarah.emp@mountolive.com",
    password: "Emp123!",
    role: "emp",
    isAdmin: false
  },
  {
    firstName: "Michael",
    lastName: "Health",
    email: "michael.health@mountolive.com",
    password: "Health123!",
    role: "health",
    isAdmin: false
  },
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@mountolive.com",
    password: "Admin123!",
    role: "admin",
    isAdmin: true
  }
];

async function createAdminUsers() {
  try {
    const connectionString = process.env.MONGODB_URI || "mongodb+srv://EasyFarming:sliit123@easyFarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority";
    
    await mongoose.connect(connectionString);
    console.log("✅ Connected to MongoDB");
    
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const userData of adminUsers) {
      try {
        const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
        
        if (!existingUser) {
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          await User.create({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email.toLowerCase(),
            password: hashedPassword,
            role: userData.role,
            isAdmin: userData.isAdmin,
            isActive: true
          });
          console.log(`✅ Created admin user: ${userData.email}`);
          createdCount++;
        } else {
          let needsUpdate = false;
          
          if (existingUser.firstName !== userData.firstName || 
              existingUser.lastName !== userData.lastName || 
              existingUser.role !== userData.role ||
              existingUser.isAdmin !== userData.isAdmin) {
            existingUser.firstName = userData.firstName;
            existingUser.lastName = userData.lastName;
            existingUser.role = userData.role;
            existingUser.isAdmin = userData.isAdmin;
            needsUpdate = true;
          }
          
          try {
            const isPasswordMatch = await bcrypt.compare(userData.password, existingUser.password);
            if (!isPasswordMatch) {
              existingUser.password = await bcrypt.hash(userData.password, 10);
              needsUpdate = true;
            }
          } catch (passwordError) {
            console.warn(`⚠️  Password comparison failed for ${userData.email}, resetting password`);
            existingUser.password = await bcrypt.hash(userData.password, 10);
            needsUpdate = true;
          }
          
          if (!existingUser.isActive) {
            existingUser.isActive = true;
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            await existingUser.save();
            console.log(`✅ Updated admin user: ${userData.email}`);
            updatedCount++;
          } else {
            console.log(`ℹ️  Admin user already exists: ${userData.email}`);
            skippedCount++;
          }
        }
      } catch (userError) {
        console.error(`❌ Error processing user ${userData.email}:`, userError.message);
      }
    }
    
    console.log("\n📊 Admin users creation/update completed:");
    console.log(`✅ Created: ${createdCount}`);
    console.log(`🔄 Updated: ${updatedCount}`);
    console.log(`ℹ️  Skipped: ${skippedCount}`);
    console.log(`📋 Total processed: ${adminUsers.length}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin users:", error.message);
    process.exit(1);
  }
}

createAdminUsers();