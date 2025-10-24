import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// === 🔒 Protect Middleware ===
// Checks for a valid JWT and attaches the user to req.user
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authorized, token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user and exclude password field
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Auth Error:", err.message);
    res.status(401).json({ error: "Not authorized, invalid or expired token" });
  }
};

// === 🛡️ Admin Only Middleware ===
// Ensures the logged-in user has admin privileges
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authorized" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};
