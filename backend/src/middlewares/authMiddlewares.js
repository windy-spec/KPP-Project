import jwt from "jsonwebtoken";
import User from "../models/User.js";
// check role
export const checkRole = (allowedRole) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.role) {
      console.error(
        "Lỗi phân quyền: Thiếu req.user hoặc req.user.role. Đảm bảo authenticate đã chạy trước đó."
      );
      return res.status(403).json({
        message:
          "Lỗi quyền: Thông tin người dùng không đủ để kiểm tra vai trò.",
      });
    }
    const userRole = user.role;
    if (allowedRole.includes(userRole)) {
      next();
    } else {
      console.warn(
        `Truy cập bị từ chối: Role [${userRole}] không được phép. (Yêu cầu: ${allowedRole.join(
          ", "
        )})`
      );
      return res.status(403).json({
        message: "Bạn không có đủ quyền để truy cập tài nguyên này.",
      });
    }
  };
};

// authorization
export const protectedRoute = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Không tìm thấy accessToken" });
    }
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      async (err, decodeUser) => {
        if (err) {
          let message = "AcessToken không hợp lệ";
          if (err.name === "TokenExpiredError") {
            message = "AcessToken đã hết hạn.";
            console.warn(
              `TOKEN EXPIRED: Hết hạn. (Token ${token.substring(0, 15)} ...)`
            );
          } else if (err.name === "JsonWebTokenError") {
            message = "Token bị giả mạo hoặc không đúng chữ ký.";
          }
          return res.status(401).json({ message: message });
        }
        const user = await User.findById(decodeUser.userID).select("-password");
        if (!user) {
          return res.status(404).json({ message: "Người dùng không tồn tại" });
        }
        req.user = user;
        req.userID = user._id;
        next();
      }
    );
  } catch (error) {
    console.log("Lỗi xác minh JWT trong middleWares" + error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
