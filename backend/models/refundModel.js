import mongoose from "mongoose";

const refundSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  reason: { type: String, required: true },
  status: { type: String, default: "Requested" },
  createdAt: { type: Date, default: Date.now }
});

const Refund = mongoose.models.Refund || mongoose.model("Refund", refundSchema);

export default Refund;
