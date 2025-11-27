// src/routes/momoRoute.js
import express from "express";
import {
  createMomoPayment,
  momoCallback,
  createBankPayment,
  checkPaymentStatus,
  checkMomoTransactionStatus,
} from "../controllers/momoController.js";
import {
  protectedRoute,
  checkRole,
  verifyAdmin,
} from "../middlewares/authMiddlewares.js";

const router = express.Router();

// ===========================
// THANH TOÁN MOMO
// ===========================
// User đăng nhập mới thanh toán được
router.post("/momo", protectedRoute, checkRole(["user"]), createMomoPayment);

// Callback Momo gọi về (không cần auth)
router.post("/momo/callback", momoCallback);

// ===========================
// THANH TOÁN BANK
// ===========================
router.post("/bank", protectedRoute, checkRole(["user"]), createBankPayment);

// ===========================
// CHECK PAYMENT STATUS
// ===========================
router.get(
  "/status/:id",
  protectedRoute,
  checkRole(["user"]),
  checkPaymentStatus
);
router.post("/momo/check-status", protectedRoute, checkMomoTransactionStatus);
export default router;
