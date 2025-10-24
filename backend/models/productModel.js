// models/productModel.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"] },
    image: { type: String },
    price: { type: Number, required: [true, "Product price is required"] },
    brand: { type: String },
    category: { type: String },
    stock: { type: Number, default: 0 },
    description: { type: String },
  },
  { timestamps: true }
);

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
