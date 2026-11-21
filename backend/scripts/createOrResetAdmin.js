import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";

dotenv.config();

const email = "admin@techietown.com";
const plainPassword = "admin123";

async function run() {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error("❌ MONGODB_URI is not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: "TechieTown Admin",
        email,
        password: plainPassword,
        role: "admin",
      });
      console.log("✅ Admin user created:", user._id.toString());
    } else {
      user.password = plainPassword;
      await user.save();
      console.log("🔁 Admin password reset:", user._id.toString());
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

run();
