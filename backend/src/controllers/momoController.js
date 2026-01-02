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

    // 1. Lấy dữ liệu
    const {
      recipient_info,
      shipping_fee,
      shippingMethod,
      note,
      items,
      isDirectBuy,
    } = req.body;

    const recipientName = recipient_info?.name || req.body.recipient_name;
    const recipientPhone = recipient_info?.phone || req.body.recipient_phone;
    const recipientAddress =
      recipient_info?.address || req.body.recipient_address;
    const recipientNote =
      recipient_info?.note || req.body.recipient_note || note || "";

    let checkoutItems = [];
    let totalProductPrice = 0;

    //  QUAN TRỌNG: Chỉ coi là Mua Ngay nếu có cờ isDirectBuy = true
    let finalIsDirectBuy = isDirectBuy === true;

    // --- PHÂN LOẠI XỬ LÝ ---
    if (finalIsDirectBuy && items && items.length > 0) {
      // A. MUA NGAY (Direct Buy) -> Dùng items từ Frontend
      console.log(" [MOMO] MUA NGAY (Direct Buy)");

      for (const item of items) {
        const product = await Product.findById(
          item.product_id || item.product._id
        );
        if (!product)
          return res.status(404).json({ message: "Sản phẩm không tồn tại" });

        const price =
          Number(item.price) || product.final_price || product.price;
        checkoutItems.push({
          product_id: product._id,
          product_name: product.name,
          quantity: item.quantity,
          price_original: product.price,
          unit_price: price,
          Total_price: price * item.quantity,
        });
        totalProductPrice += price * item.quantity;
      }
    } else {
      // B. THANH TOÁN GIỎ HÀNG (Cart Checkout) -> Lấy từ DB Cart cho an toàn
      // Dù Frontend có gửi items lên thì ta vẫn ưu tiên lấy từ DB để đảm bảo tính nhất quán
      console.log(" [MOMO] THANH TOÁN GIỎ HÀNG");
      finalIsDirectBuy = false; // Chắc chắn cờ là false để tí nữa xóa giỏ

      const cart = await Cart.findOne({ user: userId }).populate(
        "items.product"
      );
      if (!cart || !cart.items.length) {
        return res.status(400).json({ message: "Giỏ hàng trống" });
      }

      // Check tồn kho
      for (const item of cart.items) {
        if (item.product.quantity < item.quantity) {
          return res
            .status(400)
            .json({ message: `Sản phẩm ${item.product.name} không đủ hàng.` });
        }
      }
      checkoutItems = cart.items.map((i) => ({
        product_id: i.product._id,
        product_name: i.product.name,
        quantity: i.quantity,
        price_original: i.price_original,
        unit_price: i.price_discount || i.price_original,
        Total_price: i.Total_price,
      }));
      totalProductPrice = cart.final_total_price;
    }

    // 5. Tính toán tiền
    const finalShippingFee =
      Number(shipping_fee) || (shippingMethod === "fast" ? 30000 : 15000);
    const finalAmount = totalProductPrice + finalShippingFee;
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

    // 7. Gói dữ liệu vào ExtraData
    const itemsMinified = checkoutItems.map((i) => ({
      id: i.product_id,
      qty: i.quantity,
      price: i.unit_price,
    }));
    const extraDataObj = {
      userId,
      isDirectBuy: finalIsDirectBuy, // Gửi cờ chuẩn
      recipient_info: {
        name: recipientName,
        phone: recipientPhone,
        address: recipientAddress,
        note: recipientNote,
      },
      shipping_fee: finalShippingFee,
      items: itemsMinified,
    };
    const extraData = Buffer.from(JSON.stringify(extraDataObj)).toString(
      "base64"
    );

    // 8. Chữ ký
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

    return res
      .status(200)
      .json({ payUrl: result.data.payUrl, qrCodeUrl: result.data.qrCodeUrl });
  } catch (error) {
    console.error("Lỗi tạo Momo:", error?.response?.data || error.message);
    res.status(500).json({ message: "Lỗi tạo thanh toán Momo" });
  }
};

// =============================
// 2. CALLBACK MOMO
// =============================
export const momoCallback = async (req, res) => {
  try {
    const { orderId, resultCode, extraData, amount } = req.body;
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
// 3. CHECK STATUS
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
      return res
        .status(200)
        .json({
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
// HELPER: XỬ LÝ THÀNH CÔNG
// =============================
const processSuccessfulMomoPayment = async (orderId, extraData, amount) => {
  const existing = await Invoice.findOne({ momoOrderId: orderId });
  if (existing) {
    if (existing.payment_status !== "PAID") {
      existing.payment_status = "PAID";
      existing.status = "PLACED";
      existing.order_status = "PLACED";
      await existing.save();
    }
    return existing;
  }

  try {
    const decodedRaw = Buffer.from(extraData, "base64").toString("utf-8");
    const {
      userId,
      recipient_info,
      shipping_fee,
      isDirectBuy,
      items: itemsMinified,
    } = JSON.parse(decodedRaw);

    let finalItems = [];

    // Tái tạo items
    if (itemsMinified && itemsMinified.length > 0) {
      for (const mItem of itemsMinified) {
        const product = await Product.findById(mItem.id);
        if (product) {
          const price = mItem.price || product.final_price || product.price;
          finalItems.push({
            product_id: product._id,
            product_name: product.name,
            quantity: mItem.qty,
            unit_price: price,
            total_price: price * mItem.qty,
          });
        }
      }
    } else {
      // Fallback
      const cart = await Cart.findOne({ user: userId }).populate(
        "items.product"
      );
      if (cart && cart.items.length > 0) {
        finalItems = cart.items.map((i) => ({
          product_id: i.product._id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: i.price_discount || i.price_original,
          total_price: i.Total_price || i.quantity * i.price_original,
        }));
      }
    }

    if (finalItems.length > 0) {
      const newInvoice = new Invoice({
        user: userId,
        momoOrderId: orderId,
        recipient_info,
        items: finalItems,
        payment_method: "MOMO_QR",
        shipping_fee,
        total_amount: Number(amount),
        status: "PLACED",
        order_status: "PLACED",
        payment_status: "PAID",
      });

      await newInvoice.save();

      const bulkOps = finalItems.map((item) => ({
        updateOne: {
          filter: { _id: item.product_id },
          update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
        },
      }));
      await Product.bulkWrite(bulkOps);

      //  CHỈ XÓA GIỎ HÀNG KHI KHÔNG PHẢI MUA NGAY 
      if (!isDirectBuy) {
        await Cart.findOneAndDelete({ user: userId });
        console.log(" Đã xóa giỏ hàng (Cart Checkout).");
      } else {
        console.log(" Giữ nguyên giỏ hàng (Direct Buy).");
      }

      return newInvoice;
    }
  } catch (error) {
    if (error.code === 11000) {
      const racewin = await Invoice.findOne({ momoOrderId: orderId });
      if (racewin && racewin.payment_status !== "PAID") {
        racewin.payment_status = "PAID";
        await racewin.save();
      }
      return racewin;
    }
    console.error(" Lỗi tạo hóa đơn MoMo:", error);
  }
  return null;
};

// =============================
// 4. CHUYỂN KHOẢN NGÂN HÀNG (Giữ nguyên)
// =============================
export const createBankPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      recipient_name,
      recipient_phone,
      recipient_address,
      note,
      recipient_note,
      shippingMethod,
    } = req.body;

    const finalNote = note || recipient_note || "";

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) return res.status(400).json({ message: "Cart empty" });

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
        note: finalNote,
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
