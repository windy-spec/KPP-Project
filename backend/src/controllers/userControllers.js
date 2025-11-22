import express from "express";
import User from "../models/User.js";
import { upload } from "../middlewares/upload.js";
import fs from "fs"; // 🚨 BỔ SUNG: Import module fs
import path from "path"; // Cần thiết để xây dựng đường dẫn xóa file

export const updateUserLogic = async (userId, updates) => {
  // Logic này không còn được dùng vì logic chính đã được gộp vào updateUser
  // Nhưng giữ lại cho đủ cấu trúc file
  const allowUpdate = {};
  const allowKeys = ["displayName", "phone", "avatarUrl"];
  // ... (Logic cũ)
  allowKeys.forEach((key) => {
    if (key in updates) {
      allowUpdate[key] = updates[key];
    }
  });
  if (Object.keys(allowUpdate).length === 0) {
    throw new Error("Không có trường hợp lệ nào để cập nhật.");
  }
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: allowUpdate },
    { new: true, runValidators: true }
  );
  return updatedUser;
};

export const authMe = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({ user });
  } catch (error) {
    console.log("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" }); // Đổi 404 thành 500
  }
};

const uploadMiddleware = upload.single("avatar");

export const updateUser = async (req, res) => {
  // BƯỚC 1: Xử lý Upload File bằng Middleware Multer
  uploadMiddleware(req, res, async (err) => {
    // 1A. Xử lý lỗi từ Multer (ví dụ: kích thước file quá lớn)
    if (err) {
      console.error("[UPLOAD_ERROR] Lỗi Multer:", err);
      return res.status(400).json({ message: "Lỗi tải file: " + err.message });
    }

    // --- Chuẩn bị Dữ liệu ---
    // req.user được gán từ protectedRoute
    const userId = req.user._id;
    // req.body chứa các trường text sau khi Multer xử lý
    const updates = req.body;

    // Lấy URL ảnh cũ (trước khi update) từ req.user để xóa nếu có ảnh mới
    // Đảm bảo protectedRoute đã gắn user vào req
    const oldAvatarUrl = req.user.avatarUrl;

    try {
      let finalAvatarUrl = req.user.avatarUrl; // Giữ lại URL cũ mặc định

      // 1B. Xác định finalAvatarUrl
      if (req.file) {
        // Có file mới được upload thành công -> Gán URL mới
        finalAvatarUrl = `/uploads/${req.file.filename}`;
      } else if (updates.avatarUrl === "null" && oldAvatarUrl) {
        // Trường hợp client muốn xóa ảnh cũ (gửi avatarUrl: "null" và có ảnh cũ)
        finalAvatarUrl = null;
      } else if (updates.avatarUrl === "null" && !oldAvatarUrl) {
        // Trường hợp client muốn xóa ảnh nhưng không có ảnh cũ, không làm gì
        finalAvatarUrl = null;
      }

      // 2. Lọc các trường được phép cập nhật
      const allowUpdate = {};
      const allowKeys = ["displayName", "phone"];

      allowKeys.forEach((key) => {
        if (key in updates) {
          allowUpdate[key] = updates[key];
        }
      });

      // Thêm trường avatarUrl vào đối tượng cập nhật
      allowUpdate.avatarUrl = finalAvatarUrl;

      // Kiểm tra xem có bất kỳ thay đổi nào không
      const isAvatarChanged = req.file || updates.avatarUrl === "null";
      const isTextUpdated = Object.keys(updates).some((key) =>
        allowKeys.includes(key)
      );

      if (!isTextUpdated && !isAvatarChanged) {
        // Nếu không có text thay đổi và không có ảnh mới/xóa ảnh cũ
        if (req.file) {
          fs.unlinkSync(req.file.path);
        } // Xóa file vừa tải lên
        throw new Error("Không có trường hợp lệ nào để cập nhật.");
      }

      // 3. Thực hiện cập nhật Mongoose
      const updatedUserResult = await User.findByIdAndUpdate(
        userId,
        { $set: allowUpdate },
        { new: true, runValidators: true }
      );

      if (!updatedUserResult) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res
          .status(404)
          .json({ message: "Không tìm thấy người dùng để cập nhật." });
      }

      // 🚨 BƯỚC QUAN TRỌNG: XÓA ẢNH CŨ TRÊN SERVER
      if (
        (req.file && oldAvatarUrl) ||
        (finalAvatarUrl === null && oldAvatarUrl)
      ) {
        // oldAvatarUrl có dạng /uploads/ten_file.jpg
        const fileNameOnly = oldAvatarUrl.substring(
          oldAvatarUrl.lastIndexOf("/") + 1
        );
        // PHẢI NỐI VỚI 'uploads'
        const filePath = path.join(
          process.cwd(),
          "public",
          "uploads",
          fileNameOnly
        );

        fs.unlink(filePath, (err) => {
          if (err)
            console.error(
              `[DELETE_FILE_ERROR] Không xóa được file cũ ${filePath}:`,
              err
            );
          else console.log(`[DELETE_SUCCESS] Đã xóa file cũ: ${filePath}`);
        });
      }

      // 4. Trả về kết quả
      const { password, ...userWithoutPassword } = updatedUserResult.toObject();

      return res.status(200).json({
        message: "Cập nhật thông tin người dùng và ảnh đại diện thành công.",
        user: userWithoutPassword,
      });
    } catch (error) {
      // Xóa file vừa tải lên nếu lỗi Mongoose hoặc logic xảy ra
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      console.error(
        `[UPDATE_ERROR] Lỗi cập nhật user ID ${userId}:`,
        error.message,
        error
      );

      if (
        error.message.includes("Không có trường hợp lệ") ||
        error.name === "ValidationError"
      ) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật." });
    }
  });
};
