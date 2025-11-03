import mongoose from "mongoose";
import Discount from "../models/Discount.js";
import DiscountTier from "../models/DiscountTier.js";
import SaleProgram from "../models/SaleProgram.js";

// @desc    Tạo mã giảm giá mới (có thể kèm bậc thang)
// @route   POST /api/v1/discounts
// @access  Admin
export const createDiscount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { tiers: tierData, program_id, ...discountData } = req.body;

    // BƯỚC 1: Tạo Discount chính TRƯỚC
    // (tạm thời với mảng tiers rỗng)
    const newDiscount = new Discount({
      ...discountData,
      tiers: [], // Sẽ cập nhật mảng này ở Bước 3
    });
    const savedDiscount = await newDiscount.save({ session });

    let savedTiers = [];

    // BƯỚC 2: TẠO Tiers (nếu có)
    if (tierData && tierData.length > 0) {
      // Gán discount_id (vừa tạo ở Bước 1) cho tất cả các tier con
      const tiersToCreate = tierData.map((tier) => ({
        ...tier,
        discount_id: savedDiscount._id, // <-- GÁN ID CHA VÀO ĐÂY
      }));

      // Bây giờ việc tạo tier sẽ thành công (vì đã có discount_id)
      const createdTiers = await DiscountTier.create(tiersToCreate, {
        session,
        ordered: true,
      });
      savedTiers = createdTiers;

      // BƯỚC 3: Cập nhật Discount cha
      // Gán mảng ID của các tier con vào lại Discount cha
      savedDiscount.tiers = savedTiers.map((t) => t._id);
      await savedDiscount.save({ session }); // Lưu lại discount cha
    }

    // BƯỚC 4: Thêm discount này vào SaleProgram (nếu có)
    if (program_id) {
      await SaleProgram.findByIdAndUpdate(
        program_id,
        { $push: { discounts: savedDiscount._id } },
        { session }
      );
    }

    // Nếu mọi thứ OK, commit
    await session.commitTransaction();

    // Populate tiers vào kết quả trả về cho đầy đủ
    const finalDiscount = await savedDiscount.populate("tiers");
    res.status(201).json(finalDiscount);
  } catch (error) {
    // Nếu có lỗi, hủy bỏ mọi thứ
    await session.abortTransaction();
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Lấy tất cả discount (đang hoạt động)
// @route   GET /api/v1/discounts
// @access  Public
export const getDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find({
      isActive: true,
      start_sale: { $lte: new Date() },
      $or: [{ end_sale: null }, { end_sale: { $gte: new Date() } }],
    }).populate("tiers");
    res.status(200).json(discounts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Lấy chi tiết 1 discount
// @route   GET /api/v1/discounts/:id
// @access  Public
export const getDiscountById = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id).populate("tiers");
    if (!discount) {
      return res.status(404).json({ message: "Không tìm thấy mã giảm giá." });
    }
    res.status(200).json(discount);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Cập nhật discount
// @route   PUT /api/v1/discounts/:id
// @access  Admin
export const updateDiscount = async (req, res) => {
  try {
    // (Lưu ý: logic cập nhật/xóa tiers phức tạp, tạm thời chỉ update discount chính)
    const updatedDiscount = await Discount.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedDiscount) {
      return res.status(404).json({ message: "Không tìm thấy mã giảm giá." });
    }
    res.status(200).json(updatedDiscount);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Xóa (vô hiệu hóa) discount
// @route   DELETE /api/v1/discounts/:id
// @access  Admin
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

// -----------------------------------------------------------------
// @desc    ÁP DỤNG MÃ GIẢM GIÁ (Logic bảo mật)
// @route   POST /api/v1/discounts/apply
// @access  User, Agency (Đã đăng nhập)
// -----------------------------------------------------------------
export const applyDiscount = async (req, res) => {
  try {
    const { discountId } = req.body;
    // 1. Lấy user từ req.user (do 'protectedRoute' cung cấp)
    const user = req.user;

    if (!discountId) {
      return res.status(400).json({ message: "Vui lòng cung cấp discountId." });
    }

    // 2. Tìm mã giảm giá
    const discount = await Discount.findById(discountId).populate("tiers");
    if (!discount) {
      return res.status(404).json({ message: "Mã giảm giá không tồn tại." });
    }

    // 3. Kiểm tra các điều kiện (isActive, ngày hết hạn...)
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

    // 4. 🔥 LOGIC BẢO MẬT CỐT LÕI 🔥
    // Kiểm tra quyền dựa trên DỮ LIỆU
    const allowedRoles = ["AGENCY", "admin"]; // <-- Admin được thêm vào đây

    // Kiểm tra quyền dựa trên DỮ LIỆU
    if (discount.type === "AGENCY" && !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: `Bạn không đủ quyền (Role: ${user.role}) để sử dụng mã này.`,
      });
    }

    // 5. Logic tính toán (Bạn sẽ bổ sung logic nghiệp vụ ở đây)
    // ...

    return res.status(200).json({
      message: "Áp dụng mã giảm giá thành công.",
      discountApplied: discount,
    });
  } catch (error) {
    console.error("Lỗi khi áp dụng discount:", error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ." });
  }
};
