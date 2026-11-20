import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// === 🔒 Protect Middleware ===
// Checks for a valid JWT and attaches the user to req.user
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing in process.env");
      return res.status(500).json({ message: "Internal Server Error: Auth Secret Missing" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user and exclude password field
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        console.warn("⚠️ Auth: User not found in DB for ID:", decoded.id);
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error("❌ Auth Error:", err.name, "-", err.message);
      const tokenPreview = token ? (typeof token === 'string' ? `${token.substring(0, 15)}...` : typeof token) : "null/empty";

      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Not authorized: Token expired. Please login again." });
      }
      res.status(401).json({ message: `Not authorized: ${err.message}. Token: [${tokenPreview}]` });
    }
  } catch (outerErr) {
    console.error("❌ Fatal Auth Error:", outerErr.message);
    res.status(500).json({ message: "Internal Server Error in Authentication" });
  }
};

// === 🛡️ Admin Only Middleware ===
// Ensures the logged-in user has admin privileges
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};
