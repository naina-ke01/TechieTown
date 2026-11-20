import Product from "../models/productModel.js";
import path from "path";
import asyncHandler from "express-async-handler";

export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json({ success: true, products });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ success: true, product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, price, brand, category, description, stock } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null; // Adjusted path for frontend access

  // Note: Validation is handled by Mongoose model
  const product = new Product({ name, price, brand, category, description, stock, image });
  const created = await product.save();
  res.status(201).json({ success: true, message: "Product created", product: created });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const updates = req.body;
  if (req.file) updates.image = `/admin/uploads/${req.file.filename}`;

  const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json({ success: true, message: "Product updated", product: updated });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Product deleted" });
});
