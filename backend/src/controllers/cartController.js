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

  // 1. Tìm các chương trình đang chạy
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
        // Logic OR: end_sale lớn hơn hiện tại HOẶC không có end_sale (vĩnh viễn)
        $or: [{ end_sale: { $gte: current } }, { end_sale: null }],
      },
      populate: { path: "tiers" },
    })
    .lean();

  // 2. Làm phẳng danh sách discount
  const finalDiscounts = [];
  for (const p of programs) {
    if (!p.discounts) continue;
    for (const d of p.discounts) {
      // Gắn thêm tên chương trình vào discount để hiển thị ở FE
      finalDiscounts.push({ ...d, program_name: p.name });
    }
  }

  DISCOUNT_CACHE = { data: finalDiscounts, expires: now + 5 * 60 * 1000 };
  return DISCOUNT_CACHE.data;
};

// =============================
// HELPER: TÍNH TỔNG GIỎ HÀNG (LOGIC QUAN TRỌNG)
// =============================
export const calculateCartTotals = async (cartOrId) => {
  let cart = cartOrId;

  // 1. Đảm bảo cart được populate đầy đủ (Product + Category + Ảnh)
  if (typeof cartOrId === "string" || !cartOrId._id) {
    cart = await Cart.findById(cartOrId).populate({
      path: "items.product",
      select: "price category name stock avatar images", // Lấy cả avatar/images
      populate: { path: "category", select: "_id name" },
    });
  } else {
    // Kiểm tra nếu chưa populate sâu
    if (cart.items.length > 0 && !cart.items[0].product?.price) {
      cart = await Cart.findById(cart._id).populate({
        path: "items.product",
        select: "price category name stock avatar images",
        populate: { path: "category", select: "_id name" },
      });
    }
  }

  if (!cart) return null;

  // 2. Lấy danh sách discount đang active
  const discounts = await getActiveDiscountsCached();

  let totalOriginal = 0;
  let totalFinal = 0;
  let totalQty = 0;

  // 3. Duyệt từng sản phẩm trong giỏ
  for (const item of cart.items) {
    if (!item.product) continue;

    const product = item.product;
    const qty = item.quantity;
    const price = product.price || 0;

    // Giá trị cơ bản
    item.price_original = price;
    item.Total_price = price * qty;
    totalOriginal += price * qty;
    totalQty += qty;

    // 4. Tìm Discount phù hợp nhất
    // Ưu tiên discount thủ công (nếu có và hợp lệ)
    let chosenDiscount = null;

    if (item.manual_discount) {
      chosenDiscount = discounts.find(
        (d) => d._id.toString() === item.manual_discount.toString()
      );
    }

    // Nếu không có manual, tự động tìm discount tốt nhất
    if (!chosenDiscount) {
      let bestPercent = 0;

      for (const d of discounts) {
        let isMatch = false;

        // Kiểm tra target_ids (Mảng) thay vì target_id
        const targetIds = d.target_ids?.map((id) => id.toString()) || [];

        // A. Check theo PRODUCT
        if (d.target_type === "PRODUCT") {
          if (targetIds.includes(product._id.toString())) {
            isMatch = true;
          }
        }
        // B. Check theo CATEGORY
        else if (d.target_type === "CATEGORY" && product.category) {
          if (targetIds.includes(product.category._id.toString())) {
            isMatch = true;
          }
        }
        // C. Check ALL (Toàn sàn)
        else if (d.target_type === "ALL") {
          isMatch = true;
        }

        if (!isMatch) continue;

        // --- Logic tính % giảm (bao gồm Tier) ---
        let percent = 0;

        // Mức cơ bản
        if (qty >= (d.min_quantity ?? 1)) {
          percent = d.discount_percent ?? 0;
        }

        // Mức bậc thang (Tiers)
        if (d.tiers?.length) {
          const eligibleTiers = d.tiers
            .filter((t) => qty >= (t.min_quantity ?? 0))
            .sort((a, b) => b.discount_percent - a.discount_percent);

          if (eligibleTiers.length > 0) {
            percent = Math.max(percent, eligibleTiers[0].discount_percent);
          }
        }

        // So sánh để lấy discount tốt nhất
        if (percent > bestPercent) {
          bestPercent = percent;
          chosenDiscount = { ...d, _applied_percent: bestPercent };
        }
      }
    }

    // 5. Áp dụng discount vào item
    if (chosenDiscount) {
      const pct =
        chosenDiscount._applied_percent ?? chosenDiscount.discount_percent ?? 0;
      const discountPerUnit = price * (pct / 100);
      const saved = discountPerUnit * qty;

      item.applied_discount = {
        discount_id: chosenDiscount._id,
        program_name: chosenDiscount.program_name, // Tên chương trình
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

    // Tính toán lại mỗi khi get để đảm bảo giá/khuyến mãi luôn mới nhất
    const updated = await calculateCartTotals(cart);
    res.status(200).json(updated);
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy giỏ hàng" });
  }
};

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

    await cart.save();
    const finalCart = await calculateCartTotals(cart);
    res.status(200).json(finalCart);
  } catch (error) {
    console.error("Add Cart Error:", error);
    res.status(500).json({ message: error.message });
  }
};

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

    await cart.save();
    const finalCart = await calculateCartTotals(cart);
    res.status(200).json(finalCart);
  } catch (error) {
    console.error("Update Cart Error:", error);
    res.status(500).json({ message: error.message });
  }
};

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

    await cart.save();
    const finalCart = await calculateCartTotals(cart);
    res.status(200).json(finalCart);
  } catch (error) {
    console.error("Remove Cart Error:", error);
    res.status(500).json({ message: error.message });
  }
};

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
export const getGuestCartPreview = async (req, res) => {
  try {
    // 1. Nhận danh sách items từ client gửi lên: [{ productId, quantity }]
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(200).json({
        items: [],
        total_original_price: 0,
        total_discount_amount: 0,
        final_total_price: 0,
      });
    }

    // 2. Lấy thông tin sản phẩm từ DB (để lấy giá gốc, category, v.v.)
    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("name price avatar stock category") // Lấy các trường cần thiết
      .populate("category", "_id name");

    // 3. Lấy các chương trình khuyến mãi đang chạy
    const discounts = await getActiveDiscountsCached();

    let totalOriginal = 0;
    let totalFinal = 0;

    // 4. Duyệt qua từng item client gửi lên và tính toán
    const computedItems = items
      .map((clientItem) => {
        const product = products.find(
          (p) => p._id.toString() === clientItem.productId
        );

        // Nếu sản phẩm không tìm thấy (đã bị xóa), bỏ qua
        if (!product) return null;

        const qty = Number(clientItem.quantity);
        const price = product.price || 0;

        // --- LOGIC TÍNH KHUYẾN MÃI (Copy logic từ calculateCartTotals) ---

        // Tìm discount tốt nhất cho sản phẩm này
        let chosenDiscount = null;
        let bestPercent = 0;

        for (const d of discounts) {
          let isMatch = false;
          const targetIds = d.target_ids?.map((id) => id.toString()) || [];

          // A. Check theo PRODUCT
          if (d.target_type === "PRODUCT") {
            if (targetIds.includes(product._id.toString())) isMatch = true;
          }
          // B. Check theo CATEGORY
          else if (d.target_type === "CATEGORY" && product.category) {
            if (targetIds.includes(product.category._id.toString()))
              isMatch = true;
          }
          // C. Check ALL
          else if (d.target_type === "ALL") {
            isMatch = true;
          }

          if (!isMatch) continue;

          // Logic Tier
          let percent = 0;
          // Mức cơ bản
          if (qty >= (d.min_quantity ?? 1)) {
            percent = d.discount_percent ?? 0;
          }
          // Mức bậc thang
          if (d.tiers?.length) {
            const eligibleTiers = d.tiers
              .filter((t) => qty >= (t.min_quantity ?? 0))
              .sort((a, b) => b.discount_percent - a.discount_percent); // Giảm dần

            if (eligibleTiers.length > 0) {
              percent = Math.max(percent, eligibleTiers[0].discount_percent);
            }
          }

          // Lấy mức giảm tốt nhất
          if (percent > bestPercent) {
            bestPercent = percent;
            chosenDiscount = { ...d, _applied_percent: bestPercent };
          }
        }

        // Tính tiền sau khi có (hoặc không có) discount
        let finalPrice = price;
        let appliedDiscountData = null;

        if (chosenDiscount) {
          const pct = chosenDiscount._applied_percent;
          const discountAmountPerUnit = price * (pct / 100);
          finalPrice = price - discountAmountPerUnit;

          appliedDiscountData = {
            discount_id: chosenDiscount._id,
            program_name: chosenDiscount.program_name,
            discount_percent: pct,
            saved_amount: discountAmountPerUnit * qty,
          };
        }

        const itemTotal = finalPrice * qty;
        totalOriginal += price * qty;
        totalFinal += itemTotal;

        // Trả về cấu trúc khớp với CartItemBackend ở Frontend
        return {
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            avatar: product.avatar,
            stock: product.stock,
          },
          quantity: qty,
          price_original: price,
          price_discount: finalPrice,
          Total_price: itemTotal,
          applied_discount: appliedDiscountData,
        };
      })
      .filter((item) => item !== null); // Lọc bỏ item null

    // 5. Trả kết quả về Frontend
    return res.status(200).json({
      items: computedItems,
      total_original_price: totalOriginal,
      total_discount_amount: totalOriginal - totalFinal,
      final_total_price: totalFinal,
    });
  } catch (error) {
    console.error("Guest Preview Error:", error);
    return res.status(500).json({ message: "Lỗi tính toán giỏ hàng" });
  }
};
