import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      sparse: true,
    },
    // Giữ nguyên recovoryOTP theo ý bạn
    recovoryOTP: {
      type: String,
      default: null,
    },
    otpExpiries: {
      type: Date,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    // --- THÊM PHẦN NÀY ---
    lastLogin: {
      type: Date,
      default: null, // Mặc định là thời gian tạo tài khoản
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
