import express from "express";
import { processVisaPayment } from "../controllers/visaController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/visa/pay
 * @desc    Process Visa payment
 * @access  Public
 */
router.post("/pay", protect, processVisaPayment);

/**
 * @route   GET /api/visa/ping
 * @desc    Health check for visa route
 */
router.get("/ping", (req, res) => {
    res.json({ status: "ok", message: "Visa payment route active ✅" });
});

export default router;
