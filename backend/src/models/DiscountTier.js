// backend/src/models/DiscountTier.js
import mongoose from "mongoose";

const DiscountTierSchema = new mongoose.Schema(
  {
    discount_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discount",
      required: true,
    },
    min_quantity: { type: Number, required: true, min: 1 },
    discount_percent: { type: Number, required: true, min: 0, max: 100 },
  },
  { timestamps: true }
);

export default mongoose.model("DiscountTier", DiscountTierSchema);
