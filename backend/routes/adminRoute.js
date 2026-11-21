import express from "express";
import {
  adminLogin,
  getDashboardStats,
  getAdminProfile,
  updateAdminProfile,
  getAllProducts,
  getAllOrders,
  getAllPayments,
  getAllCustomers,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔐 Admin Login
router.post("/login", adminLogin);  // <-- use adminLogin, not authUser

// 📊 Dashboard Data
router.get("/dashboard", protect, adminOnly, getDashboardStats);

// 👤 Admin Profile
router.get("/profile", protect, adminOnly, getAdminProfile);
router.put("/profile", protect, adminOnly, updateAdminProfile);

// 📦 Products Management
router.get("/products", protect, adminOnly, getAllProducts);

// 📋 Orders Management
router.get("/orders", protect, adminOnly, getAllOrders);

// 💳 Payments Management
router.get("/payments", protect, adminOnly, getAllPayments);

// 👥 Customers Management
router.get("/customers", protect, adminOnly, getAllCustomers);

export default router;
