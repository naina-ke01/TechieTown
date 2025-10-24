import express from "express";
import { stkPush, mpesaCallback, getPaymentStatus } from "../controllers/mpesaController.js";

const router = express.Router();

// Initiate STK Push
router.post("/stkpush", stkPush);

// M-Pesa callback endpoint
router.post("/stkpush/callback", mpesaCallback);

// Poll payment status
router.get("/status/:checkoutRequestId", getPaymentStatus);

export default router;
