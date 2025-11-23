import mongoose from "mongoose";
import Discount from "../models/Discount.js";
import DiscountTier from "../models/DiscountTier.js";
import SaleProgram from "../models/SaleProgram.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js"; // 🚨 QUAN TRỌNG: Thêm import này

// @desc    Tạo mã giảm giá mới
// @route   POST /api/v1/discounts
// @access  Admin
export const createDiscount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Lấy target_ids từ body (nếu có)
    const {
      tiers: tierData,
      program_id,
      target_ids,
      ...discountData
    } = req.body;

    // BƯỚC 1: Tạo Discount chính
    const newDiscount = new Discount({
      ...discountData,
      target_ids: target_ids || [], // Lưu mảng ID sản phẩm/danh mục
      tiers: [],
    });
    const savedDiscount = await newDiscount.save({ session });

    let savedTiers = [];

    // BƯỚC 2: TẠO Tiers
    if (tierData && tierData.length > 0) {
      const tiersToCreate = tierData.map((tier) => ({
        ...tier,
        discount_id: savedDiscount._id,
      }));

      const createdTiers = await DiscountTier.create(tiersToCreate, {
        session,
        ordered: true,
      });
      savedTiers = createdTiers;

      // BƯỚC 3: Cập nhật Discount cha
      savedDiscount.tiers = savedTiers.map((t) => t._id);
      await savedDiscount.save({ session });
    }

    // BƯỚC 4: Thêm vào SaleProgram
    if (program_id) {
      await SaleProgram.findByIdAndUpdate(
        program_id,
        { $push: { discounts: savedDiscount._id } },
        { session }
      );
    }

    await session.commitTransaction();
    const finalDiscount = await savedDiscount.populate("tiers");
    res.status(201).json(finalDiscount);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Lấy tất cả discount
