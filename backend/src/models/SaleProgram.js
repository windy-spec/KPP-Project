import mongoose from "mongoose";

const SaleProgramSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },

    description: {
      type: String,
    },

    // Thời gian diễn ra toàn chương trình
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },

    // Các discount nằm trong chương trình
    discounts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Discount",
      },
    ],

    // Banner, thumbnail hiển thị ở FE
    banner_image: {
      type: String,
    },

    // Tình trạng hoạt động
    isActive: {
      type: Boolean,
      default: true,
    },

    // Người tạo chương trình
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const SaleProgram = mongoose.model("SaleProgram", SaleProgramSchema);
export default SaleProgram;
