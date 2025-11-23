import Product from "../models/Product.js";
import Category from "../models/Category.js";
import SaleProgram from "../models/SaleProgram.js"; // 🚨 Import SaleProgram
import fs from "fs";
import path from "path";

// ==========================================
// HELPER: LẤY DANH SÁCH KHUYẾN MÃI ĐANG CHẠY
// ==========================================
const getActiveDiscounts = async () => {
  const current = new Date();
  const programs = await SaleProgram.find({
    isActive: true,
    start_date: { $lte: current },
    end_date: { $gte: current },
  })
    .populate({
      path: "discounts",
      match: { isActive: true },
      select: "name discount_percent target_type target_ids min_quantity",
    })
    .lean();

  let allDiscounts = [];
  programs.forEach((prog) => {
    if (prog.discounts) {
      const discountsWithProg = prog.discounts.map((d) => ({
        ...d,
        program_name: prog.name,
      }));
      allDiscounts = [...allDiscounts, ...discountsWithProg];
    }
  });
  return allDiscounts;
};
// ==========================================
// HELPER: TÍNH GIÁ CHO 1 SẢN PHẨM
// ==========================================
const applyDiscountToProduct = (product, activeDiscounts) => {
  let bestPrice = product.price;
  let bestDiscount = null;

  if (!product.price)
    return { ...product, final_price: 0, discount_info: null };

  activeDiscounts.forEach((d) => {
    let isMatch = false;
    const targetIds = d.target_ids?.map((id) => id.toString()) || [];

    if (
      d.target_type === "PRODUCT" &&
      targetIds.includes(product._id.toString())
    )
      isMatch = true;
    else if (d.target_type === "CATEGORY" && product.category) {
      const catId = product.category._id
        ? product.category._id.toString()
        : product.category.toString();
      if (targetIds.includes(catId)) isMatch = true;
    } else if (d.target_type === "ALL") isMatch = true;

    if (isMatch && (d.min_quantity <= 1 || !d.min_quantity)) {
      const discountAmount = product.price * (d.discount_percent / 100);
      const priceAfterDiscount = product.price - discountAmount;
      if (priceAfterDiscount < bestPrice) {
        bestPrice = priceAfterDiscount;
        bestDiscount = { percent: d.discount_percent, code: d.name };
      }
    }
  });

  return {
    ...product,
    final_price: Math.round(bestPrice),
    discount_info: bestDiscount,
  };
};

// ==========================================
// CONTROLLERS
// ==========================================

