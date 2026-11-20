// backend/routes/userRoute.js
import express from "express";
import {
  authUser,
  registerUser,
  createOrUpdateCustomer,
  getUserProfile,
  updateUserProfile,
  addUserAddress,
  deleteUserAddress,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", authUser);
router.post("/customer", createOrUpdateCustomer);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.post("/profile/addresses", protect, addUserAddress);
router.delete("/profile/addresses/:addressId", protect, deleteUserAddress);

export default router;
