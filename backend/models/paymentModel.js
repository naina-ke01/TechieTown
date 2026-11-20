// backend/models/paymentModel.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // User/Customer info
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },

    // M-Pesa Transaction Info
    checkoutRequestId: {
      type: String,
      unique: true,
      sparse: true,
      // index: true removed - using schema.index() below instead
    },
    merchantRequestId: {
      type: String,
    },
    mpesaReceiptNumber: {
      type: String,
    },
    transactionDate: {
      type: String,
    },

    // Status
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Cancelled"],
      default: "Pending",
    },
    resultCode: {
      type: Number,
    },
    resultDesc: {
      type: String,
    },

    // Transaction Type
    transactionType: {
      type: String,
      enum: ["STK_PUSH", "C2B", "B2C", "MANUAL", "VISA MANUAL"],
      default: "STK_PUSH",
    },

    // Order Reference (if linked to an order)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    // Payment Method
    paymentMethod: {
      type: String,
      enum: ["M-Pesa", "Visa"],
      default: "M-Pesa",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries (removed checkoutRequestId since unique:true already creates index)
paymentSchema.index({ phoneNumber: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;