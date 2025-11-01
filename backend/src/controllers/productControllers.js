import Product from "../models/Product.js";
import Category from "../models/Category.js";
import fs from "fs";
import path from "path";
// CRUD PRODUCT

// READ PRODUCT
export const getAllProduct = async (req, res) => {
  try {
    const { page = 1, limit = 9, sort = "null", price, categories } = req.query;

    const query = {};

    if (categories) query.category = categories;
    if (price) query.price = { $lte: Number(price) };

    const total = await Product.countDocuments(query);

    let sortOptions = {};
    if (sort === "price_asc") sortOptions = { price: 1 };
    else if (sort === "price_desc") sortOptions = { price: -1 };
    else if (sort === "newest") sortOptions = { createdAt: -1 };

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const products = await Product.find(query)
      .populate("category", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // 🟢 Chuẩn hóa ảnh cho mỗi sản phẩm
    const normalized = products.map((p) => ({
      ...p,
      avatar: p.avatar ? `${baseUrl}${p.avatar.replace(/\\/g, "/")}` : null,
      images: Array.isArray(p.images)
        ? p.images.map((img) => `${baseUrl}${img.replace(/\\/g, "/")}`)
        : [],
    }));

    return res.status(200).json({
      success: true,
      meta: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
      },
      products: normalized,
    });
  } catch (error) {
    console.error("❌ Lỗi getAllProducts:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách sản phẩm",
      error: error.message,
    });
  }
};

// CREATE PRODUCT

export const createProduct = async (req, res) => {
  try {
    const { name, price, category, description, quantity } = req.body;

    if (!name || !price || !category || !quantity) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    // 🚨 CHỈNH SỬA TẠI ĐÂY 🚨
    const avatarFile = req.files.avatar ? req.files.avatar[0] : null;
    const detailImages = req.files.images || [];

    // Kiểm tra tối thiểu 1 file
    if (!avatarFile && detailImages.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn ít nhất 1 ảnh" });
    }

    // Chuẩn hóa đường dẫn
    const avatarPath = avatarFile
      ? `/public/uploads/${avatarFile.filename}`
      : null;
    const detailImagePaths = detailImages.map(
      (f) => `/public/uploads/${f.filename}`
    );

    // Gộp tất cả đường dẫn (nếu muốn)
    let allImagePaths = [];
    if (avatarPath) allImagePaths.push(avatarPath);
    allImagePaths = allImagePaths.concat(detailImagePaths);

    const avatar = avatarPath; // Dùng avatar riêng
    const images = allImagePaths; // Dùng tất cả ảnh
    // -------------------------

    // 🟢 Kiểm tra danh mục
    const foundCategory = await Category.findById(category);
    if (!foundCategory)
      return res.status(400).json({ message: "Danh mục không hợp lệ" });

    // 🟢 Kiểm tra trùng tên
    const existing = await Product.findOne({ name: name.trim() });
    if (existing)
      return res.status(400).json({ message: "Tên sản phẩm đã tồn tại" });

    // 🟢 Tạo sản phẩm
    const newProduct = await Product.create({
      name: name.trim(),
      price,
      category,
      description,
      quantity,
      avatar,
      images, // Sử dụng mảng gộp
    });

    console.log("✅ Đã tạo sản phẩm:", newProduct.name);
    return res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công",
      product: newProduct,
    });
  } catch (error) {
    console.error("❌ Lỗi khi tạo sản phẩm:", error);
    // ... xử lý lỗi
  }
};

