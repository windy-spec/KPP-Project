import mongoose from "mongoose";
const invoiceItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  applied_discount_amount: { type: Number, default: 0 },
});
const invoiceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient_info: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
  },
  items: [invoiceItemSchema],
  payment_method: { type: String, required: true },
  discount_applied: { type: Number, default: 0 },
  total_amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["PENDING", "PAID", "SHIPPED", "CANCELLED"],
    default: "PENDING",
  },

  invoice_date: { type: Date, default: Date.now },
});

const invoice = mongoose.model("invoice", invoiceSchema);
