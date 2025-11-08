// backend/src/controllers/saleProgramControllers.js
import SaleProgram from "../models/SaleProgram.js";
import Discount from "../models/Discount.js"; // <-- Phải import Discount
import mongoose from "mongoose";

// === SỬA HÀM CREATE: Thêm transaction và cập nhật chéo ===
export const createSaleProgram = async (req, res) => {
  // Frontend gửi 'discounts' là mảng ID
  const { discounts, ...programData } = req.body;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Kiểm tra tên
    const existsProgram = await SaleProgram.findOne({ name: programData.name });
    if (existsProgram) {
      await session.abortTransaction();
      return res
        .status(400) // 400 Bad Request thì đúng hơn 404
        .json({ message: "Tên chương trình khuyến mãi đã tồn tại." });
    }

    // 2. Tạo SaleProgram
    const newProgram = new SaleProgram({
      ...programData,
      discounts: discounts || [],
      createdBy: req.user.id,
    });
    const savedProgram = await newProgram.save({ session });

    // 3. CẬP NHẬT CHÉO: Set program_id cho các Discount con
    if (discounts && discounts.length > 0) {
      await Discount.updateMany(
        { _id: { $in: discounts } },
        { $set: { program_id: savedProgram._id } }, // <-- Bước quan trọng
        { session }
      );
    }

    await session.commitTransaction();
    res.status(201).json(savedProgram); // 201 Created
  } catch (error) {
    await session.abortTransaction();
    return res
      .status(500) // 500 thì đúng hơn 505
      .json({ message: "Lỗi máy chủ", error: error.message });
  } finally {
    session.endSession();
  }
};

// === SỬA HÀM GET ALL: Gỡ bộ lọc ngày/active VÀ thêm populate ===
export const getAllSaleProgram = async (req, res) => {
  try {
    // 1. GỠ BỎ TẤT CẢ BỘ LỌC (để find({}))
    const program = await SaleProgram.find({})
      .populate({
        path: "discounts", // 2. Populate (lồng) mảng 'discounts'
        select: "name", // 3. Chỉ cần lấy tên của discount
      })
      .sort({ createdAt: -1 }); // Sắp xếp cho dễ nhìn

    return res.status(200).json(program);
  } catch (error) {
    return res
      .status(500) // (Nên dùng 500 cho lỗi server)
      .json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// === SỬA HÀM UPDATE: Thêm transaction và logic (gỡ/thêm) ===
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

    // 3. CẬP NHẬT CHÉO:
    // 3a. Gỡ program_id khỏi các discount CŨ (bị xóa khỏi program)
    const removedDiscounts = oldDiscountIds.filter(
      (d) => !newDiscountIds.includes(d)
    );
    if (removedDiscounts.length > 0) {
      await Discount.updateMany(
        { _id: { $in: removedDiscounts } },
        { $set: { program_id: null } }, // <-- Set về null
        { session }
      );
    }

    // 3b. Thêm program_id cho các discount MỚI (được thêm vào program)
    const addedDiscounts = newDiscountIds.filter(
      (d) => !oldDiscountIds.includes(d)
    );
    if (addedDiscounts.length > 0) {
      await Discount.updateMany(
        { _id: { $in: addedDiscounts } },
        { $set: { program_id: updatedProgram._id } }, // <-- Set ID program
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

// HÀM DELETE (SOFT) CỦA BẠN - Đã đúng logic
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
    // Logic này rất hay: tắt program thì tắt luôn discount con
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

// HÀM FIND BY ID CỦA BẠN - Đã đúng logic
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
