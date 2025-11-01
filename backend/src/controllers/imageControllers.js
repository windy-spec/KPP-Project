import fs from "fs";
import path from "path";
import ImageProduct from "../models/ImageProduct.js";
import Product from "../models/Product.js";

// 🟢 [POST] /api/images/:productId
export const createImages = async (req, res) => {
  try {
    const { productId } = req.params;

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: "Không có ảnh nào được upload" });

    const uploadDir = path.join("public/uploads");
    const imageDocs = [];

    for (const file of req.files) {
      const existingFilePath = path.join(uploadDir, file.originalname);
      let imageUrl = "";

      if (fs.existsSync(existingFilePath)) {
        // Nếu ảnh đã tồn tại thì xóa file upload mới và dùng lại ảnh cũ
        fs.unlinkSync(file.path);
        imageUrl = `/uploads/${file.originalname}`;
      } else {
        // Nếu chưa có thì dùng file mới upload
        imageUrl = `/uploads/${file.filename}`;
      }

      const imageDoc = new ImageProduct({
        product: productId,
        image_url: imageUrl,
      });
      await imageDoc.save();
      imageDocs.push(imageDoc);
    }

    return res.status(201).json({
      message: "Thêm ảnh thành công",
      images: imageDocs,
    });
  } catch (error) {
    console.error("❌ Lỗi khi thêm ảnh:", error);
    return res.status(500).json({ message: "Lỗi hệ thống", error });
  }
};

// 🟢 [GET] /api/images/:productId
export const getImagesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const images = await ImageProduct.find({ product: productId });
    return res.status(200).json(images);
  } catch (error) {
    console.error("❌ Lỗi khi lấy ảnh:", error);
    return res.status(500).json({ message: "Lỗi hệ thống", error });
  }
};

// 🟢 [PUT] /api/images/:id
export const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await ImageProduct.findById(id);
    if (!image) return res.status(404).json({ message: "Không tìm thấy ảnh" });

    if (req.file) {
      const uploadDir = path.join("public/uploads");
      const existingFile = path.join(uploadDir, req.file.originalname);
      let imageUrl = "";

      if (fs.existsSync(existingFile)) {
        fs.unlinkSync(req.file.path);
        imageUrl = `/uploads/${req.file.originalname}`;
      } else {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      image.image_url = imageUrl;
    }

    await image.save();
    return res.status(200).json({ message: "Cập nhật ảnh thành công", image });
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật ảnh:", error);
    return res.status(500).json({ message: "Lỗi hệ thống", error });
  }
};

// 🟢 [DELETE] /api/images/:id
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await ImageProduct.findById(id);
    if (!image) return res.status(404).json({ message: "Không tìm thấy ảnh" });

    // Xóa file thật trong thư mục uploads
    const filePath = path.join("public", image.image_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await image.deleteOne();
    return res.status(200).json({ message: "Xóa ảnh thành công" });
  } catch (error) {
    console.error("❌ Lỗi khi xóa ảnh:", error);
    return res.status(500).json({ message: "Lỗi hệ thống", error });
  }
};
