import axios from "axios";
import crypto from "crypto";
import Cart from "../models/Cart.js";
import Invoice from "../models/Invoice.js";

// =============================
// 1. THANH TOÁN MOMO (SANDBOX)
// =============================
export const createMomoPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      recipient_name,
      recipient_phone,
      recipient_address,
      shippingMethod,
    } = req.body;

    // Lấy cart
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // Tính tiền
    const shippingCost = shippingMethod === "fast" ? 30000 : 15000;
    const finalAmount = cart.final_total_price + shippingCost;

    // Tạo Invoice items
    const invoiceItems = cart.items
      .map((item) => {
        if (!item.product) return null;
        return {
          product_id: item.product._id,
          product_name: item.product.name || "Sản phẩm",
          quantity: item.quantity,
          unit_price: item.price_original,
          total_price: item.Total_price || item.quantity * item.price_original,
        };
      })
      .filter((i) => i !== null);

    // Tạo và lưu Invoice
    const orderId = "MOMO" + new Date().getTime();
    const newInvoice = new Invoice({
      user: userId,
      momoOrderId: orderId,
      recipient_info: {
        name: recipient_name,
        phone: recipient_phone,
        address: recipient_address,
      },
      items: invoiceItems,
      payment_method: "MOMO_QR",
      shipping_fee: shippingCost,
      total_amount: finalAmount,
      status: "PENDING",
    });
    await newInvoice.save();

    // === Chuẩn bị request Momo ===
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const requestId = partnerCode + new Date().getTime();
    const orderInfo = "Thanh toan don hang " + orderId;

    // Redirect URL full path (Frontend)
    const redirectUrl = `${process.env.BASE_URL}/invoice/${newInvoice._id}`;
    // IPN callback (Backend public, dùng ngrok khi dev)
    const ipnUrl = process.env.SERVER_URL + "/momo/callback";

    const requestType = "captureWallet";
    const extraData = "";

    // Tạo chữ ký
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
      partnerName: "Test",
      storeId: "MomoTestStore",
      extraData,
      requestType,
      signature,
      lang: "vi",
    };

    // Gửi request Momo
    const result = await axios.post(
      "https://test-payment.momo.vn/v2/gateway/api/create",
      requestBody,
      { timeout: 10000 }
    );

    return res.status(200).json({
      payUrl: result.data.payUrl,
      qrCodeUrl: result.data.qrCodeUrl,
      invoiceId: newInvoice._id,
    });
  } catch (error) {
    console.error(
      "Lỗi tạo thanh toán Momo:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({ message: "Lỗi tạo thanh toán Momo", detail: error.message });
  }
};

// Callback MoMo
export const momoCallback = async (req, res) => {
  try {
    const { orderId, resultCode } = req.body;
    const invoice = await Invoice.findOne({ momoOrderId: orderId });
    if (invoice) {
      invoice.status = resultCode === 0 ? "PAID" : "CANCELLED";
      await invoice.save();
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// Tạo QR ngân hàng
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

// Check trạng thái thanh toán
export const checkPaymentStatus = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Not found" });
    res.json({ status: invoice.status, paid: invoice.status === "PAID" });
  } catch (error) {
    res.status(500).json({ message: "Error checking status" });
  }
};
