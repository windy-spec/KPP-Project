import axios from "axios";
import crypto from "crypto";
import Cart from "../models/Cart.js";
import Invoice from "../models/Invoice.js";
import Product from "../models/Product.js";

// =============================
// 1. THANH TOÁN MOMO
// =============================
export const createMomoPayment = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Lấy dữ liệu từ Frontend
    // Frontend có thể gửi note nằm trong recipient_info HOẶC nằm riêng ở ngoài
    const { recipient_info, shipping_fee, shippingMethod, note } = req.body;

    // 2. Xử lý thông tin người nhận + Ghi chú
    const recipientName = recipient_info?.name || req.body.recipient_name;
    const recipientPhone = recipient_info?.phone || req.body.recipient_phone;
    const recipientAddress =
      recipient_info?.address || req.body.recipient_address;

    // 🔥 SỬA: Bắt note từ mọi nguồn có thể
    const recipientNote =
      recipient_info?.note || req.body.recipient_note || note || "";

    // 3. Lấy giỏ hàng
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // 4. Kiểm tra tồn kho
    for (const item of cart.items) {
      if (item.product.quantity < item.quantity) {
        return res
          .status(400)
          .json({ message: `Sản phẩm ${item.product.name} không đủ hàng.` });
      }
    }

    // 5. Tính toán tiền
    const finalShippingFee =
      Number(shipping_fee) || (shippingMethod === "fast" ? 30000 : 15000);
    const finalAmount = cart.final_total_price + finalShippingFee;
    const orderId = "MOMO" + new Date().getTime();

    // 6. Config MoMo
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const requestId = partnerCode + new Date().getTime();
    const orderInfo = "Thanh toan don hang " + orderId;

    const redirectUrl = `${process.env.BASE_URL}/order-history`;
    const ipnUrl = process.env.SERVER_URL + "/api/payments/momo/callback";
    const requestType = "captureWallet";

    // 7. Đóng gói extraData (QUAN TRỌNG: Phải chứa note ở đây)
    const extraDataObj = {
      userId,
      recipient_info: {
        name: recipientName,
        phone: recipientPhone,
        address: recipientAddress,
        note: recipientNote, // 👈 Đảm bảo note đã được đưa vào đây
      },
      shipping_fee: finalShippingFee,
    };

    // Mã hóa extraData base64 để gửi sang MoMo
    const extraData = Buffer.from(JSON.stringify(extraDataObj)).toString(
      "base64"
    );

    // 8. Tạo chữ ký (Signature)
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
      const invoice = await processSuccessfulMomoPayment(
        orderId,
        extraData,
        amount
      );
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
// HELPER: HÀM TẠO HÓA ĐƠN VÀ TRỪ KHO
// =============================
const processSuccessfulMomoPayment = async (orderId, extraData, amount) => {
  const existing = await Invoice.findOne({ momoOrderId: orderId });
  if (existing) return existing;

  try {
    const decodedRaw = Buffer.from(extraData, "base64").toString("utf-8");
    // Vì ở bước createMomoPayment ta đã đóng gói note vào recipient_info rồi
    // Nên khi parse ra ở đây, recipient_info sẽ tự động có note.
    const { userId, recipient_info, shipping_fee } = JSON.parse(decodedRaw);

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

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
        momoOrderId: orderId,
        recipient_info, // ✅ Đã chứa note
        items,
        payment_method: "MOMO_QR",
        shipping_fee,
        total_amount: Number(amount),
        status: "PAID",
      });

      await newInvoice.save();

      // TRỪ KHO (Giữ nguyên logic đúng của bạn)
      const bulkOps = items.map((item) => ({
        updateOne: {
          filter: { _id: item.product_id },
          update: {
            $inc: { quantity: -item.quantity, sold: +item.quantity },
          },
        },
      }));

      await Product.bulkWrite(bulkOps);
      console.log(`✅ Đã trừ kho cho đơn MoMo: ${orderId}`);

      await Cart.findOneAndDelete({ user: userId });
      console.log("✅ Hóa đơn MoMo đã tạo:", newInvoice._id);
      return newInvoice;
    }
  } catch (error) {
    if (error.code === 11000) {
      console.log(
        `⚠️ Race condition chặn thành công: Hóa đơn ${orderId} đã tồn tại.`
      );
      return await Invoice.findOne({ momoOrderId: orderId });
    }
    console.error("🔥 Lỗi tạo hóa đơn MoMo:", error);
  }
  return null;
};

// =============================
// 4. CHUYỂN KHOẢN NGÂN HÀNG (Sửa thêm Note)
// =============================
export const createBankPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    // Lấy thêm note từ req.body
    const {
      recipient_name,
      recipient_phone,
      recipient_address,
      note, // 👈 Lấy note
      recipient_note, // Hoặc lấy ở đây
      shippingMethod,
    } = req.body;

    const finalNote = note || recipient_note || "";

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) return res.status(400).json({ message: "Cart empty" });

    // Check tồn kho
    for (const item of cart.items) {
      if (item.product.quantity < item.quantity) {
        return res
          .status(400)
          .json({ message: `Sản phẩm ${item.product.name} không đủ hàng.` });
      }
    }

    const shippingCost = shippingMethod === "fast" ? 30000 : 15000;
    const finalAmount = cart.final_total_price + shippingCost;

    const newInvoice = new Invoice({
      user: userId,
      recipient_info: {
        name: recipient_name,
        phone: recipient_phone,
        address: recipient_address,
        note: finalNote, // 👈 🔥 LƯU NOTE VÀO DB
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

    // 🚨 Với Bank Transfer (Pending), có thể bạn chưa muốn trừ kho ngay,
    // hoặc trừ ngay tùy logic. Nếu muốn trừ ngay thì thêm bulkWrite ở đây.

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
