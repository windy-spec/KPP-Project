// src/routes/invoiceRoute.js
import express from "express";
import Invoice from "../models/Invoice.js";
import { protectedRoute, verifyAdmin } from "../middlewares/authMiddlewares.js";
import { getInvoiceById } from "../controllers/invoiceController.js";

const router = express.Router();

// ===========================
// LẤY TOÀN BỘ HÓA ĐƠN (ADMIN)
// ===========================
router.get("/", protectedRoute, verifyAdmin, async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("user", "name email")
      .populate("items.product_id", "name price");
    res.json(invoices);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy hóa đơn", detail: error.message });
  }
});

// ===========================
// LẤY HÓA ĐƠN CỦA USER HIỆN TẠI
// ===========================
router.get("/me", protectedRoute, async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id }).populate(
      "items.product_id",
      "name price"
    );
    res.json(invoices);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy hóa đơn của bạn", detail: error.message });
  }
});
router.get("/:id", protectedRoute, getInvoiceById);

export default router;
