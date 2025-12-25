import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectedRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    if (!token) {
      return res.status(401).json({ message: "Không tìm thấy accessToken" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find user
    const user = await User.findById(decoded.userID).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // --- LOGIC MỚI: Cập nhật lastLogin thông minh (Throttling) ---
    const now = new Date();
    // Chỉ cập nhật nếu lần cuối cập nhật đã hơn 2 phút trước
    // Giúp server không bị quá tải ghi DB mỗi lần F5
    if (
      !user.lastLogin ||
      now.getTime() - new Date(user.lastLogin).getTime() > 2 * 60 * 1000
    ) {
      await User.findByIdAndUpdate(user._id, { $set: { lastLogin: now } });
      // Cập nhật lại biến user trong req để các hàm sau có dữ liệu mới nhất
      user.lastLogin = now;
    }
    // -------------------------------------------------------------

    req.user = user;
    req.userID = user._id;

    next();
  } catch (err) {
    let message = "AccessToken không hợp lệ";

    if (err.name === "TokenExpiredError") {
      message = "AccessToken đã hết hạn";
    } else if (err.name === "JsonWebTokenError") {
      message = "Token bị lỗi hoặc không đúng định dạng";
    }

    return res.status(401).json({ message });
  }
};

// ... Các hàm checkRole, verifyAdmin giữ nguyên
export const checkRole = (roles = []) => {
  if (typeof roles === "string") roles = [roles];

  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(403).json({
        message: "Không có thông tin người dùng để kiểm tra vai trò",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập tài nguyên này.",
      });
    }

    next();
  };
};

export const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin")
    return res.status(403).json({ message: "Không có quyền truy cập" });
  next();
};
