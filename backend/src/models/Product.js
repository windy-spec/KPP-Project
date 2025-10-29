import mongoose, { Schema } from "mongoose";

const ProductSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image_url: {
    type: String,
  },
  is_Active: {
    type: Boolean,
    default: true,
  },
});
const Product = mongoose.model("Product", ProductSchema);
export default Product;
