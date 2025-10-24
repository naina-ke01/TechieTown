// backend/server.js
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import logger from "./utils/logger.js";
import userRoute from "./routes/userRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import paymentRoute from "./routes/mpesaRoutes.js"; // ✅ Correct route
import orderRoute from "./routes/orderRoute.js";
import refundRoute from "./routes/refundRoute.js";
import shippingRoute from "./routes/shippingRoute.js";
import productRoute from "./routes/productRoute.js";
import User from "./models/userModel.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  MONGODB_URI,
  PORT = 3000,
  FRONTEND_URL,
  JWT_SECRET,
  NGROK_URL,
} = process.env;

// ===== Validate critical envs =====
if (!MONGODB_URI) throw new Error("❌ MONGODB_URI missing in .env");
if (!JWT_SECRET) throw new Error("❌ JWT_SECRET missing in .env");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// ===== Security & Middleware =====
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ===== CORS =====
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.includes("ngrok") ||
        origin === "null"
      )
        return callback(null, true);
      if (FRONTEND_URL && origin === FRONTEND_URL) return callback(null, true);
      console.warn("🚫 Blocked CORS from", origin);
      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
  })
);

app.use(morgan("dev"));

// ===== Static Folders =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../public")));
app.use("/admin", express.static(path.join(__dirname, "../public/admin")));

// ===== Log directory for callbacks =====
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
const CALLBACK_FILE = path.join(logsDir, "mpesa-callbacks.json");

// ===== Basic Health Routes =====
app.get("/api/ping", (req, res) =>
  res.json({ status: "ok", message: "Backend live ✅" })
);

app.get("/api/config", (req, res) => {
  res.json({ baseUrl: NGROK_URL || `${req.protocol}://${req.get("host")}` });
});

// ===== JWT Verify =====
app.get("/api/verify-token", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ valid: false, message: "No token" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ valid: false, message: "User not found" });

    res.json({
      valid: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(401).json({ valid: false, message: "Invalid or expired token" });
  }
});

// ===== ROUTES =====
app.use("/api/users", userRoute);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoute); // ✅ M-Pesa routes
app.use("/api/products", productRoute);
app.use("/api/orders", orderRoute);
app.use("/api/refunds", refundRoute);
app.use("/api/shipping", shippingRoute);

// ===== Debug: View M-Pesa Callbacks =====
app.get("/api/payments/callbacks", (req, res) => {
  try {
    if (!fs.existsSync(CALLBACK_FILE))
      return res.json({ success: true, count: 0, data: [] });
    const file = fs.readFileSync(CALLBACK_FILE, "utf8");
    const data = JSON.parse(file || "[]");
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to read callbacks: " + err.message);
    res.status(500).json({ success: false, message: "Failed to read callbacks" });
  }
});

// ===== Serve Frontend =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ===== Error Handler =====
app.use((err, req, res, next) => {
  logger.error("Global Error: " + (err.stack || err.message || err));
  res.status(500).json({ error: "Internal server error" });
});

// ===== Connect to MongoDB =====
async function connectMongo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

// ===== Create Default Admin =====
async function createDefaultAdmin() {
  try {
    const existing = await User.findOne({ role: "admin" });
    if (!existing) {
      const hash = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "TechieTown Admin",
        email: "admin@techietown.com",
        password: hash,
        role: "admin",
      });
      console.log("👑 Default admin created: admin@techietown.com / admin123");
    }
  } catch (err) {
    console.error("Failed to create admin:", err.message);
  }
}

// ===== Start Server =====
(async function start() {
  await connectMongo();
  await createDefaultAdmin();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 M-Pesa callback file: ${CALLBACK_FILE}`);
  });

  process.on("SIGINT", () => {
    console.log("🧹 Graceful shutdown...");
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log("MongoDB disconnected");
        process.exit(0);
      });
    });
  });
})();
