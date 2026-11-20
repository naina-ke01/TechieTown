// backend/routes/mpesaRoutes.js
import express from "express";
import { stkPush, mpesaCallback } from "../controllers/mpesaController.js";

const router = express.Router();

/**
 * @route   POST /api/payments/stkpush
 * @desc    Initiate M-Pesa STK Push request
 * @access  Public (User payment initiation)
 */
router.post("/stkpush", stkPush);

/**
 * @route   POST /api/payments/callback
 * @desc    Safaricom M-Pesa callback endpoint
 * @access  Public (Safaricom servers)
 */
router.post("/callback", express.json({ type: "*/*" }), mpesaCallback);

/**
 * @route   GET /api/payments/ping
 * @desc    Health check for payment route
 */
router.get("/ping", (req, res) => {
  res.json({ status: "ok", message: "M-Pesa route active ✅" });
});

export default router;
