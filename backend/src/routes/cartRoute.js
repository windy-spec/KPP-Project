import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  proceedToCheckout,
  getGuestCartPreview,
} from "../controllers/cartController.js";
import { protectedRoute } from "../middlewares/authMiddlewares.js";
import { identifyCart } from "../middlewares/cartMiddleware.js";
import { protectedRoute as protect } from "../middlewares/authMiddlewares.js";
const router = express.Router();

// 1. Route tính toán cho Guest (KHÔNG dùng middleware identifyCart vì không cần tạo cart trong DB)
router.post("/guest-preview", getGuestCartPreview);

// === CÁC ROUTE CÔNG KHAI (Guest hoặc User) ===
// Dùng middleware 'identifyCart' để tìm/tạo giỏ hàng
router.get("/", identifyCart, getCart);
router.post("/add", identifyCart, addToCart);
router.put("/update", identifyCart, updateCartItem);
router.delete("/remove/:productId", identifyCart, removeCartItem);

router.get("/checkout", protect, proceedToCheckout);
router.post("/clear", protectedRoute, async (req, res) => {
  try {
    await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
    res.status(200).json({ message: "Giỏ hàng đã được làm trống" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi xóa giỏ hàng", detail: error.message });
  }
});
export default router;
