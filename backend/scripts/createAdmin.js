// backend/scripts/createAdmin.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/Techietown";

async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

async function createAdmin() {
  try {
    const existingAdmin = await User.findOne({ email: "admin@techietown.com" });
    if (existingAdmin) {
      console.log("ℹ️ Admin user already exists:", existingAdmin.email);
      process.exit(0);
    }

    const adminUser = new User({
      name: "TechieTown Admin",
      email: "admin@techietown.com",
      password: "admin123", // will be hashed by model pre-save hook
      role: "admin",
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully");
    console.log("📧 Email: admin@techietown.com | 🔑 Password: admin123");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

// Run
(async function () {
  await connectMongo();
  await createAdmin();
})();