// GET ALL PRODUCTS (FILTER, SEARCH, PAGINATION)
export const getAllProduct = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 999;
    const sort = req.query.sort || "null";
    const priceFilter = req.query.price || null;
    const categoryFilter = req.query.categories || null;

    // 🚨 FIX: Tạm thời lấy hết để tránh lỗi sai tên trường active
    let query = {};

    if (categoryFilter) query.category = categoryFilter;
    if (priceFilter) query.price = { $lte: priceFilter };

    let sortOption = {};
    if (sort === "asc") sortOption.price = 1;
    if (sort === "desc") sortOption.price = -1;

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const productsRaw = await Product.find(query)
      .populate("category", "name")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Tính giá
    const activeDiscounts = await getActiveDiscounts();
    const productsWithDiscount = productsRaw.map((prod) =>
      applyDiscountToProduct(prod, activeDiscounts)
    );

    res.status(200).json({
      products: productsWithDiscount,
      currentPage: page,
      totalPages,
      totalProducts,
    });
  } catch (error) {
    console.error("Lỗi get products:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// GET PRODUCT BY ID
export const getProdcutById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate("category", "name description")
      .lean();

    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    // Chuẩn hóa ảnh
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    if (product.avatar)
      product.avatar = `${baseUrl}${product.avatar.replace(/\\/g, "/")}`;
    if (Array.isArray(product.images))
      product.images = product.images.map(
        (img) => `${baseUrl}${img.replace(/\\/g, "/")}`
      );

    // Tính giá
    const activeDiscounts = await getActiveDiscounts();
    const productWithDiscount = applyDiscountToProduct(
      product,
      activeDiscounts
    );

    return res.status(200).json(productWithDiscount);
  } catch (error) {
    console.error("Lỗi lấy sản phẩm:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// PARTITION PAGE PRODUCT (Trang chủ)
export const partitionPageProduct = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;
    const total = await Product.countDocuments();

    const productsRaw = await Product.find()
      .populate("category", "name")
      .sort({ createdAt: -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const activeDiscounts = await getActiveDiscounts();
    const productsWithDiscount = productsRaw.map((prod) =>
      applyDiscountToProduct(prod, activeDiscounts)
    );

    res.json({
      products: productsWithDiscount,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
    });
  } catch (error) {
    console.error("Partition Error:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm" });
  }
};

// CREATE PRODUCT (Giữ nguyên logic cũ)
export const createProduct = async (req, res) => {
  try {
    const { name, price, category, description, quantity } = req.body;

    if (!name || !price || !category || !quantity) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const avatarFile = req.files.avatar ? req.files.avatar[0] : null;
    const detailImages = req.files.images || [];

    if (!avatarFile && detailImages.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn ít nhất 1 ảnh" });
    }

    const avatarPath = avatarFile
      ? `/public/uploads/${avatarFile.filename}`
      : null;
    const detailImagePaths = detailImages.map(
      (f) => `/public/uploads/${f.filename}`
    );

    let allImagePaths = [];
    if (avatarPath) allImagePaths.push(avatarPath);
    allImagePaths = allImagePaths.concat(detailImagePaths);

    const foundCategory = await Category.findById(category);
    if (!foundCategory)
      return res.status(400).json({ message: "Danh mục không hợp lệ" });

    const existing = await Product.findOne({ name: name.trim() });
    if (existing)
      return res.status(400).json({ message: "Tên sản phẩm đã tồn tại" });

    const newProduct = await Product.create({
      name: name.trim(),
      price,
      category,
      description,
      quantity,
      avatar: avatarPath,
      images: allImagePaths,
    });

    console.log("✅ Đã tạo sản phẩm:", newProduct.name);
    return res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công",
      product: newProduct,
    });
  } catch (error) {
    console.error("❌ Lỗi khi tạo sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// UPDATE PRODUCT (Giữ nguyên logic cũ)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, description, quantity } = req.body;

    const newAvatarFile = req.files?.avatar ? req.files.avatar[0] : null;
    const newDetailImages = req.files?.images || [];

    const newAvatarPath = newAvatarFile
      ? `/public/uploads/${newAvatarFile.filename}`
      : null;
    const newDetailImagePaths = newDetailImages.map(
      (f) => `/public/uploads/${f.filename}`
    );

    const product = await Product.findById(id);
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    if (name && name.trim() !== product.name) product.name = name.trim();
    if (category) product.category = category;
    if (price) product.price = price;
    if (description) product.description = description;
    if (quantity) product.quantity = quantity;

    // Update Avatar
    if (newAvatarPath) {
      if (product.avatar) {
        try {
          const oldPath = path.join(process.cwd(), product.avatar);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (err) {
          console.warn("⚠️ Không thể xóa Avatar cũ:", err.message);
        }
      }
      product.avatar = newAvatarPath;
    }

    // Update Detail Images
    let imagesToKeep = [];
    if (newDetailImagePaths.length > 0) {
      const oldDetailImages = (product.images || []).filter(
        (img) => img !== product.avatar
      );
      for (const oldImg of oldDetailImages) {
        try {
          const oldPath = path.join(process.cwd(), oldImg);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (err) {
          console.warn("⚠️ Không thể xóa Ảnh chi tiết cũ:", err.message);
        }
      }
      imagesToKeep = newDetailImagePaths;
    } else {
      imagesToKeep = (product.images || []).filter(
        (img) => img !== product.avatar
      );
    }

    let finalImages = [];
    if (product.avatar) finalImages.push(product.avatar);
    finalImages = finalImages.concat(imagesToKeep);
    product.images = finalImages;

    await product.save();

    return res.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      product: product,
    });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật sản phẩm:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// DELETE PRODUCT (Giữ nguyên logic cũ)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product)
      return res
        .status(404)
        .json({ message: "Sản phẩm không tồn tại để xoá." });

    await product.deleteOne();
    return res.status(200).json({ message: "Xoá sản phẩm thành công." });
  } catch (error) {
    console.log("Lỗi khi xoá sản phẩm: ", error);
    return res.status(505).json({ message: "Lỗi hệ thống" });
  }
};
