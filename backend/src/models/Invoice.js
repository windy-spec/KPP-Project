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
    momoOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    recipient_info: {
      name: String,
      phone: String,
      address: String, // Lưu địa chỉ đầy đủ (VD: 123 Lê Lợi, Quận 1, Hồ Chí Minh)
      note: String,
    },
    items: [invoiceItemSchema],

    // Phương thức thanh toán
    payment_method: {
      type: String,
      enum: ["COD", "MOMO_QR", "BANK_TRANSFER"],
      required: true,
    },

    shipping_fee: Number,
    total_amount: Number,

    //  1. Trạng thái thanh toán (Tách riêng)
    payment_status: {
      type: String,
      enum: ["UNPAID", "PAID"],
      default: "UNPAID",
    },

    //  2. Trạng thái tiến độ đơn hàng (4 bước theo yêu cầu)
    order_status: {
      type: String,
      enum: ["PLACED", "PREPARING", "SHIPPING", "COMPLETED", "CANCELLED"],
      default: "PLACED",
    },

    //  3. Thời gian bắt đầu giao hàng (Để tính 3 ngày/7 ngày)
    shipped_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
