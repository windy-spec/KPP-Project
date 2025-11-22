import express from "express";
import User from "../models/User.js";
import { upload } from "../middlewares/upload.js";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
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
  // Xử lý Upload File bằng Middleware Multer
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      console.error("[UPLOAD_ERROR] Lỗi Multer:", err);
      return res.status(400).json({ message: "Lỗi tải file: " + err.message });
    }
    const userId = req.user._id;
    const updates = req.body;
    const oldAvatarUrl = req.user.avatarUrl;
    try {
      let finalAvatarUrl = req.user.avatarUrl; // Giữ lại URL cũ mặc định
      if (req.file) {
        finalAvatarUrl = `/uploads/${req.file.filename}`;
      } else if (updates.avatarUrl === "null" && oldAvatarUrl) {
        finalAvatarUrl = null;
      } else if (updates.avatarUrl === "null" && !oldAvatarUrl) {
        finalAvatarUrl = null;
      }
      const allowUpdate = {};
      const allowKeys = ["displayName", "phone"];

      allowKeys.forEach((key) => {
        if (key in updates) {
          allowUpdate[key] = updates[key];
        }
      });
      allowUpdate.avatarUrl = finalAvatarUrl;
      const isAvatarChanged = req.file || updates.avatarUrl === "null";
      const isTextUpdated = Object.keys(updates).some((key) =>
        allowKeys.includes(key)
      );
      if (!isTextUpdated && !isAvatarChanged) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        throw new Error("Không có trường hợp lệ nào để cập nhật.");
      }
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
      if (
        (req.file && oldAvatarUrl) ||
        (finalAvatarUrl === null && oldAvatarUrl)
      ) {
        const fileNameOnly = oldAvatarUrl.substring(
          oldAvatarUrl.lastIndexOf("/") + 1
        );
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
      const { password, ...userWithoutPassword } = updatedUserResult.toObject();
      return res.status(200).json({
        message: "Cập nhật thông tin người dùng và ảnh đại diện thành công.",
        user: userWithoutPassword,
      });
    } catch (error) {
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

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userID = req.user._id;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.",
      });
    }
    if (newPassword !== confirmNewPassword) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới và xác nhận mật khẩu không khớp." });
    }
    if (newPassword.length < 6) {
      // Yêu cầu độ dài tối thiểu
      return res
        .status(400)
        .json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." });
    }
    // Tìm người dùng trong database và lấy trường password
    const user = await User.findById(userID).select("+password");
    if (!user) {
      // Trường hợp token hợp lệ nhưng user bị xóa
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Mật khẩu hiện tại không chính xác." });
    }
    if (currentPassword === newPassword) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại." });
    }
    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    // Lưu mật khẩu đã mã hóa vào database
    user.password = hashedPassword;
    await user.save();
    return res
      .status(200)
      .json({ message: "Mật khẩu đã được cập nhật thành công." });
  } catch (error) {
    console.error("Lỗi khi thay đổi mật khẩu.", error);
    return res
      .status(500)
      .json({ message: "Lỗi hệ thống khi cập nhật mật khẩu." });
  }
};
