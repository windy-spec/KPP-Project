import Category from "../models/Category.js";

// CRUD category

// Read category
export const getAllCategory = async (req, res) => {
  try {
    const category = await Category.find().sort({ name: 1 });
    return res.status(200).json(category);
  } catch (error) {
    console.log("Lỗi khi lấy danh mục: ", error);
    return res.status(505).json({ message: "Lỗi hệ thống khi lấy danh mục." });
  }
};

// Create category
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(404).json({ message: "Vui lòng điền tên danh mục!" });
    }
    const isExists = await Category.findOne({ name: name });
    if (isExists) {
      return res
        .status(409)
        .json({ message: "Danh mục này đã tồn tại trong hệ thống." });
    }
    const category = await Category.create({
      name: name,
      description: description,
    });
    return res
      .status(200)
      .json({ message: "Thêm danh mục thành công!" }, category);
  } catch (error) {
    console.log("Lỗi khi lấy danh mục: ", error);
    return res.status(505).json({ message: "Lỗi hệ thống khi lấy danh mục." });
  }
};

// Update Category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await Category.findById(id);
    if (!category) {
      return res
        .status(400)
        .json({ message: "Category không tồn tại, không thể update" });
    }
    if (name && name !== category.name) {
      const nameExists = await Category.findOne({ name });
      if (nameExists) {
        return res.status(409).json({ message: "Tên danh mục đã tồn tại" });
      }
    }
    category.name = name || category.name;
    category.description = description || category.description;

    await category.save();
    return res
      .status(200)
      .json({ message: "Cập nhật danh mục thành công.", category });
  } catch (error) {
    console.log("Lỗi khi lấy danh mục: ", error);
    return res.status(505).json({ message: "Lỗi hệ thống khi lấy danh mục." });
  }
};

// Delete Category

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Không thấy danh mục cần xoá!" });
    }
    await category.deleteOne();
    return res.status(200).json({ message: "Đã xoá danh mục thành công." });
  } catch (error) {
    console.log("Lỗi khi lấy danh mục: ", error);
    return res.status(505).json({ message: "Lỗi hệ thống khi lấy danh mục." });
  }
};
