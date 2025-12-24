// src/routes/invoiceRoute.js
import express from "express";
import { protectedRoute, verifyAdmin } from "../middlewares/authMiddlewares.js";
import {
  createInvoice,
  getAllInvoices,
  getMyInvoices,
  getInvoiceById,
  deleteInvoice,
  updateInvoice, // 👈 Import hàm mới này
} from "../controllers/invoiceController.js";

const router = express.Router();

// 1. User tạo hóa đơn
router.post("/", protectedRoute, createInvoice);

// 2. LẤY HÓA ĐƠN CỦA USER ĐANG LOGIN
router.get("/me", protectedRoute, getMyInvoices);

// 3. ADMIN LẤY TẤT CẢ HÓA ĐƠN
router.get("/", protectedRoute, verifyAdmin, getAllInvoices);

// 4. XEM CHI TIẾT
router.get("/:id", protectedRoute, getInvoiceById);

// 5. 🔥 ROUTE CẬP NHẬT (DÙNG CHUNG CHO ADMIN VÀ USER)
// Frontend gọi: PUT /api/invoice/:id
// Controller sẽ tự phân biệt ai đang gọi
router.put("/:id", protectedRoute, updateInvoice);

// 6. Xóa hóa đơn
router.delete("/:id", protectedRoute, deleteInvoice);

export default router;
