import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  product_name: String,
  quantity: Number,
  unit_price: Number,
  total_price: Number,
});

const invoiceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // 🔥 SỬA ĐOẠN NÀY: Thêm unique và sparse để chặn trùng lặp
    momoOrderId: {
      type: String,
      unique: true, // Bắt buộc duy nhất trong toàn bộ DB
      sparse: true, // Cho phép giá trị null/undefined (để đơn COD không bị lỗi)
    },

    recipient_info: {
      name: String,
      phone: String,
      address: String,
      note: String, // Thêm note nếu cần
    },
    items: [invoiceItemSchema],
    payment_method: {
      type: String,
      enum: ["COD", "MOMO_QR", "BANK_TRANSFER"],
      required: true,
    },
    shipping_fee: Number,
    total_amount: Number,
    status: {
      type: String,
      enum: ["PENDING", "PAID", "CANCELLED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
