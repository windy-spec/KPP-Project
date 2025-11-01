import mongoose from "mongoose";

const DiscountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    // Đối tượng áp dụng: SALE (khách lẻ) / AGENCY (đại lý)
    type: {
      type: String,
      enum: ["SALE", "AGENCY"],
      required: true,
    },

    // Loại khuyến mãi cụ thể (Flash sale, Seasonal, Combo,...)
    promotion_type: {
      type: String,
      enum: ["FLASHSALE", "SEASONAL", "COMBO", "GENERAL"],
      default: "GENERAL",
    },

    // Đối tượng tác động
    target_type: {
      type: String,
      enum: ["PRODUCT", "CATEGORY", "ORDER_TOTAL"],
      required: true,
    },

    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    discount_percent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    min_quantity: {
      type: Number,
      default: 1,
    },

    start_sale: {
      type: Date,
      default: Date.now,
    },

    end_sale: {
      type: Date,
      default: function () {
        const getDateSale = this.start_sale;
        const upOneDay = new Date(getDateSale.getTime() + 24 * 60 * 60 * 1000);
        return upOneDay;
      },
    },

    // Liên kết đến SaleProgram (chương trình khuyến mãi)
    program_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SaleProgram",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Nếu là AGENCY và chưa có ngày kết thúc → mặc định 30 ngày
DiscountSchema.pre("save", function (next) {
  if (this.type === "AGENCY" && !this.end_sale) {
    const startDate = this.start_sale || new Date();
    const defaultEndDate = new Date(startDate.getTime());
    defaultEndDate.setDate(startDate.getDate() + 30);
    this.end_sale = defaultEndDate;
  }
  next();
});

const Discount = mongoose.model("Discount", DiscountSchema);
export default Discount;