// UPDATE
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, description, quantity } = req.body; // 🟢 Lô-gic truy cập file (giữ nguyên)

    const newAvatarFile = req.files?.avatar ? req.files.avatar[0] : null;
    const newDetailImages = req.files?.images || []; // Chuẩn hóa đường dẫn file mới (nếu có)

    const newAvatarPath = newAvatarFile
      ? `/public/uploads/${newAvatarFile.filename}`
      : null;
    const newDetailImagePaths = newDetailImages.map(
      (f) => `/public/uploads/${f.filename}`
    ); // ---------------------------------------------------------------------- // 🟢 Tìm sản phẩm cần sửa
    const product = await Product.findById(id);
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" }); // 🟢 Kiểm tra tên trùng và Danh mục...

    if (name && name.trim() !== product.name) {
      // const existing = await Product.findOne({ name: name.trim() });
      // if (existing && existing._id.toString() !== id)
      //   return res.status(400).json({ message: "Tên sản phẩm đã tồn tại" });
      product.name = name.trim();
    }

    if (category) {
      // const foundCategory = await Category.findById(category);
      // if (!foundCategory)
      //   return res.status(400).json({ message: "Danh mục không hợp lệ" });
      product.category = category;
    } // 🟢 Cập nhật các trường cơ bản
    if (price) product.price = price;
    if (description) product.description = description;
    if (quantity) product.quantity = quantity; // 🟢 1. CẬP NHẬT AVATAR (Chỉ thay thế nếu có file mới được gửi lên)

    if (newAvatarPath) {
      // Xóa Avatar cũ trên server (chỉ xóa file cũ nếu nó tồn tại)
      if (product.avatar) {
        try {
          const oldPath = path.join(process.cwd(), product.avatar);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (err) {
          console.warn(
            "⚠️ Không thể xóa Avatar cũ:",
            product.avatar,
            err.message
          );
        }
      } // Gán Avatar mới
      product.avatar = newAvatarPath;
    } // 🟢 2. CẬP NHẬT ẢNH CHI TIẾT (Chỉ thay thế nếu có file mới được gửi lên)

    let imagesToKeep = [];

    if (newDetailImagePaths.length > 0) {
      // Nếu có ảnh chi tiết mới: XÓA TẤT CẢ ảnh chi tiết cũ (trừ avatar hiện tại)
      const oldDetailImages = (product.images || []).filter(
        (img) => img !== product.avatar
      );
      for (const oldImg of oldDetailImages) {
        try {
          const oldPath = path.join(process.cwd(), oldImg);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (err) {
          console.warn(
            "⚠️ Không thể xóa Ảnh chi tiết cũ:",
            oldImg,
            err.message
          );
        }
      } // Gán Ảnh chi tiết mới

      imagesToKeep = newDetailImagePaths;
    } else {
      // Nếu KHÔNG có ảnh chi tiết mới, giữ lại ảnh chi tiết cũ
      imagesToKeep = (product.images || []).filter(
        (img) => img !== product.avatar
      );
    } // 🟢 3. Gán lại mảng `images` cuối cùng (chứa avatar + chi tiết)

    let finalImages = [];
    if (product.avatar) {
      finalImages.push(product.avatar);
    }
    finalImages = finalImages.concat(imagesToKeep);
    product.images = finalImages;

    await product.save(); // const baseUrl = `${req.protocol}://${req.get("host")}`; // const normalized = { //   ...product.toObject(), //   avatar: product.avatar ? `${baseUrl}${product.avatar}` : null, //   images: product.images.map((img) => `${baseUrl}${img}`), // };

    return res.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      product: product, // Trả về product đã cập nhật (hoặc normalized)
    });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật sản phẩm:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: err.message,
    });
  }
};
// DELETE PRODUCT

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ message: "Sản phẩm không tồn tại để xoá." });
    }
    await product.deleteOne();
    return res.status(200).json({ message: "Xoá sản phẩm thành công." });
  } catch (error) {
    console.log("Lỗi khi gọi updateProduct: ", error);
    return res.status(505).json({ message: "Lỗi hệ thống" });
  }
};

// GET PRODUCT BY ID

export const getProdcutById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🟢 Lấy sản phẩm ID:", id);

    const product = await Product.findById(id)
      .populate("category", "name description")
      .lean();

    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // 🟢 Chuẩn hóa avatar
    if (product.avatar) {
      product.avatar = `${baseUrl}${product.avatar.replace(/\\/g, "/")}`;
    }

    // 🟢 Chuẩn hóa mảng images
    if (Array.isArray(product.images)) {
      product.images = product.images.map(
        (img) => `${baseUrl}${img.replace(/\\/g, "/")}`
      );
    }

    console.log("✅ Dữ liệu trả về:", product.name);
    return res.status(200).json(product);
  } catch (error) {
    console.error("❌ Lỗi khi lấy sản phẩm:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Partition Page Product
export const partitionPageProduct = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments();

    const products = await Product.find()
      .populate("category", "name")
      .sort({ createdAt: -1, _id: 1 })
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm" });
  }
};
