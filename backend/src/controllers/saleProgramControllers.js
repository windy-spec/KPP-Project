import SaleProgram from "../models/SaleProgram.js";
import Discount from "../models/Discount.js";

// CRUD SALEPROGRAM
// CREATE SALEPROGRAM
export const createSaleProgram = async (req, res) => {
  try {
    const { name, description, start_date, end_date, banner_image } = req.body;
    const existsProgram = await SaleProgram.findOne({ name });
    if (existsProgram) {
      return res
        .status(404)
        .json({ message: "Tên chương trình khuyến mãi đã tồn tại." });
    }
    const newProgram = new SaleProgram({
      name,
      description,
      start_date,
      end_date,
      banner_image,
      createdBy: req.user.id,
    });
    const saveProgram = await newProgram.save();
    res.status(200).json(saveProgram);
  } catch (error) {
    return res
      .status(505)
      .json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// READ PROGRAM
export const getAllSaleProgram = async (req, res) => {
  try {
    const program = await SaleProgram.find({
      isActive: true,
      end_date: {
        $gte: new Date(),
      },
    }).populate("discounts");
    return res.status(200).json(program);
  } catch (error) {
    return res
      .status(505)
      .json({ message: "Lỗi máy chủ", error: error.message });
  }
};
// UPDATE PROGRAM
export const updateSaleProgram = async (req, res) => {
  try {
    const program = await SaleProgram.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!program) {
      return res.status(404).json({ message: "Không tìm thấy chương trình" });
    }
    return res.status(200).json(program);
  } catch (error) {
    return res
      .status(505)
      .json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// DELETE PROGRAM
export const deleteSaleProgram = async (req, res) => {
  try {
    const program = await SaleProgram.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!program) {
      return res.status(404).json({ message: "Không tim thấy chương trình." });
    }
    await Discount.updateMany(
      { _id: { $in: program.discounts } },
      { isActive: false }
    );
    return res.status(200).json({ message: "Đã vô hiệu hoá chương trình." });
  } catch (error) {
    return res
      .status(505)
      .json({ message: "Lỗi máy chủ", error: error.message });
  }
};
// FIND BY ID SALEPROGRAM
export const getSaleProgramById = async (req, res) => {
  try {
    const program = await SaleProgram.findById(req.params.id).populate(
      "discounts"
    );
    if (!program) {
      return res.status(404).json({ message: "Không tìm thấy chương trình." });
    }
    return res.status(200).json(program);
  } catch (error) {
    return res
      .status(505)
      .json({ message: "Lỗi máy chủ", error: error.message });
  }
};
