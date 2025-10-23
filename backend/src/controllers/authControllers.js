import Session from "../models/Session.js";
import User from "../models/User.js";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
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
const sendEmail = async (to, subject, htmlContent) => {
  // 1. Lấy biến từ process.env (Giả định đã được tải)
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Cấu hình EMAIL_USER hoặc EMAIL_PASS bị thiếu trong .env.");
  }

  // ⬅️ SỬA LỖI 1: Loại bỏ khoảng trắng khỏi mật khẩu ứng dụng
  const cleanedPass = EMAIL_PASS.replace(/\s/g, "");

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      connectionTimeout: 5000,
      socketTimeout: 5000,
      auth: {
        user: EMAIL_USER,
        pass: cleanedPass, // ⬅️ SỬ DỤNG MẬT KHẨU ĐÃ LÀM SẠCH
      },
    });

    const mailOptions = {
      from: `"Your App Service" <${EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    };

    // ⬅️ SỬA LỖI 2: Chỉ gọi sendMail MỘT LẦN và lưu kết quả
    const info = await transporter.sendMail(mailOptions);

    // ⬅️ LOGGING THÀNH CÔNG RÕ RÀNG VÀ CHÍNH XÁC
    console.log(`✅ Email đã được gửi thành công đến: ${to}`);
    console.log("Nodemailer Response:", info.response); // In ra phản hồi máy chủ Gmail

    return info; // Trả về info nếu cần
  } catch (error) {
    // ⬅️ LOGGING LỖI RÕ RÀNG ĐỂ DEBUG
    console.error("❌ LỖI GỬI EMAIL (Kiểm tra EAUTH):", error.message);
    console.error("Chi tiết lỗi:", error);
    throw error;
  }
};
// FUNCTION FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Vui lòng cung cấp email." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "Nếu email tồn tại, mã khôi phục đã được gửi.",
      });
    }

    const OTP = Math.floor(100000 + Math.random() * 900000).toString();

    const subject = "Mã Khôi phục Mật khẩu của bạn";
    const htmlContent = `
            <h2>Chào ${user.displayName || user.username},</h2>
            <p>Đây là mã xác nhận để khôi phục mật khẩu của bạn:</p>
            
            <div style="font-size: 24px; font-weight: bold; color: #0275d8; padding: 15px; border: 1px solid #0275d8; border-radius: 4px; display: inline-block; margin: 15px 0;">
                ${OTP}
            </div>

            <p>Mã này có thể chỉ có hiệu lực trong vài phút. Vui lòng không chia sẻ mã này.</p>
        `;

    await sendEmail(email, subject, htmlContent);

    // TODO: LƯU OTP VÀO DATABASE KÈM THỜI GIAN HẾT HẠN Ở ĐÂY!

    return res.status(200).json({
      success: true,
      message: "Mã khôi phục đã được gửi đến email của bạn.",
    });
  } catch (error) {
    console.error("Lỗi khi gọi forgotPassword:", error);
    return res
      .status(500)
      .json({ message: "Lỗi hệ thống hoặc lỗi gửi email: " + error.message });
  }
};
