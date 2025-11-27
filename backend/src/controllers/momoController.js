import axios from "axios";
import crypto from "crypto";
import Cart from "../models/Cart.js";
import Invoice from "../models/Invoice.js";

// =============================
// 1. THANH TOÁN MOMO (SỬA ĐỔI: KHÔNG LƯU DB TRƯỚC)
// =============================
export const createMomoPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      recipient_name,
      recipient_phone,
      recipient_address,
      recipient_note, // Nhận thêm ghi chú nếu có
      shippingMethod,
    } = req.body;

    // 1. Lấy giỏ hàng hiện tại để tính tiền
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // 2. Tính toán số tiền
    const shippingCost = shippingMethod === "fast" ? 30000 : 15000;
    const finalAmount = cart.final_total_price + shippingCost;

    // 3. Tạo OrderID ngẫu nhiên (Chỉ để định danh giao dịch với MoMo, chưa lưu vào Invoice)
    const orderId = "MOMO" + new Date().getTime();

    // 4. Cấu hình MoMo
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const requestId = partnerCode + new Date().getTime();
    const orderInfo = "Thanh toan don hang " + orderId;

    // Redirect URL: Chuyển hướng người dùng về trang Lịch sử đơn hàng sau khi thanh toán xong
    // (Vì lúc này mới bắt đầu tạo đơn, chưa có ID đơn hàng cụ thể để redirect)
    const redirectUrl = `${process.env.BASE_URL}/order-history`;

    // IPN URL: API Backend để MoMo gọi báo kết quả (Cần public ra internet hoặc dùng ngrok)
    const ipnUrl = process.env.SERVER_URL + "/momo/callback";
    const requestType = "captureWallet";

    // 5. 🔥 QUAN TRỌNG: Đóng gói thông tin giao hàng vào extraData
    // Để khi MoMo gọi lại callback, ta có đủ thông tin để tạo Hóa đơn
    const extraDataObj = {
      userId,
      recipient_info: {
        name: recipient_name,
        phone: recipient_phone,
        address: recipient_address,
        note: recipient_note || "",
      },
      shipping_fee: shippingCost,
      shipping_method: shippingMethod,
    };
    // Mã hóa sang Base64
    const extraData = Buffer.from(JSON.stringify(extraDataObj)).toString(
      "base64"
    );

    // 6. Tạo chữ ký (Signature)
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
      partnerName: "KPPAINT Store",
      storeId: "MomoTestStore",
      extraData, // Gửi gói dữ liệu đi
      requestType,
      signature,
      lang: "vi",
    };

    // 7. Gọi sang MoMo
    const result = await axios.post(
      "https://test-payment.momo.vn/v2/gateway/api/create",
      requestBody,
      { timeout: 10000 }
    );

    // Trả về link thanh toán cho Frontend
    return res.status(200).json({
      payUrl: result.data.payUrl,
      qrCodeUrl: result.data.qrCodeUrl,
    });
  } catch (error) {
    console.error(
      "Lỗi tạo thanh toán Momo:",
      error?.response?.data || error.message
    );
    res
      .status(500)
      .json({ message: "Lỗi tạo thanh toán Momo", detail: error.message });
  }
};

