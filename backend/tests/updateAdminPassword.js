// backend/tests/updateAdminPassword.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/userModel.js";

// ✅ Resolve correct path to .env (important when running from backend/tests)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

// ✅ Debug: confirm that MONGO_URI is loaded
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

// ✅ Ensure connection string exists
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env file");
  process.exit(1);
}

// === 🛠 Function to update admin password ===
const updatePassword = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    const adminEmail = "admin@techietown.com";
    const newPlainPassword = "TechieTown@2025"; // ✅ New password
    const hashedPassword = await bcrypt.hash(newPlainPassword, 10);

    // ✅ Find and update the admin user
    const adminUser = await User.findOneAndUpdate(
      { email: adminEmail.toLowerCase(), role: "admin" },
      { password: hashedPassword },
      { new: true }
    );

    if (!adminUser) {
      console.log("⚠️ No admin user found with that email/role.");
    } else {
      console.log(`✅ Admin password updated successfully for ${adminUser.email}`);
    }
  } catch (error) {
    console.error("❌ Error updating admin password:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔒 MongoDB connection closed");
  }
};

// ✅ Run function
updatePassword();
