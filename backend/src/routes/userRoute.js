import express from "express";
import {
  authMe,
  changePassword,
  updateUser,
  getAllUsers,
  deleteUser,
} from "../controllers/userControllers.js";
import { checkRole, protectedRoute } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// --- USER ROUTES (Cá nhân) ---
router.get("/me", protectedRoute, authMe);
router.put("/me", protectedRoute, updateUser);
router.post("/change-password", protectedRoute, changePassword);

// --- ADMIN ROUTES (Quản lý) ---

// 1. Lấy danh sách tất cả người dùng (Phục vụ trang Quản lý User)
// GET /api/users
router.get("/", protectedRoute, checkRole(["admin"]), getAllUsers);

// 2. Xóa người dùng
// DELETE /api/users/:id
router.delete("/:id", protectedRoute, checkRole(["admin"]), deleteUser);

export default router;
