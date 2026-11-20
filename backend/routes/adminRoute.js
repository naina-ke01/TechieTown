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
router.get("/dashboard", getDashboardStats);

// 👤 Admin Profile
router.get("/profile", getAdminProfile);
router.put("/profile", updateAdminProfile);

// 📦 Products Management
router.get("/products", getAllProducts);

// 📋 Orders Management
router.get("/orders", protect, adminOnly, getAllOrders);

// 💳 Payments Management
router.get("/payments", getAllPayments);

// 👥 Customers Management
router.get("/customers", getAllCustomers);

export default router;
