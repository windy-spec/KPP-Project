import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import SaleProgram from "../models/SaleProgram.js";

// =============================
// CACHE DISCOUNT (5 phút)
// =============================
let DISCOUNT_CACHE = { data: null, expires: 0 };

const getActiveDiscountsCached = async () => {
  const now = Date.now();
  if (DISCOUNT_CACHE.data && now < DISCOUNT_CACHE.expires) {
    return DISCOUNT_CACHE.data;
  }

  const current = new Date();
  const programs = await SaleProgram.find({
    isActive: true,
    start_date: { $lte: current },
    end_date: { $gte: current },
  })
    .populate({
      path: "discounts",
      match: {
        isActive: true,
        start_sale: { $lte: current },
        end_sale: { $gte: current }, // <-- Đã sửa
      },
      populate: { path: "tiers" },
    })
    .lean();

  // Gán program_name vào mỗi discount
  const finalDiscounts = [];
  for (const p of programs) {
    if (!p.discounts) continue;
    for (const d of p.discounts) {
      finalDiscounts.push({ ...d, program_name: p.name || p.program_name });
    }
  }

  DISCOUNT_CACHE = { data: finalDiscounts, expires: now + 5 * 60 * 1000 };
  return DISCOUNT_CACHE.data;
};

// =============================
// HELPER: TÍNH TỔNG GIỎ HÀNG
// =============================
export const calculateCartTotals = async (cartOrId) => {
  let cart = cartOrId;

  // 1. Đảm bảo cart được populate
  if (typeof cartOrId === "string" || !cartOrId._id) {
    cart = await Cart.findById(cartOrId).populate({
      path: "items.product",
      select: "price category name stock avatar images",
      populate: { path: "category", select: "_id name" },
    });
  } else {
    // Kiểm tra nếu 'product' chưa được populate
    if (cart.items.length > 0 && !cart.items[0].product?.price) {
      cart = await Cart.findById(cart._id).populate({
        path: "items.product",
        select: "price category name stock avatar images",
        populate: { path: "category", select: "_id name" },
      });
    }
  }

  if (!cart) return null;

  // 2. Lấy danh sách discount
  const discounts = await getActiveDiscountsCached();

  let totalOriginal = 0;
  let totalFinal = 0;
  let totalQty = 0;

  // 3. Tính toán cho từng item
  for (const item of cart.items) {
    if (!item.product) continue;

    const product = item.product;
    const qty = item.quantity;
    const price = product.price || 0;

    // Set giá trị cơ bản
    item.price_original = price;
    item.Total_price = price * qty;
    totalOriginal += price * qty;
    totalQty += qty;

    // 4. Tìm discount
    let chosenDiscount = item.manual_discount
      ? discounts.find(
          (d) => d._id.toString() === item.manual_discount.toString()
        )
      : null;

    // Tự động tìm best discount nếu không có manual
    if (!chosenDiscount) {
      let bestPercent = 0;
      for (const d of discounts) {
        const matchProduct =
          d.target_type === "PRODUCT" &&
          d.target_id?.toString() === product._id.toString();

        const matchCategory =
          d.target_type === "CATEGORY" &&
          product.category &&
          d.target_id?.toString() === product.category._id.toString();

        if (!matchProduct && !matchCategory) continue;

        // ======================================================
        // [FIX TỐI ƯU] SỬA LOGIC LẤY % GIẢM GIÁ
        // ======================================================
        let percent = 0;

        // 1. Lấy % giảm giá CƠ BẢN trước (nếu đủ SL)
        // Đây là 10% của bạn
        if (qty >= (d.min_quantity ?? 0)) {
          percent = d.discount_percent ?? 0;
        }

        // 2. Sau đó, kiểm tra Tiers xem có % nào TỐT HƠN không
        if (d.tiers?.length) {
          const eligibleTiers = d.tiers
            .filter((t) => qty >= (t.min_quantity ?? 0))
            .sort((a, b) => b.discount_percent - a.discount_percent);

          if (eligibleTiers.length > 0) {
            // 3. Luôn lấy % cao nhất (cơ bản vs tier)
            percent = Math.max(percent, eligibleTiers[0].discount_percent);
          }
        }
        // ======================================================
        // KẾT THÚC FIX
        // ======================================================

        if (percent > bestPercent) {
          bestPercent = percent;
          chosenDiscount = { ...d, _applied_percent: bestPercent };
        }
      }
    }

    // 5. Áp dụng discount nếu tìm thấy
    if (chosenDiscount) {
      const pct =
        chosenDiscount._applied_percent ?? chosenDiscount.discount_percent ?? 0;
      const discountPerUnit = price * (pct / 100);
      const saved = discountPerUnit * qty;

      item.applied_discount = {
        discount_id: chosenDiscount._id,
        program_name: chosenDiscount.program_name,
        discount_percent: pct,
        saved_amount: saved,
      };
      item.price_discount = price - discountPerUnit;
      item.Total_price = item.price_discount * qty;
    } else {
      item.applied_discount = null;
      item.price_discount = price;
      item.Total_price = price * qty;
    }

    totalFinal += item.Total_price;
  }

  // 6. Cập nhật tổng giỏ hàng
  cart.total_quantity = totalQty;
  cart.total_original_price = totalOriginal;
  cart.total_discount_amount = totalOriginal - totalFinal;
  cart.final_total_price = totalFinal;

  await cart.save();
  return cart;
};

