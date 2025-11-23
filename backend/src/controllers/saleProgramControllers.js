// backend/src/controllers/saleProgramControllers.js
import SaleProgram from "../models/SaleProgram.js";
import Discount from "../models/Discount.js"; // <-- 1. Import Discount
import mongoose from "mongoose";

// === 1. SỬA HÀM CREATE ===
export const createSaleProgram = async (req, res) => {
  // Frontend gửi 'discounts' là mảng ID
  const { discounts, ...programData } = req.body;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Kiểm tra tên (Code gốc của ông)
    const existsProgram = await SaleProgram.findOne({ name: programData.name });
    if (existsProgram) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Tên chương trình khuyến mãi đã tồn tại." });
    }

    // 2. Tạo SaleProgram (Code đã sửa)
    const newProgram = new SaleProgram({
      ...programData,
      discounts: discounts || [], // <-- LẤY DISCOUNTS TỪ REQ.BODY
      createdBy: req.user.id,
    });
    const savedProgram = await newProgram.save({ session });

    // 3. CẬP NHẬT CHÉO: Set program_id cho các Discount con
    if (discounts && discounts.length > 0) {
      await Discount.updateMany(
        { _id: { $in: discounts } },
        { $set: { program_id: savedProgram._id } },
        { session }
      );
    }

    await session.commitTransaction();
    res.status(201).json(savedProgram);
  } catch (error) {
    await session.abortTransaction();
    return res
      .status(500)
      .json({ message: "Lỗi máy chủ", error: error.message });
  } finally {
    session.endSession();
  }
};

// === 2. SỬA HÀM GET ALL ===
// (Hàm này lấy TẤT CẢ program cho trang Admin, gỡ bỏ lọc)
export const getAllSaleProgram = async (req, res) => {
  try {
    const programs = await SaleProgram.find({}) // Gỡ bộ lọc
      .populate({
        path: "discounts",
        select: "name discount_percent", // Lấy tên discount
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(programs);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// === 3. SỬA HÀM UPDATE ===
export const updateSaleProgram = async (req, res) => {
  const { id } = req.params;
  const { discounts: newDiscountIds, ...programData } = req.body;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Lấy SaleProgram cũ để biết mảng discount CŨ
    const program = await SaleProgram.findById(id).session(session);
    if (!program) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Không tìm thấy program" });
    }
    const oldDiscountIds = program.discounts.map((d) => d.toString());

    // 2. Cập nhật SaleProgram với dữ liệu MỚI
    const updatedProgram = await SaleProgram.findByIdAndUpdate(
      id,
      { ...programData, discounts: newDiscountIds || [] },
      { new: true, runValidators: true, session }
    );

    // 3. CẬP NHẬT CHÉO (Gỡ cũ, Thêm mới)
    const removedDiscounts = oldDiscountIds.filter(
      (d) => !newDiscountIds.includes(d)
    );
    if (removedDiscounts.length > 0) {
      await Discount.updateMany(
        { _id: { $in: removedDiscounts } },
        { $set: { program_id: null } },
        { session }
      );
    }

    const addedDiscounts = newDiscountIds.filter(
      (d) => !oldDiscountIds.includes(d)
    );
    if (addedDiscounts.length > 0) {
      await Discount.updateMany(
        { _id: { $in: addedDiscounts } },
        { $set: { program_id: updatedProgram._id } },
        { session }
      );
    }

    await session.commitTransaction();
    res.status(200).json(updatedProgram);
  } catch (error) {
    await session.abortTransaction();
    return res
      .status(500)
      .json({ message: "Lỗi máy chủ", error: error.message });
  } finally {
    session.endSession();
  }
};

// === 4. CÁC HÀM CÒN LẠI (GIỮ NGUYÊN) ===

// DELETE PROGRAM (SOFT DELETE)
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
      .status(500)
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
      .status(500)
      .json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// HARD DELETE
export const hardDeleteSaleProgram = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "ID không hợp lệ" });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Tìm Program để lấy danh sách discount con
    const program = await SaleProgram.findById(id).session(session);
    if (!program) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Không tìm thấy chương trình" });
    }

    // 2. "Thả" các Discount con (set program_id về null)
    if (program.discounts && program.discounts.length > 0) {
      await Discount.updateMany(
        { _id: { $in: program.discounts } },
        { $set: { program_id: null } }, // <-- "Thả" discount
        { session }
      );
    }

    // 3. Xóa vĩnh viễn SaleProgram
    await SaleProgram.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    res.status(200).json({ message: "Đã xóa vĩnh viễn chương trình" });
  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi xóa cứng program:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  } finally {
    session.endSession();
  }
};
