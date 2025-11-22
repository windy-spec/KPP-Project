import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Không có file nào được gửi lên." });
    }
    const publicUrl = `/uploads/${req.file.filename}`;
    return res.status(200).json({
      message: "Tải ảnh đại diện thành công.",
      url: publicUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Lỗi khi xử lý upload avatar:", error);
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Không xóa được file lỗi:", err);
      });
    }
    return res.status(500).json({ message: "Lỗi hệ thống khi tải ảnh lên." });
  }
};

export const upload = multer({ storage });
