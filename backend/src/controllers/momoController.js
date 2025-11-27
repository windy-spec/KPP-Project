import axios from "axios";
import crypto from "crypto";
import Cart from "../models/Cart.js";
import Invoice from "../models/Invoice.js";

// =============================
// 1. THANH TOÁN MOMO
// =============================
export const createMomoPayment = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Đọc đúng cấu trúc dữ liệu Frontend gửi lên (Fix lỗi "Khách lẻ")
    const { recipient_info, shipping_fee, shippingMethod } = req.body;

    // Fallback an toàn
    const recipientName = recipient_info?.name || req.body.recipient_name;
    const recipientPhone = recipient_info?.phone || req.body.recipient_phone;
    const recipientAddress =
      recipient_info?.address || req.body.recipient_address;
    const recipientNote = recipient_info?.note || req.body.recipient_note || "";

    // 2. Lấy giỏ hàng
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // 3. Tính toán
    const finalShippingFee =
      Number(shipping_fee) || (shippingMethod === "fast" ? 30000 : 15000);
    const finalAmount = cart.final_total_price + finalShippingFee;
    const orderId = "MOMO" + new Date().getTime();

    // 4. Cấu hình MoMo
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const requestId = partnerCode + new Date().getTime();
    const orderInfo = "Thanh toan don hang " + orderId;

    const redirectUrl = `${process.env.BASE_URL}/order-history`;
    const ipnUrl = process.env.SERVER_URL + "/api/payments/momo/callback";
    const requestType = "captureWallet";

    // 5. Gói dữ liệu
    const extraDataObj = {
      userId,
      recipient_info: {
        name: recipientName,
        phone: recipientPhone,
        address: recipientAddress,
        note: recipientNote,
      },
      shipping_fee: finalShippingFee,
    };
    const extraData = Buffer.from(JSON.stringify(extraDataObj)).toString(
      "base64"
    );

    // 6. Chữ ký
    const rawSignature = `accessKey=${accessKey}&amount=${finalAmount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
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
      partnerName: "KPPAINT",
      storeId: "MomoTestStore",
      extraData,
      requestType,
      signature,
      lang: "vi",
    };

    // 7. Gửi request
    const result = await axios.post(
      "https://test-payment.momo.vn/v2/gateway/api/create",
      requestBody,
      { timeout: 10000 }
    );

    return res.status(200).json({
      payUrl: result.data.payUrl,
      qrCodeUrl: result.data.qrCodeUrl,
    });
  } catch (error) {
    console.error("Lỗi tạo Momo:", error?.response?.data || error.message);
    res.status(500).json({ message: "Lỗi tạo thanh toán Momo" });
  }
};

// =============================
// 2. CALLBACK MOMO (Webhook)
// =============================
export const momoCallback = async (req, res) => {
  try {
    const { orderId, resultCode, extraData, amount } = req.body;
    console.log(`📡 MoMo Callback: ${orderId}, Result: ${resultCode}`);

    if (resultCode === 0 && extraData) {
      // Gọi hàm helper xử lý (đã có cơ chế chặn trùng lặp)
      await processSuccessfulMomoPayment(orderId, extraData, amount);
    }
    return res.status(204).json({});
  } catch (error) {
    console.error("Lỗi Callback:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// =============================
// 3. CHECK STATUS (Frontend gọi)
// =============================
export const checkMomoTransactionStatus = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "Thiếu orderId" });

    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const requestId = partnerCode + new Date().getTime();

    const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      orderId,
      signature,
      lang: "vi",
    };

    const result = await axios.post(
      "https://test-payment.momo.vn/v2/gateway/api/query",
      requestBody
    );
    const { resultCode, extraData, amount } = result.data;

    if (resultCode === 0) {
      // 🔥 Gọi hàm xử lý (Hàm này sẽ tự trả về hóa đơn cũ nếu đã có)
      const invoice = await processSuccessfulMomoPayment(
        orderId,
        extraData,
        amount
      );

      // Nếu invoice = null (do race condition) hoặc object, ta query lại lần cuối cho chắc chắn
      const finalInvoice =
        invoice || (await Invoice.findOne({ momoOrderId: orderId }));

      return res.status(200).json({
        message: "Giao dịch thành công",
        invoiceId: finalInvoice?._id,
        status: "PAID",
      });
    }

    return res
      .status(400)
      .json({ message: "Giao dịch thất bại", momoResult: resultCode });
  } catch (error) {
    console.error("Lỗi Check Status:", error?.response?.data || error.message);
    res.status(500).json({ message: "Lỗi kiểm tra trạng thái" });
  }
};

// =============================
// HELPER: HÀM TẠO HÓA ĐƠN CHUNG (CHẶN RACE CONDITION)
// =============================
const processSuccessfulMomoPayment = async (orderId, extraData, amount) => {
  // Check nhanh 1 lần
  const existing = await Invoice.findOne({ momoOrderId: orderId });
  if (existing) return existing;

  try {
    const decodedRaw = Buffer.from(extraData, "base64").toString("utf-8");
    const { userId, recipient_info, shipping_fee } = JSON.parse(decodedRaw);

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    // Nếu cart đã bị xóa (do luồng kia chạy xong rồi), ta return null
    if (!cart) {
      console.log("⚠️ Cart không còn tồn tại (có thể luồng khác đã xử lý).");
      return null;
    }

    if (cart.items.length > 0) {
      const items = cart.items.map((i) => ({
        product_id: i.product._id,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.price_original,
        total_price: i.Total_price || i.quantity * i.price_original,
      }));

      const newInvoice = new Invoice({
        user: userId,
        momoOrderId: orderId, // 🔥 Unique Index sẽ chặn trùng ở đây
        recipient_info,
        items,
        payment_method: "MOMO_QR",
        shipping_fee,
        total_amount: Number(amount),
        status: "PAID",
      });

      await newInvoice.save(); // 🔥 Nếu trùng, MongoDB sẽ throw error code 11000

      await Cart.findOneAndDelete({ user: userId });
      console.log("✅ Hóa đơn MoMo đã tạo:", newInvoice._id);
      return newInvoice;
    }
  } catch (error) {
    // 🔥 BẮT LỖI TRÙNG TỪ MONGODB
    if (error.code === 11000) {
      console.log(
        `⚠️ Race condition chặn thành công: Hóa đơn ${orderId} đã tồn tại.`
      );
      return await Invoice.findOne({ momoOrderId: orderId });
    }
    console.error("🔥 Lỗi tạo hóa đơn:", error);
  }
  return null;
};

// (Giữ lại các hàm khác: createBankPayment, checkPaymentStatus...)
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
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.price_original,
        total_price: i.quantity * i.price_original,
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

    res.json({ qrCodeUrl, invoiceId: newInvoice._id, amount: finalAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi tạo mã QR ngân hàng" });
  }
};

export const checkPaymentStatus = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Not found" });
    res.json({ status: invoice.status, paid: invoice.status === "PAID" });
  } catch (error) {
    res.status(500).json({ message: "Error checking status" });
  }
};
