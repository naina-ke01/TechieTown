// routes/adminRoute.js
import express from "express";
import jwt from "jsonwebtoken";
import { adminLogin, getDashboardStats, getAdminProfile } from "../controllers/adminController.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key_here";

// ===== Middleware to verify admin token =====
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ===== Routes =====
router.post("/login", adminLogin);                // ✅ Admin login
router.get("/dashboard", verifyAdmin, getDashboardStats);  // ✅ Dashboard stats
router.get("/profile", verifyAdmin, getAdminProfile);      // ✅ Admin profile

export default router;
