//------ backend/controllers/orderController.js
// =====================================================
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Payment from "../models/paymentModel.js";
import User from "../models/userModel.js";

// =======================
// 📝 CREATE ORDER
// =======================
export const createOrder = async (req, res) => {
  try {
    const { products, shippingAddress, paymentMethod } = req.body;

    // Validate input
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products are required"
      });
    }
    if (typeof shippingAddress !== "string" || !shippingAddress.trim()) {
      return res.status(400).json({
        success: false,
        message: "A shipping address is required"
      });
    }
    if (paymentMethod && !["M-Pesa", "Visa"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method"
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderProducts = [];

    for (const item of products) {
      const quantity = Number(item.quantity);
      if (!item.productId || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Each product must have a valid ID and quantity"
        });
      }

      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      totalAmount += product.price * quantity;

      orderProducts.push({
        product: product._id,
        quantity
      });
    }

    // Create order
    const order = await Order.create({
      user: req.user._id,
      products: orderProducts,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || "M-Pesa",
      paymentStatus: "Pending"
    });

    // Update product stock
    for (const item of orderProducts) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    console.log("✅ Order created:", order._id);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        id: order._id,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus
      }
    });

  } catch (err) {
    console.error("❌ Create order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create order"
    });
  }
};

// =======================
// 📋 GET THE AUTHENTICATED USER'S ORDERS
// =======================
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("products.product", "name price image");

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    console.error("❌ Get customer orders error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your orders"
    });
  }
};

// =======================
// 📋 GET ALL ORDERS
// =======================
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("products.product", "name price image");

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    console.error("❌ Get orders error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

// =======================
// 🔍 GET ORDER BY ID
// =======================
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("user", "name email phoneNumber")
      .populate("products.product", "name price image");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (req.user.role !== "admin" && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order"
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (err) {
    console.error("❌ Get order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order"
    });
  }
};

// =======================
// 🔄 UPDATE ORDER STATUS
// =======================
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, fulfillmentStatus, trackingNumber, estimatedDelivery } = req.body;
    const update = {};

    if (paymentStatus !== undefined) {
      if (!["Pending", "Paid", "Failed"].includes(paymentStatus)) {
        return res.status(400).json({ success: false, message: "Invalid payment status" });
      }
      update.paymentStatus = paymentStatus;
      if (paymentStatus === "Paid") update.fulfillmentStatus = "Processing";
    }

    if (fulfillmentStatus !== undefined) {
      if (!["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].includes(fulfillmentStatus)) {
        return res.status(400).json({ success: false, message: "Invalid fulfillment status" });
      }
      update.fulfillmentStatus = fulfillmentStatus;
    }

    if (trackingNumber !== undefined) update.trackingNumber = trackingNumber;
    if (estimatedDelivery !== undefined) update.estimatedDelivery = estimatedDelivery || null;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: "No order status fields provided" });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      update,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    console.log("✅ Order updated:", order._id);

    res.json({
      success: true,
      message: "Order status updated",
      order
    });
  } catch (err) {
    console.error("❌ Update order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update order"
    });
  }
};
