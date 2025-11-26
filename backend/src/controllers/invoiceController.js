import Cart from "../models/Cart.js";
import Invoice from "../models/Invoice.js"; // <-- Dùng luôn Model Invoice

export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    // Lấy dữ liệu từ Frontend gửi lên
    const {
      recipient_name,
      recipient_phone,
      recipient_address,
      shippingMethod,
      paymentMethod,
    } = req.body;

    // 1. Lấy giỏ hàng
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // 2. Tính phí ship
    const shippingCost = shippingMethod === "fast" ? 30000 : 15000;
    const finalAmount = cart.final_total_price + shippingCost;

    // 3. Tạo Invoice (Bản chất là Đơn hàng)
    const newInvoice = new Invoice({
      user: userId,
      // Mapping dữ liệu từ frontend vào đúng cấu trúc Schema Invoice
      recipient_info: {
        name: recipient_name,
        phone: recipient_phone,
        address: recipient_address,
      },
      items: cart.items.map((item) => ({
        product_id: item.product._id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.price_original,
        total_price: item.Total_price,
      })),
      payment_method: "COD", // Ghi cứng là COD vì route này dành cho COD
      shipping_fee: shippingCost,
      total_amount: finalAmount,
      status: "PENDING", // Trạng thái: Chờ xử lý
    });

    await newInvoice.save();

    // 4. Xóa giỏ hàng sau khi đặt thành công
    cart.items = [];
    cart.total_quantity = 0;
    cart.total_original_price = 0;
    cart.total_discount_amount = 0;
    cart.final_total_price = 0;
    await cart.save();

    res.status(201).json({
      message: "Đặt hàng thành công",
      invoiceId: newInvoice._id,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ message: "Lỗi tạo đơn hàng", error: error.message });
  }
};
