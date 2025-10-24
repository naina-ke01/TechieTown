import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/your-db";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

const createAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ email: "admin@techietown.com" });
    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    const adminUser = new User({
      name: "Admin",
      email: "admin@techietown.com",
      password: "admin123",
      role: "admin",
    });

    await adminUser.save();
    console.log("Admin user created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
};

createAdmin();
