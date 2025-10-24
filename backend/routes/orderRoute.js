import express from "express";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import nodemailer from "nodemailer";
const router = express.Router();

// POST /api/orders - create order
router.post("/", async (req, res) => {
  const { items, shipping, user } = req.body;
  const total = items.reduce((s, it) => s + it.price * it.quantity, 0) + (shipping?.cost || 0);
  const order = new Order({ user, items, shipping, total });
  await order.save();

  // reduce stock
  for (const it of items) {
    await Product.findByIdAndUpdate(it.product, { $inc: { stock: -it.quantity } });
  }

  // send confirmation email (optional)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS && req.body.email) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: req.body.email,
      subject: "Order Received - TechieTown",
      text: `Thanks for your order. Order total: KES ${total}. Order ID: ${order._id}`
    });
  }

  res.json({ message: "Order created", order });
});

// GET /api/orders (admin)
router.get("/", async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate("user");
  res.json(orders);
});

export default router;
