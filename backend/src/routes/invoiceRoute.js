// src/routes/invoiceRoute.js
import express from "express";
import { protectedRoute, verifyAdmin } from "../middlewares/authMiddlewares.js";
import {
  createInvoice,
  getAllInvoices, // Import hàm này
  getMyInvoices, // Import hàm này
  getInvoiceById,
  updateInvoiceStatus, // Import hàm này (nếu có dùng update)
} from "../controllers/invoiceController.js";

const router = express.Router();

// ===========================
// 1. TẠO HÓA ĐƠN
// ===========================
router.post("/", protectedRoute, createInvoice);

// ===========================
// 2. LẤY HÓA ĐƠN CỦA USER HIỆN TẠI (Frontend gọi /api/invoice/me)
// ===========================
// Route này trả về danh sách CỦA RIÊNG BẠN
router.get("/me", protectedRoute, getMyInvoices);

// ===========================
// 3. LẤY TOÀN BỘ HÓA ĐƠN (CHỈ ADMIN) (Frontend gọi /api/invoice)
// ===========================
// Route này trả về TẤT CẢ (Có verifyAdmin bảo vệ)
router.get("/", protectedRoute, verifyAdmin, getAllInvoices);

// ===========================
// 4. LẤY CHI TIẾT / CẬP NHẬT
// ===========================
router.get("/:id", protectedRoute, getInvoiceById);
router.put("/:id", protectedRoute, verifyAdmin, updateInvoiceStatus); // Route update trạng thái

export default router;
