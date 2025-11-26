import axios from "axios";
import crypto from "crypto";
import Cart from "../models/Cart.js";
import Invoice from "../models/Invoice.js";

// =============================
// 1. THANH TOÁN MOMO (TÍCH HỢP TỪ CODE SANDBOX)
// =============================
export const createMomoPayment = async (req, res) => {
  try {
    console.log("--- BẮT ĐẦU TẠO THANH TOÁN MOMO ---");

    // 1. Kiểm tra ENV
    if (!process.env.MOMO_PARTNER_CODE || !process.env.MOMO_ACCESS_KEY) {
      throw new Error("Chưa cấu hình file .env cho Momo!");
    }

    const userId = req.user._id;
    const {
      recipient_name,
      recipient_phone,
      recipient_address,
      shippingMethod,
    } = req.body;

    // 2. Lấy Cart
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // 3. Tính tiền
    const shippingCost = shippingMethod === "fast" ? 30000 : 15000;
    const finalAmount = cart.final_total_price + shippingCost;

    // Tạo ID đơn hàng
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const requestId = partnerCode + new Date().getTime();
    const orderId = requestId;

    console.log("-> OrderId:", orderId);
    console.log("-> Amount:", finalAmount);

    // 4. CHUẨN BỊ DỮ LIỆU INVOICE (Quan trọng: Map đúng schema)
    const invoiceItems = cart.items
      .map((item) => {
        if (!item.product) return null; // Bỏ qua nếu sản phẩm bị xóa
        return {
          product_id: item.product._id,
          product_name: item.product.name || "Sản phẩm", // Fallback nếu thiếu tên
          quantity: item.quantity,
          unit_price: item.price_original,
          total_price: item.Total_price || item.quantity * item.price_original,
        };
      })
      .filter((i) => i !== null); // Lọc bỏ null

    // 5. LƯU DB (Bắt lỗi validation)
    const newInvoice = new Invoice({
      user: userId,
      momoOrderId: orderId,
      recipient_info: {
        name: recipient_name,
        phone: recipient_phone,
        address: recipient_address,
      },
      items: invoiceItems,
      payment_method: "MOMO_QR", // Phải khớp enum trong Model Invoice
      shipping_fee: shippingCost,
      total_amount: finalAmount,
      status: "PENDING",
    });

    await newInvoice.save();
    console.log("-> Đã lưu Invoice vào DB");

    // 6. GỌI MOMO
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const orderInfo = "Thanh toan don hang " + orderId;
    const redirectUrl = process.env.BASE_URL;
    const ipnUrl = process.env.SERVER_URL; // Dùng trực tiếp link webhook site
    const requestType = "captureWallet";
    const extraData = "";

    // Raw Signature (Theo thứ tự a-z của key)
    const rawSignature =
      "accessKey=" +
      accessKey +
      "&amount=" +
      finalAmount +
      "&extraData=" +
      extraData +
      "&ipnUrl=" +
      ipnUrl +
      "&orderId=" +
      orderId +
      "&orderInfo=" +
      orderInfo +
      "&partnerCode=" +
      partnerCode +
      "&redirectUrl=" +
      redirectUrl +
      "&requestId=" +
      requestId +
      "&requestType=" +
      requestType;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount: finalAmount.toString(),
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      partnerName: "Test",
      storeId: "MomoTestStore",
      extraData,
      requestType,
      signature,
      lang: "vi",
    };

    console.log("-> Đang gửi sang Momo...");
    const result = await axios.post(
      "https://test-payment.momo.vn/v2/gateway/api/create",
      requestBody
    );

    console.log("-> Momo Trả về:", result.data);

    return res.status(200).json({
      payUrl: result.data.payUrl,
      qrCodeUrl: result.data.qrCodeUrl,
      invoiceId: newInvoice._id,
    });
  } catch (error) {
    console.error("❌ LỖI CONTROLLER:");

    // Check lỗi Axios (Momo trả về 400/500)
    if (error.response) {
      console.error("Momo Response Data:", error.response.data);
      return res.status(500).json({
        message: "Momo từ chối giao dịch",
        detail:
          error.response.data.message || JSON.stringify(error.response.data),
      });
    }

    // Check lỗi DB Validation
    if (error.name === "ValidationError") {
      console.error("DB Validation Error:", error.message);
      return res
        .status(500)
        .json({ message: "Lỗi lưu đơn hàng", detail: error.message });
    }

    console.error(error);
    res
      .status(500)
      .json({ message: "Lỗi Server nội bộ", detail: error.message });
  }
};

// =============================
// CALLBACK (MOMO GỌI LẠI KHI THANH TOÁN XONG)
// =============================
export const momoCallback = async (req, res) => {
  try {
    console.log("Momo Callback received:", req.body);

    const { orderId, resultCode } = req.body;

    // Tìm đơn hàng dựa trên momoOrderId (hoặc logic bạn lưu ở trên)
    // Lưu ý: Ở bước tạo, ta đã lưu orderId của Momo vào DB
    const invoice = await Invoice.findOne({ momoOrderId: orderId });

    if (invoice) {
      const status = resultCode === 0 ? "PAID" : "CANCELLED";
      invoice.status = status;
      await invoice.save();
      console.log(`Updated Invoice ${invoice._id} to ${status}`);
    }

    // Momo yêu cầu phản hồi 204 hoặc 200
    res.status(204).send();
  } catch (error) {
    console.error("Momo Callback Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// =============================
// THANH TOÁN BANK (GIỮ NGUYÊN)
// =============================
export const createBankPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      recipient_name,
      recipient_phone,
      recipient_address,
      shippingMethod,
    } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) return res.status(400).json({ message: "Cart empty" });

    const shippingCost = shippingMethod === "fast" ? 30000 : 15000;
    const finalAmount = cart.final_total_price + shippingCost;

    const newInvoice = new Invoice({
      user: userId,
      recipient_info: {
        name: recipient_name,
        phone: recipient_phone,
        address: recipient_address,
      },
      items: cart.items.map((i) => ({
        product_id: i.product._id,
        quantity: i.quantity,
        unit_price: i.price_original,
      })),
      payment_method: "BANK_TRANSFER",
      shipping_fee: shippingCost,
      total_amount: finalAmount,
      status: "PENDING",
    });
    await newInvoice.save();

    const BANK_ID = "MB";
    const ACCOUNT_NO = "0333666999";
    const TEMPLATE = "compact";
    const description = `DH${newInvoice._id}`.replace(/[^a-zA-Z0-9]/g, "");

    const qrCodeUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${finalAmount}&addInfo=${description}`;

    res.status(200).json({
      qrCodeUrl,
      invoiceId: newInvoice._id,
      amount: finalAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi tạo mã QR ngân hàng" });
  }
};

export const checkPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ message: "Not found" });
    return res.json({
      status: invoice.status,
      paid: invoice.status === "PAID",
    });
  } catch (error) {
    res.status(500).json({ message: "Error checking status" });
  }
};
