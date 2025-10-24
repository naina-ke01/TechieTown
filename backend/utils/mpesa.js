// backend/utils/mpesa.js
import axios from "axios";
import logger from "./logger.js";

const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL,
  MPESA_ENV = "sandbox", // sandbox or production
} = process.env;

// M-Pesa API URLs
const SANDBOX_BASE = "https://sandbox.safaricom.co.ke";
const PRODUCTION_BASE = "https://api.safaricom.co.ke";
const BASE_URL = MPESA_ENV === "production" ? PRODUCTION_BASE : SANDBOX_BASE;

// === Generate Access Token ===
export async function getAccessToken() {
  try {
    const auth = Buffer.from(
      `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    const response = await axios.get(
      `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    logger.info("✅ M-Pesa access token obtained");
    return response.data.access_token;
  } catch (error) {
    logger.error("❌ Failed to get M-Pesa access token:", error.response?.data || error.message);
    throw new Error("Failed to authenticate with M-Pesa");
  }
}

// === Generate Password ===
export function generatePassword() {
  const timestamp = getTimestamp();
  const password = Buffer.from(
    `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
  ).toString("base64");
  return { password, timestamp };
}

// === Get Timestamp (YYYYMMDDHHmmss) ===
export function getTimestamp() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  
  return `${year}${month}${day}${hour}${minute}${second}`;
}

// === Format Phone Number ===
export function formatPhoneNumber(phone) {
  // Remove all non-digit characters
  phone = phone.replace(/\D/g, "");
  
  // Convert to 254 format
  if (phone.startsWith("0")) {
    phone = "254" + phone.substring(1);
  } else if (phone.startsWith("7") || phone.startsWith("1")) {
    phone = "254" + phone;
  } else if (phone.startsWith("254")) {
    // Already in correct format
  } else if (phone.startsWith("+254")) {
    phone = phone.substring(1);
  }
  
  // Validate format (should be 254XXXXXXXXX - 12 digits)
  if (!/^254[71]\d{8}$/.test(phone)) {
    throw new Error(`Invalid phone number format: ${phone}. Must be Safaricom number (07XX or 01XX)`);
  }
  
  return phone;
}

// === STK Push ===
export async function initiateSTKPush(phone, amount, accountReference = "TechieTown", transactionDesc = "Payment") {
  try {
    // Validate inputs
    if (!phone || !amount) {
      throw new Error("Phone and amount are required");
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);
    
    // Ensure amount is a number
    const numericAmount = Math.ceil(Number(amount));
    if (isNaN(numericAmount) || numericAmount < 1) {
      throw new Error("Invalid amount. Must be at least 1 KES");
    }

    // Get access token
    const accessToken = await getAccessToken();
    
    // Generate password and timestamp
    const { password, timestamp } = generatePassword();

    // Build callback URL
    const callbackUrl = MPESA_CALLBACK_URL || `${process.env.NGROK_URL}/api/payments/callback`;
    
    logger.info(`📲 Initiating STK Push: ${formattedPhone} - KES ${numericAmount}`);
    logger.info(`🔗 Callback URL: ${callbackUrl}`);

    // STK Push request payload
    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: numericAmount,
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    };

    logger.info("📦 STK Push Payload:", JSON.stringify(payload, null, 2));

    // Send request to M-Pesa
    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    logger.info("✅ STK Push Response:", JSON.stringify(response.data, null, 2));

    return {
      success: true,
      message: "STK Push sent successfully",
      data: response.data,
    };
  } catch (error) {
    const errorMessage = error.response?.data?.errorMessage || error.message;
    const errorCode = error.response?.data?.errorCode;
    
    logger.error("❌ STK Push Error:", {
      message: errorMessage,
      code: errorCode,
      fullError: error.response?.data || error.message,
    });

    throw new Error(errorMessage || "Failed to initiate STK Push");
  }
}

// === Query STK Push Status ===
export async function queryStkPushStatus(checkoutRequestId) {
  try {
    const accessToken = await getAccessToken();
    const { password, timestamp } = generatePassword();

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    logger.info("✅ STK Query Response:", response.data);
    return response.data;
  } catch (error) {
    logger.error("❌ STK Query Error:", error.response?.data || error.message);
    throw error;
  }
}