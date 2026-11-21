import express from "express";
import {
  initiateStkPush,
  mpesaCallback,
  queryPaymentStatus,
} from "../controllers/mpesaController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Initiate STK Push
router.post("/stkpush", protect, initiateStkPush);

// M-Pesa callback endpoint
router.post("/stkpush/callback", mpesaCallback);

// Poll payment status
router.get("/status/:checkoutRequestId", queryPaymentStatus);

export default router;
