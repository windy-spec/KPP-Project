import Session from "../models/Session.js";
import User from "../models/User.js";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendEmail.js"; // ⬅️ Import hàm vừa tạo

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;
// FUNCTION SIGNUP

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName, phone } = req.body;
    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({
        message:
          "Không thể thiếu username, password, email, firstName, lastName",
      });
    }
    // check username isExists

    const isExists = await User.findOne({ username });
    if (isExists) {
      return res.status(409).json({ message: "Username đã tồn tại" });
    }
    // HashPassword
    const hashedPassword = await bcrypt.hash(password, 10);
    // create user

    await User.create({
      username,
      password: hashedPassword,
      email,
      displayName: `${firstName} ${lastName}`,
      phone,
    });

    // return
    return res.status(204);
  } catch (error) {
    console.error("Lỗi khi gọi signUp", error);
    return res.status(505).json({ message: "Lỗi hệ thống" });
  }
};

// FUNCTION SIGNIN

export const signIn = async (req, res) => {
  try {
    // get inputs user send

    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Không thể thiếu username hoặc password." });
    }

    // compare User with database

    // check username

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Sai username hoặc password." });
    }
    // check password
    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (!passwordCorrect) {
      return res.status(401).json({ message: "Sai username hoặc password." });
    }
    // create accessToken with jwt

    const accessToken = JWT.sign(
      { userID: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // create refreshToken

    const refreshToken = JWT.sign(
      {
        UserID: user._id,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "14d",
      }
    );

    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });
    // send refreshToken to cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });
    // send access to res
    return res.status(200).json({
      message: `User ${user.displayName} đã logged in! `,
      accessToken,
    });
  } catch (error) {
    console.log("Lỗi khi gọi signIn: ", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// FUNCTION SIGNUP
export const signOut = async (req, res) => {
  try {
    // Get refreshToken from cookie
    const token = req.cookies?.refreshToken;
    if (token) {
      await Session.deleteOne({ refreshToken: token });
      // Delete cookie
      res.clearCookie("refreshToken");
    }
    return res.status(204);
  } catch (error) {
    console.error("Lỗi khi gọi signOut", error);
    return res.status(505).json({ message: "Lỗi hệ thống" });
  }
};

// FUNCTION SENDEMAIL

// File: src/controllers/authControllers.js

// ... các imports khác

// HÀM TẠM THỜI ĐỂ TEST GỬI EMAIL
export const testSendEmail = async (req, res) => {
  try {
    // ⚠️ THAY THẾ bằng email bạn muốn nhận thư TEST
    const testRecipient = req.body.email || "email_cua_ban_de_test@example.com";

    // 💡 Tạo mã ngẫu nhiên đơn giản
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Nội dung đơn giản: chỉ nói về mã
    const subject = "Mã Đặt lại Mật khẩu Test";
    const htmlBody = `
            <p>Chào bạn,</p>
            <p>Đây là mã test đặt lại mật khẩu của bạn:</p>
            <h1 style="color: #FF5733; font-size: 32px;">${testCode}</h1>
            <p>Vui lòng sử dụng mã này để đặt mật khẩu mới.</p>
        `;

    const success = await sendEmail(testRecipient, subject, htmlBody);

    if (success) {
      return res.status(200).json({
        message: `Gửi email test thành công đến ${testRecipient}. Vui lòng kiểm tra hộp thư.`,
      });
    } else {
      return res.status(500).json({
        message:
          "Gửi email thất bại. Kiểm tra log server để xem lỗi Nodemailer.",
      });
    }
  } catch (error) {
    console.error("Lỗi trong hàm testSendEmail:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi test email." });
  }
};
