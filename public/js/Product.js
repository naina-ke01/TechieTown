import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  stock: Number,
  category: String,
  image: String, // URL or path
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
