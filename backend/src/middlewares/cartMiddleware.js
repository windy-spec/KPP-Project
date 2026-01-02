import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
const GUEST_CART_COOKIE = "guest_cart_id";

/*
 * Middleware identifyCart:
 * 1. Ưu tiên kiểm tra token (đã đăng nhập) -> tìm giỏ hàng bằng user ID.
 * 2. Nếu không, kiểm tra cookie 'guest_cart_id' -> tìm giỏ hàng bằng guestCartId.
 * 3. Nếu không có cả 2 -> tạo guestCartId mới, set cookie, và dùng ID mới.
 * 4. Gắn kết quả (ví dụ: { user: "..." } hoặc { guestCartId: "..." }) vào req.cartQuery
 */
export const identifyCart = async (req, res, next) => {
  let token;
  let cartQuery;

  // 1. KIỂM TRA NẾU LÀ USER ĐÃ ĐĂNG NHẬP (ƯU TIÊN HƠN)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      // Xác thực token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      // Tìm user (bạn có thể bỏ qua bước này nếu middleware 'protect' đã chạy trước)
      // Nhưng để an toàn cho các route không 'protect', chúng ta vẫn nên kiểm tra
      const user = await User.findById(decoded.userID).select("-password");

      if (user) {
        // Nếu đã đăng nhập, tìm giỏ hàng theo user ID
        req.user = user; // Gắn user vào req
        cartQuery = { user: req.user._id };
        req.cartQuery = cartQuery;
        return next();
      }
    } catch (error) {
      // Token lỗi/hết hạn, coi như là Guest
      console.log(
        "Token không hợp lệ hoặc hết hạn, tiếp tục với tư cách Guest."
      );
    }
  }

  // 2. NẾU KHÔNG ĐĂNG NHẬP -> KIỂM TRA GUEST (Qua Cookie)
  const guestCartId = req.cookies[GUEST_CART_COOKIE];

  if (guestCartId) {
    // Nếu có cookie -> tìm giỏ hàng theo ID này
    cartQuery = { guestCartId: guestCartId };
  } else {
    // 3. NẾU LÀ GUEST MỚI (Không có cookie)
    const newGuestId = new mongoose.Types.ObjectId().toHexString();

    // Tạo cookie mới cho họ
    res.cookie(GUEST_CART_COOKIE, newGuestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // 'sameSite' rất quan trọng nếu FE và BE khác domain
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // Lưu 30 ngày
    });

    // Dùng ID vừa tạo
    cartQuery = { guestCartId: newGuestId };
  }

  req.cartQuery = cartQuery;
  next();
};
