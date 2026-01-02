import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  description: String,
  quantity: Number,
  avatar: String, //  ảnh đại diện chính
  images: [String], //  các ảnh phụ
});

export default mongoose.model("Product", ProductSchema);
