// backend/controllers/userController.js
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};


// POST /api/users/login
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.status(401); // Use 401 for unauthorized
    throw new Error("Invalid credentials");
  }
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid credentials");
  }


  // If this is an admin login route, ensure the user is an admin
  if (req.path.includes("admin") && user.role !== "admin") {
    res.status(403); // Use 403 for forbidden
    throw new Error("Access denied. Not an admin.");
  }

  res.json({
    message: "Login successful",
    token: generateToken(user),
    // Send back a consistent user object
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /api/users/register
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  // Validate input
  if (!name || !normalizedEmail || !password) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  // Check if user already exists
  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email");
  }

  // Validate password length
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  // Create user
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: "customer", // Default role is customer
  });

  if (user) {
    res.status(201).json({
      message: "Registration successful",
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// POST /api/users/customer
// Creates or updates a customer record during checkout
export const createOrUpdateCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    res.status(400);
    throw new Error("Email is required");
  }

  // Find user by email
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    // Update existing user info if they are a customer
    if (user.role === "customer") {
      user.name = name || user.name;
      user.phoneNumber = phone || user.phoneNumber;
      await user.save();
    }
  } else {
    // Create new customer (password is optional for customers)
    user = await User.create({
      name: name || "Guest Customer",
      email: normalizedEmail,
      phoneNumber: phone,
      role: "customer"
    });
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phoneNumber
    }
  });
});

// GET /api/users/profile
export const getUserProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phoneNumber: req.user.phoneNumber || "",
      addresses: req.user.addresses || [],
    },
  });
});

// PUT /api/users/profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, phoneNumber } = req.body;

  if (name !== undefined) {
    if (!name.trim()) {
      res.status(400);
      throw new Error("Name is required");
    }
    req.user.name = name.trim();
  }

  if (email !== undefined) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      res.status(400);
      throw new Error("Email is required");
    }
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user._id },
    });
    if (existingUser) {
      res.status(409);
      throw new Error("An account already uses this email");
    }
    req.user.email = normalizedEmail;
  }

  if (phoneNumber !== undefined) req.user.phoneNumber = phoneNumber.trim();

  await req.user.save();
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phoneNumber: req.user.phoneNumber || "",
      addresses: req.user.addresses || [],
    },
  });
});

// POST /api/users/profile/addresses
export const addUserAddress = asyncHandler(async (req, res) => {
  const { label, street, city, postalCode, country } = req.body;
  if (![label, street, city, postalCode, country].every((value) => typeof value === "string" && value.trim())) {
    res.status(400);
    throw new Error("Complete all address fields");
  }

  req.user.addresses.push({
    label: label.trim(),
    street: street.trim(),
    city: city.trim(),
    postalCode: postalCode.trim(),
    country: country.trim(),
  });
  await req.user.save();
  res.status(201).json({ success: true, addresses: req.user.addresses });
});

// DELETE /api/users/profile/addresses/:addressId
export const deleteUserAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }

  address.deleteOne();
  await req.user.save();
  res.json({ success: true, addresses: req.user.addresses });
});
