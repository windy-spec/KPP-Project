import express from "express";
import { getDashboardStats } from "../controllers/adminController.js";
// Import các "trạm kiểm soát" (middleware) để bảo vệ dữ liệu
import { protectedRoute, verifyAdmin } from "../middlewares/authMiddlewares.js";

const router = express.Router();

/**
 * ĐỊNH NGHĨA ROUTE LẤY THỐNG KÊ DASHBOARD
 * * Luồng hoạt động khi có một yêu cầu (request) gửi đến:
 * 1. protectedRoute: Kiểm tra xem người dùng đã đăng nhập chưa (thông qua Token).
 * 2. verifyAdmin: Nếu đã đăng nhập, kiểm tra xem tài khoản đó có phải là Admin không.
 * 3. getDashboardStats: Nếu vượt qua 2 bước trên, mới tiến hành tính toán và trả về dữ liệu.
 */
router.get("/dashboard-stats", protectedRoute, verifyAdmin, getDashboardStats);

export default router;