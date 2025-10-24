import express from "express";
import {
  getShippingDetails,
  createShipping,
  updateShipping,
  deleteShipping,
} from "../controllers/shippingController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, getShippingDetails);
router.post("/", protect, createShipping);
router.put("/:id", protect, adminOnly, updateShipping);
router.delete("/:id", protect, adminOnly, deleteShipping);

export default router;
