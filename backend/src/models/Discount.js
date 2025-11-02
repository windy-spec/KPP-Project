// backend/src/models/Discount.js
import mongoose from "mongoose";

const DiscountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["SALE", "AGENCY"],
      required: true,
    },
    target_type: {
      type: String,
      enum: ["PRODUCT", "CATEGORY", "ORDER_TOTAL"],
      required: true,
    },
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "target_type", // Cho phép dynamic ref (Product/Category)
      default: null,
    },
    discount_percent: { type: Number, min: 0, max: 100, required: true },
    min_quantity: { type: Number, default: 1 },
    start_sale: { type: Date, required: true },
    end_sale: { type: Date },
    isActive: { type: Boolean, default: true },

    // 🔥 Quan trọng: thêm reference tới các DiscountTier
    tiers: [{ type: mongoose.Schema.Types.ObjectId, ref: "DiscountTier" }],

    // Nếu bạn có chương trình khuyến mãi tổng (SaleProgram)
    program_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SaleProgram",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Discount", DiscountSchema);
