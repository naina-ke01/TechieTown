import Product from "../models/productModel.js";
import path from "path";

export const getProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

export const createProduct = async (req, res) => {
  const { name, price, brand, category, description, stock } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const product = new Product({ name, price, brand, category, description, stock, image });
  const created = await product.save();
  res.status(201).json(created);
};

export const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const updates = req.body;
  if (req.file) updates.image = `/uploads/${req.file.filename}`;

  const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json(updated);
};

export const deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
};
