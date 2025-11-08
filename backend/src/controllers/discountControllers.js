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
    const discounts = await Discount.find({})
      .sort({ createdAt: -1 }) // Sắp xếp cho dễ nhìn
      .populate("tiers");
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

export const updateDiscountWithTiers = async (req, res) => {
  const { id } = req.params; // Lấy ID của discount cần sửa

  // Tách 'tiers' (dữ liệu thô) ra khỏi phần còn lại
  const { tiers, ...discountData } = req.body;

  // Kiểm tra xem ID có hợp lệ không
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Discount không tìm thấy" });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // === BƯỚC 1: Tìm Discount cha ===
    const discountToUpdate = await Discount.findById(id).session(session);
    if (!discountToUpdate) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Discount không tìm thấy" });
    }

    // === BƯỚC 2: Xóa TẤT CẢ các tier con CŨ ===
    // Dùng mảng 'tiers' cũ (mảng ObjectId) đang lưu trong discount
    if (discountToUpdate.tiers && discountToUpdate.tiers.length > 0) {
      await DiscountTier.deleteMany(
        { _id: { $in: discountToUpdate.tiers } },
        { session }
      );
    }

    // === BƯỚC 3: Tạo các tier MỚI (giống hệt hàm create) ===
    let newTierIds = [];
    if (tiers && tiers.length > 0) {
      // 'tiers' lúc này là [{ min_quantity, discount_percent }] từ frontend
      const tiersToCreate = tiers.map((tier) => ({
        ...tier,
        discount_id: discountToUpdate._id, // Liên kết với cha
      }));

      const newTiers = await DiscountTier.insertMany(tiersToCreate, {
        session,
      });
      newTierIds = newTiers.map((t) => t._id);
    }

    // === BƯỚC 4: Cập nhật Discount cha (cha) ===
    // Cập nhật các trường (name, type, v.v...) VÀ mảng 'tiers' mới
    Object.assign(discountToUpdate, discountData); // Cập nhật các trường như name, type...
    discountToUpdate.tiers = newTierIds; // Gán mảng ID tier mới

    await discountToUpdate.save({ session });

    // === KẾT THÚC ===
    await session.commitTransaction();

    // Trả về data mới nhất
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

// @desc    Xóa CỨNG discount và các tier liên quan
// @route   DELETE /api/v1/discounts/hard-delete/:id
// @access  Admin
export const hardDeleteDiscount = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "ID không hợp lệ" });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Tìm Discount cha để lấy thông tin
    const discount = await Discount.findById(id).session(session);
    if (!discount) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Discount không tìm thấy" });
    }

    // 2. Xóa tất cả DiscountTier (Con)
    if (discount.tiers && discount.tiers.length > 0) {
      await DiscountTier.deleteMany(
        { _id: { $in: discount.tiers } },
        { session }
      );
    }

    // 3. Gỡ Discount này ra khỏi SaleProgram (nếu có)
    if (discount.program_id) {
      await SaleProgram.findByIdAndUpdate(
        discount.program_id,
        { $pull: { discounts: discount._id } }, // $pull: gỡ ID khỏi mảng
        { session }
      );
    }

    // 4. Xóa chính Discount (Cha)
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
