import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import Product from "../models/ProductModel.js";
import Order from "../models/orderModel.js";
import Payment from "../models/paymentModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key_here";

// === 🔐 Admin Login ===
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ 
        message: "Invalid credentials" 
      });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return res.status(403).json({ 
        message: "Access denied. Admin privileges required." 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Invalid credentials" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Admin login successful:", user.email);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error("❌ Admin login error:", error);
    res.status(500).json({ 
      message: "Internal server error during login" 
    });
  }
};

// === 📊 Get Dashboard Stats ===
export const getDashboardStats = async (req, res) => {
  try {
    const [productsCount, ordersCount, paymentsCount, recentOrders] = 
      await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        Payment.countDocuments(),
        Order.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("user", "name email")
          .select("_id user totalAmount status createdAt")
      ]);

    res.json({
      success: true,
      products: productsCount,
      orders: ordersCount,
      payments: paymentsCount,
      recentOrders: recentOrders.map(order => ({
        _id: order._id,
        customer: order.user?.name || order.user?.email || "Guest",
        amount: order.totalAmount || 0,
        status: order.status || "Pending",
        date: order.createdAt
      }))
    });

  } catch (error) {
    console.error("❌ Dashboard stats error:", error);
    res.status(500).json({ 
      message: "Error loading dashboard statistics" 
    });
  }
};

// === 👤 Get Admin Profile ===
export const getAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};