// =============================
// 2. CALLBACK MOMO (NƠI TẠO HÓA ĐƠN THỰC SỰ - DÙNG CHO PRODUCTION)
// =============================
export const momoCallback = async (req, res) => {
  try {
    const { orderId, resultCode, extraData, amount } = req.body;

    console.log(
      `📡 MoMo Callback received for Order ${orderId}. ResultCode: ${resultCode}`
    );

    // resultCode = 0 là THÀNH CÔNG
    if (resultCode === 0 && extraData) {
      // Gọi hàm helper để xử lý tạo đơn (tránh lặp code)
      await processSuccessfulMomoPayment(orderId, extraData, amount);
    } else {
      console.log("❌ Thanh toán Momo thất bại hoặc bị hủy bởi người dùng.");
    }

    // Luôn trả về 200 cho MoMo để họ không gọi lại nhiều lần
    return res.status(204).json({});
  } catch (error) {
    console.error("🔥 Lỗi xử lý MoMo Callback:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// =============================
// 3. [NEW] CHỦ ĐỘNG KIỂM TRA TRẠNG THÁI MOMO (DÙNG CHO LOCALHOST/FAILSAFE)
// =============================
// Frontend sẽ gọi API này khi Redirect về web, kèm theo orderId
export const checkMomoTransactionStatus = async (req, res) => {
  try {
    const { orderId } = req.body; // Lấy orderId từ Frontend gửi lên

    if (!orderId) return res.status(400).json({ message: "Thiếu orderId" });

    // 1. Cấu hình request Query Status sang MoMo
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

    // 2. Gọi API Query của MoMo
    console.log(`🔍 Checking MoMo status for ${orderId}...`);
    const result = await axios.post(
      "https://test-payment.momo.vn/v2/gateway/api/query",
      requestBody
    );

    const { resultCode, extraData, amount } = result.data;

    // 3. Nếu MoMo bảo thành công (resultCode = 0)
    if (resultCode === 0) {
      // Tạo hóa đơn nếu chưa có
      const invoice = await processSuccessfulMomoPayment(
        orderId,
        extraData,
        amount
      );

      if (invoice) {
        return res.status(200).json({
          message: "Giao dịch thành công",
          invoiceId: invoice._id,
          status: "PAID",
        });
      } else {
        // Trường hợp đã có hóa đơn rồi
        const existing = await Invoice.findOne({ momoOrderId: orderId });
        return res.status(200).json({
          message: "Đơn hàng đã tồn tại",
          invoiceId: existing?._id,
          status: "PAID",
        });
      }
    }

    return res.status(400).json({
      message: "Giao dịch chưa hoàn tất hoặc thất bại",
      momoResult: resultCode,
    });
  } catch (error) {
    console.error(
      "Lỗi checkMomoTransactionStatus:",
      error?.response?.data || error.message
    );
    res.status(500).json({ message: "Lỗi kiểm tra trạng thái thanh toán" });
  }
};

// =============================
// HELPER: HÀM TẠO HÓA ĐƠN CHUNG (Tránh lặp code giữa Callback và CheckStatus)
// =============================
const processSuccessfulMomoPayment = async (orderId, extraData, amount) => {
  // 1. Kiểm tra xem hóa đơn đã tồn tại chưa
  const existingInvoice = await Invoice.findOne({ momoOrderId: orderId });
  if (existingInvoice) {
    console.log("⚠️ Hóa đơn đã tồn tại, không tạo lại.");
    return null;
  }

  // 2. Giải mã dữ liệu
  const decodedRaw = Buffer.from(extraData, "base64").toString("utf-8");
  const { userId, recipient_info, shipping_fee } = JSON.parse(decodedRaw);

  // 3. Tìm Giỏ hàng để lấy sản phẩm
  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (cart && cart.items.length > 0) {
    // 4. Map items
    const invoiceItems = cart.items
      .map((item) => {
        if (!item.product) return null;
        return {
          product_id: item.product._id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.price_original,
          total_price: item.Total_price || item.quantity * item.price_original,
          discount: 0,
        };
      })
      .filter((i) => i !== null);

    // 5. Lưu Hóa đơn
    const newInvoice = new Invoice({
      user: userId,
      momoOrderId: orderId,
      recipient_info,
      items: invoiceItems,
      payment_method: "MOMO_QR",
      shipping_fee: shipping_fee,
      total_amount: Number(amount),
      status: "PAID", // ✅ Đã thanh toán
    });

    await newInvoice.save();

    // 6. Xóa giỏ hàng
    await Cart.findOneAndDelete({ user: userId });

    console.log("✅ TẠO HÓA ĐƠN THÀNH CÔNG (MOMO):", newInvoice._id);
    return newInvoice;
  } else {
    console.error(
      "❌ Không tìm thấy giỏ hàng (Có thể User đã xóa hoặc lỗi logic). User:",
      userId
    );
    return null;
  }
};

// =============================
// 4. TẠO QR NGÂN HÀNG
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
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.price_original,
        total_price: i.quantity * i.price_original,
      })),
      payment_method: "BANK_TRANSFER",
      shipping_fee: shippingCost,
      total_amount: finalAmount,
      status: "PENDING", // Chờ chuyển khoản
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

// 5. CHECK TRẠNG THÁI THANH TOÁN (Dành cho Bank Transfer hoặc kiểm tra đơn thuần)
export const checkPaymentStatus = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Not found" });
    res.json({ status: invoice.status, paid: invoice.status === "PAID" });
  } catch (error) {
    res.status(500).json({ message: "Error checking status" });
  }
};
