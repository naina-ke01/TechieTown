// backend/controllers/mpesaController.js
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Payment from "../models/paymentModel.js";
import logger from "../utils/logger.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
const CALLBACK_FILE = path.join(logsDir, "mpesa-callbacks.json");

// ===== Format Phone Number =====
function formatPhoneNumber(phone) {
  phone = phone.replace(/\D/g, ""); // Remove non-digits
  
  if (phone.startsWith("0")) {
    phone = "254" + phone.substring(1);
  } else if (phone.startsWith("7") || phone.startsWith("1")) {
    phone = "254" + phone;
  } else if (phone.startsWith("+254")) {
    phone = phone.substring(1);
  }
  
  // Validate Safaricom number
  if (!/^254[71]\d{8}$/.test(phone)) {
    throw new Error(`Invalid Safaricom number: ${phone}`);
  }
  
  return phone;
}

// ===== Get M-Pesa Access Token =====
async function getAccessToken() {
  try {
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    logger.info("✅ M-Pesa access token obtained");
    return response.data.access_token;
  } catch (error) {
    logger.error("❌ Failed to get M-Pesa token: " + (error.response?.data || error.message));
    throw new Error("Failed to authenticate with M-Pesa");
  }
}

// ===== Generate Password & Timestamp =====
function generatePassword() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString("base64");
  
  return { password, timestamp };
}

// ===== Initiate STK Push =====
export const initiateStkPush = async (req, res) => {
  try {
    let { phone, amount } = req.body;

    // Validate input
    if (!phone || !amount) {
      return res.status(400).json({
        success: false,
        message: "Phone number and amount are required",
      });
    }

    // Format phone number
    try {
      phone = formatPhoneNumber(phone);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // Validate amount
    amount = Math.ceil(Number(amount));
    if (isNaN(amount) || amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Must be at least 1 KES",
      });
    }

    logger.info(`📲 Initiating STK Push: ${phone} - KES ${amount}`);

    // Get access token
    const accessToken = await getAccessToken();

    // Generate password and timestamp
    const { password, timestamp } = generatePassword();

    // Build callback URL
    const callbackUrl = process.env.MPESA_CALLBACK_URL || 
      process.env.BASE_URL + "/api/payments/callback" ||
      process.env.NGROK_URL + "/api/payments/callback" ||
      `${req.protocol}://${req.get("host")}/api/payments/callback`;

    logger.info(`🔗 Callback URL: ${callbackUrl}`);

    // STK Push payload
    const stkRequest = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: "TechieTown",
      TransactionDesc: "Payment for TechieTown",
    };

    logger.info("📦 STK Request: " + JSON.stringify(stkRequest, null, 2));

    // Send STK Push request
    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      stkRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    logger.info("✅ STK Push Response: " + JSON.stringify(response.data, null, 2));

    // Save payment to database
    try {
      await Payment.create({
        phoneNumber: phone,
        amount: amount,
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        status: "Pending",
        transactionType: "STK_PUSH",
      });
      logger.info("💾 Payment record saved to database");
    } catch (dbError) {
      logger.error("⚠️ Failed to save payment to DB: " + dbError.message);
      // Don't fail the request if DB save fails
    }

    res.json({
      success: true,
      message: "STK Push sent successfully. Check your phone.",
      data: {
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        customerMessage: response.data.CustomerMessage,
      },
    });
  } catch (error) {
    logger.error("❌ STK Push Error: " + (error.response?.data || error.message));
    
    const errorMessage = error.response?.data?.errorMessage || 
                        error.response?.data?.ResponseDescription || 
                        error.message;

    res.status(500).json({
      success: false,
      message: errorMessage || "Failed to initiate payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ===== M-Pesa Callback Handler =====
export const mpesaCallback = async (req, res) => {
  try {
    logger.info("📥 M-Pesa Callback Received");
    logger.info("Callback Body: " + JSON.stringify(req.body, null, 2));

    // Save callback to file for debugging
    let callbacks = [];
    if (fs.existsSync(CALLBACK_FILE)) {
      try {
        callbacks = JSON.parse(fs.readFileSync(CALLBACK_FILE, "utf8"));
      } catch (e) {
        callbacks = [];
      }
    }

    callbacks.push({
      timestamp: new Date().toISOString(),
      data: req.body,
    });

    fs.writeFileSync(CALLBACK_FILE, JSON.stringify(callbacks, null, 2));

    // Extract callback data
    const { Body } = req.body;
    if (!Body || !Body.stkCallback) {
      logger.warn("⚠️ Invalid callback structure");
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const { stkCallback } = Body;
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // Prepare update data
    const updateData = {
      merchantRequestId: MerchantRequestID,
      checkoutRequestId: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
    };

    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata?.Item || [];
      const getItemValue = (name) =>
        metadata.find((item) => item.Name === name)?.Value;

      updateData.status = "Completed";
      updateData.mpesaReceiptNumber = getItemValue("MpesaReceiptNumber");
      updateData.transactionDate = getItemValue("TransactionDate");
      updateData.phoneNumber = getItemValue("PhoneNumber")?.toString();
      updateData.amount = getItemValue("Amount");

      logger.info(`✅ Payment Successful: ${updateData.mpesaReceiptNumber}`);
    } else {
      // Payment failed or cancelled
      updateData.status = "Failed";
      logger.warn(`⚠️ Payment Failed: ${ResultDesc}`);
    }

    // Update payment in database
    try {
      const payment = await Payment.findOneAndUpdate(
        { checkoutRequestId: CheckoutRequestID },
        updateData,
        { new: true, upsert: true }
      );
      logger.info("💾 Payment updated in database: " + payment._id);
    } catch (dbError) {
      logger.error("❌ Failed to update payment in DB: " + dbError.message);
    }

    // Acknowledge receipt to Safaricom
    res.json({
      ResultCode: 0,
      ResultDesc: "Callback received successfully",
    });
  } catch (error) {
    logger.error("❌ Callback Error: " + error.message);
    res.status(500).json({
      ResultCode: 1,
      ResultDesc: "Callback processing failed",
    });
  }
};

// ===== Query Payment Status from M-Pesa =====
export const queryPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        message: "CheckoutRequestID is required",
      });
    }

    const accessToken = await getAccessToken();
    const { password, timestamp } = generatePassword();

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    logger.info("✅ Query Response: " + JSON.stringify(response.data));

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    logger.error("❌ Query Error: " + (error.response?.data || error.message));
    res.status(500).json({
      success: false,
      message: error.message || "Failed to query payment status",
    });
  }
};

// ===== Get Payment from Database =====
export const getPaymentByCheckout = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    const payment = await Payment.findOne({ checkoutRequestId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.json({
      success: true,
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        phoneNumber: payment.phoneNumber,
        mpesaReceiptNumber: payment.mpesaReceiptNumber,
        resultDesc: payment.resultDesc,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    logger.error("❌ Get Payment Error: " + error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get payment",
    });
  }
};