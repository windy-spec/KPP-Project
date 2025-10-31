import Product from "../models/Product.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";
// CRUD PRODUCT

// READ PRODUCT
export const getAllProduct = async (req, res) => {
  try {
    const product = await Product.find()
      .populate("category", "name description")
      .sort({ name: 1 });
    return res.status(200).json(product);
  } catch (error) {
    console.log("Lỗi khi gọi getAllProduct: ", error);
    return res.status(505).json({ message: "Lỗi hệ thống" });
  }
};

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const { name, category, quantity, price } = req.body;
    if (!name || !category || !quantity || !price) {
      return res
        .status(404)
        .json({ message: "Vui lòng nhập đầy đủ thông tin sản phẩm." });
    }

    const nameExists = await Product.findOne({ name: name });
    if (nameExists) {
      return res
        .status(404)
        .json({ message: "Sản phẩm này đang tồn tại rồi, không thể thêm." });
    }

    const isCategoryExists = await Category.findById(category);
    if (!isCategoryExists) {
      return res.status(404).json({ message: "Danh mục không tồn tại." });
    }
    const newProduct = await Product.create({
      name,
      category,
      quantity,
      price,
      image_url:
        req.body.image_url ||
        "https://tahico.com/wp-content/uploads/2024/08/son-xit-phu-keo-bong-trong-suot-samurai-k1k.jpg",
    });
    return res
      .status(200)
      .json({ message: "Thêm sản phẩm thành công.", product: newProduct });
  } catch (error) {
    console.log("Lỗi khi gọi getAllProduct: ", error);
    return res.status(505).json({ message: "Lỗi hệ thống" });
  }
};

// UPDATE PRODUCT

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🧩 updateProduct id:", id);
    console.log("📦 Body:", req.body);
    console.log("📷 File:", req.file);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ." });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại." });
    }

    const { name, category, price, quantity, description, is_Active } =
      req.body;

    // Kiểm tra trùng tên
    if (name && name !== product.name) {
      const nameExists = await Product.findOne({ name });
      if (nameExists) {
        return res.status(400).json({
          message: "Tên sản phẩm đã tồn tại.",
        });
      }
      product.name = name;
    }

    // Kiểm tra danh mục
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ message: "Category ID không hợp lệ." });
      }
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(404).json({ message: "Danh mục không tồn tại." });
      }
      product.category = category;
    }

    if (price !== undefined) product.price = price;
    if (quantity !== undefined) product.quantity = quantity;
    if (description) product.description = description;
    if (typeof is_Active !== "undefined") product.is_Active = is_Active;

    if (req.file) {
      product.image_url = `/uploads/${req.file.filename}`;
    }

    const updated = await product.save();
    console.log("✅ Đã cập nhật:", updated);

    res.status(200).json({
      message: "Cập nhật sản phẩm thành công!",
      product: updated,
    });
  } catch (error) {
    console.error("❌ Lỗi cập nhật:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật sản phẩm." });
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
    const product = await Product.findById(id).populate(
      "category",
      "name description"
    );
    if (!product) {
      return res
        .status(404)
        .json({ message: "Sản phẩm không tồn tại, để tìm kiếm" });
    }
    return res.status(200).json(product);
  } catch (error) {
    console.log("Lỗi khi gọi getProductById", error);
    return res.status(505).json({ message: "Lỗi hệ thống" });
  }
};

// Partition Page Product
export const partionPageProdcut = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const maxPage = 10;
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order === "desc" ? -1 : 1;

    const skip = (page - 1) * limit;
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.min(Math.ceil(totalProducts / limit), maxPage);

    const products = await Product.find()
      .populate("category", "name description")
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);
    return res.status(200).json({
      currentPage: page,
      totalPages,
      totalProducts: Math.min(totalProducts, limit * maxPage),
      products,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách sản phẩm.",
      error: error.message,
    });
  }
};
