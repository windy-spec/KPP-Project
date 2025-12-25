import Invoice from "../models/Invoice.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// 1. TẠO HÓA ĐƠN
// src/controllers/invoiceController.js

export const createInvoice = async (req, res) => {
  try {
    const {
      recipient_info,
      note,
      items,
      payment_method,
      shipping_fee,
      momoOrderId,
      isDirectBuy,
    } = req.body;

    let calculatedTotal = 0;
    const finalItems = [];

    // ✅ BƯỚC QUAN TRỌNG: Duyệt qua từng item để lấy giá gốc và tính total_price
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product)
        return res
          .status(404)
          .json({ message: `Sản phẩm ${item.product_id} không tồn tại` });

      const itemPrice = product.price;
      const itemTotal = itemPrice * item.quantity;

      finalItems.push({
        product_id: product._id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: itemPrice, // Lưu giá tại thời điểm mua
        total_price: itemTotal, // ✅ Dashboard sẽ sum trường này
      });

      calculatedTotal += itemTotal;
    }

    const finalShippingFee = shipping_fee || 0;

    const invoice = await Invoice.create({
      user: req.user._id,
      recipient_info: {
        ...recipient_info,
        note: recipient_info?.note || note || "",
      },
      items: finalItems, // Sử dụng mảng đã được Backend tính toán
      payment_method: payment_method || "COD",
      shipping_fee: finalShippingFee,
      total_amount: calculatedTotal + finalShippingFee, // Tự tính tổng tiền cuối cùng
      order_status: "PLACED",
      payment_status: "UNPAID",
    });

    // Phần trừ tồn kho (giữ nguyên logic cũ của bạn)
    if (invoice) {
      const bulkOps = finalItems.map((item) => ({
        updateOne: {
          filter: { _id: item.product_id },
          update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
        },
      }));
      await Product.bulkWrite(bulkOps);
    }

    if (!isDirectBuy) await Cart.findOneAndDelete({ user: req.user._id });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo đơn" });
  }
};

// 2. LẤY HÓA ĐƠN CỦA TÔI
export const getMyInvoices = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find({ user: req.user._id })
        .populate("user", "name email")
        .populate("items.product_id", "name price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Invoice.countDocuments({ user: req.user._id }),
    ]);

    res
      .status(200)
      .json({ invoices, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 3. ADMIN LẤY TẤT CẢ
// src/controllers/invoiceController.js
export const getAllInvoices = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find()
        .populate("user", "name email")
        // ✅ Bắt buộc phải populate product_id để lấy tên hiển thị ở phần bán chạy/chi tiết
        .populate("items.product_id", "name price avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(),
    ]);

    res.status(200).json({
      invoices,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 4. CHI TIẾT ĐƠN HÀNG
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("items.product_id", "name price avatar");

    if (!invoice)
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });

    if (
      req.user.role !== "admin" &&
      invoice.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Không có quyền xem" });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", detail: error.message });
  }
};

// 5. 🔥 UPDATE INVOICE (XỬ LÝ THANH TOÁN KHI HOÀN THÀNH)
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, order_status, payment_status } = req.body;
    const newStatus = status || order_status;
    const userId = req.user._id;
    const userRole = req.user.role;

    const invoice = await Invoice.findById(id);
    if (!invoice)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    // --- LOGIC ADMIN ---
    if (userRole === "admin") {
      if (newStatus) {
        invoice.order_status = newStatus;
        if (newStatus === "SHIPPING" && !invoice.shipped_at) {
          invoice.shipped_at = new Date();
        }
        if (newStatus === "PREPARING") {
          invoice.shipped_at = null;
        }
      }
      if (payment_status) {
        invoice.payment_status = payment_status;
      }
    }

    // --- LOGIC USER (KHÁCH HÀNG) ---
    else {
      if (invoice.user.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Không có quyền sửa đơn này" });
      }

      if (newStatus === "COMPLETED") {
        if (invoice.order_status !== "SHIPPING") {
          // Sửa check status -> order_status
          return res
            .status(400)
            .json({ message: "Đơn hàng chưa được giao đi" });
        }
        invoice.order_status = "COMPLETED";
        // 🔥 LOGIC BẠN YÊU CẦU: Giao xong -> Auto update thành ĐÃ THANH TOÁN
        if (invoice.payment_status !== "PAID") {
          invoice.payment_status = "PAID";
        }
      } else {
        return res
          .status(400)
          .json({ message: "Chỉ được phép xác nhận đã nhận hàng" });
      }
    }

    await invoice.save();
    res.status(200).json({ message: "Cập nhật thành công", invoice });
  } catch (error) {
    console.error("Lỗi updateInvoice:", error);
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

// 6. XÓA ĐƠN
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    await Invoice.findByIdAndDelete(id);
    return res.status(200).json({ message: "Đã xóa hóa đơn thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống khi xóa hóa đơn" });
  }
};