// =============================
// CONTROLLERS
// =============================

/** Lấy giỏ hàng (cho cả user và guest) */
export const getCart = async (req, res) => {
  try {
    const cartQuery = req.cartQuery;
    let cart = await Cart.findOne(cartQuery);

    if (!cart) {
      return res.status(200).json({
        items: [],
        total_quantity: 0,
        total_original_price: 0,
        total_discount_amount: 0,
        final_total_price: 0,
      });
    }

    const updated = await calculateCartTotals(cart);
    res.status(200).json(updated);
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy giỏ hàng" });
  }
};

/** Thêm sản phẩm (cho cả user và guest) */
export const addToCart = async (req, res) => {
  try {
    const cartQuery = req.cartQuery;
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity);
    if (!qty || qty < 1)
      return res.status(400).json({ message: "Số lượng không hợp lệ" });

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    if (typeof product.stock === "number" && product.stock < qty) {
      return res.status(400).json({ message: "Số lượng vượt quá tồn kho" });
    }

    let cart = await Cart.findOne(cartQuery);
    if (!cart) cart = new Cart({ ...cartQuery, items: [] });

    const idx = cart.items.findIndex((p) => p.product.toString() === productId);
    if (idx > -1) {
      const newQty = cart.items[idx].quantity + qty;
      if (typeof product.stock === "number" && product.stock < newQty) {
        return res.status(400).json({ message: "Số lượng vượt quá tồn kho" });
      }
      cart.items[idx].quantity = newQty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save(); // <-- Đã sửa (lưu trước khi tính)

    const finalCart = await calculateCartTotals(cart);
    res.status(200).json(finalCart);
  } catch (error) {
    console.error("Add Cart Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/** Cập nhật số lượng (cho cả user và guest) */
export const updateCartItem = async (req, res) => {
  try {
    const cartQuery = req.cartQuery;
    const { productId, quantity } = req.body;
    const newQty = parseInt(quantity);

    const cart = await Cart.findOne(cartQuery);
    if (!cart) return res.status(404).json({ message: "Giỏ hàng trống" });

    const idx = cart.items.findIndex((p) => p.product.toString() === productId);
    if (idx === -1)
      return res.status(404).json({ message: "Sản phẩm không có trong giỏ" });

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    if (
      newQty > 0 &&
      typeof product.stock === "number" &&
      newQty > product.stock
    ) {
      return res.status(400).json({ message: "Số lượng vượt quá tồn kho" });
    }

    if (newQty > 0) {
      cart.items[idx].quantity = newQty;
    } else {
      cart.items.splice(idx, 1);
    }

    await cart.save(); // <-- Đã sửa (lưu trước khi tính)

    const finalCart = await calculateCartTotals(cart);
    res.status(200).json(finalCart);
  } catch (error) {
    console.error("Update Cart Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/** Xóa sản phẩm (cho cả user và guest) */
export const removeCartItem = async (req, res) => {
  try {
    const cartQuery = req.cartQuery;
    const productId = req.params.productId;

    const cart = await Cart.findOne(cartQuery);
    if (!cart)
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save(); // <-- Đã sửa (lưu trước khi tính)

    const finalCart = await calculateCartTotals(cart);
    res.status(200).json(finalCart);
  } catch (error) {
    console.error("Remove Cart Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/** Checkout (CHỈ CHO USER ĐÃ ĐĂNG NHẬP) */
export const proceedToCheckout = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId });

    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Giỏ hàng của bạn đang trống." });
    }

    const finalCart = await calculateCartTotals(cart);
    res.status(200).json({
      message: "Sẵn sàng thanh toán!",
      cart: finalCart,
      paymentOptions: [
        { key: "COD", name: "Thanh toán khi nhận hàng" },
        { key: "BANK_QR", name: "Thanh toán qua mã QR Ngân hàng" },
      ],
    });
  } catch (error) {
    console.error("proceedToCheckout error:", error);
    res.status(500).json({ message: error.message });
  }
};
