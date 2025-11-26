import express from "express";
import {
  createMomoPayment,
  momoCallback,
  createBankPayment,
  checkPaymentStatus,
} from "../controllers/momoController.js";
import { protectedRoute as protect } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// ==============================
// 1. THANH TOÁN MOMO
// ==============================

// Tạo yêu cầu thanh toán (Cần đăng nhập)
router.post("/momo", protect, createMomoPayment);

// Nhận kết quả từ Momo (QUAN TRỌNG: Không được có 'protect' ở đây)
router.post("/momo-callback", momoCallback);

// ==============================
// 2. THANH TOÁN NGÂN HÀNG (VIETQR)
// ==============================

// Tạo mã QR (Cần đăng nhập)
router.post("/bank", protect, createBankPayment);

// Kiểm tra trạng thái đơn hàng (Polling từ Frontend)
router.get("/status/:id", checkPaymentStatus);

export default router;
