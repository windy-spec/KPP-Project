import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  product_name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unit_price: {
    type: Number,
    required: true,
  },
  total_price: {
    // Thêm trường này để lưu thành tiền của từng món (SL * Giá)
    type: Number,
  },
  applied_discount_amount: {
    type: Number,
    default: 0,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // --- [MỚI] Trường quan trọng để đối soát Momo ---
    momoOrderId: {
      type: String,
      unique: true, // Đảm bảo không trùng
      sparse: true, // Cho phép null (với đơn COD hoặc Bank)
    },
    // -----------------------------------------------

    recipient_info: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    items: [invoiceItemSchema],

    payment_method: {
      type: String,
      enum: ["COD", "MOMO_QR", "BANK_TRANSFER"], // Định rõ các loại thanh toán
      required: true,
    },

    // --- [MỚI] Thêm phí ship để tính toán chính xác ---
    shipping_fee: {
      type: Number,
      default: 0,
    },

    discount_applied: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "SHIPPED", "CANCELLED", "DELIVERED"],
      default: "PENDING",
    },
    invoice_date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
