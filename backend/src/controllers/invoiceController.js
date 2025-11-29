import Invoice from "../models/Invoice.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// 1. TẠO HÓA ĐƠN VÀ TRỪ TỒN KHO
export const createInvoice = async (req, res) => {
  try {
    const {
      recipient_info,
      note, // 👈 1. Lấy note nếu Frontend gửi riêng ở ngoài
      items,
      payment_method,
      shipping_fee,
      total_amount,
      momoOrderId,
    } = req.body;

    // ------------------------------------------
    // 🔥 BƯỚC QUAN TRỌNG: GỘP GHI CHÚ VÀO INFO
    // ------------------------------------------
    const finalRecipientInfo = {
      ...recipient_info,
      // Ưu tiên note trong recipient_info, nếu không có thì lấy note ở ngoài
      note: recipient_info?.note || note || "",
    };

    // ... (Đoạn check tồn kho giữ nguyên) ...
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product)
        return res.status(404).json({ message: "SP không tồn tại" });
      if (product.quantity < item.quantity)
        return res.status(400).json({ message: `Hết hàng: ${product.name}` });
    }

    const invoice = await Invoice.create({
      user: req.user._id,
      recipient_info: finalRecipientInfo, // 👈 2. Dùng biến đã gộp note
      items,
      payment_method: payment_method || "COD",
      shipping_fee: shipping_fee || 0,
      total_amount,
      momoOrderId: momoOrderId || undefined,
    });

    // ... (Đoạn trừ kho và xóa giỏ hàng giữ nguyên) ...
    if (invoice) {
      const bulkOps = items.map((item) => ({
        updateOne: {
          filter: { _id: item.product_id },
          update: { $inc: { quantity: -item.quantity } },
        },
      }));
      await Product.bulkWrite(bulkOps);
    }
    await Cart.findOneAndDelete({ user: req.user._id });

    res.status(201).json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi tạo đơn" });
  }
};

// ... (Các hàm getMyInvoices, getAllInvoices... giữ nguyên như cũ)
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

    res.status(200).json({
      invoices,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy hóa đơn của bạn" });
  }
};

export const getAllInvoices = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find()
        .populate("user", "name email")
        .populate("items.product_id", "name price")
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
    res.status(500).json({ message: "Lỗi server khi lấy toàn bộ hóa đơn" });
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const invoice = await Invoice.findById(id);
    if (!invoice)
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });

    invoice.status = status;
    await invoice.save();

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

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
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xem hóa đơn này" });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", detail: error.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    let invoices;

    if (req.user.role === "admin") {
      invoices = await Invoice.find()
        .sort({ createdAt: -1 })
        .populate("user", "name email phone")
        .populate("items.product_id", "name price avatar");
    } else {
      invoices = await Invoice.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .populate("items.product_id", "name price avatar");
    }

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Hóa đơn không tồn tại" });
    }
    await Invoice.findByIdAndDelete(id);
    return res.status(200).json({ message: "Đã xóa hóa đơn thành công" });
  } catch (error) {
    console.error("Lỗi xóa hóa đơn:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xóa hóa đơn" });
  }
};
