import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
          console.log(err);
          return res
            .status(404)
            .json({ message: "Access Token hết hạn hoặc sai" });
        }
        const user = await User.findById(decodeUser.userID).select("-password");
        if (!user) {
          return res.status(404).json({ message: "Người dùng không tồn tại" });
        }
        req.user = user;
        next();
      }
    );
  } catch (error) {
    console.log("Lỗi xác minh JWT trong middleWares" + error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
