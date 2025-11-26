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
    momoOrderId: { type: String },
    recipient_info: {
      name: String,
      phone: String,
      address: String,
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
