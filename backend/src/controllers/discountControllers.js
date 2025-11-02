// backend/src/controllers/discountControllers.js
import Discount from "../models/Discount.js";
import DiscountTier from "../models/DiscountTier.js";

const createTiersForDiscount = async (discountId, tiersPayload = []) => {
  if (!Array.isArray(tiersPayload) || tiersPayload.length === 0) return [];
  const docs = tiersPayload.map((t) => ({ ...t, discount_id: discountId }));
  const created = await DiscountTier.insertMany(docs);
  return created.map((d) => d._id);
};

// CREATE DISCOUNT (body may include `tiers` array)
export const createDiscount = async (req, res) => {
  try {
    const { tiers, ...discountData } = req.body;

    // Create discount first (without tiers)
    const discount = await Discount.create(discountData);

    // If tiers provided -> create tiers and attach
    if (Array.isArray(tiers) && tiers.length > 0) {
      const tierIds = await createTiersForDiscount(discount._id, tiers);
      discount.tiers = tierIds;
      await discount.save();
    }

    // populate if needed
    const populated = await Discount.findById(discount._id).populate("tiers");
    res.status(201).json(populated);
  } catch (error) {
    console.error("createDiscount error:", error);
    res
      .status(400)
      .json({ message: "Lỗi khi tạo discount", error: error.message });
  }
};

// GET ALL (populate tiers)
export const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find()
      .populate("program_id", "name start_date end_date")
      .populate("tiers")
      .sort({ createdAt: -1 });
    res.status(200).json(discounts);
  } catch (error) {
    console.error("getAllDiscounts error:", error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách discount",
      error: error.message,
    });
  }
};

// GET BY ID
export const getDiscountById = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id).populate("tiers");
    if (!discount)
      return res.status(404).json({ message: "Không tìm thấy discount" });
    res.status(200).json(discount);
  } catch (error) {
    console.error("getDiscountById error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy discount", error: error.message });
  }
};

// UPDATE DISCOUNT (replace tiers if provided)
export const updateDiscount = async (req, res) => {
  try {
    const { tiers, ...discountData } = req.body;

    // Update discount base data
    const updated = await Discount.findByIdAndUpdate(
      req.params.id,
      discountData,
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ message: "Không tìm thấy discount" });

    // If tiers provided -> delete old tiers and create new ones
    if (Array.isArray(tiers)) {
      // delete existing tier docs
      await DiscountTier.deleteMany({ discount_id: updated._id });
      const newTierIds = await createTiersForDiscount(updated._id, tiers);
      updated.tiers = newTierIds;
      await updated.save();
    }

    const populated = await Discount.findById(updated._id).populate("tiers");
    res.status(200).json(populated);
  } catch (error) {
    console.error("updateDiscount error:", error);
    res
      .status(400)
      .json({ message: "Lỗi khi cập nhật discount", error: error.message });
  }
};

// DELETE DISCOUNT (and cascade delete tiers)
export const deleteDiscount = async (req, res) => {
  try {
    const deleted = await Discount.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy discount" });

    // delete tiers
    await DiscountTier.deleteMany({ discount_id: deleted._id });

    res.status(200).json({ message: "Đã xóa discount thành công" });
  } catch (error) {
    console.error("deleteDiscount error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi xóa discount", error: error.message });
  }
};
