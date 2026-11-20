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
import bcrypt from "bcrypt";

import logger from "./utils/logger.js";
import userRoute from "./routes/userRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import mpesaRoutes from "./routes/mpesaRoutes.js";
import orderRoute from "./routes/orderRoute.js";
import refundRoute from "./routes/refundRoute.js";
import shippingRoute from "./routes/shippingRoute.js";
import productRoute from "./routes/productRoute.js";
import visaRoute from "./routes/visaRoute.js";
import Product from "./models/productModel.js";
import Order from "./models/orderModel.js";
import Payment from "./models/paymentModel.js";
import User from "./models/userModel.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  MONGODB_URI,
  PORT = 3000,
  FRONTEND_URL,
  NGROK_URL,
} = process.env;

if (!MONGODB_URI) throw new Error("❌ MONGODB_URI missing in .env");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// ===== Security & Middleware =====
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));
app.use(morgan("dev"));

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

// ===== Static Folders =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../public")));
app.use("/admin", express.static(path.join(__dirname, "../public/admin")));

// ✅ Serve any HTML directly
// Serve any HTML file
app.get("/*.html", (req, res) => {
  const filePath = path.join(__dirname, "../public", req.path);
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  res.status(404).sendFile(path.join(__dirname, "../public/404.html"));
});

// Explicit pages
const publicPath = path.join(__dirname, "../public");

app.get("/mpesa-checkout.html", (req, res) =>
  res.sendFile(path.join(publicPath, "mpesa-checkout.html"))
);

app.get("/thank-you.html", (req, res) =>
  res.sendFile(path.join(publicPath, "thank-you.html"))
);

app.get("/cart.html", (req, res) =>
  res.sendFile(path.join(publicPath, "cart.html"))
);

app.get("/login.html", (req, res) =>
  res.sendFile(path.join(publicPath, "login.html"))
);

app.get("/register.html", (req, res) =>
  res.sendFile(path.join(publicPath, "register.html"))
);

app.get("/products.html", (req, res) =>
  res.sendFile(path.join(publicPath, "products.html"))
);

app.get("/product-view.html", (req, res) =>
  res.sendFile(path.join(publicPath, "product-view.html"))
);


// ===== Logs Folder =====
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
const CALLBACK_FILE = path.join(logsDir, "mpesa-callbacks.json");

// ===== Health Check =====
app.get("/api/ping", (req, res) =>
  res.json({ status: "ok", message: "Backend live ✅" })
);

// ===== Config Endpoint =====
app.get("/api/config", (req, res) => {
  res.json({ baseUrl: NGROK_URL || `${req.protocol}://${req.get("host")}` });
});


// ===== TEMPORARY COUNT ENDPOINTS (Until models are created) =====
app.get("/api/products/count", async (req, res) => {
  try {
    const count = await Product.countDocuments();
    res.json({ success: true, count });
  } catch (err) {
    res.json({ success: true, count: 0 });
  }
});

app.get("/api/orders/count", async (req, res) => {
  try {
    const count = await Order.countDocuments();
    res.json({ success: true, count });
  } catch (err) {
    res.json({ success: true, count: 0 });
  }
});

app.get("/api/payments/count", async (req, res) => {
  try {
    const count = await Payment.countDocuments({ status: "Completed" });
    res.json({ success: true, count });
  } catch (err) {
    res.json({ success: true, count: 0 });
  }
});


// ===== ROUTES =====
app.use("/api/users", userRoute);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", mpesaRoutes);
app.use("/api/orders", orderRoute);
app.use("/api/refunds", refundRoute);
app.use("/api/shipping", shippingRoute);
app.use("/api/products", productRoute);
app.use("/api/visa", visaRoute);

// ===== View M-Pesa Callbacks =====
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

// ===== Serve Homepage =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ===== Error Handler =====
// ===== Error Handler =====
app.use((err, req, res, next) => {
  logger.error("Global Error: " + (err.stack || err.message || err));
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// ===== MongoDB Connection =====
async function connectMongo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

// ===== Create Default Admin =====
async function createDefaultAdmin() {
  try {
    const existing = await User.findOne({ role: "admin" });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      await User.create({
        name: "TechieTown Admin",
        email: "admin@techietown.com",
        password: hashedPassword,
        role: "admin",
      });

      console.log("👑 Default admin created: admin@techietown.com / TechieTown@2025");
    } else {
      console.log("✅ Admin already exists:", existing.email);
    }
  } catch (err) {
    console.error("⚠️ Failed to create admin:", err.message);
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
        console.log("🛑 MongoDB disconnected");
        process.exit(0);
      });
    });
  });
})();
