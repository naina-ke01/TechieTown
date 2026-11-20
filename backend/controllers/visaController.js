import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import logger from "../utils/logger.js";

/**
 * @desc    Simulate Visa payment process
 * @route   POST /api/visa/pay
 * @access  Authenticated customer
 */
export const processVisaPayment = async (req, res) => {
    try {
        const { cardNumber, expiry, cvc, orderId, phone } = req.body;

        if (!cardNumber || !expiry || !cvc || !orderId) {
            return res.status(400).json({
                success: false,
                message: "Card details and order ID are required",
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "You are not authorized to pay for this order" });
        }
        const amount = Math.ceil(order.totalAmount);

        logger.info(`💳 Processing Visa Payment: ${amount} for order: ${orderId}`);

        // Simulated payment logic - In a real app, you'd use a payment gateway like Stripe or Braintree
        // For this demonstration, we'll assume any card ending in '4444' fails, and others succeed.

        const isSuccess = !cardNumber.endsWith("4444");

        const paymentData = {
            user: req.user._id,
            phoneNumber: phone || "N/A",
            amount: amount,
            paymentMethod: "Visa",
            status: isSuccess ? "Completed" : "Failed",
            transactionType: "VISA MANUAL",
            resultDesc: isSuccess ? "Visa payment successful (Simulated)" : "Visa payment failed (Simulated)",
            orderId: orderId,
        };

        const payment = await Payment.create(paymentData);

        if (isSuccess && orderId) {
            await Order.findByIdAndUpdate(orderId, {
                paymentStatus: "Paid",
                fulfillmentStatus: "Processing",
            });
            logger.info(`✅ Order ${orderId} updated to Paid via Visa`);
        }

        if (isSuccess) {
            res.status(200).json({
                success: true,
                message: "Visa payment successful",
                paymentId: payment._id,
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Visa payment failed. Please check your card details.",
                paymentId: payment._id,
            });
        }
    } catch (error) {
        logger.error("❌ Visa Payment Error: " + error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error during Visa payment",
        });
    }
};
