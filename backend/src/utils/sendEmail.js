import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendEmail = async (to, subject, htmlBody) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"KPP Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlBody,
    });

    console.log("✅ Gửi email thành công:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Lỗi khi gửi email:", error);
    return false;
  }
};
