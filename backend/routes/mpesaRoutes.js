import express from "express";
import {
  initiateStkPush,
  mpesaCallback,
  queryPaymentStatus,
  getPaymentByCheckout,
} from "../controllers/mpesaController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ===== STK Push Endpoint =====
router.post("/stkpush", protect, initiateStkPush);

// ===== M-Pesa Callback (Safaricom POSTs here) =====
router.post("/callback", mpesaCallback);

// ===== Query Payment Status =====
router.get("/status/:checkoutRequestId", queryPaymentStatus);

// ===== Get Payment from Database =====
router.get("/payment/:checkoutRequestId", getPaymentByCheckout);

export default router;