// @route   GET /api/v1/discounts
// @access  Public
export const getDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find({})
      .sort({ createdAt: -1 })
      .populate("tiers");
    res.status(200).json(discounts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// ============================================================
// 🚨 HÀM ĐÃ SỬA ĐỂ KHẮC PHỤC LỖI 500
// @desc    Lấy chi tiết 1 discount (Kèm thông tin SP/Category)
// @route   GET /api/v1/discounts/:id
// @access  Public
// ============================================================
export const getDiscountById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    // 2. Lấy Discount (Dùng .lean() để trả về object thuần, dễ chỉnh sửa)
    const discount = await Discount.findById(id).populate("tiers").lean();

    if (!discount) {
      return res.status(404).json({ message: "Không tìm thấy mã giảm giá." });
    }

    // 3. Xử lý lấy thông tin chi tiết (Sản phẩm hoặc Danh mục)
    if (discount.target_ids && discount.target_ids.length > 0) {
      // Lọc các ID hợp lệ
      const validIds = discount.target_ids.filter((itemId) =>
        mongoose.Types.ObjectId.isValid(itemId)
      );

      if (discount.target_type === "PRODUCT") {
        // Tìm trong bảng Product
        const products = await Product.find({
          _id: { $in: validIds },
        }).select("name price avatar"); // Chỉ lấy tên, giá, ảnh

        discount.target_ids = products;
      } else if (discount.target_type === "CATEGORY") {
        // Tìm trong bảng Category
        const categories = await Category.find({
          _id: { $in: validIds },
        }).select("name"); // Chỉ lấy tên danh mục

        discount.target_ids = categories;
      }
      // Nếu là ALL hoặc ORDER_TOTAL thì giữ nguyên mảng ID hoặc để rỗng
    } else {
      discount.target_ids = [];
    }

    res.status(200).json(discount);
  } catch (error) {
    console.error("Get Discount Detail Error:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Update discount
export const updateDiscountWithTiers = async (req, res) => {
  const { id } = req.params;
  const { tiers, target_ids, ...discountData } = req.body; // Lấy target_ids

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Discount không tìm thấy" });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const discountToUpdate = await Discount.findById(id).session(session);
    if (!discountToUpdate) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Discount không tìm thấy" });
    }

    // Xóa tiers cũ
    if (discountToUpdate.tiers && discountToUpdate.tiers.length > 0) {
      await DiscountTier.deleteMany(
        { _id: { $in: discountToUpdate.tiers } },
        { session }
      );
    }

    // Tạo tiers mới
    let newTierIds = [];
    if (tiers && tiers.length > 0) {
      const tiersToCreate = tiers.map((tier) => ({
        ...tier,
        discount_id: discountToUpdate._id,
      }));

      const newTiers = await DiscountTier.insertMany(tiersToCreate, {
        session,
      });
      newTierIds = newTiers.map((t) => t._id);
    }

    // Cập nhật data
    Object.assign(discountToUpdate, discountData);

    // Cập nhật target_ids nếu có gửi lên
    if (target_ids) {
      discountToUpdate.target_ids = target_ids;
    }

    discountToUpdate.tiers = newTierIds;

    await discountToUpdate.save({ session });
    await session.commitTransaction();

    const result = await Discount.findById(id).populate("tiers");
    res.status(200).json(result);
  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi cập nhật discount:", error);
    res.status(500).json({
      message: "Lỗi máy chủ khi cập nhật discount",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// @desc    Soft Delete
export const deleteDiscount = async (req, res) => {
  try {
    const disabledDiscount = await Discount.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!disabledDiscount) {
      return res.status(404).json({ message: "Không tìm thấy mã giảm giá." });
    }
    res
      .status(200)
      .json({ message: "Đã vô hiệu hóa mã giảm giá.", disabledDiscount });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Hard Delete
export const hardDeleteDiscount = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "ID không hợp lệ" });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const discount = await Discount.findById(id).session(session);
    if (!discount) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Discount không tìm thấy" });
    }

    if (discount.tiers && discount.tiers.length > 0) {
      await DiscountTier.deleteMany(
        { _id: { $in: discount.tiers } },
        { session }
      );
    }

    if (discount.program_id) {
      await SaleProgram.findByIdAndUpdate(
        discount.program_id,
        { $pull: { discounts: discount._id } },
        { session }
      );
    }

    await Discount.findByIdAndDelete(id, { session });
    await session.commitTransaction();

    res.status(200).json({ message: "Đã xóa vĩnh viễn discount" });
  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi xóa cứng discount:", error);
    res
      .status(500)
      .json({ message: "Lỗi máy chủ khi xóa", error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Apply Discount (Check logic)
export const applyDiscount = async (req, res) => {
  try {
    const { discountId } = req.body;
    const user = req.user;

    if (!discountId) {
      return res.status(400).json({ message: "Vui lòng cung cấp discountId." });
    }

    const discount = await Discount.findById(discountId).populate("tiers");
    if (!discount) {
      return res.status(404).json({ message: "Mã giảm giá không tồn tại." });
    }

    const now = new Date();
    if (!discount.isActive) {
      return res
        .status(400)
        .json({ message: "Mã giảm giá này không còn hoạt động." });
    }
    if (discount.start_sale > now) {
      return res
        .status(400)
        .json({ message: "Mã giảm giá chưa đến ngày bắt đầu." });
    }
    if (discount.end_sale && discount.end_sale < now) {
      return res.status(400).json({ message: "Mã giảm giá đã hết hạn." });
    }

    const allowedRoles = ["AGENCY", "admin"];
    if (discount.type === "AGENCY" && !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: `Bạn không đủ quyền (Role: ${user.role}) để sử dụng mã này.`,
      });
    }

    return res.status(200).json({
      message: "Áp dụng mã giảm giá thành công.",
      discountApplied: discount,
    });
  } catch (error) {
    console.error("Lỗi khi áp dụng discount:", error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ." });
  }
};
