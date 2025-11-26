import jwt from "jsonwebtoken";
import User from "../models/User.js";
export const protectedRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

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

    req.user = user;
    req.userID = user._id;

    next();
  } catch (err) {
    let message = "AccessToken không hợp lệ";

    if (err.name === "TokenExpiredError") {
      message = "AccessToken đã hết hạn";
      console.warn("TOKEN EXPIRED:", err.expiredAt);
    }

    return res.status(401).json({ message });
  }
};

// check role

export const checkRole = (roles = []) => {
  // nếu roles là string → convert thành mảng
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
