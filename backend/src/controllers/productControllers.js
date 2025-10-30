import Product from "../models/Product.js";
import Category from "../models/Category.js";
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
    const { name, category, quantity, price, image_url, is_Active } = req.body;
    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ message: "Sản phẩm không tồn tại để cập nhật." });
    }
    const nameExists = await Product.findOne({ name: name });
    if (nameExists) {
      return res
        .status(404)
        .json({
          message: "Tên sản phẩm này đang tồn tại, không thể cập nhật trùng.",
        });
    }

    if (category) {
      // B1: CHECK XEM DA NHAP DANH MUC CHUA
      const isCategoryExists = await Category.findById(category);
      if (!isCategoryExists) {
        // B2: NEU DANH MUC KHONG TON TAI, THI KHONG THE SUA
        return res.status(404).json({ message: "Danh mục không tồn tại." });
      }
      // B3: CAP NHAT DANH MUC VAO CHO SAN PHAM
      product.category = category;
    }
    product.name = name || product.name;
    product.quantity = quantity || product.quantity;
    product.price = price || product.price;
    product.image_url =
      image_url ||
      product.image_url ||
      "https://tahico.com/wp-content/uploads/2024/08/son-xit-phu-keo-bong-trong-suot-samurai-k1k.jpg";
    product.is_Active = is_Active ?? product.is_Active;

    await product.save();
    return res
      .status(200)
      .json({ message: "Sửa sản phẩm thành công.", product });
  } catch (error) {
    console.log("Lỗi khi gọi updateProduct: ", error);
    return res.status(505).json({ message: "Lỗi hệ thống" });
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
