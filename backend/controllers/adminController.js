// =====================================================
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import Payment from "../models/paymentModel.js";

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// =======================
// 🔐 ADMIN LOGIN
// =======================
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    console.log("🟡 Admin login attempt received");
    console.log("📧 Email:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await User.findOne({ email: normalizedEmail, role: "admin" });
    if (!admin) {
      console.warn("❌ No admin found with that email");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("🔑 Password match result:", isMatch);

    if (!isMatch) {
      console.warn("❌ Invalid password");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("✅ Admin login successful:", admin.email);
    const token = generateToken(admin);
    console.log("🎟️ Generated Token (prefix):", token.substring(0, 15));

    res.json({
      message: "Login successful",
      token: token,
      user: {
        id: admin._id,
        name: admin.name || "Admin",
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("❌ Admin login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =======================
// 📊 DASHBOARD STATS (Real Data)
// =======================
export const getDashboardStats = async (req, res) => {
  try {
    console.log("📊 Fetching dashboard stats from MongoDB...");

    // Get counts from database
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const paymentCount = await Payment.countDocuments({ status: "Completed" });

    // Get recent orders (last 10)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "name email")
      .lean();

    // Get recent payments (last 10 completed)
    const recentPayments = await Payment.find({ status: "Completed" })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Calculate total revenue
    const totalRevenue = await Payment.aggregate([
      { $match: { status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Get sales by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesByDay = await Payment.aggregate([
      {
        $match: {
          status: "Completed",
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format orders for frontend
    const formattedOrders = recentOrders.map(order => ({
      _id: order._id,
      userEmail: order.user?.email || "Guest",
      userName: order.user?.name || "Guest",
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt
    }));

    // Format payments for frontend
    const formattedPayments = recentPayments.map(payment => ({
      _id: payment._id,
      transactionId: payment.mpesaReceiptNumber || payment.checkoutRequestId,
      amount: payment.amount,
      phoneNumber: payment.phoneNumber,
      status: payment.status,
      createdAt: payment.createdAt
    }));

    const data = {
      counts: {
        productCount,
        orderCount,
        paymentCount,
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        currency: "KES"
      },
      salesByDay,
      recentOrders: formattedOrders,
      recentPayments: formattedPayments,
      message: "✅ Real data from MongoDB"
    };

    console.log("✅ Dashboard data prepared:", {
      products: productCount,
      orders: orderCount,
      payments: paymentCount,
      revenue: data.revenue.total
    });

    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching dashboard stats:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =======================
// 👤 ADMIN PROFILE
// =======================
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      name: admin.name || "Admin",
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt,
    });
  } catch (err) {
    console.error("❌ Error fetching admin profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =======================
// 🔄 UPDATE ADMIN PROFILE
// =======================
export const updateAdminProfile = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (name) admin.name = name;
    if (email) admin.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    await admin.save();

    console.log("✅ Admin profile updated:", admin.email);

    res.json({
      message: "Profile updated successfully",
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("❌ Error updating admin profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =======================
// 📦 GET ALL PRODUCTS
// =======================
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ message: "Internal server error" });
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
      .populate("products.product", "name price");

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =======================
// 💳 GET ALL PAYMENTS
// =======================
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (err) {
    console.error("❌ Error fetching payments:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =======================
// 👥 GET ALL CUSTOMERS
// =======================
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: "customer" })
      .sort({ createdAt: -1 })
      .select("-password");

    res.json({
      success: true,
      count: customers.length,
      customers
    });
  } catch (err) {
    console.error("❌ Error fetching customers:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
