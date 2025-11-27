// src/routes/invoiceRoute.js
import express from "express";
import { protectedRoute, verifyAdmin } from "../middlewares/authMiddlewares.js";
import {
  createInvoice,
  getAllInvoices,
  getMyInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  deleteInvoice,
} from "../controllers/invoiceController.js";

const router = express.Router();

// 1. User tạo hóa đơn
router.post("/", protectedRoute, createInvoice);

// 2. LẤY HÓA ĐƠN CỦA USER ĐANG LOGIN
router.get("/me", protectedRoute, getMyInvoices);

// 3. ADMIN LẤY TẤT CẢ HÓA ĐƠN
router.get("/", protectedRoute, verifyAdmin, getAllInvoices);

// 4. XEM CHI TIẾT + ADMIN UPDATE TRẠNG THÁI
router.get("/:id", protectedRoute, getInvoiceById);
router.put("/:id", protectedRoute, verifyAdmin, updateInvoiceStatus);

router.delete("/:id", protectedRoute, deleteInvoice);
export default router;
