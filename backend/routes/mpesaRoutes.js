// backend/routes/mpesaRoutes.js
import express from "express";
import {
  initiateStkPush,
  mpesaCallback,
  queryPaymentStatus,
  getPaymentByCheckout,
} from "../controllers/mpesaController.js";

const router = express.Router();

// ===== STK Push Endpoint =====
router.post("/stkpush", initiateStkPush);

// ===== M-Pesa Callback (Safaricom POSTs here) =====
router.post("/callback", mpesaCallback);

// ===== Query Payment Status =====
router.get("/status/:checkoutRequestId", queryPaymentStatus);

// ===== Get Payment from Database =====
router.get("/payment/:checkoutRequestId", getPaymentByCheckout);

export default router;