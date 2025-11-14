// models/Cart.js
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },
  price_original: { type: Number, default: 0 },
  price_discount: { type: Number, default: 0 },
  Total_price: { type: Number, default: 0 },
  manual_discount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Discount",
    default: null,
  },
  applied_discount: {
    discount_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discount",
      default: null,
    },
    program_name: { type: String, default: null },
    discount_percent: { type: Number, default: 0 },
    saved_amount: { type: Number, default: 0 },
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestCartId: {
      type: String,
      default: null,
    },
    items: [cartItemSchema],
    total_quantity: { type: Number, default: 0 },
    total_original_price: { type: Number, default: 0 },
    total_discount_amount: { type: Number, default: 0 },
    final_total_price: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// TTL remove guest carts after 30 minutes of inactivity
cartSchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: 1800,
    partialFilterExpression: { user: null },
  }
);

cartSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { user: { $ne: null } } }
);

cartSchema.index(
  { guestCartId: 1 },
  { unique: true, partialFilterExpression: { guestCartId: { $ne: null } } }
);

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
