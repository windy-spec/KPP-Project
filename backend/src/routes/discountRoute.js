import express from "express";
import {
  createDiscount,
  getDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
  applyDiscount, // Quan trọng
} from "../controllers/discountControllers.js";
import { protectedRoute, checkRole } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// Route đặc biệt: Áp dụng mã (Dành cho user đã đăng nhập, KHÔNG checkRole)
router.post("/apply", protectedRoute, applyDiscount);

// Routes cho Admin (dùng checkRole)
router
  .route("/")
  .post(protectedRoute, checkRole(["admin"]), createDiscount)
  .get(getDiscounts); // <-- Public GET

router
  .route("/:id")
  .get(getDiscountById) // <-- Public GET
  .put(protectedRoute, checkRole(["admin"]), updateDiscount)
  .delete(protectedRoute, checkRole(["admin"]), deleteDiscount);

export default router;
