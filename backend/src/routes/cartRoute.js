import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  proceedToCheckout,
} from "../controllers/cartController.js";

// Import middleware mới
import { identifyCart } from "../middlewares/cartMiddleware.js";
// Import middleware xác thực (giả sử đường dẫn này đúng)
import { protectedRoute as protect } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// === CÁC ROUTE CÔNG KHAI (Guest hoặc User) ===
// Dùng middleware 'identifyCart' để tìm/tạo giỏ hàng
router.get("/", identifyCart, getCart);
router.post("/add", identifyCart, addToCart);
router.put("/update", identifyCart, updateCartItem);
router.delete("/remove/:productId", identifyCart, removeCartItem);

router.get("/checkout", protect, proceedToCheckout);

export default router;
