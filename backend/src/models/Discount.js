import mongoose from "mongoose";

const DiscountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["SALE", "AGENCY"],
      required: true,
    },
    target_type: {
      type: String,
      enum: ["PRODUCT", "CATEGORY", "ORDER_TOTAL", "ALL"],
      required: true,
    },

    // 🚨 ĐÃ SỬA: Chuyển thành Mảng để lưu nhiều ID
    target_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        // Không cần ref cố định vì ta sẽ query thủ công trong controller
      },
    ],

    discount_percent: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    min_quantity: {
      type: Number,
      default: 1,
    },
    start_sale: {
      type: Date,
      required: true,
    },
    end_sale: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tiers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DiscountTier",
      },
    ],
    program_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SaleProgram",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Discount", DiscountSchema);
