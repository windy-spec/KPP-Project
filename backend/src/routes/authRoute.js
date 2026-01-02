import express from "express";
import {
  signUp,
  signIn,
  signOut,
  forgotPassword,
  resetPassword,
  getProfile,
} from "../controllers/authControllers.js";
import { protectedRoute as protect } from "../middlewares/authMiddlewares.js";
const router = express.Router();
// === CÁC ROUTE CÔNG KHAI (Public) ===
// Đăng ký
router.post("/signup", signUp);

// Đăng nhập
router.post("/signin", signIn);

// Đăng xuất
router.post("/signout", signOut);

// Quên mật khẩu (gửi OTP)
router.post("/forgot-password", forgotPassword);

// Đặt lại mật khẩu (với OTP)
router.post("/reset-password", resetPassword);

// === CÁC ROUTE ĐƯỢC BẢO VỆ (Protected) ===

// Lấy thông tin user (dùng cho trang thanh toán)
// Yêu cầu phải gửi kèm Access Token
router.get("/profile", protect, getProfile);

export default router;
